"""Parse public WeChat article URLs linked from official campus HTML pages.

This module never opens the returned URLs; it stores only the URL and visible
anchor label from the official origin page.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from html.parser import HTMLParser
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


_ARTICLE_ID = re.compile(r"^[A-Za-z0-9_-]{4,160}$")
_DATE_ONLY = re.compile(r"^(?:\d{1,2}|\d{4}|(?:\d{4}[-/.年])?\d{1,2}(?:[-/.月]\d{1,2}日?)?)$")
_EXCLUDED_TITLE = ("名单", "通讯录", "学员信息", "个人信息", "公众号主页", "联系我们", "栏目导航")


@dataclass(frozen=True)
class PublicLinkCandidate:
    url: str
    title: str
    published_on: None = None


def normalize_public_link(value: str) -> str | None:
    """Return a canonical HTTPS article URL only for documented public forms."""
    try:
        parts = urlsplit(value.strip())
        if parts.scheme.lower() not in {"http", "https"} or parts.hostname != "mp.weixin.qq.com":
            return None
        if parts.username is not None or parts.password is not None or parts.port is not None:
            return None
        if parts.fragment and parts.fragment not in {"rd", "wechat_redirect"}:
            return None
        if parts.path == "/s/" or parts.path == "/s":
            if parts.path != "/s" or not parts.query:
                return None
            pairs = parse_qsl(parts.query, keep_blank_values=True, strict_parsing=True)
            required = ("__biz", "mid", "idx", "sn")
            values: dict[str, str] = {}
            for key, item in pairs:
                if key in required:
                    if key in values or not item:
                        return None
                    values[key] = item
            if any(key not in values for key in required):
                return None
            canonical_query = urlencode([(key, values[key]) for key in required])
            return urlunsplit(("https", "mp.weixin.qq.com", "/s", canonical_query, ""))
        match = re.fullmatch(r"/s/([^/]+)", parts.path)
        if not match or not _ARTICLE_ID.fullmatch(match.group(1)):
            return None
        return urlunsplit(("https", "mp.weixin.qq.com", parts.path, "", ""))
    except (ValueError, TypeError):
        return None


class _ArticleAnchors(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.items: list[tuple[str, str, str]] = []
        self._anchor: tuple[str, str] | None = None
        self._text: list[str] = []
        self._ignored_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag.lower() in {"script", "style"}:
            self._ignored_depth += 1
            return
        if tag.lower() != "a" or self._anchor is not None:
            return
        values = dict(attrs)
        href = values.get("href", "")
        title = values.get("title", "")
        self._anchor = (href, title)
        self._text = []

    def handle_data(self, data: str) -> None:
        if self._anchor is not None and self._ignored_depth == 0:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style"}:
            self._ignored_depth = max(0, self._ignored_depth - 1)
            return
        if tag.lower() != "a" or self._anchor is None:
            return
        href, title_attr = self._anchor
        visible = " ".join("".join(self._text).split())
        self.items.append((href, visible, title_attr.strip()))
        self._anchor = None
        self._text = []


def extract_public_links(html: str, source_page_url: str) -> list[PublicLinkCandidate]:
    """Extract article links and anchor labels; dates remain unknown absent evidence."""
    del source_page_url  # Origin is supplied separately by the collector.
    parser = _ArticleAnchors()
    parser.feed(html)
    result: list[PublicLinkCandidate] = []
    seen: set[str] = set()
    for href, visible, title_attr in parser.items:
        url = normalize_public_link(href)
        if not url or url in seen:
            continue
        title = visible or title_attr
        title = " ".join(title.split())
        if not title or _DATE_ONLY.fullmatch(title) or any(word in title for word in _EXCLUDED_TITLE):
            continue
        seen.add(url)
        result.append(PublicLinkCandidate(url=url, title=title[:500]))
    return result
