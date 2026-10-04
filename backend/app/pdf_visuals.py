"""Local PDF figure/table discovery and bounded page rendering.

The helpers in this module never accept a client-provided filesystem path at
the API boundary.  Callers must first resolve a paper record to a managed PDF.
"""

from __future__ import annotations

import math
import os
import re
import tempfile
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

import fitz


MAX_CAPTION_CHARACTERS = 500
MAX_PNG_BYTES = 8 * 1024 * 1024
MAX_VISUAL_CONTEXT_CHARACTERS = 6000
MAX_VISUAL_REFERENCE_PASSAGES = 4


def paper_figure_thumbnail(path: Path, cache_path: Path) -> bytes | None:
    """Cache one bounded crop of a substantial embedded PDF figure, if present."""

    if cache_path.is_file():
        return cache_path.read_bytes()
    empty_path = cache_path.with_suffix(".empty")
    if empty_path.is_file():
        return None

    document: fitz.Document | None = None
    best: tuple[float, int, fitz.Rect] | None = None
    try:
        document = fitz.open(path)
        inspected = 0
        for page_index in range(min(len(document), 8)):
            page = document.load_page(page_index)
            page_area = page.rect.width * page.rect.height
            if page_area <= 0:
                continue
            for image in page.get_images(full=True):
                if inspected >= 40:
                    break
                inspected += 1
                xref, width, height = image[0], image[2], image[3]
                if width < 240 or height < 180 or width * height > 8_000_000:
                    continue
                ratio = width / height
                if not 0.5 <= ratio <= 2.8:
                    continue
                for placed in page.get_image_rects(xref):
                    rect = placed & page.rect
                    area = rect.width * rect.height / page_area
                    if not 0.025 <= area <= 0.8:
                        continue
                    score = min(width * height, 2_000_000) * math.sqrt(area) / (1 + page_index * 0.12)
                    if best is None or score > best[0]:
                        best = (score, page_index + 1, fitz.Rect(
                            (rect.x0 - page.rect.x0) / page.rect.width,
                            (rect.y0 - page.rect.y0) / page.rect.height,
                            (rect.x1 - page.rect.x0) / page.rect.width,
                            (rect.y1 - page.rect.y0) / page.rect.height,
                        ))
            if inspected >= 40:
                break
    except (fitz.FileDataError, RuntimeError, OSError, ValueError) as exc:
        raise PdfVisualError("PDF 插图无法读取") from exc
    finally:
        if document is not None:
            document.close()

    if best is None:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        empty_path.touch()
        return None

    _, page_number, rect = best
    png = render_pdf_crop(
        path, page_number, rect.x0, rect.y0, rect.width, rect.height,
        max_pixels=600_000, max_output_bytes=2_000_000,
    )
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=cache_path.parent, suffix=".tmp", delete=False) as temp:
        temp.write(png)
        temporary = Path(temp.name)
    os.replace(temporary, cache_path)
    return png

_CAPTION_PATTERN = re.compile(
    r"""
    ^\s*
    (?:
        (?P<english>
            (?P<english_kind>figure|fig|table)
            \.?\s*
            (?P<english_number>\d+(?:[-.]\d+)?[A-Za-z]?)
        )
        |
        (?P<chinese>
            (?P<chinese_kind>[图表])
            \s*
            (?P<chinese_number>\d+(?:[-.－]\d+)?[A-Za-z]?)
        )
    )
    (?=\s|[.:：\-–—]|$)
    """,
    re.IGNORECASE | re.VERBOSE,
)


class PdfVisualError(RuntimeError):
    """A stable PDF processing failure suitable for an API boundary."""


@dataclass(frozen=True, slots=True)
class DetectedVisual:
    page_number: int
    kind: str
    label: str
    caption: str


def extract_page_texts(path: Path) -> list[str]:
    """Extract plain text page-by-page while always releasing the document."""

    document: fitz.Document | None = None
    try:
        document = fitz.open(path)
        return [page.get_text("text") for page in document]
    except (fitz.FileDataError, RuntimeError, OSError) as exc:
        raise PdfVisualError("PDF 无法读取，可能已损坏或受保护") from exc
    finally:
        if document is not None:
            document.close()


def _matched_visual(match: re.Match[str]) -> tuple[str, str, str]:
    if match.group("english"):
        source_kind = match.group("english_kind")
        number = match.group("english_number")
        kind = "table" if source_kind.lower() == "table" else "figure"
        display_kind = (
            "Figure"
            if source_kind.lower() == "figure"
            else "Fig."
            if source_kind.lower() == "fig"
            else "Table"
        )
        label = f"{display_kind} {number}"
        canonical = f"{kind}:{number.lower().replace('－', '-')}"
        return kind, label, canonical

    source_kind = match.group("chinese_kind")
    number = match.group("chinese_number").replace("－", "-")
    kind = "figure" if source_kind == "图" else "table"
    return kind, f"{source_kind} {number}", f"{kind}:{number.lower()}"


