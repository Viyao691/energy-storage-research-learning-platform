from __future__ import annotations

import ast
import asyncio
from dataclasses import FrozenInstanceError
from pathlib import Path
import traceback
from urllib.parse import parse_qs

import httpx
import pytest
from pydantic import SecretStr

from app.config import AppSettings
from app.paper_sources import (
    ArxivSource,
    build_paper_sources,
    CrossrefSource,
    enabled_source_names,
    OpenAlexSource,
    SearchFilters,
    SemanticScholarSource,
    SourcePaper,
    SourceRequestError,
)


def run(coroutine):
    return asyncio.run(coroutine)


_PAPER_SOURCE_ENV_NAMES = (
    "OPENALEX_ENABLED",
    "OPENALEX_BASE_URL",
    "CROSSREF_ENABLED",
    "CROSSREF_BASE_URL",
    "CROSSREF_MAILTO",
    "ARXIV_ENABLED",
    "ARXIV_BASE_URL",
    "SEMANTIC_SCHOLAR_ENABLED",
    "SEMANTIC_SCHOLAR_BASE_URL",
    "SEMANTIC_SCHOLAR_API_KEY",
    "PAPER_SOURCE_TIMEOUT_SECONDS",
    "PAPER_DOWNLOAD_TIMEOUT_SECONDS",
    "PAPER_DOWNLOAD_MAX_MB",
)


def test_paper_source_settings_have_safe_phase_two_defaults(monkeypatch) -> None:
    for env_name in _PAPER_SOURCE_ENV_NAMES:
        monkeypatch.delenv(env_name, raising=False)
    settings = AppSettings(_env_file=None)

    assert settings.openalex_enabled is True
    assert settings.openalex_base_url == "https://api.openalex.org"
    assert settings.crossref_enabled is True
    assert settings.crossref_base_url == "https://api.crossref.org"
    assert settings.crossref_mailto == ""
    assert settings.arxiv_enabled is True
    assert settings.arxiv_base_url == "https://export.arxiv.org/api"
    assert settings.semantic_scholar_enabled is False
    assert settings.semantic_scholar_base_url == "https://api.semanticscholar.org"
    assert settings.semantic_scholar_api_key.get_secret_value() == ""
    assert settings.paper_source_timeout_seconds == 15
    assert settings.paper_download_timeout_seconds == 30
    assert settings.paper_download_max_mb == 50


def test_paper_source_settings_accept_environment_overrides(monkeypatch) -> None:
    monkeypatch.setenv("OPENALEX_ENABLED", "false")
    monkeypatch.setenv("CROSSREF_ENABLED", "false")
    monkeypatch.setenv("ARXIV_ENABLED", "false")
    monkeypatch.setenv("SEMANTIC_SCHOLAR_ENABLED", "true")
    monkeypatch.setenv("PAPER_SOURCE_TIMEOUT_SECONDS", "23")

    settings = AppSettings(_env_file=None)

    assert enabled_source_names(settings) == ("semantic_scholar",)
    assert settings.paper_source_timeout_seconds == 23


def test_semantic_scholar_key_is_masked_in_all_settings_serializations() -> None:
    secret = "semantic-scholar-private-key"
    settings = AppSettings(
        _env_file=None,
        semantic_scholar_api_key=secret,
    )

    assert isinstance(settings.semantic_scholar_api_key, SecretStr)
    assert settings.semantic_scholar_api_key.get_secret_value() == secret
    rendered = (
        repr(settings),
        repr(settings.model_dump()),
        repr(settings.model_dump(mode="json")),
        settings.model_dump_json(),
    )
    assert all(secret not in value for value in rendered)


@pytest.mark.parametrize(
    "field_name",
    [
        "openalex_base_url",
        "crossref_base_url",
        "arxiv_base_url",
        "semantic_scholar_base_url",
    ],
)
@pytest.mark.parametrize("invalid_url", ["", "ftp://papers.example"])
def test_paper_source_base_urls_require_nonempty_http_urls(
    field_name: str,
    invalid_url: str,
) -> None:
    with pytest.raises(ValueError):
        AppSettings(_env_file=None, **{field_name: invalid_url})


