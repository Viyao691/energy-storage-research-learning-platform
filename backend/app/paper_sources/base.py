"""Source-facing contracts and shared HTTP behavior for paper metadata."""

from __future__ import annotations

from datetime import date
from dataclasses import dataclass
import json
from typing import Any, Protocol

import httpx


MAX_SOURCE_RESPONSE_BYTES = 5 * 1024 * 1024


@dataclass(frozen=True)
class SearchFilters:
    year_from: int | None = None
    year_to: int | None = None
    open_access_only: bool = False
    limit: int = 20


@dataclass(frozen=True, kw_only=True)
class SourcePaper:
    source: str
    external_id: str
    title: str
    normalized_title: str
    authors: tuple[str, ...]
    first_author: str
    abstract: str
    doi: str | None
    arxiv_id: str | None
    journal: str
    published_date: str | None
    year: int | None
    keywords: tuple[str, ...]
    landing_url: str
    pdf_url: str | None
    is_open_access: bool
    oa_status: str
    license: str | None
    article_type: str = ""
    citation_count: int = 0


@dataclass(frozen=True)
class SourceStatus:
    enabled: bool
    ok: bool
    message: str


class SourceRequestError(RuntimeError):
    """A deliberately sanitized upstream request or parsing failure."""

    def __init__(self, source: str, operation: str) -> None:
        self.source = source
        self.operation = operation
        super().__init__(f"{source} {operation} failed")


class PaperSource(Protocol):
    name: str

    async def search(
        self,
        query: str,
        filters: SearchFilters,
    ) -> list[SourcePaper]: ...

    async def get_by_id(self, external_id: str) -> SourcePaper: ...

    async def healthcheck(self) -> SourceStatus: ...


class HttpPaperSource:
    """Small internal base that centralizes bounded, sanitized HTTP access."""

    name: str

    def __init__(
        self,
        client: httpx.AsyncClient,
        base_url: str,
        timeout: float,
    ) -> None:
        if client is None:
            raise TypeError("client must be an injected httpx.AsyncClient")
        self.client = client
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def _get_json(
        self,
        path: str,
        *,
        operation: str,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> Any:
        content = await self._get_bytes(
            path,
            operation=operation,
            params=params,
            headers=headers,
        )
        parse_failed = False
        try:
            payload = json.loads(content)
        except (UnicodeError, ValueError):
            parse_failed = True
            payload = None
        if parse_failed:
            raise SourceRequestError(self.name, operation)
        return payload

    async def _get_text(
        self,
        path: str,
        *,
        operation: str,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> str:
        content = await self._get_bytes(
            path,
            operation=operation,
            params=params,
            headers=headers,
        )
        decode_failed = False
        try:
            text = content.decode("utf-8")
        except UnicodeError:
            decode_failed = True
            text = ""
        if decode_failed:
            raise SourceRequestError(self.name, operation)
        return text

    async def _get_bytes(
        self,
        path: str,
        *,
        operation: str,
        params: dict[str, Any] | None,
        headers: dict[str, str] | None,
    ) -> bytes:
        url = f"{self.base_url}/{path.lstrip('/')}"
        request_failed = False
        response_too_large = False
        chunks: list[bytes] = []
        try:
            async with self.client.stream(
                "GET",
                url,
                params=params,
                headers=headers,
                timeout=self.timeout,
            ) as response:
                response.raise_for_status()
                content_length = response.headers.get("content-length", "")
                if content_length.isdigit():
                    response_too_large = (
                        int(content_length) > MAX_SOURCE_RESPONSE_BYTES
                    )
                total = 0
                if not response_too_large:
                    async for chunk in response.aiter_bytes():
                        total += len(chunk)
                        if total > MAX_SOURCE_RESPONSE_BYTES:
                            response_too_large = True
                            break
                        chunks.append(chunk)
        except httpx.HTTPError:
            request_failed = True
        if request_failed or response_too_large:
            raise SourceRequestError(self.name, operation)
        return b"".join(chunks)

    async def healthcheck(self) -> SourceStatus:
        try:
            await self.search("energy", SearchFilters(limit=1))
        except SourceRequestError:
            return SourceStatus(
                enabled=True,
                ok=False,
                message=f"{self.name} unavailable",
            )
        return SourceStatus(enabled=True, ok=True, message=f"{self.name} available")


def parse_year(value: Any) -> int | None:
    """Return a real calendar year, rejecting bool and invalid integers."""
    if type(value) is not int or not 1 <= value <= 9999:
        return None
    return value


def parse_published_date(value: Any) -> tuple[str | None, int | None]:
    """Validate an ISO date or timestamp and return its date and year."""
    if not isinstance(value, str):
        return None, None
    candidate = value.strip()[:10]
    if len(candidate) != 10:
        return None, None
    invalid = False
    try:
        parsed = date.fromisoformat(candidate)
    except ValueError:
        invalid = True
        parsed = None
    if invalid or parsed is None:
        return None, None
    return parsed.isoformat(), parsed.year


def parse_date_parts(value: Any) -> tuple[str | None, int | None]:
    """Validate a Crossref ``date-parts`` value."""
    if (
        not isinstance(value, list)
        or not value
        or not isinstance(value[0], list)
        or not value[0]
    ):
        return None, None
    parts = value[0]
    if len(parts) > 3 or any(type(part) is not int for part in parts):
        return None, None
    year = parts[0]
    month = parts[1] if len(parts) > 1 else 1
    day = parts[2] if len(parts) > 2 else 1
    invalid = False
    try:
        parsed = date(year, month, day)
    except ValueError:
        invalid = True
        parsed = None
    if invalid or parsed is None:
        return None, None
    return parsed.isoformat(), parsed.year
