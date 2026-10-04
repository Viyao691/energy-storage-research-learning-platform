from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .learning_api import (
    _card_dict,
    _pack_or_404,
    _question_dict,
    _require_active,
    _require_writable,
    _task_dict,
)
from .models import LearningCard, LearningPlanTask, LearningQuestion
from .schemas import (
    LearningCardListResponse,
    LearningCardResponse,
    LearningOrderUpdate,
    LearningPlanTaskListResponse,
    LearningPlanTaskResponse,
    LearningQuestionListResponse,
    LearningQuestionResponse,
)


def _validate_complete_order(requested: list[int], current: list[int]) -> None:
    if len(requested) != len(current) or set(requested) != set(current):
        raise HTTPException(422, "排序必须提供当前范围内完整且唯一的 ID 列表")


def register_learning_ordering_routes(app, get_db) -> None:
    router = APIRouter(prefix="/api/v1/learning", tags=["learning-ordering"])

    @router.patch("/packs/{pack_id}/cards/order", response_model=LearningCardListResponse)
    def order_cards(
        pack_id: int, payload: LearningOrderUpdate, db: Session = Depends(get_db)
    ) -> LearningCardListResponse:
        pack = _pack_or_404(db, pack_id)
        _require_writable(pack)
        items = list(db.scalars(select(LearningCard).where(LearningCard.pack_id == pack.id)))
        by_id = {item.id: item for item in items}
        _validate_complete_order(payload.ids, list(by_id))
        for position, item_id in enumerate(payload.ids, start=1):
            by_id[item_id].position = position
        db.commit()
        return LearningCardListResponse(items=[LearningCardResponse.model_validate(_card_dict(by_id[item_id])) for item_id in payload.ids])

    @router.patch("/packs/{pack_id}/questions/order", response_model=LearningQuestionListResponse)
    def order_questions(
        pack_id: int, payload: LearningOrderUpdate, db: Session = Depends(get_db)
    ) -> LearningQuestionListResponse:
        pack = _pack_or_404(db, pack_id)
        _require_writable(pack)
        items = list(
            db.scalars(select(LearningQuestion).where(LearningQuestion.pack_id == pack.id))
        )
        by_id = {item.id: item for item in items}
        _validate_complete_order(payload.ids, list(by_id))
        for position, item_id in enumerate(payload.ids, start=1):
            by_id[item_id].position = position
        db.commit()
        return LearningQuestionListResponse(items=[LearningQuestionResponse.model_validate(_question_dict(by_id[item_id])) for item_id in payload.ids])

    @router.patch("/packs/{pack_id}/plan/tasks/order", response_model=LearningPlanTaskListResponse)
    def order_plan_tasks(
        pack_id: int, payload: LearningOrderUpdate, db: Session = Depends(get_db)
    ) -> LearningPlanTaskListResponse:
        pack = _pack_or_404(db, pack_id)
        _require_active(pack)
        if pack.plan is None:
            raise HTTPException(404, "学习计划不存在")
        incomplete = [task for task in pack.plan.tasks if task.completed_at is None]
        by_id = {item.id: item for item in incomplete}
        _validate_complete_order(payload.ids, list(by_id))
        occupied = {task.position for task in pack.plan.tasks if task.completed_at is not None}
        available: list[int] = []
        candidate = 1
        while len(available) < len(payload.ids):
            if candidate not in occupied:
                available.append(candidate)
            candidate += 1
        for position, item_id in zip(available, payload.ids, strict=True):
            by_id[item_id].position = position
        db.commit()
        return LearningPlanTaskListResponse(
            items=[
                LearningPlanTaskResponse.model_validate(_task_dict(task))
                for task in sorted(pack.plan.tasks, key=lambda item: (item.position, item.id))
            ]
        )

    app.include_router(router)
