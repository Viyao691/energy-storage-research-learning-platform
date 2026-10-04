"""Small evidence-backed drafts; persistence remains the existing notes workflow."""

import hashlib
import json
import re

from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.knowledge import parse_source_locations
from app.models import Paper, PaperChunk
from app.schemas import (
    KnowledgeCitationResponse, PaperNoteDraftRequest, PaperNoteDraftResponse,
    ResearchChallengeResponse,
)


def evidence_key(chunk: PaperChunk) -> str:
    value = [chunk.paper_id, chunk.parse_run_id, chunk.source_scope, chunk.page_number,
             chunk.section, chunk.content, chunk.source_locations_json]
    return hashlib.sha256(json.dumps(value, ensure_ascii=False).encode()).hexdigest()


def chunk_citation(paper: Paper, chunk: PaperChunk, number: int) -> KnowledgeCitationResponse:
    return KnowledgeCitationResponse(
        citation_id=number, chunk_id=chunk.id, evidence_key=evidence_key(chunk),
        paper_id=paper.id, paper_title=paper.title, page_number=chunk.page_number,
        section=chunk.section, excerpt=chunk.content, source_scope=chunk.source_scope,
        parse_confidence=chunk.parse_confidence, similarity=0,
        source_locations=parse_source_locations(chunk.source_locations_json),
    )


def register_paper_research_routes(app, get_db) -> None:
    @app.post("/api/v1/papers/{paper_id}/note-draft", response_model=PaperNoteDraftResponse)
    def note_draft(paper_id: int, payload: PaperNoteDraftRequest,
                   db: Session = Depends(get_db)):
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "论文不存在。")
        references = []
        seen = set()
        for reference in payload.citations:
            chunk = db.get(PaperChunk, reference.chunk_id) if reference.chunk_id else None
            if (chunk is None or chunk.paper_id != paper_id or reference.paper_id != paper_id
                    or reference.evidence_key != evidence_key(chunk)):
                raise HTTPException(409, "引用已失效或不属于本篇论文，请重新追问或打开挑战。")
            if reference.citation_id in seen or not 1 <= reference.citation_id <= 8:
                raise HTTPException(422, "引用编号无效。")
            seen.add(reference.citation_id)
            scope = {"fulltext": "全文", "abstract": "仅摘要", "note": "用户笔记"}[chunk.source_scope]
            page = f"第 {chunk.page_number} 页" if chunk.page_number and chunk.source_scope == "fulltext" else "无原文页码"
            quote = "\n".join("> " + line for line in chunk.content.splitlines())
            source_link = (
                f"[查看原文](/papers/{paper_id}?page={chunk.page_number})"
                if chunk.source_scope == "fulltext" and chunk.page_number
                else f"[查看论文](/papers/{paper_id})"
            )
            references.append(
                f"[证据{reference.citation_id}] {paper.title} · {scope} · {page}"
                f" · 解析版本 {chunk.parse_run_id or '默认'} · {source_link}\n\n{quote}"
            )
        # Answer prose is editable and never represented as an authoritative quotation.
        label = "用户研究挑战草稿（未评审）" if payload.kind == "challenge" else f"用户选定的回答 · {payload.evidence_status} · 待核验"
        answer = payload.answer_markdown
        answer = re.sub(r"\[证据(\d+)\]", lambda m: m.group(0) if int(m[1]) in seen else "[引用缺失]", answer)
        return PaperNoteDraftResponse(markdown=(
            f"## {payload.question}\n\n{label}\n\n{answer}\n\n"
            "### 数据库核验引用快照\n\n" + "\n\n".join(references)
            + "\n\n引用为追加时快照；后续重新解析后需复核。"
        ))

    @app.get("/api/v1/papers/{paper_id}/research-challenge", response_model=ResearchChallengeResponse)
    def research_challenge(paper_id: int, db: Session = Depends(get_db)):
        paper = db.get(Paper, paper_id)
        if paper is None:
            raise HTTPException(404, "论文不存在。")
        chunks = list(db.scalars(select(PaperChunk).where(
            PaperChunk.paper_id == paper_id, PaperChunk.source_scope.in_(["fulltext", "abstract"])
        ).order_by(PaperChunk.chunk_index, PaperChunk.id).limit(3)))
        if not chunks:
            raise HTTPException(409, "本篇尚无可用全文或摘要证据，请先更新索引。")
        return ResearchChallengeResponse(
            questions=[
                "证据复核：选择一个核心结论，引用下方证据，区分直接观察与作者或自己的推断。",
                "边界挑战：指出证据缺少的测试条件、对照或适用边界；哪些结果不能据此推广？",
                "最小验证：提出一个可执行的验证实验，写清假设、变量、对照、评价指标和失败判据。",
            ],
            criteria=["引用能回到原文，未把摘要当全文。", "明确已知、未知与替代解释。", "方案可证伪且工作量可控；不是竞赛成绩或自动科学结论。"],
            citations=[chunk_citation(paper, chunk, i) for i, chunk in enumerate(chunks, 1)],
            evidence_status="固定三问 · 本地证据摘录（非全文综述） · 自评，不调用模型",
        )
