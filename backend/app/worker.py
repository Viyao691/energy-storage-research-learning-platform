"""RQ worker entrypoint. The queue passes only a task_runs primary key."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import update

from app.database import make_session_factory
from app.models import TaskRun


def recover_interrupted_tasks(session_factory=None) -> int:
    """Persist a safe terminal state for jobs abandoned by a stopped worker."""
    factory = session_factory or make_session_factory()
    with factory() as db:
        result = db.execute(
            update(TaskRun)
            .where(TaskRun.status == "running")
            .values(
                status="interrupted",
                error_code="worker_interrupted",
                detail="worker 中断，任务未自动重复执行",
                completed_at=datetime.utcnow(),
            )
        )
        db.commit()
        return int(result.rowcount or 0)


def run_task(task_id: int) -> None:
    factory = make_session_factory()
    with factory() as db:
        task = db.get(TaskRun, task_id)
        if task is None:
            return
        if task.cancel_requested:
            task.status, task.completed_at = "cancelled", datetime.utcnow(); db.commit(); return
        task.status, task.started_at = "running", datetime.utcnow()
        task.attempt_count += 1; db.commit()
        try:
            if task.task_name == "test_local":
                task.detail = "本地幂等任务完成"
            else:
                raise RuntimeError("unknown_task")
            task.status, task.progress, task.completed_at = "completed", 1.0, datetime.utcnow()
        except Exception as exc:
            task.status, task.error_code, task.detail, task.completed_at = "failed", "task_failed", type(exc).__name__, datetime.utcnow()
            raise
        finally:
            db.commit()
