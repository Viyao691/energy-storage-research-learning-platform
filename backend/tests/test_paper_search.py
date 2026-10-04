import asyncio
from dataclasses import replace
from datetime import date

import pytest

from app.paper_sources import SearchFilters, SourcePaper, SourceRequestError
from app.services.paper_identity import (
    normalize_arxiv_id,
    normalize_doi,
    normalize_title,
)
from app.services.paper_search import (
    AllSourcesFailed,
    PaperSearchService,
    SearchPaper,
    SourceCandidate,
)
import app.services.paper_search as paper_search_module


def run(coroutine):
    return asyncio.run(coroutine)


def source_paper(
    source: str,
    external_id: str,
    title: str,
    **overrides,
) -> SourcePaper:
    values = {
        "source": source,
        "external_id": external_id,
        "title": title,
        "normalized_title": normalize_title(title),
        "authors": (),
        "first_author": "",
        "abstract": "",
        "doi": None,
        "arxiv_id": None,
        "journal": "",
        "published_date": None,
        "year": None,
        "keywords": (),
        "landing_url": "",
        "pdf_url": None,
        "is_open_access": False,
        "oa_status": "",
        "license": None,
    }
    values.update(overrides)
    return SourcePaper(**values)


class StubSource:
    def __init__(
        self,
        name: str,
        papers: list[SourcePaper] | None = None,
        error: Exception | None = None,
    ) -> None:
        self.name = name
        self.papers = papers or []
        self.error = error
        self.calls: list[tuple[str, SearchFilters]] = []

    async def search(
        self,
        query: str,
        filters: SearchFilters,
    ) -> list[SourcePaper]:
        self.calls.append((query, filters))
        await asyncio.sleep(0)
        if self.error:
            raise self.error
        return self.papers


def test_search_fans_out_and_keeps_partial_results_with_sanitized_failure() -> None:
    filters = SearchFilters(limit=10)
    good = StubSource(
        "openalex",
        [source_paper("openalex", "W1", "Grid storage")],
    )
    failed = StubSource(
        "crossref",
        error=SourceRequestError(
            "crossref",
            "query=secret&api_key=raw-secret",
        ),
    )

    result = run(
        PaperSearchService([good, failed]).search("  Grid   storage  ", filters)
    )

    assert good.calls == [("Grid storage", filters)]
    assert failed.calls == [("Grid storage", filters)]
    assert [paper.title for paper in result.items] == ["Grid storage"]
    assert result.source_statuses[0].ok is True
    assert result.source_statuses[0].result_count == 1
    assert result.source_statuses[1].ok is False
    assert result.source_statuses[1].result_count == 0
    exposed_text = repr((result.source_statuses, result.warnings))
    assert "raw-secret" not in exposed_text
    assert "query=" not in exposed_text


def test_search_sources_cross_an_async_barrier_proving_concurrent_fanout() -> None:
    async def exercise():
        release = asyncio.Event()
        started: list[str] = []

        class BarrierSource(StubSource):
            async def search(
                self,
                query: str,
                filters: SearchFilters,
            ) -> list[SourcePaper]:
                self.calls.append((query, filters))
                started.append(self.name)
                if len(started) == 2:
                    release.set()
                await asyncio.wait_for(release.wait(), timeout=1)
                return self.papers

        sources = [BarrierSource("one"), BarrierSource("two")]
        result = await PaperSearchService(sources).search(
            "battery",
            SearchFilters(),
        )
        return started, result

    started, result = run(exercise())

    assert started == ["one", "two"]
    assert all(status.ok for status in result.source_statuses)
    assert result.warnings == ()


def test_unexpected_source_failure_is_also_sanitized() -> None:
    failed = StubSource(
        "semantic_scholar",
        error=RuntimeError("request leaked-key and private query"),
    )
    good = StubSource("arxiv", [])

    result = run(PaperSearchService([failed, good]).search("battery", SearchFilters()))

    assert result.items == ()
    assert result.source_statuses[0].message == "来源暂不可用"
    assert result.warnings == ("semantic_scholar 来源暂不可用",)
    assert "leaked-key" not in repr(result)
    assert "private query" not in repr(result)


