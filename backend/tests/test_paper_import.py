from __future__ import annotations

import asyncio
import hashlib
import io
import json
import os
import sys
from datetime import datetime
from pathlib import Path
import fitz
import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.config import reset_settings_cache
from app.paper_sources.base import SourcePaper


BACKEND_ROOT = Path(__file__).resolve().parents[1]
ALEMBIC_DIR = BACKEND_ROOT / "alembic"


def _database_url(database_path: Path) -> str:
    return f"sqlite:///{database_path.as_posix()}"


def _alembic_config(database_url: str) -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", ALEMBIC_DIR.as_posix())
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def _upgrade_database(
    monkeypatch: pytest.MonkeyPatch,
    database_path: Path,
    revision: str,
) -> sa.Engine:
    database_url = _database_url(database_path)
    monkeypatch.setenv("DATABASE_URL", database_url)
    reset_settings_cache()
    command.upgrade(_alembic_config(database_url), revision)
    return sa.create_engine(database_url)


@pytest.fixture(autouse=True)
def _reset_cached_settings() -> None:
    yield
    reset_settings_cache()


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def phase2_engine(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> sa.Engine:
    engine = _upgrade_database(monkeypatch, tmp_path / "phase2.db", "head")
    yield engine
    engine.dispose()


def _insert_phase1_rows(engine: sa.Engine) -> None:
    created_at = datetime(2026, 1, 2, 3, 4, 5)
    with engine.begin() as connection:
        connection.execute(
            sa.text(
                """
                INSERT INTO papers (
                    id, original_filename, title, file_path, file_hash,
                    file_size, page_count, extracted_text, parse_confidence,
                    extraction_warning, fulltext_status, created_at
                ) VALUES (
                    :id, :original_filename, :title, :file_path, :file_hash,
                    :file_size, :page_count, :extracted_text, :parse_confidence,
                    :extraction_warning, :fulltext_status, :created_at
                )
                """
            ),
            {
                "id": 41,
                "original_filename": "phase-one.pdf",
                "title": "  Phase　ＯＮＥ—Storage!!!  ",
                "file_path": "/safe/phase-one.pdf",
                "file_hash": "a" * 64,
                "file_size": 1234,
                "page_count": 7,
                "extracted_text": "legacy full text",
                "parse_confidence": 0.95,
                "extraction_warning": None,
                "fulltext_status": "ready",
                "created_at": created_at,
            },
        )
        connection.execute(
            sa.text(
                """
                INSERT INTO notes (id, paper_id, content, updated_at)
                VALUES (11, 41, 'legacy note', :updated_at)
                """
            ),
            {"updated_at": created_at},
        )
        connection.execute(
            sa.text(
                """
                INSERT INTO analyses (
                    id, paper_id, summary, plain_explanation, deep_analysis,
                    evidence_status, provider, model_name, created_at
                ) VALUES (
                    12, 41, 'summary', 'plain', 'deep',
                    'AI推断（Mock 演示）', 'mock', 'mock-v1', :created_at
                )
                """
            ),
            {"created_at": created_at},
        )


def test_upgrade_from_0002_preserves_phase1_rows_and_adds_phase2_schema(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_path = tmp_path / "upgrade.db"
    engine = _upgrade_database(monkeypatch, database_path, "0002")
    _insert_phase1_rows(engine)
    engine.dispose()

    command.upgrade(_alembic_config(_database_url(database_path)), "head")
    engine = sa.create_engine(_database_url(database_path))
    inspector = sa.inspect(engine)

    paper_columns = {
        column["name"]: column for column in inspector.get_columns("papers")
    }
    assert paper_columns["original_filename"]["nullable"] is True
    assert paper_columns["file_path"]["nullable"] is True
    assert paper_columns["file_hash"]["nullable"] is True
    assert paper_columns["normalized_title"]["nullable"] is False
    assert {
        "doi",
        "arxiv_id",
        "authors_json",
        "abstract",
        "journal",
        "published_date",
        "keywords_json",
        "landing_url",
        "pdf_url",
        "oa_status",
        "license",
        "source_type",
        "acquisition_status",
        "article_type",
        "is_favorite",
        "is_read",
    }.issubset(paper_columns)

    paper_indexes = {index["name"]: index for index in inspector.get_indexes("papers")}
    assert paper_indexes["ix_papers_file_hash"]["unique"] == 1
    assert paper_indexes["ix_papers_doi"]["unique"] == 1
    assert paper_indexes["ix_papers_arxiv_id"]["unique"] == 1
    assert paper_indexes["ix_papers_normalized_title"]["unique"] == 0

    assert inspector.has_table("paper_source_records")
    source_unique_constraints = {
        constraint["name"]: constraint
        for constraint in inspector.get_unique_constraints("paper_source_records")
    }
    assert (
        source_unique_constraints[
            "uq_paper_source_records_source_external_id"
        ]["column_names"]
        == ["source", "external_id"]
    )
    source_indexes = {
        index["name"]: index
        for index in inspector.get_indexes("paper_source_records")
    }
    assert source_indexes["ix_paper_source_records_paper_id"]["unique"] == 0
    source_foreign_keys = inspector.get_foreign_keys("paper_source_records")
    assert source_foreign_keys[0]["name"] == (
        "fk_paper_source_records_paper_id_papers"
    )
    assert source_foreign_keys[0]["options"]["ondelete"] == "CASCADE"

    with engine.connect() as connection:
        paper = connection.execute(
            sa.text("SELECT * FROM papers WHERE id = 41")
        ).mappings().one()
        assert paper["title"] == "  Phase　ＯＮＥ—Storage!!!  "
        assert paper["normalized_title"] == "phase one storage"
        assert paper["authors_json"] == "[]"
        assert paper["abstract"] == ""
        assert paper["journal"] == ""
        assert paper["keywords_json"] == "[]"
        assert paper["landing_url"] == ""
        assert paper["oa_status"] == "unknown"
        assert paper["source_type"] == "upload"
        assert paper["acquisition_status"] == "fulltext"
        assert paper["article_type"] == ""
        assert paper["is_favorite"] in (False, 0)
        assert paper["is_read"] in (False, 0)
        assert connection.scalar(
            sa.text("SELECT content FROM notes WHERE paper_id = 41")
        ) == "legacy note"
        assert connection.scalar(
            sa.text("SELECT summary FROM analyses WHERE paper_id = 41")
        ) == "summary"
        analysis = connection.execute(
            sa.text("SELECT * FROM analyses WHERE paper_id = 41")
        ).mappings().one()
        assert analysis["quick_understanding"] == ""
        assert analysis["quick_prompt_version"] == ""
        assert analysis["layman_understanding"] == ""
        assert analysis["layman_prompt_version"] == ""
        assert analysis["reviewer_analysis"] == ""
        assert analysis["reviewer_prompt_version"] == ""

    engine.dispose()


def test_upgrade_from_0004_backfills_ollama_vision_model_and_preserves_settings(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_path = tmp_path / "vision-setting-upgrade.db"
    engine = _upgrade_database(monkeypatch, database_path, "0004")
    with engine.begin() as connection:
        connection.execute(
            sa.text(
                """
                INSERT INTO user_settings (
                    id, model_provider, model_name, model_base_url,
                    timeout_seconds, backup_model, paper_budget,
                    daily_budget, monthly_budget, onboarding_completed,
                    study_mode, research_topics, keywords, daily_task_time
                ) VALUES (
                    1, 'ollama', 'qwen2.5:7b',
                    'http://host.docker.internal:11434', 90,
                    'qwen2.5:3b', 0, 0, 0, 1, '科研助手',
                    '[]', '[]', '08:00'
                )
                """
            )
        )
    engine.dispose()

    command.upgrade(_alembic_config(_database_url(database_path)), "head")
    engine = sa.create_engine(_database_url(database_path))
    try:
        columns = {
            column["name"]
            for column in sa.inspect(engine).get_columns("user_settings")
        }
        assert "vision_model" in columns
        with engine.connect() as connection:
            row = connection.execute(
                sa.text(
                    "SELECT model_name, vision_model FROM user_settings WHERE id = 1"
                )
            ).one()
        assert row.model_name == "qwen2.5:7b"
        assert row.vision_model == "qwen2.5vl:3b"
    finally:
        engine.dispose()


def test_metadata_only_papers_and_multiple_null_hashes_persist_with_defaults(
    phase2_engine: sa.Engine,
) -> None:
    from app.models import Paper

    with Session(phase2_engine) as session:
        first = Paper(
            title="Metadata only one",
            normalized_title="metadata only one",
            file_size=0,
        )
        second = Paper(
            title="Metadata only two",
            normalized_title="metadata only two",
            file_size=0,
        )
        session.add_all([first, second])
        session.commit()
        session.refresh(first)

        assert first.original_filename is None
        assert first.file_path is None
        assert first.file_hash is None
        assert first.authors_json == "[]"
        assert first.abstract == ""
        assert first.journal == ""
        assert first.keywords_json == "[]"
        assert first.landing_url == ""
        assert first.oa_status == "unknown"
        assert first.source_type == "upload"
        assert first.acquisition_status == "fulltext"
        assert session.scalar(
            sa.select(sa.func.count(Paper.id)).where(Paper.file_hash.is_(None))
        ) == 2


def test_paper_orm_derives_canonical_normalized_title_when_missing(
    phase2_engine: sa.Engine,
) -> None:
    from app.models import Paper

    with Session(phase2_engine) as session:
        paper = Paper(
            title="  Ｆｕｌｌｗｉｄｔｈ—Battery／Storage!!!  ",
            file_size=0,
        )
        session.add(paper)
        session.commit()
        session.refresh(paper)
        assert paper.normalized_title == "fullwidth battery storage"

        paper.title = "  Updated—Ｔｉｔｌｅ  "
        paper.normalized_title = ""
        session.commit()
        session.refresh(paper)
        assert paper.normalized_title == "updated title"


def test_paper_orm_preserves_explicit_normalized_title(
    phase2_engine: sa.Engine,
) -> None:
    from app.models import Paper

    with Session(phase2_engine) as session:
        paper = Paper(
            title="Title that does not match",
            normalized_title="curated canonical title",
            file_size=0,
        )
        session.add(paper)
        session.commit()
        session.refresh(paper)
        assert paper.normalized_title == "curated canonical title"

        paper.title = "Changed title"
        session.commit()
        session.refresh(paper)
        assert paper.normalized_title == "curated canonical title"


def test_upload_derives_canonical_normalized_title(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_path = tmp_path / "upload.db"
    monkeypatch.setenv("DATABASE_URL", _database_url(database_path))
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    reset_settings_cache()

    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), "upload normalization")
    payload = document.tobytes()
    document.close()

    from app.main import create_app
    from app.models import Paper

    with TestClient(create_app()) as client:
        response = client.post(
            "/api/v1/papers/upload",
            files={
                "file": (
                    "Ｅｎｅｒｇｙ—Storage   Review.pdf",
                    io.BytesIO(payload),
                    "application/pdf",
                )
            },
        )
        assert response.status_code == 201
        with client.app.state.session_factory() as session:
            paper = session.get(Paper, response.json()["id"])
            assert paper is not None
            assert paper.normalized_title == "energy storage review"


@pytest.mark.parametrize(
    ("field_name", "duplicate_value"),
    [
        ("doi", "10.1000/duplicate"),
        ("arxiv_id", "2401.12345"),
    ],
)
def test_paper_identifiers_are_unique_when_present(
    phase2_engine: sa.Engine,
    field_name: str,
    duplicate_value: str,
) -> None:
    from app.models import Paper

    with Session(phase2_engine) as session:
        session.add(
            Paper(
                title="First",
                normalized_title="first",
                file_size=0,
                **{field_name: duplicate_value},
            )
        )
        session.commit()
        session.add(
            Paper(
                title="Second",
                normalized_title="second",
                file_size=0,
                **{field_name: duplicate_value},
            )
        )
        with pytest.raises(IntegrityError):
            session.commit()


def test_source_identity_is_unique_and_relationship_cascades_on_delete(
    phase2_engine: sa.Engine,
) -> None:
    from app.models import Paper, PaperSourceRecord

    with Session(phase2_engine) as session:
        paper = Paper(
            title="Imported metadata",
            normalized_title="imported metadata",
            file_size=0,
        )
        source = PaperSourceRecord(
            source="openalex",
            external_id="W123",
            landing_url="https://example.test/W123",
            raw_metadata_json='{"id":"W123"}',
        )
        paper.source_records.append(source)
        session.add(paper)
        session.commit()

        assert source.paper_id == paper.id
        assert source.is_open_access is False
        assert source.pdf_url is None
        source_id = source.id

        duplicate_paper = Paper(
            title="Duplicate source",
            normalized_title="duplicate source",
            file_size=0,
        )
        duplicate_paper.source_records.append(
            PaperSourceRecord(source="openalex", external_id="W123")
        )
        session.add(duplicate_paper)
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()

        session.delete(paper)
        session.commit()
        assert session.get(PaperSourceRecord, source_id) is None


def test_runtime_sqlite_rejects_source_record_without_parent(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_path = tmp_path / "foreign-key.db"
    migration_engine = _upgrade_database(monkeypatch, database_path, "head")
    migration_engine.dispose()

    from app.database import make_engine
    from app.models import PaperSourceRecord

    engine = make_engine()
    with Session(engine) as session:
        session.add(
            PaperSourceRecord(
                paper_id=999_999,
                source="openalex",
                external_id="missing-parent",
            )
        )
        with pytest.raises(IntegrityError):
            session.commit()
    engine.dispose()


def test_runtime_sqlite_raw_parent_delete_cascades_source_records(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_path = tmp_path / "foreign-key-cascade.db"
    migration_engine = _upgrade_database(monkeypatch, database_path, "head")
    migration_engine.dispose()

    from app.database import make_engine
    from app.models import Paper, PaperSourceRecord

    engine = make_engine()
    with Session(engine) as session:
        paper = Paper(title="Cascade parent", file_size=0)
        paper.source_records.append(
            PaperSourceRecord(source="openalex", external_id="cascade-child")
        )
        session.add(paper)
        session.commit()
        paper_id = paper.id
        source_id = paper.source_records[0].id

    with engine.begin() as connection:
        connection.execute(
            sa.text("DELETE FROM papers WHERE id = :paper_id"),
            {"paper_id": paper_id},
        )
        assert connection.scalar(
            sa.text(
                "SELECT COUNT(*) FROM paper_source_records WHERE id = :source_id"
            ),
            {"source_id": source_id},
        ) == 0
    engine.dispose()


def test_downgrade_removes_metadata_only_rows_older_schema_cannot_represent(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    database_path = tmp_path / "downgrade.db"
    engine = _upgrade_database(monkeypatch, database_path, "head")
    _insert_phase1_rows(engine)
    with engine.begin() as connection:
        result = connection.execute(
            sa.text(
                """
                INSERT INTO papers (
                    title, normalized_title, file_size, page_count,
                    extracted_text, parse_confidence, fulltext_status, created_at
                ) VALUES (
                    'Metadata row', 'metadata row', 0, 0, '', 0.0,
                    'not_acquired', :created_at
                )
                """
            ),
            {"created_at": datetime(2026, 2, 3, 4, 5, 6)},
        )
        metadata_id = result.lastrowid
        connection.execute(
            sa.text(
                """
                INSERT INTO paper_source_records (
                    paper_id, source, external_id, created_at, updated_at
                ) VALUES (
                    :paper_id, 'openalex', 'W-metadata', :created_at, :updated_at
                )
                """
            ),
            {
                "paper_id": metadata_id,
                "created_at": datetime(2026, 2, 3, 4, 5, 6),
                "updated_at": datetime(2026, 2, 3, 4, 5, 6),
            },
        )
        connection.execute(
            sa.text(
                """
                INSERT INTO notes (id, paper_id, content, updated_at)
                VALUES (21, :paper_id, 'metadata note', :updated_at)
                """
            ),
            {
                "paper_id": metadata_id,
                "updated_at": datetime(2026, 2, 3, 4, 5, 6),
            },
        )
        connection.execute(
            sa.text(
                """
                INSERT INTO analyses (
                    id, paper_id, summary, plain_explanation, deep_analysis,
                    evidence_status, provider, model_name, created_at
                ) VALUES (
                    22, :paper_id, 'metadata summary', 'plain', 'deep',
                    'AI推断（Mock 演示）', 'mock', 'mock-v1', :created_at
                )
                """
            ),
            {
                "paper_id": metadata_id,
                "created_at": datetime(2026, 2, 3, 4, 5, 6),
            },
        )
    engine.dispose()

    command.downgrade(_alembic_config(_database_url(database_path)), "0002")
    engine = sa.create_engine(_database_url(database_path))
    inspector = sa.inspect(engine)
    paper_columns = {
        column["name"]: column for column in inspector.get_columns("papers")
    }

    assert not inspector.has_table("paper_source_records")
    assert "doi" not in paper_columns
    assert paper_columns["original_filename"]["nullable"] is False
    assert paper_columns["file_path"]["nullable"] is False
    assert paper_columns["file_hash"]["nullable"] is False
    with engine.connect() as connection:
        assert connection.scalar(
            sa.text("SELECT COUNT(*) FROM papers WHERE id = 41")
        ) == 1
        assert connection.scalar(
            sa.text("SELECT COUNT(*) FROM papers WHERE id = :paper_id"),
            {"paper_id": metadata_id},
        ) == 0
        assert connection.scalar(
            sa.text("SELECT COUNT(*) FROM notes WHERE paper_id = :paper_id"),
            {"paper_id": metadata_id},
        ) == 0
        assert connection.scalar(
            sa.text("SELECT COUNT(*) FROM analyses WHERE paper_id = :paper_id"),
            {"paper_id": metadata_id},
        ) == 0
        assert connection.scalar(
            sa.text("SELECT content FROM notes WHERE paper_id = 41")
        ) == "legacy note"
        assert connection.scalar(
            sa.text("SELECT summary FROM analyses WHERE paper_id = 41")
        ) == "summary"

    engine.dispose()


class _FreshSource:
    name = "openalex"

    def __init__(self, paper: SourcePaper) -> None:
        self.paper = paper
        self.requested_ids: list[str] = []

    async def get_by_id(self, external_id: str) -> SourcePaper:
        self.requested_ids.append(external_id)
        return self.paper


def _source_paper(**overrides: object) -> SourcePaper:
    values: dict[str, object] = {
        "source": "openalex",
        "external_id": "W123",
        "title": "P2 Layered Oxide",
        "normalized_title": "p2 layered oxide",
        "authors": ("Zhang Wei", "Li Ming"),
        "first_author": "Zhang Wei",
        "abstract": "A sodium-ion battery cathode study.",
        "doi": "10.1000/p2",
        "arxiv_id": None,
        "journal": "Journal of Energy",
        "published_date": "2026-07-01",
        "year": 2026,
        "keywords": ("sodium-ion", "P2"),
        "landing_url": "https://example.org/work/W123",
        "pdf_url": None,
        "is_open_access": False,
        "oa_status": "closed",
        "license": None,
    }
    values.update(overrides)
    return SourcePaper(**values)


@pytest.mark.anyio
async def test_import_metadata_only_refetches_and_persists_deterministic_source(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper, PaperSourceRecord
    from app.services.paper_import import PaperImportService

    fresh = _source_paper()
    source = _FreshSource(fresh)
    with Session(phase2_engine) as session:
        service = PaperImportService(
            session=session,
            sources={"openalex": source},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
        )
        result = await service.import_paper(
            source="openalex",
            external_id="W123",
            download_open_pdf=True,
        )

        assert source.requested_ids == ["W123"]
        assert result.created is True
        assert result.duplicate_reason is None
        assert result.download_attempted is False
        assert result.download_succeeded is False
        assert result.warning is None
        assert result.paper.acquisition_status == "abstract_only"
        assert result.paper.file_path is None
        assert result.paper.file_hash is None
        assert result.paper.file_size == 0

        stored = session.get(Paper, result.paper.id)
        assert stored is not None
        assert json.loads(stored.authors_json) == ["Zhang Wei", "Li Ming"]
        assert stored.keywords_json == '["sodium-ion","P2"]'
        record = session.scalar(sa.select(PaperSourceRecord))
        assert record is not None
        assert record.paper_id == stored.id
        assert record.source == "openalex"
        assert record.external_id == "W123"
        assert json.dumps(
            json.loads(record.raw_metadata_json),
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ) == record.raw_metadata_json


@pytest.mark.anyio
async def test_import_explicit_open_pdf_uses_downloader_and_stores_extraction(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_download import DownloadedPdf
    from app.services.paper_import import PaperImportService
    from app.services.paper_orphans import orphan_marker_path

    final_path = tmp_path / "papers" / f"{'b' * 64}.pdf"
    final_path.parent.mkdir()
    final_path.write_bytes(b"%PDF-test")
    downloader_calls: list[tuple[str, Path, float, float]] = []

    async def downloader(
        url: str,
        destination_dir: str | Path,
        *,
        timeout_seconds: float,
        max_size_mb: float,
    ) -> DownloadedPdf:
        downloader_calls.append(
            (url, Path(destination_dir), timeout_seconds, max_size_mb)
        )
        return DownloadedPdf(
            final_path=final_path,
            sha256="b" * 64,
            file_size=9,
            page_count=2,
            extracted_text="full extracted text",
            parse_confidence=0.88,
            extraction_warning=None,
            fulltext_status="已读取全文",
        )

    fresh = _source_paper(
        pdf_url="https://oa.example.org/paper.pdf",
        is_open_access=True,
        oa_status="gold",
        license="cc-by",
    )
    with Session(phase2_engine) as session:
        result = await PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(fresh)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=17,
            max_size_mb=23,
            downloader=downloader,
        ).import_paper("openalex", "W123", download_open_pdf=True)

        assert downloader_calls == [
            (
                "https://oa.example.org/paper.pdf",
                tmp_path / "papers",
                17,
                23,
            )
        ]
        assert result.download_attempted is True
        assert result.download_succeeded is True
        assert result.paper.acquisition_status == "fulltext"
        assert result.paper.file_path == str(final_path)
        assert result.paper.file_hash == "b" * 64
        assert result.paper.extracted_text == "full extracted text"
        assert orphan_marker_path(tmp_path / "papers", "b" * 64).exists() is False
        assert (
            list(
                (tmp_path / "papers" / ".paper-orphans").glob(
                    f"{'b' * 64}.*.lease"
                )
            )
            == []
        )


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("is_open_access", "pdf_url"),
    [(False, "https://example.org/untrusted.pdf"), (True, None)],
)
async def test_import_never_downloads_without_fresh_explicit_oa_and_pdf_url(
    phase2_engine: sa.Engine,
    tmp_path: Path,
    is_open_access: bool,
    pdf_url: str | None,
) -> None:
    from app.services.paper_import import PaperImportService

    called = False

    async def downloader(*args: object, **kwargs: object) -> object:
        nonlocal called
        called = True
        raise AssertionError("downloader must not be called")

    fresh = _source_paper(
        is_open_access=is_open_access,
        pdf_url=pdf_url,
        oa_status="unknown",
    )
    with Session(phase2_engine) as session:
        result = await PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(fresh)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
            downloader=downloader,
        ).import_paper("openalex", "W123", download_open_pdf=True)

        assert called is False
        assert result.download_attempted is False
        assert result.paper.acquisition_status == "abstract_only"


@pytest.mark.anyio
async def test_import_rejects_fresh_record_with_mismatched_identity(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_import import PaperImportError, PaperImportService

    malicious = _source_paper(
        source="crossref",
        external_id="different",
        pdf_url="https://attacker.example/payload.pdf",
        is_open_access=True,
    )
    with Session(phase2_engine) as session:
        service = PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(malicious)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
        )
        with pytest.raises(PaperImportError) as captured:
            await service.import_paper(
                "openalex",
                "W123",
                download_open_pdf=True,
            )
        assert captured.value.code == "source_identity_mismatch"
        assert session.scalar(sa.select(sa.func.count()).select_from(sa.table("papers"))) == 0


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("existing_values", "fresh_values", "expected_kind"),
    [
        (
            {"doi": "10.1000/duplicate"},
            {"doi": "https://doi.org/10.1000/DUPLICATE", "arxiv_id": None},
            "doi",
        ),
        (
            {"arxiv_id": "2401.12345"},
            {"doi": None, "arxiv_id": "arXiv:2401.12345v2"},
            "arxiv_id",
        ),
        (
            {
                "title": "P2—Layered Oxide!",
                "normalized_title": "p2 layered oxide",
                "authors_json": '["ZHANG, Wei"]',
                "published_date": "2026-01-01",
            },
            {
                "doi": None,
                "arxiv_id": None,
                "title": "P2 Layered Oxide",
                "normalized_title": "p2 layered oxide",
                "authors": ("zhang wei",),
                "first_author": "zhang wei",
                "published_date": "2026-07-01",
                "year": 2026,
            },
            "title_author_year",
        ),
    ],
)
async def test_import_returns_existing_paper_by_ordered_identity(
    phase2_engine: sa.Engine,
    tmp_path: Path,
    existing_values: dict[str, object],
    fresh_values: dict[str, object],
    expected_kind: str,
) -> None:
    from app.models import Paper
    from app.services.paper_import import PaperImportService

    values: dict[str, object] = {
        "title": "Existing",
        "normalized_title": "existing",
        "file_size": 0,
        "authors_json": '["Somebody"]',
        "published_date": "2025-01-01",
    }
    values.update(existing_values)
    with Session(phase2_engine) as session:
        existing = Paper(**values)
        session.add(existing)
        session.commit()
        existing_id = existing.id
        session.rollback()

        result = await PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(_source_paper(**fresh_values))},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
        ).import_paper("openalex", "W123", download_open_pdf=False)

        assert result.created is False
        assert result.paper.id == existing_id
        assert result.duplicate_reason is not None
        assert result.duplicate_reason.kind == expected_kind
        assert session.scalar(sa.select(sa.func.count(Paper.id))) == 1


@pytest.mark.anyio
async def test_reimport_fills_missing_metadata_preserves_user_data_and_fulltext(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Analysis, Note, Paper, PaperSourceRecord
    from app.services.paper_import import PaperImportService

    with Session(phase2_engine) as session:
        paper = Paper(
            title="Existing title",
            normalized_title="existing title",
            doi="10.1000/p2",
            authors_json="[]",
            abstract="",
            journal="",
            file_path="/managed/existing.pdf",
            file_hash="c" * 64,
            file_size=99,
            extracted_text="existing full text",
            page_count=3,
            parse_confidence=0.9,
            fulltext_status="已读取全文",
            acquisition_status="fulltext",
        )
        session.add(paper)
        session.flush()
        session.add_all(
            [
                Note(paper_id=paper.id, content="do not overwrite"),
                Analysis(
                    paper_id=paper.id,
                    summary="saved summary",
                    plain_explanation="saved explanation",
                    deep_analysis="saved deep analysis",
                    evidence_status="原文明示",
                    provider="mock",
                    model_name="mock-v1",
                ),
            ]
        )
        session.commit()
        paper_id = paper.id
        session.rollback()

        downloader_called = False

        async def downloader(*args: object, **kwargs: object) -> object:
            nonlocal downloader_called
            downloader_called = True
            raise AssertionError("existing fulltext must be preserved")

        fresh = _source_paper(
            title="Remote changed title",
            abstract="new abstract",
            journal="new journal",
            pdf_url="https://oa.example.org/new.pdf",
            is_open_access=True,
        )
        result = await PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(fresh)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
            downloader=downloader,
        ).import_paper("openalex", "W123", download_open_pdf=True)

        session.expire_all()
        stored = session.get(Paper, paper_id)
        assert stored is not None
        assert result.created is False
        assert stored.title == "Existing title"
        assert stored.abstract == "new abstract"
        assert stored.journal == "new journal"
        assert json.loads(stored.authors_json) == ["Zhang Wei", "Li Ming"]
        assert stored.file_path == "/managed/existing.pdf"
        assert stored.extracted_text == "existing full text"
        assert stored.acquisition_status == "fulltext"
        assert downloader_called is False
        assert session.scalar(sa.select(Note.content).where(Note.paper_id == paper_id)) == "do not overwrite"
        assert session.scalar(sa.select(Analysis.summary).where(Analysis.paper_id == paper_id)) == "saved summary"
        assert session.scalar(
            sa.select(sa.func.count(PaperSourceRecord.id)).where(
                PaperSourceRecord.paper_id == paper_id
            )
        ) == 1


@pytest.mark.anyio
async def test_download_failure_keeps_metadata_and_returns_safe_warning(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_download import PaperDownloadError
    from app.services.paper_import import PaperImportService

    async def downloader(*args: object, **kwargs: object) -> object:
        raise PaperDownloadError(
            "network_failure",
            "secret=https://token@example.org/private.pdf",
        )

    fresh = _source_paper(
        pdf_url="https://oa.example.org/paper.pdf",
        is_open_access=True,
    )
    with Session(phase2_engine) as session:
        result = await PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(fresh)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
            downloader=downloader,
        ).import_paper("openalex", "W123", download_open_pdf=True)

        assert result.created is True
        assert result.download_attempted is True
        assert result.download_succeeded is False
        assert result.paper.acquisition_status == "download_failed"
        assert result.warning == "开放 PDF 下载失败，已保留论文元数据；可稍后重试或手动上传合法 PDF。"
        assert "token" not in result.warning
        assert result.paper.file_path is None


@pytest.mark.anyio
async def test_database_failure_rolls_back_but_retains_content_addressed_download(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_download import DownloadedPdf
    from app.services.paper_import import PaperImportError, PaperImportService
    from app.services.paper_orphans import orphan_marker_path

    final_path = tmp_path / "papers" / f"{'d' * 64}.pdf"
    final_path.parent.mkdir()
    final_path.write_bytes(b"%PDF-orphan")

    async def downloader(*args: object, **kwargs: object) -> DownloadedPdf:
        return DownloadedPdf(
            final_path=final_path,
            sha256="d" * 64,
            file_size=11,
            page_count=1,
            extracted_text="text",
            parse_confidence=0.8,
            extraction_warning=None,
            fulltext_status="已读取全文",
        )

    fresh = _source_paper(
        pdf_url="https://oa.example.org/paper.pdf",
        is_open_access=True,
    )
    with Session(phase2_engine) as session:
        service = PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(fresh)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
            downloader=downloader,
        )

        @sa.event.listens_for(session, "before_commit", once=True)
        def _fail_commit(_session: Session) -> None:
            raise RuntimeError("simulated database failure")

        with pytest.raises(PaperImportError) as captured:
            await service.import_paper(
                "openalex",
                "W123",
                download_open_pdf=True,
            )

        assert captured.value.code == "database_error"
        assert "simulated" not in str(captured.value)
        assert final_path.exists() is True
        assert orphan_marker_path(tmp_path / "papers", "d" * 64).exists()
        assert session.in_transaction() is False
        assert session.scalar(
            sa.select(sa.func.count()).select_from(sa.table("papers"))
        ) == 0


@pytest.mark.anyio
async def test_flush_conflict_retains_content_addressed_download(
    phase2_engine: sa.Engine,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services.paper_download import DownloadedPdf
    from app.services.paper_import import PaperImportError, PaperImportService
    from app.services.paper_orphans import orphan_marker_path

    final_path = tmp_path / "papers" / f"{'e' * 64}.pdf"
    final_path.parent.mkdir()
    final_path.write_bytes(b"%PDF-orphan")

    async def downloader(*args: object, **kwargs: object) -> DownloadedPdf:
        return DownloadedPdf(
            final_path=final_path,
            sha256="e" * 64,
            file_size=11,
            page_count=1,
            extracted_text="text",
            parse_confidence=0.8,
            extraction_warning=None,
            fulltext_status="已读取全文",
        )

    fresh = _source_paper(
        pdf_url="https://oa.example.org/paper.pdf",
        is_open_access=True,
    )
    with Session(phase2_engine) as session:
        original_flush = session.flush
        calls = 0

        def conflict_once(*args: object, **kwargs: object) -> None:
            nonlocal calls
            if session.new:
                calls += 1
            if calls == 1 and session.new:
                raise IntegrityError("INSERT", {}, RuntimeError("race"))
            original_flush(*args, **kwargs)

        monkeypatch.setattr(session, "flush", conflict_once)
        service = PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(fresh)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
            downloader=downloader,
        )

        with pytest.raises(PaperImportError) as captured:
            await service.import_paper(
                "openalex",
                "W123",
                download_open_pdf=True,
            )

        assert captured.value.code == "database_conflict"
        assert final_path.exists() is True
        assert orphan_marker_path(tmp_path / "papers", "e" * 64).exists()


@pytest.mark.anyio
async def test_source_fetch_failure_is_sanitized_and_writes_nothing(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_import import PaperImportError, PaperImportService

    class FailingSource:
        async def get_by_id(self, external_id: str) -> SourcePaper:
            raise RuntimeError(
                f"GET https://token@example.org/{external_id}?secret=abc"
            )

    with Session(phase2_engine) as session:
        service = PaperImportService(
            session=session,
            sources={"openalex": FailingSource()},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
        )
        with pytest.raises(PaperImportError) as captured:
            await service.import_paper(
                "openalex",
                "W-secret",
                download_open_pdf=False,
            )

        assert captured.value.code == "source_fetch_failed"
        assert "token" not in str(captured.value)
        assert "secret" not in str(captured.value)
        assert captured.value.__cause__ is None
        assert session.scalar(
            sa.select(sa.func.count()).select_from(sa.table("papers"))
        ) == 0


@pytest.mark.anyio
async def test_import_without_abstract_is_metadata_only(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_import import PaperImportService

    with Session(phase2_engine) as session:
        result = await PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(_source_paper(abstract=""))},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
        ).import_paper("openalex", "W123", download_open_pdf=False)

        assert result.paper.acquisition_status == "metadata_only"
        assert result.paper.fulltext_status == "仅元数据或摘要"


@pytest.mark.anyio
async def test_conflicting_doi_and_arxiv_matches_are_rejected(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_import import PaperImportService

    with Session(phase2_engine) as session:
        doi_paper = Paper(
            title="DOI paper",
            doi="10.1000/priority",
            file_size=0,
        )
        arxiv_paper = Paper(
            title="arXiv paper",
            arxiv_id="2401.77777",
            file_size=0,
        )
        session.add_all([doi_paper, arxiv_paper])
        session.commit()

        fresh = _source_paper(
            doi="10.1000/priority",
            arxiv_id="2401.77777",
        )
        from app.services.paper_import import PaperImportError

        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(fresh)},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
            ).import_paper("openalex", "W123", download_open_pdf=False)

        assert captured.value.code == "identity_conflict"
        assert session.in_transaction() is False


