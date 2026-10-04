from __future__ import annotations

import asyncio
import hashlib
import inspect
import json
import os
import sys
from pathlib import Path
import time
from typing import Iterable

import fitz
import httpcore
import httpx
import pytest

import app.services.paper_download as paper_download
from app.services.paper_download import (
    DownloadedPdf,
    PaperDownloadError,
    _MAX_PDF_PAGES,
    _default_dns_resolver,
    _download_pdf_with_client,
    _extract_pdf_in_process,
    _hash_existing_in_process,
    _publish_temp,
    download_open_pdf as _download_open_pdf,
)


def run(coroutine):
    return asyncio.run(coroutine)


def make_pdf(text: str = "Energy storage research " * 80) -> bytes:
    document = fitz.open()
    page = document.new_page()
    if text:
        page.insert_textbox(fitz.Rect(36, 36, 560, 800), text, fontsize=10)
    payload = document.tobytes()
    document.close()
    return payload


def make_protected_pdf() -> bytes:
    document = fitz.open()
    document.new_page()
    payload = document.tobytes(
        encryption=fitz.PDF_ENCRYPT_AES_256,
        owner_pw="owner-password",
        user_pw="user-password",
    )
    document.close()
    return payload


def make_multipage_pdf(page_count: int) -> bytes:
    document = fitz.open()
    for index in range(page_count):
        page = document.new_page()
        page.insert_text((36, 36), f"Page {index}")
    payload = document.tobytes()
    document.close()
    return payload


def public_dns(*_args) -> list[str]:
    return ["93.184.216.34"]


async def async_public_dns(*_args) -> list[str]:
    return [
        "93.184.216.34",
        "2606:2800:220:1:248:1893:25c8:1946",
    ]


def test_default_dns_resolver_falls_back_from_docker_synthetic_address(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        paper_download.socket,
        "getaddrinfo",
        lambda *_args, **_kwargs: [
            (
                paper_download.socket.AF_INET,
                paper_download.socket.SOCK_STREAM,
                6,
                "",
                ("198.18.0.9", 0),
            )
        ],
    )
    doh_calls: list[str] = []

    async def query_public_dns(host: str) -> list[str]:
        doh_calls.append(host)
        return ["151.101.3.42", "151.101.67.42"]

    monkeypatch.setattr(
        paper_download,
        "_query_public_dns",
        query_public_dns,
        raising=False,
    )

    answers = list(run(_default_dns_resolver("arxiv.org")))

    assert answers == ["151.101.3.42", "151.101.67.42"]
    assert doh_calls == ["arxiv.org"]


