"""Crash-safe lifecycle management for content-addressed PDF files."""

from __future__ import annotations

import json
import hashlib
import math
import os
import re
import secrets
import stat
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterator

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Paper


_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_TOKEN_RE = re.compile(r"^[0-9a-f]{32}$")
_LEASE_RE = re.compile(r"^([0-9a-f]{64})\.([0-9a-f]{32})\.lease$")
_STATE_DIRECTORY = ".paper-orphans"
_LOCK_WAIT_SECONDS = 2.0
DEFAULT_LOCK_STALE_SECONDS = 7_200
DEFAULT_LEASE_STALE_SECONDS = 7_200
_ORPHAN_HASH_CHUNK_BYTES = 1024 * 1024
_MAX_ORPHAN_HASH_BYTES = 1024 * 1024 * 1024


class OrphanLifecycleError(RuntimeError):
    """A path-free lifecycle error for the import-service boundary."""


@dataclass(frozen=True, slots=True)
class OrphanCleanupResult:
    deleted: int = 0
    retained_conflict: int = 0
    retained_grace: int = 0
    retained_active: int = 0
    adopted_referenced: int = 0
    retained_locked: int = 0
    retained_error: int = 0
    reclaimed_stale_leases: int = 0
    reclaimed_stale_locks: int = 0


@dataclass(frozen=True, slots=True)
class _FileFingerprint:
    device: int
    inode: int
    mode: int
    size: int
    modified_ns: int
    changed_ns: int


# Windows reports st_ctime (creation time) with up to ~1ms jitter between
# os.fstat (handle) and os.lstat (path) for the same file, which would make an
# exact comparison flaky.  POSIX ctime (inode change time) is stable on read,
# so it is compared exactly there.
_CTIME_JITTER_NS = 2_000_000


def _fingerprints_equal(a: _FileFingerprint, b: _FileFingerprint) -> bool:
    if (a.device, a.inode, a.mode, a.size, a.modified_ns) != (
        b.device,
        b.inode,
        b.mode,
        b.size,
        b.modified_ns,
    ):
        return False
    if os.name == "nt":
        return abs(a.changed_ns - b.changed_ns) <= _CTIME_JITTER_NS
    return a.changed_ns == b.changed_ns


def _fingerprint(file_stat: os.stat_result) -> _FileFingerprint:
    return _FileFingerprint(
        device=file_stat.st_dev,
        inode=file_stat.st_ino,
        mode=file_stat.st_mode,
        size=file_stat.st_size,
        modified_ns=file_stat.st_mtime_ns,
        changed_ns=file_stat.st_ctime_ns,
    )


def _hash_orphan_candidate(
    path: Path,
) -> tuple[str, str | None, _FileFingerprint | None]:
    """Hash a bounded regular file and prove it stayed stable while read."""

    try:
        before_stat = path.lstat()
    except FileNotFoundError:
        return "missing", None, None
    except OSError:
        return "error", None, None
    if (
        stat.S_ISLNK(before_stat.st_mode)
        or not stat.S_ISREG(before_stat.st_mode)
    ):
        return "conflict", None, None
    if before_stat.st_size > _MAX_ORPHAN_HASH_BYTES:
        return "error", None, None

    before = _fingerprint(before_stat)
    digest = hashlib.sha256()
    read_bytes = 0
    try:
        with path.open("rb") as stream:
            opened = _fingerprint(os.fstat(stream.fileno()))
            if not _fingerprints_equal(opened, before) or not stat.S_ISREG(opened.mode):
                return "error", None, None
            while True:
                chunk = stream.read(
                    min(
                        _ORPHAN_HASH_CHUNK_BYTES,
                        _MAX_ORPHAN_HASH_BYTES - read_bytes + 1,
                    )
                )
                if not chunk:
                    break
                read_bytes += len(chunk)
                if read_bytes > _MAX_ORPHAN_HASH_BYTES:
                    return "error", None, None
                digest.update(chunk)
            after_open = _fingerprint(os.fstat(stream.fileno()))
        after_path = _fingerprint(path.lstat())
    except (OSError, ValueError):
        return "error", None, None
    if not _fingerprints_equal(before, after_open) or not _fingerprints_equal(
        before, after_path
    ):
        return "error", None, None
    return "ok", digest.hexdigest(), before


