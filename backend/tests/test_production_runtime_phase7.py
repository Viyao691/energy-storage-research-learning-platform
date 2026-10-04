from __future__ import annotations

import json
import tarfile
from datetime import datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from app.models import TaskRun
from app.worker import recover_interrupted_tasks


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'runtime.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("BACKUP_PATH", str(tmp_path / "backups"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("REDIS_URL", "")
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def test_0022_task_state_and_cooperative_cancel(client: TestClient) -> None:
    columns = {item["name"] for item in inspect(client.app.state.engine).get_columns("task_runs")}
    assert {"resource_type", "resource_id", "queue_job_id", "progress", "attempt_count", "error_code", "cancel_requested", "started_at", "completed_at"}.issubset(columns)
    created = client.post("/api/v1/tasks", json={"task_name": "test_local", "resource_type": "dataset", "resource_id": 1, "idempotent": True, "paid": False})
    assert created.status_code == 201
    assert created.json()["max_attempts"] == 2
    cancelled = client.post(f"/api/v1/tasks/{created.json()['id']}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["cancel_requested"] is True
    assert cancelled.json()["status"] == "cancelled"


def test_worker_startup_marks_abandoned_running_tasks_interrupted(client: TestClient) -> None:
    with client.app.state.session_factory() as db:
        item = TaskRun(task_name="test_local", status="running", attempt_count=1)
        db.add(item)
        db.commit()
        task_id = item.id

    assert recover_interrupted_tasks(client.app.state.session_factory) == 1
    response = client.get(f"/api/v1/tasks/{task_id}")
    assert response.json()["status"] == "interrupted"
    assert response.json()["error_code"] == "worker_interrupted"


def test_live_ready_metrics_and_redacted_diagnostics(client: TestClient) -> None:
    assert client.get("/health/live").json() == {"status": "alive"}
    ready = client.get("/health/ready")
    assert ready.status_code == 200
    assert ready.json()["database"] == "ok"
    metrics = client.get("/metrics")
    assert metrics.status_code == 200
    assert "energy_research_http_requests_total" in metrics.text
    diagnostics = client.get("/api/v1/diagnostics").json()
    assert {"redis", "worker", "storage", "backups"}.issubset(diagnostics)
    assert "secret" not in json.dumps(diagnostics).lower()


def test_backup_manifest_retention_and_safe_cleanup(client: TestClient, tmp_path: Path) -> None:
    papers = tmp_path / "papers"
    papers.mkdir(parents=True, exist_ok=True)
    (papers / "kept.pdf").write_bytes(b"%PDF-safe")
    cache = papers / "cache"
    cache.mkdir()
    (cache / "preview.tmp").write_bytes(b"regenerable")
    (tmp_path / ".env").write_text("MODEL_API_KEY=fake-secret-token", encoding="utf-8")

    backup = client.post("/api/v1/maintenance/backups").json()
    archive = tmp_path / "backups" / backup["name"]
    assert archive.is_file()
    with tarfile.open(archive, "r:gz") as bundle:
        names = bundle.getnames()
        assert any(name.endswith("manifest.json") for name in names)
        assert not any(".env" in name or "runtime-secret" in name for name in names)
    assert client.get("/api/v1/maintenance/backups").json()[0]["sha256"] == backup["sha256"]
    restored = tmp_path / "restore-drill.sqlite3"
    client.app.state.backup_manager.restore_sqlite_test_copy(archive, restored)
    assert restored.is_file()

    preview = client.post("/api/v1/maintenance/storage/cleanup/preview").json()
    assert preview["paths"] == ["cache/preview.tmp"]
    assert (papers / "kept.pdf").is_file()
    confirmed = client.post("/api/v1/maintenance/storage/cleanup/confirm", json={"token": preview["token"]})
    assert confirmed.status_code == 200
    assert not (cache / "preview.tmp").exists()
    assert (papers / "kept.pdf").is_file()


def test_backup_created_at_is_explicit_utc(client: TestClient) -> None:
    backup = client.post("/api/v1/maintenance/backups").json()

    created_at = datetime.fromisoformat(backup["created_at"].replace("Z", "+00:00"))

    assert created_at.utcoffset() == timedelta(0)


def test_delete_non_final_backup_and_protect_last(client: TestClient, tmp_path: Path) -> None:
    created = [client.post("/api/v1/maintenance/backups").json() for _ in range(2)]

    deleted = client.delete(f"/api/v1/maintenance/backups/{created[0]['name']}")

    assert deleted.status_code == 200
    assert deleted.json() == {"deleted_name": created[0]["name"], "remaining_count": 1}
    assert not (tmp_path / "backups" / created[0]["name"]).exists()
    assert (tmp_path / "backups" / created[1]["name"]).is_file()
    protected = client.delete(f"/api/v1/maintenance/backups/{created[1]['name']}")
    assert protected.status_code == 409
    assert protected.json()["detail"] == "至少保留一份备份"


def test_delete_backup_rejects_missing_and_invalid_name(client: TestClient) -> None:
    missing = client.delete("/api/v1/maintenance/backups/energy-backup-missing.tar.gz")

    assert missing.status_code == 404
    with pytest.raises(ValueError, match="备份文件名无效"):
        client.app.state.backup_manager.delete("../outside.tar.gz")