def test_synchronous_source_bug_does_not_prevent_other_sources_from_running() -> None:
    class BrokenSource:
        name = "broken"

        def search(self, query: str, filters: SearchFilters):
            raise RuntimeError("synchronous bug with api_key=secret")

    good = StubSource(
        "openalex",
        [source_paper("openalex", "W1", "Battery")],
    )

    result = run(
        PaperSearchService([BrokenSource(), good]).search(
            "battery",
            SearchFilters(),
        )
    )

    assert good.calls
    assert [paper.external_id for paper in result.items] == ["W1"]
    assert result.source_statuses[0].message == "来源暂不可用"
    assert "secret" not in repr(result)


def test_no_sources_or_all_failures_raise_sanitized_all_sources_failed() -> None:
    with pytest.raises(AllSourcesFailed) as empty_error:
        run(PaperSearchService([]).search("battery", SearchFilters()))
    assert empty_error.value.statuses == ()
    assert str(empty_error.value) == "所有论文来源均不可用"

    sources = [
        StubSource("one", error=SourceRequestError("one", "secret request")),
        StubSource("two", error=ValueError("api_key=secret")),
    ]
    with pytest.raises(AllSourcesFailed) as failed_error:
        run(PaperSearchService(sources).search("battery", SearchFilters()))

    assert [status.source for status in failed_error.value.statuses] == ["one", "two"]
    assert all(not status.ok for status in failed_error.value.statuses)
    assert "secret" not in repr(failed_error.value.statuses)
    assert "api_key" not in repr(failed_error.value.statuses)


def test_successful_empty_source_counts_as_success() -> None:
    result = run(
        PaperSearchService([StubSource("empty")]).search(
            "battery",
            SearchFilters(),
        )
    )

    assert result.items == ()
    assert result.warnings == ()
    assert result.source_statuses[0].ok is True
    assert result.source_statuses[0].result_count == 0


def test_empty_normalized_query_is_rejected_before_sources_are_called() -> None:
    source = StubSource("openalex")

    with pytest.raises(ValueError, match="query"):
        run(PaperSearchService([source]).search("\u3000 \n\t", SearchFilters()))

    assert source.calls == []


def test_deduplication_is_transitive_but_rejects_identifier_conflicts() -> None:
    first = source_paper(
        "openalex",
        "W1",
        "Storage materials",
        doi="10.1000/shared",
    )
    bridge = source_paper(
        "crossref",
        "10.1000/shared",
        "A different indexed title",
        doi="10.1000/shared",
        arxiv_id="2401.01234",
    )
    transitive = source_paper(
        "arxiv",
        "2401.01234",
        "Preprint wording",
        arxiv_id="2401.01234",
    )
    conflicting_doi = source_paper(
        "semantic_scholar",
        "S2",
        "Storage materials",
        doi="10.9999/conflict",
    )
    conflicting_arxiv = source_paper(
        "other",
        "O1",
        "Storage materials",
        arxiv_id="2501.99999",
    )

    result = run(
        PaperSearchService(
            [
                StubSource("openalex", [first]),
                StubSource("crossref", [bridge]),
                StubSource("arxiv", [transitive]),
                StubSource("semantic_scholar", [conflicting_doi]),
                StubSource("other", [conflicting_arxiv]),
            ]
        ).search("storage", SearchFilters(limit=10))
    )

    merged = next(item for item in result.items if len(item.candidates) == 3)
    assert merged.candidates == (
        SourceCandidate("openalex", "W1"),
        SourceCandidate("crossref", "10.1000/shared"),
        SourceCandidate("arxiv", "2401.01234"),
    )
    assert merged.sources == ("openalex", "crossref", "arxiv")
    assert merged.doi == "10.1000/shared"
    assert merged.arxiv_id == "2401.01234"
    assert len(result.items) == 2
    assert {item.doi for item in result.items} == {
        "10.1000/shared",
        "10.9999/conflict",
    }