def _fingerprint_matches(path: Path, expected: _FileFingerprint) -> bool:
    try:
        current = path.lstat()
    except OSError:
        return False
    return (
        not stat.S_ISLNK(current.st_mode)
        and stat.S_ISREG(current.st_mode)
        and _fingerprints_equal(_fingerprint(current), expected)
    )


def _finite_number(
    value: object,
    *,
    minimum: float | None = None,
    allow_zero: bool = True,
    message: str,
) -> float:
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(float(value))
    ):
        raise OrphanLifecycleError(message)
    number = float(value)
    if minimum is not None and (
        number < minimum or (not allow_zero and number == minimum)
    ):
        raise OrphanLifecycleError(message)
    return number


def _timestamp(value: object, message: str) -> float:
    return _finite_number(value, minimum=0.0, message=message)


def _digest(value: str) -> str:
    normalized = value.strip().lower() if isinstance(value, str) else ""
    if not _SHA256_RE.fullmatch(normalized):
        raise OrphanLifecycleError("无效的全文内容标识")
    return normalized


def _token(value: str) -> str:
    if not isinstance(value, str) or not _TOKEN_RE.fullmatch(value):
        raise OrphanLifecycleError("无效的生命周期所有者标识")
    return value


def _state_dir(storage_dir: str | Path) -> Path:
    directory = Path(storage_dir) / _STATE_DIRECTORY
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except OSError:
        raise OrphanLifecycleError("无法创建全文生命周期目录") from None
    return directory


def orphan_marker_path(storage_dir: str | Path, sha256: str) -> Path:
    return _state_dir(storage_dir) / f"{_digest(sha256)}.orphan.json"


def _lock_path(storage_dir: str | Path, sha256: str) -> Path:
    return _state_dir(storage_dir) / f"{_digest(sha256)}.lifecycle.lock"


def _gate_path(storage_dir: str | Path, sha256: str) -> Path:
    return _state_dir(storage_dir) / f"{_digest(sha256)}.gate"


def _lease_path(
    storage_dir: str | Path,
    sha256: str,
    lease_id: str,
) -> Path:
    return _state_dir(storage_dir) / (
        f"{_digest(sha256)}.{_token(lease_id)}.lease"
    )


def _write_json_atomic(path: Path, payload: dict[str, object]) -> None:
    temporary = path.with_name(f".{path.name}.{secrets.token_hex(8)}.tmp")
    try:
        with temporary.open("x", encoding="utf-8") as stream:
            json.dump(
                payload,
                stream,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    except OSError:
        try:
            temporary.unlink(missing_ok=True)
        except OSError:
            pass
        raise OrphanLifecycleError("无法写入全文生命周期状态") from None


def _read_json(path: Path) -> dict[str, object] | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, ValueError):
        return None
    return payload if isinstance(payload, dict) else None


def _created_at_or_mtime(path: Path) -> float | None:
    payload = _read_json(path)
    if payload is not None:
        value = payload.get("created_at")
        try:
            return _timestamp(value, "生命周期时间无效")
        except OrphanLifecycleError:
            pass
    try:
        mtime = path.stat().st_mtime
    except OSError:
        return None
    return mtime if math.isfinite(mtime) and mtime >= 0 else None


