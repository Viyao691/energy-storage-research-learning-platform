from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Literal

import fitz
from fastapi import BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, StrictBool
from sqlalchemy import func, select
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.config import get_settings
from app.knowledge import EmbeddingProviderError, index_paper
from app.models import (
    Analysis,
    Note,
    Paper,
    PaperPageExtraction,
    PaperParseRun,
    ScientificDataset,
    UserSetting,
)
from app.schemas import (
    CloudEnhanceResponse,
    DocumentAiInstallResponse,
    DocumentAiStatusResponse,
    OcrCancelResponse,
    OcrRunListResponse,
    OcrRunResponse,
    DocumentParsersStatusResponse,
    ParseCandidateComparisonResponse,
    ParseCandidateListResponse,
    ParseCandidateResponse,
)
from app.secrets import get_document_vision_api_key


class ModelInstallRequest(BaseModel):
    confirmed: StrictBool


class OcrRunRequest(BaseModel):
    mode: Literal["auto", "full"] = "auto"


class CloudEnhanceRequest(BaseModel):
    confirmed: StrictBool


class ParseCandidateRequest(BaseModel):
    confirmed: StrictBool


def _page_dict(page: PaperPageExtraction) -> dict[str, object]:
    return {
        "page_number": page.page_number,
        "source_type": page.source_type,
        "confidence": page.confidence,
        "confirmation_status": page.confirmation_status,
    }


def _run_payload(run: PaperParseRun, pages: list[PaperPageExtraction] | None = None) -> dict[str, object]:
    return {
        "id": run.id,
        "paper_id": run.paper_id,
        "version_number": run.version_number,
        "mode": run.mode,
        "status": run.status,
        "engine": run.engine,
        "device": run.device,
        "progress": run.progress,
        "quality_score": run.quality_score,
        "derivative_file_path": run.derivative_file_path,
        "warnings": json.loads(run.warnings_json or "[]"),
        "error_message": run.error_message,
        "pages": [_page_dict(page) for page in (pages or [])],
    }


def _candidate_page_dict(page: PaperPageExtraction) -> dict[str, object]:
    return {
        **_page_dict(page),
        "page_width": page.page_width,
        "page_height": page.page_height,
    }


def _candidate_payload(
    run: PaperParseRun, pages: list[PaperPageExtraction] | None = None
) -> dict[str, object]:
    return {
        "id": run.id,
        "paper_id": run.paper_id,
        "version_number": run.version_number,
        "mode": run.mode,
        "status": run.status,
        "engine": "docling",
        "engine_version": run.engine_version,
        "device": run.device,
        "progress": run.progress,
        "quality_score": run.quality_score,
        "warnings": json.loads(run.warnings_json or "[]"),
        "error_message": run.error_message,
        "pages": [_candidate_page_dict(page) for page in (pages or [])],
    }


