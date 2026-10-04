from __future__ import annotations

from pathlib import Path

import fitz
import pytest
from sqlalchemy import UniqueConstraint


def _make_pdf(path: Path, page_texts: list[str]) -> None:
    document = fitz.open()
    try:
        for text in page_texts:
            page = document.new_page(width=612, height=792)
            page.insert_textbox(
                fitz.Rect(50, 50, 562, 742),
                text,
                fontsize=11,
            )
        document.save(path)
    finally:
        document.close()


def test_detect_visual_captions_supports_english_chinese_and_multiline() -> None:
    from app.pdf_visuals import detect_visual_captions

    pages = [
        (
            "Introduction\n"
            "Figure 1. Crystal structure of P2 material\n"
            "viewed along the c axis.\n\n"
            "正文继续。"
        ),
        (
            "图 2 循环性能比较\n"
            "Table 3. Electrochemical conditions\n"
            "at room temperature."
        ),
        "Fig. 4a: Operando XRD patterns.",
    ]

    visuals = detect_visual_captions(pages)

    assert [
        (item.page_number, item.kind, item.label, item.caption)
        for item in visuals
    ] == [
        (
            1,
            "figure",
            "Figure 1",
            "Figure 1. Crystal structure of P2 material viewed along the c axis.",
        ),
        (2, "figure", "图 2", "图 2 循环性能比较"),
        (
            2,
            "table",
            "Table 3",
            "Table 3. Electrochemical conditions at room temperature.",
        ),
        (3, "figure", "Fig. 4a", "Fig. 4a: Operando XRD patterns."),
    ]


def test_detect_visual_captions_deduplicates_and_limits_caption_length() -> None:
    from app.pdf_visuals import MAX_CAPTION_CHARACTERS, detect_visual_captions

    long_caption = "Figure 5. " + ("capacity retention " * 100)
    visuals = detect_visual_captions(
        [
            "Fig. 2. First occurrence.\nFigure 2. Duplicate spelling.",
            long_caption,
        ]
    )

    assert [(item.page_number, item.label) for item in visuals] == [
        (1, "Fig. 2"),
        (2, "Figure 5"),
    ]
    assert len(visuals[1].caption) <= MAX_CAPTION_CHARACTERS


def test_build_visual_analysis_context_binds_caption_subfigures_and_body_references() -> None:
    from app.pdf_visuals import build_visual_analysis_context

    pages = [
        (
            "Results\nThe initial comparison in Figure 2a shows a lower polarization "
            "for Sample B under the same current density.\n"
        ),
        (
            "Figure 2. Electrochemical evidence: (a) CV curves; (b) GITT response; "
            "(c) EIS spectra.\nAdditional page text."
        ),
        (
            "Discussion\nThe relaxation behavior in Fig. 2b and impedance trend in "
            "Fig. 2c jointly support the kinetic interpretation."
        ),
    ]

    context = build_visual_analysis_context(
        pages,
        "Figure 2",
        pages[1].splitlines()[0],
        2,
    )

    assert "图号：Figure 2" in context
    assert "Caption：Figure 2. Electrochemical evidence" in context
    assert "PDF 页码：2" in context
    assert "子图：a, b, c" in context
    assert "PDF 第 1 页" in context
    assert "lower polarization" in context
    assert "PDF 第 3 页" in context
    assert "jointly support" in context
    assert "正文引用段落：无法确认" not in context


def test_build_visual_analysis_context_marks_missing_references_without_guessing() -> None:
    from app.pdf_visuals import build_visual_analysis_context

    context = build_visual_analysis_context(
        ["Introduction without a figure citation.", "Figure 4. SEM images."],
        "Figure 4",
        "Figure 4. SEM images.",
        2,
    )

    assert "子图：无法确认" in context
    assert "正文引用段落：无法确认" in context


def test_decoupling_figure_one_context_keeps_a_to_d_and_reference_neighbors() -> None:
    from app.pdf_visuals import build_visual_analysis_context

    pages = [
        (
            "Prior paragraph: the high-voltage transition remains unresolved.\n\n"
            "Reference paragraph: Figure 1 introduces the structural descriptors used to track slab gliding.\n\n"
            "Following paragraph: these descriptors motivate the operando comparison."
        ),
        (
            "Figure 1. Structural origin of slab gliding: (a) pristine structure; "
            "(b) charged structure; (c) lattice evolution; (d) gliding descriptor."
        ),
    ]
    context = build_visual_analysis_context(pages, "Figure 1", pages[1], 2)

    assert "子图：a, b, c, d" in context
    assert "Prior paragraph" in context
    assert "Reference paragraph" in context
    assert "Following paragraph" in context