@pytest.mark.anyio
async def test_reimport_fills_blank_title_and_keeps_normalized_title_consistent(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_import import PaperImportService

    with Session(phase2_engine) as session:
        existing = Paper(
            title="   ",
            normalized_title="",
            doi="10.1000/p2",
            file_size=0,
        )
        session.add(existing)
        session.commit()

        result = await PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(_source_paper())},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
        ).import_paper("openalex", "W123", download_open_pdf=False)

        assert result.created is False
        assert result.paper.title == "P2 Layered Oxide"
        assert result.paper.normalized_title == "p2 layered oxide"


@pytest.mark.anyio
async def test_title_year_without_authors_does_not_deduplicate(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_import import PaperImportService

    with Session(phase2_engine) as session:
        session.add(
            Paper(
                title="Same title",
                normalized_title="same title",
                authors_json="[]",
                published_date="2026-01-01",
                file_size=0,
            )
        )
        session.commit()

        fresh = _source_paper(
            title="Same title",
            normalized_title="same title",
            authors=(),
            first_author="",
            published_date="2026-07-01",
            year=2026,
            doi=None,
            arxiv_id=None,
        )
        result = await PaperImportService(
            session=session,
            sources={"openalex": _FreshSource(fresh)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
        ).import_paper("openalex", "W123", download_open_pdf=False)

        assert result.created is True
        assert result.duplicate_reason is None
        assert session.scalar(sa.select(sa.func.count(Paper.id))) == 2


@pytest.mark.anyio
async def test_source_identity_conflicting_with_doi_is_rejected(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper, PaperSourceRecord
    from app.services.paper_import import PaperImportError, PaperImportService

    with Session(phase2_engine) as session:
        doi_owner = Paper(
            title="DOI owner",
            doi="10.1000/p2",
            file_size=0,
        )
        source_owner = Paper(title="Source owner", file_size=0)
        session.add_all([doi_owner, source_owner])
        session.flush()
        session.add(
            PaperSourceRecord(
                paper_id=source_owner.id,
                source="openalex",
                external_id="W123",
            )
        )
        session.commit()

        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(_source_paper())},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
            ).import_paper("openalex", "W123", download_open_pdf=False)

        assert captured.value.code == "identity_conflict"
        assert session.in_transaction() is False


@pytest.mark.anyio
async def test_network_awaits_hold_no_database_transaction(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_download import DownloadedPdf
    from app.services.paper_import import PaperImportService

    final_path = tmp_path / "papers" / f"{'2' * 64}.pdf"
    final_path.parent.mkdir()
    final_path.write_bytes(b"%PDF-test")
    with Session(phase2_engine) as session:
        source_checked = False
        download_checked = False

        class TransactionCheckingSource:
            async def get_by_id(self, external_id: str) -> SourcePaper:
                nonlocal source_checked
                source_checked = True
                assert session.in_transaction() is False
                return _source_paper(
                    pdf_url="https://oa.example.org/paper.pdf",
                    is_open_access=True,
                )

        async def downloader(*args: object, **kwargs: object) -> DownloadedPdf:
            nonlocal download_checked
            download_checked = True
            assert session.in_transaction() is False
            return DownloadedPdf(
                final_path=final_path,
                sha256="2" * 64,
                file_size=9,
                page_count=1,
                extracted_text="text",
                parse_confidence=0.8,
                extraction_warning=None,
                fulltext_status="已读取全文",
            )

        await PaperImportService(
            session=session,
            sources={"openalex": TransactionCheckingSource()},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
            downloader=downloader,
        ).import_paper("openalex", "W123", download_open_pdf=True)

        assert source_checked is True
        assert download_checked is True


@pytest.mark.anyio
async def test_unexpected_download_error_is_sanitized_and_session_reusable(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_import import PaperImportError, PaperImportService

    async def downloader(*args: object, **kwargs: object) -> object:
        raise RuntimeError("secret=/private/path?token=abc")

    fresh = _source_paper(
        pdf_url="https://oa.example.org/paper.pdf",
        is_open_access=True,
    )
    with Session(phase2_engine) as session:
        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(fresh)},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
                downloader=downloader,
            ).import_paper("openalex", "W123", download_open_pdf=True)

        assert captured.value.code == "download_failed"
        assert "secret" not in str(captured.value)
        assert "private" not in str(captured.value)
        assert session.in_transaction() is False
        assert session.scalar(sa.select(sa.literal(1))) == 1


@pytest.mark.anyio
async def test_cancelled_download_rolls_back_and_session_is_reusable(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_import import PaperImportService

    async def downloader(*args: object, **kwargs: object) -> object:
        raise asyncio.CancelledError

    fresh = _source_paper(
        pdf_url="https://oa.example.org/paper.pdf",
        is_open_access=True,
    )
    with Session(phase2_engine) as session:
        with pytest.raises(asyncio.CancelledError):
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(fresh)},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
                downloader=downloader,
            ).import_paper("openalex", "W123", download_open_pdf=True)

        assert session.in_transaction() is False
        assert session.scalar(sa.select(sa.literal(1))) == 1


