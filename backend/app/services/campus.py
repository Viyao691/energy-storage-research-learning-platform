"""Low-rate campus source polling and persisted, traceable in-app reminders."""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
from collections.abc import Callable
from contextlib import suppress
from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.campus_models import CampusEvent, CampusNotice, CampusPage, CampusPublicLink, CampusSource
from app.services.campus_fetch import CampusFetcher, FetchBlocked
from app.services.campus_analysis import CampusAnalyzer
from app.services.campus_parse import classify, discover, is_recent_enough_to_alert, parse_notice
from app.services.campus_public_links import extract_public_links


_LOGGER = logging.getLogger("energy_research.campus")

def _clean_title(title: str) -> str:
    value = title.strip()
    # Remove date ornaments inserted by different list templates, preserving
    a = re.sub(r"^\d{4}[-./]\d{1,2}[-./]\d{1,2}\s+", "", value)
    a = re.sub(r"^\d{1,2}[-./]\d{1,2}\s+\d{4}\s+", "", a)
    a = re.sub(r"^\d{1,2}\s+\d{4}[-./]\d{1,2}\s+", "", a)
    return a


def _identity(title: str, dates: list[dict[str, str]], published_on: date | None, url: str) -> str:
    normalized = re.sub(r"[^\w\u4e00-\u9fff]+", "", _clean_title(title).casefold())[:300]
    year = (dates[0]["day"][:4] if dates else str(published_on.year) if published_on else "")
    if not year:
        return hashlib.sha256(url.encode()).hexdigest()
    return hashlib.sha256(f"{normalized}:{year}".encode()).hexdigest()


