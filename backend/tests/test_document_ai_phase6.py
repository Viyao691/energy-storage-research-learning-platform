from __future__ import annotations

from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'phase6.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def test_migration_0018_to_0019_preserves_paper_without_fake_ocr_history(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    backend_root = Path(__file__).resolve().parents[1]
    url = f"sqlite:///{(tmp_path / 'migration-0019.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    from app.config import reset_settings_cache

    reset_settings_cache()
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", (backend_root / "alembic").as_posix())
    config.set_main_option("sqlalchemy.url", url)
    command.upgrade(config, "0018")
    engine = sa.create_engine(url)
    with engine.begin() as connection:
        connection.execute(
            sa.text(
                "INSERT INTO papers (id,title,file_size,page_count,extracted_text,parse_confidence,"
                "fulltext_status,normalized_title,authors_json,abstract,journal,keywords_json,"
                "landing_url,oa_status,source_type,acquisition_status,article_type,is_favorite,is_read,created_at) "
                "VALUES (1,'legacy',10,1,'legacy text',0.8,'已读取全文','legacy','[]','','','[]','',"
                "'unknown','upload','fulltext','',0,0,CURRENT_TIMESTAMP)"
            )
        )
    command.upgrade(config, "head")

    inspector = sa.inspect(engine)
    assert {
        "paper_parse_runs",
        "paper_page_extractions",
        "scientific_datasets",
        "scientific_analysis_runs",
    }.issubset(inspector.get_table_names())
    assert {"document_vision_provider", "document_vision_model", "document_vision_base_url"}.issubset(
        {column["name"] for column in inspector.get_columns("user_settings")}
    )
    with engine.connect() as connection:
        assert connection.execute(sa.text("SELECT extracted_text FROM papers WHERE id=1")).scalar_one() == "legacy text"
        assert connection.execute(sa.text("SELECT COUNT(*) FROM paper_parse_runs")).scalar_one() == 0
        assert connection.execute(sa.text("SELECT COUNT(*) FROM paper_page_extractions")).scalar_one() == 0
    engine.dispose()


def test_document_ai_status_and_model_install_require_explicit_confirmation(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    manager = client.app.state.document_ai_manager

    def fake_install() -> None:
        manager.install_call_count += 1
        manager._install_status = "installing"

    monkeypatch.setattr(manager, "install_models", fake_install)
    status = client.get("/api/v1/document-ai/status")
    assert status.status_code == 200
    assert status.json()["local_model"]["installed"] is False
    assert status.json()["capabilities"]["cpu"] is True
    assert status.json()["current_task"] is None

    denied = client.post("/api/v1/document-ai/models/install", json={"confirmed": False})
    assert denied.status_code == 422
    assert client.app.state.document_ai_manager.install_call_count == 0

    accepted = client.post("/api/v1/document-ai/models/install", json={"confirmed": True})
    assert accepted.status_code == 202
    assert accepted.json()["status"] in {"installing", "installed"}
    assert client.app.state.document_ai_manager.install_call_count == 1


def test_migration_0022_to_0023_adds_docling_evidence_provenance(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    backend_root = Path(__file__).resolve().parents[1]
    url = f"sqlite:///{(tmp_path / 'migration-0023.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    from app.config import reset_settings_cache

    reset_settings_cache()
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", (backend_root / "alembic").as_posix())
    config.set_main_option("sqlalchemy.url", url)
    command.upgrade(config, "0022")
    command.upgrade(config, "head")

    engine = sa.create_engine(url)
    inspector = sa.inspect(engine)
    assert {
        "engine_version",
        "comparison_viewed_at",
        "comparison_active_parse_run_id",
    }.issubset({
        column["name"] for column in inspector.get_columns("paper_parse_runs")
    })
    assert {"page_width", "page_height"}.issubset(
        {column["name"] for column in inspector.get_columns("paper_page_extractions")}
    )
    assert {"parse_run_id", "source_locations_json"}.issubset(
        {column["name"] for column in inspector.get_columns("paper_chunks")}
    )
    assert "ix_paper_chunks_parse_run_id" in {
        index["name"] for index in inspector.get_indexes("paper_chunks")
    }
    engine.dispose()


def test_document_vision_configuration_uses_independent_masked_secret(client: TestClient) -> None:
    response = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "mock",
            "model_name": "mock-energy-research-v1",
            "vision_model": "",
            "model_base_url": "https://api.openai.com/v1",
            "timeout_seconds": 60,
            "backup_model": "",
            "paper_budget": 1,
            "daily_budget": 5,
            "monthly_budget": 50,
            "document_vision_provider": "openai-compatible",
            "document_vision_model": "vision-research-v1",
            "document_vision_base_url": "https://vision.example/v1",
            "document_vision_timeout_seconds": 90,
            "document_vision_api_key": "document-secret-2468",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["document_vision_api_key"] == {"configured": True, "last4": "2468"}
    assert "document-secret-2468" not in response.text
    assert payload["api_key"]["configured"] is False
