import asyncio
from contextlib import asynccontextmanager
from datetime import datetime

import httpx

from app.paper_sources.base import SearchFilters
from app.services.research_news import FEEDS, ResearchNewsDigest, ResearchNewsSource, topic_terms


XML = """<rss><channel>
<item><title>Sodium battery breakthrough</title><link>https://news.mit.edu/2026/battery</link><description>Energy storage research.</description><pubDate>Wed, 30 Sep 2026 12:00:00 GMT</pubDate></item>
<item><title>Language model reasoning</title><link>https://news.mit.edu/2026/ai</link><description>Artificial intelligence.</description></item>
<item><title>Battery offsite</title><link>https://other.test/battery</link></item>
</channel></rss>"""


def test_official_feed_topic_filter_metadata_and_external_link_boundary():
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, text=XML))) as client:
            items = await ResearchNewsSource(client, FEEDS[0]).search("钠电池", SearchFilters())
        assert len(items) == 1
        assert items[0].landing_url == "https://news.mit.edu/2026/battery"
        assert items[0].article_type == "news"
        assert items[0].published_date == "2026-09-30"
        assert items[0].journal == "MIT News · 能源"
    asyncio.run(run())


def test_daily_news_without_subscription_caches_and_reports_partial_failure():
    requests = []
    def handler(request):
        requests.append(str(request.url))
        if "artificial-intelligence" in str(request.url):
            return httpx.Response(503)
        if "eia.gov" in request.url.host:
            title, link = "Natural gas energy report", "https://www.eia.gov/todayinenergy/detail.php?id=1"
        elif "cleanenergywire.org" in request.url.host:
            title, link = "Renewable electricity expands", "https://www.cleanenergywire.org/news/example"
        elif "sciencedaily.com" in request.url.host:
            title, link = "New solar cells boost power", "https://www.sciencedaily.com/releases/2026/10/example.htm"
        else:
            title, link = "Sodium battery breakthrough", "https://news.mit.edu/2026/battery"
        return httpx.Response(200, text=f"<rss><channel><item><title>{title}</title><link>{link}</link></item></channel></rss>")
    @asynccontextmanager
    async def factory():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            yield client
    async def run():
        digest = ResearchNewsDigest(factory)
        first = await digest.latest()
        second = await digest.latest()
        assert len(requests) == len(FEEDS)
        assert first == second
        assert len(first["items"]) == len(FEEDS) - 1
        assert "人工智能" in first["warnings"][0]
    asyncio.run(run())


def test_daily_topic_filters_do_not_trust_broad_campus_categories():
    xml = """<rss><channel>
    <item><title>A new chapter for MIT Reads</title><description>Campus community reads a book.</description><category>Artificial intelligence</category><link>https://news.mit.edu/reads</link></item>
    <item><title>Poitras Center to fuel early careers</title><description>Funding for students.</description><category>Artificial intelligence</category><link>https://news.mit.edu/careers</link></item>
    <item><title>New robot learns from demonstrations</title><description>Machine learning algorithms.</description><link>https://news.mit.edu/robot</link></item>
    <item><title>Wind farms generate more electricity</title><link>https://news.mit.edu/wind</link></item>
    </channel></rss>"""
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, text=xml))) as client:
            ai = await ResearchNewsSource(client, FEEDS[1]).search("", SearchFilters())
            energy = await ResearchNewsSource(client, FEEDS[0]).search("", SearchFilters())
        assert [item.landing_url for item in ai] == ["https://news.mit.edu/robot"]
        assert [item.landing_url for item in energy] == ["https://news.mit.edu/wind"]
    asyncio.run(run())


def test_flow_battery_requires_topic_anchor_and_sodium_does_not_match_generic_oxide():
    xml = """<rss><channel>
    <item><title>Fluid flow improves factories</title><link>https://news.mit.edu/fluid</link></item>
    <item><title>New flow batteries store power</title><link>https://news.mit.edu/flow-battery</link></item>
    <item><title>Layered oxide chemistry</title><link>https://news.mit.edu/oxide</link></item>
    <item><title>Sodium ion storage breakthrough</title><link>https://news.mit.edu/sodium</link></item>
    </channel></rss>"""
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, text=xml))) as client:
            source = ResearchNewsSource(client, FEEDS[0])
            flow = await source.search("flow battery", SearchFilters())
            sodium = await source.search("sodium-ion layered oxide cathode", SearchFilters())
        assert [item.landing_url for item in flow] == ["https://news.mit.edu/flow-battery"]
        assert [item.landing_url for item in sodium] == ["https://news.mit.edu/sodium"]
    asyncio.run(run())


