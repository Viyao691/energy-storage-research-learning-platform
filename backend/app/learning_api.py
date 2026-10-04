from __future__ import annotations

import json
import unicodedata
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .config import get_settings
from .learning import (
    CARDS_PROMPT_VERSION,
    CARDS_SCHEMA_VERSION,
    QUIZ_PROMPT_VERSION,
    QUIZ_SCHEMA_VERSION,
    QUIZ_V2_PROMPT_VERSION,
    QUIZ_V2_SCHEMA_VERSION,
    LearningEvidence,
    active_dates,
    analysis_snapshot_hash,
    build_cards_prompt,
    build_quiz_prompt,
    build_quiz_prompt_v2,
    current_reports,
    report_versions,
)
from .learning_review import local_today
from .learning_review_api import due_review_items, review_card_dict
from .models import (
    Analysis,
    LearningAttempt,
    LearningCard,
    LearningPack,
    LearningPackSource,
    LearningPlan,
    LearningPlanTask,
    LearningQuestion,
    LearningWeakness,
    Paper,
    PaperChunk,
)
from .providers import ModelProviderError, make_provider
from .schemas import (
    LearningAttemptCreate,
    LearningAttemptSelfRating,
    LearningCardUpdate,
    LearningMasteryUpdate,
    LearningPackCreate,
    LearningPackDeleteRequest,
    LearningPlanTaskUpdate,
    LearningPlanUpsert,
    LearningWeaknessCreate,
    LearningWeaknessTaskCreate,
    LearningWeaknessUpdate,
    LearningAttemptResponse,
    LearningCardGenerateResponse,
    LearningCardListResponse,
    LearningCardResponse,
    LearningEligiblePaperListResponse,
    LearningOverviewResponse,
    LearningPackListResponse,
    LearningPackResponse,
    LearningPaperCandidateListResponse,
    LearningPlanResponse,
    LearningPlanTaskResponse,
    LearningQuestionListResponse,
    LearningQuestionResponse,
    LearningQuizGenerateResponse,
    LearningReviewItemResponse,
    LearningWeaknessListResponse,
    LearningWeaknessResponse,
)
from .secrets import get_model_api_key


def _json(value: str, fallback: object) -> object:
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return fallback


def _normalize_answer(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).split()).casefold()


def _evidence_dict(item: LearningEvidence) -> dict[str, object]:
    return {
        "evidence_id": item.evidence_id,
        "paper_id": item.paper_id,
        "paper_title": item.paper_title,
        "page_number": item.page_number,
        "section": item.section,
        "excerpt": item.excerpt,
        "source_scope": item.source_scope,
    }


def _card_dict(card: LearningCard) -> dict[str, object]:
    return review_card_dict(card)


def _question_dict(question: LearningQuestion) -> dict[str, object]:
    return {
        "id": question.id,
        "pack_id": question.pack_id,
        "question_type": question.question_type,
        "prompt": question.prompt,
        "options": _json(question.options_json, []),
        "related_card_ids": _json(question.related_card_ids_json, []),
        "evidence": _json(question.evidence_json, []),
        "position": question.position,
        "attempts": [_attempt_dict(attempt, include_reference=False) for attempt in question.attempts],
    }


def _attempt_dict(attempt: LearningAttempt, *, include_reference: bool = True) -> dict[str, object]:
    result: dict[str, object] = {
        "id": attempt.id,
        "question_id": attempt.question_id,
        "answer": attempt.answer,
        "result": attempt.result,
        "self_rating": attempt.self_rating,
        "feedback_markdown": attempt.feedback_markdown,
        "feedback_provider": attempt.feedback_provider,
        "feedback_model_name": attempt.feedback_model_name,
        "feedback_prompt_version": attempt.feedback_prompt_version,
        "feedback_evidence_status": attempt.feedback_evidence_status,
        "feedback_generated_at": attempt.feedback_generated_at,
        "created_at": attempt.created_at,
    }
    if include_reference:
        result.update({
            "correct_answer": attempt.question.correct_answer,
            "explanation": attempt.question.explanation,
            "reference_points": _json(attempt.question.reference_points_json, []),
        })
    return result


