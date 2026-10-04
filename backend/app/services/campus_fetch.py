"""Bounded public HTML fetcher for the fixed official source catalogue."""

from __future__ import annotations

import asyncio
import re
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urljoin, urlsplit
from urllib.robotparser import RobotFileParser

import httpx

from app.campus_sources import ALLOWED_HOSTS


class FetchBlocked(RuntimeError):
    def __init__(self, message: str, *, status: int | None = None,
                 retry_after: timedelta | None = None, login_required: bool = False) -> None:
        super().__init__(message)
        self.status = status
        self.retry_after = retry_after
        self.login_required = login_required


def _retry_after(value: str | None) -> timedelta | None:
    if not value:
        return None
    if value.isdecimal():
        return timedelta(seconds=max(60, int(value)))
    try:
        target = parsedate_to_datetime(value)
        if target.tzinfo is not None:
            return max(timedelta(minutes=1), target - datetime.now(timezone.utc))
    except (TypeError, ValueError, OverflowError):
        pass
    return None


class CampusFetcher:
    USER_AGENT = "EnergyResearchCopilotCampus/1.0 (+public notice index; no login)"

    def __init__(self, client: httpx.AsyncClient, *, delay: float = 1.5) -> None:
        self.client = client
        self.delay = delay
        self._last: dict[str, float] = {}
        self._robots: dict[str, RobotFileParser | None] = {}
        self._robots_status: dict[str, str] = {}
        self._robots_checked: dict[str, float] = {}
        self._host_delay: dict[str, float] = {}

    @staticmethod
    def _host(url: str) -> str:
        parsed = urlsplit(url)
        if (parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS or
                parsed.username or parsed.password or parsed.port is not None):
            raise FetchBlocked("仅允许预设的公开校方 HTTPS 来源")
        return parsed.hostname

    def robots_status(self, host: str) -> str:
        return self._robots_status.get(host, "unchecked")

    async def _pace(self, host: str) -> None:
        moment = asyncio.get_running_loop().time()
        previous = self._last.get(host)
        required = max(self.delay, self._host_delay.get(host, 0))
        if previous is not None and required:
            await asyncio.sleep(max(0, required - (moment-previous)))
        self._last[host] = asyncio.get_running_loop().time()

    async def _request(self, url: str, *, html: bool = True) -> tuple[int, str, str | None]:
        host = self._host(url)
        await self._pace(host)
        try:
            async with self.client.stream("GET", url, headers={"User-Agent": self.USER_AGENT,
                                                   "Accept": "text/html,text/plain;q=0.8"},
                                          timeout=15, follow_redirects=False) as response:
                status = response.status_code
                location = response.headers.get("location")
                if status in (401, 403, 429):
                    raise FetchBlocked(f"访问受限（HTTP {status}）", status=status,
                                       retry_after=_retry_after(response.headers.get("retry-after")) if status == 429 else None,
                                       login_required=status == 401)
                if status >= 500:
                    raise FetchBlocked(f"站点暂不可用（HTTP {status}）")
                if 300 <= status < 400:
                    return status, "", location
                if status not in (200, 404):
                    raise FetchBlocked(f"HTTP {status}")
                content_type = response.headers.get("content-type", "")
                if html and status == 200 and content_type and not any(t in content_type.lower() for t in ("html", "text/plain")):
                    raise FetchBlocked("页面不是 HTML")
                chunks: list[bytes] = []
                size = 0
                async for chunk in response.aiter_bytes():
                    size += len(chunk)
                    if size > 2_000_000:
                        raise FetchBlocked("页面超过 2 MB 限额")
                    chunks.append(chunk)
                encoding = response.encoding or "utf-8"
                try:
                    body = b"".join(chunks).decode(encoding, errors="replace")
                except LookupError:
                    body = b"".join(chunks).decode("utf-8", errors="replace")
                return status, body, None
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            raise FetchBlocked(f"连接失败：{type(exc).__name__}") from exc

    async def _check_robots(self, url: str) -> None:
        host = self._host(url)
        now = asyncio.get_running_loop().time()
        if host not in self._robots or now - self._robots_checked.get(host, 0) >= 12 * 3600:
            status, body, _ = await self._request(f"https://{host}/robots.txt", html=False)
            if status == 404:
                self._robots[host] = None
                self._robots_status[host] = "missing_404"
                self._host_delay.pop(host, None)
            elif status == 200:
                if body.lstrip().startswith("<") or (body.strip() and not re.search(r"(?im)^\s*user-agent\s*:", body)):
                    self._robots_status[host] = "unreadable"
                    raise FetchBlocked("robots.txt 内容不可识别")
                parser = RobotFileParser()
                parser.parse(body.splitlines())
                self._robots[host] = parser
                self._robots_status[host] = "checked"
                crawl_delay = parser.crawl_delay(self.USER_AGENT) or parser.crawl_delay("*")
                if crawl_delay:
                    self._host_delay[host] = float(crawl_delay)
            else:
                self._robots_status[host] = "unavailable"
                raise FetchBlocked("无法检查 robots.txt")
            self._robots_checked[host] = now
        rules = self._robots[host]
        if rules is not None and not rules.can_fetch(self.USER_AGENT, url):
            raise FetchBlocked("robots.txt 禁止读取该页面")

    async def html(self, url: str) -> str:
        for _ in range(3):
            if re.search(r"(?:^|/)(?:clogin|login|sso)(?:\.|/|$)", urlsplit(url).path, re.I):
                raise FetchBlocked("页面需要登录，公开采集暂停", login_required=True)
            await self._check_robots(url)
            status, body, location = await self._request(url)
            if status == 200:
                if (re.search(r"(?:^|/)(?:clogin|login|sso)(?:\.|/|$)", urlsplit(url).path, re.I)
                        or (re.search(r"(?:统一身份认证|账号密码登录|请先登录|登录后访问)", body[:3000])
                            and re.search(r"<form\b", body[:3000], re.I))):
                    raise FetchBlocked("页面需要登录，公开采集暂停", login_required=True)
                return body
            if 300 <= status < 400 and location:
                redirected = urljoin(url, location)
                self._host(redirected)
                url = redirected
                continue
            raise FetchBlocked(f"HTTP {status}")
        raise FetchBlocked("重定向次数过多")