def test_merge_fills_missing_metadata_and_uses_longest_abstract() -> None:
    sparse = source_paper(
        "openalex",
        "W1",
        "Battery paper",
        abstract="Short abstract.",
        doi="10.1000/battery",
        license="publisher-specific",
    )
    rich = source_paper(
        "crossref",
        "10.1000/battery",
        "Battery paper",
        authors=("Ada", "Lin"),
        first_author="Ada",
        abstract="A substantially longer and more complete abstract about batteries.",
        doi="10.1000/battery",
        journal="Storage Journal",
        published_date="2025-03-04",
        year=2025,
        keywords=("battery",),
        landing_url="https://example.test/paper",
        license="different-license",
    )

    result = run(
        PaperSearchService(
            [StubSource("openalex", [sparse]), StubSource("crossref", [rich])]
        ).search("battery", SearchFilters())
    )
    paper = result.items[0]

    assert isinstance(paper, SearchPaper)
    assert paper.authors == ("Ada", "Lin")
    assert paper.first_author == "Ada"
    assert paper.abstract == rich.abstract
    assert paper.journal == "Storage Journal"
    assert paper.published_date == "2025-03-04"
    assert paper.year == 2025
    assert paper.keywords == ("battery",)
    assert paper.landing_url == "https://example.test/paper"
    assert paper.license == "publisher-specific"


def test_open_access_promotion_requires_strict_true_with_pdf_from_same_record() -> None:
    base = source_paper(
        "openalex",
        "W1",
        "Battery access",
        doi="10.1000/access",
    )
    merely_truthy = source_paper(
        "crossref",
        "10.1000/access",
        "Battery access",
        doi="10.1000/access",
        is_open_access=1,
        pdf_url="https://untrusted.test/truthy.pdf",
    )
    true_without_pdf = source_paper(
        "semantic_scholar",
        "S1",
        "Battery access",
        doi="10.1000/access",
        is_open_access=True,
        pdf_url=None,
    )
    whitespace_pdf = replace(true_without_pdf, source="other", pdf_url=" \t")

    not_promoted = run(
        PaperSearchService(
            [
                StubSource("openalex", [base]),
                StubSource("crossref", [merely_truthy]),
                StubSource("semantic_scholar", [true_without_pdf]),
                StubSource("other", [whitespace_pdf]),
            ]
        ).search("battery", SearchFilters())
    ).items[0]

    assert not_promoted.is_open_access is False

    qualifying = replace(
        true_without_pdf,
        pdf_url="https://trusted.test/paper.pdf",
        oa_status="gold",
        license="CC-BY-4.0",
    )
    promoted = run(
        PaperSearchService(
            [
                StubSource("openalex", [base]),
                StubSource("crossref", [merely_truthy]),
                StubSource("semantic_scholar", [qualifying]),
            ]
        ).search("battery", SearchFilters())
    ).items[0]

    assert promoted.is_open_access is True
    assert promoted.pdf_url == "https://trusted.test/paper.pdf"
    assert promoted.oa_status == "gold"
    assert promoted.license == "CC-BY-4.0"


def test_open_access_license_comes_from_the_qualifying_pdf_record() -> None:
    closed = source_paper(
        "publisher",
        "closed",
        "Battery access",
        doi="10.1000/license-source",
        license="All rights reserved",
    )
    qualifying = source_paper(
        "repository",
        "open",
        "Battery access",
        doi="10.1000/license-source",
        is_open_access=True,
        pdf_url="https://repository.test/open.pdf",
        license="CC-BY-4.0",
    )

    paper = run(
        PaperSearchService(
            [
                StubSource("publisher", [closed]),
                StubSource("repository", [qualifying]),
            ]
        ).search("battery", SearchFilters())
    ).items[0]

    assert paper.is_open_access is True
    assert paper.pdf_url == qualifying.pdf_url
    assert paper.license == "CC-BY-4.0"


def test_open_access_license_stays_none_when_qualifying_record_has_none() -> None:
    closed = source_paper(
        "publisher",
        "closed",
        "Battery access",
        doi="10.1000/license-none",
        license="All rights reserved",
    )
    qualifying = source_paper(
        "repository",
        "open",
        "Battery access",
        doi="10.1000/license-none",
        is_open_access=True,
        pdf_url="https://repository.test/open.pdf",
        license=None,
    )

    paper = run(
        PaperSearchService(
            [
                StubSource("publisher", [closed]),
                StubSource("repository", [qualifying]),
            ]
        ).search("battery", SearchFilters())
    ).items[0]

    assert paper.is_open_access is True
    assert paper.license is None