def test_default_dns_resolver_keeps_safe_system_answers_without_doh(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    system_answer = (
        paper_download.socket.AF_INET,
        paper_download.socket.SOCK_STREAM,
        6,
        "",
        ("93.184.216.34", 0),
    )
    monkeypatch.setattr(
        paper_download.socket,
        "getaddrinfo",
        lambda *_args, **_kwargs: [system_answer],
    )

    async def unexpected_doh(_host: str) -> list[str]:
        raise AssertionError("safe system DNS must not call public DNS")

    monkeypatch.setattr(
        paper_download,
        "_query_public_dns",
        unexpected_doh,
        raising=False,
    )

    assert list(run(_default_dns_resolver("example.com"))) == [system_answer]


async def download_open_pdf(*args, **kwargs):
    return await _download_pdf_with_client(*args, **kwargs)


class ChunkStream(httpx.AsyncByteStream):
    def __init__(self, chunks: Iterable[bytes]) -> None:
        self.chunks = chunks

    async def __aiter__(self):
        for chunk in self.chunks:
            yield chunk


class CancellingStream(httpx.AsyncByteStream):
    async def __aiter__(self):
        yield b"%PDF-"
        raise asyncio.CancelledError()


class FakePinnedStream(httpcore.AsyncNetworkStream):
    def __init__(
        self,
        response_bytes: bytes,
        *,
        peer_ip: str,
        events: list[tuple],
        read_delay: float = 0,
        max_read_size: int | None = None,
        fail_close: bool | str = False,
    ) -> None:
        self.response_bytes = response_bytes
        self.peer_ip = peer_ip
        self.events = events
        self.read_delay = read_delay
        self.max_read_size = max_read_size
        self.fail_close = fail_close

    async def read(self, max_bytes: int, timeout: float | None = None) -> bytes:
        if self.read_delay:
            await asyncio.sleep(self.read_delay)
        if not self.response_bytes:
            self.events.append(("eof",))
            return b""
        if self.max_read_size is not None:
            max_bytes = min(max_bytes, self.max_read_size)
        chunk = self.response_bytes[:max_bytes]
        self.response_bytes = self.response_bytes[max_bytes:]
        if not self.response_bytes:
            self.events.append(("eof",))
        return chunk

    async def write(self, buffer: bytes, timeout: float | None = None) -> None:
        self.events.append(("http_write", bytes(buffer)))

    async def aclose(self) -> None:
        self.events.append(("close",))
        if self.fail_close == "hang":
            await asyncio.Event().wait()
        if self.fail_close:
            raise OSError("secret close failure")

    async def start_tls(
        self,
        ssl_context,
        server_hostname: str | None = None,
        timeout: float | None = None,
    ) -> httpcore.AsyncNetworkStream:
        self.events.append(("tls", server_hostname))
        return self

    def get_extra_info(self, info: str):
        if info == "server_addr":
            return (self.peer_ip, 443)
        if info == "is_readable":
            return False
        return None


class FakePinnedBackend(httpcore.AsyncNetworkBackend):
    def __init__(
        self,
        responses_by_ip: dict[str, bytes],
        *,
        reported_peers: dict[str, str] | None = None,
        connect_failures: set[str] | None = None,
        connect_timeouts: set[str] | None = None,
        stream_options: dict[str, object] | None = None,
    ) -> None:
        self.responses_by_ip = responses_by_ip
        self.reported_peers = reported_peers or {}
        self.connect_failures = connect_failures or set()
        self.connect_timeouts = connect_timeouts or set()
        self.stream_options = stream_options or {}
        self.events: list[tuple] = []
        self.connect_budgets: list[tuple[str, float | None]] = []

    async def connect_tcp(
        self,
        host: str,
        port: int,
        timeout: float | None = None,
        local_address: str | None = None,
        socket_options=None,
    ) -> httpcore.AsyncNetworkStream:
        self.events.append(("connect", host, port))
        self.connect_budgets.append((host, timeout))
        if host in self.connect_timeouts:
            raise httpcore.ConnectTimeout("simulated timeout")
        if host in self.connect_failures:
            raise OSError("simulated connect failure")
        return FakePinnedStream(
            self.responses_by_ip[host],
            peer_ip=self.reported_peers.get(host, host),
            events=self.events,
            **self.stream_options,
        )

    async def connect_unix_socket(
        self,
        path: str,
        timeout: float | None = None,
        socket_options=None,
    ) -> httpcore.AsyncNetworkStream:
        raise AssertionError("Unix sockets must never be used")


def raw_http_response(
    status: int,
    body: bytes = b"",
    *,
    headers: dict[str, str] | None = None,
) -> bytes:
    reason = {200: "OK", 302: "Found"}[status]
    response_headers = {
        "Content-Length": str(len(body)),
        "Connection": "close",
        **(headers or {}),
    }
    rendered_headers = "".join(
        f"{name}: {value}\r\n" for name, value in response_headers.items()
    )
    return (
        f"HTTP/1.1 {status} {reason}\r\n{rendered_headers}\r\n".encode("ascii")
        + body
    )


def assert_safe_error(error: PaperDownloadError, secret: str | None = None) -> None:
    assert error.code
    assert error.message
    assert str(error) == error.message
    assert error.__cause__ is None
    assert error.__context__ is None
    if secret:
        assert secret not in str(error)
        assert secret not in repr(error)


def test_public_api_exposes_no_unpinned_client_or_request_stream_bypass() -> None:
    parameters = inspect.signature(_download_open_pdf).parameters

    assert "client" not in parameters
    assert "request_stream_factory" not in parameters
    assert set(parameters) == {
        "url",
        "destination_dir",
        "timeout_seconds",
        "max_size_mb",
        "dns_resolver",
        "network_backend",
    }


@pytest.mark.parametrize(
    "url",
    [
        "http://papers.example/paper.pdf",
        "ftp://papers.example/paper.pdf",
        "https:///paper.pdf",
        "https://user:secret@papers.example/paper.pdf",
        "https://localhost/paper.pdf",
        "https://LOCALHOST./paper.pdf",
        "https://sub.localhost/paper.pdf",
        "https://127.0.0.1/paper.pdf",
        "https://[::1]/paper.pdf",
        "https://10.2.3.4/paper.pdf",
        "https://169.254.169.254/latest/meta-data",
        "https://224.0.0.1/paper.pdf",
        "https://0.0.0.0/paper.pdf",
    ],
)
def test_rejects_unsafe_urls_before_request(tmp_path: Path, url: str) -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(500)

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    url,
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        assert_safe_error(raised.value)

    run(scenario())
    assert requests == []
    assert list(tmp_path.iterdir()) == []


def test_normalizes_idna_case_and_trailing_dot_for_dns(tmp_path: Path) -> None:
    resolved_hosts: list[str] = []
    pdf = make_pdf()

    def resolver(host: str):
        resolved_hosts.append(host)
        return ["93.184.216.34"]

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf; charset=binary"},
            content=pdf,
        )

    async def scenario() -> DownloadedPdf:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await download_open_pdf(
                "https://BÜCHER.Example./paper.pdf",
                tmp_path,
                client,
                timeout_seconds=5,
                max_size_mb=1,
                dns_resolver=resolver,
            )

    result = run(scenario())
    assert resolved_hosts == ["xn--bcher-kva.example"]
    assert result.final_path.exists()


@pytest.mark.parametrize(
    "answers",
    [
        ["127.0.0.1"],
        ["93.184.216.34", "10.0.0.2"],
        ["2606:2800:220:1:248:1893:25c8:1946", "fe80::1"],
        [],
    ],
)
def test_rejects_any_unsafe_or_empty_dns_answer(
    tmp_path: Path, answers: list[str]
) -> None:
    requests: list[httpx.Request] = []

    async def resolver(_host: str):
        return answers

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(500)

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/download",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=resolver,
                )
        assert_safe_error(raised.value)

    run(scenario())
    assert requests == []


def test_accepts_socket_getaddrinfo_shaped_dns_answers(tmp_path: Path) -> None:
    pdf = make_pdf()

    def resolver(_host: str):
        return [
            (
                2,
                1,
                6,
                "",
                ("93.184.216.34", 443),
            )
        ]

    async def scenario() -> DownloadedPdf:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(
                lambda request: httpx.Response(
                    200,
                    headers={"Content-Type": "application/pdf"},
                    content=pdf,
                )
            )
        ) as client:
            return await download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                client,
                timeout_seconds=5,
                max_size_mb=1,
                dns_resolver=resolver,
            )

    assert run(scenario()).final_path.exists()


def test_dns_failure_is_sanitized(tmp_path: Path) -> None:
    secret = "token=private-download-token"

    def resolver(_host: str):
        raise RuntimeError(f"resolver leaked {secret}")

    async def scenario() -> None:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(lambda request: httpx.Response(500))
        ) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    f"https://papers.example/paper.pdf?{secret}",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=resolver,
                )
        assert raised.value.code == "dns_failed"
        assert_safe_error(raised.value, secret)

    run(scenario())


def test_pinned_backend_connects_to_validated_ip_before_http_and_keeps_origin_sni(
    tmp_path: Path,
) -> None:
    pdf = make_pdf()
    public_ip = "93.184.216.34"
    backend = FakePinnedBackend(
        {
            public_ip: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        }
    )

    async def scenario() -> DownloadedPdf:
        return await _download_open_pdf(
            "https://papers.example/paper.pdf",
            tmp_path,
            timeout_seconds=5,
            max_size_mb=1,
            dns_resolver=public_dns,
            network_backend=backend,
        )

    result = run(scenario())
    assert result.final_path.exists()
    assert backend.events[0] == ("connect", public_ip, 443)
    assert backend.events[1] == ("tls", "papers.example")
    first_write = next(
        index for index, event in enumerate(backend.events) if event[0] == "http_write"
    )
    assert first_write > 1