@contextmanager
def _process_gate(
    storage_dir: str | Path,
    sha256: str,
    *,
    wait: bool,
) -> Iterator[bool]:
    path = _gate_path(storage_dir, sha256)
    try:
        descriptor = os.open(path, os.O_RDWR | os.O_CREAT, 0o600)
        if os.fstat(descriptor).st_size == 0:
            os.write(descriptor, b"\0")
        os.lseek(descriptor, 0, os.SEEK_SET)
    except OSError:
        raise OrphanLifecycleError("无法打开生命周期接管门锁") from None

    deadline = time.monotonic() + _LOCK_WAIT_SECONDS
    acquired = False
    try:
        while not acquired:
            try:
                if os.name == "nt":
                    import msvcrt

                    msvcrt.locking(descriptor, msvcrt.LK_NBLCK, 1)
                else:
                    import fcntl

                    fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
                acquired = True
            except (OSError, BlockingIOError):
                if not wait or time.monotonic() >= deadline:
                    yield False
                    return
                time.sleep(0.01)
        yield True
    finally:
        if acquired:
            try:
                os.lseek(descriptor, 0, os.SEEK_SET)
                if os.name == "nt":
                    import msvcrt

                    msvcrt.locking(descriptor, msvcrt.LK_UNLCK, 1)
                else:
                    import fcntl

                    fcntl.flock(descriptor, fcntl.LOCK_UN)
            except OSError:
                pass
        os.close(descriptor)


@dataclass(slots=True)
class HashLock:
    storage_dir: Path
    sha256: str
    owner_token: str
    created_at: float
    reclaimed_stale: bool = False
    _released: bool = False

    def assert_owner(self) -> None:
        payload = _read_json(_lock_path(self.storage_dir, self.sha256))
        if payload is None or payload.get("owner_token") != self.owner_token:
            raise OrphanLifecycleError("全文生命周期锁已失去所有权")

    def refresh(self, *, now: float | None = None) -> None:
        refreshed_at = _timestamp(
            time.time() if now is None else now,
            "生命周期刷新时间无效",
        )
        with _process_gate(
            self.storage_dir,
            self.sha256,
            wait=True,
        ) as gated:
            if not gated:
                raise OrphanLifecycleError("生命周期接管门锁暂时不可用")
            self.assert_owner()
            _write_json_atomic(
                _lock_path(self.storage_dir, self.sha256),
                {
                    "created_at": refreshed_at,
                    "owner_token": self.owner_token,
                    "sha256": self.sha256,
                },
            )
            self.created_at = refreshed_at

    def release(self) -> None:
        if self._released:
            return
        with _process_gate(
            self.storage_dir,
            self.sha256,
            wait=True,
        ) as gated:
            if not gated:
                raise OrphanLifecycleError("生命周期接管门锁暂时不可用")
            path = _lock_path(self.storage_dir, self.sha256)
            payload = _read_json(path)
            if payload is None or payload.get("owner_token") != self.owner_token:
                raise OrphanLifecycleError("不能释放其他所有者的生命周期锁")
            try:
                path.unlink()
            except OSError:
                raise OrphanLifecycleError("无法释放全文生命周期锁") from None
            self._released = True


