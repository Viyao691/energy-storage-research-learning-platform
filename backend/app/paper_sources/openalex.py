"""OpenAlex Works adapter."""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

import httpx

from app.paper_identity import normalize_doi, normalize_title

from .base import (
    HttpPaperSource,
    SearchFilters,
    SourcePaper,
    SourceRequestError,
    parse_published_date,
    parse_year,
)


_FIELDS = (
    "id,display_name,title,doi,authorships,abstract_inverted_index,"
    "primary_location,publication_date,publication_year,keywords,"
    "open_access,best_oa_location,type,cited_by_count"
)


def _text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def _abstract(inverted_index: Any) -> str:
    if not isinstance(inverted_index, dict):
        return ""
    positioned_words: list[tuple[int, str]] = []
    for word, positions in inverted_index.items():
        if not isinstance(word, str) or not isinstance(positions, list):
            continue
        for position in positions:
            if isinstance(position, int):
                positioned_words.append((position, word))
    positioned_words.sort(key=lambda item: item[0])
    return " ".join(word for _, word in positioned_words)


class OpenAlexSource(HttpPaperSource):
    name = "openalex"

    def __init__(
        self,
        client: httpx.AsyncClient,
        base_url: str = "https://api.openalex.org",
        timeout: float = 10,
    ) -> None:
        super().__init__(client, base_url, timeout)

    async def search(
        self,
        query: str,
        filters: SearchFilters,
    ) -> list[SourcePaper]:
        params: dict[str, str | int] = {
            "search": query,
            "per-page": filters.limit,
            "select": _FIELDS,
        }
        source_filters: list[str] = []
        if filters.year_from is not None:
            source_filters.append(
                f"from_publication_date:{filters.year_from:04d}-01-01"
            )
        if filters.year_to is not None:
            source_filters.append(
                f"to_publication_date:{filters.year_to:04d}-12-31"
            )
        if filters.open_access_only:
            source_filters.append("is_oa:true")
        if source_filters:
            params["filter"] = ",".join(source_filters)

        payload = await self._get_json(
            "/works",
            operation="search",
            params=params,
        )
        if not isinstance(payload, dict):
            raise SourceRequestError(self.name, "search")
        records = payload.get("results")
        if not isinstance(records, list):
            raise SourceRequestError(self.name, "search")
        return [
            paper
            for record in records
            if isinstance(record, dict)
            and (paper := self._map_record(record)) is not None
        ]

    async def get_by_id(self, external_id: str) -> SourcePaper:
        payload = await self._get_json(
            f"/works/{quote(external_id, safe='')}",
            operation="get_by_id",
            params={"select": _FIELDS},
        )
        if not isinstance(payload, dict):
            raise SourceRequestError(self.name, "get_by_id")
        paper = self._map_record(payload)
        if paper is None:
            raise SourceRequestError(self.name, "get_by_id")
        return paper

    def _map_record(self, record: dict[str, Any]) -> SourcePaper | None:
        external_id = _text(record.get("id"))
        title = _text(record.get("display_name")) or _text(record.get("title"))
        if not external_id or not title:
            return None

        authorships = record.get("authorships")
        authors = tuple(
            name
            for authorship in authorships
            if isinstance(authorship, dict)
            and isinstance(authorship.get("author"), dict)
            and (name := _text(authorship["author"].get("display_name")))
        ) if isinstance(authorships, list) else ()

        primary_location = record.get("primary_location")
        if not isinstance(primary_location, dict):
            primary_location = {}
        source = primary_location.get("source")
        journal = _text(source.get("display_name")) if isinstance(source, dict) else ""

        keyword_records = record.get("keywords")
        keywords = tuple(
            keyword
            for item in keyword_records
            if isinstance(item, dict)
            and (keyword := _text(item.get("display_name")))
        ) if isinstance(keyword_records, list) else ()

        open_access = record.get("open_access")
        if not isinstance(open_access, dict):
            open_access = {}
        is_open_access = open_access.get("is_oa") is True
        best_oa_location = record.get("best_oa_location")
        if not isinstance(best_oa_location, dict):
            best_oa_location = {}
        pdf_url = _text(best_oa_location.get("pdf_url")) or None
        if not is_open_access:
            pdf_url = None

        published_date, date_year = parse_published_date(
            record.get("publication_date")
        )
        year = parse_year(record.get("publication_year")) or date_year

        return SourcePaper(
            source=self.name,
            external_id=external_id,
            title=title,
            normalized_title=normalize_title(title),
            authors=authors,
            first_author=authors[0] if authors else "",
            abstract=_abstract(record.get("abstract_inverted_index")),
            doi=normalize_doi(record.get("doi")),
            arxiv_id=None,
            journal=journal,
            published_date=published_date,
            year=year,
            keywords=keywords,
            landing_url=_text(primary_location.get("landing_page_url")) or external_id,
            pdf_url=pdf_url,
            is_open_access=is_open_access,
            oa_status=(
                _text(open_access.get("oa_status")).lower() or "open"
                if is_open_access
                else "closed"
            ),
            license=_text(best_oa_location.get("license")) or None,
            article_type=_text(record.get("type")),
            citation_count=(
                record["cited_by_count"]
                if type(record.get("cited_by_count")) is int
                and record["cited_by_count"] >= 0
                else 0
            ),
        )