@pytest.mark.parametrize(
    ("reported_peer", "expected_code"),
    [
        ("127.0.0.1", "unsafe_peer"),
        ("1.1.1.1", "peer_mismatch"),
        ("", "peer_unavailable"),
    ],
)
def test_pinned_backend_rejects_rebinding_before_tls_or_http_bytes(
    tmp_path: Path,
    reported_peer: str,
    expected_code: str,
) -> None:
    pdf = make_pdf()
    public_ip = "93.184.216.34"
    backend = FakePinnedBackend(
        {
            public_ip: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        },
        reported_peers={public_ip: reported_peer},
    )

    async def scenario() -> None:
        with pytest.raises(PaperDownloadError) as raised:
            await _download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                timeout_seconds=5,
                max_size_mb=1,
                dns_resolver=public_dns,
                network_backend=backend,
            )
        assert raised.value.code == expected_code
        assert_safe_error(raised.value)

    run(scenario())
    assert backend.events[0] == ("connect", public_ip, 443)
    assert all(event[0] not in {"tls", "http_write"} for event in backend.events)
    assert list(tmp_path.iterdir()) == []


def test_redirect_pins_each_origin_ip_and_preserves_each_tls_hostname(
    tmp_path: Path,
) -> None:
    pdf = make_pdf()
    origin_ip = "93.184.216.34"
    cdn_ip = "1.1.1.1"
    backend = FakePinnedBackend(
        {
            origin_ip: raw_http_response(
                302,
                headers={"Location": "https://cdn.example/paper.pdf"},
            ),
            cdn_ip: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            ),
        }
    )

    def resolver(host: str):
        return [origin_ip] if host == "papers.example" else [cdn_ip]

    async def scenario() -> DownloadedPdf:
        return await _download_open_pdf(
            "https://papers.example/download",
            tmp_path,
            timeout_seconds=5,
            max_size_mb=1,
            dns_resolver=resolver,
            network_backend=backend,
        )

    assert run(scenario()).final_path.exists()
    assert [event for event in backend.events if event[0] == "connect"] == [
        ("connect", origin_ip, 443),
        ("connect", cdn_ip, 443),
    ]
    assert [event for event in backend.events if event[0] == "tls"] == [
        ("tls", "papers.example"),
        ("tls", "cdn.example"),
    ]


def test_public_overall_deadline_bounds_stalled_sync_dns_and_keeps_loop_responsive(
    tmp_path: Path,
) -> None:
    loop_ticked = False

    def stalled_resolver(_host: str):
        time.sleep(0.3)
        return ["93.184.216.34"]

    async def ticker() -> None:
        nonlocal loop_ticked
        await asyncio.sleep(0.02)
        loop_ticked = True

    async def scenario() -> PaperDownloadError:
        backend = FakePinnedBackend({})
        tick_task = asyncio.create_task(ticker())
        started = asyncio.get_running_loop().time()
        with pytest.raises(PaperDownloadError) as raised:
            await asyncio.wait_for(
                _download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    timeout_seconds=0.05,
                    max_size_mb=1,
                    dns_resolver=stalled_resolver,
                    network_backend=backend,
                ),
                timeout=0.5,
            )
        elapsed = asyncio.get_running_loop().time() - started
        await tick_task
        assert elapsed < 0.2
        return raised.value

    error = run(scenario())
    assert error.code == "download_timeout"
    assert_safe_error(error)
    assert loop_ticked is True


def test_public_overall_deadline_stops_slow_drip_and_cleans_temp(
    tmp_path: Path,
) -> None:
    pdf = make_pdf()
    public_ip = "93.184.216.34"
    backend = FakePinnedBackend(
        {
            public_ip: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        },
        stream_options={"read_delay": 0.03, "max_read_size": 16},
    )

    async def scenario() -> PaperDownloadError:
        with pytest.raises(PaperDownloadError) as raised:
            await asyncio.wait_for(
                _download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    timeout_seconds=0.12,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                    network_backend=backend,
                ),
                timeout=0.6,
            )
        return raised.value

    error = run(scenario())
    assert error.code == "download_timeout"
    assert_safe_error(error)
    assert any(event[0] == "close" for event in backend.events)
    assert list(tmp_path.iterdir()) == []


def test_public_cancellation_closes_pinned_stream_and_cleans_up(
    tmp_path: Path,
) -> None:
    pdf = make_pdf()
    public_ip = "93.184.216.34"
    backend = FakePinnedBackend(
        {
            public_ip: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        },
        stream_options={"read_delay": 0.2, "max_read_size": 16},
    )

    async def scenario() -> None:
        task = asyncio.create_task(
            _download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                timeout_seconds=2,
                max_size_mb=1,
                dns_resolver=public_dns,
                network_backend=backend,
            )
        )
        while not any(event[0] == "connect" for event in backend.events):
            await asyncio.sleep(0)
        await asyncio.sleep(0.02)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    run(scenario())
    assert any(event[0] == "close" for event in backend.events)
    assert list(tmp_path.iterdir()) == []


@pytest.mark.xfail(
    sys.platform == "win32",
    reason="Windows asyncio scheduling granularity can yield only 1 tick inside the 0.01s timeout window (Linux/Docker reaches 2+). Not a product regression.",
)
def test_parser_process_keeps_event_loop_responsive_and_is_killed_on_deadline(
    tmp_path: Path,
) -> None:
    pdf_path = tmp_path / "many-pages.pdf"
    pdf_path.write_bytes(make_multipage_pdf(300))
    ticks = 0

    async def ticker(stop: asyncio.Event) -> None:
        nonlocal ticks
        while not stop.is_set():
            ticks += 1
            await asyncio.sleep(0.002)

    async def scenario() -> None:
        stop = asyncio.Event()
        tick_task = asyncio.create_task(ticker(stop))
        with pytest.raises(TimeoutError):
            async with asyncio.timeout(0.01):
                await _extract_pdf_in_process(pdf_path)
        stop.set()
        await tick_task

    started = time.monotonic()
    run(scenario())
    assert time.monotonic() - started < 0.5
    assert ticks >= 2


