"""Semantic Scholar Graph API adapter."""

from __future__ import annotations

from typing import Any
from urllib.parse import quote, urlsplit, urlunsplit

import httpx

from app.paper_identity import (
    normalize_arxiv_id,
    normalize_doi,
    normalize_title,
)

from .base import (
    HttpPaperSource,
    SearchFilters,
    SourcePaper,
    SourceRequestError,
    parse_published_date,
    parse_year,
)


_FIELDS = (
    "paperId,title,abstract,year,authors,externalIds,venue,"
    "publicationDate,url,isOpenAccess,openAccessPdf,publicationTypes,"
    "citationCount"
)


def _text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def _normalize_graph_api_base_url(base_url: str) -> str:
    if not isinstance(base_url, str) or not (candidate := base_url.strip()):
        raise ValueError("Semantic Scholar base URL must be a nonempty HTTP(S) URL")
    try:
        parsed = urlsplit(candidate)
        parsed.port
    except ValueError:
        raise ValueError("Semantic Scholar base URL is invalid") from None
    if (
        parsed.scheme.lower() not in {"http", "https"}
        or not parsed.netloc
        or parsed.hostname is None
        or any(character.isspace() for character in parsed.netloc)
    ):
        raise ValueError("Semantic Scholar base URL must be a valid HTTP(S) URL")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError("Semantic Scholar base URL must not contain credentials")
    if parsed.query or parsed.fragment:
        raise ValueError("Semantic Scholar base URL must not contain query or fragment")

    segments = [segment for segment in parsed.path.split("/") if segment]
    base_segments: list[str] = []
    index = 0
    while index < len(segments):
        if segments[index : index + 2] == ["graph", "v1"]:
            index += 2
        else:
            base_segments.append(segments[index])
            index += 1
    normalized_path = "/" + "/".join((*base_segments, "graph", "v1"))
    return urlunsplit(
        (parsed.scheme.lower(), parsed.netloc, normalized_path, "", "")
    )


class SemanticScholarSource(HttpPaperSource):
    name = "semantic_scholar"

    def __init__(
        self,
        client: httpx.AsyncClient,
        base_url: str = "https://api.semanticscholar.org/graph/v1",
        timeout: float = 10,
        api_key: str | None = None,
    ) -> None:
        super().__init__(client, _normalize_graph_api_base_url(base_url), timeout)
        self.api_key = (api_key or "").strip()

    @property
    def _headers(self) -> dict[str, str] | None:
        if not self.api_key:
            return None
        return {"x-api-key": self.api_key}

    async def search(
        self,
        query: str,
        filters: SearchFilters,
    ) -> list[SourcePaper]:
        params: dict[str, str | int] = {
            "query": query,
            "limit": filters.limit,
            "fields": _FIELDS,
        }
        year_filter = _year_filter(filters.year_from, filters.year_to)
        if year_filter:
            params["year"] = year_filter
        payload = await self._get_json(
            "/paper/search",
            operation="search",
            params=params,
            headers=self._headers,
        )
        if not isinstance(payload, dict):
            raise SourceRequestError(self.name, "search")
        records = payload.get("data")
        if not isinstance(records, list):
            raise SourceRequestError(self.name, "search")
        papers = [
            paper
            for record in records
            if isinstance(record, dict)
            and (paper := self._map_record(record)) is not None
        ]
        if filters.open_access_only:
            return [paper for paper in papers if paper.is_open_access]
        return papers

    async def get_by_id(self, external_id: str) -> SourcePaper:
        payload = await self._get_json(
            f"/paper/{quote(external_id, safe='')}",
            operation="get_by_id",
            params={"fields": _FIELDS},
            headers=self._headers,
        )
        if not isinstance(payload, dict):
            raise SourceRequestError(self.name, "get_by_id")
        paper = self._map_record(payload)
        if paper is None:
            raise SourceRequestError(self.name, "get_by_id")
        return paper

    def _map_record(self, record: dict[str, Any]) -> SourcePaper | None:
        external_id = _text(record.get("paperId"))
        title = _text(record.get("title"))
        if not external_id or not title:
            return None

        author_records = record.get("authors")
        authors = tuple(
            author
            for value in author_records
            if isinstance(value, dict)
            and (author := _text(value.get("name")))
        ) if isinstance(author_records, list) else ()
        external_ids = record.get("externalIds")
        if not isinstance(external_ids, dict):
            external_ids = {}
        oa_pdf = record.get("openAccessPdf")
        if not isinstance(oa_pdf, dict):
            oa_pdf = {}
        is_open_access = record.get("isOpenAccess") is True
        pdf_url = _text(oa_pdf.get("url")) or None
        if not is_open_access:
            pdf_url = None
        published_date, date_year = parse_published_date(
            record.get("publicationDate")
        )
        year = parse_year(record.get("year")) or date_year
        publication_types = record.get("publicationTypes")
        article_type = (
            next(
                (
                    value.strip()
                    for value in publication_types
                    if isinstance(value, str) and value.strip()
                ),
                "",
            )
            if isinstance(publication_types, list)
            else ""
        )

        return SourcePaper(
            source=self.name,
            external_id=external_id,
            title=title,
            normalized_title=normalize_title(title),
            authors=authors,
            first_author=authors[0] if authors else "",
            abstract=_text(record.get("abstract")),
            doi=normalize_doi(external_ids.get("DOI")),
            arxiv_id=normalize_arxiv_id(external_ids.get("ArXiv")),
            journal=_text(record.get("venue")),
            published_date=published_date,
            year=year,
            keywords=(),
            landing_url=_text(record.get("url")),
            pdf_url=pdf_url,
            is_open_access=is_open_access,
            oa_status=(
                _text(oa_pdf.get("status")).lower() or "open"
                if is_open_access
                else "closed"
            ),
            license=_text(oa_pdf.get("license")) or None,
            article_type=article_type,
            citation_count=(
                record["citationCount"]
                if type(record.get("citationCount")) is int
                and record["citationCount"] >= 0
                else 0
            ),
        )


def _year_filter(year_from: int | None, year_to: int | None) -> str:
    if year_from is not None and year_to is not None:
        return f"{year_from}-{year_to}"
    if year_from is not None:
        return f"{year_from}-"
    if year_to is not None:
        return f"-{year_to}"
    return ""
