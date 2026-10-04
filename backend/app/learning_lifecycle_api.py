from __future__ import annotations

import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .learning import analysis_snapshot_hash, current_reports, report_versions
from .learning_api import _is_eligible, _json, _pack_dict, _pack_or_404
from .models import Analysis, LearningPack, LearningPackSource, LearningReviewEvent, Paper
from .schemas import (
    LearningPackComparisonResponse,
    LearningPackListResponse,
    LearningPackResponse,
)


def _snapshot_source(db: Session, source: LearningPackSource) -> dict[str, object]:
    if source.paper_id is None:
        raise HTTPException(409, f"来源论文“{source.paper_title}”已删除，不能创建新版本")
    paper = db.get(Paper, source.paper_id)
    analysis = db.scalar(select(Analysis).where(Analysis.paper_id == source.paper_id))
    if paper is None or analysis is None:
        raise HTTPException(409, "来源论文或解析不可用")
    eligible, available = _is_eligible(paper, analysis)
    if not eligible:
        raise HTTPException(409, f"来源论文“{paper.title}”当前不满足学习资格")
    return {
        "paper_id": paper.id,
        "paper_title": paper.title,
        "available_reports_json": json.dumps(available, ensure_ascii=False),
        "analysis_versions_json": json.dumps(report_versions(analysis, available), ensure_ascii=False),
        "analysis_hash": analysis_snapshot_hash(analysis, available),
        "evidence_scope": "fulltext",
    }


def _diff(left: dict[str, object], right: dict[str, object]) -> dict[str, list[str]]:
    left_keys = set(left)
    right_keys = set(right)
    return {
        "added": sorted(right_keys - left_keys),
        "removed": sorted(left_keys - right_keys),
        "changed": sorted(key for key in left_keys & right_keys if left[key] != right[key]),
    }


def _export_payload(pack: LearningPack, db: Session) -> dict[str, object]:
    detail = _pack_dict(pack, db, detail=True)
    events = [
        {
            "id": event.id,
            "card_id": event.card_id,
            "rating": event.rating,
            "next_review_date": event.next_review_date,
            "is_lapse": event.is_lapse,
            "resulting_mastery": event.resulting_mastery,
            "reviewed_at": event.reviewed_at,
        }
        for event in db.scalars(
            select(LearningReviewEvent)
            .where(LearningReviewEvent.pack_id == pack.id)
            .order_by(LearningReviewEvent.reviewed_at, LearningReviewEvent.id)
        )
    ]
    return {
        "version": {
            key: detail[key]
            for key in (
                "id",
                "title",
                "learning_goal",
                "lineage_id",
                "version_number",
                "lifecycle_status",
                "archived_at",
                "created_at",
                "updated_at",
            )
        },
        "sources": detail["sources"],
        "cards": detail["cards"],
        "questions": detail["questions"],
        "weaknesses": detail["weaknesses"],
        "plan": detail["plan"],
        "review_events": events,
    }


def _markdown(payload: dict[str, object]) -> str:
    version = payload["version"]
    lines = [
        f"# {version['title']}",
        "",
        f"- 版本：v{version['version_number']}",
        f"- 状态：{version['lifecycle_status']}",
        f"- 学习目标：{version['learning_goal']}",
        "",
        "## 来源快照",
    ]
    for source in payload["sources"]:
        lines.extend(
            [
                f"- {source['paper_title']}（证据范围：{source['evidence_scope']}）",
                f"  - 解析哈希：`{source['analysis_hash']}`",
            ]
        )
    lines.extend(["", "## 知识卡片"])
    for card in payload["cards"]:
        lines.extend(["", f"### {card['concept']}", "", card["content"]])
        if card.get("importance"):
            lines.append(f"\n重要性：{card['importance']}")
        for evidence in card.get("evidence", []):
            page = f"，第 {evidence['page_number']} 页" if evidence.get("page_number") else ""
            lines.append(f"\n证据 {evidence.get('evidence_id', '')}{page}：{evidence.get('excerpt', '')}")
    lines.extend(["", "## 自测题"])
    for question in payload["questions"]:
        lines.extend(["", f"### {question['position']}. {question['prompt']}"])
        for attempt in question.get("attempts", []):
            lines.append(f"\n作答：{attempt['answer']}（结果：{attempt['result']}）")
    lines.extend(["", "## 薄弱项"])
    for weakness in payload["weaknesses"]:
        lines.append(f"- {weakness['concept']}：{weakness['description']}")
    lines.extend(["", "## 学习计划"])
    if payload["plan"]:
        for task in payload["plan"]["tasks"]:
            lines.append(f"- {task['task_date']} {task['title']}（完成：{bool(task['completed_at'])}）")
    lines.extend(["", "## 复习记录"])
    for event in payload["review_events"]:
        lines.append(
            f"- {event['reviewed_at']}：{event['rating']}，下次 {event['next_review_date']}"
        )
    return "\n".join(lines) + "\n"