def test_public_rejects_pdf_over_page_resource_cap(tmp_path: Path) -> None:
    pdf = make_multipage_pdf(_MAX_PDF_PAGES + 1)
    public_ip = "93.184.216.34"
    backend = FakePinnedBackend(
        {
            public_ip: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        }
    )

    async def scenario() -> PaperDownloadError:
        with pytest.raises(PaperDownloadError) as raised:
            await _download_open_pdf(
                "https://papers.example/large.pdf",
                tmp_path,
                timeout_seconds=3,
                max_size_mb=5,
                dns_resolver=public_dns,
                network_backend=backend,
            )
        return raised.value

    error = run(scenario())
    assert error.code == "pdf_resource_limit"
    assert_safe_error(error)
    assert list(tmp_path.iterdir()) == []


def test_pinned_backend_falls_back_from_ipv4_to_ipv6(tmp_path: Path) -> None:
    pdf = make_pdf()
    ipv4 = "93.184.216.34"
    ipv6 = "2606:2800:220:1:248:1893:25c8:1946"
    backend = FakePinnedBackend(
        {
            ipv6: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        },
        connect_failures={ipv4},
    )

    async def scenario() -> DownloadedPdf:
        return await _download_open_pdf(
            "https://papers.example/paper.pdf",
            tmp_path,
            timeout_seconds=3,
            max_size_mb=1,
            dns_resolver=lambda host: [ipv6, ipv4],
            network_backend=backend,
        )

    assert run(scenario()).final_path.exists()
    assert [event for event in backend.events if event[0] == "connect"] == [
        ("connect", ipv4, 443),
        ("connect", ipv6, 443),
    ]
    assert ("tls", "papers.example") in backend.events


def test_pinned_backend_bounds_connect_timeout_and_falls_back(
    tmp_path: Path,
) -> None:
    pdf = make_pdf()
    ipv4 = "93.184.216.34"
    ipv6 = "2606:2800:220:1:248:1893:25c8:1946"
    backend = FakePinnedBackend(
        {
            ipv6: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        },
        connect_timeouts={ipv4},
    )

    async def scenario() -> DownloadedPdf:
        return await _download_open_pdf(
            "https://papers.example/paper.pdf",
            tmp_path,
            timeout_seconds=3,
            max_size_mb=1,
            dns_resolver=lambda host: [ipv4, ipv6],
            network_backend=backend,
        )

    assert run(scenario()).final_path.exists()
    assert backend.connect_budgets[0][0] == ipv4
    assert 0 < backend.connect_budgets[0][1] <= 1.5
    assert backend.connect_budgets[1][0] == ipv6
    assert backend.connect_budgets[1][1] > 0


def test_public_truncated_response_fails_and_cleans_up(tmp_path: Path) -> None:
    public_ip = "93.184.216.34"
    response = (
        b"HTTP/1.1 200 OK\r\n"
        b"Content-Type: application/pdf\r\n"
        b"Content-Length: 100\r\n"
        b"Connection: close\r\n\r\n"
        b"%PDF-short"
    )
    backend = FakePinnedBackend({public_ip: response})

    async def scenario() -> PaperDownloadError:
        with pytest.raises(PaperDownloadError) as raised:
            await _download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                timeout_seconds=1,
                max_size_mb=1,
                dns_resolver=public_dns,
                network_backend=backend,
            )
        return raised.value

    assert_safe_error(run(scenario()))
    assert list(tmp_path.iterdir()) == []


def test_public_chunked_response_downloads_pdf(tmp_path: Path) -> None:
    pdf = make_pdf()
    chunks = [pdf[:7], pdf[7:101], pdf[101:]]
    chunked_body = b"".join(
        f"{len(chunk):X}\r\n".encode("ascii") + chunk + b"\r\n"
        for chunk in chunks
    ) + b"0\r\n\r\n"
    response = (
        b"HTTP/1.1 200 OK\r\n"
        b"Content-Type: application/pdf\r\n"
        b"Transfer-Encoding: chunked\r\n"
        b"Connection: close\r\n\r\n"
        + chunked_body
    )
    backend = FakePinnedBackend({"93.184.216.34": response})

    async def scenario() -> DownloadedPdf:
        return await _download_open_pdf(
            "https://papers.example/paper.pdf",
            tmp_path,
            timeout_seconds=3,
            max_size_mb=1,
            dns_resolver=public_dns,
            network_backend=backend,
        )

    result = run(scenario())
    assert result.final_path.read_bytes() == pdf


def test_public_surfaces_pool_close_failure_safely(tmp_path: Path) -> None:
    pdf = make_pdf()
    public_ip = "93.184.216.34"
    backend = FakePinnedBackend(
        {
            public_ip: raw_http_response(
                200,
                pdf,
                headers={
                    "Content-Type": "application/pdf",
                    "Connection": "keep-alive",
                },
            )
        },
        stream_options={"fail_close": True},
    )

    async def scenario() -> PaperDownloadError:
        with pytest.raises(PaperDownloadError) as raised:
            await _download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                # Process startup can approach one second on a loaded
                # Docker Desktop VM; this test targets cleanup classification.
                timeout_seconds=3,
                max_size_mb=1,
                dns_resolver=public_dns,
                network_backend=backend,
            )
        return raised.value

    error = run(scenario())
    assert error.code == "network_cleanup"
    assert_safe_error(error)


def test_public_bounds_hanging_pool_close(tmp_path: Path) -> None:
    pdf = make_pdf()
    public_ip = "93.184.216.34"
    backend = FakePinnedBackend(
        {
            public_ip: raw_http_response(
                200,
                pdf,
                headers={
                    "Content-Type": "application/pdf",
                    "Connection": "keep-alive",
                },
            )
        },
        stream_options={"read_delay": 0, "fail_close": "hang"},
    )

    async def scenario() -> PaperDownloadError:
        with pytest.raises(PaperDownloadError) as raised:
            await _download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                timeout_seconds=4,
                max_size_mb=1,
                dns_resolver=public_dns,
                network_backend=backend,
            )
        return raised.value

    started = time.monotonic()
    error = run(asyncio.wait_for(scenario(), timeout=3.75))
    assert time.monotonic() - started < 3.5
    assert error.code == "network_cleanup"
    assert_safe_error(error)


