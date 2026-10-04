from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.paper_analysis import REPORT_PROMPT_VERSIONS, REPORT_SCHEMA_VERSIONS


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'learning-assessment.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("USER_TIMEZONE", "Asia/Shanghai")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def _create_pack(client: TestClient, title: str = "四题型学习包") -> dict[str, object]:
    from app.models import Analysis, Paper, PaperChunk

    with client.app.state.session_factory() as db:
        paper = Paper(
            title=f"{title}论文",
            original_filename="quiz.pdf",
            file_path="quiz.pdf",
            file_size=100,
            page_count=2,
            extracted_text="quiz evidence full text",
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
                quick_understanding="结构与证据边界报告",
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
                page_number=1,
                chunk_index=0,
                section="Results",
                content="Evidence boundary snapshot.",
                content_hash=f"quiz-{paper.id}",
                source_scope="fulltext",
                parse_confidence=1,
                embedding_json="[]",
                embedding_model="test",
            )
        )
        db.commit()
        paper_id = paper.id
    response = client.post(
        "/api/v1/learning/packs",
        json={"title": title, "learning_goal": "覆盖四种题型", "paper_ids": [paper_id]},
    )
    assert response.status_code == 201, response.text
    pack = response.json()
    assert client.post(f"/api/v1/learning/packs/{pack['id']}/generate-cards").status_code == 200
    return pack


def test_quiz_v2_four_types_grading_normalization_and_v1_compatibility(client: TestClient) -> None:
    from app.models import LearningPack

    pack = _create_pack(client)
    assert pack["quiz_prompt_version"] == "learning-quiz-v2"
    generated = client.post(f"/api/v1/learning/packs/{pack['id']}/generate-quiz")
    assert generated.status_code == 200, generated.text
    questions = generated.json()["questions"]
    counts = {
        kind: sum(question["question_type"] == kind for question in questions)
        for kind in ("multiple_choice", "true_false", "fill_blank", "short_answer")
    }
    assert 4 <= counts["multiple_choice"] <= 6
    assert 2 <= counts["true_false"] <= 3
    assert 2 <= counts["fill_blank"] <= 3
    assert 3 <= counts["short_answer"] <= 4

    true_false = next(question for question in questions if question["question_type"] == "true_false")
    true_attempt = client.post(
        f"/api/v1/learning/questions/{true_false['id']}/attempts", json={"answer": "错误"}
    )
    assert true_attempt.status_code == 201
    assert true_attempt.json()["result"] == "correct"

    fill = next(question for question in questions if question["question_type"] == "fill_blank")
    normalized = client.post(
        f"/api/v1/learning/questions/{fill['id']}/attempts",
        json={"answer": "  ＣＬＡＩＭ　 evidence  "},
    )
    assert normalized.status_code == 201
    assert normalized.json()["result"] == "correct"
    pending = client.post(
        f"/api/v1/learning/questions/{fill['id']}/attempts", json={"answer": "另一种合理表述"}
    )
    assert pending.status_code == 201
    assert pending.json()["result"] == "pending_self_review"
    rated = client.patch(
        f"/api/v1/learning/attempts/{pending.json()['id']}/self-rating",
        json={"self_rating": "部分答对"},
    )
    assert rated.status_code == 200
    assert rated.json()["result"] == "partial"

    legacy = _create_pack(client, "旧协议学习包")
    with client.app.state.session_factory() as db:
        legacy_pack = db.get(LearningPack, legacy["id"])
        legacy_pack.quiz_prompt_version = "learning-quiz-v1"
        legacy_pack.quiz_schema_version = "learning-quiz-schema-v1"
        db.commit()
    legacy_quiz = client.post(f"/api/v1/learning/packs/{legacy['id']}/generate-quiz")
    assert legacy_quiz.status_code == 200, legacy_quiz.text
    legacy_types = [item["question_type"] for item in legacy_quiz.json()["questions"]]
    assert 6 <= legacy_types.count("multiple_choice") <= 10
    assert 4 <= legacy_types.count("short_answer") <= 6
    assert not ({"true_false", "fill_blank"} & set(legacy_types))


def test_complete_order_validation_and_plan_reflow_preserve_completed_tasks(client: TestClient) -> None:
    pack = _create_pack(client, "排序学习包")
    assert client.post(f"/api/v1/learning/packs/{pack['id']}/generate-quiz").status_code == 200
    detail = client.get(f"/api/v1/learning/packs/{pack['id']}").json()
    card_ids = [item["id"] for item in detail["cards"]]
    question_ids = [item["id"] for item in detail["questions"]]

    cards_ordered = client.patch(
        f"/api/v1/learning/packs/{pack['id']}/cards/order", json={"ids": list(reversed(card_ids))}
    )
    assert cards_ordered.status_code == 200, cards_ordered.text
    assert [item["id"] for item in cards_ordered.json()["items"]] == list(reversed(card_ids))
    assert client.patch(
        f"/api/v1/learning/packs/{pack['id']}/cards/order", json={"ids": card_ids[:-1]}
    ).status_code == 422
    assert client.patch(
        f"/api/v1/learning/packs/{pack['id']}/questions/order",
        json={"ids": [question_ids[0], question_ids[0], *question_ids[2:]]},
    ).status_code == 422

    today = date.today()
    end = today + timedelta(days=6)
    plan = client.put(
        f"/api/v1/learning/packs/{pack['id']}/plan",
        json={"start_date": str(today), "end_date": str(end), "weekdays": [1, 2, 3, 4, 5, 6, 7]},
    )
    assert plan.status_code == 200, plan.text
    completed = plan.json()["tasks"][1]
    assert client.patch(
        f"/api/v1/learning/plan-tasks/{completed['id']}", json={"completed": True}
    ).status_code == 200
    before = client.get(f"/api/v1/learning/packs/{pack['id']}").json()["plan"]
    completed_before = next(item for item in before["tasks"] if item["id"] == completed["id"])
    incomplete_ids = [item["id"] for item in before["tasks"] if item["completed_at"] is None]
    ordered = client.patch(
        f"/api/v1/learning/packs/{pack['id']}/plan/tasks/order",
        json={"ids": list(reversed(incomplete_ids))},
    )
    assert ordered.status_code == 200, ordered.text
    completed_after_order = next(
        item for item in ordered.json()["items"] if item["id"] == completed["id"]
    )
    assert completed_after_order == completed_before

    new_start = today + timedelta(days=7)
    new_end = new_start + timedelta(days=6)
    reflowed = client.put(
        f"/api/v1/learning/packs/{pack['id']}/plan",
        json={
            "start_date": str(new_start),
            "end_date": str(new_end),
            "weekdays": [1, 2, 3, 4, 5, 6, 7],
        },
    )
    assert reflowed.status_code == 200, reflowed.text
    completed_after = next(
        item for item in reflowed.json()["tasks"] if item["id"] == completed["id"]
    )
    assert completed_after == completed_before
    assert all(
        new_start <= date.fromisoformat(item["task_date"]) <= new_end
        for item in reflowed.json()["tasks"]
        if item["completed_at"] is None
    )
