import asyncio
import json
from types import SimpleNamespace
import threading

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base, ResearchRecommendation, ResearchSubscription
from app.providers import StructuredTaskResult
from app.services.research_reading import ResearchReadingHighlights


class FakeProvider:
    def __init__(self):
        self.calls = []
        self.fail = False

    def generate_structured_task(self, prompt, task_type, *, max_tokens):
        source = json.loads(prompt.split("\nSOURCE_ITEMS=", 1)[1])
        self.calls.append((source, threading.get_ident()))
        assert task_type == "research-reading-highlights-v1"
        assert max_tokens == 3200
        if self.fail:
            raise RuntimeError("private upstream content must not leak")
        return StructuredTaskResult({"items": [{"key": item["key"], "title_zh": "钠电池材料研究", "points": ["关注钠电池材料结构。", "摘要介绍材料评估方法。", "结论应结合原文核对。"]} for item in source]}, "AI归纳", "fake")


def source(index=1, abstract="The abstract describes sodium batteries."):
    return {"key": f"paper:{index}", "title": "Sodium battery materials", "abstract": abstract}


def test_batch_five_concurrent_repeat_and_restart_reuse_cache(tmp_path):
    provider = FakeProvider()
    main_thread = threading.get_ident()
    cache = tmp_path / "highlights.json"
    async def run():
        service = ResearchReadingHighlights(cache)
        inputs = [source(index) for index in range(1, 6)]
        first, duplicate = await asyncio.gather(service.summarize(inputs, lambda: provider), service.summarize(inputs, lambda: provider))
        restarted = await ResearchReadingHighlights(cache).summarize(inputs, lambda: provider)
        assert first == duplicate == restarted
        assert len(provider.calls) == 1
        assert len(provider.calls[0][0]) == 5
        assert provider.calls[0][1] != main_thread
        await service.summarize([source(1, "Changed source abstract")], lambda: provider)
        assert len(provider.calls) == 2
        assert len(provider.calls[1][0]) == 1
    asyncio.run(run())


def test_provider_failure_does_not_write_or_replace_good_cache(tmp_path):
    provider = FakeProvider()
    cache = tmp_path / "highlights.json"
    async def run():
        service = ResearchReadingHighlights(cache)
        await service.summarize([source()], lambda: provider)
        previous = cache.read_text(encoding="utf-8")
        provider.fail = True
        with pytest.raises(RuntimeError):
            await service.summarize([source(1, "Changed abstract")], lambda: provider)
        assert cache.read_text(encoding="utf-8") == previous
        empty_cache = tmp_path / "new.json"
        with pytest.raises(RuntimeError):
            await ResearchReadingHighlights(empty_cache).summarize([source()], lambda: provider)
        assert not empty_cache.exists()
    asyncio.run(run())


def test_no_abstract_is_explicit_title_only_not_a_research_claim(tmp_path):
    provider = FakeProvider()
    items = asyncio.run(ResearchReadingHighlights(tmp_path / "highlights.json").summarize([source(abstract="")], lambda: provider))
    assert len(items[0].points) == 3
    assert "仅标题线索" in items[0].points[0]
    assert "未提供摘要" in items[0].points[0]
    assert "原文确认" in items[0].points[2]
    assert "has_abstract" in provider.calls[0][0][0]
    assert provider.calls[0][0][0]["has_abstract"] is False


def test_api_accepts_only_stored_records_or_known_news_and_sanitizes_failures(tmp_path, monkeypatch):
    from app.routers import research
    provider = FakeProvider()
    monkeypatch.setattr(research, "get_settings", lambda: SimpleNamespace(paper_storage_dir=tmp_path / "papers"))
    monkeypatch.setattr(research, "_get_setting", lambda db: SimpleNamespace(model_provider="mock", model_base_url="", model_name="fake", timeout_seconds=30, vision_model=""))
    monkeypatch.setattr(research, "get_model_api_key", lambda *_: "")
    monkeypatch.setattr(research, "make_provider", lambda *_: provider)
    engine = create_engine(f"sqlite:///{tmp_path / 'research.db'}")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    with factory() as db:
        subscription = ResearchSubscription(name="钠电池", query="sodium", sources_json="[]", interval_hours=168, enabled=True)
        db.add(subscription)
        db.flush()
        recommendation = ResearchRecommendation(subscription_id=subscription.id, source="openalex", external_id="stored", identity_key="stored", paper_snapshot_json=json.dumps({"title": "Stored sodium research", "abstract": "Stored public abstract"}), relevance_score=1)
        db.add(recommendation)
        db.commit()
        record_id = recommendation.id
    def get_db():
        with factory() as db:
            yield db
    app = FastAPI()
    class KnownNews:
        async def latest(self):
            return {"items": [{"url": "https://news.mit.edu/known", "title": "Known AI news", "summary": "Public AI abstract"}]}
    app.state.research_news = KnownNews()
    research.register_research_routes(app, get_db)
    with TestClient(app) as client:
        result = client.post("/api/v1/research/reading-highlights", json={"recommendation_ids": [record_id], "news_urls": ["https://news.mit.edu/known"]})
        assert result.status_code == 200
        assert [item["key"] for item in result.json()["items"]] == [f"paper:{record_id}", "news:https://news.mit.edu/known"]
        assert len(provider.calls) == 1
        assert client.post("/api/v1/research/reading-highlights", json={"recommendation_ids": [record_id] * 5, "news_urls": ["https://news.mit.edu/known"]}).status_code == 422
        assert client.post("/api/v1/research/reading-highlights", json={"news_urls": ["http://localhost/private"]}).status_code == 404
        assert len(provider.calls) == 1
        provider.fail = True
        with factory() as db:
            record = db.get(ResearchRecommendation, record_id)
            record.paper_snapshot_json = json.dumps({"title": "Updated original", "abstract": "Changed original abstract"})
            db.commit()
        failure = client.post("/api/v1/research/reading-highlights", json={"recommendation_ids": [record_id]})
        assert failure.status_code == 502
        assert "重试" in failure.json()["detail"]
        assert "private upstream" not in failure.text
    engine.dispose()
