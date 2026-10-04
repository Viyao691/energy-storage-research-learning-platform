"""Database-backed comparison summaries and fairness checks."""

from __future__ import annotations

import re

from app.knowledge import RetrievedChunk
from app.models import Analysis, Paper


def evidence_basis(paper: Paper) -> str:
    if paper.acquisition_status == "fulltext" and paper.page_count:
        return "已读取全文"
    if paper.abstract.strip():
        return "仅摘要"
    return "仅元数据"


def focus_text(paper: Paper, analysis: Analysis | None) -> str:
    value = analysis.summary if analysis and analysis.summary.strip() else paper.abstract
    normalized = " ".join(value.split())
    return normalized[:180] or "尚无可用研究摘要"


def fairness_warnings(
    papers: list[Paper],
    hits_by_paper: dict[int, list[RetrievedChunk]],
) -> list[str]:
    warnings: list[str] = []
    bases = {evidence_basis(paper) for paper in papers}
    if len(bases) > 1:
        warnings.append("所选论文的证据范围不同（全文/摘要/元数据），不能按同一证据强度比较。")

    combined = {
        paper.id: " ".join(hit.content for hit in hits_by_paper.get(paper.id, []))
        for paper in papers
    }
    cell_types: set[str] = set()
    for text in combined.values():
        lowered = text.lower()
        if re.search(r"\bhalf[- ]?cell\b|半电池", lowered):
            cell_types.add("半电池")
        if re.search(r"\bfull[- ]?cell\b|全电池", lowered):
            cell_types.add("全电池")
    if len(cell_types) > 1:
        warnings.append("检索证据同时涉及半电池和全电池，容量、循环和能量密度不能直接横比。")

    condition_patterns = {
        "质量负载": r"(?:mass loading|质量负载).{0,30}?\d+(?:\.\d+)?\s*(?:mg|g)\s*cm",
        "电压窗口": r"\d(?:\.\d+)?\s*[-–~至]\s*\d(?:\.\d+)?\s*V",
        "测试温度": r"(?:at|在)?\s*-?\d+(?:\.\d+)?\s*°?\s*C",
    }
    for label, pattern in condition_patterns.items():
        found = [
            bool(re.search(pattern, text, re.I))
            for text in combined.values()
        ]
        if any(found) and not all(found):
            warnings.append(f"只有部分论文的检索证据包含{label}，相关性能结论应标为无法直接比较。")
    if not warnings:
        warnings.append("未发现明显条件冲突，但仍需人工核对质量负载、电压窗口、温度和循环制度。")
    return warnings


def comparison_table(
    papers: list[Paper],
    analyses: dict[int, Analysis],
    hits_by_paper: dict[int, list[RetrievedChunk]],
) -> str:
    rows = [
        "| 论文 | 证据范围 | 研究重点 | 检索证据数 |",
        "|---|---|---|---:|",
    ]
    for paper in papers:
        focus = focus_text(paper, analyses.get(paper.id)).replace("|", "｜")
        title = paper.title.replace("|", "｜")
        rows.append(
            f"| {title} | {evidence_basis(paper)} | {focus} | "
            f"{len(hits_by_paper.get(paper.id, []))} |"
        )
    return "\n".join(rows)