def test_thermal_storage_news_anchor_matches_specific_topic_not_generic_energy_or_ai():
    expected = {"thermal energy storage", "thermal storage", "heat storage"}
    for query in ("储热", "热储能", "thermal energy storage", "thermal storage", "heat storage"):
        assert topic_terms(query) == expected
    assert topic_terms("flow battery") == {"flow battery", "flow batteries"}
    xml = """<rss><channel>
    <item><title>AI improves generic energy forecasting</title><link>https://news.mit.edu/ai-energy</link></item>
    <item><title>Thermal energy storage advances</title><link>https://news.mit.edu/thermal-storage</link></item>
    </channel></rss>"""
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda _: httpx.Response(200, text=xml))) as client:
            items = await ResearchNewsSource(client, FEEDS[0]).search("储热", SearchFilters())
        assert [item.landing_url for item in items] == ["https://news.mit.edu/thermal-storage"]
    asyncio.run(run())


def test_new_energy_feeds_keep_article_domains_and_ignore_unrelated_solar_system():
    feeds = {feed[0]: feed for feed in FEEDS}
    xml = """<rss><channel>
    <item><title>Solar system discovery</title><link>https://www.sciencedaily.com/releases/2026/10/solar-system.htm</link></item>
    <item><title>Solar cells improve electricity production</title><link>https://www.sciencedaily.com/releases/2026/10/solar-cells.htm</link></item>
    <item><title>Energy storage advances</title><link>https://www.sciencedaily.com.evil.test/storage</link></item>
    <item><title>Battery breakthrough</title><link>javascript:alert(1)</link></item>
    </channel></rss>"""
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda _: httpx.Response(200, text=xml))) as client:
            items = await ResearchNewsSource(client, feeds["science-daily-energy"]).search("", SearchFilters())
        assert [item.landing_url for item in items] == ["https://www.sciencedaily.com/releases/2026/10/solar-cells.htm"]
        assert "媒体" in items[0].journal
        assert "官方" in feeds["eia-energy"][1]
        assert "媒体" in feeds["clean-energy-wire"][1]
    asyncio.run(run())


def test_clean_energy_wire_accepts_news_articles_only():
    feed = next(feed for feed in FEEDS if feed[0] == "clean-energy-wire")
    xml = """<rss><channel>
    <item><title>Renewable electricity expands</title><link>https://www.cleanenergywire.org/news/grid-expansion</link></item>
    <item><title>Energy webinar</title><link>https://www.cleanenergywire.org/webinar/energy</link></item>
    <item><title>Energy grants</title><link>https://www.cleanenergywire.org/grants/energy</link></item>
    <item><title>Energy grant</title><link>https://www.cleanenergywire.org/grant/energy</link></item>
    <item><title>Energy experts</title><link>https://www.cleanenergywire.org/experts/energy</link></item>
    </channel></rss>"""
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(lambda _: httpx.Response(200, text=xml))) as client:
            items = await ResearchNewsSource(client, feed).search("", SearchFilters())
        assert [item.landing_url for item in items] == ["https://www.cleanenergywire.org/news/grid-expansion"]
    asyncio.run(run())


def test_multi_source_digest_keeps_cached_failed_feed_and_deduplicates_urls():
    requests = []
    failing_eia = False
    def handler(request):
        requests.append(str(request.url))
        if failing_eia and "eia.gov" in request.url.host:
            return httpx.Response(503)
        if "eia.gov" in request.url.host:
            title, link = "Natural gas energy report", "https://www.eia.gov/todayinenergy/detail.php?id=1"
        elif "cleanenergywire.org" in request.url.host:
            title, link = "Renewable electricity expands", "https://www.cleanenergywire.org/news/example"
        elif "sciencedaily.com" in request.url.host:
            title, link = "New solar cells boost power", "https://www.sciencedaily.com/releases/2026/10/example.htm"
        else:
            title, link = "AI improves battery energy storage", "https://news.mit.edu/2026/one"
        xml = f"<rss><channel><item><title>{title}</title><link>{link}</link></item></channel></rss>"
        return httpx.Response(200, text=xml)
    @asynccontextmanager
    async def factory():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            yield client
    async def run():
        nonlocal failing_eia
        digest = ResearchNewsDigest(factory)
        first = await digest.latest()
        assert len(first["items"]) == 4
        assert len({item["url"] for item in first["items"]}) == 4
        failing_eia = True
        digest._expires_at = datetime.min
        second = await digest.latest()
        assert len(requests) == 2 * len(FEEDS)
        assert len(second["items"]) == 4
        assert any(item["source"].startswith("EIA") for item in second["items"])
        assert any("EIA" in warning for warning in second["warnings"])
    asyncio.run(run())
