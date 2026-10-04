from __future__ import annotations

from datetime import date
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from app.paper_analysis import REPORT_PROMPT_VERSIONS, REPORT_SCHEMA_VERSIONS


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'learning.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def _seed_paper(client: TestClient, *, title: str = "Layered oxide study", eligible: bool = True) -> int:
    from app.models import Analysis, Paper, PaperChunk

    with client.app.state.session_factory() as db:
        paper = Paper(
            title=title,
            original_filename="paper.pdf",
            file_path="paper.pdf",
            file_size=1200,
            page_count=4,
            extracted_text="Layered oxide full text with electrochemical evidence.",
            fulltext_status="已读取全文",
            acquisition_status="fulltext",
            is_read=eligible,
        )
        db.add(paper)
        db.flush()
        db.add(
            Analysis(
                paper_id=paper.id,
                summary="",
                plain_explanation="",
                deep_analysis="",
                quick_understanding="快速报告：研究钠层状氧化物的结构稳定性。" if eligible else "",
                quick_prompt_version=REPORT_PROMPT_VERSIONS["quick_understanding"] if eligible else "",
                quick_schema_version=REPORT_SCHEMA_VERSIONS["quick_understanding"] if eligible else "",
                quick_evidence_status="全文证据",
                layman_understanding="通俗报告：解释层间滑移。" if eligible else "",
                layman_prompt_version=REPORT_PROMPT_VERSIONS["layman_understanding"] if eligible else "",
                layman_schema_version=REPORT_SCHEMA_VERSIONS["layman_understanding"] if eligible else "",
                layman_evidence_status="全文证据",
                reviewer_analysis="审稿报告：机制需要多表征闭环。" if eligible else "",
                reviewer_prompt_version=REPORT_PROMPT_VERSIONS["reviewer_analysis"] if eligible else "",
                reviewer_schema_version=REPORT_SCHEMA_VERSIONS["reviewer_analysis"] if eligible else "",
                reviewer_evidence_status="全文证据",
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
                content="Operando diffraction shows suppressed slab gliding during cycling.",
                content_hash=f"hash-{paper.id}",
                source_scope="fulltext",
                parse_confidence=0.95,
                embedding_json="[]",
                embedding_model="test",
            )
        )
        db.commit()
        return paper.id


