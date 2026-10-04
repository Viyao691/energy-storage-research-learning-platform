"""Knowledge base routes: indexing, QA, comparison and saved sessions."""

from __future__ import annotations

import json
from datetime import datetime

from fastapi import Depends, HTTPException, Response
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.routers.paper_research import evidence_key
from app.knowledge import (
    EmbeddingProviderError,
    confidence_from_hits,
    index_paper,
    make_embedding_provider,
    retrieve_chunks,
    sanitize_citation_markers,
)
from app.models import (
    Analysis,
    KnowledgeConversation,
    KnowledgeConversationTurn,
    Note,
    Paper,
    PaperChunk,
    PaperPageExtraction,
    PaperClaim,
    SavedComparison,
    TaskRun,
)
from app.paper_comparison import (
    comparison_table,
    evidence_basis,
    fairness_warnings,
    focus_text,
)
from app.pdf_visuals import PdfVisualError, extract_page_texts
from app.providers import KnowledgeContext, ModelProviderError, make_provider
from app.schemas import (
    ComparisonPaperResponse,
    KnowledgeAnswerResponse,
    KnowledgeAskRequest,
    KnowledgeCitationResponse,
    KnowledgeConfidenceResponse,
    KnowledgeReindexResponse,
    KnowledgeStatusResponse,
    PaperComparisonRequest,
    PaperComparisonResponse,
    SavedComparisonCreate,
    SavedComparisonListResponse,
    SavedComparisonResponse,
    SavedComparisonSummary,
    SavedConversationCreate,
    SavedConversationListResponse,
    SavedConversationResponse,
    SavedConversationSummary,
)
from app.secrets import get_model_api_key

from ._shared import (
    _get_setting,
    _knowledge_conversation_prompt,
    _managed_paper_pdf,
    _saved_comparison_response,
    _saved_conversation_response,
)