def _weakness_dict(item: LearningWeakness) -> dict[str, object]:
    return {
        "id": item.id,
        "pack_id": item.pack_id,
        "card_id": item.card_id,
        "concept": item.concept,
        "description": item.description,
        "source": item.source,
        "occurrence_count": item.occurrence_count,
        "recurrence_count": item.recurrence_count,
        "is_resolved": item.is_resolved,
        "resolved_at": item.resolved_at,
    }


def _task_dict(item: LearningPlanTask) -> dict[str, object]:
    return {
        "id": item.id,
        "pack_id": item.plan.pack_id,
        "task_date": item.task_date,
        "task_type": item.task_type,
        "card_id": item.card_id,
        "question_id": item.question_id,
        "weakness_id": item.weakness_id,
        "title": item.title,
        "position": item.position,
        "completed_at": item.completed_at,
    }


def _plan_dict(plan: LearningPlan | None) -> dict[str, object] | None:
    if plan is None:
        return None
    return {
        "id": plan.id,
        "pack_id": plan.pack_id,
        "start_date": plan.start_date,
        "end_date": plan.end_date,
        "weekdays": _json(plan.weekdays_json, []),
        "tasks": [_task_dict(task) for task in plan.tasks],
    }


def _source_dict(source: LearningPackSource, db: Session) -> dict[str, object]:
    stale = False
    if source.paper_id is not None:
        analysis = db.scalar(select(Analysis).where(Analysis.paper_id == source.paper_id))
        available = current_reports(analysis) if analysis else []
        stale = bool(analysis and analysis_snapshot_hash(analysis, available) != source.analysis_hash)
    return {
        "id": source.id,
        "paper_id": source.paper_id,
        "paper_title": source.paper_title,
        "available_reports": _json(source.available_reports_json, []),
        "analysis_versions": _json(source.analysis_versions_json, {}),
        "analysis_hash": source.analysis_hash,
        "evidence_scope": source.evidence_scope,
        "source_has_newer_analysis": stale,
    }


def _pack_dict(pack: LearningPack, db: Session, *, detail: bool = False) -> dict[str, object]:
    result: dict[str, object] = {
        "id": pack.id,
        "title": pack.title,
        "learning_goal": pack.learning_goal,
        "cards_status": pack.cards_status,
        "quiz_status": pack.quiz_status,
        "cards_prompt_version": pack.cards_prompt_version,
        "cards_schema_version": pack.cards_schema_version,
        "quiz_prompt_version": pack.quiz_prompt_version,
        "quiz_schema_version": pack.quiz_schema_version,
        "provider": pack.provider,
        "model_name": pack.model_name,
        "lineage_id": pack.lineage_id,
        "version_number": pack.version_number,
        "lifecycle_status": pack.lifecycle_status,
        "archived_at": pack.archived_at,
        "last_error": pack.last_error,
        "created_at": pack.created_at,
        "updated_at": pack.updated_at,
        "source_count": len(pack.sources),
        "card_count": len(pack.cards),
        "question_count": len(pack.questions),
    }
    if detail:
        result.update({
            "sources": [_source_dict(source, db) for source in pack.sources],
            "cards": [_card_dict(card) for card in pack.cards],
            "questions": [_question_dict(question) for question in pack.questions],
            "weaknesses": [_weakness_dict(item) for item in pack.weaknesses],
            "plan": _plan_dict(pack.plan),
        })
    return result


def _is_eligible(paper: Paper, analysis: Analysis | None) -> tuple[bool, list[str]]:
    available = current_reports(analysis) if analysis else []
    fulltext = (
        paper.acquisition_status == "fulltext"
        and paper.fulltext_status == "已读取全文"
        and bool((paper.extracted_text or "").strip())
    )
    return paper.is_read and fulltext and bool(available), available


def _paper_candidate(paper: Paper, analysis: Analysis | None) -> dict[str, object]:
    eligible, available = _is_eligible(paper, analysis)
    fulltext_available = (
        paper.acquisition_status == "fulltext"
        and paper.fulltext_status == "已读取全文"
        and bool((paper.extracted_text or "").strip())
    )
    blocking_reasons: list[str] = []
    if not paper.is_read:
        blocking_reasons.append("尚未标记已读")
    if not fulltext_available:
        blocking_reasons.append("全文不可用")
    if not available:
        blocking_reasons.append("尚无当前版本解析")
    return {
        "id": paper.id,
        "title": paper.title,
        "journal": paper.journal,
        "published_date": paper.published_date,
        "available_reports": available,
        "eligible": eligible,
        "is_read": paper.is_read,
        "fulltext_available": fulltext_available,
        "blocking_reasons": blocking_reasons,
    }