@pytest.mark.anyio
async def test_initial_database_error_is_sanitized(
    phase2_engine: sa.Engine,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services.paper_import import PaperImportError, PaperImportService

    with Session(phase2_engine) as session:
        def fail_scalar(*args: object, **kwargs: object) -> object:
            raise IntegrityError(
                "SELECT secret FROM /private/path",
                {"token": "abc"},
                RuntimeError("database detail"),
            )

        monkeypatch.setattr(session, "scalar", fail_scalar)
        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(_source_paper())},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
            ).import_paper("openalex", "W123", download_open_pdf=False)

        assert captured.value.code == "database_error"
        assert "SELECT" not in str(captured.value)
        assert "private" not in str(captured.value)
        assert "token" not in str(captured.value)
        assert session.in_transaction() is False


@pytest.mark.anyio
async def test_refresh_database_error_is_sanitized_and_session_reusable(
    phase2_engine: sa.Engine,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services.paper_import import PaperImportError, PaperImportService

    with Session(phase2_engine) as session:
        def fail_refresh(*args: object, **kwargs: object) -> None:
            raise IntegrityError(
                "SELECT secret FROM /private/path",
                {"token": "abc"},
                RuntimeError("database detail"),
            )

        monkeypatch.setattr(session, "refresh", fail_refresh)
        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(_source_paper())},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
            ).import_paper("openalex", "W123", download_open_pdf=False)

        assert captured.value.code == "database_error"
        assert "SELECT" not in str(captured.value)
        assert "private" not in str(captured.value)
        assert session.in_transaction() is False
        assert session.scalar(sa.select(sa.literal(1))) == 1


