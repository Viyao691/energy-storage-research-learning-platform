"""Safe application backup creation and inventory."""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import shutil
import sqlite3
import subprocess
import tarfile
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.engine import make_url

from app.config import AppSettings


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


class BackupManager:
    def __init__(self, settings: AppSettings) -> None:
        self.settings = settings
        self.directory = settings.backup_dir

    def _backup_database(self, temporary: Path) -> Path:
        url = make_url(self.settings.database_url)
        if url.drivername.startswith("sqlite") and url.database:
            destination = temporary / "database.sqlite3"
            source = sqlite3.connect(Path(url.database).resolve())
            target = sqlite3.connect(destination)
            try:
                source.backup(target)
            finally:
                target.close(); source.close()
            return destination
        if url.drivername.startswith("postgresql"):
            destination = temporary / "database.pg_dump"
            environment = os.environ.copy()
            if url.password:
                environment["PGPASSWORD"] = url.password
            command = ["pg_dump", "--format=custom", "--file", str(destination)]
            if url.host: command.extend(["--host", url.host])
            if url.port: command.extend(["--port", str(url.port)])
            if url.username: command.extend(["--username", url.username])
            if url.database: command.append(url.database)
            try:
                subprocess.run(command, check=True, env=environment, capture_output=True, text=True, timeout=1800)
            except (OSError, subprocess.SubprocessError) as exc:
                raise RuntimeError("PostgreSQL 备份失败，请检查 pg_dump 与数据库连接") from exc
            return destination
        raise RuntimeError("不支持当前数据库类型的备份")

    def create(self) -> dict[str, object]:
        self.directory.mkdir(parents=True, exist_ok=True)
        stamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S%fZ")
        archive = self.directory / f"energy-backup-{stamp}.tar.gz"
        manifest: list[dict[str, object]] = []
        with tempfile.TemporaryDirectory(prefix="energy-backup-") as temporary_name:
            temporary = Path(temporary_name)
            database = self._backup_database(temporary)
            manifest.append({"path": database.name, "size": database.stat().st_size, "sha256": _sha256(database)})
            files_root = temporary / "files"
            for source in sorted(self.settings.paper_storage_dir.rglob("*")) if self.settings.paper_storage_dir.exists() else []:
                if not source.is_file():
                    continue
                relative = source.relative_to(self.settings.paper_storage_dir)
                if "cache" in relative.parts or source.suffix == ".tmp" or source.name in {".env", "runtime-secret.key", "runtime-secrets.json"}:
                    continue
                destination = files_root / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, destination)
                manifest.append({"path": f"files/{relative.as_posix()}", "size": destination.stat().st_size, "sha256": _sha256(destination)})
            manifest_path = temporary / "manifest.json"
            manifest_path.write_text(json.dumps({"created_at": datetime.utcnow().isoformat(), "files": manifest}, ensure_ascii=False, indent=2), encoding="utf-8")
            with tarfile.open(archive, "w:gz") as bundle:
                bundle.add(database, arcname=database.name)
                if files_root.exists():
                    bundle.add(files_root, arcname="files")
                bundle.add(manifest_path, arcname="manifest.json")
        self._apply_retention()
        return self.describe(archive)

    def _apply_retention(self) -> None:
        archives = sorted(self.directory.glob("energy-backup-*.tar.gz"), key=lambda item: item.stat().st_mtime, reverse=True)
        for stale in archives[self.settings.backup_retention:]:
            stale.unlink(missing_ok=True)

    def describe(self, path: Path) -> dict[str, object]:
        file_count = 0
        try:
            with tarfile.open(path, "r:gz") as bundle:
                member = bundle.extractfile("manifest.json")
                if member:
                    file_count = len(json.loads(member.read().decode("utf-8")).get("files", []))
        except (tarfile.TarError, OSError, ValueError):
            pass
        return {"name": path.name, "created_at": datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc), "size_bytes": path.stat().st_size, "sha256": _sha256(path), "file_count": file_count}

    def list(self) -> list[dict[str, object]]:
        if not self.directory.exists():
            return []
        return [self.describe(path) for path in sorted(self.directory.glob("energy-backup-*.tar.gz"), key=lambda item: item.stat().st_mtime, reverse=True)]

    def delete(self, name: str) -> dict[str, object]:
        if Path(name).name != name or not name.startswith("energy-backup-") or not name.endswith(".tar.gz"):
            raise ValueError("备份文件名无效")
        archives = sorted(self.directory.glob("energy-backup-*.tar.gz")) if self.directory.exists() else []
        target = next((path for path in archives if path.name == name), None)
        if target is None:
            raise FileNotFoundError(name)
        if len(archives) <= 1:
            raise RuntimeError("至少保留一份备份")
        target.unlink()
        return {"deleted_name": name, "remaining_count": len(archives) - 1}

    def restore_sqlite_test_copy(self, archive: Path, destination: Path) -> None:
        """Restore to a separate SQLite file and verify hashes/integrity."""
        with tarfile.open(archive, "r:gz") as bundle:
            manifest_member = bundle.extractfile("manifest.json")
            database_member = bundle.extractfile("database.sqlite3")
            if manifest_member is None or database_member is None:
                raise RuntimeError("备份不包含 SQLite 数据库或清单")
            manifest = json.loads(manifest_member.read().decode("utf-8"))
            expected = next((item for item in manifest.get("files", []) if item.get("path") == "database.sqlite3"), None)
            payload = database_member.read()
            if expected is None or hashlib.sha256(payload).hexdigest() != expected.get("sha256"):
                raise RuntimeError("备份数据库哈希校验失败")
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(payload)
        with sqlite3.connect(destination) as connection:
            if connection.execute("PRAGMA integrity_check").fetchone() != ("ok",):
                raise RuntimeError("恢复副本完整性检查失败")


class BackupScheduler:
    """One lightweight in-process schedule; the first run waits a full interval."""
    def __init__(self, manager: BackupManager) -> None:
        self.manager = manager
        self._task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None

    async def _run(self) -> None:
        interval = self.manager.settings.backup_interval_hours * 3600
        while True:
            await asyncio.sleep(interval)
            try:
                await asyncio.to_thread(self.manager.create)
            except Exception:
                # Readiness/diagnostics expose stale or missing backups; the
                # scheduler must never take down the API process.
                continue