def register_document_ai_routes(app, get_db, managed_paper_pdf) -> None:
    @app.get(
        "/api/v1/document-parsers/status",
        response_model=DocumentParsersStatusResponse,
    )
    def document_parsers_status() -> DocumentParsersStatusResponse:
        return DocumentParsersStatusResponse(
            docling=app.state.document_ai_manager.parser_status()
        )

    @app.get("/api/v1/document-ai/status", response_model=DocumentAiStatusResponse)
    def document_ai_status() -> DocumentAiStatusResponse:
        return DocumentAiStatusResponse(**app.state.document_ai_manager.status())

    @app.post("/api/v1/document-ai/models/install", status_code=202, response_model=DocumentAiInstallResponse)
    def install_document_ai_models(
        payload: ModelInstallRequest, background: BackgroundTasks
    ) -> DocumentAiInstallResponse:
        if not payload.confirmed:
            raise HTTPException(status_code=422, detail="必须明确确认后才能下载本地 OCR 模型。")
        if app.state.document_ai_manager.status()["local_model"]["installed"]:
            return DocumentAiInstallResponse(status="installed")
        background.add_task(app.state.document_ai_manager.install_models)
        return DocumentAiInstallResponse(status="installing")

    @app.post("/api/v1/papers/{paper_id}/ocr-runs", status_code=202, response_model=OcrRunResponse)
    def create_ocr_run(
        paper_id: int,
        payload: OcrRunRequest,
        background: BackgroundTasks,
        db: Session = Depends(get_db),
    ) -> OcrRunResponse:
        paper = db.get(Paper, paper_id)
        if paper is None or not paper.file_path or not Path(paper.file_path).is_file():
            raise HTTPException(status_code=404, detail="论文原文件不存在。")
        managed_paper_pdf(paper)
        active = db.scalar(select(PaperParseRun.id).where(PaperParseRun.status.in_(("queued", "running"))).limit(1))
        if active is not None:
            raise HTTPException(status_code=409, detail="已有文档解析任务正在运行。")
        version = (db.scalar(select(func.max(PaperParseRun.version_number)).where(PaperParseRun.paper_id == paper_id)) or 0) + 1
        run = PaperParseRun(
            paper_id=paper_id,
            version_number=version,
            mode=payload.mode,
            status="queued",
            source_quality_score=paper.parse_confidence,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        background.add_task(app.state.document_ai_manager.run_ocr, app.state.session_factory, run.id)
        return OcrRunResponse(**{**_run_payload(run), "pages": []})

    @app.get("/api/v1/ocr-runs/{run_id}", response_model=OcrRunResponse)
    def get_ocr_run(run_id: int, db: Session = Depends(get_db)) -> OcrRunResponse:
        run = db.get(PaperParseRun, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="OCR 任务不存在。")
        pages = list(db.scalars(select(PaperPageExtraction).where(PaperPageExtraction.parse_run_id == run_id).order_by(PaperPageExtraction.page_number)))
        return OcrRunResponse(**{**_run_payload(run, pages), "pages": [_page_dict(page) for page in pages]})

    @app.get("/api/v1/papers/{paper_id}/ocr-runs", response_model=OcrRunListResponse)
    def list_ocr_runs(paper_id: int, db: Session = Depends(get_db)) -> OcrRunListResponse:
        if db.get(Paper, paper_id) is None:
            raise HTTPException(status_code=404, detail="论文不存在。")
        runs = list(db.scalars(select(PaperParseRun).where(PaperParseRun.paper_id == paper_id).order_by(PaperParseRun.version_number.desc())))
        items: list[OcrRunResponse] = []
        for run in runs:
            pages = list(db.scalars(select(PaperPageExtraction).where(PaperPageExtraction.parse_run_id == run.id).order_by(PaperPageExtraction.page_number)))
            items.append(OcrRunResponse(**{**_run_payload(run, pages), "pages": [_page_dict(page) for page in pages]}))
        return OcrRunListResponse(items=items)

    @app.post("/api/v1/ocr-runs/{run_id}/cancel", response_model=OcrCancelResponse)
    def cancel_ocr_run(run_id: int, db: Session = Depends(get_db)) -> OcrCancelResponse:
        run = db.get(PaperParseRun, run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="OCR 任务不存在。")
        if run.status not in {"queued", "running"}:
            raise HTTPException(status_code=409, detail="当前任务不能取消。")
        run.cancel_requested = True
        db.commit()
        return OcrCancelResponse(id=run.id, status="cancelling")

    @app.post(
        "/api/v1/papers/{paper_id}/parse-candidates",
        status_code=202,
        response_model=ParseCandidateResponse,
    )
    def create_parse_candidate(
        paper_id: int,
        payload: ParseCandidateRequest,
        background: BackgroundTasks,
        db: Session = Depends(get_db),
    ) -> ParseCandidateResponse:
        if not payload.confirmed:
            raise HTTPException(
                status_code=422,
                detail="必须明确确认后才能运行 Docling 实验解析。",
            )
        capability = app.state.document_ai_manager.parser_status()
        if not capability["ready"]:
            raise HTTPException(status_code=409, detail=str(capability["reason"]))
        paper = db.get(Paper, paper_id)
        if paper is None or not paper.file_path or not Path(paper.file_path).is_file():
            raise HTTPException(status_code=404, detail="论文原文件不存在。")
        managed_paper_pdf(paper)
        active = db.scalar(
            select(PaperParseRun.id)
            .where(PaperParseRun.status.in_(("queued", "running")))
            .limit(1)
        )
        if active is not None:
            raise HTTPException(status_code=409, detail="已有文档解析任务正在运行。")
        version = (
            db.scalar(
                select(func.max(PaperParseRun.version_number)).where(
                    PaperParseRun.paper_id == paper_id
                )
            )
            or 0
        ) + 1
        run = PaperParseRun(
            paper_id=paper_id,
            version_number=version,
            mode="candidate",
            status="queued",
            engine="docling",
            engine_version=str(capability["version"]),
            source_quality_score=paper.parse_confidence,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        background.add_task(
            app.state.document_ai_manager.run_candidate,
            app.state.session_factory,
            run.id,
        )
        return ParseCandidateResponse(**_candidate_payload(run))

    @app.get(
        "/api/v1/parse-candidates/{run_id}",
        response_model=ParseCandidateResponse,
    )
    def get_parse_candidate(
        run_id: int, db: Session = Depends(get_db)
    ) -> ParseCandidateResponse:
        run = db.get(PaperParseRun, run_id)
        if run is None or run.engine != "docling":
            raise HTTPException(status_code=404, detail="实验解析任务不存在。")
        pages = list(
            db.scalars(
                select(PaperPageExtraction)
                .where(PaperPageExtraction.parse_run_id == run_id)
                .order_by(PaperPageExtraction.page_number)
            )
        )
        return ParseCandidateResponse(**_candidate_payload(run, pages))

    @app.get(
        "/api/v1/papers/{paper_id}/parse-candidates",
        response_model=ParseCandidateListResponse,
    )
    def list_parse_candidates(
        paper_id: int, db: Session = Depends(get_db)
    ) -> ParseCandidateListResponse:
        if db.get(Paper, paper_id) is None:
            raise HTTPException(status_code=404, detail="论文不存在。")
        runs = list(
            db.scalars(
                select(PaperParseRun)
                .where(
                    PaperParseRun.paper_id == paper_id,
                    PaperParseRun.engine == "docling",
                )
                .order_by(PaperParseRun.version_number.desc())
            )
        )
        return ParseCandidateListResponse(
            items=[
                ParseCandidateResponse(**_candidate_payload(run)) for run in runs
            ]
        )

    @app.get(
        "/api/v1/parse-candidates/{run_id}/comparison",
        response_model=ParseCandidateComparisonResponse,
    )
    def compare_parse_candidate(
        run_id: int, db: Session = Depends(get_db)
    ) -> ParseCandidateComparisonResponse:
        run = db.get(PaperParseRun, run_id)
        if run is None or run.engine != "docling":
            raise HTTPException(status_code=404, detail="实验解析任务不存在。")
        if run.status != "completed":
            raise HTTPException(status_code=409, detail="实验解析尚未完成。")
        paper = db.get(Paper, run.paper_id)
        pages = list(
            db.scalars(
                select(PaperPageExtraction).where(
                    PaperPageExtraction.parse_run_id == run.id
                )
            )
        )
        candidate = _comparison_metrics(run.engine, pages, run.warnings_json, run=run)
        active_run = (
            db.get(PaperParseRun, paper.active_parse_run_id)
            if paper is not None and paper.active_parse_run_id is not None
            else None
        )
        active_pages = (
            list(
                db.scalars(
                    select(PaperPageExtraction).where(
                        PaperPageExtraction.parse_run_id == paper.active_parse_run_id
                    )
                )
            )
            if paper is not None and paper.active_parse_run_id is not None
            else []
        )
        active = _comparison_metrics(
            "current",
            active_pages,
            "[]",
            fallback_text=paper.extracted_text if paper is not None else "",
            fallback_pages=paper.page_count if paper is not None else 0,
            run=active_run,
        )
        run.comparison_viewed_at = datetime.utcnow()
        run.comparison_active_parse_run_id = paper.active_parse_run_id if paper else None
        db.commit()
        return ParseCandidateComparisonResponse(
            run_id=run.id, active=active, candidate=candidate
        )

    @app.post(
        "/api/v1/parse-candidates/{run_id}/cancel",
        response_model=OcrCancelResponse,
    )
    def cancel_parse_candidate(
        run_id: int, db: Session = Depends(get_db)
    ) -> OcrCancelResponse:
        run = db.get(PaperParseRun, run_id)
        if run is None or run.engine != "docling":
            raise HTTPException(status_code=404, detail="实验解析任务不存在。")
        if run.status not in {"queued", "running"}:
            raise HTTPException(status_code=409, detail="当前任务不能取消。")
        if run.status == "queued":
            run.status = "cancelled"
            run.completed_at = datetime.utcnow()
            status = "cancelled"
        else:
            run.cancel_requested = True
            status = "cancelling"
        db.commit()
        return OcrCancelResponse(id=run.id, status=status)

    @app.post(
        "/api/v1/parse-candidates/{run_id}/activate",
        response_model=ParseCandidateResponse,
    )
    def activate_parse_candidate(
        run_id: int,
        payload: ParseCandidateRequest,
        db: Session = Depends(get_db),
    ) -> ParseCandidateResponse:
        if not payload.confirmed:
            raise HTTPException(
                status_code=422,
                detail="必须在查看对比后再次确认启用实验解析。",
            )
        run = db.get(PaperParseRun, run_id)
        if run is None or run.engine != "docling":
            raise HTTPException(status_code=404, detail="实验解析任务不存在。")
        if run.status != "completed":
            raise HTTPException(status_code=409, detail="只有已完成的实验解析可以启用。")
        if run.comparison_viewed_at is None:
            raise HTTPException(status_code=409, detail="请先查看解析对比。")
        paper = db.get(Paper, run.paper_id)
        if paper is None:
            raise HTTPException(status_code=404, detail="论文不存在。")
        if paper.active_parse_run_id == run.id:
            raise HTTPException(status_code=409, detail="该实验解析已经是当前版本。")
        if run.comparison_active_parse_run_id != paper.active_parse_run_id:
            raise HTTPException(status_code=409, detail="当前解析版本已变化，请重新查看解析对比。")
        pages = list(
            db.scalars(
                select(PaperPageExtraction)
                .where(PaperPageExtraction.parse_run_id == run.id)
                .order_by(PaperPageExtraction.page_number)
            )
        )
        if not pages:
            raise HTTPException(status_code=409, detail="实验解析没有可启用的页面结果。")
        note = db.scalar(select(Note).where(Note.paper_id == paper.id))
        settings = get_settings()
        try:
            embedding_provider = app.state.embedding_provider_factory(
                settings.embedding_provider,
                settings.embedding_base_url,
                settings.embedding_model,
                settings.embedding_timeout_seconds,
            )
            ready, message = embedding_provider.test_connection()
            if not ready:
                raise EmbeddingProviderError(message)
            page_texts = [page.text for page in pages]
            new_text = "\n\n".join(page_texts)
            paper.extracted_text = new_text
            paper.parse_confidence = run.quality_score
            index_paper(
                db,
                paper,
                embedding_provider,
                page_texts=page_texts,
                note_text=note.content if note is not None else "",
                max_chars=settings.knowledge_chunk_size,
                overlap=settings.knowledge_chunk_overlap,
                parse_run_id=run.id,
                source_pages=pages,
                commit=False,
            )
            paper.active_parse_run_id = run.id
            paper.knowledge_index_stale = False
            db.execute(
                update(Analysis)
                .where(Analysis.paper_id == paper.id)
                .values(is_stale=True, stale_reason="论文解析版本已更新")
            )
            db.execute(
                update(ScientificDataset)
                .where(ScientificDataset.paper_id == paper.id)
                .values(is_stale=True)
            )
            db.commit()
        except EmbeddingProviderError as exc:
            db.rollback()
            raise HTTPException(status_code=503, detail=str(exc)) from None
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=500, detail="实验解析启用失败，原版本已保留。"
            ) from None
        return ParseCandidateResponse(**_candidate_payload(run, pages))

    @app.post("/api/v1/papers/{paper_id}/pages/{page_number}/cloud-enhance", response_model=CloudEnhanceResponse)
    def cloud_enhance_page(
        paper_id: int,
        page_number: int,
        payload: CloudEnhanceRequest,
        db: Session = Depends(get_db),
    ) -> CloudEnhanceResponse:
        if not payload.confirmed:
            raise HTTPException(status_code=422, detail="必须确认仅上传所选页面后才能继续。")
        paper = db.get(Paper, paper_id)
        if paper is None or not paper.file_path:
            raise HTTPException(status_code=404, detail="论文不存在。")
        with fitz.open(managed_paper_pdf(paper)) as document:
            if page_number < 1 or page_number > len(document):
                raise HTTPException(status_code=404, detail="页码不存在。")
            page = document[page_number - 1]
            local_text = page.get_text("text")
            page_png = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False).tobytes("png")
        result = app.state.document_ai_manager.cloud_enhance(
            page_png=page_png,
            page_number=page_number,
            local_text=local_text,
            caption_context="",
            **(
                {
                    "provider": setting.document_vision_provider,
                    "model": setting.document_vision_model,
                    "base_url": setting.document_vision_base_url,
                    "timeout_seconds": setting.document_vision_timeout_seconds,
                    "api_key": get_document_vision_api_key(setting.document_vision_provider, setting.document_vision_base_url),
                }
                if (setting := db.get(UserSetting, 1)) is not None
                else {}
            ),
        )
        version = (db.scalar(select(func.max(PaperParseRun.version_number)).where(PaperParseRun.paper_id == paper_id)) or 0) + 1
        run = PaperParseRun(
            paper_id=paper_id,
            version_number=version,
            mode="cloud_page",
            status="completed",
            engine="cloud-vision",
            device="cloud",
            progress=1.0,
            quality_score=float(result.get("confidence", 0.0)),
            source_quality_score=paper.parse_confidence,
            completed_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(run)
        db.flush()
        extraction = PaperPageExtraction(
            parse_run_id=run.id,
            paper_id=paper_id,
            page_number=page_number,
            source_type="cloud_vision",
            text=str(result.get("text", "")),
            layout_json=json.dumps(result.get("layout", []), ensure_ascii=False),
            confidence=float(result.get("confidence", 0.0)),
            confirmation_status="pending",
        )
        db.add(extraction)
        db.commit()
        return CloudEnhanceResponse(
            run_id=run.id,
            page_number=page_number,
            text=extraction.text,
            confidence=extraction.confidence,
            confirmation_status=extraction.confirmation_status,
            evidence_status="云端视觉增强（待人工确认）",
        )


def _comparison_metrics(
    engine: str,
    pages: list[PaperPageExtraction],
    warnings_json: str,
    *,
    fallback_text: str = "",
    fallback_pages: int = 0,
    run: PaperParseRun | None = None,
) -> dict[str, object]:
    def count_json(field: str) -> int:
        total = 0
        for page in pages:
            try:
                value = json.loads(getattr(page, field) or "[]")
            except json.JSONDecodeError:
                value = []
            total += len(value) if isinstance(value, list) else 0
        return total

    try:
        warnings = json.loads(warnings_json or "[]")
    except json.JSONDecodeError:
        warnings = []
    text = "\n".join(page.text for page in pages) if pages else fallback_text
    duration_seconds = (
        max(0.0, (run.completed_at - run.started_at).total_seconds())
        if run is not None and run.started_at is not None and run.completed_at is not None
        else None
    )
    return {
        "engine": engine,
        "characters": len(text),
        "pages": len(pages) if pages else fallback_pages,
        "tables": count_json("tables_json"),
        "formulas": count_json("formulas_json"),
        "figures": count_json("figures_json"),
        "duration_seconds": duration_seconds,
        "warnings": warnings if isinstance(warnings, list) else [],
    }
