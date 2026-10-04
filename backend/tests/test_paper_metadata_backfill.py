from __future__ import annotations

import json
from pathlib import Path

import fitz
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.backfill_paper_metadata import backfill_paper_metadata
from app.database import Base
from app.models import Paper


def _write_pdf(path: Path, text: str) -> None:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    document.save(path)
    document.close()


def test_backfill_only_fills_empty_fields_and_continues_after_bad_file(tmp_path: Path) -> None:
    storage_root = tmp_path / "papers"
    storage_root.mkdir()
    empty_pdf = storage_root / "empty.pdf"
    existing_pdf = storage_root / "existing.pdf"
    _write_pdf(
        empty_pdf,
        """Comprehensive Review of Power System Flexibility
This article has been accepted for publication in IEEE Access.
Published online: May 22, 2024
DOI 10.1109/ACCESS.2024.1234567
INDEX TERMS Power system flexibility, Energy storage""",
    )
    _write_pdf(existing_pdf, "Existing metadata must be preserved")

    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        empty = Paper(
            title="Empty metadata",
            file_path=str(empty_pdf),
            file_size=empty_pdf.stat().st_size,
            extracted_text=fitz.open(empty_pdf)[0].get_text("text"),
        )
        existing = Paper(
            title="Existing metadata",
            file_path=str(existing_pdf),
            file_size=existing_pdf.stat().st_size,
            extracted_text="Existing metadata must be preserved",
            doi="10.1000/existing",
            journal="用户已有期刊",
            published_date="2020",
            keywords_json=json.dumps(["已有标签"], ensure_ascii=False),
            article_type="研究论文",
        )
        missing = Paper(
            title="Missing PDF",
            file_path=str(storage_root / "missing.pdf"),
            file_size=1,
            extracted_text="",
        )
        db.add_all([empty, existing, missing])
        db.commit()

        summary = backfill_paper_metadata(db, storage_root)
        db.refresh(empty)
        db.refresh(existing)

        assert summary == {"scanned": 3, "updated": 1, "skipped": 1, "failed": 1}
        assert empty.doi == "10.1109/access.2024.1234567"
        assert empty.journal == "IEEE Access"
        assert empty.published_date == "2024"
        assert json.loads(empty.keywords_json) == ["电力系统灵活性", "储能"]
        assert empty.article_type == "综述"
        assert existing.doi == "10.1000/existing"
        assert existing.journal == "用户已有期刊"
        assert existing.published_date == "2020"
        assert json.loads(existing.keywords_json) == ["已有标签"]
        assert existing.article_type == "研究论文"


def test_backfill_prioritizes_eight_author_keywords_over_source_category(tmp_path: Path) -> None:
    storage_root = tmp_path / "papers"
    storage_root.mkdir()
    pdf_path = storage_root / "author-keywords.pdf"
    text = """Keywords: Energy Storage; Na-ion cathode; Structural transition; Rietveld refinement; Layered
oxides; Electrochemical Impedance Spectroscopy; Interfacial Impedance; Equivalent Circuit
Modeling.

Abstract
Summary text
1. Introduction
Background text
2. Results and Discussion
Findings text
4. Conclusions
"""
    _write_pdf(pdf_path, "Author keyword paper")

    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        paper = Paper(
            title="Author keyword paper",
            file_path=str(pdf_path),
            file_size=pdf_path.stat().st_size,
            extracted_text=text,
            doi="10.1000/author-keywords",
            journal="Example Journal",
            published_date="2024",
            keywords_json=json.dumps(["cond-mat.mtrl-sci"], ensure_ascii=False),
            article_type="",
        )
        db.add(paper)
        db.commit()

        summary = backfill_paper_metadata(db, storage_root)
        db.refresh(paper)

        assert summary == {"scanned": 1, "updated": 1, "skipped": 0, "failed": 0}
        assert json.loads(paper.keywords_json) == [
            "储能",
            "钠离子电池正极",
            "结构转变",
            "Rietveld 精修",
            "层状氧化物",
            "电化学阻抗谱",
            "界面阻抗",
            "等效电路建模",
        ]
        assert paper.article_type == "研究论文"


def test_backfill_replaces_stale_source_keywords_with_explicit_author_keywords(tmp_path: Path) -> None:
    storage_root = tmp_path / "papers"
    storage_root.mkdir()
    pdf_path = storage_root / "explicit-keywords.pdf"
    _write_pdf(pdf_path, "Explicit keyword paper")
    text = """INDEX TERMS Electricity markets, Flexibility, Flexibility resources, Variable energy resources
I. INTRODUCTION
Body text.
"""

    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        paper = Paper(
            title="Explicit keyword paper",
            file_path=str(pdf_path),
            file_size=pdf_path.stat().st_size,
            extracted_text=text,
            doi="10.1000/explicit-keywords",
            journal="Example Journal",
            published_date="2024",
            keywords_json=json.dumps([
                "Electricity markets",
                "relying solely on traditional network reinforcements to",
            ]),
            article_type="研究论文",
        )
        db.add(paper)
        db.commit()

        summary = backfill_paper_metadata(db, storage_root)
        db.refresh(paper)

        assert summary == {"scanned": 1, "updated": 1, "skipped": 0, "failed": 0}
        assert json.loads(paper.keywords_json) == [
            "电力市场",
            "灵活性",
            "灵活性资源",
            "可变能源资源",
        ]
