from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path

import pytest


def test_public_wechat_link_normalization_and_anchor_extraction():
    from app.services.campus_public_links import extract_public_links, normalize_public_link

    html = '''<ul>
      <li><a href="http://mp.weixin.qq.com/s/AbC_123">交大公众号文章</a><span>09-25</span></li>
      <li><a title="公众号文章完整标题" href="https://mp.weixin.qq.com/s?__biz=MzA&mid=123&idx=1&sn=abc">&nbsp;</a></li>
      <li><a href="https://mp.weixin.qq.com/s/not-a-private-roster">学生名单公示</a></li>
      <li><a href="https://mp.weixin.qq.com/s/DateOnly_9">2026-09-25</a></li>
      <li><a href="https://mp.weixin.qq.com/s/DateOnly_8">24</a></li>
      <li><a href="https://mp.weixin.qq.com/s/DateOnly_7">2026-09</a></li>
      <li><a href="https://mp.weixin.qq.com/">公众号主页</a></li>
      <li><a href="https://mp.weixin.qq.com.evil.test/s/not-valid">伪装域名</a></li>
      <li><a href="javascript:alert(1)">脚本</a></li>
    </ul>'''

    links = extract_public_links(html, "https://news.xjtu.edu.cn/")
    assert [(item.url, item.title, item.published_on) for item in links] == [
        ("https://mp.weixin.qq.com/s/AbC_123", "交大公众号文章", None),
        ("https://mp.weixin.qq.com/s?__biz=MzA&mid=123&idx=1&sn=abc", "公众号文章完整标题", None),
    ]
    assert normalize_public_link("http://mp.weixin.qq.com/s/AbC_123") == "https://mp.weixin.qq.com/s/AbC_123"
    assert normalize_public_link("https://mp.weixin.qq.com/s?sn=abc&idx=1&mid=123&__biz=MzA&scene=1") == \
        "https://mp.weixin.qq.com/s?__biz=MzA&mid=123&idx=1&sn=abc"
    assert normalize_public_link("https://mp.weixin.qq.com/s/AbC_123?scene=1#rd") == \
        "https://mp.weixin.qq.com/s/AbC_123"
    assert normalize_public_link("https://mp.weixin.qq.com.evil.test/s/AbC_123") is None
    assert normalize_public_link("https://user@mp.weixin.qq.com/s/AbC_123") is None
    assert normalize_public_link("https://mp.weixin.qq.com:443/s/AbC_123") is None
    assert normalize_public_link("https://mp.weixin.qq.com/s/") is None


def test_public_link_collection_is_separate_from_events_and_never_fetches_wechat(factory):
    import asyncio

    import httpx
    from fastapi.testclient import TestClient
    from sqlalchemy import select

    from app.campus_models import CampusEvent, CampusPublicLink, CampusSource
    from app.main import create_app
    from app.services.campus import CampusService

    requested: list[str] = []

    def handler(request):
        requested.append(str(request.url))
        if request.url.path == "/robots.txt":
            return httpx.Response(404)
        return httpx.Response(200, text='''<ul class="news">
          <li><a href="https://mp.weixin.qq.com/s/PublicOnly_1">官网转发：书院活动报名</a></li>
        </ul>''')

    clock = {"now": datetime(2026, 9, 25)}

    async def collect():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            service = CampusService(factory, client=client, delay=0, now=lambda: clock["now"])
            with factory() as db:
                db.add_all([
                    CampusSource(key="xjtu-news", name="西安交通大学新闻网", group="学校",
                                 url="https://news.xjtu.edu.cn/", enabled=True, priority=90),
                    CampusSource(key="zhongying-news", name="仲英书院 · 新闻动态", group="书院",
                                 url="https://cy.xjtu.edu.cn/", enabled=True, priority=80),
                ])
                db.commit()
                source_ids = list(db.scalars(select(CampusSource.id).order_by(CampusSource.id)))
            for source_id in source_ids:
                await service._check_source(source_id, 0)
            clock["now"] += timedelta(hours=13)
            for source_id in source_ids:
                await service._check_source(source_id, 0)

    asyncio.run(collect())
    assert all("mp.weixin.qq.com" not in url for url in requested)
    with factory() as db:
        links = list(db.scalars(select(CampusPublicLink)))
        assert len(links) == 2
        assert all(link.published_on is None for link in links)
        assert all(link.url == "https://mp.weixin.qq.com/s/PublicOnly_1" for link in links)
        assert len(list(db.scalars(select(CampusEvent)))) == 0

    app = create_app()
    app.state.session_factory = factory
    response = TestClient(app).get("/api/v1/campus/public-links?scope=unknown")
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["evidence_level"] == "link_only"
    assert item["published_on"] is None
    assert len(response.json()["items"]) == 1
    assert {origin["url"] for origin in item["origins"]} == {
        "https://news.xjtu.edu.cn/", "https://cy.xjtu.edu.cn/"}
    app.state.engine.dispose()


@pytest.fixture()
def factory(tmp_path, monkeypatch):
    from alembic import command
    from alembic.config import Config
    from sqlalchemy import create_engine, inspect
    from sqlalchemy.orm import sessionmaker

    from app.config import reset_settings_cache
    from app.database import enable_sqlite_foreign_keys

    url = f"sqlite:///{(tmp_path / 'campus-public-links.db').as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)
    reset_settings_cache()
    root = Path(__file__).resolve().parents[1]
    cfg = Config(str(root / "alembic.ini"))
    cfg.set_main_option("script_location", str(root / "alembic"))
    command.upgrade(cfg, "head")
    engine = enable_sqlite_foreign_keys(create_engine(url))
    assert "campus_public_links" in inspect(engine).get_table_names()
    yield sessionmaker(engine, expire_on_commit=False, autoflush=False)
    engine.dispose()
    reset_settings_cache()