def test_concurrent_public_downloads_deduplicate_same_hash(tmp_path: Path) -> None:
    pdf = make_pdf()
    public_ip = "93.184.216.34"
    backend = FakePinnedBackend(
        {
            public_ip: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        }
    )

    async def one_download() -> DownloadedPdf:
        return await _download_open_pdf(
            "https://papers.example/paper.pdf",
            tmp_path,
            timeout_seconds=5,
            max_size_mb=1,
            dns_resolver=public_dns,
            network_backend=backend,
        )

    async def scenario() -> tuple[DownloadedPdf, DownloadedPdf]:
        first, second = await asyncio.gather(one_download(), one_download())
        return first, second

    first, second = run(scenario())
    assert first.final_path == second.final_path
    assert first.final_path.read_bytes() == pdf
    assert list(tmp_path.glob("*.pdf")) == [first.final_path]
    assert list(tmp_path.glob("*.tmp")) == []


def test_forced_no_link_concurrent_publication_is_serialized_and_atomic(
    tmp_path: Path,
    monkeypatch,
) -> None:
    pdf = make_pdf()
    public_ip = "93.184.216.34"
    backend = FakePinnedBackend(
        {
            public_ip: raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        }
    )
    monkeypatch.setattr(
        os,
        "link",
        lambda source, target: (_ for _ in ()).throw(OSError()),
    )

    async def one_download() -> DownloadedPdf:
        return await _download_open_pdf(
            "https://papers.example/paper.pdf",
            tmp_path,
            timeout_seconds=6,
            max_size_mb=1,
            dns_resolver=public_dns,
            network_backend=backend,
        )

    async def scenario() -> tuple[DownloadedPdf, DownloadedPdf]:
        first, second = await asyncio.gather(one_download(), one_download())
        return first, second

    first, second = run(scenario())
    assert first.final_path == second.final_path
    assert first.final_path.read_bytes() == pdf
    assert list(tmp_path.glob("*.lock")) == []
    assert list(tmp_path.glob("*.tmp")) == []


def test_forced_no_link_reader_never_observes_partial_final_file(
    tmp_path: Path,
    monkeypatch,
) -> None:
    pdf = make_pdf() + (b"x" * (256 * 1024))
    digest = hashlib.sha256(pdf).hexdigest()
    final_path = tmp_path / f"{digest}.pdf"
    backend = FakePinnedBackend(
        {
            "93.184.216.34": raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        },
        stream_options={"read_delay": 0.001, "max_read_size": 4096},
    )
    monkeypatch.setattr(
        os,
        "link",
        lambda source, target: (_ for _ in ()).throw(OSError()),
    )

    async def scenario() -> DownloadedPdf:
        task = asyncio.create_task(
            _download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                timeout_seconds=3,
                max_size_mb=1,
                dns_resolver=public_dns,
                network_backend=backend,
            )
        )
        while not any(event[0] == "eof" for event in backend.events):
            assert final_path.exists() is False
            await asyncio.sleep(0)
        return await task

    result = run(scenario())
    assert result.final_path == final_path
    assert final_path.read_bytes() == pdf


def test_publication_wait_timeout_never_late_commits_final_file(
    tmp_path: Path,
    monkeypatch,
) -> None:
    from app.services import paper_download as paper_download_module
    from app.services.paper_orphans import (
        acquire_download_lease as real_acquire_download_lease,
        discard_download_claim,
    )

    pdf = make_pdf()
    digest = hashlib.sha256(pdf).hexdigest()
    lock_path = (
        tmp_path
        / ".paper-orphans"
        / f"{digest}.lifecycle.lock"
    )
    publication_started = asyncio.Event()
    claimed_leases: list[str] = []

    def claim_then_block_publication(
        storage_dir: str | Path,
        claimed_digest: str,
        **kwargs: object,
    ) -> str:
        lease_id = real_acquire_download_lease(
            storage_dir,
            claimed_digest,
            **kwargs,
        )
        claimed_leases.append(lease_id)
        lock_path.write_text(
            json.dumps(
                {
                    "created_at": time.time(),
                    "owner_token": "a" * 32,
                    "sha256": digest,
                }
            ),
            encoding="utf-8",
        )
        publication_started.set()
        return lease_id

    monkeypatch.setattr(
        paper_download_module,
        "acquire_download_lease",
        claim_then_block_publication,
    )

    async def fast_extract(
        path: Path,
    ) -> tuple[str, int, float, str | None, str]:
        assert path.exists()
        return "paper text", 1, 0.8, None, "已读取全文"

    monkeypatch.setattr(
        paper_download_module,
        "_extract_pdf_in_process",
        fast_extract,
    )
    backend = FakePinnedBackend(
        {
            "93.184.216.34": raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        }
    )
    monkeypatch.setattr(
        os,
        "link",
        lambda source, target: (_ for _ in ()).throw(OSError()),
    )

    async def scenario() -> tuple[PaperDownloadError, int]:
        publication_ticks = 0
        stop = asyncio.Event()

        async def ticker() -> None:
            nonlocal publication_ticks
            while not publication_started.is_set() and not stop.is_set():
                await asyncio.sleep(0)
            while not stop.is_set():
                publication_ticks += 1
                await asyncio.sleep(0)

        ticker_task = asyncio.create_task(ticker())
        try:
            with pytest.raises(PaperDownloadError) as raised:
                await _download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    timeout_seconds=0.8,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                    network_backend=backend,
                )
            return raised.value, publication_ticks
        finally:
            stop.set()
            await ticker_task

    started_at = time.monotonic()
    error, publication_ticks = run(
        asyncio.wait_for(scenario(), timeout=5)
    )
    elapsed = time.monotonic() - started_at
    assert error.code == "download_timeout"
    assert publication_ticks >= 5
    assert elapsed < 1.5
    lock_path.unlink()
    assert claimed_leases
    discard_download_claim(tmp_path, digest, claimed_leases[0])
    time.sleep(0.1)
    assert (tmp_path / f"{digest}.pdf").exists() is False
    assert list(tmp_path.glob("*.tmp")) == []


