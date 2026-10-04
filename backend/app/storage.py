"""Managed file storage adapters for local files and S3-compatible services."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Protocol

from app.config import AppSettings


@dataclass(frozen=True)
class StoredObject:
    key: str
    size: int


class StorageProvider(Protocol):
    def put_bytes(self, key: str, data: bytes) -> StoredObject: ...
    def get_bytes(self, key: str) -> bytes: ...
    def delete(self, key: str) -> None: ...
    def list(self, prefix: str = "") -> list[StoredObject]: ...
    def health(self) -> tuple[bool, str]: ...


def _safe_key(key: str) -> str:
    candidate = PurePosixPath(key.replace("\\", "/"))
    if candidate.is_absolute() or not candidate.parts or any(part in {"", ".", ".."} for part in candidate.parts):
        raise ValueError("storage key must be a safe relative path")
    return candidate.as_posix()


class LocalStorageProvider:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()

    def _path(self, key: str) -> Path:
        path = (self.root / _safe_key(key)).resolve()
        if self.root not in path.parents:
            raise ValueError("storage key escapes managed root")
        return path

    def put_bytes(self, key: str, data: bytes) -> StoredObject:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_name(f".{path.name}.tmp")
        temporary.write_bytes(data)
        temporary.replace(path)
        return StoredObject(_safe_key(key), len(data))

    def get_bytes(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)

    def list(self, prefix: str = "") -> list[StoredObject]:
        if not self.root.exists():
            return []
        safe_prefix = _safe_key(prefix) if prefix else ""
        return [StoredObject(path.relative_to(self.root).as_posix(), path.stat().st_size) for path in sorted(self.root.rglob("*")) if path.is_file() and (not safe_prefix or path.relative_to(self.root).as_posix().startswith(safe_prefix))]

    def health(self) -> tuple[bool, str]:
        try:
            self.root.mkdir(parents=True, exist_ok=True)
            probe = self.root / ".storage-health.tmp"
            probe.write_bytes(b"ok")
            probe.unlink()
            return True, "local storage writable"
        except OSError:
            return False, "local storage unavailable"


class S3StorageProvider:
    def __init__(self, *, bucket: str, region: str, endpoint_url: str, access_key: str, secret_key: str) -> None:
        if not bucket:
            raise ValueError("S3 bucket is required")
        import boto3

        self.bucket = bucket
        self.client = boto3.client("s3", region_name=region, endpoint_url=endpoint_url or None, aws_access_key_id=access_key or None, aws_secret_access_key=secret_key or None)

    def put_bytes(self, key: str, data: bytes) -> StoredObject:
        safe = _safe_key(key); self.client.put_object(Bucket=self.bucket, Key=safe, Body=data)
        return StoredObject(safe, len(data))

    def get_bytes(self, key: str) -> bytes:
        return self.client.get_object(Bucket=self.bucket, Key=_safe_key(key))["Body"].read()

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=_safe_key(key))

    def list(self, prefix: str = "") -> list[StoredObject]:
        safe_prefix = _safe_key(prefix) if prefix else ""
        paginator = self.client.get_paginator("list_objects_v2")
        return [StoredObject(item["Key"], int(item["Size"])) for page in paginator.paginate(Bucket=self.bucket, Prefix=safe_prefix) for item in page.get("Contents", [])]

    def health(self) -> tuple[bool, str]:
        try:
            self.client.head_bucket(Bucket=self.bucket)
            return True, "S3 bucket reachable"
        except Exception:
            return False, "S3 bucket unavailable"


def make_storage_provider(settings: AppSettings) -> StorageProvider:
    if settings.storage_backend == "s3":
        return S3StorageProvider(bucket=settings.s3_bucket, region=settings.s3_region, endpoint_url=settings.s3_endpoint_url, access_key=settings.s3_access_key.get_secret_value(), secret_key=settings.s3_secret_key.get_secret_value())
    return LocalStorageProvider(settings.paper_storage_dir)
