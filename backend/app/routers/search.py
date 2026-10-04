"""Paper search, import and academic source status routes."""

from __future__ import annotations

import hashlib
from datetime import date

from fastapi import Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Paper
from app.paper_metadata import extract_local_paper_metadata
from app.paper_sources.base import SearchFilters
from app.paper_sources.registry import enabled_source_names
from app.pdf_visuals import PdfVisualError
from app.schemas import (
    KnownPaperSource,
    PaperImportRequest,
    PaperImportResponse,
    PaperPage,
    PaperResponse,
    PaperSearchResponse,
    SourceStatusResponse,
)
from app.services.paper_import import PaperImportError, PaperImportService
from app.services.paper_search import AllSourcesFailed, PaperSearchService

from ._shared import (
    _PAPER_FILE_LOCK,
    _PAPER_SOURCE_NAMES,
    _collect_source_statuses,
    _ensure_paper_visuals,
    _extract_pdf,
    _managed_paper_pdf,
    _paper_response,
    _read_user_keywords,
    _search_imported_paper_ids,
    _search_paper_response,
    _search_paper_states,
    _source_map,
    _source_status_response,
    _strict_query_bool,
)


def register_search_routes(app, get_db) -> None:
    @app.get(
        "/api/v1/search/papers",
        response_model=PaperSearchResponse,
    )
    async def search_papers(
        q: str = Query(min_length=2, max_length=300),
        year_from: int | None = Query(default=None, ge=1900, le=date.today().year + 1),
        year_to: int | None = Query(default=None, ge=1900, le=date.today().year + 1),
        open_access_only: str = Query(default="false"),
        page: int = Query(default=1, ge=1, le=50),
        page_size: int = Query(default=20, ge=1, le=50),
        sources: list[KnownPaperSource] | None = Query(default=None),
        source: list[str] | None = Query(
            default=None,
            include_in_schema=False,
        ),
    ) -> PaperSearchResponse | JSONResponse:
        query = " ".join(q.split())
        if not 2 <= len(query) <= 300:
            raise HTTPException(422, "请求参数不合法：q")
        if year_from is not None and year_to is not None and year_from > year_to:
            raise HTTPException(422, "请求参数不合法：year_from")
        if source is not None:
            raise HTTPException(422, "请求参数不合法：source")
        open_access = _strict_query_bool(open_access_only)
        settings = get_settings()
        enabled = set(enabled_source_names(settings))
        selected_names = list(dict.fromkeys(sources or enabled_source_names(settings)))
        if sources is not None and any(name not in enabled for name in selected_names):
            raise HTTPException(400, "所选论文来源尚未启用")

        user_keywords = _read_user_keywords(app.state.session_factory)
        async with app.state.paper_source_client_factory() as client:
            available = _source_map(settings, client, app)
            selected_sources = [
                available[name]
                for name in selected_names
                if name in available
            ]
            service = PaperSearchService(
                selected_sources,
                user_keywords=user_keywords,
            )
            try:
                result = await service.search(
                    query,
                    SearchFilters(
                        year_from=year_from,
                        year_to=year_to,
                        open_access_only=open_access,
                        limit=50,
                    ),
                )
            except AllSourcesFailed as exc:
                statuses = [
                    _source_status_response(
                        source=status.source,
                        enabled=True,
                        ok=False,
                        message="来源暂不可用",
                        result_count=0,
                    ).model_dump(mode="json")
                    for status in exc.statuses
                    if status.source in _PAPER_SOURCE_NAMES
                ]
                return JSONResponse(
                    status_code=503,
                    content={
                        "detail": "所有论文来源暂时不可用，请稍后重试",
                        "source_statuses": statuses,
                    },
                )
            except ValueError:
                raise HTTPException(422, "请求参数不合法：搜索条件") from None

        search_items = list(result.items)
        imported_ids = _search_imported_paper_ids(
            app.state.session_factory,
            search_items,
        )
        imported_states = _search_paper_states(
            app.state.session_factory,
            imported_ids,
        )
        all_items = [
            _search_paper_response(
                item,
                paper_id=paper_id,
                is_favorite=imported_states.get(paper_id, (False, False))[0],
                is_read=imported_states.get(paper_id, (False, False))[1],
            )
            for item, paper_id in zip(search_items, imported_ids)
        ]
        start = (page - 1) * page_size
        statuses = [
            _source_status_response(
                source=status.source,
                enabled=True,
                ok=status.ok,
                message="搜索成功" if status.ok else "来源暂不可用",
                result_count=status.result_count,
            )
            for status in result.source_statuses
            if status.source in _PAPER_SOURCE_NAMES
        ]
        return PaperSearchResponse(
            items=all_items[start : start + page_size],
            total_before_pagination=len(all_items),
            page=page,
            page_size=page_size,
            warnings=list(result.warnings),
            source_statuses=statuses,
        )

    @app.post(
        "/api/v1/papers/import",
        response_model=PaperImportResponse,
    )
    async def import_paper(payload: PaperImportRequest) -> PaperImportResponse:
        settings = get_settings()
        enabled = set(enabled_source_names(settings))
        if payload.source not in enabled:
            raise HTTPException(400, "该论文来源尚未启用")
        external_id = payload.external_id.strip()
        if not external_id:
            raise HTTPException(400, "论文来源标识无效")

        async with app.state.paper_source_client_factory() as client:
            available = _source_map(settings, client, app)
            source = available.get(payload.source)
            if source is None:
                raise HTTPException(503, "论文来源暂时不可用，请稍后重试")
            with app.state.session_factory() as db:
                try:
                    result = await PaperImportService(
                        session=db,
                        sources={payload.source: source},
                        storage_dir=settings.paper_storage_dir,
                        timeout_seconds=settings.paper_download_timeout_seconds,
                        max_size_mb=settings.paper_download_max_mb,
                    ).import_paper(
                        payload.source,
                        external_id,
                        download_open_pdf=payload.download_open_pdf,
                    )
                except PaperImportError as exc:
                    if exc.code in {"unknown_source", "invalid_external_id"}:
                        status_code = 400
                    elif exc.code in {
                        "identity_conflict",
                        "source_identity_mismatch",
                        "database_conflict",
                    }:
                        status_code = 409
                    else:
                        status_code = 503
                    messages = {
                        400: "论文导入请求无效",
                        409: "论文标识与现有记录冲突",
                        503: "论文导入服务暂时不可用，请稍后重试",
                    }
                    raise HTTPException(status_code, messages[status_code]) from None

                if result.download_succeeded and result.paper.file_path:
                    try:
                        _ensure_paper_visuals(
                            db,
                            result.paper,
                            _managed_paper_pdf(result.paper),
                        )
                    except (PdfVisualError, HTTPException):
                        # The paper remains usable and the catalog can retry
                        # lazily when the user opens its detail page.
                        db.rollback()
                return PaperImportResponse(
                    paper=_paper_response(result.paper),
                    created=result.created,
                    duplicate_reason=(
                        None
                        if result.duplicate_reason is None
                        else {
                            "kind": result.duplicate_reason.kind,
                            "paper_id": result.duplicate_reason.paper_id,
                        }
                    ),
                    download_attempted=result.download_attempted,
                    download_succeeded=result.download_succeeded,
                    warning=result.warning,
                )

    @app.get(
        "/api/v1/sources/status",
        response_model=list[SourceStatusResponse],
    )
    async def source_statuses() -> list[SourceStatusResponse]:
        settings = get_settings()
        return await _collect_source_statuses(app, settings)
