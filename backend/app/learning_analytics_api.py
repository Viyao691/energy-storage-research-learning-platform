from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import get_settings
from .learning_review import local_today
from .models import (
    LearningAttempt,
    LearningCard,
    LearningPack,
    LearningPlanTask,
    LearningReviewEvent,
    LearningReviewState,
    LearningWeakness,
)
from .schemas import LearningAnalyticsResponse


RATINGS = ("不会", "模糊", "基本掌握", "已掌握")
MASTERY_STATES = ("未学习", "学习中", "已掌握")


def _local_date(value: datetime, timezone_name: str) -> date:
    aware = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
    return aware.astimezone(ZoneInfo(timezone_name)).date()


def analytics_payload(db: Session, days: int) -> dict[str, object]:
    timezone_name = get_settings().user_timezone
    today = local_today(timezone_name)
    start = today - timedelta(days=days - 1)
    daily = {
        start + timedelta(days=offset): {"reviews": 0, "attempts": 0, "completed_tasks": 0}
        for offset in range(days)
    }
    ratings = {rating: 0 for rating in RATINGS}
    history_dates: list[date] = []
    for event in db.scalars(select(LearningReviewEvent)):
        event_date = _local_date(event.reviewed_at, timezone_name)
        history_dates.append(event_date)
        if event_date in daily:
            daily[event_date]["reviews"] += 1
            ratings[event.rating] += 1

    attempts = list(db.scalars(select(LearningAttempt)))
    for attempt in attempts:
        attempt_date = _local_date(attempt.created_at, timezone_name)
        if attempt_date in daily:
            daily[attempt_date]["attempts"] += 1
    scored = [attempt for attempt in attempts if attempt.result in {"correct", "partial", "wrong"}]
    correct_rate = (
        sum(attempt.result == "correct" for attempt in scored) / len(scored) if scored else None
    )

    for task in db.scalars(
        select(LearningPlanTask).where(LearningPlanTask.completed_at.is_not(None))
    ):
        completed_date = _local_date(task.completed_at, timezone_name)
        if completed_date in daily:
            daily[completed_date]["completed_tasks"] += 1

    active_pack_ids = set(
        db.scalars(
            select(LearningPack.id).where(LearningPack.lifecycle_status == "active")
        )
    )
    mastery = {state: 0 for state in MASTERY_STATES}
    if active_pack_ids:
        for status in db.scalars(
            select(LearningCard.mastery_status).where(LearningCard.pack_id.in_(active_pack_ids))
        ):
            if status in mastery:
                mastery[status] += 1
    due_count = db.scalar(
        select(func.count(LearningReviewState.id))
        .join(LearningPack, LearningPack.id == LearningReviewState.pack_id)
        .where(
            LearningPack.lifecycle_status == "active",
            LearningReviewState.is_paused.is_(False),
            LearningReviewState.next_review_date <= today,
        )
    ) or 0

    grouped: dict[str, dict[str, object]] = {}
    if active_pack_ids:
        for weakness in db.scalars(
            select(LearningWeakness).where(
                LearningWeakness.pack_id.in_(active_pack_ids),
                LearningWeakness.is_resolved.is_(False),
            )
        ):
            key = " ".join(weakness.concept.split()).casefold()
            item = grouped.setdefault(
                key,
                {
                    "concept": weakness.concept.strip(),
                    "packs": set(),
                    "occurrence_count": 0,
                    "recurrence_count": 0,
                },
            )
            item["packs"].add(weakness.pack_id)
            item["occurrence_count"] += weakness.occurrence_count
            item["recurrence_count"] += weakness.recurrence_count
    weaknesses = []
    for item in grouped.values():
        pack_count = len(item["packs"])
        occurrence_count = int(item["occurrence_count"])
        recurrence_count = int(item["recurrence_count"])
        weaknesses.append(
            {
                "concept": item["concept"],
                "score": round((occurrence_count + recurrence_count) / pack_count, 2),
                "pack_count": pack_count,
                "occurrence_count": occurrence_count,
                "recurrence_count": recurrence_count,
            }
        )
    weaknesses.sort(key=lambda item: (-item["score"], item["concept"]))

    return {
        "days": days,
        "from_date": start,
        "to_date": today,
        "history_start_date": min(history_dates) if history_dates else None,
        "daily": [
            {"date": day, **daily[day]}
            for day in sorted(daily)
        ],
        "rating_distribution": ratings,
        "correct_rate": correct_rate,
        "mastery_distribution": mastery,
        "due_review_count": due_count,
        "weaknesses": weaknesses,
    }


def register_learning_analytics_routes(app, get_db) -> None:
    router = APIRouter(prefix="/api/v1/learning", tags=["learning-analytics"])

    @router.get("/analytics", response_model=LearningAnalyticsResponse)
    def analytics(
        days: int = 30,
        db: Session = Depends(get_db),
    ) -> LearningAnalyticsResponse:
        if days not in {7, 30, 90}:
            raise HTTPException(422, "days 只支持 7、30 或 90")
        return LearningAnalyticsResponse.model_validate(analytics_payload(db, days))

    app.include_router(router)
