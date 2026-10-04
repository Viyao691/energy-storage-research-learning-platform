from __future__ import annotations

from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[2]


def test_docling_is_pinned_local_and_registered() -> None:
    requirements = (REPO_ROOT / "backend" / "requirements.txt").read_text(encoding="utf-8")
    compose = (REPO_ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    notices = (REPO_ROOT / "THIRD_PARTY_NOTICES.md").read_text(encoding="utf-8")

    assert "docling==2.123.1" in requirements
    assert "DOCLING_ARTIFACTS_PATH: /app/models/docling" in compose
    assert "DOCLING_ENABLE_REMOTE_SERVICES: \"false\"" in compose
    assert "DOCLING_ALLOW_EXTERNAL_PLUGINS: \"false\"" in compose
    assert "Docling" in notices
    assert "v2.123.1" in notices
    assert "d745e97" in notices
    assert "Docling Studio" in notices
    assert "v0.7.1" in notices
    assert "e95680a" in notices


def test_fake_document_parser_returns_deterministic_document(tmp_path: Path) -> None:
    from app.document_parsers import (
        FakeDocumentParser,
        ParsedDocument,
        ParsedElement,
        ParsedPage,
    )

    expected = ParsedDocument(
        pages=(
            ParsedPage(
                page_number=1,
                width=595.0,
                height=842.0,
                text="Evidence text",
                elements=(
                    ParsedElement(
                        element_id="docling-1-1",
                        page_number=1,
                        text="Evidence text",
                        label="text",
                        left=10.0,
                        top=20.0,
                        right=300.0,
                        bottom=60.0,
                    ),
                ),
            ),
        ),
        full_text="Evidence text",
        warnings=(),
    )
    parser = FakeDocumentParser(expected)

    actual = parser.parse(tmp_path / "sample.pdf", is_cancelled=lambda: False)

    assert actual == expected
    assert parser.calls == [tmp_path / "sample.pdf"]


def test_docling_adapter_normalizes_bottomleft_bbox_without_importing_docling(
    tmp_path: Path,
) -> None:
    from app.document_parsers import DoclingDocumentParser

    class Box:
        l = 10.0
        t = 700.0
        r = 100.0
        b = 650.0
        coord_origin = "BOTTOMLEFT"

    class Provenance:
        page_no = 1
        bbox = Box()

    class Item:
        text = "Measured capacity"
        label = "text"
        prov = [Provenance()]

    class Size:
        width = 600.0
        height = 800.0

    class Page:
        size = Size()

    class Document:
        pages = {1: Page()}

        def export_to_text(self) -> str:
            return "Measured capacity"

        def iterate_items(self):
            return iter([(Item(), 0)])

    class Result:
        document = Document()

    class Converter:
        def convert(self, _source: Path) -> Result:
            return Result()

    parser = DoclingDocumentParser(
        artifacts_path=tmp_path / "models",
        converter_factory=lambda _path: Converter(),
    )
    result = parser.parse(tmp_path / "paper.pdf", is_cancelled=lambda: False)

    location = result.pages[0].elements[0]
    assert (location.left, location.top, location.right, location.bottom) == (
        10.0,
        100.0,
        100.0,
        150.0,
    )
    assert result.pages[0].text == "Measured capacity"


def test_docling_adapter_checks_cancellation_before_conversion(tmp_path: Path) -> None:
    from app.document_parsers import DoclingDocumentParser, ParseCancelled

    parser = DoclingDocumentParser(
        artifacts_path=tmp_path,
        converter_factory=lambda _path: pytest.fail("converter must not be created"),
    )

    with pytest.raises(ParseCancelled):
        parser.parse(tmp_path / "paper.pdf", is_cancelled=lambda: True)


def test_docling_adapter_keeps_textless_tables_and_pictures(tmp_path: Path) -> None:
    from app.document_parsers import DoclingDocumentParser

    class Box:
        l = 10.0
        t = 20.0
        r = 300.0
        b = 120.0
        coord_origin = "TOPLEFT"

    class Provenance:
        page_no = 1
        bbox = Box()

    class TableItem:
        label = "table"
        prov = [Provenance()]

        def export_to_markdown(self, *, doc) -> str:
            assert doc is document
            return "| Capacity | Value |\n| --- | --- |\n| Q | 120 mAh |"

    class PictureItem:
        label = "picture"
        prov = [Provenance()]

    class Size:
        width = 600.0
        height = 800.0

    class Page:
        size = Size()

    class Document:
        pages = {1: Page()}

        def export_to_text(self) -> str:
            return ""

        def iterate_items(self):
            return iter([(TableItem(), 0), (PictureItem(), 0)])

    document = Document()

    class Result:
        pass

    result = Result()
    result.document = document

    class Converter:
        def convert(self, _source: Path):
            return result

    parser = DoclingDocumentParser(
        artifacts_path=tmp_path / "models",
        converter_factory=lambda _path: Converter(),
    )
    parsed = parser.parse(tmp_path / "paper.pdf", is_cancelled=lambda: False)

    assert [element.label for element in parsed.pages[0].elements] == [
        "table",
        "picture",
    ]
    assert "120 mAh" in parsed.pages[0].text
    assert parsed.pages[0].elements[1].text == ""


def test_docling_capability_is_safe_when_package_is_missing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    import app.document_parsers as parsers

    monkeypatch.setattr(parsers.importlib.util, "find_spec", lambda _name: None)

    capability = parsers.docling_capability(tmp_path / "docling")

    assert capability == {
        "installed": False,
        "artifacts_available": False,
        "ready": False,
        "version": "",
        "reason": "Docling 解析器尚未安装",
    }


def test_empty_formula_keeps_evidence_region_and_warns():
    from types import SimpleNamespace as Item
    from app.document_parsers import _normalize_document
    formula = Item(text="", label="formula", prov=[
        Item(page_no=1, bbox=Item(l=10, t=20, r=100, b=60, coord_origin="TOPLEFT"))
    ])
    doc = Item(pages={1: Item(size=Item(width=600, height=800))},
               iterate_items=lambda: iter([(formula, 0)]), export_to_text=lambda: "")
    result = _normalize_document(doc)
    assert result.pages[0].elements[0].label == "formula"
    assert any("公式" in warning for warning in result.warnings)


@pytest.mark.parametrize("left,origin", [(float("nan"), "TOPLEFT"), (float("inf"), "TOPLEFT"), (10, "UNKNOWN")])
def test_invalid_coordinates_are_not_guessed(left, origin):
    from types import SimpleNamespace
    from app.document_parsers import _top_left_bounds
    assert _top_left_bounds(SimpleNamespace(l=left, t=20, r=100, b=60, coord_origin=origin), 800) is None