def _acquire_hash_lock(
    storage_dir: str | Path,
    sha256: str,
    *,
    wait: bool,
    now: float | None,
    stale_seconds: int | float,
) -> HashLock | None:
    storage = Path(storage_dir)
    digest = _digest(sha256)
    current_time = _timestamp(
        time.time() if now is None else now,
        "锁定时间无效",
    )
    stale_after = _finite_number(
        stale_seconds,
        minimum=0.0,
        allow_zero=False,
        message="生命周期锁失效阈值无效",
    )
    deadline = time.monotonic() + _LOCK_WAIT_SECONDS
    while True:
        with _process_gate(storage, digest, wait=wait) as gated:
            if not gated:
                return None
            path = _lock_path(storage, digest)
            reclaimed = False
            if path.exists():
                lock_time = _created_at_or_mtime(path)
                if (
                    lock_time is not None
                    and current_time - lock_time <= stale_after
                ):
                    lock_active = True
                else:
                    tombstone = path.with_name(
                        f"{path.name}.{secrets.token_hex(16)}.tombstone"
                    )
                    try:
                        os.replace(path, tombstone)
                    except OSError:
                        lock_active = True
                    else:
                        reclaimed = True
                        lock_active = False
                        try:
                            tombstone.unlink(missing_ok=True)
                        except OSError:
                            pass
                if lock_active:
                    pass
                else:
                    path = _lock_path(storage, digest)
            if not path.exists():
                owner = secrets.token_hex(16)
                payload = {
                    "created_at": current_time,
                    "owner_token": owner,
                    "sha256": digest,
                }
                try:
                    descriptor = os.open(
                        path,
                        os.O_WRONLY | os.O_CREAT | os.O_EXCL,
                        0o600,
                    )
                except FileExistsError:
                    pass
                except OSError:
                    raise OrphanLifecycleError(
                        "无法创建全文生命周期锁"
                    ) from None
                else:
                    try:
                        os.write(
                            descriptor,
                            json.dumps(
                                payload,
                                ensure_ascii=False,
                                sort_keys=True,
                                separators=(",", ":"),
                            ).encode("utf-8"),
                        )
                        os.fsync(descriptor)
                    finally:
                        os.close(descriptor)
                    return HashLock(
                        storage,
                        digest,
                        owner,
                        current_time,
                        reclaimed_stale=reclaimed,
                    )
        if not wait or time.monotonic() >= deadline:
            return None
        time.sleep(0.01)


@contextmanager
def hash_lock(
    storage_dir: str | Path,
    sha256: str,
    *,
    wait: bool = True,
    now: float | None = None,
    stale_seconds: int | float = DEFAULT_LOCK_STALE_SECONDS,
) -> Iterator[HashLock | None]:
    lock = _acquire_hash_lock(
        storage_dir,
        sha256,
        wait=wait,
        now=now,
        stale_seconds=stale_seconds,
    )
    try:
        yield lock
    finally:
        if lock is not None:
            lock.release()


def _write_marker_unlocked(
    storage_dir: str | Path,
    sha256: str,
    marked_at: float,
    *,
    lease_id: str | None = None,
) -> None:
    timestamp = _timestamp(marked_at, "全文孤儿标记时间无效")
    payload: dict[str, object] = {
        "marked_at": timestamp,
        "sha256": sha256,
    }
    if lease_id is not None:
        payload["lease_id"] = _token(lease_id)
    _write_json_atomic(
        orphan_marker_path(storage_dir, sha256),
        payload,
    )


def _write_lease_unlocked(
    storage_dir: str | Path,
    sha256: str,
    lease_id: str,
    created_at: float,
) -> None:
    timestamp = _timestamp(created_at, "全文租约时间无效")
    _write_json_atomic(
        _lease_path(storage_dir, sha256, lease_id),
        {
            "created_at": timestamp,
            "lease_id": lease_id,
            "sha256": sha256,
        },
    )


def claim_downloaded_pdf(
    storage_dir: str | Path,
    sha256: str,
    *,
    created_at: float | None = None,
) -> str:
    digest = _digest(sha256)
    claim_time = _timestamp(
        time.time() if created_at is None else created_at,
        "全文认领时间无效",
    )
    lease_id = secrets.token_hex(16)
    with hash_lock(storage_dir, digest) as lock:
        if lock is None:
            raise OrphanLifecycleError("全文生命周期锁暂时不可用")
        _write_marker_unlocked(
            storage_dir,
            digest,
            claim_time,
            lease_id=lease_id,
        )
        try:
            _write_lease_unlocked(
                storage_dir,
                digest,
                lease_id,
                claim_time,
            )
        except OrphanLifecycleError:
            # Marker deliberately remains discoverable.
            raise
    return lease_id


