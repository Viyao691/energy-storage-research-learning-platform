from __future__ import annotations

import asyncio
import hashlib
import inspect
import ipaddress
import json
import math
import multiprocessing
import os
import socket
import ssl
import stat
import tempfile
from collections.abc import Awaitable, Callable, Iterable
from dataclasses import dataclass
from pathlib import Path
from typing import Any, TypeAlias
from urllib.parse import SplitResult, urljoin, urlsplit, urlunsplit

import fitz
import httpcore
import httpx

from app.services.paper_orphans import (
    OrphanLifecycleError,
    acquire_download_lease,
    discard_download_claim,
    hash_lock,
    release_download_lease,
    retain_download_as_orphan,
)


ResolverResult: TypeAlias = Iterable[str | tuple[Any, ...]]
DnsResolver: TypeAlias = Callable[[str], ResolverResult | Awaitable[ResolverResult]]
IpAddress: TypeAlias = ipaddress.IPv4Address | ipaddress.IPv6Address
PeerAddress: TypeAlias = str | tuple[Any, ...] | IpAddress | None

_PDF_CONTENT_TYPES = frozenset({"application/pdf", "application/x-pdf"})
_REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})
_MAX_REDIRECTS = 3
_MAX_TIMEOUT_SECONDS = 600
_MAX_SIZE_MB = 1000
_MAX_PDF_PAGES = 1000
_MAX_EXTRACTED_CHARS = 5_000_000
_CLOSE_TIMEOUT_SECONDS = 0.1
_PUBLISH_LOCK_WAIT_SECONDS = 2.0
_PUBLIC_DNS_URL = "https://cloudflare-dns.com/dns-query"
_PUBLIC_DNS_TIMEOUT_SECONDS = 5.0
_MAX_PUBLIC_DNS_RESPONSE_BYTES = 64 * 1024