def _provider(db: Session):
    from .routers._shared import _get_setting

    setting = _get_setting(db)
    return make_provider(
        setting.model_provider,
        get_model_api_key(setting.model_provider, setting.model_base_url),
        setting.model_base_url,
        setting.model_name,
        setting.timeout_seconds,
        setting.vision_model,
    )


def _pack_or_404(db: Session, pack_id: int) -> LearningPack:
    pack = db.get(LearningPack, pack_id)
    if pack is None:
        raise HTTPException(404, "学习包不存在")
    return pack


def _require_writable(pack: LearningPack) -> None:
    if pack.lifecycle_status == "archived":
        raise HTTPException(409, "归档学习包为只读状态")


def _require_active(pack: LearningPack) -> None:
    if pack.lifecycle_status != "active":
        raise HTTPException(409, "只有当前激活版本可以执行此操作")


def _generation_allowed(status: str, started_at: datetime | None) -> bool:
    return status in {"pending", "failed"} or (
        status == "generating" and started_at is not None and started_at <= datetime.utcnow() - timedelta(minutes=15)
    )


def _pack_material(db: Session, pack: LearningPack) -> tuple[str, list[LearningEvidence]]:
    report_parts: list[str] = []
    evidence: list[LearningEvidence] = []
    number = 1
    for source in pack.sources:
        if source.paper_id is None:
            raise HTTPException(409, f"来源论文“{source.paper_title}”已删除，不能继续生成")
        paper = db.get(Paper, source.paper_id)
        analysis = db.scalar(select(Analysis).where(Analysis.paper_id == source.paper_id))
        if paper is None or analysis is None:
            raise HTTPException(409, "来源论文或解析不可用")
        for report_type in _json(source.available_reports_json, []):
            report_parts.append(f"### {source.paper_title} / {report_type}\n{getattr(analysis, report_type, '')}")
        chunks = list(db.scalars(
            select(PaperChunk)
            .where(PaperChunk.paper_id == paper.id, PaperChunk.source_scope == "fulltext")
            .order_by(PaperChunk.page_number, PaperChunk.chunk_index)
            .limit(4)
        ))
        if not chunks:
            evidence.append(LearningEvidence(f"E{number}", paper.id, paper.title, None, "全文文本", paper.extracted_text[:1000], "fulltext"))
            number += 1
        for chunk in chunks:
            evidence.append(LearningEvidence(f"E{number}", paper.id, paper.title, chunk.page_number, chunk.section, chunk.content[:1200], "fulltext"))
            number += 1
    return "\n\n".join(report_parts), evidence


def _record_weakness(db: Session, question: LearningQuestion) -> None:
    card_ids = _json(question.related_card_ids_json, [])
    for card_id in card_ids:
        card = db.get(LearningCard, card_id)
        if card is None:
            continue
        item = db.scalar(select(LearningWeakness).where(
            LearningWeakness.pack_id == question.pack_id,
            LearningWeakness.card_id == card.id,
            LearningWeakness.source == "quiz",
        ))
        if item is None:
            db.add(LearningWeakness(pack_id=question.pack_id, card_id=card.id, concept=card.concept, description=f"自测未充分掌握：{question.prompt}", source="quiz"))
        else:
            item.occurrence_count += 1
            if item.is_resolved:
                item.recurrence_count += 1