def _fingerprint(title: str, excerpt: str, dates: list[dict[str, str]]) -> str:
    data = json.dumps([title, excerpt, dates], ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(data.encode()).hexdigest()


def _dates(value: str) -> list[dict[str, str]]:
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return []


def campus_today(now: datetime) -> date:
    utc = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    return utc.astimezone(ZoneInfo("Asia/Shanghai")).date()


def feed_status(dates: list[dict[str, str]], published_on: date | None,
                today: date, conflict: bool, days: int = 90) -> tuple[str, str]:
    if conflict:
        return "unknown", "conflict"
    future = sorted(item["day"] for item in dates if item.get("day", "") >= today.isoformat())
    if future:
        return "recent", "future_date" if published_on is None or published_on < today - timedelta(days=days) else "published"
    if published_on is not None:
        if published_on > today:
            return "unknown", "unknown"
        if published_on >= today - timedelta(days=days):
            return "recent", "published"
        return "archive", "published"
    if dates:
        return "archive", "past_date"
    return "unknown", "unknown"


class CampusService:
    def __init__(self, session_factory: sessionmaker, *, client: httpx.AsyncClient | None = None,
                 delay: float = 1.5, now: Callable[[], datetime] = datetime.utcnow) -> None:
        self.session_factory = session_factory
        self._owns_client = client is None
        self.client = client or httpx.AsyncClient(trust_env=False)
        self.fetcher = CampusFetcher(self.client, delay=delay)
        self.analyzer = CampusAnalyzer(session_factory)
        self.now = now
        self._lock = asyncio.Lock()
        self._task: asyncio.Task[None] | None = None
        self._blocked_hosts: dict[str, datetime] = {}

    async def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        task, self._task = self._task, None
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
        if self._owns_client:
            await self.client.aclose()

    async def _loop(self) -> None:
        while True:
            try:
                await self.run_due_once()
                self.remind()
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                _LOGGER.error("campus scheduler check failed: %s", type(exc).__name__)
            await asyncio.sleep(60)

    async def run_due_once(self) -> int:
        if self._lock.locked():
            return 0
        async with self._lock:
            now = self.now()
            with self.session_factory() as db:
                ids = list(db.scalars(select(CampusSource.id).where(
                    CampusSource.enabled.is_(True),
                    (CampusSource.next_check_at.is_(None) | (CampusSource.next_check_at <= now)),
                ).order_by(CampusSource.priority.desc(), CampusSource.id)))
            processed = 0
            budget = 12
            for source_id in ids:
                if budget <= 0:
                    break
                used = await self._check_source(source_id, min(12, budget))
                budget -= used
                processed += 1
            await self.analyzer.drain(now, limit=2)
            return processed

    async def _check_source(self, source_id: int, detail_budget: int) -> int:
        now = self.now()
        with self.session_factory() as db:
            source = db.get(CampusSource, source_id)
            if source is None or not source.enabled or (source.next_check_at and source.next_check_at > now):
                return 0
            url = source.url
        host = urlsplit(url).hostname or ""
        blocked_until = self._blocked_hosts.get(host)
        if blocked_until and blocked_until > now:
            with self.session_factory() as db:
                source = db.get(CampusSource, source_id)
                if source and source.enabled:
                    source.status = "blocked"
                    source.detail = "同站点刚触发访问限制，已延后检查"
                    source.next_check_at = blocked_until
                    db.commit()
            return 0
        try:
            html = await self.fetcher.html(url)
            official_pages = [(url, html)]
            links, next_page = discover(html, url)
            if next_page:
                try:
                    next_html = await self.fetcher.html(next_page)
                    official_pages.append((next_page, next_html))
                    extra, _ = discover(next_html, next_page)
                    links.extend(extra)
                except FetchBlocked as exc:
                    if exc.status == 429:
                        raise
                    # First list remains useful; expose partial coverage below.
                    next_page = "failed"
            with self.session_factory() as db:
                source = db.get(CampusSource, source_id)
                if source is None or not source.enabled:
                    return 0
                candidates = [(page_url, candidate) for page_url, page_html in official_pages
                              for candidate in extract_public_links(page_html, page_url)]
                existing_public = {row.url: row for row in db.scalars(
                    select(CampusPublicLink).where(CampusPublicLink.source_id == source_id))}
                seen_public: set[str] = set()
                for page_url, candidate in candidates:
                    if candidate.url in seen_public:
                        continue
                    seen_public.add(candidate.url)
                    existing = existing_public.get(candidate.url)
                    if existing:
                        existing.title = candidate.title
                        existing.source_page_url = page_url
                        existing.last_seen_at = now
                        # No list-date evidence has been validated for this source; never
                        # substitute the collection time for a publication date.
                    else:
                        db.add(CampusPublicLink(source_id=source_id, source_page_url=page_url,
                                                url=candidate.url, title=candidate.title,
                                                published_on=None, first_seen_at=now, last_seen_at=now))
                public_link_count = len(seen_public)
                existing_pages = {page.url: page for page in db.scalars(
                    select(CampusPage).where(CampusPage.source_id == source_id))}
                seen_urls: set[str] = set()
                for link in links:
                    if link.url in seen_urls:
                        continue
                    seen_urls.add(link.url)
                    existing = existing_pages.get(link.url)
                    if existing:
                        existing.title = link.title
                        if link.published_on and not existing.publication_evidence:
                            existing.published_on = link.published_on
                            existing.publication_evidence = f"列表相邻日期：{link.published_on.isoformat()}"
                    else:
                        db.add(CampusPage(source_id=source_id, url=link.url, title=link.title,
                                          fingerprint="", dates_json="[]", last_error="",
                                          published_on=link.published_on,
                                          publication_evidence=(f"列表相邻日期：{link.published_on.isoformat()}"
                                                                if link.published_on else "")))
                source.last_checked_at = now
                source.robots_status = self.fetcher.robots_status(host)
                db.commit()
        except (FetchBlocked, ValueError) as exc:
            rate_limited = isinstance(exc, FetchBlocked) and exc.status == 429
            if rate_limited:
                self._blocked_hosts[host] = now + (exc.retry_after or timedelta(hours=24))
            with self.session_factory() as db:
                source = db.get(CampusSource, source_id)
                if source:
                    source.status = "blocked" if isinstance(exc, FetchBlocked) else "error"
                    source.detail = str(exc)[:300]
                    source.last_checked_at = now
                    source.next_check_at = self._blocked_hosts[host] if rate_limited else now + timedelta(hours=12)
                    source.robots_status = self.fetcher.robots_status(host)
                    if isinstance(exc, FetchBlocked) and exc.login_required:
                        source.access_state = "login_required"
                    elif "连接失败" in str(exc):
                        source.access_state = "unreachable"
                    db.commit()
            return 0

        # Oldest/unattempted first, including failures; a bad page cannot occupy
        # the first two slots forever. Failed attempts are persisted before I/O.
        with self.session_factory() as db:
            pages = list(db.scalars(select(CampusPage).where(CampusPage.source_id == source_id)
                                    .order_by(CampusPage.last_attempt_at.asc().nullsfirst(), CampusPage.id)
                                    .limit(detail_budget)))
            page_ids = [page.id for page in pages]
        failures = 0
        stopped = False
        for page_id in page_ids:
            with self.session_factory() as db:
                page = db.get(CampusPage, page_id)
                source = db.get(CampusSource, source_id)
                if not page or not source or not source.enabled:
                    continue
                page.last_attempt_at = now
                detail_url, title = page.url, page.title
                db.commit()
            try:
                body = await self.fetcher.html(detail_url)
                parsed = parse_notice(body, title, lecture="lecturenotice" in urlsplit(detail_url).path)
                with self.session_factory() as db:
                    event_id = self._store_page(db, page_id, title, parsed, now)
                    db.commit()
                if event_id and feed_status(parsed.dates, parsed.published_on,
                        campus_today(now), False)[0] in ("recent", "unknown"):
                    self.analyzer.enqueue(event_id, parsed.content_hash,
                                          parsed.title or title, parsed.model_text, detail_url, now)
            except (FetchBlocked, ValueError) as exc:
                failures += 1
                with self.session_factory() as db:
                    page = db.get(CampusPage, page_id)
                    if page:
                        page.last_error = str(exc)[:300]
                        db.commit()
                if isinstance(exc, FetchBlocked) and exc.status == 429:
                    self._blocked_hosts[host] = now + (exc.retry_after or timedelta(hours=24))
                    with self.session_factory() as db:
                        source = db.get(CampusSource, source_id)
                        if source:
                            source.status = "blocked"
                            source.detail = str(exc)[:300]
                            source.next_check_at = self._blocked_hosts[host]
                            db.commit()
                    stopped = True
                    break
        with self.session_factory() as db:
            source = db.get(CampusSource, source_id)
            if source and source.enabled and not stopped:
                link_only_page = public_link_count > 0 and not seen_urls
                source.status = "partial" if failures or next_page == "failed" or not seen_urls or link_only_page else "ok"
                source.detail = (f"发现 {len(seen_urls)} 条链接；本轮读取 {len(page_ids)} 条详情；失败 {failures} 条"
                                 + (f"；发现 {public_link_count} 条公众号外链，仅标题/链接，未读取正文" if link_only_page else "")
                                 + ("；下一页不可读" if next_page == "failed" else "")
                                 + ("；未识别公告链接，不能确认是否有新通知" if not seen_urls and not public_link_count else ""))[:300]
                source.last_success_at = now
                source.access_state = "public"
                source.next_check_at = now + timedelta(hours=12)
                db.commit()
        return len(page_ids)

    def _store_page(self, db: Session, page_id: int, title: str, parsed, now: datetime, *, notify: bool = True) -> int | None:
        page = db.get(CampusPage, page_id)
        if not page or not page.source.enabled:
            return None
        title = _clean_title(parsed.title or title)
        published = parsed.published_on or page.published_on
        fingerprint = _fingerprint(title, parsed.excerpt, parsed.dates)
        previous = page.fingerprint
        event = db.get(CampusEvent, page.event_id) if page.event_id else None
        created = False
        if event is None:
            identity = _identity(title, parsed.dates, published, page.url)
            event = db.scalar(select(CampusEvent).where(CampusEvent.identity == identity))
            if event is None:
                event = CampusEvent(identity=identity, title=title, category=parsed.category,
                                    excerpt=parsed.excerpt, dates_json=json.dumps(parsed.dates, ensure_ascii=False),
                                    published_on=published, priority=page.source.priority,
                                    followed=False, conflict=False, first_seen_at=now, updated_at=now)
                db.add(event)
                db.flush()
                created = True
            page.event_id = event.id
        changed = bool(previous and (previous != fingerprint or
                                    (page.content_hash and page.content_hash != parsed.content_hash)))
        page.fingerprint = fingerprint
        page.dates_json = json.dumps(parsed.dates, ensure_ascii=False)
        page.published_on = published
        if parsed.publication_evidence:
            page.publication_evidence = parsed.publication_evidence
        page.content_hash = parsed.content_hash
        page.last_error = ""
        # Prefer information from higher-priority sources; still keep every origin.
        if page.source.priority >= event.priority or created:
            event.title = title
            event.category = parsed.category
            event.excerpt = parsed.excerpt
            event.dates_json = page.dates_json
            event.published_on = published
            event.priority = page.source.priority
            if parsed.content_hash and parsed.content_hash != event.content_hash:
                event.content_hash = parsed.content_hash
                event.analysis_json = "{}"
        event.updated_at = now if changed else event.updated_at
        db.flush()
        origin_dates = {tuple(sorted((item["kind"], item["day"]) for item in _dates(row.dates_json))) for row in db.scalars(
            select(CampusPage).where(CampusPage.event_id == event.id, CampusPage.fingerprint != ""))
            if _dates(row.dates_json)}
        event.conflict = len(origin_dates) > 1
        if notify and created and is_recent_enough_to_alert(parsed.dates, published, campus_today(now)):
            self._notice(db, event, "new", "发现新的校园资讯", f"new:{event.id}", now)
        elif notify and changed and is_recent_enough_to_alert(parsed.dates, published, campus_today(now)):
            self._notice(db, event, "changed", "来源页面内容或日期有更新，请核对原文", f"changed:{event.id}:{fingerprint}", now)
        return event.id

    @staticmethod
    def _notice(db: Session, event: CampusEvent, kind: str, body: str, key: str, now: datetime) -> None:
        if db.scalar(select(CampusNotice.id).where(CampusNotice.dedupe_key == key)):
            return
        db.add(CampusNotice(event_id=event.id, title=event.title, body=body, kind=kind,
                            dedupe_key=key, created_at=now))

    def remind(self) -> int:
        now = self.now()
        count = 0
        with self.session_factory() as db:
            for event in db.scalars(select(CampusEvent).where(CampusEvent.followed.is_(True),
                                                                CampusEvent.conflict.is_(False))):
                active_origin = db.scalar(select(CampusPage.id).join(CampusSource).where(
                    CampusPage.event_id == event.id, CampusSource.enabled.is_(True)))
                if not active_origin:
                    continue
                for item in _dates(event.dates_json):
                    try:
                        remaining = (date.fromisoformat(item["day"]) - campus_today(now)).days
                    except (KeyError, ValueError):
                        continue
                    if 0 <= remaining <= 3:
                        key = f"due:{event.id}:{item['kind']}:{item['day']}:{remaining}"
                        if db.scalar(select(CampusNotice.id).where(CampusNotice.dedupe_key == key)):
                            continue
                        self._notice(db, event, "due", f"{item['kind']}日期 {item['day']}，还剩 {remaining} 天；请核对原文", key, now)
                        count += 1
            db.commit()
        return count
