from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect
import fitz


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'contest.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def test_0020_creates_contest_workspace_tables(client: TestClient) -> None:
    tables = set(inspect(client.app.state.engine).get_table_names())
    assert {
        "contest_projects",
        "contest_sources",
        "contest_rules",
        "contest_rubric_items",
        "contest_milestones",
        "contest_rubric_checks",
        "contest_defense_sessions",
        "contest_defense_turns",
    }.issubset(tables)


def test_multiple_projects_structured_content_and_safe_delete(client: TestClient) -> None:
    first = client.post(
        "/api/v1/contests",
        json={"title": "钠离子电池创新项目", "competition_name": "挑战杯"},
    )
    second = client.post(
        "/api/v1/contests",
        json={"title": "储能安全项目", "competition_name": "大创"},
    )
    assert first.status_code == second.status_code == 201
    project_id = first.json()["id"]

    updated = client.patch(
        f"/api/v1/contests/{project_id}",
        json={
            "summary": "面向低温储能的钠离子体系。",
            "research_question": "如何兼顾低温倍率与循环稳定性？",
            "innovation": "结构与电解液协同设计。",
            "method": "材料制备、结构表征和电化学验证。",
            "evidence": "关联论文和已确认数据集。",
            "feasibility": "已有设备与前期数据。",
            "expected_outcomes": "论文与样品。",
            "risks": "低温界面阻抗升高。",
            "resources": "单人负责实验、分析与答辩。",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["research_question"].startswith("如何")
    assert len(client.get("/api/v1/contests").json()["items"]) == 2

    wrong = client.request(
        "DELETE",
        f"/api/v1/contests/{project_id}",
        json={"confirmation_title": "错误标题"},
    )
    assert wrong.status_code == 409
    deleted = client.request(
        "DELETE",
        f"/api/v1/contests/{project_id}",
        json={"confirmation_title": "钠离子电池创新项目"},
    )
    assert deleted.status_code == 204


def test_rule_evidence_confirmation_timeline_rubric_and_text_defense(
    client: TestClient,
) -> None:
    project = client.post(
        "/api/v1/contests",
        json={"title": "证据项目", "competition_name": "互联网+"},
    ).json()
    project_id = project["id"]
    source = client.post(
        f"/api/v1/contests/{project_id}/sources/text",
        json={
            "name": "竞赛通知.txt",
            "source_type": "text",
            "content": "申报截止日期为2026-10-20。创新性40分，可行性30分，答辩30分。",
        },
    )
    assert source.status_code == 201
    assert source.json()["sha256"]
    assert source.json()["locator_count"] >= 1

    parsed = client.post(f"/api/v1/contests/{project_id}/rules/parse")
    assert parsed.status_code == 201
    body = parsed.json()
    assert body["status"] == "draft"
    assert body["rules"][0]["citations"] == ["S1"]
    assert body["rubric_items"]

    before = client.post(f"/api/v1/contests/{project_id}/timeline/generate")
    assert before.status_code == 409
    confirmed = client.post(
        f"/api/v1/contests/{project_id}/rules/confirm",
        json={"confirmed": True},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "confirmed"

    milestone = client.post(
        f"/api/v1/contests/{project_id}/milestones",
        json={"title": "完成关键对照实验", "due_date": "2026-09-20"},
    )
    assert milestone.status_code == 201
    timeline = client.post(f"/api/v1/contests/{project_id}/timeline/generate")
    assert timeline.status_code == 200
    assert [item["due_date"] for item in timeline.json()["items"]] == sorted(
        item["due_date"] for item in timeline.json()["items"]
    )

    check = client.post(f"/api/v1/contests/{project_id}/rubric/check")
    assert check.status_code == 201
    assert {item["status"] for item in check.json()["items"]} <= {
        "satisfied",
        "partial",
        "missing",
    }
    assert all("evidence" in item and "questions" in item for item in check.json()["items"])

    session = client.post(
        f"/api/v1/contests/{project_id}/defense-sessions",
        json={"mode": "text"},
    )
    assert session.status_code == 201
    turn = client.post(
        f"/api/v1/contest-defense-sessions/{session.json()['id']}/turns",
        json={"answer": "我们的创新点来自结构与界面协同，并由对照组验证。"},
    )
    assert turn.status_code == 201
    assert turn.json()["question"]
    assert "Mock" in turn.json()["feedback"]

    voice_session = client.post(
        f"/api/v1/contests/{project_id}/defense-sessions",
        json={"mode": "voice"},
    ).json()
    unavailable = client.post(
        f"/api/v1/contest-defense-sessions/{voice_session['id']}/audio",
        files={"file": ("answer.wav", b"RIFF" + b"\0" * 40, "audio/wav")},
    )
    assert unavailable.status_code == 409
    assert "Whisper" in unavailable.json()["detail"]


def test_pdf_csv_and_image_sources_are_safe_and_traceable(client: TestClient) -> None:
    project_id = client.post("/api/v1/contests", json={"title": "来源测试"}).json()["id"]
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), "Deadline 2026-10-20")
    pdf_bytes = document.tobytes()
    document.close()

    pdf = client.post(
        f"/api/v1/contests/{project_id}/sources/upload",
        files={"file": ("rules.pdf", pdf_bytes, "application/pdf")},
    )
    assert pdf.status_code == 201
    assert pdf.json()["source_type"] == "pdf"
    assert pdf.json()["locator_count"] == 1

    csv_source = client.post(
        f"/api/v1/contests/{project_id}/sources/upload",
        files={"file": ("rubric.csv", "评分项,分值\n创新性,40\n".encode("gb18030"), "text/csv")},
    )
    assert csv_source.status_code == 201
    assert csv_source.json()["source_type"] == "csv"
    assert csv_source.json()["locator_count"] == 2

    png = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000000020001e221bc330000000049454e44ae426082")
    image = client.post(
        f"/api/v1/contests/{project_id}/sources/upload",
        files={"file": ("notice.png", png, "image/png")},
    )
    assert image.status_code == 201
    assert image.json()["source_type"] == "image"
    assert image.json()["status"] in {"ready", "pending_ocr"}

    fake_pdf = client.post(
        f"/api/v1/contests/{project_id}/sources/upload",
        files={"file": ("fake.pdf", b"not-a-pdf", "application/pdf")},
    )
    assert fake_pdf.status_code == 400
    duplicate = client.post(
        f"/api/v1/contests/{project_id}/sources/upload",
        files={"file": ("rules-copy.pdf", pdf_bytes, "application/pdf")},
    )
    assert duplicate.status_code == 409
