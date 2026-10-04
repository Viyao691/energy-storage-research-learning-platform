from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path
from types import SimpleNamespace

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import ValidationError


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'learning-review.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("USER_TIMEZONE", "Asia/Shanghai")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


@pytest.fixture()
def seed_cards(client: TestClient):
    from app.models import LearningCard, LearningPack

    def seed(count: int = 1, *, title: str = "复习测试包") -> tuple[dict[str, object], list[dict[str, object]]]:
        with client.app.state.session_factory() as db:
            pack = LearningPack(title=title, learning_goal="验证复习闭环")
            db.add(pack)
            db.flush()
            cards: list[LearningCard] = []
            for position in range(1, count + 1):
                card = LearningCard(
                    pack_id=pack.id,
                    concept=f"概念 {position}",
                    generated_content=f"生成内容 {position}",
                    content=f"卡片内容 {position}",
                    importance="重要性",
                    common_mistake="易错点",
                    evidence_json=(
                        '[{"evidence_id":"E1","paper_id":7,"paper_title":"原论文",'
                        '"page_number":2,"section":"Results","excerpt":"证据片段",'
                        '"source_scope":"fulltext"}]'
                    ),
                    position=position,
                )
                db.add(card)
                cards.append(card)
            db.commit()
            return (
                {"id": pack.id, "title": pack.title},
                [{"id": card.id, "pack_id": pack.id, "evidence_json": card.evidence_json} for card in cards],
            )

    return seed


