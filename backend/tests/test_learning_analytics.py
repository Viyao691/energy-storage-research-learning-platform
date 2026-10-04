from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'learning-analytics.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("USER_TIMEZONE", "Asia/Shanghai")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def test_migration_0017_to_0018_preserves_data_and_adds_completion_schema(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    backend_root = Path(__file__).resolve().parents[1]
    url = f"sqlite:///{(tmp_path / 'migration-0018.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    from app.config import reset_settings_cache

    reset_settings_cache()
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", (backend_root / "alembic").as_posix())
    config.set_main_option("sqlalchemy.url", url)
    command.upgrade(config, "0017")
    engine = sa.create_engine(url)
    with engine.begin() as connection:
        connection.execute(
            sa.text(
                "INSERT INTO learning_packs "
                "(id,title,learning_goal,cards_status,quiz_status,cards_prompt_version,"
                "cards_schema_version,quiz_prompt_version,quiz_schema_version,provider,model_name,"
                "created_at,updated_at) VALUES "
                "(1,'历史学习包','','completed','completed','learning-cards-v1',"
                "'learning-cards-schema-v1','learning-quiz-v1','learning-quiz-schema-v1','','',"
                "CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
            )
        )
        connection.execute(
            sa.text(
                "INSERT INTO learning_cards "
                "(id,pack_id,concept,generated_content,content,importance,common_mistake,"
                "evidence_json,is_user_edited,mastery_status,position,created_at,updated_at) VALUES "
                "(1,1,'历史概念','旧内容','旧内容','','','[]',0,'学习中',1,"
                "CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
            )
        )
        connection.execute(
            sa.text(
                "INSERT INTO learning_review_states "
                "(id,pack_id,card_id,last_rating,next_review_date,review_count,lapse_count,is_paused,"
                "last_reviewed_at,created_at,updated_at) VALUES "
                "(1,1,1,'模糊','2026-08-20',3,1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
            )
        )
    command.upgrade(config, "head")

    inspector = sa.inspect(engine)
    assert {"lineage_id", "version_number", "lifecycle_status", "archived_at"}.issubset(
        {column["name"] for column in inspector.get_columns("learning_packs")}
    )
    assert "learning_review_events" in inspector.get_table_names()
    assert "accepted_answers_json" in {
        column["name"] for column in inspector.get_columns("learning_questions")
    }
    assert {
        "feedback_markdown",
        "feedback_provider",
        "feedback_model_name",
        "feedback_prompt_version",
        "feedback_evidence_status",
        "feedback_generated_at",
    }.issubset({column["name"] for column in inspector.get_columns("learning_attempts")})
    with engine.begin() as connection:
        migrated = connection.execute(
            sa.text(
                "SELECT lineage_id,version_number,lifecycle_status FROM learning_packs WHERE id=1"
            )
        ).one()
        assert migrated == ("legacy-pack-1", 1, "active")
        assert connection.execute(sa.text("SELECT COUNT(*) FROM learning_review_events")).scalar_one() == 0
        connection.execute(
            sa.text(
                "INSERT INTO learning_packs "
                "(id,title,learning_goal,cards_status,quiz_status,cards_prompt_version,cards_schema_version,"
                "quiz_prompt_version,quiz_schema_version,provider,model_name,lineage_id,version_number,"
                "lifecycle_status,created_at,updated_at) VALUES "
                "(2,'冲突包','','pending','pending','learning-cards-v1','learning-cards-schema-v1',"
                "'learning-quiz-v1','learning-quiz-schema-v1','','','legacy-pack-1',2,'draft',"
                "CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
            )
        )
        with pytest.raises(sa.exc.IntegrityError):
            connection.execute(
                sa.text("UPDATE learning_packs SET lifecycle_status='active' WHERE id=2")
            )
    engine.dispose()


