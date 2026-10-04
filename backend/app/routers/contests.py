"""Phase 5G contest workspace routes."""

from __future__ import annotations

import hashlib
import json
from datetime import date, datetime
from pathlib import Path
from typing import Literal

import fitz
from fastapi import Depends, File, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field, StrictBool
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import (
    ContestDefenseSession,
    ContestDefenseTurn,
    ContestMilestone,
    ContestProject,
    ContestRubricCheck,
    ContestRubricItem,
    ContestRule,
    ContestSource,
)
from app.config import get_settings
from app.providers import ModelProviderError, make_provider
from app.schemas import (
    ContestDefenseSessionResponse,
    ContestDefenseTurnResponse,
    ContestMilestoneResponse,
    ContestProjectListResponse,
    ContestProjectResponse,
    ContestRubricCheckItemResponse,
    ContestRubricCheckResponse,
    ContestRubricItemResponse,
    ContestRuleResponse,
    ContestRuleSetResponse,
    ContestSourceResponse,
    ContestTimelineResponse,
)
from app.secrets import get_model_api_key
from app.transcription import LocalWhisperUnavailable, transcribe_local_audio

from ._shared import _get_setting


class ContestProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    competition_name: str = Field(default="", max_length=300)


class ContestProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    competition_name: str | None = Field(default=None, max_length=300)
    summary: str | None = Field(default=None, max_length=20_000)
    research_question: str | None = Field(default=None, max_length=20_000)
    innovation: str | None = Field(default=None, max_length=20_000)
    method: str | None = Field(default=None, max_length=20_000)
    evidence: str | None = Field(default=None, max_length=20_000)
    feasibility: str | None = Field(default=None, max_length=20_000)
    expected_outcomes: str | None = Field(default=None, max_length=20_000)
    risks: str | None = Field(default=None, max_length=20_000)
    resources: str | None = Field(default=None, max_length=20_000)


class ContestDeleteRequest(BaseModel):
    confirmation_title: str = Field(min_length=1, max_length=300)


class ContestTextSourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=500)
    source_type: Literal["text"] = "text"
    content: str = Field(min_length=1, max_length=500_000)


class ContestRulesConfirmRequest(BaseModel):
    confirmed: StrictBool


class ContestMilestoneCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    due_date: date


class ContestDefenseSessionCreate(BaseModel):
    mode: Literal["text", "voice"] = "text"


class ContestDefenseTurnCreate(BaseModel):
    answer: str = Field(min_length=1, max_length=20_000)


_PROJECT_CONTENT_FIELDS = (
    "summary",
    "research_question",
    "innovation",
    "method",
    "evidence",
    "feasibility",
    "expected_outcomes",
    "risks",
    "resources",
)


def _project_response(project: ContestProject) -> ContestProjectResponse:
    return ContestProjectResponse.model_validate(project, from_attributes=True)


def _json_strings(value: str) -> list[str]:
    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        return []
    return [item for item in parsed if isinstance(item, str)] if isinstance(parsed, list) else []


def _source_response(source: ContestSource) -> ContestSourceResponse:
    try:
        locators = json.loads(source.locators_json)
    except (TypeError, ValueError):
        locators = []
    return ContestSourceResponse(
        id=source.id,
        project_id=source.project_id,
        name=source.name,
        source_type=source.source_type,
        sha256=source.sha256,
        status=source.status,
        locator_count=len(locators) if isinstance(locators, list) else 0,
        created_at=source.created_at,
    )


def _rule_response(rule: ContestRule) -> ContestRuleResponse:
    return ContestRuleResponse(
        id=rule.id,
        title=rule.title,
        description=rule.description,
        deadline=rule.deadline,
        citations=_json_strings(rule.citations_json),
        status=rule.status,
    )


def _rubric_response(item: ContestRubricItem) -> ContestRubricItemResponse:
    return ContestRubricItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        weight=item.weight,
        citations=_json_strings(item.citations_json),
        status=item.status,
    )


def _milestone_response(item: ContestMilestone) -> ContestMilestoneResponse:
    return ContestMilestoneResponse.model_validate(item, from_attributes=True)


def _project_or_404(db: Session, project_id: int) -> ContestProject:
    project = db.get(ContestProject, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="竞赛项目不存在")
    return project


def _provider(db: Session):
    setting = _get_setting(db)
    return make_provider(
        setting.model_provider,
        get_model_api_key(setting.model_provider, setting.model_base_url),
        setting.model_base_url,
        setting.model_name,
        setting.timeout_seconds,
        vision_model=setting.vision_model,
    )