def test_open_access_status_never_falls_back_to_a_closed_record() -> None:
    closed = source_paper(
        "publisher",
        "closed",
        "Battery access",
        doi="10.1000/status-source",
        oa_status="closed",
    )
    qualifying = source_paper(
        "repository",
        "open",
        "Battery access",
        doi="10.1000/status-source",
        is_open_access=True,
        pdf_url="https://repository.test/open.pdf",
        oa_status="",
    )

    paper = run(
        PaperSearchService(
            [
                StubSource("publisher", [closed]),
                StubSource("repository", [qualifying]),
            ]
        ).search("battery", SearchFilters())
    ).items[0]

    assert paper.is_open_access is True
    assert paper.oa_status == "open"


@pytest.mark.parametrize("pdf_url", [None, " \t"])
def test_single_open_access_record_without_usable_pdf_is_not_oa(
    pdf_url: str | None,
) -> None:
    unsupported_claim = source_paper(
        "openalex",
        "W-no-pdf",
        "Battery access",
        is_open_access=True,
        pdf_url=pdf_url,
        oa_status="gold",
    )

    paper = run(
        PaperSearchService(
            [StubSource("openalex", [unsupported_claim])]
        ).search("battery", SearchFilters())
    ).items[0]

    assert paper.is_open_access is False


@pytest.mark.parametrize("pdf_url", [None, " \t"])
def test_open_access_filter_excludes_true_record_without_usable_pdf(
    pdf_url: str | None,
) -> None:
    unsupported_claim = source_paper(
        "openalex",
        "W-no-pdf",
        "Battery access",
        is_open_access=True,
        pdf_url=pdf_url,
    )

    result = run(
        PaperSearchService(
            [StubSource("openalex", [unsupported_claim])]
        ).search(
            "battery",
            SearchFilters(open_access_only=True),
        )
    )

    assert result.items == ()


def test_ranking_match_tiers_are_transparent_bounded_and_deterministic() -> None:
    common = {
        "published_date": "2020-01-01",
        "year": 2020,
    }
    papers = [
        source_paper("test", "abstract", "Unrelated", abstract="Energy storage", **common),
        source_paper("test", "partial", "Energy conversion", **common),
        source_paper("test", "full", "Advanced energy storage systems", **common),
        source_paper("test", "exact", "Energy storage", **common),
    ]

    result = run(
        PaperSearchService([StubSource("test", papers)]).search(
            "energy storage",
            SearchFilters(limit=10),
        )
    )

    assert [paper.external_id for paper in result.items] == [
        "exact",
        "full",
        "partial",
        "abstract",
    ]
    assert all(0.0 <= paper.relevance_score <= 100.0 for paper in result.items)
    assert "标题命中" in result.items[0].relevance_reasons
    assert "标题命中" in result.items[2].relevance_reasons
    assert "摘要命中" in result.items[3].relevance_reasons
    assert result.items[0].relevance_score > result.items[1].relevance_score
    assert result.items[1].relevance_score > result.items[2].relevance_score
    assert result.items[2].relevance_score > result.items[3].relevance_score


def test_ranking_uses_query_tokens_instead_of_substring_false_positives() -> None:
    result = run(
        PaperSearchService(
            [
                StubSource(
                    "test",
                    [
                        source_paper(
                            "test",
                            "offgrid",
                            "Offgrid controller",
                            abstract="A microgridlike benchmark",
                        )
                    ],
                )
            ]
        ).search("grid", SearchFilters())
    )

    assert result.items[0].relevance_score == 0.0
    assert result.items[0].relevance_reasons == ()