def test_extract_page_texts_and_render_second_page_with_bounded_png(
    tmp_path: Path,
) -> None:
    from app.pdf_visuals import extract_page_texts, render_pdf_page

    source = tmp_path / "two-pages.pdf"
    _make_pdf(source, ["Figure 1. first page", "Table 2. second page"])

    page_texts = extract_page_texts(source)
    png = render_pdf_page(source, 2, max_pixels=120_000)

    assert "Figure 1" in page_texts[0]
    assert "Table 2" in page_texts[1]
    assert png.startswith(b"\x89PNG\r\n\x1a\n")
    assert len(png) <= 8 * 1024 * 1024
    image = fitz.Pixmap(png)
    try:
        assert image.width * image.height <= 120_000
    finally:
        image = None


def test_paper_figure_thumbnail_selects_large_embedded_image_and_caches(tmp_path: Path) -> None:
    from app.pdf_visuals import paper_figure_thumbnail

    source = tmp_path / "figures.pdf"
    cache = tmp_path / "cache" / "figure.png"
    document = fitz.open()
    page = document.new_page(width=612, height=792)
    logo = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 40, 40), 0)
    logo.clear_with(0xCC2211)
    figure = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 500, 300), 0)
    figure.clear_with(0x2288AA)
    page.insert_image(fitz.Rect(20, 20, 60, 60), pixmap=logo)
    page.insert_image(fitz.Rect(55, 160, 555, 460), pixmap=figure)
    document.save(source)
    document.close()

    png = paper_figure_thumbnail(source, cache)

    assert png is not None and png.startswith(b"\x89PNG\r\n\x1a\n")
    assert cache.read_bytes() == png
    image = fitz.Pixmap(png)
    assert image.width > image.height
    assert paper_figure_thumbnail(source, cache) == png


def test_paper_figure_thumbnail_rejects_page_scan_and_remembers_empty(tmp_path: Path) -> None:
    from app.pdf_visuals import paper_figure_thumbnail

    source = tmp_path / "scanned.pdf"
    cache = tmp_path / "cache" / "scan.png"
    document = fitz.open()
    page = document.new_page(width=612, height=792)
    scan = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 612, 792), 0)
    scan.clear_with(0xEEEEEE)
    page.insert_image(page.rect, pixmap=scan)
    document.save(source)
    document.close()

    assert paper_figure_thumbnail(source, cache) is None
    assert cache.with_suffix(".empty").is_file()
    assert paper_figure_thumbnail(source, cache) is None


@pytest.mark.parametrize("page_number", [0, 3])
def test_render_pdf_page_rejects_invalid_page_number(
    tmp_path: Path,
    page_number: int,
) -> None:
    from app.pdf_visuals import PdfVisualError, render_pdf_page

    source = tmp_path / "two-pages.pdf"
    _make_pdf(source, ["one", "two"])

    with pytest.raises(PdfVisualError, match="页码"):
        render_pdf_page(source, page_number)


def test_pdf_helpers_close_document_when_page_operation_fails(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app import pdf_visuals

    source = tmp_path / "one-page.pdf"
    _make_pdf(source, ["Figure 1. test"])
    real_document = fitz.open(source)
    monkeypatch.setattr(pdf_visuals.fitz, "open", lambda _path: real_document)
    monkeypatch.setattr(
        pdf_visuals,
        "_render_page_png",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("boom")),
    )

    with pytest.raises(pdf_visuals.PdfVisualError, match="无法渲染"):
        pdf_visuals.render_pdf_page(source, 1)

    assert real_document.is_closed


def test_paper_visual_model_has_identity_index_and_cascade_relationship() -> None:
    from app.models import Paper, PaperVisual

    unique_columns = {
        tuple(column.name for column in constraint.columns)
        for constraint in PaperVisual.__table__.constraints
        if isinstance(constraint, UniqueConstraint)
    }
    foreign_key = next(iter(PaperVisual.__table__.c.paper_id.foreign_keys))

    assert ("paper_id", "page_number", "kind", "label") in unique_columns
    assert PaperVisual.__table__.c.paper_id.index is True
    assert foreign_key.ondelete == "CASCADE"
    assert Paper.visuals.property.cascade.delete_orphan is True