@pytest.mark.parametrize(
    "field_name",
    [
        "openalex_base_url",
        "crossref_base_url",
        "arxiv_base_url",
        "semantic_scholar_base_url",
    ],
)
@pytest.mark.parametrize(
    "unsafe_url",
    [
        "https://user:password@papers.example/api",
        "https://papers.example/api?token=private",
        "https://papers.example/api#private",
    ],
)
def test_paper_source_base_urls_reject_unsafe_components(
    field_name: str,
    unsafe_url: str,
) -> None:
    with pytest.raises(ValueError):
        AppSettings(_env_file=None, **{field_name: unsafe_url})


@pytest.mark.parametrize(
    "field_name",
    [
        "openalex_base_url",
        "crossref_base_url",
        "arxiv_base_url",
        "semantic_scholar_base_url",
    ],
)
def test_paper_source_base_urls_strip_whitespace_and_trailing_slashes(
    field_name: str,
) -> None:
    settings = AppSettings(
        _env_file=None,
        **{field_name: "  https://papers.example/api///  "},
    )

    assert getattr(settings, field_name) == "https://papers.example/api"


@pytest.mark.parametrize(
    ("field_name", "invalid_value"),
    [
        ("paper_source_timeout_seconds", 0),
        ("paper_source_timeout_seconds", 121),
        ("paper_download_timeout_seconds", 0),
        ("paper_download_timeout_seconds", 601),
        ("paper_download_max_mb", 0),
        ("paper_download_max_mb", 1001),
    ],
)
def test_paper_source_limits_reject_out_of_range_values(
    field_name: str,
    invalid_value: int,
) -> None:
    with pytest.raises(ValueError):
        AppSettings(_env_file=None, **{field_name: invalid_value})


def test_registry_builds_enabled_sources_in_deterministic_order_with_shared_client() -> None:
    client = httpx.AsyncClient()
    settings = AppSettings(
        _env_file=None,
        openalex_enabled=True,
        crossref_enabled=True,
        arxiv_enabled=True,
        semantic_scholar_enabled=True,
    )
    try:
        sources = build_paper_sources(settings, client)
    finally:
        run(client.aclose())

    assert [source.name for source in sources] == [
        "openalex",
        "crossref",
        "arxiv",
        "semantic_scholar",
    ]
    assert all(source.client is client for source in sources)


@pytest.mark.parametrize(
    ("enabled_flags", "expected_names"),
    [
        ((True, True, True, False), ("openalex", "crossref", "arxiv")),
        ((False, True, False, True), ("crossref", "semantic_scholar")),
        ((False, False, False, False), ()),
    ],
)
def test_enabled_source_names_match_registry_output(
    enabled_flags: tuple[bool, bool, bool, bool],
    expected_names: tuple[str, ...],
) -> None:
    settings = AppSettings(
        _env_file=None,
        openalex_enabled=enabled_flags[0],
        crossref_enabled=enabled_flags[1],
        arxiv_enabled=enabled_flags[2],
        semantic_scholar_enabled=enabled_flags[3],
    )
    client = httpx.AsyncClient()
    try:
        sources = build_paper_sources(settings, client)
    finally:
        run(client.aclose())

    assert enabled_source_names(settings) == expected_names
    assert tuple(source.name for source in sources) == expected_names


def test_registry_delivers_source_configuration_without_repr_secret_leak() -> None:
    client = httpx.AsyncClient()
    secret = "semantic-scholar-private-key"
    settings = AppSettings(
        _env_file=None,
        openalex_enabled=True,
        openalex_base_url="https://openalex.example/v1/",
        crossref_enabled=True,
        crossref_base_url="https://crossref.example/v2/",
        crossref_mailto="researcher@example.test",
        arxiv_enabled=True,
        arxiv_base_url="https://arxiv.example/api/",
        semantic_scholar_enabled=True,
        semantic_scholar_base_url="https://semantic.example/",
        semantic_scholar_api_key=secret,
        paper_source_timeout_seconds=19,
    )
    try:
        openalex, crossref, arxiv, semantic = build_paper_sources(settings, client)
    finally:
        run(client.aclose())

    assert [source.base_url for source in (openalex, crossref, arxiv, semantic)] == [
        "https://openalex.example/v1",
        "https://crossref.example/v2",
        "https://arxiv.example/api",
        "https://semantic.example/graph/v1",
    ]
    assert [source.timeout for source in (openalex, crossref, arxiv, semantic)] == [
        19,
        19,
        19,
        19,
    ]
    assert crossref.mailto == "researcher@example.test"
    assert crossref.user_agent == "EnergyResearchCopilot/0.2"
    assert semantic.api_key == secret
    assert secret not in repr(settings)
    assert secret not in repr(semantic)
    assert secret not in repr(build_paper_sources(settings, client))


