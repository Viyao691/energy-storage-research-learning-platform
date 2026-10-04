from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'collections.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def test_paper_collection_counts_are_global_across_filtered_pages(client: TestClient) -> None:
    from app.models import Paper

    with client.app.state.session_factory() as db:
        for index, (favorite, read) in enumerate([(False, False), (True, False), (False, True), (True, True)]):
            db.add(Paper(title=f"paper-{index}", file_size=1, page_count=1, is_favorite=favorite, is_read=read))
        db.commit()

    expected = {"all": 4, "favorites": 2, "read": 2, "unread": 2}
    for collection, total in expected.items():
        response = client.get("/api/v1/papers", params={"collection": collection, "page": 2, "page_size": 1})
        assert response.status_code == 200
        body = response.json()
        assert body["collection_counts"] == expected
        assert body["total"] == total
        assert len(body["items"]) == 1
    assert client.get("/api/v1/papers").json()["total"] == 4
    assert client.get("/api/v1/papers", params={"collection": "other"}).status_code == 422


def test_dataset_state_persists_without_changing_confirmation(client: TestClient) -> None:
    from app.models import ScientificDataset

    columns = {column["name"] for column in inspect(client.app.state.engine).get_columns("scientific_datasets")}
    assert {"is_favorite", "is_read"}.issubset(columns)
    with client.app.state.session_factory() as db:
        dataset = ScientificDataset(name="capacity", source_type="user_import", domain="general", dataset_type="table", confirmation_status="pending")
        db.add(dataset)
        db.commit()
        dataset_id = dataset.id

    path = f"/api/v1/scientific-datasets/{dataset_id}/state"
    assert client.get("/api/v1/scientific-datasets").json()["items"][0]["is_favorite"] is False
    response = client.patch(path, json={"is_favorite": True, "is_read": True})
    assert response.status_code == 200
    assert response.json()["is_favorite"] is True
    assert response.json()["is_read"] is True
    assert response.json()["confirmation_status"] == "pending"
    assert response.json()["revision_count"] == 0
    listed = client.get("/api/v1/scientific-datasets").json()["items"][0]
    assert (listed["is_favorite"], listed["is_read"]) == (True, True)
    assert client.patch(path, json={"is_favorite": "yes", "is_read": True}).status_code == 422
    assert client.patch("/api/v1/scientific-datasets/999999/state", json={"is_favorite": True, "is_read": True}).status_code == 404


def test_0027_preserves_existing_dataset_confirmation_and_defaults(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    from alembic import command
    from alembic.config import Config
    from app.config import reset_settings_cache

    url = f"sqlite:///{tmp_path / 'preexisting.db'}"
    monkeypatch.setenv("DATABASE_URL", url)
    reset_settings_cache()
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "0026")
    engine = create_engine(url)
    with engine.begin() as connection:
        connection.execute(text("""
            INSERT INTO scientific_datasets
              (name, source_type, domain, dataset_type, confirmation_status, created_at, updated_at)
            VALUES ('old row', 'user_import', 'general', 'table', 'confirmed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """))
    command.upgrade(config, "0027")
    with engine.connect() as connection:
        row = connection.execute(text("SELECT is_favorite, is_read, confirmation_status FROM scientific_datasets WHERE name = 'old row'")).one()
    assert tuple(row) == (0, 0, "confirmed")
    engine.dispose()
    reset_settings_cache()
