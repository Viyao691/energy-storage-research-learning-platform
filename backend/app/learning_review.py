from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Literal, NamedTuple
from zoneinfo import ZoneInfo


ReviewRating = Literal["不会", "模糊", "基本掌握", "已掌握"]
MasteryStatus = Literal["学习中", "已掌握"]

REVIEW_INTERVAL_DAYS: dict[ReviewRating, int] = {
    "不会": 1,
    "模糊": 3,
    "基本掌握": 7,
    "已掌握": 30,
}


class ReviewDecision(NamedTuple):
    next_review_date: date
    mastery_status: MasteryStatus
    is_lapse: bool


def review_decision(rating: ReviewRating, today: date) -> ReviewDecision:
    return ReviewDecision(
        today + timedelta(days=REVIEW_INTERVAL_DAYS[rating]),
        "已掌握" if rating == "已掌握" else "学习中",
        rating == "不会",
    )


def local_today(timezone_name: str, now: datetime | None = None) -> date:
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    return current.astimezone(ZoneInfo(timezone_name)).date()