def test_large_public_body_keeps_event_loop_responsive(tmp_path: Path) -> None:
    pdf = make_pdf() + (b"x" * (4 * 1024 * 1024))
    backend = FakePinnedBackend(
        {
            "93.184.216.34": raw_http_response(
                200,
                pdf,
                headers={"Content-Type": "application/pdf"},
            )
        },
        stream_options={"max_read_size": 64 * 1024},
    )
    ticks = 0
    stop = asyncio.Event()

    async def ticker() -> None:
        nonlocal ticks
        while not stop.is_set():
            ticks += 1
            await asyncio.sleep(0)

    async def scenario() -> DownloadedPdf:
        tick_task = asyncio.create_task(ticker())
        try:
            return await _download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                timeout_seconds=3,
                max_size_mb=5,
                dns_resolver=public_dns,
                network_backend=backend,
            )
        finally:
            stop.set()
            await tick_task

    assert run(scenario()).final_path.exists()
    assert ticks >= 5


def test_publish_falls_back_to_exclusive_copy_when_hard_links_unavailable(
    tmp_path: Path,
    monkeypatch,
) -> None:
    payload = b"%PDF-fallback"
    digest = hashlib.sha256(payload).hexdigest()
    temporary = tmp_path / ".paper-source.tmp"
    final = tmp_path / f"{digest}.pdf"
    temporary.write_bytes(payload)

    monkeypatch.setattr(os, "link", lambda source, target: (_ for _ in ()).throw(OSError()))

    run(_publish_temp(temporary, final, digest))

    assert final.read_bytes() == payload
    assert temporary.exists() is False


def test_publish_fallback_uses_owned_lifecycle_lock(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = b"%PDF-owned-lock"
    digest = hashlib.sha256(payload).hexdigest()
    temporary = tmp_path / ".paper-owned.tmp"
    final = tmp_path / f"{digest}.pdf"
    temporary.write_bytes(payload)
    original_rename = os.rename

    monkeypatch.setattr(
        os,
        "link",
        lambda source, target: (_ for _ in ()).throw(OSError()),
    )

    def inspect_lock_then_rename(source: Path, target: Path) -> None:
        lifecycle_lock = (
            tmp_path
            / ".paper-orphans"
            / f"{digest}.lifecycle.lock"
        )
        payload_json = json.loads(lifecycle_lock.read_text(encoding="utf-8"))
        assert len(payload_json["owner_token"]) == 32
        assert isinstance(payload_json["created_at"], float)
        original_rename(source, target)

    monkeypatch.setattr(os, "rename", inspect_lock_then_rename)
    run(_publish_temp(temporary, final, digest))

    assert final.read_bytes() == payload
    assert temporary.exists() is False


def test_publish_surfaces_temp_unlink_failure_and_keeps_temp_reference(
    tmp_path: Path,
    monkeypatch,
) -> None:
    payload = b"%PDF-cleanup"
    digest = hashlib.sha256(payload).hexdigest()
    temporary = tmp_path / ".paper-source.tmp"
    final = tmp_path / f"{digest}.pdf"
    temporary.write_bytes(payload)
    original_unlink = Path.unlink

    def fail_temp_unlink(path: Path, *args, **kwargs):
        if path == temporary:
            raise PermissionError("secret cleanup path")
        return original_unlink(path, *args, **kwargs)

    monkeypatch.setattr(Path, "unlink", fail_temp_unlink)

    with pytest.raises(PaperDownloadError) as raised:
        run(_publish_temp(temporary, final, digest))

    assert raised.value.code == "storage_cleanup"
    assert_safe_error(raised.value)
    assert temporary.exists()
    assert final.read_bytes() == payload


def test_follows_relative_redirects_manually_and_revalidates_each_host(
    tmp_path: Path,
) -> None:
    pdf = make_pdf()
    requested: list[str] = []
    resolved: list[str] = []

    def resolver(host: str):
        resolved.append(host)
        return ["93.184.216.34"]

    def handler(request: httpx.Request) -> httpx.Response:
        requested.append(str(request.url))
        assert request.extensions.get("follow_redirects") is not True
        if request.url.host == "papers.example":
            return httpx.Response(302, headers={"Location": "//cdn.example/files/a.pdf"})
        return httpx.Response(
            200,
            headers={"Content-Type": "application/x-pdf"},
            content=pdf,
        )

    async def scenario() -> DownloadedPdf:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(handler),
            follow_redirects=True,
        ) as client:
            return await download_open_pdf(
                "https://papers.example/download",
                tmp_path,
                client,
                timeout_seconds=5,
                max_size_mb=1,
                dns_resolver=resolver,
            )

    result = run(scenario())
    assert requested == [
        "https://papers.example/download",
        "https://cdn.example/files/a.pdf",
    ]
    assert resolved == ["papers.example", "cdn.example"]
    assert result.sha256 == hashlib.sha256(pdf).hexdigest()


