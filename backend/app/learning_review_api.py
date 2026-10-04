from __future__ import annotations

import json
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session

from .config import get_settings
from .learning_review import local_today, review_decision
from .models import LearningCard, LearningPack, LearningReviewEvent, LearningReviewState
from .schemas import (
    LearningCardResponse,
    LearningReviewItemResponse,
    LearningReviewQueueResponse,
    LearningReviewStateResponse,
    LearningReviewSubmit,
    LearningReviewSubmitResponse,
    LearningReviewUpdate,
)


def _today() -> date:
    return local_today(get_settings().user_timezone)


def _json_list(value: str) -> list[dict[str, object]]:
    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        return []
    if not isinstance(parsed, list):
        return []
    return [item for item in parsed if isinstance(item, dict)]


def review_state_dict(state: LearningReviewState | None) -> dict[str, object] | None:
    if state is None:
        return None
    return {
        "id": state.id,
        "pack_id": state.pack_id,
        "card_id": state.card_id,
        "last_rating": state.last_rating,
        "next_review_date": state.next_review_date,
        "review_count": state.review_count,
        "lapse_count": state.lapse_count,
        "is_paused": state.is_paused,
        "last_reviewed_at": state.last_reviewed_at,
    }


def review_card_dict(card: LearningCard) -> dict[str, object]:
    return {
        "id": card.id,
        "pack_id": card.pack_id,
        "concept": card.concept,
        "generated_content": card.generated_content,
        "content": card.content,
        "importance": card.importance,
        "common_mistake": card.common_mistake,
        "evidence": _json_list(card.evidence_json),
        "is_user_edited": card.is_user_edited,
        "mastery_status": card.mastery_status,
        "mastery_confirmed_at": card.mastery_confirmed_at,
        "position": card.position,
        "review_state": review_state_dict(card.review_state),
    }


def due_review_items(
    db: Session,
    today: date,
    pack_id: int | None = None,
) -> list[dict[str, object]]:
    query = (
        select(LearningReviewState)
        .join(LearningPack, LearningPack.id == LearningReviewState.pack_id)
        .where(
            LearningPack.lifecycle_status == "active",
            LearningReviewState.is_paused.is_(False),
            LearningReviewState.next_review_date <= today,
        )
        .order_by(
            LearningReviewState.next_review_date,
            LearningReviewState.pack_id,
            LearningReviewState.card_id,
        )
    )
    if pack_id is not None:
        query = query.where(LearningReviewState.pack_id == pack_id)
    return [
        {
            "state": review_state_dict(state),
            "pack_title": state.pack.title,
            "overdue_days": (today - state.next_review_date).days,
            "card": review_card_dict(state.card),
        }
        for state in db.scalars(query)
    ]


def register_learning_review_routes(app, get_db) -> None:
    router = APIRouter(prefix="/api/v1/learning", tags=["learning-review"])

    @router.get("/review-queue", response_model=LearningReviewQueueResponse)
    def review_queue(
        pack_id: int | None = None,
        db: Session = Depends(get_db),
    ) -> LearningReviewQueueResponse:
        today = _today()
        return LearningReviewQueueResponse(today=today.isoformat(), items=[LearningReviewItemResponse.model_validate(item) for item in due_review_items(db, today, pack_id)])

    @router.post("/cards/{card_id}/review", response_model=LearningReviewSubmitResponse)
    def submit_review(
        card_id: int,
        payload: LearningReviewSubmit,
        db: Session = Depends(get_db),
    ) -> LearningReviewSubmitResponse:
        card = db.get(LearningCard, card_id)
        if card is None:
            raise HTTPException(404, "知识卡片不存在")
        if card.pack.lifecycle_status != "active":
            raise HTTPException(409, "只有当前激活版本可以复习")
        decision = review_decision(payload.rating, _today())
        now = datetime.utcnow()
        state = db.scalar(
            select(LearningReviewState).where(LearningReviewState.card_id == card.id)
        )
        try:
            if state is None:
                state = LearningReviewState(
                    pack_id=card.pack_id,
                    card_id=card.id,
                    last_rating=payload.rating,
                    next_review_date=decision.next_review_date,
                    review_count=1,
                    lapse_count=1 if decision.is_lapse else 0,
                    is_paused=False,
                    last_reviewed_at=now,
                )
                db.add(state)
            else:
                if state.pack_id != card.pack_id:
                    raise HTTPException(409, "复习状态与学习包不一致")
                result = db.execute(
                    update(LearningReviewState)
                    .where(
                        LearningReviewState.id == state.id,
                        LearningReviewState.updated_at == state.updated_at,
                    )
                    .values(
                        last_rating=payload.rating,
                        next_review_date=decision.next_review_date,
                        review_count=state.review_count + 1,
                        lapse_count=state.lapse_count + (1 if decision.is_lapse else 0),
                        is_paused=False,
                        last_reviewed_at=now,
                        updated_at=now,
                    )
                    .execution_options(synchronize_session=False)
                )
                if result.rowcount != 1:
                    db.rollback()
                    raise HTTPException(409, "复习状态已被修改，请刷新后重试")
            card.mastery_status = decision.mastery_status
            card.mastery_confirmed_at = now if decision.mastery_status == "已掌握" else None
            db.add(
                LearningReviewEvent(
                    pack_id=card.pack_id,
                    card_id=card.id,
                    rating=payload.rating,
                    next_review_date=decision.next_review_date,
                    is_lapse=decision.is_lapse,
                    resulting_mastery=decision.mastery_status,
                    reviewed_at=now,
                )
            )
            db.commit()
        except HTTPException:
            raise
        except (IntegrityError, OperationalError) as exc:
            db.rollback()
            raise HTTPException(409, "复习状态发生并发冲突，请重试") from exc
        db.refresh(state)
        db.refresh(card)
        return LearningReviewSubmitResponse(
            state=LearningReviewStateResponse.model_validate(review_state_dict(state)),
            card=LearningCardResponse.model_validate(review_card_dict(card)),
        )

    @router.patch("/review-states/{state_id}", response_model=LearningReviewStateResponse)
    def update_review_state(
        state_id: int,
        payload: LearningReviewUpdate,
        db: Session = Depends(get_db),
    ) -> LearningReviewStateResponse:
        state = db.get(LearningReviewState, state_id)
        if state is None:
            raise HTTPException(404, "复习状态不存在")
        values: dict[str, object] = {"updated_at": datetime.utcnow()}
        if payload.next_review_date is not None:
            values["next_review_date"] = payload.next_review_date
        if payload.is_paused is not None:
            values["is_paused"] = payload.is_paused
        try:
            result = db.execute(
                update(LearningReviewState)
                .where(
                    LearningReviewState.id == state.id,
                    LearningReviewState.updated_at == state.updated_at,
                )
                .values(**values)
                .execution_options(synchronize_session=False)
            )
            if result.rowcount != 1:
                db.rollback()
                raise HTTPException(409, "复习状态已被修改，请刷新后重试")
            db.commit()
        except HTTPException:
            raise
        except (IntegrityError, OperationalError) as exc:
            db.rollback()
            raise HTTPException(409, "复习状态发生并发冲突，请重试") from exc
        db.refresh(state)
        return LearningReviewStateResponse.model_validate(review_state_dict(state))

    app.include_router(router)