def test_review_events_and_analytics_include_history_but_exclude_archived_current_work(
    client: TestClient,
) -> None:
    from app.models import (
        LearningAttempt,
        LearningCard,
        LearningPack,
        LearningPlan,
        LearningPlanTask,
        LearningQuestion,
        LearningWeakness,
    )

    today = date.today()
    with client.app.state.session_factory() as db:
        packs: list[LearningPack] = []
        cards: list[LearningCard] = []
        for index in range(2):
            pack = LearningPack(
                title=f"统计包 {index + 1}",
                learning_goal="统计",
                lineage_id=f"analytics-{index + 1}",
                lifecycle_status="active",
            )
            db.add(pack)
            db.flush()
            card = LearningCard(
                pack_id=pack.id,
                concept="共同薄弱概念",
                generated_content="内容",
                content="内容",
                evidence_json="[]",
                position=1,
            )
            db.add(card)
            db.flush()
            question = LearningQuestion(
                pack_id=pack.id,
                question_type="multiple_choice",
                prompt="测试题",
                correct_answer="A",
                position=1,
            )
            db.add(question)
            db.flush()
            db.add(LearningAttempt(question_id=question.id, answer="A", result="correct" if index == 0 else "wrong"))
            db.add(
                LearningWeakness(
                    pack_id=pack.id,
                    card_id=card.id,
                    concept="共同薄弱概念",
                    occurrence_count=2,
                    recurrence_count=index,
                )
            )
            plan = LearningPlan(
                pack_id=pack.id,
                start_date=today,
                end_date=today,
                weekdays_json=f"[{today.isoweekday()}]",
            )
            db.add(plan)
            db.flush()
            db.add(
                LearningPlanTask(
                    plan_id=plan.id,
                    task_date=today,
                    task_type="card",
                    card_id=card.id,
                    title="完成卡片",
                    position=1,
                    completed_at=datetime.utcnow(),
                )
            )
            packs.append(pack)
            cards.append(card)
        db.commit()
        pack_ids = [pack.id for pack in packs]
        card_ids = [card.id for card in cards]

    for card_id in card_ids:
        response = client.post(
            f"/api/v1/learning/cards/{card_id}/review", json={"rating": "不会"}
        )
        assert response.status_code == 200, response.text
        state_id = response.json()["state"]["id"]
        assert client.patch(
            f"/api/v1/learning/review-states/{state_id}",
            json={"next_review_date": str(today)},
        ).status_code == 200

    with client.app.state.session_factory() as db:
        archived = db.get(LearningPack, pack_ids[1])
        archived.lifecycle_status = "archived"
        archived.archived_at = datetime.utcnow()
        db.commit()
        assert db.execute(sa.text("SELECT COUNT(*) FROM learning_review_events")).scalar_one() == 2

    analytics = client.get("/api/v1/learning/analytics?days=7")
    assert analytics.status_code == 200, analytics.text
    body = analytics.json()
    assert body["days"] == 7
    assert len(body["daily"]) == 7
    assert body["daily"][-1]["reviews"] == 2
    assert body["daily"][-1]["attempts"] == 2
    assert body["daily"][-1]["completed_tasks"] == 2
    assert body["rating_distribution"]["不会"] == 2
    assert body["correct_rate"] == 0.5
    assert body["due_review_count"] == 1
    assert body["weaknesses"] == [
        {
            "concept": "共同薄弱概念",
            "score": 2.0,
            "pack_count": 1,
            "occurrence_count": 2,
            "recurrence_count": 0,
        }
    ]
    assert body["history_start_date"] == str(today)

    queue = client.get("/api/v1/learning/review-queue")
    assert queue.status_code == 200
    assert [item["card"]["id"] for item in queue.json()["items"]] == [card_ids[0]]
    assert client.post(
        f"/api/v1/learning/cards/{card_ids[1]}/review", json={"rating": "模糊"}
    ).status_code == 409
    assert client.get("/api/v1/learning/analytics?days=8").status_code == 422
