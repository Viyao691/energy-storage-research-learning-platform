from __future__ import annotations

from dataclasses import dataclass
import importlib.metadata
import importlib.util
import math
from pathlib import Path
from typing import Callable, Protocol


class ParseCancelled(RuntimeError):
    pass


@dataclass(frozen=True)
class ParsedElement:
    element_id: str
    page_number: int
    text: str
    label: str
    left: float
    top: float
    right: float
    bottom: float


@dataclass(frozen=True)
class ParsedPage:
    page_number: int
    width: float
    height: float
    text: str
    elements: tuple[ParsedElement, ...]


@dataclass(frozen=True)
class ParsedDocument:
    pages: tuple[ParsedPage, ...]
    full_text: str
    warnings: tuple[str, ...] = ()


class DocumentParser(Protocol):
    def parse(
        self,
        source: Path,
        *,
        is_cancelled: Callable[[], bool],
    ) -> ParsedDocument: ...


class FakeDocumentParser:
    def __init__(self, result: ParsedDocument) -> None:
        self.result = result
        self.calls: list[Path] = []

    def parse(
        self,
        source: Path,
        *,
        is_cancelled: Callable[[], bool],
    ) -> ParsedDocument:
        if is_cancelled():
            raise ParseCancelled()
        self.calls.append(source)
        return self.result


def docling_capability(artifacts_path: Path) -> dict[str, object]:
    installed = importlib.util.find_spec("docling") is not None
    artifacts_available = artifacts_path.is_dir() and any(artifacts_path.iterdir())
    version = ""
    if installed:
        try:
            version = importlib.metadata.version("docling")
        except importlib.metadata.PackageNotFoundError:
            installed = False
    if not installed:
        reason = "Docling 解析器尚未安装"
    elif not artifacts_available:
        reason = "Docling 本地模型尚未准备"
    else:
        reason = ""
    return {
        "installed": installed,
        "artifacts_available": artifacts_available,
        "ready": installed and artifacts_available,
        "version": version,
        "reason": reason,
    }


class DoclingDocumentParser:
    def __init__(
        self,
        *,
        artifacts_path: Path,
        converter_factory: Callable[[Path], object] | None = None,
    ) -> None:
        self.artifacts_path = artifacts_path
        self._converter_factory = converter_factory

    def parse(
        self,
        source: Path,
        *,
        is_cancelled: Callable[[], bool],
    ) -> ParsedDocument:
        if is_cancelled():
            raise ParseCancelled()
        converter = (
            self._converter_factory(self.artifacts_path)
            if self._converter_factory is not None
            else self._make_converter()
        )
        result = converter.convert(source)
        if is_cancelled():
            raise ParseCancelled()
        return _normalize_document(result.document)

    def _make_converter(self):
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions
        from docling.document_converter import DocumentConverter, PdfFormatOption

        options = PdfPipelineOptions(
            artifacts_path=self.artifacts_path,
            enable_remote_services=False,
            allow_external_plugins=False,
        )
        return DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=options),
            }
        )


def _normalize_document(document: object) -> ParsedDocument:
    warnings = [
        "当前未启用公式专用识别；分式、上下标及复杂公式须回原文核验。",
        "文本覆盖不等于解析准确率；表格数值、行列关系和单位仍需核验。",
    ]
    raw_pages = getattr(document, "pages", {}) or {}
    page_sizes: dict[int, tuple[float, float]] = {}
    for raw_number, page in raw_pages.items():
        page_number = int(raw_number)
        size = getattr(page, "size", page)
        page_sizes[page_number] = (
            float(getattr(size, "width", 0.0) or 0.0),
            float(getattr(size, "height", 0.0) or 0.0),
        )

    page_elements: dict[int, list[ParsedElement]] = {
        number: [] for number in page_sizes
    }
    iterator = getattr(document, "iterate_items")()
    element_index = 0
    for entry in iterator:
        item = entry[0] if isinstance(entry, tuple) else entry
        text = str(getattr(item, "text", "") or "").strip()
        label_value = getattr(item, "label", "text")
        label = str(getattr(label_value, "value", label_value) or "text")
        if label == "table":
            export_table = getattr(item, "export_to_markdown", None)
            if callable(export_table):
                text = str(export_table(doc=document) or "").strip()
        if not text and label not in {"table", "picture", "figure", "formula", "equation"}:
            continue
        for provenance in getattr(item, "prov", ()) or ():
            page_number = int(getattr(provenance, "page_no", 0) or 0)
            if page_number <= 0:
                continue
            width, height = page_sizes.get(page_number, (0.0, 0.0))
            if width <= 0 or height <= 0:
                continue
            bounds = _top_left_bounds(getattr(provenance, "bbox", None), height)
            if bounds is None:
                if "部分元素坐标无效，未生成定位框。" not in warnings:
                    warnings.append("部分元素坐标无效，未生成定位框。")
                continue
            element_index += 1
            page_elements.setdefault(page_number, []).append(
                ParsedElement(
                    element_id=f"docling-{page_number}-{element_index}",
                    page_number=page_number,
                    text=text,
                    label=label,
                    left=bounds[0],
                    top=bounds[1],
                    right=bounds[2],
                    bottom=bounds[3],
                )
            )

    pages = tuple(
        ParsedPage(
            page_number=page_number,
            width=page_sizes[page_number][0],
            height=page_sizes[page_number][1],
            text="\n".join(element.text for element in page_elements.get(page_number, [])),
            elements=tuple(page_elements.get(page_number, [])),
        )
        for page_number in sorted(page_sizes)
    )
    export_to_text = getattr(document, "export_to_text", None)
    full_text = str(export_to_text() if callable(export_to_text) else "").strip()
    if not full_text:
        full_text = "\n\n".join(page.text for page in pages if page.text)
    return ParsedDocument(pages=pages, full_text=full_text, warnings=tuple(warnings))


def _top_left_bounds(bbox: object, page_height: float) -> tuple[float, float, float, float] | None:
    if bbox is None:
        return None
    try:
        left = float(_bbox_value(bbox, "l", "left"))
        top = float(_bbox_value(bbox, "t", "top"))
        right = float(_bbox_value(bbox, "r", "right"))
        bottom = float(_bbox_value(bbox, "b", "bottom"))
    except (AttributeError, TypeError, ValueError):
        return None
    if not all(math.isfinite(value) for value in (left, top, right, bottom, page_height)):
        return None
    raw_origin = getattr(bbox, "coord_origin", "TOPLEFT")
    origin = str(getattr(raw_origin, "value", raw_origin)).upper().replace("_", "")
    if origin not in {"TOPLEFT", "BOTTOMLEFT"}:
        return None
    if origin == "BOTTOMLEFT":
        top, bottom = page_height - top, page_height - bottom
    left, right = sorted((left, right))
    top, bottom = sorted((top, bottom))
    if right <= left or bottom <= top:
        return None
    return left, top, right, bottom


def _bbox_value(bbox: object, short_name: str, long_name: str) -> object:
    if hasattr(bbox, short_name):
        return getattr(bbox, short_name)
    return getattr(bbox, long_name)