def test_registry_semantic_scholar_default_targets_graph_api(monkeypatch) -> None:
    for env_name in _PAPER_SOURCE_ENV_NAMES:
        monkeypatch.delenv(env_name, raising=False)
    request_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        request_paths.append(request.url.path)
        return httpx.Response(200, json={"data": []})

    async def scenario() -> None:
        settings = AppSettings(
            _env_file=None,
            semantic_scholar_enabled=True,
        )
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(handler)
        ) as client:
            source = build_paper_sources(settings, client)[-1]
            await source.search("energy storage", SearchFilters(limit=1))

    run(scenario())
    assert request_paths == ["/graph/v1/paper/search"]


def test_semantic_scholar_does_not_duplicate_graph_api_suffix() -> None:
    request_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        request_paths.append(request.url.path)
        return httpx.Response(200, json={"data": []})

    async def scenario() -> None:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(handler)
        ) as client:
            source = SemanticScholarSource(
                client=client,
                base_url="https://semantic.example/graph/v1/",
            )
            await source.search("energy storage", SearchFilters(limit=1))

    run(scenario())
    assert request_paths == ["/graph/v1/paper/search"]


@pytest.mark.parametrize(
    ("base_url", "expected"),
    [
        ("https://semantic.example", "https://semantic.example/graph/v1"),
        ("https://semantic.example/", "https://semantic.example/graph/v1"),
        (
            "https://semantic.example/graph/v1",
            "https://semantic.example/graph/v1",
        ),
        (
            "  https://semantic.example//graph//v1///  ",
            "https://semantic.example/graph/v1",
        ),
        (
            "https://semantic.example/graph/v1/graph/v1///",
            "https://semantic.example/graph/v1",
        ),
    ],
)
def test_semantic_scholar_normalizes_graph_api_base_url(
    base_url: str,
    expected: str,
) -> None:
    client = httpx.AsyncClient()
    try:
        source = SemanticScholarSource(client=client, base_url=base_url)
    finally:
        run(client.aclose())

    assert source.base_url == expected


@pytest.mark.parametrize(
    "base_url",
    [
        "https://semantic.example?token=private",
        "https://semantic.example#private",
        "https://user:password@semantic.example",
    ],
)
def test_semantic_scholar_rejects_unsafe_base_urls(base_url: str) -> None:
    client = httpx.AsyncClient()
    try:
        with pytest.raises(ValueError):
            SemanticScholarSource(client=client, base_url=base_url)
    finally:
        run(client.aclose())