def register_knowledge_routes(app, get_db) -> None:
    @app.get(
        "/api/v1/knowledge/status",
        response_model=KnowledgeStatusResponse,
    )
    def knowledge_status(
        db: Session = Depends(get_db),
    ) -> KnowledgeStatusResponse:
        settings = get_settings()
        total_papers = db.scalar(select(func.count()).select_from(Paper)) or 0
        try:
            embedding_provider = make_embedding_provider(
                settings.embedding_provider,
                settings.embedding_base_url,
                settings.embedding_model,
                settings.embedding_timeout_seconds,
            )
            ready, message = embedding_provider.test_connection()
            chunk_count = (
                db.scalar(
                    select(func.count())
                    .select_from(PaperChunk)
                    .where(
                        PaperChunk.embedding_model
                        == embedding_provider.model_name
                    )
                )
                or 0
            )
            indexed_papers = (
                db.scalar(
                    select(func.count(func.distinct(PaperChunk.paper_id))).where(
                        PaperChunk.embedding_model
                        == embedding_provider.model_name
                    )
                )
                or 0
            )
            return KnowledgeStatusResponse(
                total_papers=total_papers,
                indexed_papers=indexed_papers,
                stale_papers=db.scalar(select(func.count()).select_from(Paper).where(
                    (Paper.knowledge_index_stale.is_(True)) | (~Paper.id.in_(
                        select(PaperChunk.paper_id).where(PaperChunk.embedding_model == embedding_provider.model_name)
                    ))
                )) or 0,
                chunk_count=chunk_count,
                embedding_provider=embedding_provider.name,
                embedding_model=embedding_provider.model_name,
                ready=ready,
                message=message,
            )
        except EmbeddingProviderError as exc:
            return KnowledgeStatusResponse(
                total_papers=total_papers,
                indexed_papers=0,
                stale_papers=total_papers,
                chunk_count=0,
                embedding_provider=settings.embedding_provider,
                embedding_model=settings.embedding_model,
                ready=False,
                message=str(exc),
            )

    @app.post(
        "/api/v1/knowledge/reindex",
        response_model=KnowledgeReindexResponse,
    )
    def reindex_knowledge(
        db: Session = Depends(get_db),
    ) -> KnowledgeReindexResponse:
        settings = get_settings()
        try:
            embedding_provider = make_embedding_provider(
                settings.embedding_provider,
                settings.embedding_base_url,
                settings.embedding_model,
                settings.embedding_timeout_seconds,
            )
            ready, message = embedding_provider.test_connection()
            if not ready:
                raise HTTPException(503, message)

            indexed_papers = 0
            indexed_chunks = 0
            skipped_papers = 0
            papers = list(db.scalars(select(Paper).order_by(Paper.id)))
            for paper in papers:
                note = db.scalar(select(Note).where(Note.paper_id == paper.id))
                db.execute(delete(PaperClaim).where(PaperClaim.paper_id == paper.id))
                page_texts: list[str] | None = None
                source_pages = list(db.scalars(select(PaperPageExtraction).where(
                    PaperPageExtraction.parse_run_id == paper.active_parse_run_id
                ).order_by(PaperPageExtraction.page_number))) if paper.active_parse_run_id else []
                if source_pages:
                    page_texts = [""] * max(page.page_number for page in source_pages)
                    for page in source_pages:
                        page_texts[page.page_number - 1] = page.text
                elif paper.file_path:
                    try:
                        page_texts = extract_page_texts(_managed_paper_pdf(paper))
                    except (PdfVisualError, HTTPException):
                        page_texts = None
                if page_texts is None and not paper.abstract.strip():
                    db.execute(
                        delete(PaperChunk).where(PaperChunk.paper_id == paper.id)
                    )
                    db.commit()
                    skipped_papers += 1
                    continue
                chunk_count = index_paper(
                    db,
                    paper,
                    embedding_provider,
                    page_texts=page_texts,
                    note_text=note.content if note else "",
                    max_chars=settings.knowledge_chunk_size,
                    overlap=settings.knowledge_chunk_overlap,
                    parse_run_id=paper.active_parse_run_id if source_pages else None,
                    source_pages=source_pages,
                )
                paper.knowledge_index_stale = False
                if chunk_count:
                    indexed_papers += 1
                    indexed_chunks += chunk_count
                else:
                    skipped_papers += 1
            db.add(
                TaskRun(
                    task_name="knowledge_reindex",
                    status="completed",
                    detail=(
                        f"provider={embedding_provider.name}; "
                        f"model={embedding_provider.model_name}; "
                        f"papers={indexed_papers}; chunks={indexed_chunks}"
                    ),
                )
            )
            db.commit()
            return KnowledgeReindexResponse(
                indexed_papers=indexed_papers,
                indexed_chunks=indexed_chunks,
                skipped_papers=skipped_papers,
                embedding_provider=embedding_provider.name,
                embedding_model=embedding_provider.model_name,
            )
        except HTTPException:
            raise
        except EmbeddingProviderError as exc:
            db.rollback()
            raise HTTPException(503, str(exc)) from None

    @app.post(
        "/api/v1/knowledge/ask",
        response_model=KnowledgeAnswerResponse,
    )
    def ask_knowledge(
        payload: KnowledgeAskRequest,
        db: Session = Depends(get_db),
    ) -> KnowledgeAnswerResponse:
        settings = get_settings()
        try:
            embedding_provider = make_embedding_provider(
                settings.embedding_provider,
                settings.embedding_base_url,
                settings.embedding_model,
                settings.embedding_timeout_seconds,
            )
            hits = retrieve_chunks(
                db,
                payload.question,
                embedding_provider,
                limit=payload.max_citations,
            )
        except EmbeddingProviderError as exc:
            raise HTTPException(503, str(exc)) from None
        if not hits:
            raise HTTPException(
                409,
                "当前论文库尚未建立可用索引，请先点击“建立或更新索引”。",
            )

        contexts = [
            KnowledgeContext(
                citation_id=index,
                paper_title=hit.paper_title,
                page_number=hit.page_number,
                section=hit.section,
                source_scope=hit.source_scope,
                excerpt=hit.content,
            )
            for index, hit in enumerate(hits, start=1)
        ]
        setting = _get_setting(db)
        provider = make_provider(
            setting.model_provider,
            get_model_api_key(setting.model_provider, setting.model_base_url),
            setting.model_base_url,
            setting.model_name,
            setting.timeout_seconds,
            setting.vision_model,
        )
        try:
            result = provider.answer_question(
                _knowledge_conversation_prompt(
                    payload.question,
                    payload.history,
                ),
                contexts,
            )
        except ModelProviderError as exc:
            raise HTTPException(503, str(exc)) from None
        answer = sanitize_citation_markers(
            result.answer_markdown,
            len(contexts),
        )
        if not any(
            f"[证据{index}]" in answer
            for index in range(1, len(contexts) + 1)
        ):
            answer += "\n\n参考证据：" + "、".join(
                f"[证据{index}]" for index in range(1, len(contexts) + 1)
            )

        level, confidence_explanation = confidence_from_hits(hits)
        citations = [
            KnowledgeCitationResponse(
                citation_id=index,
                paper_id=hit.paper_id,
                paper_title=hit.paper_title,
                page_number=hit.page_number,
                section=hit.section,
                excerpt=hit.content,
                source_scope=hit.source_scope,
                parse_confidence=hit.parse_confidence,
                similarity=hit.similarity,
                chunk_id=hit.chunk_id,
                evidence_key=evidence_key(db.get(PaperChunk, hit.chunk_id)),
                source_locations=hit.source_locations,
            )
            for index, hit in enumerate(hits, start=1)
        ]
        db.add(
            TaskRun(
                task_name="knowledge_question",
                status="completed",
                detail=(
                    f"provider={provider.name}; citations={len(citations)}; "
                    f"embedding_model={embedding_provider.model_name}"
                ),
            )
        )
        db.commit()
        return KnowledgeAnswerResponse(
            question=payload.question,
            answer_markdown=answer,
            citations=citations,
            evidence_status=result.evidence_status,
            confidence=KnowledgeConfidenceResponse(
                level=level,
                explanation=confidence_explanation,
            ),
            provider=provider.name,
            model_name=result.model_name,
        )

    @app.post(
        "/api/v1/papers/{paper_id}/knowledge/ask",
        response_model=KnowledgeAnswerResponse,
    )
    def ask_paper_knowledge(
        paper_id: int,
        payload: KnowledgeAskRequest,
        db: Session = Depends(get_db),
    ) -> KnowledgeAnswerResponse:
        if db.get(Paper, paper_id) is None:
            raise HTTPException(404, "论文不存在。")
        settings = get_settings()
        try:
            embedding_provider = make_embedding_provider(
                settings.embedding_provider,
                settings.embedding_base_url,
                settings.embedding_model,
                settings.embedding_timeout_seconds,
            )
            hits = retrieve_chunks(
                db,
                payload.question,
                embedding_provider,
                limit=payload.max_citations,
                paper_ids=[paper_id],
            )
        except EmbeddingProviderError as exc:
            raise HTTPException(503, str(exc)) from None
        if not hits:
            raise HTTPException(409, "这篇论文尚未建立可用索引，请先更新索引。")

        contexts = [
            KnowledgeContext(
                citation_id=index,
                paper_title=hit.paper_title,
                page_number=hit.page_number,
                section=hit.section,
                source_scope=hit.source_scope,
                excerpt=hit.content,
            )
            for index, hit in enumerate(hits, start=1)
        ]
        setting = _get_setting(db)
        provider = make_provider(
            setting.model_provider,
            get_model_api_key(setting.model_provider, setting.model_base_url),
            setting.model_base_url,
            setting.model_name,
            setting.timeout_seconds,
            setting.vision_model,
        )
        try:
            result = provider.answer_question(
                _knowledge_conversation_prompt(payload.question, payload.history),
                contexts,
            )
        except ModelProviderError as exc:
            raise HTTPException(503, str(exc)) from None
        answer = sanitize_citation_markers(result.answer_markdown, len(contexts))
        if not any(f"[证据{index}]" in answer for index in range(1, len(contexts) + 1)):
            answer += "\n\n参考证据：" + "、".join(
                f"[证据{index}]" for index in range(1, len(contexts) + 1)
            )
        level, confidence_explanation = confidence_from_hits(hits)
        citations = [
            KnowledgeCitationResponse(
                citation_id=index,
                paper_id=hit.paper_id,
                paper_title=hit.paper_title,
                page_number=hit.page_number,
                section=hit.section,
                excerpt=hit.content,
                source_scope=hit.source_scope,
                parse_confidence=hit.parse_confidence,
                similarity=hit.similarity,
                chunk_id=hit.chunk_id,
                evidence_key=evidence_key(db.get(PaperChunk, hit.chunk_id)),
                source_locations=hit.source_locations,
            )
            for index, hit in enumerate(hits, start=1)
        ]
        db.add(
            TaskRun(
                task_name="paper_knowledge_question",
                status="completed",
                detail=f"paper_id={paper_id}; provider={provider.name}; citations={len(citations)}",
            )
        )
        db.commit()
        return KnowledgeAnswerResponse(
            question=payload.question,
            answer_markdown=answer,
            citations=citations,
            evidence_status=result.evidence_status,
            confidence=KnowledgeConfidenceResponse(
                level=level,
                explanation=confidence_explanation,
            ),
            provider=provider.name,
            model_name=result.model_name,
        )

    @app.get(
        "/api/v1/knowledge/conversations",
        response_model=SavedConversationListResponse,
    )
    def list_saved_conversations(
        db: Session = Depends(get_db),
    ) -> SavedConversationListResponse:
        conversations = list(
            db.scalars(
                select(KnowledgeConversation).order_by(
                    KnowledgeConversation.updated_at.desc(),
                    KnowledgeConversation.id.desc(),
                )
            )
        )
        return SavedConversationListResponse(
            items=[
                SavedConversationSummary(
                    id=item.id,
                    scope=item.scope,
                    paper_id=item.paper_id,
                    title=item.title,
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                )
                for item in conversations
            ]
        )

    @app.post(
        "/api/v1/knowledge/conversations",
        response_model=SavedConversationResponse,
        status_code=201,
    )
    def save_conversation(
        payload: SavedConversationCreate,
        db: Session = Depends(get_db),
    ) -> SavedConversationResponse:
        if payload.scope == "paper" and payload.paper_id is None:
            raise HTTPException(422, "单篇论文会话必须指定论文。")
        if payload.scope == "library" and payload.paper_id is not None:
            raise HTTPException(422, "论文库会话不能绑定单篇论文。")
        if payload.paper_id is not None and db.get(Paper, payload.paper_id) is None:
            raise HTTPException(404, "论文不存在。")
        if [turn.turn_index for turn in payload.turns] != list(
            range(1, len(payload.turns) + 1)
        ):
            raise HTTPException(422, "会话轮次必须从 1 开始连续编号。")

        conversation = KnowledgeConversation(
            scope=payload.scope,
            paper_id=payload.paper_id,
            title=payload.title,
        )
        conversation.turns = [
            KnowledgeConversationTurn(
                turn_index=turn.turn_index,
                question=turn.question,
                answer_markdown=turn.answer_markdown,
                citations_json=json.dumps(
                    [citation.model_dump() for citation in turn.citations],
                    ensure_ascii=False,
                ),
                evidence_status=turn.evidence_status,
                confidence_level=turn.confidence.level,
                confidence_explanation=turn.confidence.explanation,
                provider=turn.provider,
                model_name=turn.model_name,
            )
            for turn in payload.turns
        ]
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return _saved_conversation_response(conversation)

    @app.get(
        "/api/v1/knowledge/conversations/{conversation_id}",
        response_model=SavedConversationResponse,
    )
    def get_saved_conversation(
        conversation_id: int,
        db: Session = Depends(get_db),
    ) -> SavedConversationResponse:
        conversation = db.get(KnowledgeConversation, conversation_id)
        if conversation is None:
            raise HTTPException(404, "已保存会话不存在。")
        return _saved_conversation_response(conversation)

    @app.delete(
        "/api/v1/knowledge/conversations/{conversation_id}",
        status_code=204,
    )
    def delete_saved_conversation(
        conversation_id: int,
        db: Session = Depends(get_db),
    ) -> Response:
        conversation = db.get(KnowledgeConversation, conversation_id)
        if conversation is None:
            raise HTTPException(404, "已保存会话不存在。")
        db.delete(conversation)
        db.commit()
        return Response(status_code=204)

    @app.get(
        "/api/v1/comparisons/saved",
        response_model=SavedComparisonListResponse,
    )
    def list_saved_comparisons(
        db: Session = Depends(get_db),
    ) -> SavedComparisonListResponse:
        comparisons = list(
            db.scalars(
                select(SavedComparison).order_by(
                    SavedComparison.created_at.desc(),
                    SavedComparison.id.desc(),
                )
            )
        )
        return SavedComparisonListResponse(
            items=[
                SavedComparisonSummary(
                    id=item.id,
                    title=item.title,
                    paper_count=len(json.loads(item.paper_ids_json)),
                    created_at=item.created_at,
                )
                for item in comparisons
            ]
        )

    @app.post(
        "/api/v1/comparisons/saved",
        response_model=SavedComparisonResponse,
        status_code=201,
    )
    def save_comparison(
        payload: SavedComparisonCreate,
        db: Session = Depends(get_db),
    ) -> SavedComparisonResponse:
        paper_ids = [paper.paper_id for paper in payload.papers]
        if len(set(paper_ids)) != len(paper_ids):
            raise HTTPException(422, "比较快照中不能包含重复论文。")
        comparison = SavedComparison(
            title=payload.question,
            paper_ids_json=json.dumps(paper_ids),
            question=payload.question,
            comparison_markdown=payload.comparison_markdown,
            papers_json=json.dumps(
                [paper.model_dump() for paper in payload.papers],
                ensure_ascii=False,
            ),
            citations_json=json.dumps(
                [citation.model_dump() for citation in payload.citations],
                ensure_ascii=False,
            ),
            fairness_warnings_json=json.dumps(
                payload.fairness_warnings,
                ensure_ascii=False,
            ),
            evidence_status=payload.evidence_status,
            confidence_level=payload.confidence.level,
            confidence_explanation=payload.confidence.explanation,
            provider=payload.provider,
            model_name=payload.model_name,
        )
        db.add(comparison)
        db.commit()
        db.refresh(comparison)
        return _saved_comparison_response(comparison)

    @app.get(
        "/api/v1/comparisons/saved/{comparison_id}",
        response_model=SavedComparisonResponse,
    )
    def get_saved_comparison(
        comparison_id: int,
        db: Session = Depends(get_db),
    ) -> SavedComparisonResponse:
        comparison = db.get(SavedComparison, comparison_id)
        if comparison is None:
            raise HTTPException(404, "已保存比较不存在。")
        return _saved_comparison_response(comparison)

    @app.delete(
        "/api/v1/comparisons/saved/{comparison_id}",
        status_code=204,
    )
    def delete_saved_comparison(
        comparison_id: int,
        db: Session = Depends(get_db),
    ) -> Response:
        comparison = db.get(SavedComparison, comparison_id)
        if comparison is None:
            raise HTTPException(404, "已保存比较不存在。")
        db.delete(comparison)
        db.commit()
        return Response(status_code=204)

    @app.post(
        "/api/v1/knowledge/compare",
        response_model=PaperComparisonResponse,
    )
    def compare_papers(
        payload: PaperComparisonRequest,
        db: Session = Depends(get_db),
    ) -> PaperComparisonResponse:
        paper_ids = list(dict.fromkeys(payload.paper_ids))
        if len(paper_ids) != len(payload.paper_ids):
            raise HTTPException(422, "请选择互不重复的论文。")
        papers = list(
            db.scalars(select(Paper).where(Paper.id.in_(paper_ids))).all()
        )
        papers_by_id = {paper.id: paper for paper in papers}
        if len(papers_by_id) != len(paper_ids):
            raise HTTPException(404, "所选论文中包含不存在的记录。")
        papers = [papers_by_id[paper_id] for paper_id in paper_ids]
        settings = get_settings()
        try:
            embedding_provider = make_embedding_provider(
                settings.embedding_provider,
                settings.embedding_base_url,
                settings.embedding_model,
                settings.embedding_timeout_seconds,
            )
            hits_by_paper = {
                paper.id: retrieve_chunks(
                    db,
                    payload.question,
                    embedding_provider,
                    limit=3,
                    paper_ids=[paper.id],
                )
                for paper in papers
            }
        except EmbeddingProviderError as exc:
            raise HTTPException(503, str(exc)) from None
        missing = [paper.title for paper in papers if not hits_by_paper[paper.id]]
        if missing:
            raise HTTPException(
                409,
                "以下论文尚无可用索引，请先更新索引：" + "、".join(missing),
            )
        hits = [
            hit
            for paper in papers
            for hit in hits_by_paper[paper.id]
        ]
        contexts = [
            KnowledgeContext(
                citation_id=index,
                paper_title=hit.paper_title,
                page_number=hit.page_number,
                section=hit.section,
                source_scope=hit.source_scope,
                excerpt=hit.content,
            )
            for index, hit in enumerate(hits, start=1)
        ]
        setting = _get_setting(db)
        provider = make_provider(
            setting.model_provider,
            get_model_api_key(setting.model_provider, setting.model_base_url),
            setting.model_base_url,
            setting.model_name,
            setting.timeout_seconds,
            setting.vision_model,
        )
        comparison_prompt = (
            f"{payload.question}\n\n请分为“一致观点、冲突与可能原因、尚未定论”三节；"
            "必须用[证据N]引用，不得跨测试条件宣称性能绝对更好。"
        )
        try:
            result = provider.answer_question(comparison_prompt, contexts)
        except ModelProviderError as exc:
            raise HTTPException(503, str(exc)) from None
        answer = sanitize_citation_markers(result.answer_markdown, len(contexts))
        analyses = {
            item.paper_id: item
            for item in db.scalars(
                select(Analysis).where(Analysis.paper_id.in_(paper_ids))
            )
        }
        warnings = fairness_warnings(papers, hits_by_paper)
        markdown = (
            "## 对比矩阵\n\n"
            + comparison_table(papers, analyses, hits_by_paper)
            + "\n\n## 争议分析\n\n"
            + answer
        )
        citations = [
            KnowledgeCitationResponse(
                citation_id=index,
                paper_id=hit.paper_id,
                paper_title=hit.paper_title,
                page_number=hit.page_number,
                section=hit.section,
                excerpt=hit.content,
                source_scope=hit.source_scope,
                parse_confidence=hit.parse_confidence,
                similarity=hit.similarity,
                chunk_id=hit.chunk_id,
                evidence_key=evidence_key(db.get(PaperChunk, hit.chunk_id)),
                source_locations=hit.source_locations,
            )
            for index, hit in enumerate(hits, start=1)
        ]
        level, explanation = confidence_from_hits(hits)
        return PaperComparisonResponse(
            question=payload.question,
            comparison_markdown=markdown,
            papers=[
                ComparisonPaperResponse(
                    paper_id=paper.id,
                    title=paper.title,
                    evidence_basis=evidence_basis(paper),
                    research_focus=focus_text(paper, analyses.get(paper.id)),
                    citation_count=len(hits_by_paper[paper.id]),
                )
                for paper in papers
            ],
            citations=citations,
            fairness_warnings=warnings,
            evidence_status=result.evidence_status,
            confidence=KnowledgeConfidenceResponse(
                level=level,
                explanation=explanation,
            ),
            provider=provider.name,
            model_name=result.model_name,
        )
