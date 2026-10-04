"""Small, source-labelled helpers for the independent research workflow."""

from __future__ import annotations

import json
import math
import re

from sqlalchemy import select

from app.models import PaperChunk, PaperPageExtraction


RANGE = re.compile(r"\s*[+-]?\d+(?:\.\d+)?\s*[-–~～]\s*[+-]?\d+(?:\.\d+)?\s*")


def quality(data: dict, parameters: dict) -> dict:
    columns = {key: value for key, value in data.items() if isinstance(value, list)}
    row_count = max((len(value) for value in columns.values()), default=0)
    types, missing, ranges, invalid = {}, {}, {}, {}
    for key, values in columns.items():
        present = [value for value in values if value is not None and value != ""]
        numeric = []
        for value in present:
            try:
                if isinstance(value, bool):
                    raise ValueError
                numeric.append(math.isfinite(float(value)))
            except (TypeError, ValueError):
                numeric.append(False)
        types[key] = "number" if present and all(numeric) else "mixed" if any(numeric) else "text"
        missing[key] = row_count - len(present)
        ranges[key] = sum(isinstance(value, str) and bool(RANGE.fullmatch(value)) for value in present)
        numeric_like = any(numeric) or any(isinstance(value, (bool, int, float)) or str(value).lower() in {"nan", "inf", "-inf", "infinity", "-infinity"} for value in present)
        invalid[key] = sum(not is_number and not (isinstance(value, str) and RANGE.fullmatch(value)) for value, is_number in zip(present, numeric)) if numeric_like else 0
    review = parameters.get("quality_review")
    if not isinstance(review, dict):
        review = {}
    return {"row_count": row_count, "column_count": len(columns), "column_types": types,
            "missing_values": missing, "range_values": ranges, "invalid_values": invalid,
            "reviewed": review.get("reviewed") is True,
            "handling_policy": review.get("handling_policy") if isinstance(review.get("handling_policy"), str) else ""}


def paper_evidence(db, paper, limit: int = 6000) -> str:
    heading = f"[P{paper.id}] {paper.title}; DOI={paper.doi or '未记录'}; URL={paper.landing_url or '未记录'}"
    chunks = list(db.scalars(select(PaperPageExtraction).where(PaperPageExtraction.paper_id == paper.id,
        PaperPageExtraction.parse_run_id == paper.active_parse_run_id).order_by(PaperPageExtraction.page_number))) if paper.active_parse_run_id else []
    chunks = [chunk for chunk in chunks if chunk.text.strip()]
    if not chunks and paper.active_parse_run_id:
        chunks = list(db.scalars(select(PaperChunk).where(PaperChunk.paper_id == paper.id,
            PaperChunk.parse_run_id == paper.active_parse_run_id, PaperChunk.source_scope == "fulltext").order_by(PaperChunk.page_number, PaperChunk.chunk_index)))
    excerpt = "\n".join(f"[P{paper.id}:{'p' + str(chunk.page_number) if chunk.page_number is not None else 'unlocated'}] {content.strip()}" for chunk in chunks if (content := (getattr(chunk, 'text', None) or getattr(chunk, 'content', ''))))
    if excerpt:
        result = heading + "; 证据范围=全文提取片段\n" + excerpt
        return _bounded_paper(result, limit)
    if not paper.active_parse_run_id and paper.extracted_text:
        result = heading + "; 证据范围=本地提取文本，页码不可定位\n" + f"[P{paper.id}:unlocated] {paper.extracted_text}"
        return _bounded_paper(result, limit)
    if paper.abstract:
        result = heading + "; 证据范围=摘要，未提供可引用全文\n" + f"[P{paper.id}:abstract] {paper.abstract}"
        return _bounded_paper(result, limit)
    return heading + "; 证据范围=仅元数据，无摘要或可引用全文"


def _bounded_paper(result: str, limit: int) -> str:
    if len(result) <= limit:
        return result
    cut = max(result.rfind(separator, 0, limit) for separator in ("\n", "。", "；", "; ", ". ", " "))
    if cut < 0:
        return result.split("\n", 1)[0][:limit] + "\n[摘录省略：无安全的文本断点]"
    return result[:cut].rstrip() + f"\n[摘录截断：省略约{len(result) - cut}字符；未展示文本不可作为证据]"


def dataset_evidence(dataset, limit: int = 8000, max_rows: int = 40, max_columns: int = 20) -> str:
    data = json.loads(dataset.data_json or "{}")
    units = json.loads(dataset.units_json or "{}")
    parameters = json.loads(dataset.parameters_json or "{}")
    profile = quality(data, parameters)
    columns = [(name, values) for name, values in data.items() if isinstance(values, list)]
    provenance = {key: parameters.get(key) for key in ("source_reference", "source_url", "data_origin") if parameters.get(key)}
    lines = [f"[D{dataset.id}] {dataset.name}; 类型={dataset.dataset_type}; 用户核对状态={dataset.confirmation_status}; 出处={json.dumps(provenance, ensure_ascii=False) if provenance else '仅本地导入，未记录外部来源'}; 单位={json.dumps(units, ensure_ascii=False)}; 质量={json.dumps(profile, ensure_ascii=False)}"]
    included_rows = 0
    for row in range(min(profile["row_count"], max_rows)):
        entry = "; ".join(f"[D{dataset.id}:r{row + 1},c{name}]={json.dumps(values[row] if row < len(values) else None, ensure_ascii=False)}" for name, values in columns[:max_columns])
        if len("\n".join([*lines, entry])) > limit:
            break
        lines.append(entry)
        included_rows += 1
    lines.append(f"数据纳入{included_rows}/{profile['row_count']}行、{min(len(columns), max_columns)}/{len(columns)}列；省略{profile['row_count'] - included_rows}行、{max(0, len(columns) - max_columns)}列，未展示值不可作证据。")
    return "\n".join(lines)


def bounded_evidence(papers: list, datasets: list, db) -> str:
    pieces = [paper_evidence(db, item) for item in papers] + [dataset_evidence(item) for item in datasets]
    output = "\n\n".join(pieces)
    if len(output) > 24000:
        raise ValueError("所选证据超过24000字符预算；请减少所选论文或数据集")
    return f"证据预算：总上限24000字符；实际{len(output)}字符；纳入论文{len(papers)}/{len(papers)}篇、数据集{len(datasets)}/{len(datasets)}个；每篇最多6000字符、每集最多40行/20列/8000字符，具体遗漏和截断见条目。\n" + output
