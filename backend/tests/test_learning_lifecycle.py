from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.paper_analysis import REPORT_PROMPT_VERSIONS, REPORT_SCHEMA_VERSIONS


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'learning-lifecycle.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("USER_TIMEZONE", "Asia/Shanghai")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def _seed_paper(client: TestClient) -> int:
    from app.models import Analysis, Paper, PaperChunk

    with client.app.state.session_factory() as db:
        paper = Paper(
            title="Lifecycle sodium paper",
            original_filename="paper.pdf",
            file_path="paper.pdf",
            file_size=1200,
            page_count=4,
            extracted_text="PRIVATE_FULLTEXT_MARKER layered oxide full text.",
            fulltext_status="已读取全文",
            acquisition_status="fulltext",
            is_read=True,
        )
        db.add(paper)
        db.flush()
        db.add(
            Analysis(
                paper_id=paper.id,
                summary="",
                plain_explanation="",
                deep_analysis="",
                quick_understanding="快速报告 v1",
                quick_prompt_version=REPORT_PROMPT_VERSIONS["quick_understanding"],
                quick_schema_version=REPORT_SCHEMA_VERSIONS["quick_understanding"],
                quick_evidence_status="全文证据",
                evidence_status="全文证据",
                provider="mock",
                model_name="mock-research-copilot",
            )
        )
        db.add(
            PaperChunk(
                paper_id=paper.id,
                page_number=2,
                chunk_index=0,
                section="Results",
                content="Snapshot evidence only.",
                content_hash="lifecycle-hash",
                source_scope="fulltext",
                parse_confidence=0.95,
                embedding_json="[]",
                embedding_model="test",
            )
        )
        db.commit()
        return paper.id


def test_version_activation_comparison_export_and_archived_read_only(client: TestClient) -> None:
    from app.models import Analysis, Paper

    paper_id = _seed_paper(client)
    created = client.post(
        "/api/v1/learning/packs",
        json={"title": "钠电学习包", "learning_goal": "理解结构", "paper_ids": [paper_id]},
    )
    assert created.status_code == 201, created.text
    original = created.json()
    assert original["version_number"] == 1
    assert original["lifecycle_status"] == "active"
    assert client.post(f"/api/v1/learning/packs/{original['id']}/generate-cards").status_code == 200
    assert client.post(f"/api/v1/learning/packs/{original['id']}/generate-quiz").status_code == 200
    detail = client.get(f"/api/v1/learning/packs/{original['id']}").json()
    assert client.post(
        f"/api/v1/learning/cards/{detail['cards'][0]['id']}/review",
        json={"rating": "模糊"},
    ).status_code == 200
    assert client.post(
        f"/api/v1/learning/questions/{detail['questions'][0]['id']}/attempts",
        json={"answer": "A"},
    ).status_code == 201

    with client.app.state.session_factory() as db:
        analysis = db.query(Analysis).filter(Analysis.paper_id == paper_id).one()
        analysis.quick_understanding = "快速报告 v2"
        db.commit()

    version = client.post(f"/api/v1/learning/packs/{original['id']}/versions")
    assert version.status_code == 201, version.text
    draft = version.json()
    assert draft["lineage_id"] == original["lineage_id"]
    assert draft["version_number"] == 2
    assert draft["lifecycle_status"] == "draft"
    assert draft["quiz_prompt_version"] == "learning-quiz-v2"
    assert draft["sources"][0]["analysis_hash"] != original["sources"][0]["analysis_hash"]

    versions = client.get(f"/api/v1/learning/packs/{draft['id']}/versions")
    assert versions.status_code == 200
    assert [(item["version_number"], item["lifecycle_status"]) for item in versions.json()["items"]] == [
        (2, "draft"),
        (1, "active"),
    ]
    comparison = client.get(
        f"/api/v1/learning/pack-comparisons?left_pack_id={original['id']}&right_pack_id={draft['id']}"
    )
    assert comparison.status_code == 200, comparison.text
    assert comparison.json()["source_changes"]["changed"] == ["Lifecycle sodium paper"]
    assert comparison.json()["cards"]["removed"]

    activated = client.post(f"/api/v1/learning/packs/{draft['id']}/activate")
    assert activated.status_code == 200, activated.text
    assert activated.json()["lifecycle_status"] == "active"
    assert client.get(f"/api/v1/learning/packs/{original['id']}").json()["lifecycle_status"] == "archived"
    assert client.patch(
        f"/api/v1/learning/cards/{detail['cards'][0]['id']}", json={"concept": "不应修改"}
    ).status_code == 409
    overview = client.get("/api/v1/learning/overview").json()
    assert [pack["id"] for pack in overview["packs"]] == [draft["id"]]

    exported_json = client.get(f"/api/v1/learning/packs/{original['id']}/export?format=json")
    assert exported_json.status_code == 200
    assert exported_json.headers["content-disposition"].endswith(
        f'filename="learning-pack-{original["id"]}-v1.json"'
    )
    payload = exported_json.json()
    assert payload["version"]["lifecycle_status"] == "archived"
    assert payload["review_events"][0]["rating"] == "模糊"
    assert payload["questions"][0]["attempts"]
    assert "PRIVATE_FULLTEXT_MARKER" not in exported_json.text
    assert "api_key" not in exported_json.text.lower()

    exported_markdown = client.get(
        f"/api/v1/learning/packs/{original['id']}/export?format=markdown"
    )
    assert exported_markdown.status_code == 200
    assert "# 钠电学习包" in exported_markdown.text
    assert "## 知识卡片" in exported_markdown.text
    assert "PRIVATE_FULLTEXT_MARKER" not in exported_markdown.text

    assert client.post(f"/api/v1/learning/packs/{draft['id']}/archive").status_code == 200
    assert client.get("/api/v1/learning/packs?status=active").json()["items"] == []
    assert client.get("/api/v1/learning/packs?status=archived").status_code == 200

    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        db.delete(paper)
        db.commit()
    unavailable = client.post(f"/api/v1/learning/packs/{draft['id']}/versions")
    assert unavailable.status_code == 409


def test_comparison_requires_same_lineage(client: TestClient) -> None:
    from app.models import LearningPack

    with client.app.state.session_factory() as db:
        left = LearningPack(title="A", lineage_id="a")
        right = LearningPack(title="B", lineage_id="b")
        db.add_all([left, right])
        db.commit()
        left_id, right_id = left.id, right.id
    response = client.get(
        f"/api/v1/learning/pack-comparisons?left_pack_id={left_id}&right_pack_id={right_id}"
    )
    assert response.status_code == 422