def register_learning_lifecycle_routes(app, get_db) -> None:
    router = APIRouter(prefix="/api/v1/learning", tags=["learning-lifecycle"])

    @router.post("/packs/{pack_id}/versions", status_code=201, response_model=LearningPackResponse)
    def create_version(pack_id: int, db: Session = Depends(get_db)) -> LearningPackResponse:
        source_pack = _pack_or_404(db, pack_id)
        snapshots = [_snapshot_source(db, source) for source in source_pack.sources]
        if not snapshots:
            raise HTTPException(409, "学习包没有可用来源")
        next_version = (
            db.scalar(
                select(func.max(LearningPack.version_number)).where(
                    LearningPack.lineage_id == source_pack.lineage_id
                )
            )
            or 0
        ) + 1
        pack = LearningPack(
            title=source_pack.title,
            learning_goal=source_pack.learning_goal,
            lineage_id=source_pack.lineage_id,
            version_number=next_version,
            lifecycle_status="draft",
            cards_prompt_version=source_pack.cards_prompt_version,
            cards_schema_version=source_pack.cards_schema_version,
            quiz_prompt_version="learning-quiz-v2",
            quiz_schema_version="learning-quiz-schema-v2",
        )
        db.add(pack)
        db.flush()
        for snapshot in snapshots:
            db.add(LearningPackSource(pack_id=pack.id, **snapshot))
        db.commit()
        db.refresh(pack)
        return LearningPackResponse.model_validate(_pack_dict(pack, db, detail=True))

    @router.get("/packs/{pack_id}/versions", response_model=LearningPackListResponse)
    def list_versions(pack_id: int, db: Session = Depends(get_db)) -> LearningPackListResponse:
        pack = _pack_or_404(db, pack_id)
        versions = db.scalars(
            select(LearningPack)
            .where(LearningPack.lineage_id == pack.lineage_id)
            .order_by(LearningPack.version_number.desc())
        )
        return LearningPackListResponse(items=[LearningPackResponse.model_validate(_pack_dict(item, db)) for item in versions])

    @router.post("/packs/{pack_id}/activate", response_model=LearningPackResponse)
    def activate(pack_id: int, db: Session = Depends(get_db)) -> LearningPackResponse:
        pack = _pack_or_404(db, pack_id)
        if pack.lifecycle_status == "active":
            raise HTTPException(409, "该版本已经激活")
        now = datetime.utcnow()
        try:
            current = db.scalar(
                select(LearningPack).where(
                    LearningPack.lineage_id == pack.lineage_id,
                    LearningPack.lifecycle_status == "active",
                )
            )
            if current is not None:
                current.lifecycle_status = "archived"
                current.archived_at = now
                db.flush()
            pack.lifecycle_status = "active"
            pack.archived_at = None
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(409, "版本激活冲突，请重试") from exc
        db.refresh(pack)
        return LearningPackResponse.model_validate(_pack_dict(pack, db, detail=True))

    @router.post("/packs/{pack_id}/archive", response_model=LearningPackResponse)
    def archive(pack_id: int, db: Session = Depends(get_db)) -> LearningPackResponse:
        pack = _pack_or_404(db, pack_id)
        if pack.lifecycle_status == "archived":
            raise HTTPException(409, "该版本已经归档")
        pack.lifecycle_status = "archived"
        pack.archived_at = datetime.utcnow()
        db.commit()
        db.refresh(pack)
        return LearningPackResponse.model_validate(_pack_dict(pack, db, detail=True))

    @router.get("/pack-comparisons", response_model=LearningPackComparisonResponse)
    def compare(left_pack_id: int, right_pack_id: int, db: Session = Depends(get_db)) -> LearningPackComparisonResponse:
        left = _pack_or_404(db, left_pack_id)
        right = _pack_or_404(db, right_pack_id)
        if left.lineage_id != right.lineage_id:
            raise HTTPException(422, "只能比较同一谱系的版本")
        return LearningPackComparisonResponse.model_validate(
            {
                "left_pack_id": left.id,
                "right_pack_id": right.id,
                "source_changes": _diff(
                    {item.paper_title: item.analysis_hash for item in left.sources},
                    {item.paper_title: item.analysis_hash for item in right.sources},
                ),
                "cards": _diff(
                    {item.concept: item.content for item in left.cards},
                    {item.concept: item.content for item in right.cards},
                ),
                "questions": _diff(
                    {item.prompt: (item.question_type, item.correct_answer) for item in left.questions},
                    {item.prompt: (item.question_type, item.correct_answer) for item in right.questions},
                ),
            }
        )

    @router.get("/packs/{pack_id}/export")
    def export(pack_id: int, format: str = "markdown", db: Session = Depends(get_db)) -> Response:
        if format not in {"markdown", "json"}:
            raise HTTPException(422, "format 只支持 markdown 或 json")
        pack = _pack_or_404(db, pack_id)
        payload = _export_payload(pack, db)
        extension = "json" if format == "json" else "md"
        filename = f"learning-pack-{pack.id}-v{pack.version_number}.{extension}"
        if format == "json":
            content = json.dumps(payload, ensure_ascii=False, default=str, indent=2)
            media_type = "application/json"
        else:
            content = _markdown(payload)
            media_type = "text/markdown; charset=utf-8"
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    app.include_router(router)