def _ruleset(db: Session, project_id: int) -> ContestRuleSetResponse:
    rules = list(db.scalars(select(ContestRule).where(ContestRule.project_id == project_id).order_by(ContestRule.id)))
    rubric = list(db.scalars(select(ContestRubricItem).where(ContestRubricItem.project_id == project_id).order_by(ContestRubricItem.id)))
    status: Literal["draft", "confirmed"] = "confirmed" if rules and all(item.status == "confirmed" for item in [*rules, *rubric]) else "draft"
    return ContestRuleSetResponse(
        status=status,
        rules=[_rule_response(item) for item in rules],
        rubric_items=[_rubric_response(item) for item in rubric],
    )


def _required_string(value: object, field: str, *, max_length: int = 20_000) -> str:
    if not isinstance(value, str) or not value.strip() or len(value) > max_length:
        raise HTTPException(status_code=422, detail=f"模型返回的 {field} 不合法")
    return value.strip()


def _validated_citations(value: object, valid: set[str]) -> list[str]:
    if not isinstance(value, list) or not value:
        raise HTTPException(status_code=422, detail="模型返回的规则缺少来源引用")
    citations = [item for item in value if isinstance(item, str)]
    if len(citations) != len(value) or not set(citations).issubset(valid):
        raise HTTPException(status_code=422, detail="模型返回了越界来源引用")
    return citations