class PaperDownloadError(Exception):
    """A safe, user-facing download failure that never includes request details."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)

    def __repr__(self) -> str:
        return (
            f"{type(self).__name__}(code={self.code!r}, "
            f"message={self.message!r})"
        )


@dataclass(frozen=True, slots=True)
class DownloadedPdf:
    final_path: Path
    sha256: str
    file_size: int
    page_count: int
    extracted_text: str
    parse_confidence: float
    extraction_warning: str | None
    fulltext_status: str
    lease_id: str | None = None

    @property
    def path(self) -> Path:
        return self.final_path


async def _query_public_dns(host: str) -> list[str]:
    """Resolve a hostname through a fixed TLS-protected public DNS endpoint."""

    async def query(record_type: str, expected_type: int) -> list[str]:
        chunks: list[bytes] = []
        total = 0
        try:
            async with client.stream(
                "GET",
                _PUBLIC_DNS_URL,
                params={"name": host, "type": record_type},
                headers={"accept": "application/dns-json"},
            ) as response:
                if response.status_code != 200:
                    return []
                content_length = response.headers.get("content-length", "")
                if (
                    content_length.isdigit()
                    and int(content_length) > _MAX_PUBLIC_DNS_RESPONSE_BYTES
                ):
                    return []
                async for chunk in response.aiter_bytes():
                    total += len(chunk)
                    if total > _MAX_PUBLIC_DNS_RESPONSE_BYTES:
                        return []
                    chunks.append(chunk)
        except (httpx.HTTPError, OSError, RuntimeError):
            return []

        try:
            payload = json.loads(b"".join(chunks))
        except (UnicodeError, ValueError):
            return []
        if not isinstance(payload, dict) or payload.get("Status") != 0:
            return []
        answer_items = payload.get("Answer")
        if not isinstance(answer_items, list):
            return []
        addresses: list[str] = []
        for item in answer_items:
            if not isinstance(item, dict) or item.get("type") != expected_type:
                continue
            value = item.get("data")
            if not isinstance(value, str):
                continue
            try:
                address = _normalize_address(ipaddress.ip_address(value))
            except ValueError:
                continue
            if (
                record_type == "A"
                and isinstance(address, ipaddress.IPv4Address)
            ) or (
                record_type == "AAAA"
                and isinstance(address, ipaddress.IPv6Address)
            ):
                addresses.append(str(address))
        return addresses

    timeout = httpx.Timeout(_PUBLIC_DNS_TIMEOUT_SECONDS)
    limits = httpx.Limits(max_connections=2, max_keepalive_connections=0)
    async with httpx.AsyncClient(
        timeout=timeout,
        limits=limits,
        follow_redirects=False,
        trust_env=False,
    ) as client:
        results = await asyncio.gather(
            query("A", 1),
            query("AAAA", 28),
            return_exceptions=True,
        )
    addresses: list[str] = []
    for result in results:
        if isinstance(result, list):
            addresses.extend(result)
    return list(dict.fromkeys(addresses))


async def _default_dns_resolver(host: str) -> ResolverResult:
    """Use system DNS when public; recover from Docker synthetic DNS safely."""

    system_answers: list[tuple[Any, ...]] = []
    try:
        system_answers = list(
            await asyncio.to_thread(
                socket.getaddrinfo,
                host,
                None,
                socket.AF_UNSPEC,
                socket.SOCK_STREAM,
            )
        )
    except (OSError, RuntimeError):
        pass

    parsed_addresses: list[IpAddress] = []
    for item in system_answers:
        raw_address = _address_from_resolver_item(item)
        if raw_address is None:
            parsed_addresses = []
            break
        try:
            parsed_addresses.append(
                _normalize_address(ipaddress.ip_address(raw_address))
            )
        except ValueError:
            parsed_addresses = []
            break
    if parsed_addresses and all(
        not _is_unsafe_address(address) for address in parsed_addresses
    ):
        return system_answers
    return await _query_public_dns(host)


def _network_stream_peer(network_stream: object) -> PeerAddress:
    get_extra_info = getattr(network_stream, "get_extra_info", None)
    if not callable(get_extra_info):
        return None

    server_address = None
    try:
        server_address = get_extra_info("server_addr")
    except Exception:
        pass
    if server_address is not None:
        return server_address

    raw_socket = None
    try:
        raw_socket = get_extra_info("socket")
    except Exception:
        pass
    get_peer_name = getattr(raw_socket, "getpeername", None)
    if not callable(get_peer_name):
        return None
    try:
        return get_peer_name()
    except Exception:
        return None


def _error(code: str, message: str) -> PaperDownloadError:
    return PaperDownloadError(code, message)


def _validate_limits(timeout_seconds: object, max_size_mb: object) -> tuple[float, int]:
    if (
        isinstance(timeout_seconds, bool)
        or not isinstance(timeout_seconds, (int, float))
        or not math.isfinite(timeout_seconds)
        or not 0 < timeout_seconds <= _MAX_TIMEOUT_SECONDS
    ):
        raise _error("invalid_limits", "PDF 下载超时时间参数无效")
    if (
        isinstance(max_size_mb, bool)
        or not isinstance(max_size_mb, (int, float))
        or not math.isfinite(max_size_mb)
        or not 0 < max_size_mb <= _MAX_SIZE_MB
    ):
        raise _error("invalid_limits", "PDF 下载大小限制参数无效")
    max_bytes = int(float(max_size_mb) * 1024 * 1024)
    if max_bytes < 1:
        raise _error("invalid_limits", "PDF 下载大小限制参数无效")
    return float(timeout_seconds), max_bytes


def _parsed_url(url: object, *, malformed_code: str) -> SplitResult:
    if not isinstance(url, str) or not url.strip():
        raise _error(malformed_code, "PDF 下载地址无效")
    invalid = False
    parsed: SplitResult | None = None
    host: str | None = None
    port: int | None = None
    username: str | None = None
    password: str | None = None
    try:
        parsed = urlsplit(url.strip())
        host = parsed.hostname
        port = parsed.port
        username = parsed.username
        password = parsed.password
    except (TypeError, ValueError, UnicodeError):
        invalid = True
    if invalid or parsed is None:
        raise _error(malformed_code, "PDF 下载地址无效")
    if parsed.scheme.lower() != "https":
        raise _error("invalid_url", "PDF 下载仅允许使用 HTTPS 地址")
    if not host:
        raise _error(malformed_code, "PDF 下载地址缺少主机名")
    if username is not None or password is not None or "@" in parsed.netloc:
        raise _error("invalid_url", "PDF 下载地址不得包含身份凭据")
    if port is not None and not 1 <= port <= 65535:
        raise _error(malformed_code, "PDF 下载地址端口无效")
    return parsed


def _normalize_host(host: str, *, malformed_code: str) -> str:
    host = host.rstrip(".").lower()
    if not host:
        raise _error(malformed_code, "PDF 下载地址缺少主机名")
    normalized: str | None = None
    try:
        normalized = host.encode("idna").decode("ascii").lower()
    except (UnicodeError, ValueError):
        pass
    if normalized is None:
        raise _error(malformed_code, "PDF 下载地址主机名无效")
    return normalized


def _normalize_address(address: IpAddress) -> IpAddress:
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped is not None:
        return address.ipv4_mapped
    return address


def _is_unsafe_address(address: IpAddress) -> bool:
    return (
        not address.is_global
        or address.is_loopback
        or address.is_private
        or address.is_link_local
        or address.is_multicast
        or address.is_reserved
        or address.is_unspecified
    )


def _canonical_url(url: object, *, malformed_code: str) -> tuple[str, str, str | None]:
    parsed = _parsed_url(url, malformed_code=malformed_code)
    assert parsed.hostname is not None
    host = _normalize_host(parsed.hostname, malformed_code=malformed_code)
    if host == "localhost" or host.endswith(".localhost"):
        raise _error("unsafe_target", "PDF 下载地址指向不安全的网络位置")

    literal: str | None = None
    try:
        address = _normalize_address(ipaddress.ip_address(host))
    except ValueError:
        pass
    else:
        if _is_unsafe_address(address):
            raise _error("unsafe_target", "PDF 下载地址指向不安全的网络位置")
        literal = str(address)
        host = literal

    port = parsed.port
    rendered_host = f"[{host}]" if ":" in host else host
    netloc = rendered_host
    if port is not None and port != 443:
        netloc = f"{rendered_host}:{port}"
    canonical = urlunsplit(
        (
            "https",
            netloc,
            parsed.path or "/",
            parsed.query,
            "",
        )
    )
    return canonical, host, literal


def _address_from_resolver_item(item: object) -> str | None:
    if isinstance(item, str):
        return item
    if (
        isinstance(item, tuple)
        and len(item) >= 5
        and isinstance(item[4], tuple)
        and item[4]
        and isinstance(item[4][0], str)
    ):
        return item[4][0]
    return None


async def _resolve_and_validate(
    host: str,
    resolver: DnsResolver,
) -> frozenset[IpAddress]:
    failure = False
    answers: ResolverResult | None = None
    try:
        resolver_call = getattr(resolver, "__call__", None)
        if inspect.iscoroutinefunction(resolver) or inspect.iscoroutinefunction(
            resolver_call
        ):
            candidate = resolver(host)
        else:
            candidate = await asyncio.to_thread(resolver, host)
        answers = await candidate if inspect.isawaitable(candidate) else candidate
    except Exception:
        failure = True
    if failure:
        raise _error("dns_failed", "无法验证 PDF 下载地址")

    parsed_addresses: list[IpAddress] = []
    try:
        for item in answers or ():
            raw_address = _address_from_resolver_item(item)
            if raw_address is None:
                raise ValueError
            parsed_addresses.append(
                _normalize_address(ipaddress.ip_address(raw_address))
            )
    except Exception:
        failure = True
    if failure or not parsed_addresses:
        raise _error("dns_failed", "无法验证 PDF 下载地址")
    if any(_is_unsafe_address(address) for address in parsed_addresses):
        raise _error("unsafe_target", "PDF 下载地址指向不安全的网络位置")
    return frozenset(parsed_addresses)


def _address_from_peer_value(value: PeerAddress) -> IpAddress | None:
    raw_address: object = value
    if isinstance(value, tuple):
        raw_address = value[0] if value else None
    if isinstance(raw_address, (ipaddress.IPv4Address, ipaddress.IPv6Address)):
        return _normalize_address(raw_address)
    if not isinstance(raw_address, str):
        return None
    try:
        return _normalize_address(ipaddress.ip_address(raw_address))
    except ValueError:
        return None


class PinnedNetworkBackend(httpcore.AsyncNetworkBackend):
    """Resolve, pin, connect, and verify one TCP peer before TLS or HTTP."""

    def __init__(
        self,
        resolver: DnsResolver,
        backend: httpcore.AsyncNetworkBackend | None = None,
        deadline: float | None = None,
    ) -> None:
        self._resolver = resolver
        self._backend = backend or httpcore.AnyIOBackend()
        self._deadline = deadline

    async def connect_tcp(
        self,
        host: str,
        port: int,
        timeout: float | None = None,
        local_address: str | None = None,
        socket_options=None,
    ) -> httpcore.AsyncNetworkStream:
        if local_address is not None:
            raise _error(
                "unsupported_transport",
                "PDF 下载不允许指定本地网络地址",
            )

        normalized_host = _normalize_host(host, malformed_code="invalid_url")
        try:
            literal_address = _normalize_address(
                ipaddress.ip_address(normalized_host)
            )
        except ValueError:
            literal_address = None
        if literal_address is None:
            allowed_addresses = await _resolve_and_validate(
                normalized_host,
                self._resolver,
            )
        else:
            if _is_unsafe_address(literal_address):
                raise _error(
                    "unsafe_target",
                    "PDF 下载地址指向不安全的网络位置",
                )
            allowed_addresses = frozenset({literal_address})

        candidate_addresses = sorted(
            allowed_addresses,
            key=lambda address: (address.version, int(address)),
        )
        last_peer_error: PaperDownloadError | None = None
        connection_failed = False
        for index, selected_address in enumerate(candidate_addresses):
            attempt_timeout = timeout
            if self._deadline is not None:
                remaining = self._deadline - asyncio.get_running_loop().time()
                if remaining <= 0:
                    raise _error("download_timeout", "PDF 下载超时")
                attempts_left = len(candidate_addresses) - index
                fair_share = remaining / attempts_left
                attempt_timeout = (
                    fair_share
                    if attempt_timeout is None
                    else min(attempt_timeout, fair_share)
                )
            try:
                stream = await self._backend.connect_tcp(
                    str(selected_address),
                    port,
                    timeout=attempt_timeout,
                    local_address=None,
                    socket_options=socket_options,
                )
            except (
                OSError,
                httpcore.NetworkError,
                httpcore.TimeoutException,
            ):
                connection_failed = True
                continue

            peer_address = _address_from_peer_value(_network_stream_peer(stream))
            peer_error: PaperDownloadError | None = None
            if peer_address is None:
                peer_error = _error(
                    "peer_unavailable",
                    "无法验证 PDF 下载连接地址",
                )
            elif _is_unsafe_address(peer_address):
                peer_error = _error(
                    "unsafe_peer",
                    "PDF 下载连接指向不安全的网络位置",
                )
            elif peer_address != selected_address:
                peer_error = _error(
                    "peer_mismatch",
                    "PDF 下载连接地址与固定地址不一致",
                )
            if peer_error is None:
                return stream
            last_peer_error = peer_error
            close_failed = False
            try:
                await stream.aclose()
            except (OSError, httpcore.NetworkError):
                close_failed = True
            if close_failed:
                raise _error(
                    "network_cleanup",
                    "PDF 下载连接清理失败",
                )

        if last_peer_error is not None:
            raise last_peer_error
        if connection_failed:
            raise _error(
                "connect_failed",
                "无法连接 PDF 下载地址",
            )
        raise _error("connect_failed", "无法连接 PDF 下载地址")

    async def connect_unix_socket(
        self,
        path: str,
        timeout: float | None = None,
        socket_options=None,
    ) -> httpcore.AsyncNetworkStream:
        raise _error(
            "unsupported_transport",
            "PDF 下载不允许使用 Unix 套接字",
        )


class _CoreResponseStream(httpx.AsyncByteStream):
    def __init__(self, stream: Any) -> None:
        self._stream = stream

    async def __aiter__(self):
        async for chunk in self._stream:
            yield chunk

    async def aclose(self) -> None:
        close = getattr(self._stream, "aclose", None)
        if callable(close):
            await close()


class _PinnedTransport(httpx.AsyncBaseTransport):
    def __init__(self, pool: httpcore.AsyncConnectionPool) -> None:
        self._pool = pool

    async def handle_async_request(
        self,
        request: httpx.Request,
    ) -> httpx.Response:
        response = await self._pool.handle_async_request(
            httpcore.Request(
                method=request.method,
                url=httpcore.URL(
                    scheme=request.url.raw_scheme,
                    host=request.url.raw_host,
                    port=request.url.port,
                    target=request.url.raw_path,
                ),
                headers=request.headers.raw,
                content=request.stream,
                extensions=request.extensions,
            )
        )
        return httpx.Response(
            status_code=response.status,
            headers=response.headers,
            stream=_CoreResponseStream(response.stream),
            extensions=response.extensions,
        )

    async def aclose(self) -> None:
        await self._pool.aclose()


def _content_length(response: httpx.Response, max_bytes: int) -> None:
    raw_length = response.headers.get("Content-Length")
    if raw_length is None:
        return
    invalid = False
    content_length = 0
    try:
        content_length = int(raw_length)
    except (TypeError, ValueError):
        invalid = True
    if invalid or content_length < 0:
        raise _error("invalid_response", "PDF 下载响应信息无效")
    if content_length > max_bytes:
        raise _error("too_large", "PDF 文件超过允许的大小")


def _validate_content_type(response: httpx.Response) -> None:
    content_type = response.headers.get("Content-Type", "")
    media_type = content_type.split(";", 1)[0].strip().lower()
    if media_type not in _PDF_CONTENT_TYPES:
        raise _error("invalid_content_type", "下载响应不是 PDF 文件")


def _write_file_chunk(file_object: Any, chunk: bytes) -> None:
    file_object.write(chunk)


def _flush_and_fsync(file_object: Any) -> None:
    file_object.flush()
    os.fsync(file_object.fileno())


async def _stream_to_temp(
    response: httpx.Response,
    destination_dir: Path,
    max_bytes: int,
) -> tuple[Path, str, int]:
    temporary = None
    try:
        temporary = tempfile.NamedTemporaryFile(
            mode="wb",
            prefix=".paper-",
            suffix=".tmp",
            dir=destination_dir,
            delete=False,
        )
    except OSError:
        pass
    if temporary is None:
        raise _error("storage_error", "无法创建 PDF 临时文件")

    temporary_path = Path(temporary.name)
    digest = hashlib.sha256()
    file_size = 0
    prefix = bytearray()
    failure: BaseException | None = None
    result: tuple[Path, str, int] | None = None
    try:
        with temporary:
            async for chunk in response.aiter_bytes():
                if not chunk:
                    continue
                file_size += len(chunk)
                if file_size > max_bytes:
                    raise _error("too_large", "PDF 文件超过允许的大小")
                if len(prefix) < 5:
                    prefix.extend(chunk[: 5 - len(prefix)])
                    if len(prefix) == 5 and bytes(prefix) != b"%PDF-":
                        raise _error("invalid_pdf", "下载内容不是有效的 PDF 文件")
                digest.update(chunk)
                write_failed = False
                try:
                    await asyncio.to_thread(
                        _write_file_chunk,
                        temporary,
                        chunk,
                    )
                except OSError:
                    write_failed = True
                if write_failed:
                    raise _error("storage_error", "无法写入 PDF 临时文件")
            flush_failed = False
            try:
                await asyncio.to_thread(_flush_and_fsync, temporary)
            except OSError:
                flush_failed = True
            if flush_failed:
                raise _error("storage_error", "无法保存 PDF 临时文件")
        if bytes(prefix) != b"%PDF-":
            raise _error("invalid_pdf", "下载内容不是有效的 PDF 文件")
        result = (temporary_path, digest.hexdigest(), file_size)
    except BaseException as exc:
        failure = exc
    if failure is not None:
        close_failed = False
        try:
            temporary.close()
        except OSError:
            close_failed = True
        unlink_failed = False
        try:
            temporary_path.unlink(missing_ok=True)
        except OSError:
            unlink_failed = True
        if close_failed or unlink_failed:
            raise _error("storage_cleanup", "PDF 临时文件清理失败")
        raise failure
    assert result is not None
    return result


def _extract_pdf_worker(
    path: str,
    sender: Any,
    max_pages: int,
    max_chars: int,
) -> None:
    document: fitz.Document | None = None
    try:
        document = fitz.open(path)
        if document.needs_pass:
            sender.send(("invalid",))
            return
        page_count = len(document)
        if page_count > max_pages:
            sender.send(("resource_limit",))
            return
        texts: list[str] = []
        total_chars = 0
        for page in document:
            text = page.get_text("text")
            total_chars += len(text)
            if total_chars > max_chars:
                sender.send(("resource_limit",))
                return
            texts.append(text)
        sender.send(("ok", "\n".join(texts).strip(), page_count))
    except Exception:
        try:
            sender.send(("invalid",))
        except Exception:
            pass
    finally:
        if document is not None:
            try:
                document.close()
            except Exception:
                pass
        try:
            sender.close()
        except Exception:
            pass


def _terminate_process(process: multiprocessing.Process) -> None:
    try:
        alive = process.is_alive()
    except Exception:
        return
    if alive:
        try:
            process.terminate()
        except Exception:
            pass
        try:
            process.join(timeout=0.2)
        except Exception:
            pass
    try:
        alive = process.is_alive()
    except Exception:
        return
    if alive:
        try:
            process.kill()
        except Exception:
            pass
        try:
            process.join(timeout=0.2)
        except Exception:
            pass


async def _extract_pdf_in_process(
    path: Path,
) -> tuple[str, int, float, str | None, str]:
    context = multiprocessing.get_context("spawn")
    receiver, sender = context.Pipe(duplex=False)
    process = context.Process(
        target=_extract_pdf_worker,
        args=(
            str(path),
            sender,
            _MAX_PDF_PAGES,
            _MAX_EXTRACTED_CHARS,
        ),
        daemon=True,
    )
    start_failed = False
    try:
        process.start()
    except (OSError, RuntimeError):
        start_failed = True
    sender.close()
    if start_failed:
        receiver.close()
        raise _error("invalid_pdf", "PDF 解析进程无法启动")

    payload: tuple[Any, ...] | None = None
    receive_failed = False
    try:
        while process.is_alive():
            if receiver.poll():
                try:
                    payload = receiver.recv()
                except (EOFError, OSError):
                    receive_failed = True
                break
            await asyncio.sleep(0.01)
        if payload is None and receiver.poll():
            try:
                payload = receiver.recv()
            except (EOFError, OSError):
                receive_failed = True
    finally:
        receiver.close()
        _terminate_process(process)

    if receive_failed or not payload or payload[0] == "invalid":
        raise _error("invalid_pdf", "PDF 无法读取，可能已损坏或受保护")
    if payload[0] == "resource_limit":
        raise _error("pdf_resource_limit", "PDF 页数或可提取文本超过安全限制")
    if payload[0] != "ok" or len(payload) != 3:
        raise _error("invalid_pdf", "PDF 无法读取，可能已损坏或受保护")

    extracted = payload[1]
    page_count = payload[2]
    chars_per_page = len(extracted) / max(page_count, 1)
    confidence = round(min(1.0, chars_per_page / 900), 2)
    warning = None
    if not extracted:
        warning = (
            "未提取到可搜索文本，可能是扫描版 PDF；"
            "建议使用高清可检索版本。"
        )
        fulltext_status = "仅元数据或摘要"
    elif confidence < 0.35:
        warning = (
            "文本提取质量较低，部分结论可能不可靠；"
            "建议核对原始 PDF 页面。"
        )
        fulltext_status = "全文解析质量低"
    else:
        fulltext_status = "已读取全文"
    return extracted, page_count, confidence, warning, fulltext_status


def _hash_existing(path: Path) -> str | None:
    try:
        path_stat = path.lstat()
        if path.is_symlink() or not stat.S_ISREG(path_stat.st_mode):
            return None
        digest = hashlib.sha256()
        with path.open("rb") as existing:
            for chunk in iter(lambda: existing.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()
    except OSError:
        return None


def _hash_file_worker(path: str, sender: Any) -> None:
    try:
        sender.send(("ok", _hash_existing(Path(path))))
    except Exception:
        try:
            sender.send(("failed", None))
        except Exception:
            pass
    finally:
        try:
            sender.close()
        except Exception:
            pass


async def _hash_existing_in_process(path: Path) -> str | None:
    receiver: Any | None = None
    sender: Any | None = None
    process: multiprocessing.Process | None = None
    try:
        context = multiprocessing.get_context("spawn")
        receiver, sender = context.Pipe(duplex=False)
        process = context.Process(
            target=_hash_file_worker,
            args=(str(path), sender),
            daemon=True,
        )
    except Exception:
        for pipe_end in (sender, receiver):
            if pipe_end is not None:
                try:
                    pipe_end.close()
                except Exception:
                    pass
        raise _error(
            "storage_error",
            "无法安全校验现有 PDF 文件",
        ) from None

    started = False
    start_failed = False
    try:
        process.start()
        started = True
    except Exception:
        start_failed = True
    try:
        sender.close()
    except Exception:
        start_failed = True
    if start_failed:
        try:
            receiver.close()
        except Exception:
            pass
        if started:
            _terminate_process(process)
        raise _error(
            "storage_error",
            "无法安全校验现有 PDF 文件",
        ) from None

    payload: tuple[str, str | None] | None = None
    receive_failed = False
    try:
        while True:
            try:
                alive = process.is_alive()
            except Exception:
                receive_failed = True
                break
            if not alive:
                break
            try:
                ready = receiver.poll()
            except Exception:
                receive_failed = True
                break
            if ready:
                try:
                    payload = receiver.recv()
                except Exception:
                    receive_failed = True
                break
            await asyncio.sleep(0.01)
        if payload is None and not receive_failed:
            try:
                if receiver.poll():
                    payload = receiver.recv()
                else:
                    receive_failed = True
            except Exception:
                receive_failed = True
    finally:
        try:
            receiver.close()
        except Exception:
            pass
        _terminate_process(process)

    if (
        receive_failed
        or not isinstance(payload, tuple)
        or len(payload) != 2
        or payload[0] != "ok"
        or (payload[1] is not None and not isinstance(payload[1], str))
    ):
        raise _error(
            "storage_error",
            "无法安全校验现有 PDF 文件",
        )
    return payload[1]


def _unlink_temp(path: Path) -> None:
    failed = False
    try:
        path.unlink(missing_ok=True)
    except OSError:
        failed = True
    if failed:
        raise _error("storage_cleanup", "PDF 临时文件清理失败")


async def _deduplicate_existing(
    temporary_path: Path,
    final_path: Path,
    digest: str,
) -> bool:
    existing_hash = await _hash_existing_in_process(final_path)
    if existing_hash == digest:
        _unlink_temp(temporary_path)
        return True
    if existing_hash is not None or final_path.exists() or final_path.is_symlink():
        raise _error(
            "destination_conflict",
            "PDF 目标文件已存在且内容不一致",
        )
    return False


async def _publish_temp(
    temporary_path: Path,
    final_path: Path,
    digest: str,
) -> None:
    publish_result = "created"
    try:
        os.link(temporary_path, final_path)
    except FileExistsError:
        publish_result = "exists"
    except OSError:
        publish_result = "failed"
    if publish_result == "exists":
        await _deduplicate_existing(temporary_path, final_path, digest)
        return
    if publish_result == "created":
        _unlink_temp(temporary_path)
        return

    try:
        # Publishing, orphan cleanup, and database adoption share one
        # token-owned per-hash lock. Token verification prevents an old
        # publisher from deleting a successor's lock after stale takeover.
        lock_deadline = (
            asyncio.get_running_loop().time()
            + _PUBLISH_LOCK_WAIT_SECONDS
        )
        while True:
            with hash_lock(final_path.parent, digest, wait=False) as lock:
                if lock is None:
                    pass
                else:
                    if final_path.exists() or final_path.is_symlink():
                        if await _deduplicate_existing(
                            temporary_path,
                            final_path,
                            digest,
                        ):
                            return
                    rename_result = "created"
                    try:
                        os.rename(temporary_path, final_path)
                    except FileExistsError:
                        rename_result = "exists"
                    except OSError:
                        rename_result = "failed"
                    if rename_result == "exists":
                        await _deduplicate_existing(
                            temporary_path,
                            final_path,
                            digest,
                        )
                        return
                    if rename_result == "failed":
                        raise _error("storage_error", "无法原子发布 PDF 文件")
                    return
            if asyncio.get_running_loop().time() >= lock_deadline:
                raise _error("storage_error", "PDF 发布锁暂时不可用")
            await asyncio.sleep(0.01)
    except OrphanLifecycleError:
        raise _error("storage_error", "无法建立 PDF 发布生命周期锁") from None


async def _download_pdf_with_client(
    url: str,
    destination_dir: str | Path,
    client: httpx.AsyncClient,
    *,
    timeout_seconds: int | float,
    max_size_mb: int | float,
    dns_resolver: DnsResolver = _default_dns_resolver,
    preflight_dns: bool = True,
) -> DownloadedPdf:
    timeout, max_bytes = _validate_limits(timeout_seconds, max_size_mb)
    if not isinstance(client, httpx.AsyncClient):
        raise _error("invalid_client", "PDF 下载客户端无效")
    invalid_destination = False
    try:
        destination = Path(destination_dir)
        destination.mkdir(parents=True, exist_ok=True)
        if not destination.is_dir():
            raise OSError
    except Exception:
        invalid_destination = True
        destination = Path(".")
    if invalid_destination:
        raise _error("storage_error", "PDF 存储目录无效")

    current: object = url
    malformed_code = "invalid_url"
    seen: set[str] = set()
    redirect_count = 0
    temporary_path: Path | None = None

    try:
        while True:
            canonical, host, literal = _canonical_url(
                current,
                malformed_code=malformed_code,
            )
            if canonical in seen:
                raise _error("redirect_loop", "PDF 下载发生重定向循环")
            seen.add(canonical)
            if preflight_dns and literal is None:
                await _resolve_and_validate(host, dns_resolver)

            request_failure: str | None = None
            request_result: tuple[str, object] | None = None
            try:
                async with client.stream(
                    "GET",
                    canonical,
                    timeout=timeout,
                    follow_redirects=False,
                ) as response:
                    if response.status_code in _REDIRECT_STATUSES:
                        if redirect_count >= _MAX_REDIRECTS:
                            raise _error(
                                "too_many_redirects",
                                "PDF 下载重定向次数过多",
                            )
                        location = response.headers.get("Location")
                        if not location or not location.strip():
                            raise _error(
                                "invalid_redirect",
                                "PDF 下载重定向地址无效",
                            )
                        invalid_redirect = False
                        next_url = ""
                        try:
                            next_url = urljoin(canonical, location.strip())
                        except (TypeError, ValueError):
                            invalid_redirect = True
                        if invalid_redirect:
                            raise _error(
                                "invalid_redirect",
                                "PDF 下载重定向地址无效",
                            )
                        request_result = ("redirect", next_url)
                    elif 300 <= response.status_code < 400:
                        raise _error(
                            "invalid_redirect",
                            "PDF 下载重定向响应无效",
                        )
                    elif not 200 <= response.status_code < 300:
                        raise _error(
                            "download_failed",
                            "PDF 下载服务返回失败状态",
                        )
                    else:
                        _validate_content_type(response)
                        _content_length(response, max_bytes)
                        temporary_path, digest, file_size = await _stream_to_temp(
                            response,
                            destination,
                            max_bytes,
                        )
                        request_result = (
                            "download",
                            (temporary_path, digest, file_size),
                        )
            except PaperDownloadError:
                raise
            except (httpx.TimeoutException, httpcore.TimeoutException):
                request_failure = "timeout"
            except (
                httpx.HTTPError,
                httpcore.NetworkError,
                httpcore.ProtocolError,
                OSError,
            ):
                request_failure = "network"

            if request_failure == "timeout":
                raise _error("download_timeout", "PDF 下载超时")
            if request_failure:
                raise _error("download_failed", "PDF 下载失败")
            assert request_result is not None
            if request_result[0] == "redirect":
                current = request_result[1]
                malformed_code = "invalid_redirect"
                redirect_count += 1
                continue
            temporary_path, digest, file_size = request_result[1]  # type: ignore[misc]
            break

        (
            extracted_text,
            page_count,
            parse_confidence,
            extraction_warning,
            fulltext_status,
        ) = await _extract_pdf_in_process(temporary_path)
        final_path = destination / f"{digest}.pdf"
        lease_id: str | None = None
        try:
            lease_id = acquire_download_lease(destination, digest)
            await _publish_temp(temporary_path, final_path, digest)
        except OrphanLifecycleError:
            raise _error(
                "storage_error",
                "无法建立 PDF 内容生命周期租约",
            ) from None
        except asyncio.CancelledError:
            # Marker + lease remain recoverable. Do not synchronously wait for
            # the contended lock after the caller's total deadline expired.
            raise
        except BaseException as exc:
            if lease_id is not None:
                try:
                    if (
                        isinstance(exc, PaperDownloadError)
                        and exc.code == "destination_conflict"
                    ):
                        discard_download_claim(
                            destination,
                            digest,
                            lease_id,
                        )
                    elif final_path.exists() or final_path.is_symlink():
                        retain_download_as_orphan(
                            destination,
                            digest,
                            lease_id,
                        )
                    else:
                        release_download_lease(
                            destination,
                            digest,
                            lease_id,
                        )
                except OrphanLifecycleError:
                    pass
            raise
        temporary_path = None
        return DownloadedPdf(
            final_path=final_path,
            sha256=digest,
            file_size=file_size,
            page_count=page_count,
            extracted_text=extracted_text,
            parse_confidence=parse_confidence,
            extraction_warning=extraction_warning,
            fulltext_status=fulltext_status,
            lease_id=lease_id,
        )
    finally:
        if temporary_path is not None:
            _unlink_temp(temporary_path)


async def download_open_pdf(
    url: str,
    destination_dir: str | Path,
    *,
    timeout_seconds: int | float,
    max_size_mb: int | float,
    dns_resolver: DnsResolver = _default_dns_resolver,
    network_backend: httpcore.AsyncNetworkBackend | None = None,
) -> DownloadedPdf:
    """Download one open PDF through an unconditionally pinned TCP transport."""

    timeout, _ = _validate_limits(timeout_seconds, max_size_mb)
    client: httpx.AsyncClient | None = None
    result: DownloadedPdf | None = None
    timed_out = False
    close_failed = False
    try:
        try:
            async with asyncio.timeout(timeout):
                pinned_backend = PinnedNetworkBackend(
                    dns_resolver,
                    backend=network_backend,
                    deadline=asyncio.get_running_loop().time() + timeout,
                )
                pool = httpcore.AsyncConnectionPool(
                    ssl_context=ssl.create_default_context(),
                    proxy=None,
                    uds=None,
                    retries=0,
                    http1=True,
                    http2=False,
                    network_backend=pinned_backend,
                )
                client = httpx.AsyncClient(
                    transport=_PinnedTransport(pool),
                    follow_redirects=False,
                    trust_env=False,
                )
                result = await _download_pdf_with_client(
                    url,
                    destination_dir,
                    client,
                    timeout_seconds=timeout_seconds,
                    max_size_mb=max_size_mb,
                    dns_resolver=dns_resolver,
                    preflight_dns=False,
                )
        except TimeoutError:
            timed_out = True
    finally:
        if client is not None:
            try:
                async with asyncio.timeout(_CLOSE_TIMEOUT_SECONDS):
                    await client.aclose()
            except (
                TimeoutError,
                OSError,
                RuntimeError,
                httpcore.NetworkError,
                httpx.HTTPError,
            ):
                close_failed = True
    if timed_out:
        if result is not None:
            try:
                retain_download_as_orphan(
                    destination_dir,
                    result.sha256,
                    result.lease_id,
                )
            except OrphanLifecycleError:
                pass
        raise _error("download_timeout", "PDF 下载超时")
    if close_failed:
        if result is not None:
            try:
                retain_download_as_orphan(
                    destination_dir,
                    result.sha256,
                    result.lease_id,
                )
            except OrphanLifecycleError:
                raise _error(
                    "storage_cleanup",
                    "PDF 生命周期状态记录失败",
                ) from None
        raise _error("network_cleanup", "PDF 下载连接清理失败")
    assert result is not None
    return result