def acquire_download_lease(
    storage_dir: str | Path,
    sha256: str,
    *,
    created_at: float | None = None,
) -> str:
    return claim_downloaded_pdf(
        storage_dir,
        sha256,
        created_at=created_at,
    )


def mark_download_orphan(
    storage_dir: str | Path,
    sha256: str,
    *,
    marked_at: float | None = None,
) -> None:
    digest = _digest(sha256)
    timestamp = _timestamp(
        time.time() if marked_at is None else marked_at,
        "全文孤儿标记时间无效",
    )
    with hash_lock(storage_dir, digest) as lock:
        if lock is None:
            raise OrphanLifecycleError("全文生命周期锁暂时不可用")
        _write_marker_unlocked(storage_dir, digest, timestamp)


def release_download_lease(
    storage_dir: str | Path,
    sha256: str,
    lease_id: str,
) -> None:
    digest = _digest(sha256)
    with hash_lock(storage_dir, digest) as lock:
        if lock is None:
            raise OrphanLifecycleError("全文生命周期锁暂时不可用")
        try:
            _lease_path(storage_dir, digest, lease_id).unlink(
                missing_ok=True
            )
        except OSError:
            raise OrphanLifecycleError("无法释放全文使用租约") from None


def discard_download_claim(
    storage_dir: str | Path,
    sha256: str,
    lease_id: str,
) -> None:
    """Remove only this downloader's claim without orphaning an existing file."""

    digest = _digest(sha256)
    lease_token = _token(lease_id)
    with hash_lock(storage_dir, digest) as lock:
        if lock is None:
            raise OrphanLifecycleError("全文生命周期锁暂时不可用")
        marker = orphan_marker_path(storage_dir, digest)
        marker_payload = _read_json(marker)
        try:
            if (
                marker_payload is not None
                and marker_payload.get("sha256") == digest
                and marker_payload.get("lease_id") == lease_token
            ):
                marker.unlink(missing_ok=True)
            _lease_path(
                storage_dir,
                digest,
                lease_token,
            ).unlink(missing_ok=True)
        except OSError:
            raise OrphanLifecycleError("无法撤销全文下载认领") from None


def retain_download_as_orphan(
    storage_dir: str | Path,
    sha256: str,
    lease_id: str | None,
    *,
    marked_at: float | None = None,
) -> None:
    digest = _digest(sha256)
    timestamp = _timestamp(
        time.time() if marked_at is None else marked_at,
        "全文孤儿标记时间无效",
    )
    with hash_lock(storage_dir, digest) as lock:
        if lock is None:
            raise OrphanLifecycleError("全文生命周期锁暂时不可用")
        _write_marker_unlocked(storage_dir, digest, timestamp)
        if lease_id:
            try:
                _lease_path(storage_dir, digest, lease_id).unlink(
                    missing_ok=True
                )
            except OSError:
                raise OrphanLifecycleError("无法释放全文使用租约") from None


def adopt_downloaded_pdf(
    storage_dir: str | Path,
    sha256: str,
    lease_id: str | None,
) -> None:
    digest = _digest(sha256)
    with hash_lock(storage_dir, digest) as lock:
        if lock is None:
            raise OrphanLifecycleError("全文生命周期锁暂时不可用")
        _adopt_unlocked(storage_dir, digest, lease_id)


def _adopt_unlocked(
    storage_dir: str | Path,
    sha256: str,
    lease_id: str | None,
) -> None:
    try:
        orphan_marker_path(storage_dir, sha256).unlink(missing_ok=True)
        if lease_id:
            _lease_path(storage_dir, sha256, lease_id).unlink(
                missing_ok=True
            )
    except OSError:
        raise OrphanLifecycleError("无法确认全文已被论文库采用") from None


