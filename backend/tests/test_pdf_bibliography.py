import asyncio
from pathlib import Path
from types import SimpleNamespace

import fitz
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Paper
from app.paper_metadata import extract_local_paper_metadata
from app.backfill_paper_metadata import backfill_paper_metadata


def _pdf(path: Path, metadata_title: str = "") -> None:
    with fitz.open() as doc:
        page = doc.new_page()
        page.insert_text((72, 40), "Journal of Energy Storage 42 (2024) 101234", fontsize=12)
        page.insert_text((72, 90), "Achieving a high-performance sodium-ion", fontsize=20)
        page.insert_text((72, 115), "pouch cell by regulating intergrowth structures", fontsize=20)
        page.insert_text((72, 140), "in a layered oxide cathode with anionic redox", fontsize=20)
        page.insert_text((72, 180), "Jane Smith, John Doe", fontsize=11)
        page.insert_text((72, 220), "Abstract\nWe study layered oxide cathodes.\nDOI 10.1000/example", fontsize=10)
        doc.set_metadata({"title": metadata_title})
        doc.save(path)


TITLE = "Achieving a high-performance sodium-ion pouch cell by regulating intergrowth structures in a layered oxide cathode with anionic redox"


def test_multiline_title_ignores_filename_and_journal_masthead(tmp_path):
    from app.paper_metadata import pdf_bibliography_metadata
    path = tmp_path / "wrong.pdf"
    _pdf(path, "Microsoft Word - Document1")
    with fitz.open(path) as doc:
        result = extract_local_paper_metadata(filename=path.name, text=doc[0].get_text(), document_metadata=pdf_bibliography_metadata(doc))
    assert result.title == TITLE
    assert result.journal == "Journal of Energy Storage"


def test_reliable_metadata_title_for_journal_cover():
    result = extract_local_paper_metadata(filename="download.pdf", text="Chemical Society Reviews", document_metadata={"title": "Sodium-ion batteries: present and future", "subject": "Chemical Society Reviews (2024), 53, 4230-4301"})
    assert result.title == "Sodium-ion batteries: present and future"
    assert extract_local_paper_metadata(filename="download.pdf", text="", document_metadata={"title": "钠离子电池研究"}).title == "钠离子电池研究"
    assert extract_local_paper_metadata(filename="download.pdf", text="", document_metadata={"title": "Nature of the layered oxide redox mechanism"}).title == "Nature of the layered oxide redox mechanism"


def test_first_page_doi_and_springer_footer_only():
    result = extract_local_paper_metadata(filename="paper.pdf", text="References\nDOI 10.9999/unrelated", document_metadata={"first_page_text": "Redox ﬂow batteries: a review\nJ Appl Electrochem (2011) 41:1137–1164\nDOI 10.1007/s10800-011-0348-2"})
    assert result.doi == "10.1007/s10800-011-0348-2"
    assert result.journal == "J Appl Electrochem"


def test_doi_fallback_and_source_failure():
    from app.paper_metadata import complete_public_bibliography
    class FakeSource:
        async def get_by_id(self, doi):
            assert doi == "10.1000/example"
            return SimpleNamespace(doi=doi, title=TITLE, journal="Public Journal")
    local = extract_local_paper_metadata(filename="wrong.pdf", text="DOI 10.1000/example")
    result = asyncio.run(complete_public_bibliography(local, source=FakeSource()))
    assert result.title == TITLE
    assert result.journal == "Public Journal"
    class FailedSource:
        async def get_by_id(self, doi):
            raise TimeoutError()
    assert asyncio.run(complete_public_bibliography(local, source=FailedSource())) == local
    class WrongSource:
        async def get_by_id(self, doi):
            return SimpleNamespace(doi="10.9999/wrong", title=TITLE, journal="Wrong Journal")
    assert asyncio.run(complete_public_bibliography(local, source=WrongSource())) == local


def test_bibliography_backfill_preview_apply_idempotent_and_preserves_custom_title(tmp_path):
    path = tmp_path / "wrong.pdf"
    _pdf(path)
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        paper = Paper(title="wrong", original_filename="wrong.pdf", file_path=str(path), file_size=path.stat().st_size, keywords_json='["keep"]')
        custom = Paper(title="My custom title", original_filename="other.pdf", file_path=str(path), file_size=path.stat().st_size, journal="Existing")
        db.add_all([paper, custom])
        db.commit()
        preview = backfill_paper_metadata(db, tmp_path, dry_run=True, bibliography_only=True)
        assert preview["updated"] == 1
        assert preview["changes"][0]["fields"]["title"]["after"] == TITLE
        assert paper.title == "wrong"
        applied = backfill_paper_metadata(db, tmp_path, bibliography_only=True)
        assert applied["updated"] == 1
        assert paper.title == TITLE
        assert paper.journal == "Journal of Energy Storage"
        assert paper.keywords_json == '["keep"]'
        assert custom.title == "My custom title"
        assert backfill_paper_metadata(db, tmp_path, bibliography_only=True)["updated"] == 0


def test_upload_reads_pdf_title_and_survives_public_source_outage(tmp_path, monkeypatch):
    from app.main import create_app
    from app.paper_sources.crossref import CrossrefSource
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'api.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "stored"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    calls = []
    async def unavailable(self, doi):
        calls.append(doi)
        raise TimeoutError()
    monkeypatch.setattr(CrossrefSource, "get_by_id", unavailable)
    path = tmp_path / "misleading.pdf"
    _pdf(path)
    with TestClient(create_app()) as api:
        uploaded = api.post("/api/v1/papers/upload", files={"file": ("misleading.pdf", path.read_bytes(), "application/pdf")})
        assert uploaded.status_code == 201
        assert uploaded.json()["title"] == TITLE
        assert api.get("/api/v1/papers").json()["items"][0]["title"] == TITLE
        with fitz.open() as doc:
            page = doc.new_page()
            page.insert_text((72, 72), "DOI 10.1000/outage")
            payload = doc.tobytes()
        fallback = api.post("/api/v1/papers/upload", files={"file": ("unreadable-title.pdf", payload, "application/pdf")})
        assert fallback.status_code == 201
        assert fallback.json()["title"] == "unreadable-title"
        assert calls == ["10.1000/outage"]


def test_journals_from_elsevier_subject_preproof_and_springer_header():
    cases = [
        ("", {"subject": "Applied Energy, 384 (2025) 125416. doi:10.1000/example"}, "Applied Energy"),
        ("To appear in:\nElectrochimica Acta", {}, "Electrochimica Acta"),
        ("Bordin et al. Discover Applied Sciences          (2025) 7:1084", {}, "Discover Applied Sciences"),
    ]
    for text, metadata, journal in cases:
        assert extract_local_paper_metadata(filename="paper.pdf", text=text, document_metadata=metadata).journal == journal