def test_source_package_does_not_import_business_database_or_ui_layers() -> None:
    source_package = Path(__file__).parents[1] / "app" / "paper_sources"
    forbidden_prefixes = (
        "app.services",
        "app.models",
        "app.main",
        "app.schemas",
        "frontend",
    )
    violations: list[str] = []

    for module_path in sorted(source_package.glob("*.py")):
        tree = ast.parse(module_path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            imported_modules: list[str] = []
            if isinstance(node, ast.Import):
                imported_modules.extend(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_modules.append(node.module)
            for imported_module in imported_modules:
                if imported_module.startswith(forbidden_prefixes):
                    violations.append(f"{module_path.name}: {imported_module}")

    assert violations == []


def test_source_contract_is_immutable() -> None:
    filters = SearchFilters(year_from=2020, year_to=2024, open_access_only=True, limit=5)
    paper = SourcePaper(
        source="fixture",
        external_id="record-1",
        title="A title",
        normalized_title="a title",
        authors=("Ada Lovelace",),
        first_author="Ada Lovelace",
        abstract="An abstract",
        doi=None,
        arxiv_id=None,
        journal="A journal",
        published_date=None,
        year=None,
        keywords=(),
        landing_url="https://example.test/record-1",
        pdf_url=None,
        is_open_access=False,
        oa_status="closed",
        license=None,
    )

    with pytest.raises(FrozenInstanceError):
        filters.limit = 10  # type: ignore[misc]
    with pytest.raises(FrozenInstanceError):
        paper.title = "Changed"  # type: ignore[misc]


@pytest.mark.parametrize(
    "source_type",
    [OpenAlexSource, CrossrefSource, ArxivSource, SemanticScholarSource],
)
def test_source_adapters_require_an_injected_async_client(source_type) -> None:
    with pytest.raises(TypeError):
        source_type()
    with pytest.raises(TypeError):
        source_type(client=None)


def test_openalex_maps_search_record_and_filters_malformed_items() -> None:
    captured_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_request
        captured_request = request
        return httpx.Response(
            200,
            json={
                "results": [
                    {"id": "https://openalex.org/W0", "display_name": ""},
                    {
                        "id": "https://openalex.org/W123",
                        "display_name": "P2-Type Cathodes",
                        "doi": "https://doi.org/10.1000/ABC",
                        "authorships": [
                            {"author": {"display_name": "Ada Lovelace"}},
                            {"author": {"display_name": "Grace Hopper"}},
                        ],
                        "abstract_inverted_index": {
                            "cathodes": [3],
                            "Layered": [0],
                            "sodium": [2],
                            "oxide": [1],
                        },
                        "primary_location": {
                            "landing_page_url": "https://journal.test/article",
                            "source": {"display_name": "Journal of Storage"},
                        },
                        "publication_date": "2024-02-03",
                        "publication_year": 2024,
                        "type": "review",
                        "cited_by_count": 27,
                        "keywords": [
                            {"display_name": "Sodium-ion battery"},
                            {"display_name": "Layered oxide"},
                        ],
                        "open_access": {"is_oa": True, "oa_status": "gold"},
                        "best_oa_location": {
                            "pdf_url": "https://journal.test/article.pdf",
                            "license": "cc-by",
                        },
                    },
                ]
            },
        )

    async def scenario() -> list[SourcePaper]:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            source = OpenAlexSource(client=client, base_url="https://openalex.test", timeout=3)
            return await source.search(
                "layered oxide",
                SearchFilters(year_from=2020, year_to=2024, open_access_only=True, limit=7),
            )

    papers = run(scenario())

    assert captured_request is not None
    assert captured_request.url.path == "/works"
    assert captured_request.url.params["search"] == "layered oxide"
    assert captured_request.url.params["per-page"] == "7"
    assert captured_request.url.params["filter"] == (
        "from_publication_date:2020-01-01,"
        "to_publication_date:2024-12-31,is_oa:true"
    )
    assert len(papers) == 1
    assert getattr(papers[0], "article_type", None) == "review"
    assert getattr(papers[0], "citation_count", None) == 27
    assert papers[0] == SourcePaper(
        source="openalex",
        external_id="https://openalex.org/W123",
        title="P2-Type Cathodes",
        normalized_title="p2 type cathodes",
        authors=("Ada Lovelace", "Grace Hopper"),
        first_author="Ada Lovelace",
        abstract="Layered oxide sodium cathodes",
        doi="10.1000/abc",
        arxiv_id=None,
        journal="Journal of Storage",
        published_date="2024-02-03",
        year=2024,
        keywords=("Sodium-ion battery", "Layered oxide"),
        landing_url="https://journal.test/article",
        pdf_url="https://journal.test/article.pdf",
        is_open_access=True,
        oa_status="gold",
        license="cc-by",
        article_type="review",
        citation_count=27,
    )


def test_openalex_get_by_id_url_quotes_the_external_id() -> None:
    raw_paths: list[bytes] = []

    def handler(request: httpx.Request) -> httpx.Response:
        raw_paths.append(request.url.raw_path.split(b"?", 1)[0])
        return httpx.Response(
            200,
            json={"id": "https://openalex.org/W123", "title": "Quoted identifier"},
        )

    async def scenario() -> SourcePaper:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await OpenAlexSource(client, "https://openalex.test").get_by_id(
                "https://openalex.org/W123"
            )

    paper = run(scenario())
    assert raw_paths == [b"/works/https%3A%2F%2Fopenalex.org%2FW123"]
    assert paper.external_id == "https://openalex.org/W123"


def test_crossref_maps_metadata_without_promoting_resource_links_to_oa_pdf() -> None:
    captured_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_request
        captured_request = request
        return httpx.Response(
            200,
            json={
                "message": {
                    "items": [
                        {"DOI": "", "title": ["Missing identifier"]},
                        {
                            "DOI": "10.5555/ABC.2",
                            "title": ["Electrochemical <i>storage</i>"],
                            "author": [
                                {"given": "Ada", "family": "Lovelace"},
                                {"family": "Hopper"},
                            ],
                            "abstract": "<jats:p>A <b>useful</b> &amp; concise abstract.</jats:p>",
                            "container-title": ["Storage Letters"],
                            "published": {"date-parts": [[2023, 7, 2]]},
                            "type": "journal-article",
                            "is-referenced-by-count": 14,
                            "URL": "https://doi.org/10.5555/ABC.2",
                            "subject": ["Batteries", "Electrochemistry"],
                            "link": [
                                {
                                    "URL": "https://publisher.test/resource.pdf",
                                    "content-type": "application/pdf",
                                }
                            ],
                            "resource": {
                                "primary": {"URL": "https://publisher.test/resource"}
                            },
                        },
                    ]
                }
            },
        )

    async def scenario() -> list[SourcePaper]:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            source = CrossrefSource(
                client=client,
                base_url="https://crossref.test",
                timeout=4,
                mailto="researcher@example.test",
                user_agent="EnergyResearchCopilot/2",
            )
            return await source.search(
                "electrochemical storage",
                SearchFilters(year_from=2021, year_to=2023, limit=4),
            )

    papers = run(scenario())

    assert captured_request is not None
    assert captured_request.url.path == "/works"
    assert captured_request.url.params["query.bibliographic"] == "electrochemical storage"
    assert captured_request.url.params["rows"] == "4"
    assert captured_request.url.params["mailto"] == "researcher@example.test"
    assert captured_request.url.params["filter"] == (
        "from-pub-date:2021-01-01,until-pub-date:2023-12-31"
    )
    assert captured_request.headers["user-agent"] == "EnergyResearchCopilot/2"
    assert getattr(papers[0], "article_type", None) == "journal-article"
    assert getattr(papers[0], "citation_count", None) == 14
    assert papers == [
        SourcePaper(
            source="crossref",
            external_id="10.5555/abc.2",
            title="Electrochemical storage",
            normalized_title="electrochemical storage",
            authors=("Ada Lovelace", "Hopper"),
            first_author="Ada Lovelace",
            abstract="A useful & concise abstract.",
            doi="10.5555/abc.2",
            arxiv_id=None,
            journal="Storage Letters",
            published_date="2023-07-02",
            year=2023,
            keywords=("Batteries", "Electrochemistry"),
            landing_url="https://doi.org/10.5555/ABC.2",
            pdf_url=None,
            is_open_access=False,
            oa_status="closed",
            license=None,
            article_type="journal-article",
            citation_count=14,
        )
    ]


def test_arxiv_maps_atom_entries_and_uses_id_list_for_get_by_id() -> None:
    requests: list[httpx.Request] = []
    atom = """<?xml version="1.0" encoding="UTF-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom"
          xmlns:arxiv="http://arxiv.org/schemas/atom">
      <entry>
        <id>https://arxiv.org/abs/2401.01234v2</id>
        <title>
          P2 layered
          oxide cathodes
        </title>
        <summary>  A   public
          preprint. </summary>
        <author><name>Ada Lovelace</name></author>
        <author><name>Grace Hopper</name></author>
        <published>2024-01-03T12:00:00Z</published>
        <link rel="alternate" href="https://arxiv.org/abs/2401.01234v2" />
        <link title="pdf" type="application/pdf" href="https://arxiv.org/pdf/2401.01234v2" />
        <category term="cond-mat.mtrl-sci" />
        <arxiv:doi>https://doi.org/10.1000/ARXIV.1</arxiv:doi>
        <arxiv:journal_ref>Storage Letters 1 (2024)</arxiv:journal_ref>
      </entry>
      <entry><id>https://arxiv.org/abs/2401.09999</id><title> </title></entry>
    </feed>"""

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            text=atom,
            headers={"content-type": "application/atom+xml"},
        )

    async def scenario() -> tuple[list[SourcePaper], SourcePaper]:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            source = ArxivSource(client=client, base_url="https://export.arxiv.test/api", timeout=5)
            found = await source.search(
                "layered oxide",
                SearchFilters(year_from=2022, year_to=2024, open_access_only=True, limit=6),
            )
            fetched = await source.get_by_id("arXiv:2401.01234v2")
            return found, fetched

    papers, fetched = run(scenario())

    assert requests[0].url.path == "/api/query"
    search_params = parse_qs(requests[0].url.query.decode())
    assert search_params["max_results"] == ["6"]
    assert search_params["search_query"] == [
        "all:layered oxide AND submittedDate:[202201010000 TO 202412312359]"
    ]
    get_params = parse_qs(requests[1].url.query.decode())
    assert get_params == {"id_list": ["2401.01234"]}
    assert papers == [fetched]
    assert papers[0] == SourcePaper(
        source="arxiv",
        external_id="2401.01234",
        title="P2 layered oxide cathodes",
        normalized_title="p2 layered oxide cathodes",
        authors=("Ada Lovelace", "Grace Hopper"),
        first_author="Ada Lovelace",
        abstract="A public preprint.",
        doi="10.1000/arxiv.1",
        arxiv_id="2401.01234",
        journal="Storage Letters 1 (2024)",
        published_date="2024-01-03",
        year=2024,
        keywords=("cond-mat.mtrl-sci",),
        landing_url="https://arxiv.org/abs/2401.01234v2",
        pdf_url="https://arxiv.org/pdf/2401.01234v2",
        is_open_access=True,
        oa_status="green",
        license=None,
        article_type="preprint",
        citation_count=0,
    )


def test_semantic_scholar_maps_fields_and_keeps_api_key_in_header_only() -> None:
    requests: list[httpx.Request] = []
    paper_record = {
        "paperId": "paper/ABC:1",
        "title": "Data-driven battery discovery",
        "abstract": "A semantic abstract.",
        "year": 2022,
        "authors": [{"name": "Ada Lovelace"}, {"name": "Grace Hopper"}],
        "externalIds": {
            "DOI": "https://doi.org/10.7777/SEM.1",
            "ArXiv": "arXiv:2201.12345v3",
        },
        "venue": "Energy AI",
        "publicationDate": "2022-09-08",
        "publicationTypes": ["Review"],
        "citationCount": 36,
        "url": "https://semanticscholar.org/paper/ABC",
        "isOpenAccess": True,
        "openAccessPdf": {
            "url": "https://repository.test/paper.pdf",
            "status": "GREEN",
            "license": "CC-BY-4.0",
        },
    }

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path != "/graph/v1/paper/search":
            return httpx.Response(200, json=paper_record)
        return httpx.Response(
            200,
            json={
                "data": [
                    {"paperId": None, "title": "Missing identifier"},
                    paper_record,
                ]
            },
        )

    async def scenario() -> tuple[list[SourcePaper], SourcePaper]:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            source = SemanticScholarSource(
                client=client,
                base_url="https://semantic.test/graph/v1",
                timeout=6,
                api_key="backend-secret-key",
            )
            found = await source.search(
                "battery discovery",
                SearchFilters(year_from=2020, year_to=2022, open_access_only=True, limit=3),
            )
            fetched = await source.get_by_id("paper/ABC:1")
            return found, fetched

    papers, fetched = run(scenario())

    assert requests[0].url.path == "/graph/v1/paper/search"
    assert requests[0].url.params["query"] == "battery discovery"
    assert requests[0].url.params["limit"] == "3"
    assert requests[0].url.params["year"] == "2020-2022"
    assert requests[0].headers["x-api-key"] == "backend-secret-key"
    assert "backend-secret-key" not in str(requests[0].url)
    expected_fields = (
        "paperId,title,abstract,year,authors,externalIds,venue,"
        "publicationDate,url,isOpenAccess,openAccessPdf,publicationTypes,"
        "citationCount"
    )
    assert requests[0].url.params["fields"] == expected_fields
    assert requests[1].url.raw_path == (
        b"/graph/v1/paper/paper%2FABC%3A1?"
        b"fields=paperId%2Ctitle%2Cabstract%2Cyear%2Cauthors%2CexternalIds%2Cvenue"
        b"%2CpublicationDate%2Curl%2CisOpenAccess%2CopenAccessPdf"
        b"%2CpublicationTypes%2CcitationCount"
    )
    assert requests[1].url.params["fields"] == expected_fields
    assert getattr(papers[0], "article_type", None) == "Review"
    assert getattr(papers[0], "citation_count", None) == 36
    assert papers == [fetched]
    assert papers[0] == SourcePaper(
        source="semantic_scholar",
        external_id="paper/ABC:1",
        title="Data-driven battery discovery",
        normalized_title="data driven battery discovery",
        authors=("Ada Lovelace", "Grace Hopper"),
        first_author="Ada Lovelace",
        abstract="A semantic abstract.",
        doi="10.7777/sem.1",
        arxiv_id="2201.12345",
        journal="Energy AI",
        published_date="2022-09-08",
        year=2022,
        keywords=(),
        landing_url="https://semanticscholar.org/paper/ABC",
        pdf_url="https://repository.test/paper.pdf",
        is_open_access=True,
        oa_status="green",
        license="CC-BY-4.0",
        article_type="Review",
        citation_count=36,
    )


def test_semantic_scholar_omits_empty_api_key_header() -> None:
    request_headers: httpx.Headers | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal request_headers
        request_headers = request.headers
        return httpx.Response(200, json={"data": []})

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            source = SemanticScholarSource(client=client, api_key="")
            await source.search("query", SearchFilters(limit=1))

    run(scenario())
    assert request_headers is not None
    assert "x-api-key" not in request_headers


def test_source_errors_discard_sensitive_http_exception_state() -> None:
    api_key = "private-api-key"
    mailto = "private-mail@example.test"
    query = "private query value"

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="private upstream response")

    async def scenario() -> tuple[SourceRequestError, SourceRequestError]:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            semantic = SemanticScholarSource(client=client, api_key=api_key)
            crossref = CrossrefSource(client=client, mailto=mailto)
            captured: list[SourceRequestError] = []
            for source in (semantic, crossref):
                try:
                    await source.search(query, SearchFilters(limit=1))
                except SourceRequestError as error:
                    captured.append(error)
            return captured[0], captured[1]

    for error in run(scenario()):
        assert error.__cause__ is None
        assert error.__context__ is None
        formatted = "".join(traceback.format_exception(error))
        assert api_key not in formatted
        assert mailto not in formatted
        assert query not in formatted


