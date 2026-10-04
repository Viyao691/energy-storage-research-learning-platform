"""Persistent task, backup, storage maintenance and production health routes."""

from __future__ import annotations

import hashlib
from datetime import datetime
from pathlib import Path

from fastapi import Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.backups import BackupManager
from app.config import get_settings
from app.models import TaskRun
from app.observability import metrics_payload
from app.schemas import BackupDeleteResponse, BackupResponse, CleanupPreviewResponse, StorageStatsResponse, TaskRunResponse
from app.task_queue import TaskQueue


class TaskCreate(BaseModel):
    task_name: str = Field(min_length=1, max_length=100)
    resource_type: str | None = Field(default=None, max_length=80)
    resource_id: int | None = None
    idempotent: bool = False
    paid: bool = False


class CleanupConfirm(BaseModel):
    token: str = Field(min_length=64, max_length=64)


def _task_response(item: TaskRun) -> TaskRunResponse:
    return TaskRunResponse.model_validate(item, from_attributes=True)


def _cache_candidates(root: Path) -> list[Path]:
    cache = root / "cache"
    return [path for path in sorted(cache.rglob("*.tmp")) if path.is_file()] if cache.exists() else []


def _cleanup_token(root: Path, paths: list[Path]) -> str:
    material = "\n".join(f"{path.relative_to(root).as_posix()}:{path.stat().st_size}:{path.stat().st_mtime_ns}" for path in paths)
    return hashlib.sha256(material.encode()).hexdigest()


def register_runtime_routes(app, get_db) -> None:
    @app.post("/api/v1/tasks", response_model=TaskRunResponse, status_code=201)
    def create_task(payload: TaskCreate, db: Session = Depends(get_db)) -> TaskRunResponse:
        max_attempts = 2 if payload.idempotent and not payload.paid else 1
        item = TaskRun(task_name=payload.task_name, status="queued", resource_type=payload.resource_type, resource_id=payload.resource_id, max_attempts=max_attempts)
        db.add(item); db.commit(); db.refresh(item)
        try:
            item.queue_job_id = app.state.task_queue.enqueue(item.id, retry_once=max_attempts == 2)
            db.commit(); db.refresh(item)
        except Exception:
            item.status, item.error_code, item.detail = "failed", "queue_unavailable", "任务队列不可用"
            db.commit(); db.refresh(item)
        return _task_response(item)

    @app.get("/api/v1/tasks/{task_id}", response_model=TaskRunResponse)
    def get_task(task_id: int, db: Session = Depends(get_db)) -> TaskRunResponse:
        item = db.get(TaskRun, task_id)
        if item is None: raise HTTPException(status_code=404, detail="任务不存在")
        return _task_response(item)

    @app.post("/api/v1/tasks/{task_id}/cancel", response_model=TaskRunResponse)
    def cancel_task(task_id: int, db: Session = Depends(get_db)) -> TaskRunResponse:
        item = db.get(TaskRun, task_id)
        if item is None: raise HTTPException(status_code=404, detail="任务不存在")
        item.cancel_requested = True
        if item.status == "queued": item.status, item.completed_at = "cancelled", datetime.utcnow()
        db.commit(); db.refresh(item)
        return _task_response(item)

    @app.post("/api/v1/maintenance/backups", response_model=BackupResponse, status_code=201)
    def create_backup() -> BackupResponse:
        try: return BackupResponse(**app.state.backup_manager.create())
        except RuntimeError as exc: raise HTTPException(status_code=409, detail=str(exc)) from exc

    @app.get("/api/v1/maintenance/backups", response_model=list[BackupResponse])
    def list_backups() -> list[BackupResponse]:
        return [BackupResponse(**item) for item in app.state.backup_manager.list()]

    @app.delete("/api/v1/maintenance/backups/{name}", response_model=BackupDeleteResponse)
    def delete_backup(name: str) -> BackupDeleteResponse:
        try:
            return BackupDeleteResponse(**app.state.backup_manager.delete(name))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail="备份不存在") from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc

    @app.get("/api/v1/maintenance/storage", response_model=StorageStatsResponse)
    def storage_stats() -> StorageStatsResponse:
        settings = get_settings(); managed = app.state.storage_provider.list(); backups = app.state.backup_manager.list(); cache = _cache_candidates(settings.paper_storage_dir)
        return StorageStatsResponse(managed_bytes=sum(item.size for item in managed), managed_files=len(managed), backup_bytes=sum(int(item["size_bytes"]) for item in backups), backup_count=len(backups), cache_bytes=sum(path.stat().st_size for path in cache), cache_files=len(cache))

    @app.post("/api/v1/maintenance/storage/cleanup/preview", response_model=CleanupPreviewResponse)
    def cleanup_preview() -> CleanupPreviewResponse:
        root = get_settings().paper_storage_dir; paths = _cache_candidates(root)
        return CleanupPreviewResponse(token=_cleanup_token(root, paths), paths=[path.relative_to(root).as_posix() for path in paths], bytes_reclaimable=sum(path.stat().st_size for path in paths))

    @app.post("/api/v1/maintenance/storage/cleanup/confirm")
    def cleanup_confirm(payload: CleanupConfirm) -> dict[str, int]:
        root = get_settings().paper_storage_dir; paths = _cache_candidates(root)
        if payload.token != _cleanup_token(root, paths): raise HTTPException(status_code=409, detail="清理预览已变化，请重新预览")
        reclaimed = sum(path.stat().st_size for path in paths)
        for path in paths: path.unlink(missing_ok=True)
        return {"deleted_files": len(paths), "reclaimed_bytes": reclaimed}

    @app.get("/health/live")
    def live() -> dict[str, str]: return {"status": "alive"}

    @app.get("/health/ready")
    def ready() -> Response:
        database_ok, storage_ok, queue_ok = True, *app.state.storage_provider.health()[:1], *app.state.task_queue.health()[:1]
        try:
            with app.state.engine.connect() as connection: connection.exec_driver_sql("SELECT 1")
        except Exception: database_ok = False
        body = f'{{"status":"{"ready" if database_ok and storage_ok and queue_ok else "not_ready"}","database":"{"ok" if database_ok else "error"}","storage":"{"ok" if storage_ok else "error"}","queue":"{"ok" if queue_ok else "error"}"}}'
        return Response(content=body, status_code=200 if database_ok and storage_ok and queue_ok else 503, media_type="application/json")

    @app.get("/metrics")
    def metrics() -> Response:
        payload, media_type = metrics_payload(); return Response(content=payload, media_type=media_type)
