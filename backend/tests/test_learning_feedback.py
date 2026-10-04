from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'learning-feedback.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("USER_TIMEZONE", "Asia/Shanghai")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def _seed_attempt(client: TestClient, *, lifecycle_status: str = "active") -> tuple[int, int]:
    from app.models import LearningAttempt, LearningCard, LearningPack, LearningQuestion

    with client.app.state.session_factory() as db:
        pack = LearningPack(
            title="反馈学习包",
            lineage_id=f"feedback-{lifecycle_status}",
            lifecycle_status=lifecycle_status,
        )
        db.add(pack)
        db.flush()
        card = LearningCard(
            pack_id=pack.id,
            concept="证据边界",
            generated_content="内容",
            content="内容",
            evidence_json="[]",
            mastery_status="学习中",
            position=1,
        )
        db.add(card)
        db.flush()
        question = LearningQuestion(
            pack_id=pack.id,
            question_type="short_answer",
            prompt="说明证据边界。",
            correct_answer="",
            reference_points_json='["区分事实与推断","指出替代解释"]',
            related_card_ids_json=f"[{card.id}]",
            evidence_json=(
                '[{"evidence_id":"E1","paper_id":7,"paper_title":"快照论文",'
                '"page_number":2,"section":"Results","excerpt":"快照证据",'
                '"source_scope":"fulltext"}]'
            ),
            position=1,
        )
        db.add(question)
        db.flush()
        attempt = LearningAttempt(
            question_id=question.id,
            answer="单一表征证明了完整机制。",
            result="pending_self_review",
        )
        db.add(attempt)
        db.commit()
        return attempt.id, card.id


def test_feedback_is_explicit_regeneration_confirmed_and_state_neutral(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.learning import LearningFeedbackResult
    from app.models import LearningAttempt, LearningCard, LearningReviewState, LearningWeakness

    attempt_id, card_id = _seed_attempt(client)

    class CountingProvider:
        name = "fake"
        model_name = "fake-feedback-model"

        def __init__(self) -> None:
            self.calls = 0
            self.prompts: list[str] = []

        def generate_learning_feedback(self, prompt: str) -> LearningFeedbackResult:
            self.calls += 1
            self.prompts.append(prompt)
            return LearningFeedbackResult(
                feedback_markdown=f"反馈版本 {self.calls}：需要区分事实与推断。",
                model_name=self.model_name,
                evidence_status="基于学习包证据快照",
            )

    provider = CountingProvider()
    monkeypatch.setattr("app.learning_feedback_api._provider", lambda db: provider)

    with client.app.state.session_factory() as db:
        card_before = db.get(LearningCard, card_id)
        mastery_before = (card_before.mastery_status, card_before.mastery_confirmed_at)
        assert db.query(LearningWeakness).count() == 0
        assert db.query(LearningReviewState).count() == 0
    assert provider.calls == 0

    first = client.post(f"/api/v1/learning/attempts/{attempt_id}/feedback", json={})
    assert first.status_code == 200, first.text
    assert provider.calls == 1
    assert first.json()["feedback_markdown"].startswith("反馈版本 1")
    assert first.json()["feedback_provider"] == "fake"
    assert first.json()["feedback_prompt_version"] == "learning-short-feedback-v1"
    assert "快照证据" in provider.prompts[0]
    assert "PRIVATE_FULLTEXT" not in provider.prompts[0]

    refused = client.post(f"/api/v1/learning/attempts/{attempt_id}/feedback", json={})
    assert refused.status_code == 409
    assert provider.calls == 1
    regenerated = client.post(
        f"/api/v1/learning/attempts/{attempt_id}/feedback", json={"regenerate": True}
    )
    assert regenerated.status_code == 200
    assert provider.calls == 2
    assert regenerated.json()["feedback_markdown"].startswith("反馈版本 2")

    with client.app.state.session_factory() as db:
        attempt = db.get(LearningAttempt, attempt_id)
        card = db.get(LearningCard, card_id)
        assert attempt.result == "pending_self_review"
        assert attempt.self_rating is None
        assert (card.mastery_status, card.mastery_confirmed_at) == mastery_before
        assert db.query(LearningWeakness).count() == 0
        assert db.query(LearningReviewState).count() == 0


def test_feedback_failure_preserves_old_feedback_and_rejects_non_active_pack(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.models import LearningAttempt
    from app.providers import ModelProviderError

    attempt_id, _ = _seed_attempt(client)
    archived_attempt_id, _ = _seed_attempt(client, lifecycle_status="archived")
    with client.app.state.session_factory() as db:
        attempt = db.get(LearningAttempt, attempt_id)
        attempt.feedback_markdown = "旧反馈"
        attempt.feedback_provider = "mock"
        db.commit()

    class FailingProvider:
        name = "fake"

        def generate_learning_feedback(self, prompt: str):
            raise ModelProviderError("反馈服务暂不可用")

    monkeypatch.setattr("app.learning_feedback_api._provider", lambda db: FailingProvider())
    failed = client.post(
        f"/api/v1/learning/attempts/{attempt_id}/feedback", json={"regenerate": True}
    )
    assert failed.status_code == 502
    with client.app.state.session_factory() as db:
        assert db.get(LearningAttempt, attempt_id).feedback_markdown == "旧反馈"
    assert client.post(
        f"/api/v1/learning/attempts/{archived_attempt_id}/feedback", json={}
    ).status_code == 409