class _CountingStream(httpx.AsyncByteStream):
    def __init__(self, chunks: int, chunk_size: int) -> None:
        self.total_chunks = chunks
        self.chunk_size = chunk_size
        self.chunks_read = 0

    async def __aiter__(self):
        for _ in range(self.total_chunks):
            self.chunks_read += 1
            yield b"x" * self.chunk_size

    async def aclose(self) -> None:
        return None


def test_source_response_read_stops_at_five_mebibytes() -> None:
    stream = _CountingStream(chunks=10, chunk_size=1024 * 1024)

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"content-type": "application/json"},
            stream=stream,
        )

    async def scenario() -> SourceRequestError:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            source = OpenAlexSource(client=client)
            with pytest.raises(SourceRequestError) as captured:
                await source.search("query", SearchFilters(limit=1))
            return captured.value

    error = run(scenario())
    assert stream.chunks_read <= 6
    assert error.__cause__ is None
    assert error.__context__ is None


@pytest.mark.parametrize(
    "xml",
    [
        "<feed>",
        """<!DOCTYPE feed [<!ENTITY injected "entity expansion">]>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <id>https://arxiv.org/abs/2401.01234</id>
            <title>&injected;</title>
          </entry>
        </feed>""",
    ],
)
def test_arxiv_rejects_malformed_or_entity_declaring_xml(xml: str) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text=xml)

    async def scenario() -> SourceRequestError:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            source = ArxivSource(client=client)
            with pytest.raises(SourceRequestError) as captured:
                await source.search("query", SearchFilters(limit=1))
            return captured.value

    error = run(scenario())
    assert error.__cause__ is None
    assert error.__context__ is None