def register_contest_routes(app, get_db) -> None:
    def complete_defense_turn(session: ContestDefenseSession, answer: str, db: Session, audio_path: str | None = None) -> ContestDefenseTurnResponse:
        project = _project_or_404(db, session.project_id)
        prompt = f"项目：{project.title}\n回答：{answer}"
        try:
            result = _provider(db).generate_structured_task(prompt, "contest_defense")
        except ModelProviderError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        item = ContestDefenseTurn(
            session_id=session.id,
            question=_required_string(result.data.get("question"), "答辩问题"),
            answer=answer,
            feedback=_required_string(result.data.get("feedback"), "答辩反馈"),
            transcript=answer,
            audio_file_path=audio_path,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return ContestDefenseTurnResponse.model_validate(item, from_attributes=True)

    @app.post("/api/v1/contests", response_model=ContestProjectResponse, status_code=201)
    def create_contest(payload: ContestProjectCreate, db: Session = Depends(get_db)) -> ContestProjectResponse:
        project = ContestProject(title=payload.title.strip(), competition_name=payload.competition_name.strip())
        db.add(project)
        db.commit()
        db.refresh(project)
        return _project_response(project)

    @app.get("/api/v1/contests", response_model=ContestProjectListResponse)
    def list_contests(db: Session = Depends(get_db)) -> ContestProjectListResponse:
        projects = list(db.scalars(select(ContestProject).order_by(ContestProject.updated_at.desc(), ContestProject.id.desc())))
        return ContestProjectListResponse(items=[_project_response(item) for item in projects])

    @app.get("/api/v1/contests/{project_id}", response_model=ContestProjectResponse)
    def get_contest(project_id: int, db: Session = Depends(get_db)) -> ContestProjectResponse:
        return _project_response(_project_or_404(db, project_id))

    @app.patch("/api/v1/contests/{project_id}", response_model=ContestProjectResponse)
    def update_contest(project_id: int, payload: ContestProjectUpdate, db: Session = Depends(get_db)) -> ContestProjectResponse:
        project = _project_or_404(db, project_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(project, key, value.strip() if isinstance(value, str) else value)
        project.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(project)
        return _project_response(project)

    @app.delete("/api/v1/contests/{project_id}", status_code=204)
    def delete_contest(project_id: int, payload: ContestDeleteRequest, db: Session = Depends(get_db)) -> Response:
        project = _project_or_404(db, project_id)
        if payload.confirmation_title != project.title:
            raise HTTPException(status_code=409, detail="请输入完整项目名称以确认删除")
        db.delete(project)
        db.commit()
        return Response(status_code=204)

    @app.post("/api/v1/contests/{project_id}/sources/text", response_model=ContestSourceResponse, status_code=201)
    def add_text_source(project_id: int, payload: ContestTextSourceCreate, db: Session = Depends(get_db)) -> ContestSourceResponse:
        _project_or_404(db, project_id)
        content = payload.content.strip()
        digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
        source = ContestSource(
            project_id=project_id,
            name=payload.name.strip(),
            source_type="text",
            sha256=digest,
            extracted_text=content,
            locators_json=json.dumps(["粘贴文本第1-1段"], ensure_ascii=False),
            status="ready",
        )
        db.add(source)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=409, detail="该来源已添加到当前项目") from exc
        db.refresh(source)
        return _source_response(source)

    @app.post("/api/v1/contests/{project_id}/sources/upload", response_model=ContestSourceResponse, status_code=201)
    async def upload_source(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)) -> ContestSourceResponse:
        _project_or_404(db, project_id)
        filename = Path(file.filename or "").name
        suffix = Path(filename).suffix.lower()
        source_types = {".pdf": "pdf", ".csv": "csv", ".png": "image", ".jpg": "image", ".jpeg": "image"}
        source_type = source_types.get(suffix)
        if source_type is None:
            raise HTTPException(status_code=400, detail="规则来源仅支持 PDF、CSV、PNG 和 JPEG")
        max_size = get_settings().max_upload_size_mb * 1024 * 1024
        data = bytearray()
        try:
            while chunk := await file.read(1024 * 1024):
                data.extend(chunk)
                if len(data) > max_size:
                    raise HTTPException(status_code=400, detail=f"来源文件超过 {get_settings().max_upload_size_mb}MB 限制")
        finally:
            await file.close()
        raw = bytes(data)
        if not raw:
            raise HTTPException(status_code=400, detail="来源文件为空")
        digest = hashlib.sha256(raw).hexdigest()
        if db.scalar(select(ContestSource).where(ContestSource.project_id == project_id, ContestSource.sha256 == digest)):
            raise HTTPException(status_code=409, detail="该来源已添加到当前项目")

        extracted_text = ""
        locators: list[str] = []
        status = "ready"
        if source_type == "pdf":
            if not raw.startswith(b"%PDF-"):
                raise HTTPException(status_code=400, detail="文件不是有效的 PDF 格式")
            try:
                document = fitz.open(stream=raw, filetype="pdf")
                if document.needs_pass:
                    raise HTTPException(status_code=400, detail="不支持加密 PDF")
                if document.page_count > 500:
                    raise HTTPException(status_code=400, detail="PDF 页数超过 500 页限制")
                page_texts = [document.load_page(index).get_text("text").strip() for index in range(document.page_count)]
                document.close()
            except HTTPException:
                raise
            except Exception as exc:
                raise HTTPException(status_code=400, detail="PDF 结构无法安全读取") from exc
            extracted_text = "\n\n".join(text for text in page_texts if text)
            locators = [f"PDF第{index}页" for index in range(1, len(page_texts) + 1)]
            status = "ready" if extracted_text else "pending_ocr"
        elif source_type == "csv":
            decoded = None
            for encoding in ("utf-8-sig", "gb18030"):
                try:
                    decoded = raw.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            if decoded is None or "\x00" in decoded:
                raise HTTPException(status_code=400, detail="CSV 必须使用 UTF-8 或 GB18030 编码")
            lines = decoded.splitlines()
            if len(lines) > 100_000:
                raise HTTPException(status_code=400, detail="CSV 行数超过 100000 行限制")
            extracted_text = decoded
            locators = [f"CSV第{index}行" for index in range(1, len(lines) + 1)]
        else:
            valid_signature = raw.startswith(b"\x89PNG\r\n\x1a\n") if suffix == ".png" else raw.startswith(b"\xff\xd8\xff")
            if not valid_signature:
                raise HTTPException(status_code=400, detail="图片签名与扩展名不一致")
            try:
                image_document = fitz.open(stream=raw, filetype=suffix.removeprefix("."))
                if image_document.page_count != 1:
                    raise ValueError("unexpected image page count")
                image_document.close()
            except Exception as exc:
                raise HTTPException(status_code=400, detail="图片结构无法安全读取") from exc
            locators = ["图片整体"]
            status = "pending_ocr"

        directory = get_settings().paper_storage_dir / "contest-sources" / str(project_id)
        directory.mkdir(parents=True, exist_ok=True)
        destination = directory / f"{digest}{suffix}"
        destination.write_bytes(raw)
        source = ContestSource(project_id=project_id, name=filename, source_type=source_type, sha256=digest, file_path=str(destination), extracted_text=extracted_text, locators_json=json.dumps(locators, ensure_ascii=False), status=status)
        db.add(source)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            destination.unlink(missing_ok=True)
            raise HTTPException(status_code=409, detail="该来源已添加到当前项目") from exc
        db.refresh(source)
        return _source_response(source)

    @app.post("/api/v1/contest-sources/{source_id}/ocr", response_model=ContestSourceResponse)
    def ocr_image_source(source_id: int, db: Session = Depends(get_db)) -> ContestSourceResponse:
        source = db.get(ContestSource, source_id)
        if source is None:
            raise HTTPException(status_code=404, detail="规则来源不存在")
        if source.source_type != "image" or not source.file_path:
            raise HTTPException(status_code=409, detail="该来源不是可识别图片")
        path = Path(source.file_path)
        if not path.is_file():
            raise HTTPException(status_code=409, detail="规则来源文件缺失")
        try:
            result = app.state.document_ai_manager.ocr_page(path.read_bytes(), 1)
        except RuntimeError as exc:
            raise HTTPException(status_code=409, detail=str(exc)) from exc
        blocks = result.get("blocks", [])
        source.extracted_text = str(result.get("text", "")).strip()
        source.locators_json = json.dumps(
            [f"图片区域 {item.get('bbox', [])}" for item in blocks if isinstance(item, dict)] or ["图片整体"],
            ensure_ascii=False,
        )
        source.status = "ready" if source.extracted_text else "failed"
        db.commit()
        db.refresh(source)
        return _source_response(source)

    @app.get("/api/v1/contests/{project_id}/sources", response_model=list[ContestSourceResponse])
    def list_sources(project_id: int, db: Session = Depends(get_db)) -> list[ContestSourceResponse]:
        _project_or_404(db, project_id)
        items = db.scalars(select(ContestSource).where(ContestSource.project_id == project_id).order_by(ContestSource.id))
        return [_source_response(item) for item in items]

    @app.post("/api/v1/contests/{project_id}/rules/parse", response_model=ContestRuleSetResponse, status_code=201)
    def parse_rules(project_id: int, db: Session = Depends(get_db)) -> ContestRuleSetResponse:
        _project_or_404(db, project_id)
        sources = list(db.scalars(select(ContestSource).where(ContestSource.project_id == project_id, ContestSource.status == "ready").order_by(ContestSource.id)))
        if not sources:
            raise HTTPException(status_code=409, detail="请先添加可读取的竞赛规则来源")
        labels = {f"S{index}" for index in range(1, len(sources) + 1)}
        prompt = "请从以下来源提取规则、截止日期和评分项，返回 JSON；每项必须引用来源编号。\n\n" + "\n\n".join(
            f"[S{index}] {item.name}\n{item.extracted_text}" for index, item in enumerate(sources, 1)
        )
        try:
            result = _provider(db).generate_structured_task(prompt, "contest_rules")
        except ModelProviderError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        raw_rules = result.data.get("rules")
        raw_rubric = result.data.get("rubric_items")
        if not isinstance(raw_rules, list) or not raw_rules or not isinstance(raw_rubric, list):
            raise HTTPException(status_code=422, detail="模型返回的规则结构不完整")
        validated_rules: list[dict[str, object]] = []
        validated_rubric: list[dict[str, object]] = []
        for item in raw_rules:
            if not isinstance(item, dict):
                raise HTTPException(status_code=422, detail="模型返回的规则结构不合法")
            deadline_value = item.get("deadline")
            try:
                parsed_deadline = date.fromisoformat(deadline_value) if isinstance(deadline_value, str) and deadline_value else None
            except ValueError as exc:
                raise HTTPException(status_code=422, detail="模型返回的截止日期不合法") from exc
            validated_rules.append({
                "title": _required_string(item.get("title"), "规则标题", max_length=500),
                "description": str(item.get("description") or "")[:20_000],
                "deadline": parsed_deadline,
                "citations": _validated_citations(item.get("citations"), labels),
            })
        for item in raw_rubric:
            if not isinstance(item, dict):
                raise HTTPException(status_code=422, detail="模型返回的评分项结构不合法")
            weight = item.get("weight")
            if weight is not None and (not isinstance(weight, (int, float)) or not 0 <= float(weight) <= 1000):
                raise HTTPException(status_code=422, detail="模型返回的评分权重不合法")
            validated_rubric.append({
                "title": _required_string(item.get("title"), "评分项标题", max_length=500),
                "description": str(item.get("description") or "")[:20_000],
                "weight": float(weight) if weight is not None else None,
                "citations": _validated_citations(item.get("citations"), labels),
            })
        db.execute(delete(ContestRubricCheck).where(ContestRubricCheck.project_id == project_id))
        db.execute(delete(ContestRule).where(ContestRule.project_id == project_id))
        db.execute(delete(ContestRubricItem).where(ContestRubricItem.project_id == project_id))
        for item in validated_rules:
            db.add(ContestRule(project_id=project_id, title=item["title"], description=item["description"], deadline=item["deadline"], citations_json=json.dumps(item["citations"], ensure_ascii=False), status="draft"))
        for item in validated_rubric:
            db.add(ContestRubricItem(project_id=project_id, title=item["title"], description=item["description"], weight=item["weight"], citations_json=json.dumps(item["citations"], ensure_ascii=False), status="draft"))
        db.commit()
        return _ruleset(db, project_id)

    @app.get("/api/v1/contests/{project_id}/rules", response_model=ContestRuleSetResponse)
    def get_rules(project_id: int, db: Session = Depends(get_db)) -> ContestRuleSetResponse:
        _project_or_404(db, project_id)
        return _ruleset(db, project_id)

    @app.post("/api/v1/contests/{project_id}/rules/confirm", response_model=ContestRuleSetResponse)
    def confirm_rules(project_id: int, payload: ContestRulesConfirmRequest, db: Session = Depends(get_db)) -> ContestRuleSetResponse:
        _project_or_404(db, project_id)
        if not payload.confirmed:
            raise HTTPException(status_code=422, detail="必须明确确认后才能形成权威规则")
        rules = list(db.scalars(select(ContestRule).where(ContestRule.project_id == project_id)))
        rubric = list(db.scalars(select(ContestRubricItem).where(ContestRubricItem.project_id == project_id)))
        if not rules:
            raise HTTPException(status_code=409, detail="当前没有可确认的规则草稿")
        for item in [*rules, *rubric]:
            item.status = "confirmed"
        db.commit()
        return _ruleset(db, project_id)

    @app.post("/api/v1/contests/{project_id}/milestones", response_model=ContestMilestoneResponse, status_code=201)
    def create_milestone(project_id: int, payload: ContestMilestoneCreate, db: Session = Depends(get_db)) -> ContestMilestoneResponse:
        _project_or_404(db, project_id)
        item = ContestMilestone(project_id=project_id, title=payload.title.strip(), due_date=payload.due_date, source="manual")
        db.add(item)
        db.commit()
        db.refresh(item)
        return _milestone_response(item)

    @app.post("/api/v1/contests/{project_id}/timeline/generate", response_model=ContestTimelineResponse)
    def generate_timeline(project_id: int, db: Session = Depends(get_db)) -> ContestTimelineResponse:
        _project_or_404(db, project_id)
        rules = list(db.scalars(select(ContestRule).where(ContestRule.project_id == project_id, ContestRule.status == "confirmed")))
        if not rules:
            raise HTTPException(status_code=409, detail="请先人工确认竞赛规则")
        existing = {(item.title, item.due_date) for item in db.scalars(select(ContestMilestone).where(ContestMilestone.project_id == project_id))}
        for rule in rules:
            key = (rule.title, rule.deadline)
            if rule.deadline is not None and key not in existing:
                db.add(ContestMilestone(project_id=project_id, title=rule.title, due_date=rule.deadline, source="confirmed_rule"))
        db.commit()
        items = list(db.scalars(select(ContestMilestone).where(ContestMilestone.project_id == project_id).order_by(ContestMilestone.due_date, ContestMilestone.id)))
        return ContestTimelineResponse(items=[_milestone_response(item) for item in items])

    @app.post("/api/v1/contests/{project_id}/rubric/check", response_model=ContestRubricCheckResponse, status_code=201)
    def check_rubric(project_id: int, db: Session = Depends(get_db)) -> ContestRubricCheckResponse:
        project = _project_or_404(db, project_id)
        rubric = list(db.scalars(select(ContestRubricItem).where(ContestRubricItem.project_id == project_id, ContestRubricItem.status == "confirmed").order_by(ContestRubricItem.id)))
        if not rubric:
            raise HTTPException(status_code=409, detail="请先确认评分表")
        has_content = any(bool(getattr(project, field).strip()) for field in _PROJECT_CONTENT_FIELDS)
        prompt = f"PROJECT_CONTENT_PRESENT={'true' if has_content else 'false'}\n" + "\n".join(f"R{item.id}|{item.title}" for item in rubric)
        try:
            result = _provider(db).generate_structured_task(prompt, "contest_rubric")
        except ModelProviderError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
        raw_items = result.data.get("items")
        if not isinstance(raw_items, list):
            raise HTTPException(status_code=422, detail="模型返回的评分检查结构不合法")
        rubric_by_id = {item.id: item for item in rubric}
        validated: list[tuple[ContestRubricItem, str, list[str], list[str]]] = []
        for raw in raw_items:
            if not isinstance(raw, dict) or raw.get("rubric_item_id") not in rubric_by_id or raw.get("status") not in {"satisfied", "partial", "missing"}:
                raise HTTPException(status_code=422, detail="模型返回了越界或不合法的评分检查")
            evidence = raw.get("evidence", [])
            questions = raw.get("questions", [])
            if not isinstance(evidence, list) or not all(isinstance(item, str) for item in evidence) or not isinstance(questions, list) or not all(isinstance(item, str) for item in questions):
                raise HTTPException(status_code=422, detail="评分检查证据或补充问题不合法")
            validated.append((rubric_by_id[raw["rubric_item_id"]], raw["status"], evidence, questions))
        db.execute(delete(ContestRubricCheck).where(ContestRubricCheck.project_id == project_id))
        saved: list[ContestRubricCheck] = []
        for rubric_item, status, evidence, questions in validated:
            item = ContestRubricCheck(project_id=project_id, rubric_item_id=rubric_item.id, status=status, evidence_json=json.dumps(evidence, ensure_ascii=False), questions_json=json.dumps(questions, ensure_ascii=False))
            db.add(item)
            saved.append(item)
        db.commit()
        for item in saved:
            db.refresh(item)
        return ContestRubricCheckResponse(items=[ContestRubricCheckItemResponse(id=item.id, rubric_item_id=item.rubric_item_id, title=rubric_by_id[item.rubric_item_id].title, status=item.status, evidence=_json_strings(item.evidence_json), questions=_json_strings(item.questions_json)) for item in saved])

    @app.post("/api/v1/contests/{project_id}/defense-sessions", response_model=ContestDefenseSessionResponse, status_code=201)
    def create_defense_session(project_id: int, payload: ContestDefenseSessionCreate, db: Session = Depends(get_db)) -> ContestDefenseSessionResponse:
        _project_or_404(db, project_id)
        item = ContestDefenseSession(project_id=project_id, mode=payload.mode)
        db.add(item)
        db.commit()
        db.refresh(item)
        return ContestDefenseSessionResponse.model_validate(item, from_attributes=True)

    @app.post("/api/v1/contest-defense-sessions/{session_id}/turns", response_model=ContestDefenseTurnResponse, status_code=201)
    def create_defense_turn(session_id: int, payload: ContestDefenseTurnCreate, db: Session = Depends(get_db)) -> ContestDefenseTurnResponse:
        session = db.get(ContestDefenseSession, session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="答辩会话不存在")
        return complete_defense_turn(session, payload.answer.strip(), db)

    @app.post("/api/v1/contest-defense-sessions/{session_id}/audio", response_model=ContestDefenseTurnResponse, status_code=201)
    async def create_audio_defense_turn(session_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)) -> ContestDefenseTurnResponse:
        session = db.get(ContestDefenseSession, session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="答辩会话不存在")
        suffix = Path(file.filename or "recording.webm").suffix.lower()
        if suffix not in {".wav", ".mp3", ".m4a", ".webm", ".ogg"}:
            raise HTTPException(status_code=400, detail="录音仅支持 WAV、MP3、M4A、WebM 或 OGG")
        data = await file.read(30 * 1024 * 1024 + 1)
        await file.close()
        if not data or len(data) > 30 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="录音为空或超过 30MB")
        valid = data.startswith((b"RIFF", b"ID3", b"OggS", b"\x1aE\xdf\xa3")) or (len(data) > 12 and data[4:8] == b"ftyp") or data.startswith(b"\xff")
        if not valid:
            raise HTTPException(status_code=400, detail="录音文件签名不合法")
        digest = hashlib.sha256(data).hexdigest()
        directory = get_settings().paper_storage_dir / "contest-defense-audio" / str(session_id)
        directory.mkdir(parents=True, exist_ok=True)
        destination = directory / f"{digest}{suffix}"
        destination.write_bytes(data)
        try:
            transcript = transcribe_local_audio(destination, get_settings().whisper_model_dir)
            return complete_defense_turn(session, transcript, db, str(destination))
        except LocalWhisperUnavailable as exc:
            destination.unlink(missing_ok=True)
            raise HTTPException(status_code=409, detail=str(exc)) from exc
