"""Bounded public research news feeds for topic subscriptions; no model calls."""

import asyncio
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import html
import re
from urllib.parse import urlparse
from xml.etree import ElementTree

from app.paper_sources.base import SearchFilters, SourcePaper

FEEDS = (
    ("mit-energy", "MIT News · 能源", "https://news.mit.edu/rss/topic/energy"),
    ("mit-ai", "MIT News · 人工智能", "https://news.mit.edu/rss/topic/artificial-intelligence2"),
    ("eia-energy", "EIA · 美国能源信息署（官方）", "https://www.eia.gov/rss/todayinenergy.xml"),
    ("clean-energy-wire", "Clean Energy Wire · 能源新闻（媒体）", "https://www.cleanenergywire.org/rss.xml"),
    ("science-daily-energy", "ScienceDaily · 能源与资源（媒体）", "https://www.sciencedaily.com/rss/matter_energy/energy_and_resources.xml"),
)
ENERGY_TERMS = {
    "energy", "energy storage", "electricity", "renewable", "renewables", "battery", "batteries",
    "solar cell", "solar cells", "solar power", "solar panel", "solar farm", "photovoltaic",
    "wind power", "wind farm", "wind turbine", "hydrogen", "fuel cell", "electric grid", "power grid",
    "decarbonization", "geothermal", "nuclear", "fusion", "natural gas", "petroleum",
    "propane", "crude oil", "coal", "fossil fuel",
}
DAILY_TERMS = {
    "mit-ai": {"artificial intelligence", "ai", "machine learning", "deep learning", "neural network", "neural networks", "language model", "language models", "algorithm", "algorithms", "algorithmic", "robot", "robots", "robotics", "robotic", "generative"},
    "mit-energy": ENERGY_TERMS,
    "eia-energy": ENERGY_TERMS,
    "clean-energy-wire": ENERGY_TERMS,
    "science-daily-energy": ENERGY_TERMS - {"energy"},
}
TOPIC_TERMS = {
    "能源": ("energy",), "储能": ("storage", "battery"), "电池": ("battery", "batteries"),
    "光伏": ("solar", "photovoltaic"), "风电": ("wind",), "氢": ("hydrogen",),
    "钠": ("sodium",), "锂": ("lithium",), "人工智能": ("artificial intelligence", "machine learning", "ai"),
    "大模型": ("language model", "llm"), "机器学习": ("machine learning",),
}


def topic_terms(query: str) -> set[str]:
    lowered = query.lower()
    anchors = (
        (("储热", "热储能", "thermal energy storage", "thermal storage", "heat storage"), ("thermal energy storage", "thermal storage", "heat storage")),
        (("flow battery", "flow batteries", "液流"), ("flow battery", "flow batteries")),
        (("sodium", "钠"), ("sodium", "sodium-ion", "sodium ion")),
        (("lithium", "锂"), ("lithium", "lithium-ion", "lithium ion")),
        (("hydrogen", "氢"), ("hydrogen",)),
        (("photovoltaic", "solar", "光伏"), ("photovoltaic", "solar")),
        (("wind", "风电"), ("wind",)),
        (("language model", "llm", "大模型"), ("language model", "language models", "llm")),
        (("battery", "batteries", "电池"), ("battery", "batteries")),
    )
    for keywords, equivalents in anchors:
        if any(keyword in lowered for keyword in keywords):
            return set(equivalents)
    terms = set(re.findall(r"[a-z][a-z0-9-]{1,}", lowered)) - {"and", "or", "the", "for", "of", "in", "research", "paper", "papers", "oxide", "cathode", "layered", "flow"}
    for keyword, equivalents in TOPIC_TERMS.items():
        if keyword in query:
            terms.update(equivalents)
    return terms


class ResearchNewsSource:
    def __init__(self, client, feed: tuple[str, str, str]):
        self.client = client
        self.name, self.label, self.url = feed
        feed_host = urlparse(self.url).hostname
        self.allowed_hosts = {feed_host, feed_host.removeprefix("www.") if feed_host.startswith("www.") else f"www.{feed_host}"}

    async def search(self, query: str, filters: SearchFilters) -> list[SourcePaper]:
        terms = topic_terms(query) if query else DAILY_TERMS[self.name]
        if query and not terms:
            return []
        response = await self.client.get(self.url, timeout=15, follow_redirects=True)
        response.raise_for_status()
        if len(response.content) > 2 * 1024 * 1024:
            raise ValueError("news feed too large")
        root = ElementTree.fromstring(response.content)
        papers = []
        for item in root.findall("./channel/item")[:50]:
            title = html.unescape(item.findtext("title", "")).strip()
            url = item.findtext("link", "").strip()
            description = html.unescape(re.sub(r"<[^>]+>", " ", item.findtext("description", "")))
            text = f"{title} {description}".lower()
            try:
                article_url = urlparse(url)
            except ValueError:
                continue
            if not title or article_url.scheme not in {"http", "https"} or article_url.hostname not in self.allowed_hosts or (terms and not any(re.search(r"\b" + re.escape(term) + r"\b", text) for term in terms)):
                continue
            if self.name == "clean-energy-wire" and not article_url.path.startswith("/news/"):
                continue
            published = None
            try:
                published = parsedate_to_datetime(item.findtext("pubDate", "")).astimezone(timezone.utc).date()
            except (ValueError, TypeError, OverflowError):
                pass
            papers.append(SourcePaper(
                source=self.name, external_id=url, title=title, normalized_title=title.lower(),
                authors=(), first_author="", abstract=description.strip()[:2000], doi=None, arxiv_id=None,
                journal=self.label, published_date=published.isoformat() if published else None,
                year=published.year if published else None, keywords=(), landing_url=url,
                pdf_url=None, is_open_access=True, oa_status="public", license=None, article_type="news",
            ))
            if len(papers) == 10:
                break
        return papers


class ResearchNewsDigest:
    """One shared hourly cache per app, preserving prior items on feed failures."""

    def __init__(self, client_factory):
        self._client_factory = client_factory
        self._cache = None
        self._expires_at = datetime.min
        self._lock = asyncio.Lock()

    async def latest(self):
        async with self._lock:
            now = datetime.utcnow()
            if self._cache is not None and now < self._expires_at:
                return self._cache
            async with self._client_factory() as client:
                outcomes = await asyncio.gather(*(ResearchNewsSource(client, feed).search("", SearchFilters()) for feed in FEEDS), return_exceptions=True)
            items = []
            warnings = []
            for feed, outcome in zip(FEEDS, outcomes):
                if isinstance(outcome, Exception):
                    warnings.append(f"{feed[1]} 暂时无法获取，稍后会重试。")
                    if self._cache:
                        items.extend(item for item in self._cache["items"] if item["source"] == feed[1])
                else:
                    items.extend(dict(title=paper.title, source=paper.journal, url=paper.landing_url, published_date=paper.published_date, summary=paper.abstract) for paper in outcome)
            items = list({item["url"]: item for item in items}.values())
            items.sort(key=lambda item: item["published_date"] or "", reverse=True)
            self._cache = {"items": items, "warnings": warnings, "fetched_at": now}
            self._expires_at = now + timedelta(minutes=5 if warnings else 60)
            return self._cache
