"""Deterministic Claim—Evidence mapping backed by stored paper chunks."""

from __future__ import annotations

import re

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.knowledge import EmbeddingProvider, retrieve_chunks
from app.models import Analysis, ClaimEvidence, PaperClaim


_HEADING = re.compile(r"^\s{0,3}(?:#{1,6}\s+|[-*•]\s+|\d+[.)、]\s*)")
_SENTENCE = re.compile(r"(?<=[。！？!?])|(?<=\.)\s+|\n+")
_LOCATOR = re.compile(
    r"\b(?:Fig(?:ure)?|Table)\.?\s*[A-Za-z]?\d+[A-Za-z]?\b|"
    r"(?:图|表)\s*[A-Za-z]?\d+[A-Za-z]?",
    re.I,
)


def extract_claim_candidates(analysis: Analysis, *, limit: int = 8) -> list[str]:
    candidates: list[str] = []
    seen: set[str] = set()
    reports = (
        analysis.quick_understanding,
        analysis.reviewer_analysis,
        analysis.layman_understanding,
    )
    blocks = reports if any((block or "").strip() for block in reports) else (analysis.summary, analysis.deep_analysis)
    for block in blocks:
        lines: list[str] = []
        fence = ""
        for line in (block or "").splitlines():
            stripped = line.strip()
            if stripped.startswith(("```", "~~~")):
                marker = stripped[:3]
                fence = "" if fence == marker else marker if not fence else fence
                continue
            if fence or re.match(r"^#{1,6}\s|^\||^[-=*]{3,}$", stripped):
                continue
            prose = _HEADING.sub("", stripped).lstrip("> ")
            prose = re.sub(r"\*\*|__|`", "", prose)
            lines.append(prose)
        cleaned = "\n".join(lines)
        for sentence in _SENTENCE.split(cleaned):
            value = " ".join(sentence.split()).strip(" -:：;；")
            key = re.sub(r"\W+", "", value).lower()
            if 8 <= len(value) <= 320 and key and key not in seen:
                seen.add(key)
                candidates.append(value)
                if len(candidates) >= limit:
                    return candidates
    return candidates


def _status(hits) -> tuple[str, float]:
    if not hits:
        return "尚需验证（未定位到证据）", 0.0
    top = hits[0]
    confidence = round(
        min(
            1.0,
            max(0.0, top.similarity)
            * (0.9 if top.source_scope == "fulltext" else 0.55)
            * (0.5 + max(0.0, top.parse_confidence) / 2),
        ),
        3,
    )
    if top.source_scope == "fulltext" and top.page_number is not None:
        return "AI归纳（已定位全文证据，待人工核验）", confidence
    if top.source_scope == "abstract":
        return "AI归纳（仅摘要支持）", confidence
    return "尚需验证（仅用户笔记，非论文证据）", 0.0


def rebuild_claim_evidence(
    db: Session,
    paper_id: int,
    analysis: Analysis,
    embedding_provider: EmbeddingProvider,
    *,
    max_claims: int = 8,
    evidence_per_claim: int = 3,
) -> list[PaperClaim]:
    candidates = extract_claim_candidates(analysis, limit=max_claims)
    if not candidates:
        raise ValueError("当前分析报告中没有可核验的结论，请先生成包含结论的论文分析。")
    db.execute(delete(PaperClaim).where(PaperClaim.paper_id == paper_id))
    db.flush()
    for claim_text in candidates:
        hits = retrieve_chunks(
            db,
            claim_text,
            embedding_provider,
            limit=evidence_per_claim,
            paper_ids=[paper_id],
        )
        status, confidence = _status(hits)
        claim = PaperClaim(
            paper_id=paper_id,
            claim_text=claim_text,
            claim_type="AI归纳",
            evidence_status=status,
            confidence=confidence,
        )
        db.add(claim)
        db.flush()
        for rank, hit in enumerate(hits, start=1):
            locator_match = _LOCATOR.search(hit.content)
            db.add(
                ClaimEvidence(
                    claim_id=claim.id,
                    chunk_id=hit.chunk_id,
                    rank=rank,
                    similarity=hit.similarity,
                    locator=locator_match.group(0) if locator_match else "",
                )
            )
    db.commit()
    return list(
        db.scalars(
            select(PaperClaim)
            .where(PaperClaim.paper_id == paper_id)
            .options(
                selectinload(PaperClaim.evidence_links).selectinload(
                    ClaimEvidence.chunk
                )
            )
            .order_by(PaperClaim.id)
        ).unique()
    )


def list_claim_evidence(db: Session, paper_id: int) -> list[PaperClaim]:
    return list(
        db.scalars(
            select(PaperClaim)
            .where(PaperClaim.paper_id == paper_id)
            .options(
                selectinload(PaperClaim.evidence_links).selectinload(
                    ClaimEvidence.chunk
                )
            )
            .order_by(PaperClaim.id)
        ).unique()
    )
