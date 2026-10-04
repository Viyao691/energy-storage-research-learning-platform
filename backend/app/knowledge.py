"""Local-first text chunking and replaceable embedding helpers.

The module keeps page provenance separate from model-generated answers.  It
does not accept client-provided file paths and never invents citation fields.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
from dataclasses import dataclass
from typing import Protocol

import httpx
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import Paper, PaperChunk, PaperPageExtraction


DEFAULT_CHUNK_SIZE = 1600
DEFAULT_CHUNK_OVERLAP = 180
MOCK_EMBEDDING_DIMENSIONS = 384

_TOKEN_PATTERN = re.compile(r"[a-z0-9][a-z0-9.+-]*|[\u4e00-\u9fff]+", re.I)
_SECTION_PATTERN = re.compile(
    r"^(abstract|introduction|background|experimental|materials(?: and methods)?|"
    r"methods?|results(?: and discussion)?|discussion|conclusions?|references|"
    r"摘要|引言|研究背景|实验|材料与方法|结果与讨论|结论|参考文献)\b",
    re.I,
)


class EmbeddingProviderError(RuntimeError):
    """A safe embedding failure message suitable for the API boundary."""


class EmbeddingProvider(Protocol):
    name: str
    model_name: str

    def embed(self, texts: list[str]) -> list[list[float]]: ...
    def test_connection(self) -> tuple[bool, str]: ...


@dataclass(frozen=True, slots=True)
class ChunkDraft:
    page_number: int | None
    chunk_index: int
    section: str
    content: str
    source_scope: str


@dataclass(frozen=True, slots=True)
class RetrievedChunk:
    chunk_id: int
    paper_id: int
    paper_title: str
    page_number: int | None
    section: str
    content: str
    source_scope: str
    parse_confidence: float
    similarity: float
    source_locations: list[dict[str, object]]


def parse_source_locations(value: str) -> list[dict[str, object]]:
    try:
        raw = json.loads(value or "[]")
    except (json.JSONDecodeError, TypeError):
        return []
    if not isinstance(raw, list):
        return []
    valid: list[dict[str, object]] = []
    for item in raw:
        if not isinstance(item, dict) or not isinstance(item.get("bbox"), dict):
            continue
        try:
            page_number = int(item["page_number"])
            page_width = float(item["page_width"])
            page_height = float(item["page_height"])
            bbox = {
                key: float(item["bbox"][key])
                for key in ("left", "top", "right", "bottom")
            }
        except (KeyError, TypeError, ValueError):
            continue
        if (
            page_number < 1
            or page_width <= 0
            or page_height <= 0
            or bbox["left"] < 0
            or bbox["top"] < 0
            or bbox["right"] <= bbox["left"]
            or bbox["bottom"] <= bbox["top"]
            or bbox["right"] > page_width
            or bbox["bottom"] > page_height
        ):
            continue
        valid.append(
            {
                "page_number": page_number,
                "element_id": str(item.get("element_id", "")),
                "bbox": bbox,
                "coord_origin": "TOPLEFT",
                "page_width": page_width,
                "page_height": page_height,
            }
        )
    return valid


def match_source_locations(
    content: str,
    *,
    page_number: int,
    layout_json: str,
    page_width: float | None,
    page_height: float | None,
) -> list[dict[str, object]]:
    if not content.strip() or not page_width or not page_height:
        return []
    try:
        layout = json.loads(layout_json or "[]")
    except json.JSONDecodeError:
        return []
    if not isinstance(layout, list):
        return []
    normalized_content = " ".join(content.split()).casefold()
    candidates: list[dict[str, object]] = []
    for element in layout:
        if not isinstance(element, dict):
            continue
        element_text = " ".join(str(element.get("text", "")).split()).casefold()
        if not element_text or (
            element_text not in normalized_content
            and normalized_content not in element_text
        ):
            continue
        candidates.append(
            {
                "page_number": page_number,
                "element_id": str(element.get("element_id", "")),
                "bbox": element.get("bbox"),
                "coord_origin": "TOPLEFT",
                "page_width": page_width,
                "page_height": page_height,
            }
        )
    return parse_source_locations(json.dumps(candidates))


def _section_name(page_text: str, page_number: int) -> str:
    for raw_line in page_text.splitlines():
        line = " ".join(raw_line.split()).strip(" :：")
        if not line:
            continue
        if len(line) <= 100 and _SECTION_PATTERN.match(line):
            return line
        break
    return f"第 {page_number} 页"


def _bounded_parts(text: str, max_chars: int, overlap: int) -> list[str]:
    if not text:
        return []
    parts: list[str] = []
    start = 0
    length = len(text)
    while start < length:
        hard_end = min(start + max_chars, length)
        end = hard_end
        if hard_end < length:
            minimum_break = start + max(max_chars // 2, 1)
            candidates = [
                text.rfind(marker, minimum_break, hard_end)
                for marker in ("\n\n", "。", ". ", "\n", "；", "; ")
            ]
            best_break = max(candidates)
            if best_break >= minimum_break:
                end = best_break + 1
        content = text[start:end].strip()
        if content:
            parts.append(content[:max_chars])
        if end >= length:
            break
        next_start = max(0, end - overlap)
        start = next_start if next_start > start else end
    return parts


def chunk_pages(
    page_texts: list[str],
    *,
    max_chars: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[ChunkDraft]:
    if max_chars < 50:
        raise ValueError("max_chars must be at least 50")
    if overlap < 0 or overlap >= max_chars:
        raise ValueError("overlap must be nonnegative and smaller than max_chars")

    drafts: list[ChunkDraft] = []
    for page_number, raw_text in enumerate(page_texts, start=1):
        page_text = "\n".join(
            line.rstrip() for line in raw_text.replace("\r\n", "\n").split("\n")
        ).strip()
        section = _section_name(page_text, page_number)
        for chunk_index, content in enumerate(
            _bounded_parts(page_text, max_chars, overlap)
        ):
            drafts.append(
                ChunkDraft(
                    page_number=page_number,
                    chunk_index=chunk_index,
                    section=section,
                    content=content,
                    source_scope="fulltext",
                )
            )
    return drafts


def chunk_abstract(
    abstract: str,
    *,
    max_chars: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[ChunkDraft]:
    return [
        ChunkDraft(None, index, "摘要", content, "abstract")
        for index, content in enumerate(
            _bounded_parts(" ".join(abstract.split()), max_chars, overlap)
        )
    ]


def chunk_note(
    content: str,
    *,
    max_chars: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[ChunkDraft]:
    return [
        ChunkDraft(None, index, "我的笔记", part, "note")
        for index, part in enumerate(
            _bounded_parts(" ".join(content.split()), max_chars, overlap)
        )
    ]


def _embedding_tokens(text: str) -> list[str]:
    tokens: list[str] = []
    for match in _TOKEN_PATTERN.finditer(text.lower()):
        token = match.group(0)
        if "\u4e00" <= token[0] <= "\u9fff":
            tokens.extend(token)
            tokens.extend(token[index : index + 2] for index in range(len(token) - 1))
        else:
            tokens.append(token)
    return tokens


def _normalize_vector(vector: list[float]) -> list[float]:
    magnitude = math.sqrt(sum(value * value for value in vector))
    if not math.isfinite(magnitude) or magnitude <= 0:
        raise EmbeddingProviderError("嵌入模型返回了无效向量")
    return [value / magnitude for value in vector]


def _canonical_ollama_model_name(model_name: str) -> str:
    normalized = model_name.strip()
    final_segment = normalized.rsplit("/", 1)[-1]
    return normalized if ":" in final_segment else f"{normalized}:latest"


class MockEmbeddingProvider:
    """Deterministic local vectors for tests and no-key demonstrations."""

    name = "mock"
    model_name = "mock-multilingual-embedding"

    def embed(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            vector = [0.0] * MOCK_EMBEDDING_DIMENSIONS
            for token in _embedding_tokens(text):
                digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
                bucket = int.from_bytes(digest, "big") % MOCK_EMBEDDING_DIMENSIONS
                vector[bucket] += 1.0
            if not any(vector):
                vector[0] = 1.0
            vectors.append(_normalize_vector(vector))
        return vectors

    def test_connection(self) -> tuple[bool, str]:
        return True, "Mock 向量索引已就绪（仅用于演示）"


class OllamaEmbeddingProvider:
    name = "ollama"

    def __init__(
        self,
        base_url: str,
        model_name: str,
        timeout_seconds: int,
    ) -> None:
        self.base_url = base_url.strip().rstrip("/")
        self.model_name = model_name.strip()
        self.timeout_seconds = timeout_seconds

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        try:
            response = httpx.post(
                f"{self.base_url}/api/embed",
                json={
                    "model": self.model_name,
                    "input": texts,
                    "truncate": True,
                },
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            embeddings = response.json()["embeddings"]
            if (
                not isinstance(embeddings, list)
                or len(embeddings) != len(texts)
                or not embeddings
            ):
                raise ValueError("embedding count mismatch")
            result: list[list[float]] = []
            dimensions: int | None = None
            for vector in embeddings:
                if not isinstance(vector, list) or not vector:
                    raise ValueError("empty embedding")
                numeric = [float(value) for value in vector]
                if not all(math.isfinite(value) for value in numeric):
                    raise ValueError("non-finite embedding")
                dimensions = dimensions or len(numeric)
                if len(numeric) != dimensions:
                    raise ValueError("embedding dimension mismatch")
                result.append(_normalize_vector(numeric))
            return result
        except httpx.TimeoutException as exc:
            raise EmbeddingProviderError(
                "Ollama 嵌入模型响应超时，请稍后重试"
            ) from exc
        except httpx.HTTPError as exc:
            raise EmbeddingProviderError(
                "无法连接 Ollama 嵌入服务，请确认 Ollama 已启动且已安装嵌入模型"
            ) from exc
        except (ValueError, TypeError, KeyError) as exc:
            raise EmbeddingProviderError("Ollama 嵌入模型返回格式无效") from exc

    def test_connection(self) -> tuple[bool, str]:
        try:
            response = httpx.get(
                f"{self.base_url}/api/tags",
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            models = {
                item.get("name") or item.get("model")
                for item in response.json().get("models", [])
                if isinstance(item, dict)
            }
            requested_model = _canonical_ollama_model_name(self.model_name)
            installed_models = {
                _canonical_ollama_model_name(str(model))
                for model in models
                if model
            }
            if requested_model not in installed_models:
                return (
                    False,
                    f"尚未安装嵌入模型 {self.model_name}；请运行 ollama pull {self.model_name}",
                )
            return True, f"Ollama 嵌入模型 {self.model_name} 已就绪"
        except (httpx.HTTPError, ValueError, TypeError, KeyError):
            return False, "无法连接 Ollama 嵌入服务，请确认 Ollama 已启动"


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return -1.0
    return sum(first * second for first, second in zip(left, right, strict=True))


def make_embedding_provider(
    provider: str,
    base_url: str,
    model_name: str,
    timeout_seconds: int,
) -> EmbeddingProvider:
    if provider == "mock":
        return MockEmbeddingProvider()
    if provider == "ollama":
        return OllamaEmbeddingProvider(base_url, model_name, timeout_seconds)
    raise EmbeddingProviderError(f"不支持的嵌入供应商：{provider}")


def index_paper(
    db: Session,
    paper: Paper,
    embedding_provider: EmbeddingProvider,
    *,
    page_texts: list[str] | None,
    note_text: str = "",
    max_chars: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
    parse_run_id: int | None = None,
    source_pages: list[PaperPageExtraction] | None = None,
    commit: bool = True,
) -> int:
    drafts = (
        chunk_pages(page_texts, max_chars=max_chars, overlap=overlap)
        if page_texts is not None
        else chunk_abstract(paper.abstract, max_chars=max_chars, overlap=overlap)
    )
    drafts.extend(chunk_note(note_text, max_chars=max_chars, overlap=overlap))
    if not drafts:
        db.execute(delete(PaperChunk).where(PaperChunk.paper_id == paper.id))
        if commit:
            db.commit()
        return 0

    vectors: list[list[float]] = []
    for start in range(0, len(drafts), 16):
        vectors.extend(
            embedding_provider.embed(
                [draft.content for draft in drafts[start : start + 16]]
            )
        )
    if len(vectors) != len(drafts):
        raise EmbeddingProviderError("嵌入向量数量与论文文本块不一致")

    pages_by_number = {
        page.page_number: page for page in (source_pages or [])
    }
    rows: list[PaperChunk] = []
    for draft, vector in zip(drafts, vectors, strict=True):
        identity = (
            f"{draft.page_number or 0}:{draft.chunk_index}:{draft.source_scope}:"
            f"{draft.content}"
        )
        source_page = pages_by_number.get(draft.page_number or 0)
        locations = (
            match_source_locations(
                draft.content,
                page_number=draft.page_number or 0,
                layout_json=source_page.layout_json,
                page_width=source_page.page_width,
                page_height=source_page.page_height,
            )
            if draft.source_scope == "fulltext" and source_page is not None
            else []
        )
        rows.append(
            PaperChunk(
                paper_id=paper.id,
                page_number=draft.page_number,
                chunk_index=draft.chunk_index,
                section=draft.section,
                content=draft.content,
                content_hash=hashlib.sha256(identity.encode("utf-8")).hexdigest(),
                source_scope=draft.source_scope,
                parse_confidence=(
                    paper.parse_confidence
                    if draft.source_scope == "fulltext"
                    else 0.0
                ),
                parse_run_id=(
                    parse_run_id if draft.source_scope == "fulltext" else None
                ),
                source_locations_json=json.dumps(
                    locations, ensure_ascii=False, separators=(",", ":")
                ),
                embedding_json=json.dumps(vector, separators=(",", ":")),
                embedding_model=embedding_provider.model_name,
            )
        )

    db.execute(delete(PaperChunk).where(PaperChunk.paper_id == paper.id))
    db.add_all(rows)
    if commit:
        db.commit()
    else:
        db.flush()
    return len(rows)


def retrieve_chunks(
    db: Session,
    question: str,
    embedding_provider: EmbeddingProvider,
    *,
    limit: int,
    paper_ids: list[int] | None = None,
) -> list[RetrievedChunk]:
    query_vector = embedding_provider.embed([question])[0]
    statement = (
        select(PaperChunk, Paper)
        .join(Paper, Paper.id == PaperChunk.paper_id)
        .where(PaperChunk.embedding_model == embedding_provider.model_name)
    )
    if paper_ids is not None:
        statement = statement.where(PaperChunk.paper_id.in_(paper_ids))
    records = db.execute(statement).all()
    ranked: list[RetrievedChunk] = []
    for chunk, paper in records:
        try:
            stored = json.loads(chunk.embedding_json)
            if not isinstance(stored, list):
                continue
            vector = [float(value) for value in stored]
        except (ValueError, TypeError, json.JSONDecodeError):
            continue
        similarity = cosine_similarity(query_vector, vector)
        if similarity < -0.5:
            continue
        ranked.append(
            RetrievedChunk(
                chunk_id=chunk.id,
                paper_id=paper.id,
                paper_title=paper.title,
                page_number=chunk.page_number,
                section=chunk.section,
                content=chunk.content,
                source_scope=chunk.source_scope,
                parse_confidence=chunk.parse_confidence,
                similarity=round(max(similarity, 0.0), 4),
                source_locations=parse_source_locations(
                    chunk.source_locations_json
                ),
            )
        )
    ranked.sort(key=lambda item: (-item.similarity, item.chunk_id))
    return ranked[:limit]


_CITATION_MARKER = re.compile(r"\[证据(\d+)\]")


def sanitize_citation_markers(answer: str, citation_count: int) -> str:
    def replace(match: re.Match[str]) -> str:
        number = int(match.group(1))
        return match.group(0) if 1 <= number <= citation_count else "[无法核验的引用]"

    return _CITATION_MARKER.sub(replace, answer)


def confidence_from_hits(hits: list[RetrievedChunk]) -> tuple[str, str]:
    if not hits:
        return "低", "没有检索到可引用证据。"
    fulltext = sum(hit.source_scope == "fulltext" for hit in hits)
    located = sum(hit.page_number is not None for hit in hits)
    paper_count = len(
        {hit.paper_id for hit in hits if hit.source_scope != "note"}
    )
    note_count = sum(hit.source_scope == "note" for hit in hits)
    top_score = hits[0].similarity
    if fulltext >= 2 and located >= 2 and paper_count >= 2 and top_score >= 0.35:
        level = "高"
    elif fulltext >= 1 and located >= 1 and top_score >= 0.15:
        level = "中"
    else:
        level = "低"
    explanation = (
        f"检索到 {len(hits)} 条证据，来自 {paper_count} 篇论文；"
        f"其中 {fulltext} 条为全文证据、{located} 条可定位页码。"
        f"{note_count} 条为用户笔记，不计入论文证据置信度。"
        "置信度还受文本解析质量和证据一致性影响。"
    )
    return level, explanation