@pytest.mark.anyio
async def test_two_sessions_do_not_delete_shared_content_addressed_file(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_download import DownloadedPdf
    from app.services.paper_import import PaperImportService

    shared_path = tmp_path / "papers" / f"{'3' * 64}.pdf"
    shared_path.parent.mkdir()
    shared_path.write_bytes(b"%PDF-shared")
    with Session(phase2_engine) as importing_session:
        async def downloader(*args: object, **kwargs: object) -> DownloadedPdf:
            assert importing_session.in_transaction() is False
            with Session(phase2_engine) as winning_session:
                winner = Paper(
                    title="Concurrent winner",
                    doi="10.1000/p2",
                    file_path=str(shared_path),
                    file_hash="3" * 64,
                    file_size=11,
                    extracted_text="winner text",
                    acquisition_status="fulltext",
                )
                winning_session.add(winner)
                winning_session.commit()
            return DownloadedPdf(
                final_path=shared_path,
                sha256="3" * 64,
                file_size=11,
                page_count=1,
                extracted_text="download text",
                parse_confidence=0.8,
                extraction_warning=None,
                fulltext_status="已读取全文",
            )

        fresh = _source_paper(
            pdf_url="https://oa.example.org/paper.pdf",
            is_open_access=True,
        )
        result = await PaperImportService(
            session=importing_session,
            sources={"openalex": _FreshSource(fresh)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
            downloader=downloader,
        ).import_paper("openalex", "W123", download_open_pdf=True)

        assert result.created is False
        assert result.paper.file_path == str(shared_path)
        assert result.paper.extracted_text == "winner text"
        assert shared_path.exists() is True


@pytest.mark.anyio
async def test_dirty_shared_session_is_rejected_without_losing_caller_changes(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Note, Paper
    from app.services.paper_import import PaperImportError, PaperImportService

    source_called = False

    class NeverCalledSource:
        async def get_by_id(self, external_id: str) -> SourcePaper:
            nonlocal source_called
            source_called = True
            return _source_paper()

    with Session(phase2_engine) as session:
        existing = Paper(title="Existing", file_size=0)
        session.add(existing)
        session.flush()
        note = Note(paper_id=existing.id, content="saved")
        session.add(note)
        session.commit()

        note.content = "caller pending note"
        existing.title = "Caller pending title"
        pending_paper = Paper(title="Caller pending paper", file_size=0)
        session.add(pending_paper)
        service = PaperImportService(
            session=session,
            sources={"openalex": NeverCalledSource()},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
        )

        with pytest.raises(PaperImportError) as captured:
            await service.import_paper(
                "openalex",
                "W123",
                download_open_pdf=False,
            )

        assert captured.value.code == "session_not_clean"
        assert source_called is False
        assert note.content == "caller pending note"
        assert existing.title == "Caller pending title"
        assert note in session.dirty
        assert existing in session.dirty
        assert pending_paper in session.new
        assert session.in_transaction() is True


@pytest.mark.anyio
async def test_active_select_transaction_is_rejected_without_rollback(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_import import PaperImportError, PaperImportService

    source_called = False

    class NeverCalledSource:
        async def get_by_id(self, external_id: str) -> SourcePaper:
            nonlocal source_called
            source_called = True
            return _source_paper()

    with Session(phase2_engine) as session:
        assert session.scalar(sa.select(sa.literal(1))) == 1
        assert session.in_transaction() is True
        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": NeverCalledSource()},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
            ).import_paper("openalex", "W123", download_open_pdf=False)

        assert captured.value.code == "session_not_clean"
        assert source_called is False
        assert session.in_transaction() is True


@pytest.mark.anyio
async def test_flushed_pending_paper_transaction_is_not_rolled_back(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_import import PaperImportError, PaperImportService

    with Session(phase2_engine) as session:
        pending = Paper(title="Flushed caller paper", file_size=0)
        session.add(pending)
        session.flush()
        pending_id = pending.id

        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(_source_paper())},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
            ).import_paper("openalex", "W123", download_open_pdf=False)

        assert captured.value.code == "session_not_clean"
        assert session.in_transaction() is True
        assert session.get(Paper, pending_id) is pending


@pytest.mark.anyio
async def test_pending_delete_transaction_is_not_rolled_back(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_import import PaperImportError, PaperImportService

    with Session(phase2_engine) as session:
        paper = Paper(title="Caller delete", file_size=0)
        session.add(paper)
        session.commit()
        session.delete(paper)

        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(_source_paper())},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
            ).import_paper("openalex", "W123", download_open_pdf=False)

        assert captured.value.code == "session_not_clean"
        assert session.in_transaction() is True
        assert paper in session.deleted


@pytest.mark.anyio
async def test_concurrent_winner_with_different_fulltext_creates_real_orphan(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_download import DownloadedPdf
    from app.services.paper_import import PaperImportService
    from app.services.paper_orphans import orphan_marker_path

    orphan_path = tmp_path / "papers" / f"{'4' * 64}.pdf"
    orphan_path.parent.mkdir()
    orphan_path.write_bytes(b"%PDF-orphan")
    winner_path = tmp_path / "papers" / f"{'5' * 64}.pdf"
    winner_path.write_bytes(b"%PDF-winner")

    with Session(phase2_engine) as importing_session:
        async def downloader(*args: object, **kwargs: object) -> DownloadedPdf:
            assert importing_session.in_transaction() is False
            with Session(phase2_engine) as winning_session:
                winning_session.add(
                    Paper(
                        title="Concurrent winner",
                        doi="10.1000/p2",
                        file_path=str(winner_path),
                        file_hash="5" * 64,
                        file_size=11,
                        extracted_text="winner text",
                        acquisition_status="fulltext",
                    )
                )
                winning_session.commit()
            return DownloadedPdf(
                final_path=orphan_path,
                sha256="4" * 64,
                file_size=11,
                page_count=1,
                extracted_text="orphan text",
                parse_confidence=0.8,
                extraction_warning=None,
                fulltext_status="已读取全文",
            )

        fresh = _source_paper(
            pdf_url="https://oa.example.org/paper.pdf",
            is_open_access=True,
        )
        result = await PaperImportService(
            session=importing_session,
            sources={"openalex": _FreshSource(fresh)},
            storage_dir=tmp_path / "papers",
            timeout_seconds=30,
            max_size_mb=50,
            downloader=downloader,
        ).import_paper("openalex", "W123", download_open_pdf=True)

        assert result.paper.file_path == str(winner_path)
        assert result.paper.extracted_text == "winner text"
        assert result.warning is not None
        assert "安全保留" in result.warning
        assert orphan_path.exists() is True
        assert orphan_marker_path(tmp_path / "papers", "4" * 64).exists()


def test_orphan_cleanup_respects_grace_period(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_orphans import (
        cleanup_orphaned_pdfs,
        mark_download_orphan,
        orphan_marker_path,
    )

    storage = tmp_path / "papers"
    storage.mkdir()
    digest = "6" * 64
    final_path = storage / f"{digest}.pdf"
    final_path.write_bytes(b"%PDF-grace")
    mark_download_orphan(storage, digest, marked_at=1_000.0)

    result = cleanup_orphaned_pdfs(
        storage,
        sessionmaker(bind=phase2_engine),
        grace_period_seconds=300,
        now=1_100.0,
    )

    assert result.deleted == 0
    assert result.retained_grace == 1
    assert final_path.exists()
    assert orphan_marker_path(storage, digest).exists()


def test_orphan_cleanup_respects_active_lease(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_orphans import (
        acquire_download_lease,
        cleanup_orphaned_pdfs,
        mark_download_orphan,
        release_download_lease,
    )

    storage = tmp_path / "papers"
    storage.mkdir()
    digest = "7" * 64
    final_path = storage / f"{digest}.pdf"
    final_path.write_bytes(b"%PDF-active")
    mark_download_orphan(storage, digest, marked_at=1_000.0)
    lease_id = acquire_download_lease(storage, digest, created_at=1_050.0)
    try:
        result = cleanup_orphaned_pdfs(
            storage,
            sessionmaker(bind=phase2_engine),
            grace_period_seconds=300,
            now=2_000.0,
        )
        assert result.deleted == 0
        assert result.retained_active == 1
        assert final_path.exists()
    finally:
        release_download_lease(storage, digest, lease_id)


def test_orphan_cleanup_reclaims_stale_lease_then_deletes_expired_orphan(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_orphans import (
        DEFAULT_LEASE_STALE_SECONDS,
        acquire_download_lease,
        cleanup_orphaned_pdfs,
        mark_download_orphan,
    )

    storage = tmp_path / "papers"
    storage.mkdir()
    payload = b"%PDF-stale"
    digest = hashlib.sha256(payload).hexdigest()
    final_path = storage / f"{digest}.pdf"
    final_path.write_bytes(payload)
    mark_download_orphan(storage, digest, marked_at=1_000.0)
    acquire_download_lease(storage, digest, created_at=1_100.0)
    assert DEFAULT_LEASE_STALE_SECONDS > 600

    result = cleanup_orphaned_pdfs(
        storage,
        sessionmaker(bind=phase2_engine),
        grace_period_seconds=300,
        lease_stale_seconds=7_200,
        now=10_000.0,
    )

    assert result.deleted == 1
    assert result.reclaimed_stale_leases == 1
    assert final_path.exists() is False
    assert (
        list((storage / ".paper-orphans").glob(f"{digest}.*.lease"))
        == []
    )


def test_cleanup_recovers_crashed_stale_lease_without_orphan_marker(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_orphans import (
        acquire_download_lease,
        cleanup_orphaned_pdfs,
    )

    storage = tmp_path / "papers"
    storage.mkdir()
    payload = b"%PDF-crash"
    digest = hashlib.sha256(payload).hexdigest()
    final_path = storage / f"{digest}.pdf"
    final_path.write_bytes(payload)
    os.utime(final_path, (1_000.0, 1_000.0))
    acquire_download_lease(storage, digest, created_at=1_100.0)
    (
        storage
        / ".paper-orphans"
        / f"{digest}.orphan.json"
    ).unlink()

    result = cleanup_orphaned_pdfs(
        storage,
        sessionmaker(bind=phase2_engine),
        grace_period_seconds=300,
        lease_stale_seconds=7_200,
        now=10_000.0,
    )

    assert result.deleted == 1
    assert result.reclaimed_stale_leases == 1
    assert final_path.exists() is False


def test_orphan_cleanup_keeps_database_referenced_file_and_clears_marker(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_orphans import (
        cleanup_orphaned_pdfs,
        mark_download_orphan,
        orphan_marker_path,
    )

    storage = tmp_path / "papers"
    storage.mkdir()
    digest = "8" * 64
    final_path = storage / f"{digest}.pdf"
    final_path.write_bytes(b"%PDF-referenced")
    mark_download_orphan(storage, digest, marked_at=1_000.0)
    with Session(phase2_engine) as session:
        session.add(
            Paper(
                title="Referenced",
                file_path=str(final_path),
                file_hash=digest,
                file_size=15,
                acquisition_status="fulltext",
            )
        )
        session.commit()

    result = cleanup_orphaned_pdfs(
        storage,
        sessionmaker(bind=phase2_engine),
        grace_period_seconds=300,
        now=2_000.0,
    )

    assert result.deleted == 0
    assert result.adopted_referenced == 1
    assert final_path.exists()
    assert orphan_marker_path(storage, digest).exists() is False


def test_orphan_cleanup_deletes_only_expired_unreferenced_file(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_orphans import (
        cleanup_orphaned_pdfs,
        mark_download_orphan,
        orphan_marker_path,
    )

    storage = tmp_path / "papers"
    storage.mkdir()
    payload = b"%PDF-expired"
    digest = hashlib.sha256(payload).hexdigest()
    final_path = storage / f"{digest}.pdf"
    final_path.write_bytes(payload)
    mark_download_orphan(storage, digest, marked_at=1_000.0)

    result = cleanup_orphaned_pdfs(
        storage,
        sessionmaker(bind=phase2_engine),
        grace_period_seconds=300,
        now=2_000.0,
    )

    assert result.deleted == 1
    assert final_path.exists() is False
    assert orphan_marker_path(storage, digest).exists() is False


def test_orphan_cleanup_never_deletes_content_that_conflicts_with_hash_name(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.services.paper_orphans import (
        claim_downloaded_pdf,
        cleanup_orphaned_pdfs,
        orphan_marker_path,
    )

    storage = tmp_path / "papers"
    storage.mkdir()
    expected_payload = b"%PDF-expected" + (b"x" * (2 * 1024 * 1024))
    unrelated_payload = b"%PDF-unrelated" + (b"y" * (2 * 1024 * 1024))
    digest = hashlib.sha256(expected_payload).hexdigest()
    final_path = storage / f"{digest}.pdf"
    final_path.write_bytes(unrelated_payload)
    claim_downloaded_pdf(storage, digest, created_at=1_000.0)

    result = cleanup_orphaned_pdfs(
        storage,
        sessionmaker(bind=phase2_engine),
        grace_period_seconds=0,
        lease_stale_seconds=1,
        now=10_000.0,
    )

    assert result.deleted == 0
    assert result.retained_conflict == 1
    assert result.reclaimed_stale_leases == 1
    assert final_path.read_bytes() == unrelated_payload
    assert orphan_marker_path(storage, digest).exists() is False
    assert list((storage / ".paper-orphans").glob(f"{digest}.*.lease")) == []


@pytest.mark.anyio
async def test_marker_failure_does_not_prevent_rollback_or_mask_database_error(
    phase2_engine: sa.Engine,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import paper_import as paper_import_module
    from app.services.paper_download import DownloadedPdf
    from app.services.paper_import import PaperImportError, PaperImportService
    from app.services.paper_orphans import OrphanLifecycleError

    final_path = tmp_path / "papers" / f"{'c' * 64}.pdf"
    final_path.parent.mkdir()
    final_path.write_bytes(b"%PDF-orphan")

    async def downloader(*args: object, **kwargs: object) -> DownloadedPdf:
        return DownloadedPdf(
            final_path=final_path,
            sha256="c" * 64,
            file_size=11,
            page_count=1,
            extracted_text="text",
            parse_confidence=0.8,
            extraction_warning=None,
            fulltext_status="已读取全文",
        )

    def fail_marker(*args: object, **kwargs: object) -> None:
        raise OrphanLifecycleError("secret=/private/path")

    monkeypatch.setattr(
        paper_import_module,
        "retain_download_as_orphan",
        fail_marker,
    )
    fresh = _source_paper(
        pdf_url="https://oa.example.org/paper.pdf",
        is_open_access=True,
    )
    with Session(phase2_engine) as session:
        @sa.event.listens_for(session, "before_commit", once=True)
        def fail_commit(_session: Session) -> None:
            raise RuntimeError("SQL secret /private/path")

        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(fresh)},
                storage_dir=tmp_path / "papers",
                timeout_seconds=30,
                max_size_mb=50,
                downloader=downloader,
            ).import_paper("openalex", "W123", download_open_pdf=True)

        assert captured.value.code == "database_error"
        assert "private" not in str(captured.value)
        assert session.in_transaction() is False
        assert session.scalar(sa.select(sa.literal(1))) == 1


def test_stale_hash_lock_takeover_does_not_allow_old_owner_to_release_new_lock(
    tmp_path: Path,
) -> None:
    from app.services.paper_orphans import (
        OrphanLifecycleError,
        _acquire_hash_lock,
        _lock_path,
    )

    storage = tmp_path / "papers"
    digest = "d" * 64
    old_lock = _acquire_hash_lock(
        storage,
        digest,
        wait=False,
        now=1_000.0,
        stale_seconds=7_200,
    )
    assert old_lock is not None
    new_lock = _acquire_hash_lock(
        storage,
        digest,
        wait=False,
        now=10_000.0,
        stale_seconds=7_200,
    )
    assert new_lock is not None
    assert new_lock.reclaimed_stale is True

    with pytest.raises(OrphanLifecycleError):
        old_lock.release()

    payload = json.loads(_lock_path(storage, digest).read_text(encoding="utf-8"))
    assert payload["owner_token"] == new_lock.owner_token
    new_lock.release()
    assert _lock_path(storage, digest).exists() is False


def test_custom_download_claim_failure_keeps_discoverable_orphan_marker(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.services import paper_orphans
    from app.services.paper_orphans import (
        OrphanLifecycleError,
        claim_downloaded_pdf,
        orphan_marker_path,
    )

    storage = tmp_path / "papers"
    digest = "e" * 64

    def fail_lease(*args: object, **kwargs: object) -> None:
        raise OrphanLifecycleError("lease write failed")

    monkeypatch.setattr(paper_orphans, "_write_lease_unlocked", fail_lease)
    with pytest.raises(OrphanLifecycleError):
        claim_downloaded_pdf(storage, digest, created_at=1_000.0)

    assert orphan_marker_path(storage, digest).exists()
    assert list((storage / ".paper-orphans").glob(f"{digest}.*.lease")) == []


@pytest.mark.parametrize(
    ("keyword", "invalid_value"),
    [
        ("now", float("nan")),
        ("now", float("inf")),
        ("grace_period_seconds", float("nan")),
        ("grace_period_seconds", float("inf")),
        ("lease_stale_seconds", float("nan")),
        ("lease_stale_seconds", float("inf")),
        ("lock_stale_seconds", float("nan")),
        ("lock_stale_seconds", float("inf")),
    ],
)
def test_orphan_cleanup_rejects_non_finite_time_controls(
    phase2_engine: sa.Engine,
    tmp_path: Path,
    keyword: str,
    invalid_value: float,
) -> None:
    from app.services.paper_orphans import (
        OrphanLifecycleError,
        cleanup_orphaned_pdfs,
    )

    arguments: dict[str, float] = {
        "grace_period_seconds": 300.0,
        "lease_stale_seconds": 7_200.0,
        "lock_stale_seconds": 7_200.0,
        "now": 10_000.0,
    }
    arguments[keyword] = invalid_value
    with pytest.raises(OrphanLifecycleError):
        cleanup_orphaned_pdfs(
            tmp_path / "papers",
            sessionmaker(bind=phase2_engine),
            **arguments,
        )


def test_cleanup_cannot_delete_file_while_commit_guard_holds_hash_lock(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_orphans import (
        claim_downloaded_pdf,
        cleanup_orphaned_pdfs,
        download_lease_guard,
        orphan_marker_path,
    )

    storage = tmp_path / "papers"
    storage.mkdir()
    digest = "f" * 64
    final_path = storage / f"{digest}.pdf"
    final_path.write_bytes(b"%PDF-commit-race")
    lease_id = claim_downloaded_pdf(storage, digest, created_at=1_000.0)

    with download_lease_guard(
        storage,
        digest,
        lease_id,
        now=2_000.0,
    ) as guard:
        cleanup = cleanup_orphaned_pdfs(
            storage,
            sessionmaker(bind=phase2_engine),
            grace_period_seconds=0,
            lease_stale_seconds=1,
            lock_stale_seconds=7_200,
            now=2_001.0,
        )
        assert cleanup.retained_locked == 1
        assert final_path.exists()

        with Session(phase2_engine) as session:
            session.add(
                Paper(
                    title="Commit guard winner",
                    file_path=str(final_path),
                    file_hash=digest,
                    file_size=16,
                    acquisition_status="fulltext",
                )
            )
            session.commit()
        guard.adopt()

    assert final_path.exists()
    assert orphan_marker_path(storage, digest).exists() is False


@pytest.mark.anyio
async def test_import_lost_download_lease_fails_before_database_commit(
    phase2_engine: sa.Engine,
    tmp_path: Path,
) -> None:
    from app.models import Paper
    from app.services.paper_download import DownloadedPdf
    from app.services.paper_import import PaperImportError, PaperImportService
    from app.services.paper_orphans import (
        claim_downloaded_pdf,
        release_download_lease,
    )

    storage = tmp_path / "papers"
    storage.mkdir()
    digest = "1" * 64
    final_path = storage / f"{digest}.pdf"
    final_path.write_bytes(b"%PDF-lost-lease")
    lease_id = claim_downloaded_pdf(storage, digest)
    release_download_lease(storage, digest, lease_id)

    async def downloader(*args: object, **kwargs: object) -> DownloadedPdf:
        return DownloadedPdf(
            final_path=final_path,
            sha256=digest,
            file_size=15,
            page_count=1,
            extracted_text="lost lease",
            parse_confidence=0.8,
            extraction_warning=None,
            fulltext_status="已读取全文",
            lease_id=lease_id,
        )

    fresh = _source_paper(
        pdf_url="https://oa.example.org/paper.pdf",
        is_open_access=True,
    )
    with Session(phase2_engine) as session:
        with pytest.raises(PaperImportError) as captured:
            await PaperImportService(
                session=session,
                sources={"openalex": _FreshSource(fresh)},
                storage_dir=storage,
                timeout_seconds=30,
                max_size_mb=50,
                downloader=downloader,
            ).import_paper("openalex", "W123", download_open_pdf=True)

    with Session(phase2_engine) as verification:
        assert verification.scalar(sa.select(sa.func.count(Paper.id))) == 0
    assert captured.value.code == "storage_lifecycle_error"