def _join_caption_lines(lines: Sequence[str], start: int) -> str:
    parts = [lines[start].strip()]
    for line in lines[start + 1 :]:
        stripped = line.strip()
        if not stripped or _CAPTION_PATTERN.match(stripped):
            break
        parts.append(stripped)
        if sum(len(part) for part in parts) + len(parts) - 1 >= MAX_CAPTION_CHARACTERS:
            break
    return " ".join(parts)[:MAX_CAPTION_CHARACTERS].rstrip()


def detect_visual_captions(
    page_texts: Sequence[str],
) -> list[DetectedVisual]:
    """Detect common English and Chinese figure/table captions.

    Repeated references with the same kind and number are represented once.
    Captions may continue on following non-empty lines and are bounded so a
    malformed PDF cannot create unreasonably large database rows.
    """

    results: list[DetectedVisual] = []
    seen: set[str] = set()
    for page_number, page_text in enumerate(page_texts, start=1):
        lines = page_text.splitlines()
        for index, line in enumerate(lines):
            match = _CAPTION_PATTERN.match(line)
            if match is None:
                continue
            kind, label, canonical = _matched_visual(match)
            if canonical in seen:
                continue
            seen.add(canonical)
            results.append(
                DetectedVisual(
                    page_number=page_number,
                    kind=kind,
                    label=label,
                    caption=_join_caption_lines(lines, index),
                )
            )
    return results


def _subfigure_labels(label: str, caption: str) -> list[str]:
    labels: list[str] = []
    for item in re.findall(r"(?i)(?:\(|\[)\s*([a-z])\s*(?:\)|\])", caption):
        item = item.lower()
        if item not in labels:
            labels.append(item)
    for start, end in re.findall(
        r"(?i)(?:\(|\[)\s*([a-z])\s*[-–—]\s*([a-z])\s*(?:\)|\])",
        caption,
    ):
        start_code, end_code = ord(start.lower()), ord(end.lower())
        if start_code <= end_code <= ord("h"):
            for code in range(start_code, end_code + 1):
                item = chr(code)
                if item not in labels:
                    labels.append(item)
    label_match = re.search(
        r"(?i)(?:figure|fig\.?|图)\s*\d+(?:[-.]\d+)?([a-z])\b",
        label,
    )
    if label_match and label_match.group(1).lower() not in labels:
        labels.append(label_match.group(1).lower())
    return labels


def _visual_reference_pattern(label: str) -> re.Pattern[str]:
    match = re.search(
        r"(?i)(?:figure|fig\.?|图)\s*(\d+(?:[-.]\d+)?)",
        label,
    )
    if match is None:
        return re.compile(re.escape(label), re.IGNORECASE)
    number = re.escape(match.group(1))
    return re.compile(
        rf"(?i)(?:\b(?:figure|fig\.?)\s*|图\s*){number}"
        r"(?:\s*(?:\(|\[)?[a-z](?:\)|\])?)?(?!\d)",
    )


def _reference_paragraphs(
    page_texts: Sequence[str],
    label: str,
    caption: str,
) -> list[tuple[int, str]]:
    pattern = _visual_reference_pattern(label)
    normalized_caption = " ".join(caption.split()).casefold()
    references: list[tuple[int, str]] = []
    seen: set[str] = set()
    for page_number, page_text in enumerate(page_texts, start=1):
        blocks = re.split(r"\n\s*\n", page_text)
        for block_index, block in enumerate(blocks):
            kept_lines: list[str] = []
            for line in block.splitlines():
                stripped = " ".join(line.split())
                if not stripped:
                    continue
                normalized_line = stripped.casefold()
                if (
                    normalized_caption
                    and _CAPTION_PATTERN.match(stripped)
                    and normalized_caption.startswith(normalized_line)
                ):
                    continue
                kept_lines.append(stripped)
            paragraph = " ".join(kept_lines).strip()
            normalized = paragraph.casefold()
            if not paragraph or not pattern.search(paragraph) or normalized in seen:
                continue
            for neighbor_index in range(max(0, block_index - 1), min(len(blocks), block_index + 2)):
                neighbor = paragraph if neighbor_index == block_index else " ".join(blocks[neighbor_index].split()).strip()
                normalized_neighbor = neighbor.casefold()
                if not neighbor or normalized_neighbor in seen or _CAPTION_PATTERN.match(neighbor):
                    continue
                seen.add(normalized_neighbor)
                references.append((page_number, neighbor[:1200]))
            if len(references) >= MAX_VISUAL_REFERENCE_PASSAGES:
                return references[:MAX_VISUAL_REFERENCE_PASSAGES]
    return references


def build_visual_analysis_context(
    page_texts: Sequence[str],
    label: str,
    caption: str,
    page_number: int,
) -> str:
    """Build a bounded, page-grounded context packet for one detected Figure."""

    subfigures = _subfigure_labels(label, caption)
    page_text = (
        " ".join(page_texts[page_number - 1].split())[:2600]
        if 1 <= page_number <= len(page_texts) and page_texts[page_number - 1].strip()
        else "无法确认"
    )
    references = _reference_paragraphs(page_texts, label, caption)
    reference_text = (
        "\n".join(
            f"- PDF 第 {reference_page} 页：{paragraph}"
            for reference_page, paragraph in references
        )
        if references
        else "无法确认"
    )
    context = (
        "图表上下文绑定\n"
        f"图号：{label or '无法确认'}\n"
        f"Caption：{caption or '无法确认'}\n"
        f"PDF 页码：{page_number if page_number > 0 else '无法确认'}\n"
        f"子图：{', '.join(subfigures) if subfigures else '无法确认'}\n"
        f"图所在页文字：{page_text}\n"
        f"正文引用段落：{reference_text}"
    )
    return context[:MAX_VISUAL_CONTEXT_CHARACTERS]


