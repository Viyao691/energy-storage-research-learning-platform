"""arXiv Atom API adapter."""

from __future__ import annotations

from typing import Any
from xml.etree.ElementTree import Element, ParseError

from defusedxml import ElementTree

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
)


_ATOM = "http://www.w3.org/2005/Atom"
_ARXIV = "http://arxiv.org/schemas/atom"
_NAMESPACES = {"atom": _ATOM, "arxiv": _ARXIV}


def _normalized_whitespace(value: Any) -> str:
    return " ".join(value.split()) if isinstance(value, str) else ""


class ArxivSource(HttpPaperSource):
    name = "arxiv"

    def __init__(
        self,
        client: httpx.AsyncClient,
        base_url: str = "https://export.arxiv.org/api",
        timeout: float = 10,
    ) -> None:
        super().__init__(client, base_url, timeout)

    async def search(
        self,
        query: str,
        filters: SearchFilters,
    ) -> list[SourcePaper]:
        search_query = f"all:{query}"
        if filters.year_from is not None or filters.year_to is not None:
            year_from = filters.year_from if filters.year_from is not None else 1900
            year_to = filters.year_to if filters.year_to is not None else 9999
            search_query += (
                f" AND submittedDate:[{year_from:04d}01010000"
                f" TO {year_to:04d}12312359]"
            )
        text = await self._get_text(
            "/query",
            operation="search",
            params={
                "search_query": search_query,
                "start": 0,
                "max_results": filters.limit,
            },
        )
        return self._parse_feed(text, "search")

    async def get_by_id(self, external_id: str) -> SourcePaper:
        arxiv_id = normalize_arxiv_id(external_id)
        if not arxiv_id:
            raise SourceRequestError(self.name, "get_by_id")
        text = await self._get_text(
            "/query",
            operation="get_by_id",
            params={"id_list": arxiv_id},
        )
        papers = self._parse_feed(text, "get_by_id")
        if not papers:
            raise SourceRequestError(self.name, "get_by_id")
        return papers[0]

    def _parse_feed(self, text: str, operation: str) -> list[SourcePaper]:
        uppercase_text = text.upper()
        if "<!DOCTYPE" in uppercase_text or "<!ENTITY" in uppercase_text:
            raise SourceRequestError(self.name, operation)
        parse_failed = False
        try:
            root = ElementTree.fromstring(text)
        except (ParseError, ValueError):
            parse_failed = True
            root = None
        if parse_failed or root is None:
            raise SourceRequestError(self.name, operation)
        return [
            paper
            for entry in root.findall("atom:entry", _NAMESPACES)
            if (paper := self._map_entry(entry)) is not None
        ]

    def _map_entry(self, entry: Element) -> SourcePaper | None:
        raw_id = _normalized_whitespace(entry.findtext("atom:id", "", _NAMESPACES))
        external_id = normalize_arxiv_id(raw_id)
        title = _normalized_whitespace(
            entry.findtext("atom:title", "", _NAMESPACES)
        )
        if not external_id or not title:
            return None

        authors = tuple(
            author
            for node in entry.findall("atom:author", _NAMESPACES)
            if (
                author := _normalized_whitespace(
                    node.findtext("atom:name", "", _NAMESPACES)
                )
            )
        )
        landing_url = ""
        pdf_url: str | None = None
        for link in entry.findall("atom:link", _NAMESPACES):
            href = _normalized_whitespace(link.attrib.get("href"))
            rel = _normalized_whitespace(link.attrib.get("rel")).lower()
            media_type = _normalized_whitespace(link.attrib.get("type")).lower()
            title_attribute = _normalized_whitespace(link.attrib.get("title")).lower()
            if href and rel == "alternate":
                landing_url = href
            if href and (
                media_type == "application/pdf" or title_attribute == "pdf"
            ):
                pdf_url = href

        published_date, year = parse_published_date(
            entry.findtext("atom:published", "", _NAMESPACES)
        )
        keywords = tuple(
            term
            for category in entry.findall("atom:category", _NAMESPACES)
            if (term := _normalized_whitespace(category.attrib.get("term")))
        )
        license_text = _normalized_whitespace(
            entry.findtext("arxiv:license", "", _NAMESPACES)
        ) or None

        return SourcePaper(
            source=self.name,
            external_id=external_id,
            title=title,
            normalized_title=normalize_title(title),
            authors=authors,
            first_author=authors[0] if authors else "",
            abstract=_normalized_whitespace(
                entry.findtext("atom:summary", "", _NAMESPACES)
            ),
            doi=normalize_doi(
                entry.findtext("arxiv:doi", None, _NAMESPACES)
            ),
            arxiv_id=external_id,
            journal=_normalized_whitespace(
                entry.findtext("arxiv:journal_ref", "", _NAMESPACES)
            ),
            published_date=published_date,
            year=year,
            keywords=keywords,
            landing_url=landing_url or raw_id,
            pdf_url=pdf_url,
            is_open_access=True,
            oa_status="green",
            license=license_text,
            article_type="preprint",
            citation_count=0,
        )
ArXivSource = ArxivSource