class DownloadLeaseGuard:
    def __init__(
        self,
        storage_dir: str | Path,
        sha256: str,
        lease_id: str,
        lock: HashLock,
    ) -> None:
        self.storage_dir = Path(storage_dir)
        self.sha256 = _digest(sha256)
        self.lease_id = _token(lease_id)
        self.lock = lock
        self.adopted = False

    def adopt(self) -> None:
        self.lock.assert_owner()
        _adopt_unlocked(
            self.storage_dir,
            self.sha256,
            self.lease_id,
        )
        self.adopted = True


@contextmanager
def download_lease_guard(
    storage_dir: str | Path,
    sha256: str,
    lease_id: str,
    *,
    now: float | None = None,
) -> Iterator[DownloadLeaseGuard]:
    digest = _digest(sha256)
    lease_token = _token(lease_id)
    guard_time = _timestamp(
        time.time() if now is None else now,
        "全文租约刷新时间无效",
    )
    with hash_lock(storage_dir, digest, now=guard_time) as lock:
        if lock is None:
            raise OrphanLifecycleError("全文生命周期锁暂时不可用")
        lease = _lease_path(storage_dir, digest, lease_token)
        payload = _read_json(lease)
        if (
            payload is None
            or payload.get("lease_id") != lease_token
            or payload.get("sha256") != digest
        ):
            raise OrphanLifecycleError("全文使用租约已失效")
        _timestamp(payload.get("created_at"), "全文租约时间无效")
        _write_lease_unlocked(
            storage_dir,
            digest,
            lease_token,
            guard_time,
        )
        guard = DownloadLeaseGuard(
            storage_dir,
            digest,
            lease_token,
            lock,
        )
        yield guard


def _active_leases_and_reclaim_stale(
    storage_dir: str | Path,
    sha256: str,
    *,
    now: float,
    stale_seconds: float,
) -> tuple[bool, int]:
    state = _state_dir(storage_dir)
    reclaimed = 0
    active = False
    for lease in sorted(state.glob(f"{_digest(sha256)}.*.lease")):
        created_at = _created_at_or_mtime(lease)
        if created_at is None or now - created_at <= stale_seconds:
            active = True
            continue
        try:
            lease.unlink(missing_ok=True)
            reclaimed += 1
        except OSError:
            active = True
    return active, reclaimed


def _database_references(
    session_factory: Callable[[], Session],
    sha256: str,
    final_path: Path,
) -> bool:
    with session_factory() as session:
        return (
            session.scalar(
                select(Paper.id)
                .where(
                    or_(
                        Paper.file_hash == sha256,
                        Paper.file_path == str(final_path),
                    )
                )
                .limit(1)
            )
            is not None
        )


def _read_marked_at(marker: Path, sha256: str) -> float | None:
    payload = _read_json(marker)
    if payload is None or payload.get("sha256") != sha256:
        return None
    try:
        return _timestamp(
            payload.get("marked_at"),
            "全文孤儿标记时间无效",
        )
    except OrphanLifecycleError:
        return None