@pytest.mark.parametrize(
    ("location", "expected_code"),
    [
        ("http://papers.example/file.pdf", "invalid_url"),
        ("https://127.0.0.1/file.pdf", "unsafe_target"),
        ("", "invalid_redirect"),
        ("https://[broken", "invalid_redirect"),
    ],
)
def test_rejects_unsafe_or_invalid_redirects(
    tmp_path: Path, location: str, expected_code: str
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        headers = {"Location": location} if location else {}
        return httpx.Response(302, headers=headers)

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/download",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        assert raised.value.code == expected_code
        assert_safe_error(raised.value)

    run(scenario())


def test_rejects_redirect_loops_and_more_than_three_redirects(tmp_path: Path) -> None:
    async def loop_case() -> PaperDownloadError:
        def handler(request: httpx.Request) -> httpx.Response:
            target = "/b" if request.url.path == "/a" else "/a"
            return httpx.Response(302, headers={"Location": target})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/a",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        return raised.value

    async def excess_case() -> PaperDownloadError:
        def handler(request: httpx.Request) -> httpx.Response:
            step = int(request.url.path.removeprefix("/step/"))
            return httpx.Response(302, headers={"Location": f"/step/{step + 1}"})

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/step/0",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        return raised.value

    loop_error = run(loop_case())
    excess_error = run(excess_case())
    assert loop_error.code == "redirect_loop"
    assert excess_error.code == "too_many_redirects"
    assert_safe_error(loop_error)
    assert_safe_error(excess_error)


@pytest.mark.parametrize(
    ("timeout_seconds", "max_size_mb"),
    [
        (True, 1),
        ("5", 1),
        (0, 1),
        (601, 1),
        (5, False),
        (5, "1"),
        (5, 0),
        (5, 1001),
        (float("nan"), 1),
        (5, float("inf")),
    ],
)
def test_rejects_invalid_limits_before_dns_or_request(
    tmp_path: Path, timeout_seconds, max_size_mb
) -> None:
    resolver_called = False

    def resolver(_host: str):
        nonlocal resolver_called
        resolver_called = True
        return ["93.184.216.34"]

    async def scenario() -> None:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(lambda request: httpx.Response(500))
        ) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    client,
                    timeout_seconds=timeout_seconds,
                    max_size_mb=max_size_mb,
                    dns_resolver=resolver,
                )
        assert raised.value.code == "invalid_limits"
        assert_safe_error(raised.value)

    run(scenario())
    assert resolver_called is False


def test_rejects_content_length_over_limit_without_streaming(tmp_path: Path) -> None:
    stream = ChunkStream([b"%PDF-" + b"x" * 20])

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={
                "Content-Type": "application/pdf",
                "Content-Length": str(1024 * 1024 + 1),
            },
            stream=stream,
        )

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        assert raised.value.code == "too_large"
        assert_safe_error(raised.value)

    run(scenario())
    assert list(tmp_path.iterdir()) == []


def test_enforces_hard_decoded_stream_limit_and_cleans_temp(tmp_path: Path) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf"},
            stream=ChunkStream([b"%PDF-", b"x" * (1024 * 1024)]),
        )

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=async_public_dns,
                )
        assert raised.value.code == "too_large"

    run(scenario())
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize(
    ("content_type", "body", "expected_code"),
    [
        ("text/html", b"%PDF-not-accepted", "invalid_content_type"),
        ("application/octet-stream", b"%PDF-not-accepted", "invalid_content_type"),
        ("application/pdf", b"<html>not a pdf</html>", "invalid_pdf"),
        ("application/x-pdf; version=1.7", b"not-pdf", "invalid_pdf"),
    ],
)
def test_requires_pdf_content_type_and_magic_bytes(
    tmp_path: Path, content_type: str, body: bytes, expected_code: str
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": content_type},
            content=body,
        )

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        assert raised.value.code == expected_code
        assert_safe_error(raised.value)

    run(scenario())
    assert list(tmp_path.iterdir()) == []


def test_rejects_corrupt_pdf_after_magic_validation(tmp_path: Path) -> None:
    secret = "signed=private-download-token"

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf"},
            content=b"%PDF-1.7\nthis is corrupt",
        )

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    f"https://papers.example/paper.pdf?{secret}",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        assert raised.value.code == "invalid_pdf"
        assert_safe_error(raised.value, secret)

    run(scenario())
    assert list(tmp_path.iterdir()) == []


def test_rejects_password_protected_pdf(tmp_path: Path) -> None:
    protected_pdf = make_protected_pdf()

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf"},
            content=protected_pdf,
        )

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/protected.pdf",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        assert raised.value.code == "invalid_pdf"
        assert_safe_error(raised.value)

    run(scenario())
    assert list(tmp_path.iterdir()) == []


def test_downloads_valid_pdf_extracts_metadata_and_uses_hash_filename(
    tmp_path: Path,
) -> None:
    text = "Sodium ion battery performance " * 100
    pdf = make_pdf(text)

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={
                "Content-Type": "Application/PDF; charset=binary",
                "Content-Length": str(len(pdf)),
            },
            stream=ChunkStream([pdf[:2], pdf[2:9], pdf[9:]]),
        )

    async def scenario() -> DownloadedPdf:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                client,
                timeout_seconds=5,
                max_size_mb=1,
                dns_resolver=public_dns,
            )

    result = run(scenario())
    digest = hashlib.sha256(pdf).hexdigest()
    assert result == DownloadedPdf(
        final_path=tmp_path / f"{digest}.pdf",
        sha256=digest,
        file_size=len(pdf),
        page_count=1,
        extracted_text=result.extracted_text,
        parse_confidence=result.parse_confidence,
        extraction_warning=None,
        fulltext_status="已读取全文",
        lease_id=result.lease_id,
    )
    assert "Sodium ion battery" in result.extracted_text
    assert result.parse_confidence >= 0.35
    assert result.path == result.final_path
    assert result.lease_id
    assert list((tmp_path / ".paper-orphans").glob(f"{digest}.*.lease"))
    assert result.final_path.read_bytes() == pdf
    assert not list(tmp_path.glob("*.tmp"))


def test_allows_scanned_pdf_with_metadata_only_status(tmp_path: Path) -> None:
    pdf = make_pdf("")

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf"},
            content=pdf,
        )

    async def scenario() -> DownloadedPdf:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await download_open_pdf(
                "https://papers.example/scan.pdf",
                tmp_path,
                client,
                timeout_seconds=5,
                max_size_mb=1,
                dns_resolver=public_dns,
            )

    result = run(scenario())
    assert result.page_count == 1
    assert result.extracted_text == ""
    assert result.parse_confidence == 0.0
    assert result.extraction_warning is not None
    assert "扫描版" in result.extraction_warning
    assert result.fulltext_status == "仅元数据或摘要"


