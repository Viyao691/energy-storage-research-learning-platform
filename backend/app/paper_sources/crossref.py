"""Crossref Works adapter."""

from __future__ import annotations

from html.parser import HTMLParser
from typing import Any
from urllib.parse import quote

import httpx

from app.paper_identity import normalize_doi, normalize_title

from .base import (
    HttpPaperSource,
    SearchFilters,
    SourcePaper,
    SourceRequestError,
    parse_date_parts,
)


_SELECT_FIELDS = (
    "DOI,title,author,abstract,container-title,published,URL,subject,"
    "type,is-referenced-by-count"
)


class _MarkupTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def _plain_text(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    parser = _MarkupTextParser()
    parser.feed(value)
    parser.close()
    return " ".join("".join(parser.parts).split())


def _first_text(value: Any) -> str:
    if not isinstance(value, list) or not value:
        return ""
    return _plain_text(value[0])


class CrossrefSource(HttpPaperSource):
    name = "crossref"

    def __init__(
        self,
        client: httpx.AsyncClient,
        base_url: str = "https://api.crossref.org",
        timeout: float = 10,
        mailto: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        super().__init__(client, base_url, timeout)
        self.mailto = (mailto or "").strip()
        self.user_agent = (
            user_agent.strip()
            if user_agent and user_agent.strip()
            else "EnergyResearchCopilot/2.0"
        )

    @property
    def _headers(self) -> dict[str, str]:
        return {"User-Agent": self.user_agent}

    async def search(
        self,
        query: str,
        filters: SearchFilters,
    ) -> list[SourcePaper]:
        params: dict[str, str | int] = {
            "query.bibliographic": query,
            "rows": filters.limit,
            "select": _SELECT_FIELDS,
        }
        if self.mailto:
            params["mailto"] = self.mailto
        source_filters: list[str] = []
        if filters.year_from is not None:
            source_filters.append(f"from-pub-date:{filters.year_from:04d}-01-01")
        if filters.year_to is not None:
            source_filters.append(f"until-pub-date:{filters.year_to:04d}-12-31")
        if source_filters:
            params["filter"] = ",".join(source_filters)

        payload = await self._get_json(
            "/works",
            operation="search",
            params=params,
            headers=self._headers,
        )
        if not isinstance(payload, dict):
            raise SourceRequestError(self.name, "search")
        message = payload.get("message")
        if not isinstance(message, dict):
            raise SourceRequestError(self.name, "search")
        records = message.get("items")
        if not isinstance(records, list):
            raise SourceRequestError(self.name, "search")
        papers = [
            paper
            for record in records
            if isinstance(record, dict)
            and (paper := self._map_record(record)) is not None
        ]
        if filters.open_access_only:
            return []
        return papers

    async def get_by_id(self, external_id: str) -> SourcePaper:
        payload = await self._get_json(
            f"/works/{quote(external_id, safe='')}",
            operation="get_by_id",
            params={"select": _SELECT_FIELDS},
            headers=self._headers,
        )
        if not isinstance(payload, dict):
            raise SourceRequestError(self.name, "get_by_id")
        record = payload.get("message")
        if not isinstance(record, dict):
            raise SourceRequestError(self.name, "get_by_id")
        paper = self._map_record(record)
        if paper is None:
            raise SourceRequestError(self.name, "get_by_id")
        return paper

    def _map_record(self, record: dict[str, Any]) -> SourcePaper | None:
        doi = normalize_doi(record.get("DOI"))
        title = _first_text(record.get("title"))
        if not doi or not title:
            return None

        author_records = record.get("author")
        authors: list[str] = []
        if isinstance(author_records, list):
            for author in author_records:
                if not isinstance(author, dict):
                    continue
                name = " ".join(
                    part
                    for part in (
                        _plain_text(author.get("given")),
                        _plain_text(author.get("family")),
                    )
                    if part
                )
                if name:
                    authors.append(name)

        published_date, year = _published_date(record)
        subjects = record.get("subject")
        keywords = tuple(
            subject
            for value in subjects
            if (subject := _plain_text(value))
        ) if isinstance(subjects, list) else ()

        return SourcePaper(
            source=self.name,
            external_id=doi,
            title=title,
            normalized_title=normalize_title(title),
            authors=tuple(authors),
            first_author=authors[0] if authors else "",
            abstract=_plain_text(record.get("abstract")),
            doi=doi,
            arxiv_id=None,
            journal=_first_text(record.get("container-title")),
            published_date=published_date,
            year=year,
            keywords=keywords,
            landing_url=_plain_text(record.get("URL")) or f"https://doi.org/{doi}",
            pdf_url=None,
            is_open_access=False,
            oa_status="closed",
            license=None,
            article_type=_plain_text(record.get("type")),
            citation_count=(
                record["is-referenced-by-count"]
                if type(record.get("is-referenced-by-count")) is int
                and record["is-referenced-by-count"] >= 0
                else 0
            ),
        )


def _published_date(record: dict[str, Any]) -> tuple[str | None, int | None]:
    for field in ("published", "published-print", "published-online", "issued"):
        value = record.get(field)
        if not isinstance(value, dict):
            continue
        published_date, year = parse_date_parts(value.get("date-parts"))
        if published_date is not None:
            return published_date, year
    return None, None