def cleanup_orphaned_pdfs(
    storage_dir: str | Path,
    session_factory: Callable[[], Session],
    *,
    grace_period_seconds: int | float,
    lease_stale_seconds: int | float = DEFAULT_LEASE_STALE_SECONDS,
    lock_stale_seconds: int | float = DEFAULT_LOCK_STALE_SECONDS,
    now: float | None = None,
) -> OrphanCleanupResult:
    grace = _finite_number(
        grace_period_seconds,
        minimum=0.0,
        message="全文清理宽限期无效",
    )
    lease_stale = _finite_number(
        lease_stale_seconds,
        minimum=0.0,
        allow_zero=False,
        message="全文租约失效阈值无效",
    )
    lock_stale = _finite_number(
        lock_stale_seconds,
        minimum=0.0,
        allow_zero=False,
        message="生命周期锁失效阈值无效",
    )
    current_time = _timestamp(
        time.time() if now is None else now,
        "全文清理时间无效",
    )
    counts = {
        "deleted": 0,
        "retained_conflict": 0,
        "retained_grace": 0,
        "retained_active": 0,
        "adopted_referenced": 0,
        "retained_locked": 0,
        "retained_error": 0,
        "reclaimed_stale_leases": 0,
        "reclaimed_stale_locks": 0,
    }
    state = _state_dir(storage_dir)
    candidates = {
        marker.name.removesuffix(".orphan.json")
        for marker in state.glob("*.orphan.json")
        if _SHA256_RE.fullmatch(marker.name.removesuffix(".orphan.json"))
    }
    for lease in state.glob("*.lease"):
        match = _LEASE_RE.fullmatch(lease.name)
        if match:
            candidates.add(match.group(1))

    for digest in sorted(candidates):
        try:
            with hash_lock(
                storage_dir,
                digest,
                wait=False,
                now=current_time,
                stale_seconds=lock_stale,
            ) as lock:
                if lock is None:
                    counts["retained_locked"] += 1
                    continue
                if lock.reclaimed_stale:
                    counts["reclaimed_stale_locks"] += 1
                active, reclaimed = _active_leases_and_reclaim_stale(
                    storage_dir,
                    digest,
                    now=current_time,
                    stale_seconds=lease_stale,
                )
                counts["reclaimed_stale_leases"] += reclaimed
                if active:
                    counts["retained_active"] += 1
                    continue
                final_path = Path(storage_dir) / f"{digest}.pdf"
                marker = state / f"{digest}.orphan.json"
                if marker.exists():
                    marked_at = _read_marked_at(marker, digest)
                    if marked_at is None:
                        counts["retained_error"] += 1
                        continue
                else:
                    try:
                        marked_at = final_path.stat().st_mtime
                    except OSError:
                        counts["deleted"] += 1
                        continue
                    if not math.isfinite(marked_at) or marked_at < 0:
                        counts["retained_error"] += 1
                        continue
                    _write_marker_unlocked(
                        storage_dir,
                        digest,
                        marked_at,
                    )
                if current_time - marked_at < grace:
                    counts["retained_grace"] += 1
                    continue
                if _database_references(
                    session_factory,
                    digest,
                    final_path,
                ):
                    marker.unlink(missing_ok=True)
                    counts["adopted_referenced"] += 1
                    continue
                hash_status, actual_digest, verified_fingerprint = (
                    _hash_orphan_candidate(final_path)
                )
                if hash_status == "missing":
                    marker.unlink(missing_ok=True)
                    counts["deleted"] += 1
                    continue
                if hash_status == "error":
                    marker.unlink(missing_ok=True)
                    counts["retained_error"] += 1
                    continue
                if hash_status == "conflict" or actual_digest != digest:
                    # A digest-shaped filename is not proof of ownership.
                    # Retain unrelated content and remove the stale state that
                    # could make a later cleanup attempt delete it.
                    marker.unlink(missing_ok=True)
                    counts["retained_conflict"] += 1
                    continue
                if hash_status != "ok" or verified_fingerprint is None:
                    marker.unlink(missing_ok=True)
                    counts["retained_error"] += 1
                    continue
                active, reclaimed = _active_leases_and_reclaim_stale(
                    storage_dir,
                    digest,
                    now=current_time,
                    stale_seconds=lease_stale,
                )
                counts["reclaimed_stale_leases"] += reclaimed
                if active:
                    counts["retained_active"] += 1
                    continue
                if _database_references(
                    session_factory,
                    digest,
                    final_path,
                ):
                    marker.unlink(missing_ok=True)
                    counts["adopted_referenced"] += 1
                    continue
                lock.assert_owner()
                if not _fingerprint_matches(
                    final_path,
                    verified_fingerprint,
                ):
                    marker.unlink(missing_ok=True)
                    counts["retained_error"] += 1
                    continue
                final_path.unlink(missing_ok=True)
                marker.unlink(missing_ok=True)
                counts["deleted"] += 1
        except Exception:
            counts["retained_error"] += 1
    return OrphanCleanupResult(**counts)