def test_deduplicates_existing_identical_file_without_overwrite(tmp_path: Path) -> None:
    pdf = make_pdf()
    digest = hashlib.sha256(pdf).hexdigest()
    existing = tmp_path / f"{digest}.pdf"
    existing.write_bytes(pdf)

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf"},
            content=pdf,
        )

    async def scenario() -> DownloadedPdf:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await download_open_pdf(
                "https://papers.example/paper.pdf",
                tmp_path,
                client,
                timeout_seconds=5,
                max_size_mb=1,
                dns_resolver=public_dns,
            )

    result = run(scenario())
    assert result.final_path == existing
    assert existing.read_bytes() == pdf
    assert result.lease_id
    assert list((tmp_path / ".paper-orphans").glob(f"{digest}.*.lease"))


def test_publish_error_after_final_exists_marks_orphan_and_releases_lease(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import paper_download as paper_download_module
    from app.services.paper_orphans import orphan_marker_path

    pdf = make_pdf()
    digest = hashlib.sha256(pdf).hexdigest()

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf"},
            content=pdf,
        )

    async def publish_then_fail(
        temporary_path: Path,
        final_path: Path,
        published_digest: str,
    ) -> None:
        assert published_digest == digest
        final_path.write_bytes(temporary_path.read_bytes())
        raise PaperDownloadError(
            "storage_cleanup",
            "模拟发布后清理失败",
        )

    monkeypatch.setattr(
        paper_download_module,
        "_publish_temp",
        publish_then_fail,
    )

    async def scenario() -> None:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(handler)
        ) as client:
            with pytest.raises(PaperDownloadError):
                await download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )

    run(scenario())
    assert (tmp_path / f"{digest}.pdf").exists()
    assert orphan_marker_path(tmp_path, digest).exists()
    assert (
        list((tmp_path / ".paper-orphans").glob(f"{digest}.*.lease"))
        == []
    )


def test_never_overwrites_unrelated_existing_hash_path(tmp_path: Path) -> None:
    pdf = make_pdf()
    digest = hashlib.sha256(pdf).hexdigest()
    conflict = tmp_path / f"{digest}.pdf"
    conflict.write_bytes(b"unrelated")

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf"},
            content=pdf,
        )

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        assert raised.value.code == "destination_conflict"
        assert_safe_error(raised.value)

    run(scenario())
    assert conflict.read_bytes() == b"unrelated"
    state_dir = tmp_path / ".paper-orphans"
    assert not (state_dir / f"{digest}.orphan.json").exists()
    assert list(state_dir.glob(f"{digest}.*.lease")) == []
    assert list(state_dir.glob(f"{digest}.lifecycle.lock")) == []
    assert [
        path
        for path in tmp_path.iterdir()
        if path.name != ".paper-orphans"
    ] == [conflict]


def test_existing_hash_process_start_failure_is_safe_and_closes_pipes(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import paper_download as paper_download_module

    closed: list[str] = []

    class PipeEnd:
        def close(self) -> None:
            closed.append(type(self).__name__)

    class Receiver(PipeEnd):
        pass

    class Sender(PipeEnd):
        pass

    class Process:
        def start(self) -> None:
            raise OSError("secret process path")

    class Context:
        def Pipe(self, *, duplex: bool):
            assert duplex is False
            return Receiver(), Sender()

        def Process(self, **kwargs: object) -> Process:
            return Process()

    monkeypatch.setattr(
        paper_download_module.multiprocessing,
        "get_context",
        lambda method: Context(),
    )

    with pytest.raises(PaperDownloadError) as raised:
        run(_hash_existing_in_process(tmp_path / "secret.pdf"))

    assert raised.value.code == "storage_error"
    assert_safe_error(raised.value, "secret process path")
    assert sorted(closed) == ["Receiver", "Sender"]


def test_existing_hash_process_eof_is_safe_and_terminates_worker(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import paper_download as paper_download_module

    class Receiver:
        closed = False

        def poll(self) -> bool:
            return True

        def recv(self):
            raise EOFError("secret pipe payload")

        def close(self) -> None:
            self.closed = True

    class Sender:
        closed = False

        def close(self) -> None:
            self.closed = True

    class Process:
        alive = False
        terminated = False

        def start(self) -> None:
            self.alive = True

        def is_alive(self) -> bool:
            return self.alive

        def terminate(self) -> None:
            self.terminated = True
            self.alive = False

        def join(self, *, timeout: float) -> None:
            assert timeout == 0.2

        def kill(self) -> None:
            self.alive = False

    receiver = Receiver()
    sender = Sender()
    process = Process()

    class Context:
        def Pipe(self, *, duplex: bool):
            assert duplex is False
            return receiver, sender

        def Process(self, **kwargs: object) -> Process:
            return process

    monkeypatch.setattr(
        paper_download_module.multiprocessing,
        "get_context",
        lambda method: Context(),
    )

    with pytest.raises(PaperDownloadError) as raised:
        run(_hash_existing_in_process(tmp_path / "secret.pdf"))

    assert raised.value.code == "storage_error"
    assert_safe_error(raised.value, "secret pipe payload")
    assert receiver.closed is True
    assert sender.closed is True
    assert process.terminated is True


def test_network_failure_is_typed_and_does_not_leak_url(tmp_path: Path) -> None:
    secret = "access_token=private"

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout(
            f"timed out requesting {request.url}",
            request=request,
        )

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(PaperDownloadError) as raised:
                await download_open_pdf(
                    f"https://papers.example/paper.pdf?{secret}",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )
        assert raised.value.code == "download_timeout"
        assert_safe_error(raised.value, secret)

    run(scenario())
    assert list(tmp_path.iterdir()) == []


def test_cancellation_propagates_and_cleans_temp_file(tmp_path: Path) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf"},
            stream=CancellingStream(),
        )

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            with pytest.raises(asyncio.CancelledError):
                await download_open_pdf(
                    "https://papers.example/paper.pdf",
                    tmp_path,
                    client,
                    timeout_seconds=5,
                    max_size_mb=1,
                    dns_resolver=public_dns,
                )

    run(scenario())
    assert list(tmp_path.iterdir()) == []