def test_ranking_reports_bounded_bonuses_and_uses_stable_tie_breakers() -> None:
    current_year = date.today().year
    complete = source_paper(
        "test",
        "complete",
        "Battery complete",
        authors=("Ada",),
        first_author="Ada",
        abstract="Battery storage research",
        doi="10.1000/complete",
        journal="Journal",
        published_date=f"{current_year - 1}-02-03",
        year=current_year - 1,
        keywords=("sodium",),
        landing_url="https://example.test/complete",
        pdf_url="https://example.test/complete.pdf",
        is_open_access=True,
        oa_status="gold",
        license="CC-BY",
    )
    older = source_paper(
        "test",
        "older",
        "Battery older",
        published_date=f"{current_year - 3}-01-01",
        year=current_year - 3,
    )
    newer = source_paper(
        "test",
        "newer",
        "Battery newer",
        published_date=f"{current_year - 2}-01-01",
        year=current_year - 2,
    )

    result = run(
        PaperSearchService(
            [StubSource("test", [older, complete, newer])],
            user_keywords=("sodium",),
        ).search("battery", SearchFilters(limit=10))
    )

    enriched = next(item for item in result.items if item.external_id == "complete")
    assert enriched.relevance_score <= 100.0
    assert enriched.relevance_reasons == (
        "标题命中",
        "摘要命中",
        "用户关键词命中",
        "近期论文",
        "有开放全文",
        "元数据完整",
    )
    assert [
        item.external_id
        for item in result.items
        if item.external_id in {"newer", "older"}
    ] == ["newer", "older"]


def test_recent_year_bonus_uses_the_current_year_boundary() -> None:
    current_year = date.today().year
    recent = source_paper(
        "test",
        "recent",
        "Battery recent",
        doi="10.1000/recent",
        year=current_year - 5,
    )
    old = source_paper(
        "test",
        "old",
        "Battery old",
        doi="10.1000/old",
        year=current_year - 6,
    )

    result = run(
        PaperSearchService([StubSource("test", [old, recent])]).search(
            "battery",
            SearchFilters(),
        )
    )

    assert [paper.external_id for paper in result.items] == ["recent", "old"]
    assert "近期论文" in result.items[0].relevance_reasons
    assert "近期论文" not in result.items[1].relevance_reasons


def test_equal_score_and_date_ties_are_stable_for_shuffled_inputs() -> None:
    current_year = date.today().year
    papers = [
        source_paper(
            "test",
            "beta",
            "Beta storage",
            doi="10.1000/beta",
            published_date=f"{current_year - 2}-01-01",
            year=current_year - 2,
        ),
        source_paper(
            "test",
            "zulu",
            "Alpha storage",
            doi="10.1000/zulu",
            published_date=f"{current_year - 2}-01-01",
            year=current_year - 2,
        ),
        source_paper(
            "test",
            "alpha",
            "Alpha storage",
            doi="10.1000/alpha",
            published_date=f"{current_year - 2}-01-01",
            year=current_year - 2,
        ),
    ]

    first = run(
        PaperSearchService([StubSource("test", papers)]).search(
            "storage",
            SearchFilters(),
        )
    )
    shuffled = run(
        PaperSearchService([StubSource("test", list(reversed(papers)))]).search(
            "storage",
            SearchFilters(),
        )
    )

    expected = ["alpha", "zulu", "beta"]
    assert [paper.external_id for paper in first.items] == expected
    assert [paper.external_id for paper in shuffled.items] == expected


def test_filters_are_normalized_before_they_are_passed_to_sources() -> None:
    current_year = date.today().year
    filters = SearchFilters(
        year_from=current_year - 2,
        year_to=current_year,
        open_access_only=True,
        limit=200,
    )
    source = StubSource("openalex")

    run(PaperSearchService([source]).search("battery", filters))

    captured = source.calls[0][1]
    assert captured is not filters
    assert captured == replace(filters, limit=50)


@pytest.mark.parametrize(
    "filters",
    [
        SearchFilters(limit=True),
        SearchFilters(limit=0),
        SearchFilters(limit=-1),
        SearchFilters(limit=1.5),
        SearchFilters(year_from=True),
        SearchFilters(year_from=1899),
        SearchFilters(year_to=date.today().year + 2),
        SearchFilters(
            year_from=date.today().year,
            year_to=date.today().year - 1,
        ),
        SearchFilters(open_access_only=1),
    ],
)
def test_invalid_filters_are_rejected_before_fanout(filters: SearchFilters) -> None:
    source = StubSource("openalex")

    with pytest.raises(ValueError, match="filters"):
        run(PaperSearchService([source]).search("battery", filters))

    assert source.calls == []