def register_learning_routes(app, get_db) -> None:
    router = APIRouter(prefix="/api/v1/learning", tags=["learning"])

    @router.get("/eligible-papers", response_model=LearningEligiblePaperListResponse)
    def eligible_papers(db: Session = Depends(get_db)) -> LearningEligiblePaperListResponse:
        items: list[dict[str, object]] = []
        for paper in db.scalars(select(Paper).where(Paper.is_read.is_(True)).order_by(Paper.created_at.desc())):
            analysis = db.scalar(select(Analysis).where(Analysis.paper_id == paper.id))
            eligible, available = _is_eligible(paper, analysis)
            if eligible:
                items.append({"id": paper.id, "title": paper.title, "journal": paper.journal, "published_date": paper.published_date, "available_reports": available})
        return LearningEligiblePaperListResponse.model_validate({"items": items})

    @router.get("/paper-candidates", response_model=LearningPaperCandidateListResponse)
    def paper_candidates(db: Session = Depends(get_db)) -> LearningPaperCandidateListResponse:
        items: list[dict[str, object]] = []
        for paper in db.scalars(select(Paper).order_by(Paper.created_at.desc())):
            analysis = db.scalar(select(Analysis).where(Analysis.paper_id == paper.id))
            items.append(_paper_candidate(paper, analysis))
        return LearningPaperCandidateListResponse.model_validate({"items": items})

    @router.get("/overview", response_model=LearningOverviewResponse)
    def overview(db: Session = Depends(get_db)) -> LearningOverviewResponse:
        today = local_today(get_settings().user_timezone)
        packs = list(db.scalars(select(LearningPack).where(LearningPack.lifecycle_status == "active").order_by(LearningPack.updated_at.desc())))
        today_tasks = list(db.scalars(select(LearningPlanTask).join(LearningPlan).join(LearningPack).where(LearningPack.lifecycle_status == "active", LearningPlanTask.task_date == today).order_by(LearningPlanTask.position)))
        open_weaknesses = list(db.scalars(select(LearningWeakness).join(LearningPack).where(LearningPack.lifecycle_status == "active", LearningWeakness.is_resolved.is_(False)).order_by(LearningWeakness.updated_at.desc())))
        due_reviews = due_review_items(db, today)
        return LearningOverviewResponse(
            packs=[LearningPackResponse.model_validate(_pack_dict(pack, db)) for pack in packs],
            today_tasks=[LearningPlanTaskResponse.model_validate(_task_dict(task)) for task in today_tasks],
            open_weaknesses=[LearningWeaknessResponse.model_validate(_weakness_dict(item)) for item in open_weaknesses],
            due_reviews=[LearningReviewItemResponse.model_validate(item) for item in due_reviews],
            due_review_count=len(due_reviews),
        )

    @router.post("/packs", status_code=201, response_model=LearningPackResponse)
    def create_pack(payload: LearningPackCreate, db: Session = Depends(get_db)) -> LearningPackResponse:
        sources: list[tuple[Paper, Analysis, list[str]]] = []
        for paper_id in payload.paper_ids:
            paper = db.get(Paper, paper_id)
            analysis = db.scalar(select(Analysis).where(Analysis.paper_id == paper_id))
            if paper is None or analysis is None:
                raise HTTPException(422, f"论文 {paper_id} 不满足学习资格")
            eligible, available = _is_eligible(paper, analysis)
            if not eligible:
                raise HTTPException(422, f"论文“{paper.title}”必须已读、全文可用且含当前版本解析")
            sources.append((paper, analysis, available))
        pack = LearningPack(title=payload.title.strip(), learning_goal=payload.learning_goal.strip(), cards_prompt_version=CARDS_PROMPT_VERSION, cards_schema_version=CARDS_SCHEMA_VERSION, quiz_prompt_version=QUIZ_V2_PROMPT_VERSION, quiz_schema_version=QUIZ_V2_SCHEMA_VERSION)
        db.add(pack)
        db.flush()
        for paper, analysis, available in sources:
            db.add(LearningPackSource(pack_id=pack.id, paper_id=paper.id, paper_title=paper.title, available_reports_json=json.dumps(available, ensure_ascii=False), analysis_versions_json=json.dumps(report_versions(analysis, available), ensure_ascii=False), analysis_hash=analysis_snapshot_hash(analysis, available), evidence_scope="fulltext"))
        db.commit()
        db.refresh(pack)
        return LearningPackResponse.model_validate(_pack_dict(pack, db, detail=True))

    @router.get("/packs", response_model=LearningPackListResponse)
    def list_packs(status: str = "active", db: Session = Depends(get_db)) -> LearningPackListResponse:
        if status not in {"active", "draft", "archived", "all"}:
            raise HTTPException(422, "status 不合法")
        query = select(LearningPack).order_by(LearningPack.updated_at.desc())
        if status != "all":
            query = query.where(LearningPack.lifecycle_status == status)
        return LearningPackListResponse(items=[LearningPackResponse.model_validate(_pack_dict(item, db)) for item in db.scalars(query)])

    @router.get("/packs/{pack_id}", response_model=LearningPackResponse)
    def get_pack(pack_id: int, db: Session = Depends(get_db)) -> LearningPackResponse:
        return LearningPackResponse.model_validate(_pack_dict(_pack_or_404(db, pack_id), db, detail=True))

    @router.delete("/packs/{pack_id}", status_code=204)
    def delete_pack(pack_id: int, payload: LearningPackDeleteRequest, db: Session = Depends(get_db)) -> Response:
        pack = _pack_or_404(db, pack_id)
        _require_writable(pack)
        if payload.confirmation_title != pack.title:
            raise HTTPException(409, "确认标题与学习包完整标题不一致")
        db.delete(pack)
        db.commit()
        return Response(status_code=204)

    @router.post("/packs/{pack_id}/generate-cards", response_model=LearningCardGenerateResponse)
    def generate_cards(pack_id: int, db: Session = Depends(get_db)) -> LearningCardGenerateResponse:
        pack = _pack_or_404(db, pack_id)
        _require_writable(pack)
        if pack.cards or not _generation_allowed(pack.cards_status, pack.cards_started_at):
            raise HTTPException(409, "知识卡片已生成或正在生成")
        pack.cards_status, pack.cards_started_at, pack.last_error = "generating", datetime.utcnow(), None
        db.commit()
        reports, evidence = _pack_material(db, pack)
        provider = _provider(db)
        try:
            result = provider.generate_learning_cards(build_cards_prompt(pack.title, pack.learning_goal, reports, evidence), {item.evidence_id for item in evidence})
            evidence_map = {item.evidence_id: _evidence_dict(item) for item in evidence}
            for position, draft in enumerate(result.cards, start=1):
                snapshots = [evidence_map[value] for value in draft.evidence_ids]
                db.add(LearningCard(pack_id=pack.id, concept=draft.concept, generated_content=draft.content, content=draft.content, importance=draft.importance, common_mistake=draft.common_mistake, evidence_json=json.dumps(snapshots, ensure_ascii=False), mastery_status="未学习", position=position))
            pack.cards_status, pack.provider, pack.model_name = "completed", provider.name, result.model_name
            db.commit()
            db.refresh(pack)
            return LearningCardGenerateResponse(cards=[LearningCardResponse.model_validate(_card_dict(card)) for card in pack.cards], status=pack.cards_status)
        except (ModelProviderError, ValueError) as exc:
            db.rollback()
            pack = _pack_or_404(db, pack_id)
            pack.cards_status, pack.last_error = "failed", str(exc)
            db.commit()
            raise HTTPException(502, str(exc)) from exc

    @router.post("/packs/{pack_id}/generate-quiz", response_model=LearningQuizGenerateResponse)
    def generate_quiz(pack_id: int, db: Session = Depends(get_db)) -> LearningQuizGenerateResponse:
        pack = _pack_or_404(db, pack_id)
        _require_writable(pack)
        if pack.cards_status != "completed" or not pack.cards:
            raise HTTPException(409, "请先成功生成知识卡片")
        if pack.questions or not _generation_allowed(pack.quiz_status, pack.quiz_started_at):
            raise HTTPException(409, "自测题已生成或正在生成")
        pack.quiz_status, pack.quiz_started_at, pack.last_error = "generating", datetime.utcnow(), None
        db.commit()
        provider = _provider(db)
        card_payload = [{"position": card.position, "concept": card.concept, "content": card.content, "importance": card.importance, "common_mistake": card.common_mistake, "evidence_ids": [item["evidence_id"] for item in _json(card.evidence_json, [])]} for card in pack.cards]
        valid_evidence_ids = {value for item in card_payload for value in item["evidence_ids"]}
        try:
            quiz_prompt = (
                build_quiz_prompt_v2(pack.title, card_payload)
                if pack.quiz_schema_version == QUIZ_V2_SCHEMA_VERSION
                else build_quiz_prompt(pack.title, card_payload)
            )
            result = provider.generate_learning_quiz(quiz_prompt, {card.position for card in pack.cards}, valid_evidence_ids, pack.quiz_schema_version)
            cards_by_position = {card.position: card for card in pack.cards}
            evidence_by_id = {item["evidence_id"]: item for card in pack.cards for item in _json(card.evidence_json, [])}
            for position, draft in enumerate(result.questions, start=1):
                db.add(LearningQuestion(pack_id=pack.id, question_type=draft.question_type, prompt=draft.prompt, options_json=json.dumps(draft.options, ensure_ascii=False), correct_answer=draft.correct_answer, accepted_answers_json=json.dumps(draft.accepted_answers, ensure_ascii=False), explanation=draft.explanation, reference_points_json=json.dumps(draft.reference_points, ensure_ascii=False), related_card_ids_json=json.dumps([cards_by_position[value].id for value in draft.related_card_positions]), evidence_json=json.dumps([evidence_by_id[value] for value in draft.evidence_ids], ensure_ascii=False), position=position))
            pack.quiz_status, pack.provider, pack.model_name = "completed", provider.name, result.model_name
            db.commit()
            db.refresh(pack)
            return LearningQuizGenerateResponse(questions=[LearningQuestionResponse.model_validate(_question_dict(question)) for question in pack.questions], status=pack.quiz_status)
        except (ModelProviderError, ValueError) as exc:
            db.rollback()
            pack = _pack_or_404(db, pack_id)
            pack.quiz_status, pack.last_error = "failed", str(exc)
            db.commit()
            raise HTTPException(502, str(exc)) from exc

    @router.patch("/cards/{card_id}", response_model=LearningCardResponse)
    def update_card(card_id: int, payload: LearningCardUpdate, db: Session = Depends(get_db)) -> LearningCardResponse:
        card = db.get(LearningCard, card_id)
        if card is None:
            raise HTTPException(404, "知识卡片不存在")
        _require_writable(card.pack)
        for field in ("concept", "content", "importance", "common_mistake"):
            value = getattr(payload, field)
            if value is not None:
                setattr(card, field, value.strip())
        card.is_user_edited = True
        db.commit(); db.refresh(card)
        return LearningCardResponse.model_validate(_card_dict(card))

    @router.patch("/cards/{card_id}/mastery", response_model=LearningCardResponse)
    def update_mastery(card_id: int, payload: LearningMasteryUpdate, db: Session = Depends(get_db)) -> LearningCardResponse:
        card = db.get(LearningCard, card_id)
        if card is None:
            raise HTTPException(404, "知识卡片不存在")
        _require_active(card.pack)
        card.mastery_status = payload.mastery_status
        card.mastery_confirmed_at = datetime.utcnow()
        db.commit(); db.refresh(card)
        return LearningCardResponse.model_validate(_card_dict(card))

    @router.post("/questions/{question_id}/attempts", status_code=201, response_model=LearningAttemptResponse)
    def submit_attempt(question_id: int, payload: LearningAttemptCreate, db: Session = Depends(get_db)) -> LearningAttemptResponse:
        question = db.get(LearningQuestion, question_id)
        if question is None:
            raise HTTPException(404, "自测题不存在")
        _require_active(question.pack)
        result = "pending_self_review"
        if question.question_type == "multiple_choice":
            result = "correct" if payload.answer.strip().upper() == question.correct_answer.strip().upper() else "wrong"
        elif question.question_type == "true_false":
            normalized = {"true": "正确", "对": "正确", "false": "错误", "错": "错误"}.get(
                _normalize_answer(payload.answer), payload.answer.strip()
            )
            result = "correct" if normalized == question.correct_answer else "wrong"
        elif question.question_type == "fill_blank":
            accepted = {
                _normalize_answer(value)
                for value in _json(question.accepted_answers_json, [])
                if isinstance(value, str)
            }
            result = "correct" if _normalize_answer(payload.answer) in accepted else "pending_self_review"
        attempt = LearningAttempt(question_id=question.id, answer=payload.answer.strip(), result=result)
        db.add(attempt)
        if result == "wrong":
            _record_weakness(db, question)
        db.commit(); db.refresh(attempt)
        return LearningAttemptResponse.model_validate(_attempt_dict(attempt))

    @router.patch("/attempts/{attempt_id}/self-rating", response_model=LearningAttemptResponse)
    def self_rate(attempt_id: int, payload: LearningAttemptSelfRating, db: Session = Depends(get_db)) -> LearningAttemptResponse:
        attempt = db.get(LearningAttempt, attempt_id)
        if attempt is None or attempt.question.question_type not in {"short_answer", "fill_blank"}:
            raise HTTPException(404, "可自评作答不存在")
        _require_active(attempt.question.pack)
        if attempt.self_rating is not None:
            raise HTTPException(409, "本次简答已完成自评")
        attempt.self_rating = payload.self_rating
        attempt.result = {"答对": "correct", "部分答对": "partial", "答错": "wrong"}[payload.self_rating]
        if attempt.result in {"partial", "wrong"}:
            _record_weakness(db, attempt.question)
        db.commit(); db.refresh(attempt)
        return LearningAttemptResponse.model_validate(_attempt_dict(attempt))

    @router.post("/packs/{pack_id}/weaknesses", status_code=201, response_model=LearningWeaknessResponse)
    def create_weakness(pack_id: int, payload: LearningWeaknessCreate, db: Session = Depends(get_db)) -> LearningWeaknessResponse:
        _require_active(_pack_or_404(db, pack_id))
        if payload.card_id is not None:
            card = db.get(LearningCard, payload.card_id)
            if card is None or card.pack_id != pack_id:
                raise HTTPException(422, "关联卡片不属于当前学习包")
        item = LearningWeakness(pack_id=pack_id, card_id=payload.card_id, concept=payload.concept.strip(), description=payload.description.strip(), source="manual")
        db.add(item); db.commit(); db.refresh(item)
        return LearningWeaknessResponse.model_validate(_weakness_dict(item))

    @router.patch("/weaknesses/{weakness_id}", response_model=LearningWeaknessResponse)
    def update_weakness(weakness_id: int, payload: LearningWeaknessUpdate, db: Session = Depends(get_db)) -> LearningWeaknessResponse:
        item = db.get(LearningWeakness, weakness_id)
        if item is None:
            raise HTTPException(404, "薄弱概念不存在")
        _require_active(item.pack)
        if payload.concept is not None: item.concept = payload.concept.strip()
        if payload.description is not None: item.description = payload.description.strip()
        db.commit(); db.refresh(item)
        return LearningWeaknessResponse.model_validate(_weakness_dict(item))

    @router.patch("/weaknesses/{weakness_id}/resolve", response_model=LearningWeaknessResponse)
    def resolve_weakness(weakness_id: int, db: Session = Depends(get_db)) -> LearningWeaknessResponse:
        item = db.get(LearningWeakness, weakness_id)
        if item is None: raise HTTPException(404, "薄弱概念不存在")
        _require_active(item.pack)
        item.is_resolved, item.resolved_at = True, datetime.utcnow()
        db.commit(); db.refresh(item)
        return LearningWeaknessResponse.model_validate(_weakness_dict(item))

    @router.patch("/weaknesses/{weakness_id}/reopen", response_model=LearningWeaknessResponse)
    def reopen_weakness(weakness_id: int, db: Session = Depends(get_db)) -> LearningWeaknessResponse:
        item = db.get(LearningWeakness, weakness_id)
        if item is None: raise HTTPException(404, "薄弱概念不存在")
        _require_active(item.pack)
        item.is_resolved, item.resolved_at = False, None
        db.commit(); db.refresh(item)
        return LearningWeaknessResponse.model_validate(_weakness_dict(item))

    @router.put("/packs/{pack_id}/plan", response_model=LearningPlanResponse)
    def upsert_plan(pack_id: int, payload: LearningPlanUpsert, db: Session = Depends(get_db)) -> LearningPlanResponse:
        pack = _pack_or_404(db, pack_id)
        _require_active(pack)
        dates = active_dates(payload.start_date, payload.end_date, payload.weekdays)
        if not dates:
            raise HTTPException(422, "日期范围内没有选中的学习日")
        completed_tasks = []
        if pack.plan is None:
            plan = LearningPlan(pack_id=pack.id, start_date=payload.start_date, end_date=payload.end_date, weekdays_json=json.dumps(sorted(payload.weekdays)))
            db.add(plan); db.flush()
        else:
            plan = pack.plan
            completed_tasks = [task for task in plan.tasks if task.completed_at is not None]
            for task in list(plan.tasks):
                if task.completed_at is None:
                    db.delete(task)
            plan.start_date = payload.start_date
            plan.end_date = payload.end_date
            plan.weekdays_json = json.dumps(sorted(payload.weekdays))
            db.flush()
        queue: list[tuple[str, int | None, int | None, int | None, str]] = []
        quiz_index = 0
        for index, card in enumerate(pack.cards, start=1):
            queue.append(("card", card.id, None, None, f"学习卡片：{card.concept}"))
            if index % 2 == 0 and quiz_index < len(pack.questions):
                question = pack.questions[quiz_index]; quiz_index += 1
                queue.append(("quiz", None, question.id, None, f"完成自测：{question.prompt[:80]}"))
        for question in pack.questions[quiz_index:]:
            queue.append(("quiz", None, question.id, None, f"完成自测：{question.prompt[:80]}"))
        for weakness in pack.weaknesses:
            if not weakness.is_resolved:
                queue.append(("weakness", None, None, weakness.id, f"复习薄弱概念：{weakness.concept}"))
        completed_keys = {
            (task.task_type, task.card_id, task.question_id, task.weakness_id)
            for task in completed_tasks
        }
        queue = [item for item in queue if (item[0], item[1], item[2], item[3]) not in completed_keys]
        occupied_positions = {task.position for task in completed_tasks}
        available_positions: list[int] = []
        candidate = 1
        while len(available_positions) < len(queue):
            if candidate not in occupied_positions:
                available_positions.append(candidate)
            candidate += 1
        for index, ((kind, card_id, question_id, weakness_id, title), position) in enumerate(zip(queue, available_positions, strict=True)):
            db.add(LearningPlanTask(plan_id=plan.id, task_date=dates[index % len(dates)], task_type=kind, card_id=card_id, question_id=question_id, weakness_id=weakness_id, title=title, position=position))
        db.commit(); db.refresh(plan)
        return LearningPlanResponse.model_validate(_plan_dict(plan))

    @router.patch("/plan-tasks/{task_id}", response_model=LearningPlanTaskResponse)
    def update_task(task_id: int, payload: LearningPlanTaskUpdate, db: Session = Depends(get_db)) -> LearningPlanTaskResponse:
        task = db.get(LearningPlanTask, task_id)
        if task is None: raise HTTPException(404, "计划任务不存在")
        _require_active(task.plan.pack)
        task.completed_at = datetime.utcnow() if payload.completed else None
        db.commit(); db.refresh(task)
        return LearningPlanTaskResponse.model_validate(_task_dict(task))

    @router.post("/weaknesses/{weakness_id}/plan-task", status_code=201, response_model=LearningPlanTaskResponse)
    def add_weakness_task(weakness_id: int, payload: LearningWeaknessTaskCreate, db: Session = Depends(get_db)) -> LearningPlanTaskResponse:
        weakness = db.get(LearningWeakness, weakness_id)
        if weakness is None: raise HTTPException(404, "薄弱概念不存在")
        _require_active(weakness.pack)
        plan = db.scalar(select(LearningPlan).where(LearningPlan.pack_id == weakness.pack_id))
        if plan is None or payload.task_date < plan.start_date or payload.task_date > plan.end_date:
            raise HTTPException(422, "任务日期必须位于当前学习计划范围内")
        task = LearningPlanTask(plan_id=plan.id, task_date=payload.task_date, task_type="weakness", weakness_id=weakness.id, title=f"复习薄弱概念：{weakness.concept}", position=len(plan.tasks) + 1)
        db.add(task); db.commit(); db.refresh(task)
        return LearningPlanTaskResponse.model_validate(_task_dict(task))

    app.include_router(router)
