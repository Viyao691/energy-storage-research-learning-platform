from __future__ import annotations

import asyncio
import hashlib
import json
from datetime import datetime

from sqlalchemy import select

from app.campus_models import CampusAnalysisCache, CampusEvent
from app.providers import StructuredTaskResult
from app.services.campus_analysis import CampusAnalyzer
from test_campus import factory


def _event(factory, body: str) -> tuple[int, str]:
    digest = hashlib.sha256(body.encode()).hexdigest()
    with factory() as db:
        row = CampusEvent(identity=digest, title="AI大赛报名通知", category="竞赛创新",
                          excerpt=body[:30], dates_json="[]", published_on=None,
                          priority=90, followed=False, conflict=False,
                          content_hash=digest, first_seen_at=datetime(2026, 9, 25),
                          updated_at=datetime(2026, 9, 25))
        db.add(row)
        db.commit()
        return row.id, digest


class FakeProvider:
    def __init__(self, quote: str = "报名截止：2026年10月10日"):
        self.calls = 0
        self.quote = quote
        self.max_tokens = []
        self.prompts = []

    def generate_structured_task(self, prompt, task_type, *, max_tokens=None):
        self.calls += 1
        self.max_tokens.append(max_tokens)
        self.prompts.append(prompt)
        assert task_type == "campus-notice-v1"
        assert "不可信" in prompt
        return StructuredTaskResult({
            "summary": "这是一项校园 AI 大赛，需要在规定日期前报名。",
            "key_points": ["报名应在截止日前完成"],
            "category": "竞赛创新", "subtype": "AI与编程", "competition_type": "AI应用创新",
            "competition_tracks": [], "stage": "报名", "audience": None, "action": "报名",
            "evidence": [{"field": "summary", "quote": self.quote},
                         {"field": "key_points", "quote": self.quote},
                         {"field": "category", "quote": self.quote},
                         {"field": "subtype", "quote": self.quote},
                         {"field": "competition_type", "quote": self.quote},
                         {"field": "stage", "quote": self.quote},
                         {"field": "action", "quote": self.quote}], "unknowns": []}, "AI归纳", "fake-model")


def test_analysis_cache_reuse_hash_and_invalid_quote(factory):
    body = "报名截止：2026年10月10日。参赛者请核对原文。"
    first_id, digest = _event(factory, body)
    second_id, _ = _event(factory, body + " 第二个事件")
    provider = FakeProvider()
    analyzer = CampusAnalyzer(factory, provider_factory=lambda _: ("fake", "fake-model", provider))
    now = datetime(2026, 9, 25, 1)
    async def run():
        assert await analyzer.analyze(first_id, digest, "AI大赛报名通知", body, "https://oa.xjtu.edu.cn/one", now)
        assert not await analyzer.analyze(first_id, digest, "AI大赛报名通知", body, "https://oa.xjtu.edu.cn/one", now)
    asyncio.run(run())
    assert provider.calls == 1
    with factory() as db:
        row = db.get(CampusEvent, first_id)
        assert json.loads(row.analysis_json)["status"] == "ready"
        assert db.scalar(select(CampusAnalysisCache)).input_text == ""
        second = db.get(CampusEvent, second_id)
        second.content_hash = hashlib.sha256((body + " 尾部变化").encode()).hexdigest()
        db.commit()
    provider.quote = "原文中不存在的伪造引用"
    async def invalid():
        with factory() as db:
            row = db.get(CampusEvent, second_id)
            second_hash = row.content_hash
        assert await analyzer.analyze(second_id, second_hash, "AI大赛报名通知", body + " 尾部变化",
                                      "https://oa.xjtu.edu.cn/two", now)
    asyncio.run(invalid())
    with factory() as db:
        saved = json.loads(db.get(CampusEvent, second_id).analysis_json)
        assert saved["status"] == "failed"
        assert db.get(CampusEvent, second_id).excerpt


def test_analysis_daily_limit_persists_across_service_instances(factory):
    body = "报名截止：2026年10月10日。"
    provider = FakeProvider()
    for index in range(20):
        _event(factory, body + str(index))
    now = datetime(2026, 9, 25, 1)
    async def run():
        with factory() as db:
            rows = list(db.scalars(select(CampusEvent).order_by(CampusEvent.id)))
        for row in rows:
            analyzer = CampusAnalyzer(factory, provider_factory=lambda _: ("fake", "fake-model", provider))
            await analyzer.analyze(row.id, row.content_hash, row.title, body + str(row.id - rows[0].id),
                                   "https://oa.xjtu.edu.cn/test", now)
        extra_id, extra_hash = _event(factory, body + "new")
        fresh = CampusAnalyzer(factory, provider_factory=lambda _: ("fake", "fake-model", provider))
        assert not await fresh.analyze(extra_id, extra_hash, "AI大赛报名通知", body + "new",
                                       "https://oa.xjtu.edu.cn/test", now)
    asyncio.run(run())
    assert provider.calls == 20