@pytest.mark.parametrize(
    ("source_factory", "payload"),
    [
        (
            lambda client: OpenAlexSource(client=client),
            {
                "results": [
                    {
                        "id": "W1",
                        "title": "Wrong scalar metadata",
                        "doi": {"unexpected": "object"},
                        "publication_date": ["2024-01-01"],
                        "publication_year": True,
                    }
                ]
            },
        ),
        (
            lambda client: CrossrefSource(client=client),
            {
                "message": {
                    "items": [
                        {
                            "DOI": {"unexpected": "object"},
                            "title": ["Wrong scalar metadata"],
                        }
                    ]
                }
            },
        ),
        (
            lambda client: SemanticScholarSource(client=client),
            {
                "data": [
                    {
                        "paperId": "S1",
                        "title": "Wrong scalar metadata",
                        "externalIds": {
                            "DOI": {"unexpected": "object"},
                            "ArXiv": ["unexpected", "array"],
                        },
                        "publicationDate": {"unexpected": "object"},
                        "year": True,
                    }
                ]
            },
        ),
    ],
)
def test_wrong_type_metadata_is_safely_mapped_or_skipped_during_healthcheck(
    source_factory,
    payload,
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=payload)

    async def scenario():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await source_factory(client).healthcheck()

    status = run(scenario())
    assert status.enabled is True
    assert status.ok is True