def _create_pack(client: TestClient, paper_id: int, title: str = "层状氧化物学习包") -> dict[str, object]:
    response = client.post(
        "/api/v1/learning/packs",
        json={"title": title, "learning_goal": "理解结构与性能关系", "paper_ids": [paper_id]},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_migration_from_0015_preserves_existing_paper_and_creates_eight_learning_tables(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    backend_root = Path(__file__).resolve().parents[1]
    database_path = tmp_path / "migration.db"
    url = f"sqlite:///{database_path.as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    from app.config import reset_settings_cache
    reset_settings_cache()
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", (backend_root / "alembic").as_posix())
    config.set_main_option("sqlalchemy.url", url)
    command.upgrade(config, "0015")
    engine = sa.create_engine(url)
    with engine.begin() as connection:
        connection.execute(sa.text("INSERT INTO papers (title, file_size, page_count, extracted_text, parse_confidence, fulltext_status, created_at, normalized_title, authors_json, abstract, journal, keywords_json, landing_url, oa_status, source_type, acquisition_status, article_type, is_favorite, is_read) VALUES ('历史论文', 1, 1, 'text', 1, '已读取全文', CURRENT_TIMESTAMP, '历史论文', '[]', '', '', '[]', '', 'unknown', 'upload', 'fulltext', '', 1, 1)"))
    command.upgrade(config, "head")
    tables = set(sa.inspect(engine).get_table_names())
    assert {
        "learning_packs", "learning_pack_sources", "learning_cards", "learning_questions",
        "learning_attempts", "learning_weaknesses", "learning_plans", "learning_plan_tasks",
    }.issubset(tables)
    with engine.connect() as connection:
        row = connection.execute(sa.text("SELECT title, is_favorite, is_read FROM papers")).one()
        assert row == ("历史论文", 1, 1)
    engine.dispose()


def test_eligible_papers_require_read_fulltext_and_current_analysis(client: TestClient) -> None:
    eligible_id = _seed_paper(client)
    _seed_paper(client, title="Not ready", eligible=False)

    response = client.get("/api/v1/learning/eligible-papers")

    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [eligible_id]
    assert response.json()["items"][0]["available_reports"] == [
        "reviewer_analysis", "layman_understanding", "quick_understanding"
    ]


def test_paper_candidates_explain_each_learning_eligibility_blocker(client: TestClient) -> None:
    from app.models import Paper

    eligible_id = _seed_paper(client, title="Ready")
    unread_id = _seed_paper(client, title="Unread")
    no_fulltext_id = _seed_paper(client, title="No fulltext")
    no_analysis_id = _seed_paper(client, title="No current analysis", eligible=False)
    with client.app.state.session_factory() as db:
        db.get(Paper, unread_id).is_read = False
        db.get(Paper, no_fulltext_id).acquisition_status = "metadata"
        db.get(Paper, no_analysis_id).is_read = True
        db.commit()

    response = client.get("/api/v1/learning/paper-candidates")

    assert response.status_code == 200
    items = {item["id"]: item for item in response.json()["items"]}
    assert items[eligible_id]["eligible"] is True
    assert items[eligible_id]["blocking_reasons"] == []
    assert items[unread_id]["blocking_reasons"] == ["尚未标记已读"]
    assert items[no_fulltext_id]["blocking_reasons"] == ["全文不可用"]
    assert items[no_analysis_id]["blocking_reasons"] == ["尚无当前版本解析"]
    assert items[eligible_id]["available_reports"] == [
        "reviewer_analysis", "layman_understanding", "quick_understanding"
    ]


def test_pack_validates_unique_one_to_five_sources_and_snapshots_versions(client: TestClient) -> None:
    paper_id = _seed_paper(client)
    duplicate = client.post(
        "/api/v1/learning/packs",
        json={"title": "重复", "paper_ids": [paper_id, paper_id]},
    )
    assert duplicate.status_code == 422

    pack = _create_pack(client, paper_id)
    detail = client.get(f"/api/v1/learning/packs/{pack['id']}").json()
    assert detail["sources"][0]["paper_title"] == "Layered oxide study"
    assert detail["sources"][0]["analysis_versions"]["reviewer_analysis"]["prompt_version"]
    assert detail["cards_prompt_version"] == "learning-cards-v1"
    assert detail["quiz_prompt_version"] == "learning-quiz-v2"


def test_two_stage_generation_persists_evidence_and_never_sets_mastery(client: TestClient) -> None:
    pack = _create_pack(client, _seed_paper(client))

    cards_response = client.post(f"/api/v1/learning/packs/{pack['id']}/generate-cards")
    assert cards_response.status_code == 200, cards_response.text
    cards = cards_response.json()["cards"]
    assert 8 <= len(cards) <= 16
    assert all(card["mastery_status"] == "未学习" for card in cards)
    assert cards[0]["evidence"][0]["page_number"] == 2
    assert cards[0]["evidence"][0]["paper_title"] == "Layered oxide study"

    quiz_response = client.post(f"/api/v1/learning/packs/{pack['id']}/generate-quiz")
    assert quiz_response.status_code == 200, quiz_response.text
    questions = quiz_response.json()["questions"]
    assert 4 <= len([q for q in questions if q["question_type"] == "multiple_choice"]) <= 6
    assert 2 <= len([q for q in questions if q["question_type"] == "true_false"]) <= 3
    assert 2 <= len([q for q in questions if q["question_type"] == "fill_blank"]) <= 3
    assert 3 <= len([q for q in questions if q["question_type"] == "short_answer"]) <= 4
    refreshed = client.get(f"/api/v1/learning/packs/{pack['id']}").json()
    assert all(card["mastery_status"] == "未学习" for card in refreshed["cards"])


def test_card_edit_keeps_generated_content_and_mastery_has_separate_manual_api(client: TestClient) -> None:
    pack = _create_pack(client, _seed_paper(client))
    card = client.post(f"/api/v1/learning/packs/{pack['id']}/generate-cards").json()["cards"][0]

    edited = client.patch(
        f"/api/v1/learning/cards/{card['id']}",
        json={"content": "我的补充解释"},
    )
    assert edited.status_code == 200
    assert edited.json()["generated_content"] == card["generated_content"]
    assert edited.json()["content"] == "我的补充解释"
    assert edited.json()["mastery_status"] == "未学习"

    mastered = client.patch(
        f"/api/v1/learning/cards/{card['id']}/mastery",
        json={"mastery_status": "已掌握"},
    )
    assert mastered.status_code == 200
    assert mastered.json()["mastery_status"] == "已掌握"
    assert mastered.json()["mastery_confirmed_at"] is not None


def test_answer_flows_record_weakness_without_changing_mastery_or_reopening_resolved(client: TestClient) -> None:
    pack = _create_pack(client, _seed_paper(client))
    client.post(f"/api/v1/learning/packs/{pack['id']}/generate-cards")
    questions = client.post(f"/api/v1/learning/packs/{pack['id']}/generate-quiz").json()["questions"]
    multiple_choice = next(item for item in questions if item["question_type"] == "multiple_choice")
    short_answer = next(item for item in questions if item["question_type"] == "short_answer")

    wrong = client.post(
        f"/api/v1/learning/questions/{multiple_choice['id']}/attempts",
        json={"answer": "Z"},
    )
    assert wrong.status_code == 201
    assert wrong.json()["result"] == "wrong"
    detail = client.get(f"/api/v1/learning/packs/{pack['id']}").json()
    weakness = detail["weaknesses"][0]
    assert all(card["mastery_status"] == "未学习" for card in detail["cards"])

    assert client.patch(f"/api/v1/learning/weaknesses/{weakness['id']}/resolve").status_code == 200
    client.post(
        f"/api/v1/learning/questions/{multiple_choice['id']}/attempts",
        json={"answer": "Z"},
    )
    repeated = client.get(f"/api/v1/learning/packs/{pack['id']}").json()["weaknesses"][0]
    assert repeated["is_resolved"] is True
    assert repeated["occurrence_count"] == 2
    assert repeated["recurrence_count"] == 1

    submitted = client.post(
        f"/api/v1/learning/questions/{short_answer['id']}/attempts",
        json={"answer": "我的回答"},
    )
    assert submitted.json()["result"] == "pending_self_review"
    rated = client.patch(
        f"/api/v1/learning/attempts/{submitted.json()['id']}/self-rating",
        json={"self_rating": "部分答对"},
    )
    assert rated.status_code == 200
    assert rated.json()["result"] == "partial"


def test_plan_manual_completion_replace_guard_and_exact_title_delete(client: TestClient) -> None:
    pack = _create_pack(client, _seed_paper(client))
    client.post(f"/api/v1/learning/packs/{pack['id']}/generate-cards")
    client.post(f"/api/v1/learning/packs/{pack['id']}/generate-quiz")
    weekday = date.today().isoweekday()
    plan = client.put(
        f"/api/v1/learning/packs/{pack['id']}/plan",
        json={"start_date": str(date.today()), "end_date": str(date.today()), "weekdays": [weekday]},
    )
    assert plan.status_code == 200, plan.text
    assert plan.json()["tasks"]
    task = plan.json()["tasks"][0]
    assert task["pack_id"] == pack["id"]
    completed = client.patch(
        f"/api/v1/learning/plan-tasks/{task['id']}", json={"completed": True}
    )
    assert completed.status_code == 200
    assert completed.json()["completed_at"] is not None
    replace = client.put(
        f"/api/v1/learning/packs/{pack['id']}/plan",
        json={"start_date": str(date.today()), "end_date": str(date.today()), "weekdays": [weekday]},
    )
    assert replace.status_code == 200
    preserved = next(item for item in replace.json()["tasks"] if item["id"] == task["id"])
    assert preserved["task_date"] == task["task_date"]
    assert preserved["position"] == task["position"]
    assert preserved["completed_at"] == completed.json()["completed_at"]

    wrong_title = client.request(
        "DELETE", f"/api/v1/learning/packs/{pack['id']}", json={"confirmation_title": "不匹配"}
    )
    assert wrong_title.status_code == 409
    deleted = client.request(
        "DELETE", f"/api/v1/learning/packs/{pack['id']}", json={"confirmation_title": "层状氧化物学习包"}
    )
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/learning/packs/{pack['id']}").status_code == 404
    assert client.get("/api/v1/papers").json()["total"] == 1