def test_configured_limit_counts_failed_attempt_and_passes_output_cap(factory):
    from app.models import UserSetting
    body = "报名截止：2026年10月10日。"
    first_id, first_hash = _event(factory, body + "一")
    second_id, second_hash = _event(factory, body + "二")
    with factory() as db:
        db.add(UserSetting(id=1, campus_ai_daily_limit=1, campus_ai_max_tokens=512))
        db.commit()
    provider = FakeProvider(quote="原文不存在的引文")
    analyzer = CampusAnalyzer(factory, provider_factory=lambda _: ("fake", "fake-model", provider))
    now = datetime(2026, 9, 25, 1)
    async def run():
        assert await analyzer.analyze(first_id, first_hash, "AI大赛", body + "一", "https://oa.xjtu.edu.cn/one", now)
        assert not await analyzer.analyze(second_id, second_hash, "AI大赛", body + "二", "https://oa.xjtu.edu.cn/two", now)
    asyncio.run(run())
    assert provider.max_tokens == [512]
    with factory() as db:
        assert json.loads(db.get(CampusEvent, first_id).analysis_json)["status"] == "failed"
        assert json.loads(db.get(CampusEvent, second_id).analysis_json)["status"] == "deferred"


def test_zero_daily_limit_and_priority_before_queue_slice(factory):
    from app.models import UserSetting
    with factory() as db:
        db.add(UserSetting(id=1, campus_ai_daily_limit=0, campus_ai_max_tokens=384))
        db.commit()
    provider = FakeProvider()
    analyzer = CampusAnalyzer(factory, provider_factory=lambda _: ("fake", "fake-model", provider))
    now = datetime(2026, 9, 25, 1)
    for title in ("校园活动通知", "人工智能竞赛通知", "科研项目申报通知A", "科研项目申报通知B"):
        body = "报名截止：2026年10月10日。" + title
        event_id, digest = _event(factory, body)
        with factory() as db:
            db.get(CampusEvent, event_id).title = title
            db.commit()
        analyzer.enqueue(event_id, digest, title, body, "https://oa.xjtu.edu.cn/test", now)
    with factory() as db:
        earlier = db.scalar(select(CampusAnalysisCache).order_by(CampusAnalysisCache.id.desc()))
        earlier.created_at = now.replace(day=24)
        db.commit()
    assert asyncio.run(analyzer.drain(now, limit=3)) == 3
    assert "科研项目申报通知B" in provider.prompts[0]
    assert "科研项目申报通知A" in provider.prompts[1]
    assert "人工智能竞赛通知" in provider.prompts[2]
    assert provider.max_tokens == [384, 384, 384]


def test_analysis_queue_survives_next_tick_and_limits_two_calls(factory):
    provider = FakeProvider()
    analyzer = CampusAnalyzer(factory, provider_factory=lambda _: ("fake", "fake-model", provider))
    now = datetime(2026, 9, 25, 1)
    for index in range(3):
        body = f"报名截止：2026年10月10日。第{index}项比赛。"
        event_id, digest = _event(factory, body)
        analyzer.enqueue(event_id, digest, "AI大赛报名通知", body, "https://oa.xjtu.edu.cn/test", now)
    async def run():
        assert await analyzer.drain(now, limit=2) == 2
        assert provider.calls == 2
        resumed = CampusAnalyzer(factory, provider_factory=lambda _: ("fake", "fake-model", provider))
        assert await resumed.drain(now, limit=2) == 1
    asyncio.run(run())
    assert provider.calls == 3
    with factory() as db:
        assert all(json.loads(row.analysis_json)["status"] == "ready" for row in db.scalars(select(CampusEvent)))


def test_stale_queue_entries_do_not_block_current_notice(factory):
    provider = FakeProvider()
    analyzer = CampusAnalyzer(factory, provider_factory=lambda _: ("fake", "fake-model", provider))
    now = datetime(2026, 9, 25, 1)
    ids = []
    for index in range(3):
        body = f"报名截止：2026年10月10日。第{index}项比赛。"
        event_id, digest = _event(factory, body)
        ids.append(event_id)
        analyzer.enqueue(event_id, digest, "AI大赛报名通知", body, "https://oa.xjtu.edu.cn/test", now)
    with factory() as db:
        db.get(CampusEvent, ids[0]).content_hash = "updated-content"
        db.delete(db.get(CampusEvent, ids[1]))
        db.commit()
    assert asyncio.run(analyzer.drain(now, limit=2)) == 1
    assert provider.calls == 1
    with factory() as db:
        rows = list(db.scalars(select(CampusAnalysisCache).order_by(CampusAnalysisCache.id)))
        assert [row.status for row in rows] == ["deferred", "deferred", "ready"]
        assert all(not row.input_text for row in rows)


def test_deepseek_campus_json_uses_bounded_non_thinking_request(monkeypatch):
    from app.providers import DeepSeekProvider
    requests = []
    class Response:
        def raise_for_status(self):
            pass
        def json(self):
            return {"choices": [{"message": {"content": '{"summary":"fixture"}'}}]}
    def post(*args, **kwargs):
        requests.append(kwargs["json"])
        return Response()
    monkeypatch.setattr("app.providers.httpx.post", post)
    provider = DeepSeekProvider("fake-key", "https://example.test", "deepseek-v4-pro", 30)
    provider.generate_structured_task("json", "campus-notice-v1", max_tokens=512)
    provider.generate_structured_task("json", "existing-research-task")
    assert requests[0]["thinking"] == {"type": "disabled"}
    assert requests[0]["max_tokens"] == 512
    assert "thinking" not in requests[1]
    assert requests[1]["max_tokens"] == 12000