def test_review_rules_and_timezone_are_deterministic(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import AppSettings
    from app.learning_review import local_today, review_decision

    today = date(2026, 8, 20)
    assert review_decision("不会", today).next_review_date == date(2026, 8, 21)
    assert review_decision("模糊", today).next_review_date == date(2026, 8, 23)
    assert review_decision("基本掌握", today).next_review_date == date(2026, 8, 27)
    mastered = review_decision("已掌握", today)
    assert mastered.next_review_date == date(2026, 9, 19)
    assert mastered.mastery_status == "已掌握"
    assert all(
        review_decision(rating, today).mastery_status == "学习中"
        for rating in ("不会", "模糊", "基本掌握")
    )
    assert local_today(
        "Asia/Shanghai", datetime(2026, 8, 20, 16, 30, tzinfo=timezone.utc)
    ) == date(2026, 8, 21)

    monkeypatch.setenv("USER_TIMEZONE", "Mars/Olympus")
    with pytest.raises(ValidationError):
        AppSettings()


def test_migration_0016_to_0017_preserves_data_constraints_and_cascades(
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
    command.upgrade(config, "0016")
    engine = sa.create_engine(url)
    with engine.begin() as connection:
        connection.execute(
            sa.text(
                "INSERT INTO learning_packs "
                "(id,title,learning_goal,cards_status,quiz_status,cards_prompt_version,"
                "cards_schema_version,quiz_prompt_version,quiz_schema_version,provider,model_name,"
                "created_at,updated_at) VALUES "
                "(1,'历史学习包','','pending','pending','learning-cards-v1',"
                "'learning-cards-schema-v1','learning-quiz-v1','learning-quiz-schema-v1','', '',"
                "CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
            )
        )
        connection.execute(
            sa.text(
                "INSERT INTO learning_cards "
                "(id,pack_id,concept,generated_content,content,importance,common_mistake,"
                "evidence_json,is_user_edited,mastery_status,position,created_at,updated_at) VALUES "
                "(1,1,'历史概念','旧内容','旧内容','','','[]',0,'未学习',1,"
                "CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
            )
        )
    command.upgrade(config, "head")

    inspector = sa.inspect(engine)
    assert "learning_review_states" in inspector.get_table_names()
    assert {"ix_learning_review_states_pack_id", "ix_learning_review_states_next_review_date"}.issubset(
        {item["name"] for item in inspector.get_indexes("learning_review_states")}
    )
    with engine.begin() as connection:
        assert connection.execute(sa.text("SELECT concept FROM learning_cards WHERE id=1")).scalar_one() == "历史概念"
        connection.execute(
            sa.text(
                "INSERT INTO learning_review_states "
                "(pack_id,card_id,last_rating,next_review_date,review_count,lapse_count,is_paused,"
                "last_reviewed_at,created_at,updated_at) VALUES "
                "(1,1,'模糊','2026-08-23',1,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
            )
        )
        with pytest.raises(sa.exc.IntegrityError):
            connection.execute(
                sa.text(
                    "INSERT INTO learning_review_states "
                    "(pack_id,card_id,last_rating,next_review_date,review_count,lapse_count,is_paused,"
                    "last_reviewed_at,created_at,updated_at) VALUES "
                    "(1,1,'非法','2026-08-23',0,-1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)"
                )
            )
    engine.dispose()


def test_submit_review_updates_one_state_mastery_counts_and_preserves_evidence(
    client: TestClient, seed_cards
) -> None:
    _, cards = seed_cards()
    card = cards[0]

    first = client.post(
        f"/api/v1/learning/cards/{card['id']}/review", json={"rating": "已掌握"}
    )
    assert first.status_code == 200, first.text
    first_body = first.json()
    state_id = first_body["state"]["id"]
    assert first_body["state"]["review_count"] == 1
    assert first_body["card"]["mastery_status"] == "已掌握"
    assert first_body["card"]["mastery_confirmed_at"] is not None
    assert first_body["card"]["evidence"] == [
        {
            "evidence_id": "E1",
            "paper_id": 7,
            "paper_title": "原论文",
            "page_number": 2,
            "section": "Results",
            "excerpt": "证据片段",
            "source_scope": "fulltext",
        }
    ]

    second = client.post(
        f"/api/v1/learning/cards/{card['id']}/review", json={"rating": "不会"}
    )
    assert second.status_code == 200, second.text
    second_body = second.json()
    assert second_body["state"]["id"] == state_id
    assert second_body["state"]["review_count"] == 2
    assert second_body["state"]["lapse_count"] == 1
    assert second_body["card"]["mastery_status"] == "学习中"
    assert second_body["card"]["mastery_confirmed_at"] is None
    assert second_body["card"]["review_state"]["id"] == state_id

    detail = client.get(f"/api/v1/learning/packs/{card['pack_id']}")
    assert detail.status_code == 200
    assert detail.json()["cards"][0]["review_state"]["id"] == state_id
    with client.app.state.session_factory() as db:
        assert db.execute(sa.text("SELECT COUNT(*) FROM learning_review_states")).scalar_one() == 1


def test_queue_update_filter_pause_resume_and_overview(client: TestClient, seed_cards) -> None:
    first_pack, first_cards = seed_cards(3, title="包一")
    second_pack, second_cards = seed_cards(1, title="包二")
    reviewed = [
        client.post(f"/api/v1/learning/cards/{item['id']}/review", json={"rating": "模糊"}).json()
        for item in [*first_cards, *second_cards]
    ]
    today = date.today()
    dates = [today, today.replace(day=max(1, today.day - 1)), today, today]
    for response, next_date in zip(reviewed, dates, strict=True):
        state_id = response["state"]["id"]
        patch = client.patch(
            f"/api/v1/learning/review-states/{state_id}",
            json={"next_review_date": str(next_date)},
        )
        assert patch.status_code == 200
    paused_id = reviewed[2]["state"]["id"]
    assert client.patch(
        f"/api/v1/learning/review-states/{paused_id}", json={"is_paused": True}
    ).json()["is_paused"] is True

    queue = client.get("/api/v1/learning/review-queue")
    assert queue.status_code == 200
    assert [item["card"]["id"] for item in queue.json()["items"]] == [
        first_cards[1]["id"], first_cards[0]["id"], second_cards[0]["id"]
    ]
    assert queue.json()["items"][0]["overdue_days"] >= 0
    filtered = client.get(
        "/api/v1/learning/review-queue", params={"pack_id": first_pack["id"]}
    )
    assert [item["card"]["id"] for item in filtered.json()["items"]] == [
        first_cards[1]["id"], first_cards[0]["id"]
    ]
    overview = client.get("/api/v1/learning/overview").json()
    assert overview["due_review_count"] == 3
    assert len(overview["due_reviews"]) == 3
    assert "packs" in overview and "today_tasks" in overview and "open_weaknesses" in overview

    resumed = client.patch(
        f"/api/v1/learning/review-states/{paused_id}", json={"is_paused": False}
    )
    assert resumed.status_code == 200
    assert len(client.get("/api/v1/learning/review-queue").json()["items"]) == 4
    assert client.patch(
        f"/api/v1/learning/review-states/{paused_id}", json={}
    ).status_code == 422
    assert client.patch(
        f"/api/v1/learning/review-states/{paused_id}", json={"review_count": 99}
    ).status_code == 422
    assert client.post(
        f"/api/v1/learning/cards/{first_cards[0]['id']}/review", json={"rating": "猜测"}
    ).status_code == 422
    assert client.post("/api/v1/learning/cards/999999/review", json={"rating": "模糊"}).status_code == 404


def test_existing_actions_do_not_create_or_change_review_state(client: TestClient, seed_cards) -> None:
    from app.models import LearningPlan, LearningPlanTask, LearningQuestion

    pack, cards = seed_cards()
    card = cards[0]
    with client.app.state.session_factory() as db:
        question = LearningQuestion(
            pack_id=pack["id"], question_type="multiple_choice", prompt="题目", options_json='["A","B"]',
            correct_answer="A", related_card_ids_json=f"[{card['id']}]", position=1,
        )
        plan = LearningPlan(pack_id=pack["id"], start_date=date.today(), end_date=date.today(), weekdays_json="[]")
        db.add_all([question, plan]); db.flush()
        task = LearningPlanTask(plan_id=plan.id, task_date=date.today(), task_type="card", card_id=card["id"], title="学习", position=1)
        db.add(task); db.commit()
        question_id, task_id = question.id, task.id

    assert client.post(
        f"/api/v1/learning/questions/{question_id}/attempts", json={"answer": "B"}
    ).status_code == 201
    assert client.post(
        f"/api/v1/learning/packs/{pack['id']}/weaknesses",
        json={"concept": "薄弱项", "card_id": card["id"]},
    ).status_code == 201
    assert client.patch(
        f"/api/v1/learning/plan-tasks/{task_id}", json={"completed": True}
    ).status_code == 200
    with client.app.state.session_factory() as db:
        row = db.execute(
            sa.text("SELECT mastery_status, mastery_confirmed_at FROM learning_cards WHERE id=:id"),
            {"id": card["id"]},
        ).one()
        assert row == ("未学习", None)
        assert db.execute(sa.text("SELECT COUNT(*) FROM learning_review_states")).scalar_one() == 0


def test_review_flow_is_local_and_cascade_deletes_only_review_data(
    client: TestClient, seed_cards, monkeypatch: pytest.MonkeyPatch
) -> None:
    pack, cards = seed_cards()
    monkeypatch.setattr(
        "app.providers.make_provider",
        lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("provider called")),
    )
    response = client.post(
        f"/api/v1/learning/cards/{cards[0]['id']}/review", json={"rating": "模糊"}
    )
    assert response.status_code == 200
    state_id = response.json()["state"]["id"]
    assert client.get("/api/v1/learning/review-queue").status_code == 200
    assert client.patch(
        f"/api/v1/learning/review-states/{state_id}", json={"is_paused": True}
    ).status_code == 200

    with client.app.state.session_factory() as db:
        db.execute(sa.text("DELETE FROM learning_cards WHERE id=:id"), {"id": cards[0]["id"]})
        db.commit()
        assert db.execute(sa.text("SELECT COUNT(*) FROM learning_review_states")).scalar_one() == 0
        assert db.execute(sa.text("SELECT COUNT(*) FROM learning_packs WHERE id=:id"), {"id": pack["id"]}).scalar_one() == 1


def test_concurrent_review_writes_return_stable_conflicts(
    client: TestClient, seed_cards, monkeypatch: pytest.MonkeyPatch
) -> None:
    from sqlalchemy.orm import Session
    from sqlalchemy.sql.dml import Update

    _, cards = seed_cards()
    card_id = cards[0]["id"]
    created = client.post(
        f"/api/v1/learning/cards/{card_id}/review", json={"rating": "模糊"}
    )
    assert created.status_code == 200
    state_id = created.json()["state"]["id"]
    original_execute = Session.execute

    def stale_update(self, statement, *args, **kwargs):
        if isinstance(statement, Update) and statement.table.name == "learning_review_states":
            assert "updated_at" in str(statement)
            return SimpleNamespace(rowcount=0)
        return original_execute(self, statement, *args, **kwargs)

    monkeypatch.setattr(Session, "execute", stale_update)
    repeated = client.post(
        f"/api/v1/learning/cards/{card_id}/review", json={"rating": "不会"}
    )
    assert repeated.status_code == 409
    assert repeated.json()["detail"] == "复习状态已被修改，请刷新后重试"

    def locked_update(self, statement, *args, **kwargs):
        if isinstance(statement, Update) and statement.table.name == "learning_review_states":
            raise sa.exc.OperationalError("UPDATE learning_review_states", {}, Exception("locked"))
        return original_execute(self, statement, *args, **kwargs)

    monkeypatch.setattr(Session, "execute", locked_update)
    patched = client.patch(
        f"/api/v1/learning/review-states/{state_id}", json={"is_paused": True}
    )
    assert patched.status_code == 409
    assert patched.json()["detail"] == "复习状态发生并发冲突，请重试"
