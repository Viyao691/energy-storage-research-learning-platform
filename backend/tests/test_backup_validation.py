from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from pathlib import Path

import pytest


def _create_valid_data_root(data_root: Path) -> Path:
    papers_dir = data_root / "papers"
    papers_dir.mkdir(parents=True)
    paper_path = papers_dir / "sample.pdf"
    paper_path.write_bytes(b"%PDF-1.4\nHarness backup fixture\n")

    database_path = data_root / "energy_copilot.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE alembic_version (version_num TEXT NOT NULL)")
        connection.execute("INSERT INTO alembic_version (version_num) VALUES ('0022')")
        connection.execute("CREATE TABLE papers (id INTEGER PRIMARY KEY, file_path TEXT)")
        connection.execute(
            "INSERT INTO papers (id, file_path) VALUES (?, ?)",
            (1, "/app/data/papers/sample.pdf"),
        )
    return database_path


def _symlink_or_skip(link: Path, target: Path) -> None:
    try:
        link.symlink_to(target)
    except OSError as exc:
        pytest.skip(f"当前系统不允许创建测试符号链接：{exc.winerror or exc.errno}")


def test_inspect_data_root_reports_valid_database_and_papers(tmp_path: Path) -> None:
    database_path = _create_valid_data_root(tmp_path)

    from app.backup_validation import inspect_data_root

    report = inspect_data_root(tmp_path)

    assert report["database"]["quick_check"] == "ok"
    assert report["database"]["alembic_version"] == "0022"
    assert report["database"]["sha256"] == hashlib.sha256(database_path.read_bytes()).hexdigest()
    assert report["papers"]["file_count"] == 1
    assert report["papers"]["total_bytes"] == (tmp_path / "papers" / "sample.pdf").stat().st_size
    assert report["papers"]["referenced_file_count"] == 1
    assert report["papers"]["missing_referenced_files"] == []
    assert report["status"] == "ok"


def test_inspect_data_root_rejects_missing_database(tmp_path: Path) -> None:
    from app.backup_validation import BackupValidationError, inspect_data_root

    (tmp_path / "papers").mkdir()

    with pytest.raises(BackupValidationError, match="缺少 SQLite 数据库"):
        inspect_data_root(tmp_path)


def test_inspect_data_root_rejects_corrupt_database_without_leaking_contents(tmp_path: Path) -> None:
    from app.backup_validation import BackupValidationError, inspect_data_root

    (tmp_path / "papers").mkdir()
    secret_marker = "paper-secret-marker"
    (tmp_path / "energy_copilot.db").write_text(secret_marker, encoding="utf-8")

    with pytest.raises(BackupValidationError, match="SQLite 完整性检查失败") as error:
        inspect_data_root(tmp_path)

    assert secret_marker not in str(error.value)


def test_inspect_data_root_rejects_non_ok_quick_check() -> None:
    from app.backup_validation import BackupValidationError, require_quick_check

    with pytest.raises(BackupValidationError, match="SQLite 完整性检查失败"):
        require_quick_check(["row 2 missing from index papers"])


def test_inspect_data_root_rejects_missing_alembic_version_table(tmp_path: Path) -> None:
    from app.backup_validation import BackupValidationError, inspect_data_root

    (tmp_path / "papers").mkdir()
    with sqlite3.connect(tmp_path / "energy_copilot.db") as connection:
        connection.execute("CREATE TABLE papers (id INTEGER PRIMARY KEY, file_path TEXT)")

    with pytest.raises(BackupValidationError, match="缺少 Alembic 版本信息"):
        inspect_data_root(tmp_path)


def test_inspect_data_root_rejects_missing_referenced_paper(tmp_path: Path) -> None:
    from app.backup_validation import BackupValidationError, inspect_data_root

    _create_valid_data_root(tmp_path)
    (tmp_path / "papers" / "sample.pdf").unlink()

    with pytest.raises(BackupValidationError, match="论文文件不完整，共缺少 1 个"):
        inspect_data_root(tmp_path)


def test_inspect_data_root_remaps_app_data_references(tmp_path: Path) -> None:
    _create_valid_data_root(tmp_path)

    from app.backup_validation import inspect_data_root

    report = inspect_data_root(tmp_path)

    assert report["papers"]["referenced_file_count"] == 1
    assert report["papers"]["missing_referenced_files"] == []


def test_inspect_data_root_rejects_symlink_escaping_data_root(tmp_path: Path) -> None:
    from app.backup_validation import BackupValidationError, inspect_data_root

    _create_valid_data_root(tmp_path)
    outside = tmp_path.parent / "outside-paper.pdf"
    outside.write_bytes(b"outside")
    _symlink_or_skip(tmp_path / "papers" / "escape.pdf", outside)

    with pytest.raises(BackupValidationError, match="论文目录包含越界符号链接"):
        inspect_data_root(tmp_path)


def test_inspect_data_root_rejects_in_root_symlink(tmp_path: Path) -> None:
    from app.backup_validation import BackupValidationError, inspect_data_root

    _create_valid_data_root(tmp_path)
    _symlink_or_skip(tmp_path / "paper-alias.pdf", tmp_path / "papers" / "sample.pdf")

    with pytest.raises(BackupValidationError, match="备份数据包含符号链接"):
        inspect_data_root(tmp_path)


def test_inspect_data_root_rejects_hard_link(tmp_path: Path) -> None:
    from app.backup_validation import BackupValidationError, inspect_data_root

    _create_valid_data_root(tmp_path)
    os.link(tmp_path / "papers" / "sample.pdf", tmp_path / "paper-hard-link.pdf")

    with pytest.raises(BackupValidationError, match="备份数据包含硬链接"):
        inspect_data_root(tmp_path)


def test_cli_writes_the_same_json_to_stdout_and_output_file(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    from app.backup_validation import main

    _create_valid_data_root(tmp_path)
    output_path = tmp_path / "manifest.json"

    assert main(["--data-root", str(tmp_path), "--output-json", str(output_path)]) == 0

    stdout_report = json.loads(capsys.readouterr().out)
    assert json.loads(output_path.read_text(encoding="utf-8")) == stdout_report
    assert stdout_report["status"] == "ok"


def test_cli_returns_safe_json_error_for_invalid_data_root(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    from app.backup_validation import main

    assert main(["--data-root", str(tmp_path)]) == 1

    captured = capsys.readouterr()
    assert captured.out == ""
    assert json.loads(captured.err) == {
        "status": "error",
        "error": "备份中缺少 SQLite 数据库。",
    }
