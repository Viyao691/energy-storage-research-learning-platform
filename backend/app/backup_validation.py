"""Validate a Harness data root before backup or restore."""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


class BackupValidationError(RuntimeError):
    """A safe, user-facing validation failure."""


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def require_quick_check(results: Iterable[str]) -> str:
    rows = [str(item).strip() for item in results]
    if rows != ["ok"]:
        raise BackupValidationError("SQLite 完整性检查失败。")
    return "ok"


def _resolve_data_root(data_root: Path) -> Path:
    try:
        root = data_root.resolve(strict=True)
    except OSError as exc:
        raise BackupValidationError("备份数据目录不存在或无法读取。") from exc
    if not root.is_dir():
        raise BackupValidationError("备份数据目录不存在或无法读取。")
    return root


def _resolve_database(root: Path) -> Path:
    database = root / "energy_copilot.db"
    if not database.is_file() or database.is_symlink():
        raise BackupValidationError("备份中缺少 SQLite 数据库。")
    return database


def _read_database(database: Path) -> tuple[str, str, list[str]]:
    try:
        connection = sqlite3.connect(f"{database.as_uri()}?mode=ro", uri=True)
        try:
            quick_check = require_quick_check(
                row[0] for row in connection.execute("PRAGMA quick_check").fetchall()
            )
            try:
                alembic_row = connection.execute(
                    "SELECT version_num FROM alembic_version LIMIT 1"
                ).fetchone()
            except sqlite3.DatabaseError as exc:
                raise BackupValidationError("备份中缺少 Alembic 版本信息。") from exc
            if not alembic_row or not str(alembic_row[0]).strip():
                raise BackupValidationError("备份中缺少 Alembic 版本信息。")
            try:
                references = [
                    str(row[0])
                    for row in connection.execute(
                        "SELECT file_path FROM papers WHERE file_path IS NOT NULL AND file_path != ''"
                    ).fetchall()
                ]
            except sqlite3.DatabaseError as exc:
                raise BackupValidationError("无法读取论文文件引用。") from exc
        finally:
            connection.close()
    except BackupValidationError:
        raise
    except (OSError, sqlite3.DatabaseError) as exc:
        raise BackupValidationError("SQLite 完整性检查失败。") from exc
    return quick_check, str(alembic_row[0]), references


def _reject_links(root: Path) -> None:
    papers_root = root / "papers"
    for path in root.rglob("*"):
        if path.is_symlink():
            try:
                resolved = path.resolve(strict=False)
                in_root = resolved.is_relative_to(root)
            except (OSError, ValueError):
                in_root = False
            if not in_root and path.is_relative_to(papers_root):
                raise BackupValidationError("论文目录包含越界符号链接。")
            raise BackupValidationError("备份数据包含符号链接。")
        if path.is_file():
            try:
                if path.stat().st_nlink > 1:
                    raise BackupValidationError("备份数据包含硬链接。")
            except OSError as exc:
                raise BackupValidationError("备份数据文件无法安全读取。") from exc


def _paper_files(root: Path) -> list[Path]:
    papers_root = root / "papers"
    if not papers_root.exists():
        return []
    return sorted(path for path in papers_root.rglob("*") if path.is_file())


def _map_stored_path(root: Path, stored_path: str) -> tuple[Path, str]:
    normalized = stored_path.replace("\\", "/")
    if normalized == "/app/data":
        candidate = root
    elif normalized.startswith("/app/data/"):
        candidate = root / normalized.removeprefix("/app/data/")
    else:
        raw = Path(stored_path)
        candidate = raw if raw.is_absolute() else root / raw
    resolved = candidate.resolve(strict=False)
    try:
        relative = resolved.relative_to(root).as_posix()
    except ValueError as exc:
        raise BackupValidationError("论文文件引用超出备份数据目录。") from exc
    return resolved, relative


def inspect_data_root(data_root: Path) -> dict[str, object]:
    root = _resolve_data_root(data_root)
    _reject_links(root)
    database = _resolve_database(root)
    quick_check, alembic_version, references = _read_database(database)
    paper_files = _paper_files(root)
    missing: list[str] = []
    for stored_path in references:
        mapped, label = _map_stored_path(root, stored_path)
        if not mapped.is_file():
            missing.append(label)
    if missing:
        raise BackupValidationError(f"论文文件不完整，共缺少 {len(missing)} 个。")
    return {
        "status": "ok",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "database": {
            "path": "energy_copilot.db",
            "size_bytes": database.stat().st_size,
            "sha256": _sha256_file(database),
            "quick_check": quick_check,
            "alembic_version": alembic_version,
        },
        "papers": {
            "directory": "papers",
            "file_count": len(paper_files),
            "total_bytes": sum(path.stat().st_size for path in paper_files),
            "referenced_file_count": len(references),
            "missing_referenced_files": [],
        },
    }


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", required=True, type=Path)
    parser.add_argument("--output-json", type=Path)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        report = inspect_data_root(args.data_root)
    except BackupValidationError as exc:
        print(json.dumps({"status": "error", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1
    payload = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output_json is not None:
        args.output_json.write_text(f"{payload}\n", encoding="utf-8")
    print(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