def test_adapters_reject_bool_years_and_impossible_dates() -> None:
    openalex_payload = {
        "results": [
            {
                "id": "W1",
                "title": "OpenAlex date",
                "publication_date": "2024-02-30",
                "publication_year": True,
            }
        ]
    }
    crossref_payload = {
        "message": {
            "items": [
                {
                    "DOI": "10.1000/date",
                    "title": ["Crossref date"],
                    "published": {"date-parts": [[2024, 13, 2]]},
                }
            ]
        }
    }
    arxiv_payload = """<feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <id>https://arxiv.org/abs/2401.01234</id>
        <title>arXiv date</title>
        <published>2024-02-30T00:00:00Z</published>
      </entry>
    </feed>"""
    semantic_payload = {
        "data": [
            {
                "paperId": "S1",
                "title": "Semantic date",
                "publicationDate": "2024-02-30",
                "year": True,
            }
        ]
    }

    async def fetch_json(source_type, payload):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json=payload)

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return (await source_type(client=client).search(
                "date",
                SearchFilters(limit=1),
            ))[0]

    async def fetch_arxiv():
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, text=arxiv_payload)

        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return (await ArxivSource(client=client).search(
                "date",
                SearchFilters(limit=1),
            ))[0]

    papers = [
        run(fetch_json(OpenAlexSource, openalex_payload)),
        run(fetch_json(CrossrefSource, crossref_payload)),
        run(fetch_arxiv()),
        run(fetch_json(SemanticScholarSource, semantic_payload)),
    ]
    assert [(paper.published_date, paper.year) for paper in papers] == [
        (None, None),
        (None, None),
        (None, None),
        (None, None),
    ]


