"""Shared pure helpers for API routers (DTO builders, PDF management, source status).

All functions here are side-effect free (no route registration).  They were
moved verbatim from ``app.main`` during the router split; behaviour is unchanged.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path
from threading import RLock
from typing import Literal

import fitz
import httpx
from fastapi import FastAPI, HTTPException
from sqlalchemy import func, select, tuple_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    Analysis,
    KnowledgeConversation,
    Note,
    Paper,
    PaperClaim,
    PaperSourceRecord,
    PaperVisual,
    PaperVisualCrop,
    ResearchNotification,
    ResearchRecommendation,
    ResearchRun,
    ResearchSubscription,
    SavedComparison,
    UserSetting,
)
from app.paper_analysis import (
    AnalysisReportType,
    is_usable_report_version,
)
from app.paper_identity import normalize_arxiv_id, normalize_doi, normalize_title
from app.paper_sources.registry import enabled_source_names
from app.pdf_visuals import PdfVisualError, detect_visual_captions, extract_page_texts
from app.schemas import (
    ClaimEvidenceResponse,
    ComparisonPaperResponse,
    KnowledgeCitationResponse,
    KnowledgeConfidenceResponse,
    KnownPaperSource,
    PaperClaimResponse,
    PaperResponse,
    PaperVisualCropResponse,
    PaperVisualResponse,
    ResearchNotificationResponse,
    ResearchRecommendationResponse,
    ResearchRunResponse,
    ResearchSubscriptionResponse,
    SavedComparisonResponse,
    SavedConversationResponse,
    SavedConversationTurn,
    SearchPaperResponse,
    SettingsResponse,
    SourceStatusResponse,
)
from app.knowledge import parse_source_locations
from app.secrets import get_document_vision_api_key, get_model_api_key


_PAPER_SOURCE_NAMES: tuple[KnownPaperSource, ...] = (
    "openalex",
    "crossref",
    "arxiv",
    "semantic_scholar",
)

# Upload and deletion can target the same SHA-256-named PDF. Keep the file
# mutation and its database reference update in one in-process critical section.
_PAPER_FILE_LOCK = RLock()


def _key_status(value: str) -> dict[str, object]:
    return {"configured": bool(value), "last4": value[-4:] if value else None}


def _default_setting() -> UserSetting:
    config = get_settings()
    return UserSetting(model_provider=config.model_provider, model_name=config.model_name, vision_model=config.model_vision_model, model_base_url=config.model_base_url, timeout_seconds=config.model_timeout_seconds, paper_budget=config.paper_budget, daily_budget=config.daily_budget, monthly_budget=config.monthly_budget)


def _setting_response(item: UserSetting) -> SettingsResponse:
    return SettingsResponse(
        model_provider=item.model_provider,
        model_name=item.model_name,
        vision_model=item.vision_model,
        model_base_url=item.model_base_url,
        api_key=_key_status(get_model_api_key(item.model_provider, item.model_base_url)),
        timeout_seconds=item.timeout_seconds,
        backup_model=item.backup_model,
        paper_budget=item.paper_budget,
        daily_budget=item.daily_budget,
        monthly_budget=item.monthly_budget,
        campus_ai_daily_limit=item.campus_ai_daily_limit,
        campus_ai_max_tokens=item.campus_ai_max_tokens,
        onboarding_completed=item.onboarding_completed,
        document_vision_provider=item.document_vision_provider,
        document_vision_model=item.document_vision_model,
        document_vision_base_url=item.document_vision_base_url,
        document_vision_timeout_seconds=item.document_vision_timeout_seconds,
        document_vision_api_key=_key_status(get_document_vision_api_key(item.document_vision_provider, item.document_vision_base_url)),
    )


def _get_setting(db: Session) -> UserSetting:
    item = db.get(UserSetting, 1)
    if item is None:
        item = _default_setting()
        item.id = 1
        db.add(item)
        db.commit()
        db.refresh(item)
    return item


def _json_string_list(value: object) -> list[str]:
    if not isinstance(value, str):
        return []
    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        return []
    if not isinstance(parsed, list):
        return []
    return [item for item in parsed if isinstance(item, str)]


def _json_object_list(value: object) -> list[dict[str, object]]:
    if not isinstance(value, str):
        return []
    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        return []
    return [item for item in parsed if isinstance(item, dict)] if isinstance(parsed, list) else []


def _research_subscription_response(
    subscription: ResearchSubscription,
) -> ResearchSubscriptionResponse:
    return ResearchSubscriptionResponse(
        id=subscription.id,
        name=subscription.name,
        query=subscription.query,
        sources=[
            source
            for source in _json_string_list(subscription.sources_json)
            if source in _PAPER_SOURCE_NAMES
        ],
        year_from=subscription.year_from,
        year_to=subscription.year_to,
        open_access_only=subscription.open_access_only,
        interval_hours=subscription.interval_hours,
        enabled=subscription.enabled,
        last_started_at=subscription.last_started_at,
        last_success_at=subscription.last_success_at,
        next_run_at=subscription.next_run_at,
        last_error=subscription.last_error,
        created_at=subscription.created_at,
        updated_at=subscription.updated_at,
    )


def _research_run_response(run: ResearchRun) -> ResearchRunResponse:
    return ResearchRunResponse(
        id=run.id,
        subscription_id=run.subscription_id,
        status=run.status,
        started_at=run.started_at,
        completed_at=run.completed_at,
        discovered_count=run.discovered_count,
        recommended_count=run.recommended_count,
        source_statuses=_json_object_list(run.source_statuses_json),
        warnings=_json_string_list(run.warnings_json),
        error=run.error,
    )


def _research_recommendation_response(
    recommendation: ResearchRecommendation,
) -> ResearchRecommendationResponse:
    try:
        snapshot = json.loads(recommendation.paper_snapshot_json)
    except (TypeError, ValueError):
        snapshot = {}
    return ResearchRecommendationResponse(
        id=recommendation.id,
        subscription_id=recommendation.subscription_id,
        run_id=recommendation.run_id,
        source=recommendation.source,
        external_id=recommendation.external_id,
        identity_key=recommendation.identity_key,
        paper_snapshot=snapshot if isinstance(snapshot, dict) else {},
        relevance_score=recommendation.relevance_score,
        created_at=recommendation.created_at,
        read_at=recommendation.read_at,
    )


def _research_notification_response(
    notification: ResearchNotification,
) -> ResearchNotificationResponse:
    return ResearchNotificationResponse(
        id=notification.id,
        subscription_id=notification.subscription_id,
        run_id=notification.run_id,
        kind=notification.kind,
        title=notification.title,
        body=notification.body,
        created_at=notification.created_at,
        read_at=notification.read_at,
    )


def _paper_response(paper: Paper) -> PaperResponse:
    return PaperResponse(
        id=paper.id,
        original_filename=paper.original_filename,
        title=paper.title,
        file_hash=paper.file_hash,
        file_size=paper.file_size,
        page_count=paper.page_count,
        extracted_text=paper.extracted_text,
        parse_confidence=paper.parse_confidence,
        extraction_warning=paper.extraction_warning,
        fulltext_status=paper.fulltext_status,
        doi=paper.doi,
        arxiv_id=paper.arxiv_id,
        authors=_json_string_list(paper.authors_json),
        abstract=paper.abstract,
        journal=paper.journal,
        published_date=paper.published_date,
        keywords=_json_string_list(paper.keywords_json),
        landing_url=paper.landing_url,
        pdf_url=paper.pdf_url,
        oa_status=paper.oa_status,
        license=paper.license,
        source_type=paper.source_type,
        acquisition_status=paper.acquisition_status,
        article_type=paper.article_type,
        is_favorite=paper.is_favorite,
        is_read=paper.is_read,
        active_parse_run_id=paper.active_parse_run_id,
        ocr_available=bool(paper.ocr_file_path and Path(paper.ocr_file_path).is_file()),
        knowledge_index_stale=paper.knowledge_index_stale,
        created_at=paper.created_at,
    )


def _paper_visual_response(visual: PaperVisual) -> PaperVisualResponse:
    return PaperVisualResponse(
        id=visual.id,
        paper_id=visual.paper_id,
        page_number=visual.page_number,
        kind=visual.kind,
        label=visual.label,
        caption=visual.caption,
        analysis_markdown=visual.analysis_markdown,
        evidence_status=visual.evidence_status,
        provider=visual.provider,
        model_name=visual.model_name,
        created_at=visual.created_at,
        updated_at=visual.updated_at,
    )


def _paper_visual_crop_response(
    crop: PaperVisualCrop,
) -> PaperVisualCropResponse:
    return PaperVisualCropResponse(
        id=crop.id,
        paper_id=crop.paper_id,
        visual_id=crop.visual_id,
        page_number=crop.visual.page_number,
        left=crop.left,
        top=crop.top,
        width=crop.width,
        height=crop.height,
        label=crop.label,
        analysis_markdown=crop.analysis_markdown,
        structured_data=json.loads(crop.structured_data_json),
        evidence_status=crop.evidence_status,
        provider=crop.provider,
        model_name=crop.model_name,
        created_at=crop.created_at,
        updated_at=crop.updated_at,
    )


def _paper_claim_response(claim: PaperClaim) -> PaperClaimResponse:
    return PaperClaimResponse(
        id=claim.id,
        paper_id=claim.paper_id,
        claim_text=claim.claim_text,
        claim_type=claim.claim_type,
        evidence_status=claim.evidence_status,
        confidence=claim.confidence,
        evidence=[
            ClaimEvidenceResponse(
                chunk_id=link.chunk.id,
                page_number=link.chunk.page_number,
                section=link.chunk.section,
                excerpt=link.chunk.content,
                source_scope=link.chunk.source_scope,
                parse_confidence=link.chunk.parse_confidence,
                similarity=link.similarity,
                locator=link.locator,
                source_locations=parse_source_locations(
                    link.chunk.source_locations_json
                ),
            )
            for link in claim.evidence_links
            if link.chunk is not None
        ],
    )


def _saved_conversation_response(
    conversation: KnowledgeConversation,
) -> SavedConversationResponse:
    return SavedConversationResponse(
        id=conversation.id,
        scope=conversation.scope,
        paper_id=conversation.paper_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        turns=[
            SavedConversationTurn(
                turn_index=turn.turn_index,
                question=turn.question,
                answer_markdown=turn.answer_markdown,
                citations=[
                    KnowledgeCitationResponse.model_validate(item)
                    for item in json.loads(turn.citations_json)
                ],
                evidence_status=turn.evidence_status,
                confidence=KnowledgeConfidenceResponse(
                    level=turn.confidence_level,
                    explanation=turn.confidence_explanation,
                ),
                provider=turn.provider,
                model_name=turn.model_name,
            )
            for turn in conversation.turns
        ],
    )


def _saved_comparison_response(
    comparison: SavedComparison,
) -> SavedComparisonResponse:
    paper_ids = json.loads(comparison.paper_ids_json)
    return SavedComparisonResponse(
        id=comparison.id,
        title=comparison.title,
        paper_count=len(paper_ids),
        created_at=comparison.created_at,
        paper_ids=paper_ids,
        question=comparison.question,
        comparison_markdown=comparison.comparison_markdown,
        papers=[
            ComparisonPaperResponse.model_validate(item)
            for item in json.loads(comparison.papers_json)
        ],
        citations=[
            KnowledgeCitationResponse.model_validate(item)
            for item in json.loads(comparison.citations_json)
        ],
        fairness_warnings=json.loads(comparison.fairness_warnings_json),
        evidence_status=comparison.evidence_status,
        confidence=KnowledgeConfidenceResponse(
            level=comparison.confidence_level,
            explanation=comparison.confidence_explanation,
        ),
        provider=comparison.provider,
        model_name=comparison.model_name,
    )


def _managed_paper_pdf(
    paper: Paper, *, variant: Literal["original", "ocr"] = "original"
) -> Path:
    """Resolve one database-managed PDF without exposing its disk location."""

    selected_path = paper.file_path if variant == "original" else paper.ocr_file_path
    if not selected_path:
        raise HTTPException(404, "当前论文没有可用的本地 PDF 全文")
    try:
        storage_root = get_settings().paper_storage_dir.resolve()
        candidate = Path(selected_path).resolve()
        if (
            not candidate.is_relative_to(storage_root)
            or not candidate.is_file()
        ):
            raise HTTPException(404, "当前论文没有可用的本地 PDF 全文")
    except HTTPException:
        raise
    except (OSError, RuntimeError, ValueError, TypeError):
        raise HTTPException(
            404,
            "当前论文没有可用的本地 PDF 全文",
        ) from None
    return candidate


def _ensure_paper_visuals(
    db: Session,
    paper: Paper,
    pdf_path: Path,
) -> list[PaperVisual]:
    existing = list(
        db.scalars(
            select(PaperVisual)
            .where(PaperVisual.paper_id == paper.id)
            .order_by(
                PaperVisual.page_number,
                PaperVisual.kind,
                PaperVisual.label,
                PaperVisual.id,
            )
        )
    )
    if existing:
        return existing

    detected = detect_visual_captions(extract_page_texts(pdf_path))
    if not detected:
        return []
    db.add_all(
        [
            PaperVisual(
                paper_id=paper.id,
                page_number=item.page_number,
                kind=item.kind,
                label=item.label,
                caption=item.caption,
            )
            for item in detected
        ]
    )
    try:
        db.commit()
    except IntegrityError:
        # Concurrent first views can discover the same deterministic catalog.
        db.rollback()
    return list(
        db.scalars(
            select(PaperVisual)
            .where(PaperVisual.paper_id == paper.id)
            .order_by(
                PaperVisual.page_number,
                PaperVisual.kind,
                PaperVisual.label,
                PaperVisual.id,
            )
        )
    )


def _paper_file_is_still_referenced(
    db: Session,
    *,
    file_path: str,
    file_hash: str | None,
) -> bool:
    """Check both content identity and normalized paths before removing a PDF."""
    if file_hash and db.scalar(
        select(Paper.id).where(Paper.file_hash == file_hash).limit(1)
    ) is not None:
        return True

    candidate = Path(file_path).resolve()
    referenced_paths = db.scalars(
        select(Paper.file_path).where(Paper.file_path.is_not(None))
    ).all()
    return any(
        Path(path).resolve() == candidate
        for path in referenced_paths
        if path
    )


def _source_status_response(
    *,
    source: KnownPaperSource,
    enabled: bool,
    ok: bool,
    message: str,
    result_count: int | None = None,
    key_configured: bool | None = None,
) -> SourceStatusResponse:
    return SourceStatusResponse(
        source=source,
        enabled=enabled,
        ok=ok,
        message=message,
        result_count=result_count,
        key_configured=key_configured,
    )


def _source_map(settings: object, client: httpx.AsyncClient, app: FastAPI) -> dict[str, object]:
    enabled = set(enabled_source_names(settings))
    sources: dict[str, object] = {}
    for source in app.state.paper_source_builder(settings, client):
        name = getattr(source, "name", "")
        if name in enabled and name in _PAPER_SOURCE_NAMES and name not in sources:
            sources[name] = source
    return sources


async def _collect_source_statuses(
    app: FastAPI,
    settings: object,
) -> list[SourceStatusResponse]:
    """Check enabled sources once and return only sanitized public status."""

    enabled = set(enabled_source_names(settings))
    semantic_key_configured = bool(
        settings.semantic_scholar_api_key.get_secret_value()
    )
    async with app.state.paper_source_client_factory() as client:
        available = _source_map(settings, client, app)

        async def check_source(
            name: KnownPaperSource,
        ) -> tuple[KnownPaperSource, bool]:
            source = available.get(name)
            if source is None:
                return name, False
            try:
                status = await asyncio.wait_for(
                    source.healthcheck(),
                    timeout=settings.paper_source_timeout_seconds,
                )
            except asyncio.CancelledError:
                raise
            except Exception:
                return name, False
            return name, status.ok is True

        checked = dict(
            await asyncio.gather(
                *(
                    check_source(name)
                    for name in _PAPER_SOURCE_NAMES
                    if name in enabled
                )
            )
        )

    return [
        _source_status_response(
            source=name,
            enabled=name in enabled,
            ok=checked.get(name, False),
            message=(
                "连接正常"
                if checked.get(name, False)
                else "来源暂不可用"
                if name in enabled
                else "未启用"
            ),
            key_configured=(
                semantic_key_configured
                if name == "semantic_scholar"
                else None
            ),
        )
        for name in _PAPER_SOURCE_NAMES
    ]


def _academic_search_diagnostic(
    statuses: list[SourceStatusResponse],
) -> dict[str, object]:
    enabled = [status for status in statuses if status.enabled]
    available = [status for status in enabled if status.ok]
    if not enabled:
        aggregate_status = "not_configured"
        message = "未启用学术来源"
    elif len(available) == len(enabled):
        aggregate_status = "ok"
        message = f"{len(available)}/{len(enabled)} 个已启用学术来源连接正常"
    elif available:
        aggregate_status = "degraded"
        message = f"{len(available)}/{len(enabled)} 个已启用学术来源连接正常"
    else:
        aggregate_status = "error"
        message = f"0/{len(enabled)} 个已启用学术来源连接正常"
    return {
        "status": aggregate_status,
        "message": message,
        "sources": [status.model_dump(mode="json") for status in statuses],
    }


def _read_user_keywords(factory: object) -> list[str]:
    with factory() as db:
        setting = db.get(UserSetting, 1)
        keywords = [] if setting is None else _json_string_list(setting.keywords)
        if db.in_transaction():
            db.rollback()
        return keywords


def _strict_query_bool(value: str) -> bool:
    if value == "true":
        return True
    if value == "false":
        return False
    raise HTTPException(422, "请求参数不合法：open_access_only")


def _extract_pdf(path: Path) -> tuple[str, int, float, str | None, str, dict[str, object]]:
    try:
        document = fitz.open(path)
        page_count = len(document)
        texts = [page.get_text("text") for page in document]
        from app.paper_metadata import pdf_bibliography_metadata
        document_metadata = pdf_bibliography_metadata(document)
        document.close()
    except (fitz.FileDataError, RuntimeError, OSError) as exc:
        raise HTTPException(400, "PDF 无法读取，可能已损坏或受保护") from exc
    extracted = "\n".join(texts).strip()
    chars_per_page = len(extracted) / max(page_count, 1)
    confidence = round(min(1.0, chars_per_page / 900), 2)
    warning = None
    if not extracted:
        warning = "未提取到可搜索文本，可能是扫描版 PDF；建议上传高清可检索版本。"
        fulltext_status = "仅元数据或摘要"
    elif confidence < 0.35:
        warning = "文本提取质量较低，部分结论可能不可靠；建议核对原始 PDF 页面。"
        fulltext_status = "全文解析质量低"
    else:
        fulltext_status = "已读取全文"
    return extracted, page_count, confidence, warning, fulltext_status, document_metadata


def _knowledge_conversation_prompt(
    question: str,
    history: list[object],
) -> str:
    if not history:
        return question
    lines = [
        "以下是同一页面中的既往问答，仅用于理解当前追问，不能作为论文证据："
    ]
    for index, turn in enumerate(history, start=1):
        lines.extend(
            [
                f"第{index}轮问题：{turn.question}",
                f"第{index}轮回答：{turn.answer_markdown}",
            ]
        )
    lines.extend(
        [
            f"当前追问：{question}",
            "请仅用本轮提供的编号证据支持重要结论。",
        ]
    )
    return "\n".join(lines)


def _canonical_search_candidate(
    paper: object,
) -> tuple[KnownPaperSource, str]:
    for candidate in getattr(paper, "candidates", ()):
        source = getattr(candidate, "source", "")
        external_id = getattr(candidate, "external_id", "")
        if (
            source in _PAPER_SOURCE_NAMES
            and isinstance(external_id, str)
            and external_id.strip()
        ):
            return source, external_id.strip()
    source = getattr(paper, "source", "")
    external_id = getattr(paper, "external_id", "")
    if (
        source in _PAPER_SOURCE_NAMES
        and isinstance(external_id, str)
        and external_id.strip()
    ):
        return source, external_id.strip()
    raise ValueError("search paper has no supported import identity")


def _year_from_published_date(value: object) -> int | None:
    if not isinstance(value, str) or len(value) < 4:
        return None
    year_text = value[:4]
    return int(year_text) if year_text.isdigit() else None


def _search_paper_states(
    session_factory: object,
    paper_ids: list[int | None],
) -> dict[int, tuple[bool, bool]]:
    ids = {paper_id for paper_id in paper_ids if paper_id is not None}
    if not ids:
        return {}
    try:
        with session_factory() as db:
            rows = db.execute(
                select(Paper.id, Paper.is_favorite, Paper.is_read).where(
                    Paper.id.in_(ids)
                )
            )
            return {
                paper_id: (bool(is_favorite), bool(is_read))
                for paper_id, is_favorite, is_read in rows
            }
    except Exception:
        return {}


def _search_imported_paper_ids(
    session_factory: object,
    papers: list[object],
) -> list[int | None]:
    """Resolve imported papers after network I/O using bounded batch reads."""

    if not papers:
        return []
    identities: list[
        tuple[
            str | None,
            str | None,
            tuple[str, str, int] | None,
            tuple[str, str],
        ]
    ] = []
    dois: set[str] = set()
    arxiv_ids: set[str] = set()
    title_keys: set[tuple[str, str, int]] = set()
    normalized_titles: set[str] = set()
    source_keys: set[tuple[str, str]] = set()
    for paper in papers:
        doi = normalize_doi(getattr(paper, "doi", None))
        arxiv_id = normalize_arxiv_id(getattr(paper, "arxiv_id", None))
        title = normalize_title(getattr(paper, "title", ""))
        first_author = normalize_title(getattr(paper, "first_author", ""))
        year = getattr(paper, "year", None)
        title_key = (
            (title, first_author, year)
            if title and first_author and type(year) is int
            else None
        )
        import_source, import_external_id = _canonical_search_candidate(paper)
        import_key = (import_source, import_external_id)
        identities.append((doi, arxiv_id, title_key, import_key))
        if doi:
            dois.add(doi)
        if arxiv_id:
            arxiv_ids.add(arxiv_id)
        if title_key is not None:
            title_keys.add(title_key)
            normalized_titles.add(title_key[0])
        source_keys.add(import_key)

    doi_matches: dict[str, set[int]] = {}
    arxiv_matches: dict[str, set[int]] = {}
    title_matches: dict[tuple[str, str, int], set[int]] = {}
    source_matches: dict[tuple[str, str], set[int]] = {}
    title_overflow = False
    try:
        with session_factory() as db:
            try:
                if dois:
                    rows = db.execute(
                        select(Paper.id, Paper.doi)
                        .where(Paper.doi.in_(dois))
                        .limit(len(dois) + 1)
                    )
                    for paper_id, value in rows:
                        normalized = normalize_doi(value)
                        if normalized:
                            doi_matches.setdefault(normalized, set()).add(
                                paper_id
                            )
                if arxiv_ids:
                    rows = db.execute(
                        select(Paper.id, Paper.arxiv_id)
                        .where(Paper.arxiv_id.in_(arxiv_ids))
                        .limit(len(arxiv_ids) + 1)
                    )
                    for paper_id, value in rows:
                        normalized = normalize_arxiv_id(value)
                        if normalized:
                            arxiv_matches.setdefault(normalized, set()).add(
                                paper_id
                            )
                if normalized_titles:
                    title_limit = max(100, len(normalized_titles) * 20)
                    title_rows = list(
                        db.execute(
                            select(
                                Paper.id,
                                Paper.normalized_title,
                                Paper.authors_json,
                                Paper.published_date,
                            )
                            .where(
                                Paper.normalized_title.in_(normalized_titles)
                            )
                            .limit(title_limit + 1)
                        )
                    )
                    title_overflow = len(title_rows) > title_limit
                    if not title_overflow:
                        for (
                            paper_id,
                            normalized_title,
                            authors_json,
                            published_date,
                        ) in title_rows:
                            authors = _json_string_list(authors_json)
                            first_author = (
                                normalize_title(authors[0]) if authors else ""
                            )
                            year = _year_from_published_date(published_date)
                            key = (
                                normalize_title(normalized_title),
                                first_author,
                                year,
                            )
                            if (
                                key in title_keys
                                and first_author
                                and year is not None
                            ):
                                title_matches.setdefault(key, set()).add(
                                    paper_id
                                )
                if source_keys:
                    rows = db.execute(
                        select(
                            PaperSourceRecord.source,
                            PaperSourceRecord.external_id,
                            PaperSourceRecord.paper_id,
                        )
                        .where(
                            tuple_(
                                PaperSourceRecord.source,
                                PaperSourceRecord.external_id,
                            ).in_(source_keys)
                        )
                        .limit(len(source_keys) + 1)
                    )
                    for source, external_id, paper_id in rows:
                        source_matches.setdefault(
                            (source, external_id),
                            set(),
                        ).add(paper_id)
            finally:
                if db.in_transaction():
                    db.rollback()
    except Exception:
        return [None] * len(papers)

    matched_ids: list[int | None] = []
    for doi, arxiv_id, title_key, import_key in identities:
        strong_signals: list[set[int]] = []
        if doi:
            strong_signals.append(doi_matches.get(doi, set()))
        if arxiv_id:
            strong_signals.append(arxiv_matches.get(arxiv_id, set()))
        strong_signals.append(source_matches.get(import_key, set()))
        strong_ids = set().union(
            *(signal for signal in strong_signals if signal)
        )
        if len(strong_ids) == 1:
            matched_ids.append(next(iter(strong_ids)))
            continue
        if len(strong_ids) > 1:
            matched_ids.append(None)
            continue
        weak_ids = (
            title_matches.get(title_key, set())
            if title_key is not None and not title_overflow
            else set()
        )
        matched_ids.append(next(iter(weak_ids)) if len(weak_ids) == 1 else None)
    return matched_ids


def _search_paper_response(
    paper: object,
    *,
    paper_id: int | None,
    is_favorite: bool = False,
    is_read: bool = False,
) -> SearchPaperResponse:
    import_source, import_external_id = _canonical_search_candidate(paper)
    return SearchPaperResponse(
        source=import_source,
        external_id=import_external_id,
        import_source=import_source,
        import_external_id=import_external_id,
        already_imported=paper_id is not None,
        paper_id=paper_id,
        title=paper.title,
        authors=list(paper.authors),
        first_author=paper.first_author,
        abstract=paper.abstract,
        doi=paper.doi,
        arxiv_id=paper.arxiv_id,
        journal=paper.journal,
        published_date=paper.published_date,
        year=paper.year,
        keywords=list(paper.keywords),
        landing_url=paper.landing_url,
        pdf_url=paper.pdf_url,
        is_open_access=paper.is_open_access,
        oa_status=paper.oa_status,
        license=paper.license,
        sources=[
            source
            for source in paper.sources
            if source in _PAPER_SOURCE_NAMES
        ],
        candidates=[
            {"source": candidate.source, "external_id": candidate.external_id}
            for candidate in paper.candidates
            if candidate.source in _PAPER_SOURCE_NAMES
            and isinstance(candidate.external_id, str)
            and candidate.external_id.strip()
        ],
        relevance_score=paper.relevance_score,
        relevance_reasons=list(paper.relevance_reasons),
        article_type=paper.article_type,
        citation_count=paper.citation_count,
        is_favorite=is_favorite,
        is_read=is_read,
    )


def _paper_analysis_report_payload(analysis: Analysis | None) -> dict[str, object] | None:
    """Build the current-version report payload for a paper's analysis row."""
    if analysis is None:
        return None
    current_report = lambda report_type, value, prompt_actual, schema_actual: (
        value if is_usable_report_version(report_type, prompt_actual, schema_actual) else ""
    )
    return {
        "quick_understanding": current_report(AnalysisReportType.quick_understanding, analysis.quick_understanding, analysis.quick_prompt_version, analysis.quick_schema_version),
        "quick_prompt_version": analysis.quick_prompt_version,
        "quick_schema_version": analysis.quick_schema_version,
        "quick_evidence_status": analysis.quick_evidence_status,
        "layman_understanding": current_report(AnalysisReportType.layman_understanding, analysis.layman_understanding, analysis.layman_prompt_version, analysis.layman_schema_version),
        "layman_prompt_version": analysis.layman_prompt_version,
        "layman_schema_version": analysis.layman_schema_version,
        "layman_evidence_status": analysis.layman_evidence_status,
        "reviewer_analysis": current_report(AnalysisReportType.reviewer_analysis, analysis.reviewer_analysis, analysis.reviewer_prompt_version, analysis.reviewer_schema_version),
        "reviewer_prompt_version": analysis.reviewer_prompt_version,
        "reviewer_schema_version": analysis.reviewer_schema_version,
        "reviewer_evidence_status": analysis.reviewer_evidence_status,
    }
