"""RQ adapter. Queue payloads are JSON and contain only persistent task IDs."""

from __future__ import annotations

from app.config import AppSettings


class TaskQueue:
    def __init__(self, settings: AppSettings) -> None:
        self.settings = settings

    @property
    def configured(self) -> bool:
        return bool(self.settings.redis_url.strip())

    def enqueue(self, task_id: int, *, retry_once: bool) -> str | None:
        if not self.configured:
            return None
        from redis import Redis
        from rq import Queue, Retry
        from rq.serializers import JSONSerializer

        queue = Queue(self.settings.rq_queue_name, connection=Redis.from_url(self.settings.redis_url), serializer=JSONSerializer)
        job = queue.enqueue("app.worker.run_task", task_id, retry=Retry(max=1) if retry_once else None)
        return job.id

    def health(self) -> tuple[bool, str]:
        if not self.configured:
            return True, "Redis/RQ 未配置，使用本地同步能力"
        try:
            from redis import Redis

            Redis.from_url(self.settings.redis_url, socket_connect_timeout=1, socket_timeout=1).ping()
            return True, "Redis 可用"
        except Exception:
            return False, "Redis 不可用"