def _render_page_png(page: fitz.Page, scale: float) -> tuple[bytes, int]:
    pixmap = page.get_pixmap(
        matrix=fitz.Matrix(scale, scale),
        alpha=False,
    )
    return pixmap.tobytes("png"), pixmap.width * pixmap.height


def _crop_rect(
    page: fitz.Page,
    left: float,
    top: float,
    width: float,
    height: float,
) -> fitz.Rect:
    coordinates = (left, top, width, height)
    if not all(math.isfinite(value) for value in coordinates):
        raise PdfVisualError("裁切坐标无效")
    if (
        left < 0
        or top < 0
        or width <= 0
        or height <= 0
        or left + width > 1
        or top + height > 1
    ):
        raise PdfVisualError("裁切区域超出页面范围")
    rect = page.rect
    return fitz.Rect(
        rect.x0 + rect.width * left,
        rect.y0 + rect.height * top,
        rect.x0 + rect.width * (left + width),
        rect.y0 + rect.height * (top + height),
    )


def render_pdf_crop(
    path: Path,
    page_number: int,
    left: float,
    top: float,
    width: float,
    height: float,
    *,
    max_pixels: int = 4_000_000,
    max_output_bytes: int = MAX_PNG_BYTES,
) -> bytes:
    """Render a normalized rectangular crop from a 1-based PDF page."""

    if page_number < 1:
        raise PdfVisualError("页码超出 PDF 范围")
    if max_pixels < 1 or max_output_bytes < 1:
        raise PdfVisualError("页面渲染限制无效")

    document: fitz.Document | None = None
    try:
        document = fitz.open(path)
        if page_number > len(document):
            raise PdfVisualError("页码超出 PDF 范围")
        page = document.load_page(page_number - 1)
        clip = _crop_rect(page, left, top, width, height)
        crop_pixels = max(clip.width * clip.height, 1.0)
        scale = min(2.0, math.sqrt(max_pixels / crop_pixels))
        for _attempt in range(8):
            pixmap = page.get_pixmap(
                matrix=fitz.Matrix(scale, scale),
                clip=clip,
                alpha=False,
            )
            png = pixmap.tobytes("png")
            pixel_count = pixmap.width * pixmap.height
            if pixel_count <= max_pixels and len(png) <= max_output_bytes:
                return png
            pixel_ratio = math.sqrt(max_pixels / max(pixel_count, 1))
            byte_ratio = math.sqrt(max_output_bytes / max(len(png), 1))
            next_scale = scale * min(pixel_ratio, byte_ratio) * 0.92
            if next_scale >= scale or next_scale < 0.05:
                break
            scale = next_scale
        raise PdfVisualError("裁切预览超过安全大小限制")
    except PdfVisualError:
        raise
    except (fitz.FileDataError, RuntimeError, OSError) as exc:
        raise PdfVisualError("PDF 页面无法渲染") from exc
    finally:
        if document is not None:
            document.close()


def render_pdf_page(
    path: Path,
    page_number: int,
    *,
    max_pixels: int = 4_000_000,
    max_output_bytes: int = MAX_PNG_BYTES,
) -> bytes:
    """Render a 1-based PDF page to a bounded in-memory PNG."""

    if page_number < 1:
        raise PdfVisualError("页码超出 PDF 范围")
    if max_pixels < 1 or max_output_bytes < 1:
        raise PdfVisualError("页面渲染限制无效")

    document: fitz.Document | None = None
    try:
        document = fitz.open(path)
        if page_number > len(document):
            raise PdfVisualError("页码超出 PDF 范围")
        page = document.load_page(page_number - 1)
        page_pixels = max(page.rect.width * page.rect.height, 1.0)
        scale = min(2.0, math.sqrt(max_pixels / page_pixels))

        for _attempt in range(8):
            png, pixel_count = _render_page_png(page, scale)
            if pixel_count <= max_pixels and len(png) <= max_output_bytes:
                return png
            pixel_ratio = math.sqrt(max_pixels / max(pixel_count, 1))
            byte_ratio = math.sqrt(max_output_bytes / max(len(png), 1))
            next_scale = scale * min(pixel_ratio, byte_ratio) * 0.92
            if next_scale >= scale or next_scale < 0.05:
                break
            scale = next_scale
        raise PdfVisualError("页面预览超过安全大小限制")
    except PdfVisualError:
        raise
    except (fitz.FileDataError, RuntimeError, OSError) as exc:
        raise PdfVisualError("PDF 页面无法渲染") from exc
    finally:
        if document is not None:
            document.close()