@pytest.mark.parametrize("invalid_flag", ["false", 1, {"value": True}])
@pytest.mark.parametrize("source_name", ["openalex", "semantic_scholar"])
def test_non_boolean_oa_flags_cannot_promote_pdf_access(
    source_name: str,
    invalid_flag,
) -> None:
    if source_name == "openalex":
        payload = {
            "results": [
                {
                    "id": "W1",
                    "title": "Strict OpenAlex flag",
                    "open_access": {
                        "is_oa": invalid_flag,
                        "oa_status": "gold",
                    },
                    "best_oa_location": {
                        "pdf_url": "https://private.test/openalex.pdf",
                    },
                }
            ]
        }
        source_type = OpenAlexSource
    else:
        payload = {
            "data": [
                {
                    "paperId": "S1",
                    "title": "Strict Semantic Scholar flag",
                    "isOpenAccess": invalid_flag,
                    "openAccessPdf": {
                        "url": "https://private.test/semantic.pdf",
                        "status": "gold",
                    },
                }
            ]
        }
        source_type = SemanticScholarSource

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=payload)

    async def scenario() -> SourcePaper:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            source = source_type(client=client)
            return (await source.search("strict flag", SearchFilters(limit=1)))[0]

    paper = run(scenario())
    assert paper.is_open_access is False
    assert paper.pdf_url is None
    assert paper.oa_status == "closed"


@pytest.mark.parametrize(
    "source_factory",
    [
        lambda client: OpenAlexSource(client=client),
        lambda client: CrossrefSource(client=client),
        lambda client: ArxivSource(client=client),
        lambda client: SemanticScholarSource(client=client, api_key="top-secret"),
    ],
)
def test_adapters_raise_typed_sanitized_error_on_http_failure(source_factory) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="upstream-secret-response")

    async def scenario() -> None:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            source = source_factory(client)
            with pytest.raises(SourceRequestError) as error:
                await source.search("query", SearchFilters(limit=1))
            assert "upstream-secret-response" not in str(error.value)
            assert "top-secret" not in str(error.value)

    run(scenario())


@pytest.mark.parametrize(
    "source_factory",
    [
        lambda client: OpenAlexSource(client=client),
        lambda client: CrossrefSource(client=client),
        lambda client: ArxivSource(client=client),
        lambda client: SemanticScholarSource(client=client, api_key="top-secret"),
    ],
)
def test_healthcheck_returns_sanitized_status_instead_of_raising(source_factory) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="private-upstream-detail top-secret")

    async def scenario():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            return await source_factory(client).healthcheck()

    status = run(scenario())
    assert status.enabled is True
    assert status.ok is False
    assert "private-upstream-detail" not in status.message
    assert "top-secret" not in status.message
