"""Small in-process scheduler for persisted research subscriptions."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from contextlib import suppress
from datetime import datetime
from typing import Any

from sqlalchemy import select

from app.models import ResearchSubscription


class ResearchRunInProgress(RuntimeError):
    """Raised when a subscription already has an in-process run."""


class ResearchScheduler:
    """Run due subscriptions serially and prevent duplicate manual runs."""

    def __init__(
        self,
        *,
        session_factory: Callable[[], Any],
        research_service: Any,
        now_provider: Callable[[], datetime] = datetime.utcnow,
    ) -> None:
        self._session_factory = session_factory
        self._research_service = research_service
        self._now_provider = now_provider
        self._locks: dict[int, asyncio.Lock] = {}
        self._task: asyncio.Task[None] | None = None
        self._last_error: str | None = None

    async def start(self) -> None:
        if self._task is not None and not self._task.done():
            return
        self._last_error = None
        self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        task, self._task = self._task, None
        if task is None:
            return
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task

    async def run_due_once(self) -> list[Any]:
        now = self._now_provider()
        with self._session_factory() as db:
            subscription_ids = list(
                db.scalars(
                    select(ResearchSubscription.id)
                    .where(
                        ResearchSubscription.enabled.is_(True),
                        ResearchSubscription.next_run_at.is_not(None),
                        ResearchSubscription.next_run_at <= now,
                    )
                    .order_by(
                        ResearchSubscription.next_run_at,
                        ResearchSubscription.id,
                    )
                )
            )
        results = []
        for subscription_id in subscription_ids:
            try:
                if not self._is_still_due(subscription_id, now):
                    continue
                results.append(await self.run_now(subscription_id))
            except (ResearchRunInProgress, ValueError):
                continue
        return results

    def _is_still_due(self, subscription_id: int, now: datetime) -> bool:
        with self._session_factory() as db:
            return db.scalar(
                select(ResearchSubscription.id).where(
                    ResearchSubscription.id == subscription_id,
                    ResearchSubscription.enabled.is_(True),
                    ResearchSubscription.next_run_at.is_not(None),
                    ResearchSubscription.next_run_at <= now,
                )
            ) is not None

    async def run_now(self, subscription_id: int) -> Any:
        lock = self._locks.setdefault(subscription_id, asyncio.Lock())
        if lock.locked():
            raise ResearchRunInProgress("research subscription run is already in progress")
        async with lock:
            return await self._research_service.run_subscription(subscription_id)

    def is_running(self, subscription_id: int) -> bool:
        lock = self._locks.get(subscription_id)
        return lock.locked() if lock is not None else False

    def diagnostic_status(self) -> dict[str, object]:
        if self._task is None or self._task.cancelled():
            status = "stopped"
            message = "研究订阅调度器未运行"
        elif self._task.done() or self._last_error is not None:
            status = "error"
            message = "研究订阅调度器最近一次检查失败"
        else:
            status = "running"
            message = "研究订阅调度器正在运行"
        return {
            "status": status,
            "message": message,
            "interval_seconds": 60,
            "running_subscription_ids": sorted(
                subscription_id
                for subscription_id, lock in self._locks.items()
                if lock.locked()
            ),
        }

    async def _loop(self) -> None:
        await self._run_due_safely()
        while True:
            await asyncio.sleep(60)
            await self._run_due_safely()

    async def _run_due_safely(self) -> None:
        try:
            await self.run_due_once()
        except asyncio.CancelledError:
            raise
        except Exception:
            self._last_error = "研究订阅调度任务异常"
        else:
            self._last_error = None