def test_dedupe_large_same_bucket_uses_near_linear_union_work(
    monkeypatch,
) -> None:
    papers = [
        source_paper(
            f"source-{index}",
            f"id-{index:03d}",
            "Shared storage title",
            doi="10.1000/shared-stress",
        )
        for index in range(200)
    ]
    union_calls = 0
    original_union = paper_search_module._IdentityComponents.union_if_compatible

    def counted_union(components, left: int, right: int):
        nonlocal union_calls
        union_calls += 1
        return original_union(components, left, right)

    monkeypatch.setattr(
        paper_search_module._IdentityComponents,
        "union_if_compatible",
        counted_union,
    )

    result = run(
        PaperSearchService([StubSource("stress", papers)]).search(
            "storage",
            SearchFilters(limit=50),
        )
    )

    assert len(result.items) == 1
    assert len(result.items[0].candidates) == 200
    assert result.items[0].candidates[0].external_id == "id-000"
    assert result.items[0].candidates[-1].external_id == "id-199"
    assert union_calls < 600


def test_open_access_filter_runs_after_merge_and_limit_runs_after_ranking() -> None:
    closed_half = source_paper(
        "one",
        "closed-half",
        "Battery exact",
        doi="10.1000/merged",
    )
    open_half = source_paper(
        "two",
        "open-half",
        "Indexed wording",
        doi="10.1000/merged",
        is_open_access=True,
        pdf_url="https://example.test/merged.pdf",
    )
    lower_ranked_open = source_paper(
        "one",
        "lower",
        "Other title",
        abstract="Battery exact",
        is_open_access=True,
        pdf_url="https://example.test/lower.pdf",
    )
    closed = source_paper("one", "closed", "Battery exact closed")

    result = run(
        PaperSearchService(
            [
                StubSource("one", [closed_half, lower_ranked_open, closed]),
                StubSource("two", [open_half]),
            ]
        ).search(
            "battery exact",
            SearchFilters(open_access_only=True, limit=1),
        )
    )

    assert len(result.items) == 1
    assert result.items[0].doi == "10.1000/merged"
    assert result.items[0].is_open_access is True
    assert len(result.items[0].candidates) == 2


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("https://doi.org/10.1000/ABC.1", "10.1000/abc.1"),
        ("doi: 10.1016/J.JPOWSOUR.2024.1", "10.1016/j.jpowsour.2024.1"),
        (
            "  https://doi.org/10.1000/ＦＯＯ?source=test#section  ",
            "10.1000/foo",
        ),
        ("10.1000/res#test", "10.1000/res#test"),
        ("10.1000/res?test", "10.1000/res?test"),
        (
            "https://doi.org/10.1000/Res%23Test?source=index#fragment",
            "10.1000/res#test",
        ),
        ("doi:https://doi.org/10.1000/ABC", "10.1000/abc"),
        (None, None),
        ("  ", None),
    ],
)
def test_normalize_doi(value, expected):
    assert normalize_doi(value) == expected


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("arXiv:2401.01234v2", "2401.01234"),
        (
            "https://arxiv.org/abs/cond-mat/9901001v3",
            "cond-mat/9901001",
        ),
        ("https://arxiv.org/pdf/2401.01234v5.pdf", "2401.01234"),
        (
            "arXiv:https://arxiv.org/abs/2401.01234v2",
            "2401.01234",
        ),
        (None, None),
        ("  ", None),
    ],
)
def test_normalize_arxiv_id(value, expected):
    assert normalize_arxiv_id(value) == expected


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("  P2-Type: Na Cathode! ", "p2 type na cathode"),
        ("Ｆｕｌｌ－ｗｉｄｔｈ\u00a0  Title", "full width title"),
        ("Na+ / O²⁻ 🔋 cathode", "na o2 cathode"),
        (None, ""),
        ("  ", ""),
    ],
)
def test_normalize_title(value, expected):
    assert normalize_title(value) == expected


@pytest.mark.parametrize(
    ("normalizer", "value"),
    [
        (normalize_doi, "doi:https://doi.org/10.1000/ABC"),
        (
            normalize_arxiv_id,
            "arXiv:https://arxiv.org/abs/2401.01234v2",
        ),
    ],
)
def test_paper_identifier_normalization_is_idempotent(normalizer, value):
    normalized = normalizer(value)

    assert normalizer(normalized) == normalized


@pytest.mark.parametrize("value", [{}, [], 42, True])
def test_identity_normalizers_ignore_non_string_scalars(value):
    assert normalize_doi(value) is None
    assert normalize_arxiv_id(value) is None
    assert normalize_title(value) == ""
