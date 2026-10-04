from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .learning import FEEDBACK_PROMPT_VERSION, build_feedback_prompt
from .learning_api import _attempt_dict, _json, _provider, _require_active
from .models import LearningAttempt
from .providers import ModelProviderError
from .schemas import LearningAttemptResponse, LearningFeedbackRequest


def register_learning_feedback_routes(app, get_db) -> None:
    router = APIRouter(prefix="/api/v1/learning", tags=["learning-feedback"])

    @router.post("/attempts/{attempt_id}/feedback", response_model=LearningAttemptResponse)
    def generate_feedback(
        attempt_id: int,
        payload: LearningFeedbackRequest,
        db: Session = Depends(get_db),
    ) -> LearningAttemptResponse:
        attempt = db.get(LearningAttempt, attempt_id)
        if attempt is None or attempt.question.question_type != "short_answer":
            raise HTTPException(404, "简答作答不存在")
        _require_active(attempt.question.pack)
        if attempt.feedback_markdown and not payload.regenerate:
            raise HTTPException(409, "已有反馈，重新生成需要明确确认")
        prompt = build_feedback_prompt(
            attempt.question.prompt,
            attempt.answer,
            [
                value
                for value in _json(attempt.question.reference_points_json, [])
                if isinstance(value, str)
            ],
            [
                value
                for value in _json(attempt.question.evidence_json, [])
                if isinstance(value, dict)
            ],
        )
        provider = _provider(db)
        try:
            result = provider.generate_learning_feedback(prompt)
        except ModelProviderError as exc:
            raise HTTPException(502, str(exc)) from exc
        attempt.feedback_markdown = result.feedback_markdown
        attempt.feedback_provider = provider.name
        attempt.feedback_model_name = result.model_name
        attempt.feedback_prompt_version = FEEDBACK_PROMPT_VERSION
        attempt.feedback_evidence_status = result.evidence_status
        attempt.feedback_generated_at = datetime.utcnow()
        db.commit()
        db.refresh(attempt)
        return LearningAttemptResponse.model_validate(_attempt_dict(attempt))

    app.include_router(router)
