"""Paper library routes: upload, CRUD, visuals, crops, analysis, claims, note."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from threading import Lock
from typing import Literal

from fastapi import Depends, File, HTTPException, Query, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.formula_ocr import FormulaOcrError, transcribe_formula
from app.claim_evidence import extract_claim_candidates, list_claim_evidence, rebuild_claim_evidence
from app.knowledge import EmbeddingProviderError, index_paper, make_embedding_provider
from app.models import (
    Analysis,
    Note,
    Paper,
    PaperClaim,
    PaperGlossary,
    PaperChunk,
    PaperPageExtraction,
    PaperSourceRecord,
    PaperVisual,
    PaperVisualCrop,
    TaskRun,
)
from app.paper_analysis import (
    AnalysisReportType,
    REPORT_PROMPT_VERSIONS,
    REPORT_SCHEMA_VERSIONS,
    build_paper_analysis_context,
)
from app.paper_glossary import GLOSSARY_STATUS, glossary_ask_prompt, glossary_required_terms, glossary_terms_prompt, parse_glossary_answer, parse_glossary_terms
from app.paper_metadata import complete_public_bibliography, extract_local_paper_metadata
from app.pdf_visuals import (
    PdfVisualError,
    build_visual_analysis_context,
    extract_page_texts,
    paper_figure_thumbnail,
    render_pdf_crop,
    render_pdf_page,
)
from app.providers import ModelProviderError, make_provider
from app.schemas import (
    AnalysisReportPayload,
    FormulaTranscriptionResponse,
    GlossaryAskRequest,
    GlossaryAskResponse,
    GlossaryGenerateResponse,
    ExternalComparisonCurrentPaperResponse,
    ExternalComparisonPaperResponse,
    ExternalComparisonRequest,
    ExternalComparisonResponse,
    NoteUpdate,
    PaperDeleteRequest,
    PaperDeleteResponse,
    PaperDetailResponse,
    PaperCollectionCounts,
    PaperPage,
    PaperResponse,
    PaperStateUpdate,
    PaperVisualCropCreate,
    PaperVisualCropResponse,
    PaperVisualResponse,
    PaperClaimsResponse,
)
from app.secrets import get_model_api_key

from ._shared import (
    _PAPER_FILE_LOCK,
    _ensure_paper_visuals,
    _extract_pdf,
    _get_setting,
    _knowledge_conversation_prompt,
    _managed_paper_pdf,
    _paper_analysis_report_payload,
    _paper_claim_response,
    _paper_file_is_still_referenced,
    _paper_response,
    _paper_visual_crop_response,
    _paper_visual_response,
    _read_user_keywords,
    _source_map,
)
from app.paper_sources.base import SearchFilters
from app.paper_sources.registry import enabled_source_names
from app.providers import KnowledgeContext
from app.services.paper_search import AllSourcesFailed, PaperSearchService
from app.knowledge import (
    confidence_from_hits,
    retrieve_chunks,
    sanitize_citation_markers,
)


_GLOSSARY_LOCK = Lock()

def _analysis_fields_by_type(report_type: AnalysisReportType) -> tuple[str, str, str, str]:
    return {
        AnalysisReportType.quick_understanding: ("quick_understanding", "quick_prompt_version", "quick_schema_version", "quick_evidence_status"),
        AnalysisReportType.layman_understanding: ("layman_understanding", "layman_prompt_version", "layman_schema_version", "layman_evidence_status"),
        AnalysisReportType.reviewer_analysis: ("reviewer_analysis", "reviewer_prompt_version", "reviewer_schema_version", "reviewer_evidence_status"),
    }[report_type]


def register_papers_routes(app, get_db) -> None:
    @app.post("/api/v1/papers/upload", response_model=PaperResponse, status_code=201)
    async def upload_paper(file: UploadFile = File(...), db: Session = Depends(get_db)) -> PaperResponse:
        filename = Path(file.filename or "").name
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(400, "仅支持上传 PDF 文件")
        if file.content_type not in {"application/pdf", "application/x-pdf", None, ""}:
            raise HTTPException(400, "文件 MIME 类型不是 PDF")
        max_size = get_settings().max_upload_size_mb * 1024 * 1024
        directory = get_settings().paper_storage_dir
        directory.mkdir(parents=True, exist_ok=True)
        temporary = directory / f".upload-{hashlib.sha256(filename.encode('utf-8')).hexdigest()}-{id(file)}.tmp"
        digest_builder, file_size, first_bytes = hashlib.sha256(), 0, b""
        try:
            with temporary.open("wb") as destination_file:
                while chunk := await file.read(1024 * 1024):
                    file_size += len(chunk)
                    if file_size > max_size:
                        raise HTTPException(400, f"PDF 文件超过 {get_settings().max_upload_size_mb}MB 限制")
                    if len(first_bytes) < 5:
                        first_bytes += chunk[: 5 - len(first_bytes)]
                    digest_builder.update(chunk)
                    destination_file.write(chunk)
        except HTTPException:
            temporary.unlink(missing_ok=True)
            raise
        finally:
            await file.close()
        if not file_size:
            temporary.unlink(missing_ok=True)
            raise HTTPException(400, "PDF 文件为空")
        if not first_bytes.startswith(b"%PDF-"):
            temporary.unlink(missing_ok=True)
            raise HTTPException(400, "文件不是有效的 PDF 格式")
        digest = digest_builder.hexdigest()
        destination = directory / f"{digest}.pdf"
        existing = db.scalar(select(Paper).where(Paper.file_hash == digest))
        if existing:
            temporary.unlink(missing_ok=True)
            raise HTTPException(409, {"message": "检测到重复上传：该 PDF 已存在于论文库", "paper_id": existing.id})
        try:
            extracted, page_count, confidence, warning, fulltext_status, document_metadata = _extract_pdf(temporary)
        except HTTPException:
            temporary.unlink(missing_ok=True)
            raise
        local_metadata = extract_local_paper_metadata(
            filename=filename, text=extracted, document_metadata=document_metadata,
        )
        local_metadata = await complete_public_bibliography(local_metadata)
        with _PAPER_FILE_LOCK:
            existing = db.scalar(select(Paper).where(Paper.file_hash == digest))
            if existing:
                temporary.unlink(missing_ok=True)
                raise HTTPException(409, {"message": "检测到重复上传：该 PDF 已存在于论文库", "paper_id": existing.id})
            temporary.replace(destination)
            paper = Paper(
                original_filename=filename,
                title=local_metadata.title or filename.rsplit(".", 1)[0] or "未命名论文",
                file_path=str(destination),
                file_hash=digest,
                file_size=file_size,
                page_count=page_count,
                extracted_text=extracted,
                parse_confidence=confidence,
                extraction_warning=warning,
                fulltext_status=fulltext_status,
                doi=local_metadata.doi,
                journal=local_metadata.journal,
                published_date=local_metadata.published_date,
                keywords_json=json.dumps(list(local_metadata.keywords), ensure_ascii=False),
                article_type=local_metadata.article_type,
            )
            db.add(paper)
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
                existing = db.scalar(select(Paper).where(Paper.file_hash == digest))
                if existing:
                    raise HTTPException(409, {"message": "检测到并发重复上传：该 PDF 已存在于论文库", "paper_id": existing.id})
                destination.unlink(missing_ok=True)
                raise
            db.refresh(paper)
        try:
            _ensure_paper_visuals(db, paper, destination)
        except PdfVisualError:
            # Text extraction already succeeded.  A catalog failure should
            # not discard the safely stored paper; the route retries lazily.
            db.rollback()
        return _paper_response(paper)

    @app.get("/api/v1/papers", response_model=PaperPage)
    def list_papers(
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=100),
        collection: Literal["all", "favorites", "read", "unread"] = "all",
        db: Session = Depends(get_db),
    ) -> PaperPage:
        all_count, favorite_count, read_count, unread_count = db.execute(select(
            func.count(Paper.id),
            func.count(Paper.id).filter(Paper.is_favorite.is_(True)),
            func.count(Paper.id).filter(Paper.is_read.is_(True)),
            func.count(Paper.id).filter(Paper.is_read.is_(False)),
        )).one()
        counts = PaperCollectionCounts(all=all_count, favorites=favorite_count, read=read_count, unread=unread_count)
        query = select(Paper)
        if collection == "favorites":
            query = query.where(Paper.is_favorite.is_(True))
        elif collection == "read":
            query = query.where(Paper.is_read.is_(True))
        elif collection == "unread":
            query = query.where(Paper.is_read.is_(False))
        papers = db.scalars(query.order_by(Paper.created_at.desc(), Paper.id.desc()).offset((page - 1) * page_size).limit(page_size)).all()
        return PaperPage(items=[_paper_response(paper) for paper in papers], total=getattr(counts, collection), page=page, page_size=page_size, collection_counts=counts)

    @app.patch("/api/v1/papers/{paper_id}/state", response_model=PaperResponse)
    def update_paper_state(
        paper_id: int,
        payload: PaperStateUpdate,
        db: Session = Depends(get_db),
    ) -> PaperResponse:
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "未找到该论文")
        paper.is_favorite = payload.is_favorite
        paper.is_read = payload.is_read
        db.commit()
        db.refresh(paper)
        return _paper_response(paper)

    @app.get("/api/v1/papers/{paper_id}/file")
    def get_paper_file(
        paper_id: int,
        variant: Literal["original", "ocr"] = "original",
        db: Session = Depends(get_db),
    ) -> FileResponse:
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "未找到该论文")
        pdf_path = _managed_paper_pdf(paper, variant=variant)
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"paper-{paper.id}.pdf",
            content_disposition_type="inline",
        )

    @app.get(
        "/api/v1/papers/{paper_id}/visuals",
        response_model=list[PaperVisualResponse],
    )
    def get_paper_visuals(
        paper_id: int,
        db: Session = Depends(get_db),
    ) -> list[PaperVisualResponse]:
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "未找到该论文")
        pdf_path = _managed_paper_pdf(paper)
        try:
            visuals = _ensure_paper_visuals(db, paper, pdf_path)
        except PdfVisualError:
            raise HTTPException(404, "本地 PDF 无法读取或图表目录无法生成") from None
        return [_paper_visual_response(visual) for visual in visuals]

    @app.get("/api/v1/papers/{paper_id}/pages/{page_number}/image")
    def get_paper_page_image(
        paper_id: int,
        page_number: int,
        db: Session = Depends(get_db),
    ) -> Response:
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "未找到该论文")
        pdf_path = _managed_paper_pdf(paper)
        try:
            png = render_pdf_page(pdf_path, page_number)
        except PdfVisualError as exc:
            detail = (
                "页码超出 PDF 范围"
                if "页码" in str(exc)
                else "本地 PDF 页面无法生成预览"
            )
            raise HTTPException(404, detail) from None
        return Response(
            content=png,
            media_type="image/png",
            headers={"Cache-Control": "private, max-age=300"},
        )

    @app.get("/api/v1/papers/{paper_id}/figure-thumbnail")
    def get_paper_figure_thumbnail(
        paper_id: int,
        db: Session = Depends(get_db),
    ) -> Response:
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "未找到该论文")
        pdf_path = _managed_paper_pdf(paper)
        identity = f"v1:{paper.id}:{paper.file_hash or pdf_path.stat().st_mtime_ns}"
        name = hashlib.sha256(identity.encode()).hexdigest()
        cache_path = get_settings().paper_storage_dir / "cache" / "paper-thumbnails" / f"{name}.png"
        try:
            png = paper_figure_thumbnail(pdf_path, cache_path)
        except PdfVisualError:
            raise HTTPException(404, "该 PDF 没有可用的插图缩略图") from None
        if png is None:
            raise HTTPException(404, "该 PDF 没有合适的插图")
        return Response(content=png, media_type="image/png", headers={"Cache-Control": "private, max-age=3600"})

    @app.get(
        "/api/v1/papers/{paper_id}/visuals/{visual_id}/crops",
        response_model=list[PaperVisualCropResponse],
    )
    def list_paper_visual_crops(
        paper_id: int,
        visual_id: int,
        db: Session = Depends(get_db),
    ) -> list[PaperVisualCropResponse]:
        visual = db.get(PaperVisual, visual_id)
        if visual is None or visual.paper_id != paper_id:
            raise HTTPException(404, "未找到该论文对应的图表")
        crops = list(
            db.scalars(
                select(PaperVisualCrop)
                .where(PaperVisualCrop.visual_id == visual_id)
                .order_by(PaperVisualCrop.id.desc())
            )
        )
        return [_paper_visual_crop_response(crop) for crop in crops]

    @app.post(
        "/api/v1/papers/{paper_id}/visuals/{visual_id}/crops",
        response_model=PaperVisualCropResponse,
        status_code=201,
    )
    def save_paper_visual_crop(
        paper_id: int,
        visual_id: int,
        payload: PaperVisualCropCreate,
        db: Session = Depends(get_db),
    ) -> PaperVisualCropResponse:
        if db.get(Paper, paper_id) is None:
            raise HTTPException(404, "未找到该论文")
        visual = db.get(PaperVisual, visual_id)
        if visual is None or visual.paper_id != paper_id:
            raise HTTPException(404, "未找到该论文对应的图表")
        crop = PaperVisualCrop(
            paper_id=paper_id,
            visual_id=visual_id,
            left=payload.left,
            top=payload.top,
            width=payload.width,
            height=payload.height,
            label=payload.label,
        )
        db.add(crop)
        db.commit()
        db.refresh(crop)
        return _paper_visual_crop_response(crop)

    @app.get("/api/v1/crops/{crop_id}/image")
    def get_paper_visual_crop_image(
        crop_id: int,
        db: Session = Depends(get_db),
    ) -> Response:
        crop = db.get(PaperVisualCrop, crop_id)
        if crop is None:
            raise HTTPException(404, "已保存裁切区域不存在。")
        paper = db.get(Paper, crop.paper_id)
        if paper is None:
            raise HTTPException(404, "裁切区域对应的论文不存在。")
        try:
            png = render_pdf_crop(
                _managed_paper_pdf(paper),
                crop.visual.page_number,
                crop.left,
                crop.top,
                crop.width,
                crop.height,
            )
        except PdfVisualError:
            raise HTTPException(404, "本地 PDF 裁切预览无法生成") from None
        return Response(
            content=png,
            media_type="image/png",
            headers={"Cache-Control": "private, max-age=300"},
        )

    @app.delete(
        "/api/v1/papers/{paper_id}/visuals/{visual_id}/crops/{crop_id}",
        status_code=204,
    )
    def delete_paper_visual_crop(
        paper_id: int,
        visual_id: int,
        crop_id: int,
        db: Session = Depends(get_db),
    ) -> Response:
        crop = db.get(PaperVisualCrop, crop_id)
        if (
            crop is None
            or crop.paper_id != paper_id
            or crop.visual_id != visual_id
        ):
            raise HTTPException(404, "已保存裁切区域不存在。")
        db.delete(crop)
        db.commit()
        return Response(status_code=204)

    @app.post(
        "/api/v1/papers/{paper_id}/visuals/{visual_id}/analyze",
        response_model=PaperVisualResponse,
    )
    def analyze_paper_visual(
        paper_id: int,
        visual_id: int,
        db: Session = Depends(get_db),
    ) -> PaperVisualResponse:
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "未找到该论文")
        visual = db.get(PaperVisual, visual_id)
        if visual is None or visual.paper_id != paper_id:
            raise HTTPException(404, "未找到该论文对应的图表")

        pdf_path = _managed_paper_pdf(paper)
        setting = _get_setting(db)
        provider = make_provider(
            setting.model_provider,
            get_model_api_key(setting.model_provider, setting.model_base_url),
            setting.model_base_url,
            setting.model_name,
            setting.timeout_seconds,
            setting.vision_model,
        )
        if not provider.supports_vision:
            if setting.model_provider == "ollama":
                raise HTTPException(
                    409,
                    "尚未配置 Ollama 视觉模型，请在系统设置中填写并保存视觉模型",
                )
            raise HTTPException(
                409,
                "当前模型不支持图像分析，请切换到 OpenAI 或 Mock 模式",
            )

        try:
            page_texts = extract_page_texts(pdf_path)
            if visual.page_number > len(page_texts):
                raise PdfVisualError("页码超出 PDF 范围")
            png = render_pdf_page(pdf_path, visual.page_number)
            visual_context = build_visual_analysis_context(
                page_texts,
                visual.label,
                visual.caption,
                visual.page_number,
            )
            result = provider.analyze_visual(
                paper.title,
                visual.caption,
                visual_context,
                png,
            )
        except PdfVisualError:
            raise HTTPException(404, "本地 PDF 页面无法读取") from None
        except ModelProviderError as exc:
            raise HTTPException(502, str(exc)) from None

        visual.analysis_markdown = result.analysis_markdown
        visual.evidence_status = result.evidence_status
        visual.provider = provider.name
        visual.model_name = result.model_name
        db.commit()
        db.refresh(visual)
        return _paper_visual_response(visual)

    @app.post("/api/v1/crops/{crop_id}/transcribe-formula", response_model=FormulaTranscriptionResponse)
    def transcribe_paper_formula(crop_id: int, db: Session = Depends(get_db)):
        crop = db.get(PaperVisualCrop, crop_id)
        if crop is None:
            raise HTTPException(404, "已保存裁切区域不存在。")
        paper = db.get(Paper, crop.paper_id)
        if paper is None:
            raise HTTPException(404, "裁切区域对应的论文不存在。")
        try:
            png = render_pdf_crop(_managed_paper_pdf(paper), crop.visual.page_number,
                                  crop.left, crop.top, crop.width, crop.height)
            latex = transcribe_formula(png, get_settings().document_ai_model_dir / "docling")
        except PdfVisualError:
            raise HTTPException(404, "本地 PDF 裁切区域无法读取") from None
        except FormulaOcrError as exc:
            raise HTTPException(409, str(exc)) from None
        return FormulaTranscriptionResponse(
            crop_id=crop.id, paper_id=paper.id, page_number=crop.visual.page_number,
            latex=latex, evidence_status="AI转写（本地实验，未经人工核验）",
            model_name="CodeFormulaV2",
        )

    @app.post(
        "/api/v1/crops/{crop_id}/analyze",
        response_model=PaperVisualCropResponse,
    )
    def analyze_paper_visual_crop(
        crop_id: int,
        db: Session = Depends(get_db),
    ) -> PaperVisualCropResponse:
        crop = db.get(PaperVisualCrop, crop_id)
        if crop is None:
            raise HTTPException(404, "已保存裁切区域不存在。")
        paper = db.get(Paper, crop.paper_id)
        if paper is None:
            raise HTTPException(404, "裁切区域对应的论文不存在。")
        setting = _get_setting(db)
        provider = make_provider(
            setting.model_provider,
            get_model_api_key(setting.model_provider, setting.model_base_url),
            setting.model_base_url,
            setting.model_name,
            setting.timeout_seconds,
            setting.vision_model,
        )
        if not provider.supports_vision:
            raise HTTPException(409, "当前模型不支持图像分析，请切换到 OpenAI、Ollama 视觉模型或 Mock 模式。")
        try:
            pdf_path = _managed_paper_pdf(paper)
            page_texts = extract_page_texts(pdf_path)
            if crop.visual.page_number > len(page_texts):
                raise PdfVisualError("页码超出 PDF 范围")
            png = render_pdf_crop(
                pdf_path,
                crop.visual.page_number,
                crop.left,
                crop.top,
                crop.width,
                crop.height,
            )
            result = provider.analyze_visual(
                paper.title,
                (crop.visual.label + " " + crop.label).strip(),
                page_texts[crop.visual.page_number - 1],
                png,
            )
        except PdfVisualError:
            raise HTTPException(404, "本地 PDF 裁切区域无法读取") from None
        except ModelProviderError as exc:
            raise HTTPException(502, str(exc)) from None
        crop.analysis_markdown = result.analysis_markdown
        crop.evidence_status = result.evidence_status
        crop.provider = provider.name
        crop.model_name = result.model_name
        db.commit()
        db.refresh(crop)
        return _paper_visual_crop_response(crop)

    @app.post(
        "/api/v1/crops/{crop_id}/extract-data",
        response_model=PaperVisualCropResponse,
    )
    def extract_paper_visual_crop_data(
        crop_id: int,
        db: Session = Depends(get_db),
    ) -> PaperVisualCropResponse:
        crop = db.get(PaperVisualCrop, crop_id)
        if crop is None:
            raise HTTPException(404, "已保存裁切区域不存在。")
        paper = db.get(Paper, crop.paper_id)
        if paper is None:
            raise HTTPException(404, "裁切区域对应的论文不存在。")
        setting = _get_setting(db)
        provider = make_provider(
            setting.model_provider,
            get_model_api_key(setting.model_provider, setting.model_base_url),
            setting.model_base_url,
            setting.model_name,
            setting.timeout_seconds,
            setting.vision_model,
        )
        if not provider.supports_vision:
            raise HTTPException(409, "当前模型不支持图表数据提取，请切换到 OpenAI、Ollama 视觉模型或 Mock 模式。")
        try:
            pdf_path = _managed_paper_pdf(paper)
            page_texts = extract_page_texts(pdf_path)
            if crop.visual.page_number > len(page_texts):
                raise PdfVisualError("页码超出 PDF 范围")
            png = render_pdf_crop(
                pdf_path,
                crop.visual.page_number,
                crop.left,
                crop.top,
                crop.width,
                crop.height,
            )
            result = provider.extract_visual_data(
                paper.title,
                (crop.visual.label + " " + crop.label).strip(),
                page_texts[crop.visual.page_number - 1],
                png,
            )
        except PdfVisualError:
            raise HTTPException(404, "本地 PDF 裁切区域无法读取") from None
        except ModelProviderError as exc:
            raise HTTPException(502, str(exc)) from None
        crop.structured_data_json = json.dumps(
            {
                "chart_type": result.chart_type,
                "x_axis": result.x_axis,
                "y_axis": result.y_axis,
                "series": result.series,
                "limitations": result.limitations,
            },
            ensure_ascii=False,
        )
        crop.evidence_status = result.evidence_status
        crop.provider = provider.name
        crop.model_name = result.model_name
        db.commit()
        db.refresh(crop)
        return _paper_visual_crop_response(crop)

    @app.get("/api/v1/papers/{paper_id}", response_model=PaperDetailResponse)
    def get_paper(paper_id: int, db: Session = Depends(get_db)) -> PaperDetailResponse:
        paper = db.get(Paper, paper_id)
        if not paper:
            raise HTTPException(404, "未找到该论文")
        analysis = db.scalar(select(Analysis).where(Analysis.paper_id == paper_id))
        note = db.scalar(select(Note).where(Note.paper_id == paper_id))
        report_payload = _paper_analysis_report_payload(analysis)
        return PaperDetailResponse(
            paper=_paper_response(paper),
            analysis=(
                AnalysisReportPayload.model_validate(report_payload)
                if report_payload is not None
                else None
            ),
            note="" if not note else note.content,
        )

    @app.delete(
        "/api/v1/papers/{paper_id}",
        response_model=PaperDeleteResponse,
    )
    def delete_paper(
        paper_id: int,
        payload: PaperDeleteRequest,
        db: Session = Depends(get_db),
    ) -> PaperDeleteResponse:
        with _PAPER_FILE_LOCK:
            paper = db.get(Paper, paper_id)
            if paper is None:
                raise HTTPException(404, "未找到该论文")
            if payload.confirmation_title != paper.title:
                raise HTTPException(409, "论文标题不匹配，未执行删除")

            stored_file_path = paper.file_path
            stored_file_hash = paper.file_hash
            db.execute(delete(Analysis).where(Analysis.paper_id == paper_id))
            db.execute(delete(Note).where(Note.paper_id == paper_id))
            db.execute(
                delete(PaperSourceRecord).where(
                    PaperSourceRecord.paper_id == paper_id
                )
            )
            db.execute(
                delete(PaperVisual).where(PaperVisual.paper_id == paper_id)
            )
            db.delete(paper)
            db.commit()

            warning: str | None = None
            file_deleted = False
            if stored_file_hash:
                identity = f"v1:{paper_id}:{stored_file_hash}"
                name = hashlib.sha256(identity.encode()).hexdigest()
                cache = get_settings().paper_storage_dir / "cache" / "paper-thumbnails" / f"{name}.png"
                try:
                    cache.unlink(missing_ok=True)
                    cache.with_suffix(".empty").unlink(missing_ok=True)
                except OSError:
                    warning = "论文已删除，但插图缩略图缓存清理失败。"
            if stored_file_path:
                try:
                    storage_root = get_settings().paper_storage_dir.resolve()
                    candidate = Path(stored_file_path).resolve()
                    if not candidate.is_relative_to(storage_root):
                        warning = (
                            "数据库记录已删除，但关联文件不在受管存储目录内，"
                            "未执行文件清理。"
                        )
                    else:
                        still_referenced = _paper_file_is_still_referenced(
                            db,
                            file_path=stored_file_path,
                            file_hash=stored_file_hash,
                        )
                        if not still_referenced:
                            file_existed = candidate.exists()
                            candidate.unlink(missing_ok=True)
                            file_deleted = file_existed and not candidate.exists()
                except (OSError, RuntimeError):
                    warning = "数据库记录已删除，但本地 PDF 文件清理失败。"

            return PaperDeleteResponse(
                deleted=True,
                paper_id=paper_id,
                file_deleted=file_deleted,
                warning=warning,
            )

    @app.post("/api/v1/papers/{paper_id}/analyze")
    def analyze_paper(paper_id: int, db: Session = Depends(get_db)) -> dict[str, object]:
        raise HTTPException(410, "旧版聚合解析入口已停用；请分别生成快速理解、通俗理解或审稿人速解")

    @app.post("/api/v1/papers/{paper_id}/analysis/{report_type}")
    def analyze_paper_report(
        paper_id: int,
        report_type: AnalysisReportType,
        db: Session = Depends(get_db),
    ) -> dict[str, object]:
        paper = db.get(Paper, paper_id)
        if not paper:
            raise HTTPException(404, "未找到该论文")
        setting = _get_setting(db)
        provider = make_provider(setting.model_provider, get_model_api_key(setting.model_provider, setting.model_base_url), setting.model_base_url, setting.model_name, setting.timeout_seconds, setting.vision_model)
        try:
            page_texts = extract_page_texts(_managed_paper_pdf(paper))
        except (HTTPException, PdfVisualError, OSError, RuntimeError, ValueError):
            page_texts = None
        context = build_paper_analysis_context(
            page_texts=page_texts,
            abstract=paper.abstract or "",
            fallback_text=paper.extracted_text or "",
            article_type=paper.article_type or "",
            parse_confidence=paper.parse_confidence or 0.0,
        )
        try:
            result = provider.analyze_report(
                paper.title,
                context.text,
                report_type,
                article_type=context.article_type,
                evidence_scope=context.evidence_scope,
            )
        except ModelProviderError as exc:
            db.add(TaskRun(task_name=f"paper_analysis_{report_type.value}", status="failed",
                           detail=f"paper_id={paper_id}; provider={provider.name}",
                           resource_type="paper", resource_id=paper_id, error_code="MODEL_ANALYSIS_FAILED"))
            db.commit()
            raise HTTPException(502, str(exc)) from exc
        analysis = db.scalar(select(Analysis).where(Analysis.paper_id == paper_id))
        if analysis is None:
            analysis = Analysis(
                paper_id=paper_id,
                summary="",
                plain_explanation="",
                deep_analysis="",
                evidence_status=result.evidence_status,
                provider=provider.name,
                model_name=setting.model_name,
            )
            db.add(analysis)
        content_field, prompt_field, schema_field, evidence_field = _analysis_fields_by_type(report_type)
        setattr(analysis, content_field, result.report_markdown)
        setattr(analysis, prompt_field, REPORT_PROMPT_VERSIONS[report_type])
        setattr(analysis, schema_field, REPORT_SCHEMA_VERSIONS[report_type])
        setattr(analysis, evidence_field, result.evidence_status)
        analysis.evidence_status = result.evidence_status
        analysis.provider = provider.name
        analysis.model_name = setting.model_name
        if report_type is AnalysisReportType.reviewer_analysis:
            db.execute(delete(PaperClaim).where(PaperClaim.paper_id == paper_id))
        db.add(TaskRun(task_name=f"paper_analysis_{report_type.value}", status="completed", detail=f"paper_id={paper_id}; provider={provider.name}"))
        db.commit()
        return {
            "report_type": report_type.value,
            report_type.value: result.report_markdown,
            "prompt_version": REPORT_PROMPT_VERSIONS[report_type],
            "schema_version": REPORT_SCHEMA_VERSIONS[report_type],
            "evidence_status": result.evidence_status,
        }

    @app.get("/api/v1/papers/{paper_id}/glossary", response_model=GlossaryGenerateResponse | None)
    def paper_glossary(paper_id: int, db: Session = Depends(get_db)) -> GlossaryGenerateResponse | None:
        if not db.get(Paper, paper_id):
            raise HTTPException(404, "未找到该论文")
        saved = db.scalar(select(PaperGlossary).where(PaperGlossary.paper_id == paper_id))
        return GlossaryGenerateResponse.model_validate_json(saved.response_json) if saved else None

    @app.post("/api/v1/papers/{paper_id}/glossary", response_model=GlossaryGenerateResponse)
    def save_paper_glossary(paper_id: int, payload: GlossaryGenerateResponse, db: Session = Depends(get_db)) -> GlossaryGenerateResponse:
        if not db.get(Paper, paper_id):
            raise HTTPException(404, "未找到该论文")
        with _GLOSSARY_LOCK:
            saved = db.scalar(select(PaperGlossary).where(PaperGlossary.paper_id == paper_id))
            if saved:
                return GlossaryGenerateResponse.model_validate_json(saved.response_json)
            db.add(PaperGlossary(paper_id=paper_id, response_json=payload.model_dump_json()))
            db.commit()
            return payload

    @app.post("/api/v1/papers/{paper_id}/glossary/generate", response_model=GlossaryGenerateResponse)
    def generate_paper_glossary(paper_id: int, regenerate: bool = False, db: Session = Depends(get_db)) -> GlossaryGenerateResponse:
        paper = db.get(Paper, paper_id)
        if not paper:
            raise HTTPException(404, "未找到该论文")
        with _GLOSSARY_LOCK:
            saved = db.scalar(select(PaperGlossary).where(PaperGlossary.paper_id == paper_id))
            if saved and not regenerate:
                return GlossaryGenerateResponse.model_validate_json(saved.response_json)
            setting = _get_setting(db)
            provider = make_provider(setting.model_provider, get_model_api_key(setting.model_provider, setting.model_base_url), setting.model_base_url, setting.model_name, setting.timeout_seconds, setting.vision_model)
            context = build_paper_analysis_context(
                page_texts=None, abstract=paper.abstract or "", fallback_text=paper.extracted_text or "",
                article_type=paper.article_type or "", parse_confidence=paper.parse_confidence or 0.0,
                max_chars=9000,
            )
            if context.evidence_scope == "仅元数据":
                raise HTTPException(422, "当前论文没有可用文本，无法生成术语清单")
            analysis = db.scalar(select(Analysis).where(Analysis.paper_id == paper_id))
            reports = "\n\n".join(getattr(analysis, field) or "" for field in
                                  ("quick_understanding", "layman_understanding", "reviewer_analysis")) if analysis else ""
            required = glossary_required_terms("\n".join((paper.abstract or "", paper.extracted_text or "")), reports)
            try:
                result = provider.generate_structured_task(glossary_terms_prompt(paper.title, context.text, reports, required), "paper-glossary-generate-v1", max_tokens=3200)
                terms = parse_glossary_terms(result, required)
            except ModelProviderError as exc:
                raise HTTPException(502, str(exc)) from exc
            response = GlossaryGenerateResponse(terms=terms, evidence_status=result.evidence_status if provider.name == "mock" else GLOSSARY_STATUS,
                                            provider=provider.name, model_name=result.model_name)

            saved = db.scalar(select(PaperGlossary).where(PaperGlossary.paper_id == paper_id))
            if saved:
                saved.response_json = response.model_dump_json()
            else:
                db.add(PaperGlossary(paper_id=paper_id, response_json=response.model_dump_json()))
            db.commit()
            return response

    @app.post("/api/v1/papers/{paper_id}/glossary/ask", response_model=GlossaryAskResponse)
    def ask_paper_glossary(paper_id: int, payload: GlossaryAskRequest, db: Session = Depends(get_db)) -> GlossaryAskResponse:
        paper = db.get(Paper, paper_id)
        if not paper:
            raise HTTPException(404, "未找到该论文")
        setting = _get_setting(db)
        provider = make_provider(setting.model_provider, get_model_api_key(setting.model_provider, setting.model_base_url), setting.model_base_url, setting.model_name, setting.timeout_seconds, setting.vision_model)
        question = payload.question.strip()
        if not question:
            raise HTTPException(422, "请输入问题")
        try:
            result = provider.generate_structured_task(
                glossary_ask_prompt(paper.title, question, [(item.question, item.answer) for item in payload.history]),
                "paper-glossary-ask-v1", max_tokens=400,
            )
            answer = parse_glossary_answer(result)
        except ModelProviderError as exc:
            raise HTTPException(502, str(exc)) from exc
        return GlossaryAskResponse(question=question, answer=answer,
                                   evidence_status=result.evidence_status if provider.name == "mock" else GLOSSARY_STATUS,
                                   provider=provider.name, model_name=result.model_name)

    @app.get(
        "/api/v1/papers/{paper_id}/claims",
        response_model=PaperClaimsResponse,
    )
    def paper_claims(
        paper_id: int,
        db: Session = Depends(get_db),
    ) -> PaperClaimsResponse:
        if not db.get(Paper, paper_id):
            raise HTTPException(404, "未找到该论文")
        return PaperClaimsResponse(
            items=[
                _paper_claim_response(claim)
                for claim in list_claim_evidence(db, paper_id)
            ]
        )

    @app.post(
        "/api/v1/papers/{paper_id}/claims/rebuild",
        response_model=PaperClaimsResponse,
    )
    def rebuild_paper_claims(
        paper_id: int,
        db: Session = Depends(get_db),
    ) -> PaperClaimsResponse:
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "未找到该论文")
        analysis = db.scalar(select(Analysis).where(Analysis.paper_id == paper_id))
        if analysis is None:
            raise HTTPException(409, "请先生成论文分析，再建立结论—证据映射。")
        if not extract_claim_candidates(analysis):
            raise HTTPException(409, "当前分析报告中没有可核验的结论，请先生成包含结论的论文分析。")
        settings = get_settings()
        try:
            embedding_provider = make_embedding_provider(
                settings.embedding_provider,
                settings.embedding_base_url,
                settings.embedding_model,
                settings.embedding_timeout_seconds,
            )
            indexed = db.scalar(
                select(func.count()).select_from(PaperChunk).where(
                    PaperChunk.paper_id == paper_id,
                    PaperChunk.embedding_model == embedding_provider.model_name,
                )
            )
            if paper.knowledge_index_stale or not indexed:
                source_pages = list(db.scalars(select(PaperPageExtraction).where(
                    PaperPageExtraction.parse_run_id == paper.active_parse_run_id,
                    PaperPageExtraction.paper_id == paper_id,
                ).order_by(PaperPageExtraction.page_number))) if paper.active_parse_run_id else []
                page_texts = None
                if source_pages:
                    page_texts = [""] * max(page.page_number for page in source_pages)
                    for page in source_pages:
                        page_texts[page.page_number - 1] = page.text
                elif paper.file_path:
                    try:
                        page_texts = extract_page_texts(_managed_paper_pdf(paper))
                    except (PdfVisualError, HTTPException):
                        page_texts = None
                if not any(text.strip() for text in (page_texts or [])) and not paper.abstract.strip():
                    raise HTTPException(409, "本篇论文尚无可检索的正文或摘要，请先解析 PDF 或补充摘要。")
                note = db.scalar(select(Note).where(Note.paper_id == paper_id))
                index_paper(
                    db, paper, embedding_provider,
                    page_texts=page_texts if any(text.strip() for text in (page_texts or [])) else None,
                    note_text=note.content if note else "",
                    max_chars=settings.knowledge_chunk_size,
                    overlap=settings.knowledge_chunk_overlap,
                    parse_run_id=paper.active_parse_run_id if source_pages else None,
                    source_pages=source_pages,
                    commit=False,
                )
                paper.knowledge_index_stale = False
            claims = rebuild_claim_evidence(db, paper_id, analysis, embedding_provider)
        except EmbeddingProviderError as exc:
            db.rollback()
            raise HTTPException(503, str(exc)) from None
        return PaperClaimsResponse(
            items=[_paper_claim_response(claim) for claim in claims]
        )

    @app.put("/api/v1/papers/{paper_id}/note")
    def update_note(paper_id: int, payload: NoteUpdate, db: Session = Depends(get_db)) -> dict[str, str]:
        if not db.get(Paper, paper_id):
            raise HTTPException(404, "未找到该论文")
        note = db.scalar(select(Note).where(Note.paper_id == paper_id))
        if note is None:
            note = Note(paper_id=paper_id, content=payload.content)
            db.add(note)
        else:
            note.content = payload.content
        db.execute(delete(PaperChunk).where(
            PaperChunk.paper_id == paper_id, PaperChunk.source_scope == "note"
        ))
        db.get(Paper, paper_id).knowledge_index_stale = True
        db.commit()
        return {"message": "笔记已保存；论文索引已标记为需要更新"}

    @app.post(
        "/api/v1/papers/{paper_id}/external-compare",
        response_model=ExternalComparisonResponse,
    )
    async def compare_paper_with_external_sources(
        paper_id: int,
        payload: ExternalComparisonRequest,
        db: Session = Depends(get_db),
    ) -> ExternalComparisonResponse:
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "未找到该论文")
        settings = get_settings()
        query = " ".join((paper.title, payload.question))[:300]
        async with app.state.paper_source_client_factory() as http_client:
            available = _source_map(settings, http_client, app)
            service = PaperSearchService(
                available.values(),
                user_keywords=_read_user_keywords(app.state.session_factory),
            )
            try:
                search_result = await service.search(
                    query,
                    SearchFilters(limit=3),
                )
            except AllSourcesFailed:
                raise HTTPException(
                    503,
                    "外部论文来源暂时不可用，请稍后重试",
                ) from None
            except ValueError:
                raise HTTPException(422, "请求参数不合法：外部比较问题") from None
        external_papers = list(search_result.items)[:3]
        if not external_papers:
            raise HTTPException(
                404,
                "未检索到可用于比较的外部公开摘要，未生成比较回答",
            )
        current_excerpt = (paper.extracted_text or paper.abstract).strip()[:6000]
        if not current_excerpt:
            raise HTTPException(409, "当前论文没有可用于比较的全文或摘要")
        contexts = [
            KnowledgeContext(
                citation_id=1,
                paper_title=f"当前论文：{paper.title}",
                page_number=1 if paper.extracted_text else None,
                section="当前论文摘要或全文线索",
                source_scope="fulltext" if paper.extracted_text else "abstract",
                excerpt=current_excerpt,
            )
        ]
        contexts.extend(
            KnowledgeContext(
                citation_id=index,
                paper_title=f"外部来源（{item.source}）：{item.title}",
                page_number=None,
                section="公开摘要/元数据",
                source_scope="abstract",
                excerpt=(item.abstract or "该外部记录未提供摘要，仅有元数据。").strip()[:6000],
            )
            for index, item in enumerate(external_papers, start=2)
        )
        setting = _get_setting(db)
        provider = make_provider(
            setting.model_provider,
            get_model_api_key(setting.model_provider, setting.model_base_url),
            setting.model_base_url,
            setting.model_name,
            setting.timeout_seconds,
            setting.vision_model,
        )
        prompt = (
            f"这是当前论文与外部公开摘要的比较问答。问题：{payload.question}\n\n"
            "请分为“当前论文线索、外部来源发现、比较回答、证据限制”四节。"
            "[证据1]只代表当前论文；其余证据只代表外部公开摘要或元数据，"
            "不得把它们写成已取得全文，也不得声称外部论文已经被导入本地论文库。"
        )
        try:
            result = provider.answer_question(prompt, contexts)
        except ModelProviderError as exc:
            raise HTTPException(503, str(exc)) from None
        return ExternalComparisonResponse(
            question=payload.question,
            current_paper=ExternalComparisonCurrentPaperResponse(
                paper_id=paper.id,
                title=paper.title,
                evidence_basis=(
                    "当前论文全文线索"
                    if paper.extracted_text
                    else "当前论文摘要"
                ),
            ),
            external_papers=[
                ExternalComparisonPaperResponse(
                    source=item.source,
                    external_id=item.external_id,
                    title=item.title,
                    authors=list(item.authors),
                    abstract=item.abstract,
                    landing_url=item.landing_url,
                    evidence_basis="外部来源摘要/元数据，待原文核验",
                )
                for item in external_papers
            ],
            answer_markdown=sanitize_citation_markers(
                result.answer_markdown,
                len(contexts),
            ),
            evidence_status=(
                "AI推断（Mock 演示）"
                if provider.name == "mock"
                else "AI归纳（当前论文与外部来源摘要，待原文核验）"
            ),
            provider=provider.name,
            model_name=result.model_name,
        )
