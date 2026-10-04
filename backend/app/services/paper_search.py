"""Concurrent multi-source paper search, safe merging, and transparent ranking."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, replace
from datetime import date
import re
from typing import Iterable, Sequence
import unicodedata

from app.paper_identity import normalize_arxiv_id, normalize_doi, normalize_title
from app.paper_sources.base import (
    PaperSource,
    SearchFilters,
    SourcePaper,
)


_SOURCE_NAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]{1,64}$")
_SOURCE_FAILURE_MESSAGE = "来源暂不可用"
_MIN_SEARCH_YEAR = 1900
_MAX_SEARCH_LIMIT = 50


@dataclass(frozen=True)
class SourceCandidate:
    source: str
    external_id: str


@dataclass(frozen=True, kw_only=True)
class SearchPaper(SourcePaper):
    sources: tuple[str, ...]
    candidates: tuple[SourceCandidate, ...]
    relevance_score: float
    relevance_reasons: tuple[str, ...]


@dataclass(frozen=True)
class SourceSearchStatus:
    source: str
    ok: bool
    message: str
    result_count: int


@dataclass(frozen=True)
class SearchResult:
    items: tuple[SearchPaper, ...]
    source_statuses: tuple[SourceSearchStatus, ...]
    warnings: tuple[str, ...]


class AllSourcesFailed(RuntimeError):
    """Raised when no configured source completed a search successfully."""

    def __init__(self, statuses: Iterable[SourceSearchStatus] = ()) -> None:
        self.statuses = tuple(statuses)
        super().__init__("所有论文来源均不可用")


class PaperSearchService:
    """Fan out source searches, merge equivalent papers, and rank the result."""

    def __init__(
        self,
        sources: Iterable[PaperSource],
        user_keywords: Iterable[str] = (),
    ) -> None:
        self._sources = tuple(sources)
        self._user_keywords = _normalized_unique_phrases(user_keywords)

    async def search(
        self,
        query: str,
        filters: SearchFilters,
    ) -> SearchResult:
        normalized_query = _normalize_query(query)
        if not normalized_query:
            raise ValueError("query must not be empty")
        normalized_filters = _normalize_filters(filters)

        outcomes = await asyncio.gather(
            *(
                _search_one_source(source, normalized_query, normalized_filters)
                for source in self._sources
            ),
            return_exceptions=True,
        )

        statuses: list[SourceSearchStatus] = []
        warnings: list[str] = []
        papers: list[SourcePaper] = []
        successful_sources = 0

        for source, outcome in zip(self._sources, outcomes):
            source_name = _safe_source_name(getattr(source, "name", "unknown"))
            if isinstance(outcome, asyncio.CancelledError):
                raise outcome
            if isinstance(outcome, BaseException):
                statuses.append(_failure_status(source_name))
                warnings.append(f"{source_name} {_SOURCE_FAILURE_MESSAGE}")
                continue

            try:
                source_papers = list(outcome)
            except Exception:
                statuses.append(_failure_status(source_name))
                warnings.append(f"{source_name} {_SOURCE_FAILURE_MESSAGE}")
                continue

            successful_sources += 1
            statuses.append(
                SourceSearchStatus(
                    source=source_name,
                    ok=True,
                    message="搜索成功",
                    result_count=len(source_papers),
                )
            )
            papers.extend(source_papers)

        if successful_sources == 0:
            raise AllSourcesFailed(statuses)

        merged = [
            _merge_group([papers[index] for index in group])
            for group in _identity_groups(papers)
        ]
        ranked = [
            _rank_paper(paper, normalized_query, self._user_keywords)
            for paper in merged
        ]
        if normalized_filters.open_access_only:
            ranked = [paper for paper in ranked if paper.is_open_access is True]
        ranked.sort(key=_ranking_sort_key)

        return SearchResult(
            items=tuple(ranked[: normalized_filters.limit]),
            source_statuses=tuple(statuses),
            warnings=tuple(warnings),
        )


async def _search_one_source(
    source: PaperSource,
    query: str,
    filters: SearchFilters,
) -> list[SourcePaper]:
    return await source.search(query, filters)


def _normalize_query(query: object) -> str:
    if not isinstance(query, str):
        return ""
    return " ".join(unicodedata.normalize("NFKC", query).split())


def _normalize_filters(filters: object) -> SearchFilters:
    if not isinstance(filters, SearchFilters):
        raise ValueError("filters must be SearchFilters")
    if type(filters.limit) is not int or filters.limit <= 0:
        raise ValueError("filters.limit must be a positive integer")
    if type(filters.open_access_only) is not bool:
        raise ValueError("filters.open_access_only must be boolean")

    maximum_year = date.today().year + 1
    for field_name in ("year_from", "year_to"):
        value = getattr(filters, field_name)
        if value is not None and (
            type(value) is not int
            or not _MIN_SEARCH_YEAR <= value <= maximum_year
        ):
            raise ValueError(
                f"filters.{field_name} must be between "
                f"{_MIN_SEARCH_YEAR} and {maximum_year}"
            )
    if (
        filters.year_from is not None
        and filters.year_to is not None
        and filters.year_from > filters.year_to
    ):
        raise ValueError("filters.year_from must not exceed filters.year_to")

    return replace(filters, limit=min(filters.limit, _MAX_SEARCH_LIMIT))


def _safe_source_name(value: object) -> str:
    if isinstance(value, str) and _SOURCE_NAME_PATTERN.fullmatch(value):
        return value
    return "unknown"


def _failure_status(source_name: str) -> SourceSearchStatus:
    return SourceSearchStatus(
        source=source_name,
        ok=False,
        message=_SOURCE_FAILURE_MESSAGE,
        result_count=0,
    )


def _normalized_unique_phrases(values: Iterable[str]) -> tuple[str, ...]:
    normalized: list[str] = []
    for value in values:
        phrase = normalize_title(value)
        if phrase and phrase not in normalized:
            normalized.append(phrase)
    return tuple(normalized)


class _IdentityComponents:
    def __init__(self, papers: Sequence[SourcePaper]) -> None:
        self.parents = list(range(len(papers)))
        self.dois = [
            {doi} if (doi := normalize_doi(paper.doi)) else set()
            for paper in papers
        ]
        self.arxiv_ids = [
            {arxiv_id}
            if (arxiv_id := normalize_arxiv_id(paper.arxiv_id))
            else set()
            for paper in papers
        ]

    def find(self, index: int) -> int:
        parent = self.parents[index]
        if parent != index:
            self.parents[index] = self.find(parent)
        return self.parents[index]

    def union_if_compatible(self, left: int, right: int) -> bool:
        left_root = self.find(left)
        right_root = self.find(right)
        if left_root == right_root:
            return True
        combined_dois = self.dois[left_root] | self.dois[right_root]
        combined_arxiv_ids = (
            self.arxiv_ids[left_root] | self.arxiv_ids[right_root]
        )
        if len(combined_dois) > 1 or len(combined_arxiv_ids) > 1:
            return False

        keep, merge = sorted((left_root, right_root))
        self.parents[merge] = keep
        self.dois[keep] = combined_dois
        self.arxiv_ids[keep] = combined_arxiv_ids
        return True

    def signature(self, index: int) -> tuple[str | None, str | None]:
        root = self.find(index)
        doi = next(iter(self.dois[root]), None)
        arxiv_id = next(iter(self.arxiv_ids[root]), None)
        return doi, arxiv_id


def _merge_identity_bucket(
    components: _IdentityComponents,
    members: Sequence[int],
) -> None:
    roots: list[int] = []
    seen_roots: set[int] = set()
    for member in members:
        root = components.find(member)
        if root not in seen_roots:
            seen_roots.add(root)
            roots.append(root)
    if len(roots) < 2:
        return

    by_signature: dict[tuple[str | None, str | None], int] = {}
    first_by_doi: dict[str, int] = {}
    first_by_arxiv: dict[str, int] = {}
    without_doi: list[int] = []
    without_arxiv: list[int] = []
    without_doi_cursor = 0
    without_arxiv_cursor = 0
    first_representative: int | None = None

    for original_root in roots:
        root = components.find(original_root)
        doi, arxiv_id = components.signature(root)
        candidates: list[int] = []

        exact = by_signature.get((doi, arxiv_id))
        if exact is not None:
            candidates.append(exact)
        if doi is not None and doi in first_by_doi:
            candidates.append(first_by_doi[doi])
        if arxiv_id is not None and arxiv_id in first_by_arxiv:
            candidates.append(first_by_arxiv[arxiv_id])

        if doi is not None and arxiv_id is None:
            while without_doi_cursor < len(without_doi):
                candidate = components.find(without_doi[without_doi_cursor])
                if components.signature(candidate)[0] is None:
                    candidates.append(candidate)
                    break
                without_doi_cursor += 1
        elif doi is None and arxiv_id is not None:
            while without_arxiv_cursor < len(without_arxiv):
                candidate = components.find(
                    without_arxiv[without_arxiv_cursor]
                )
                if components.signature(candidate)[1] is None:
                    candidates.append(candidate)
                    break
                without_arxiv_cursor += 1

        empty = by_signature.get((None, None))
        if empty is not None:
            candidates.append(empty)
        if doi is None and arxiv_id is None and first_representative is not None:
            candidates.append(first_representative)

        tried: set[int] = set()
        for candidate in candidates:
            candidate_root = components.find(candidate)
            root = components.find(root)
            if candidate_root in tried:
                continue
            tried.add(candidate_root)
            if candidate_root == root:
                break
            if components.union_if_compatible(candidate_root, root):
                root = components.find(root)
                break

        root = components.find(root)
        doi, arxiv_id = components.signature(root)
        by_signature[(doi, arxiv_id)] = root
        if doi is not None:
            first_by_doi.setdefault(doi, root)
        else:
            without_doi.append(root)
        if arxiv_id is not None:
            first_by_arxiv.setdefault(arxiv_id, root)
        else:
            without_arxiv.append(root)
        if first_representative is None:
            first_representative = root


def _identity_groups(papers: Sequence[SourcePaper]) -> list[list[int]]:
    components = _IdentityComponents(papers)
    identity_values = (
        [normalize_doi(paper.doi) for paper in papers],
        [normalize_arxiv_id(paper.arxiv_id) for paper in papers],
        [
            normalize_title(paper.normalized_title)
            or normalize_title(paper.title)
            for paper in papers
        ],
    )

    for values in identity_values:
        buckets: dict[str, list[int]] = {}
        for index, value in enumerate(values):
            if value:
                buckets.setdefault(value, []).append(index)
        for members in buckets.values():
            _merge_identity_bucket(components, members)

    groups: dict[int, list[int]] = {}
    for index in range(len(papers)):
        groups.setdefault(components.find(index), []).append(index)
    return list(groups.values())


def _first_nonempty(papers: Sequence[SourcePaper], field: str):
    for paper in papers:
        value = getattr(paper, field)
        if value is not None and value != "" and value != ():
            return value
    return getattr(papers[0], field)


def _merge_group(papers: Sequence[SourcePaper]) -> SearchPaper:
    base = papers[0]
    title = _first_nonempty(papers, "title")
    abstract = max(
        (paper.abstract for paper in papers),
        key=lambda value: len(value.strip()),
    )
    doi = next(
        (
            normalized
            for paper in papers
            if (normalized := normalize_doi(paper.doi))
        ),
        None,
    )
    arxiv_id = next(
        (
            normalized
            for paper in papers
            if (normalized := normalize_arxiv_id(paper.arxiv_id))
        ),
        None,
    )

    qualifying_oa = next(
        (
            paper
            for paper in papers
            if paper.is_open_access is True and _usable_pdf_url(paper.pdf_url)
        ),
        None,
    )
    is_open_access = qualifying_oa is not None
    if qualifying_oa is not None:
        pdf_url = qualifying_oa.pdf_url
        oa_status = (
            qualifying_oa.oa_status
            if isinstance(qualifying_oa.oa_status, str)
            and qualifying_oa.oa_status.strip()
            else "open"
        )
    else:
        pdf_url = _first_nonempty(papers, "pdf_url")
        oa_status = _first_nonempty(papers, "oa_status")
    license_value = (
        _explicit_license(qualifying_oa.license)
        if qualifying_oa is not None
        else _first_nonempty(papers, "license")
    )

    candidates: list[SourceCandidate] = []
    for paper in papers:
        candidate = SourceCandidate(paper.source, paper.external_id)
        if candidate not in candidates:
            candidates.append(candidate)
    sources = tuple(dict.fromkeys(candidate.source for candidate in candidates))

    return SearchPaper(
        source=base.source,
        external_id=base.external_id,
        title=title,
        normalized_title=normalize_title(title),
        authors=_first_nonempty(papers, "authors"),
        first_author=_first_nonempty(papers, "first_author"),
        abstract=abstract,
        doi=doi,
        arxiv_id=arxiv_id,
        journal=_first_nonempty(papers, "journal"),
        published_date=_first_nonempty(papers, "published_date"),
        year=_first_nonempty(papers, "year"),
        keywords=_first_nonempty(papers, "keywords"),
        landing_url=_first_nonempty(papers, "landing_url"),
        pdf_url=pdf_url,
        is_open_access=is_open_access,
        oa_status=oa_status,
        license=license_value,
        article_type=_first_nonempty(papers, "article_type"),
        citation_count=max(
            (paper.citation_count for paper in papers),
            default=0,
        ),
        sources=sources,
        candidates=tuple(candidates),
        relevance_score=0.0,
        relevance_reasons=(),
    )


def _rank_paper(
    paper: SearchPaper,
    query: str,
    user_keywords: Sequence[str],
) -> SearchPaper:
    query_text = normalize_title(query)
    query_tokens = tuple(dict.fromkeys(query_text.split()))
    title_text = normalize_title(paper.title)
    title_tokens = set(title_text.split())
    abstract_text = normalize_title(paper.abstract)
    abstract_tokens = set(abstract_text.split())
    reasons: list[str] = []

    title_exact = title_text == query_text
    title_full = bool(query_tokens) and (
        all(token in title_tokens for token in query_tokens)
    )
    title_partial = any(token in title_tokens for token in query_tokens)
    abstract_match = bool(query_tokens) and (
        any(token in abstract_tokens for token in query_tokens)
    )

    if title_exact:
        score = 80.0
        reasons.append("标题命中")
    elif title_full:
        score = 60.0
        reasons.append("标题命中")
    elif title_partial:
        score = 35.0
        reasons.append("标题命中")
    elif abstract_match:
        score = 15.0
    else:
        score = 0.0

    if abstract_match:
        reasons.append("摘要命中")

    searchable_text = " ".join(
        (
            title_text,
            abstract_text,
            *(normalize_title(keyword) for keyword in paper.keywords),
        )
    )
    if any(keyword in searchable_text for keyword in user_keywords):
        score += 4.0
        reasons.append("用户关键词命中")

    if paper.year is not None and paper.year >= date.today().year - 5:
        score += 4.0
        reasons.append("近期论文")

    if paper.is_open_access is True and _usable_pdf_url(paper.pdf_url):
        score += 4.0
        reasons.append("有开放全文")

    if _metadata_field_count(paper) >= 6:
        score += 3.0
        reasons.append("元数据完整")

    return replace(
        paper,
        relevance_score=float(min(100.0, max(0.0, score))),
        relevance_reasons=tuple(reasons),
    )


def _metadata_field_count(paper: SearchPaper) -> int:
    return sum(
        (
            bool(paper.authors),
            bool(paper.first_author),
            bool(paper.abstract),
            bool(paper.doi or paper.arxiv_id),
            bool(paper.journal),
            bool(paper.published_date or paper.year),
            bool(paper.keywords),
            bool(paper.landing_url),
            bool(paper.license),
        )
    )


def _usable_pdf_url(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _explicit_license(value: object) -> str | None:
    if isinstance(value, str) and value.strip():
        return value
    return None


def _ranking_sort_key(paper: SearchPaper) -> tuple[object, ...]:
    published_ordinal = 0
    if paper.published_date:
        try:
            published_ordinal = date.fromisoformat(
                paper.published_date[:10]
            ).toordinal()
        except ValueError:
            published_ordinal = 0
    year = paper.year if type(paper.year) is int else 0
    return (
        -paper.relevance_score,
        -published_ordinal,
        -year,
        paper.normalized_title,
        paper.external_id,
        paper.source,
    )


__all__ = [
    "AllSourcesFailed",
    "PaperSearchService",
    "SearchPaper",
    "SearchResult",
    "SourceCandidate",
    "SourceSearchStatus",
]
