from __future__ import annotations

import asyncio
from dataclasses import replace
from datetime import date
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.paper_sources.base import SearchFilters, SourcePaper, SourceStatus


def _paper(
    source: str = "openalex",
    external_id: str = "W123",
    title: str = "P2 layered oxide cathode",
) -> SourcePaper:
    return SourcePaper(
        source=source,
        external_id=external_id,
        title=title,
        normalized_title="p2 layered oxide cathode",
        authors=("Ada Chen",),
        first_author="Ada Chen",
        abstract="A sodium-ion battery cathode study.",
        doi="10.1000/p2",
        arxiv_id=None,
        journal="Battery Journal",
        published_date="2026-01-02",
        year=2026,
        keywords=("sodium-ion battery", "P2"),
        landing_url="https://example.test/paper",
        pdf_url=None,
        is_open_access=False,
        oa_status="closed",
        license=None,
    )


class StubSource:
    def __init__(
        self,
        name: str,
        *,
        papers: list[SourcePaper] | None = None,
        detail: SourcePaper | None = None,
        search_error: Exception | None = None,
        health_ok: bool = True,
    ) -> None:
        self.name = name
        self.papers = papers or []
        self.detail = detail
        self.search_error = search_error
        self.health_ok = health_ok
        self.search_calls: list[tuple[str, SearchFilters]] = []
        self.detail_calls: list[str] = []
        self.health_calls = 0

    async def search(
        self,
        query: str,
        filters: SearchFilters,
    ) -> list[SourcePaper]:
        self.search_calls.append((query, filters))
        await asyncio.sleep(0)
        if self.search_error is not None:
            raise self.search_error
        return self.papers

    async def get_by_id(self, external_id: str) -> SourcePaper:
        self.detail_calls.append(external_id)
        await asyncio.sleep(0)
        if self.detail is None:
            raise RuntimeError("upstream secret URL https://private.test")
        return self.detail

    async def healthcheck(self) -> SourceStatus:
        self.health_calls += 1
        await asyncio.sleep(0)
        return SourceStatus(
            enabled=True,
            ok=self.health_ok,
            message="raw-key=semantic-secret-9876",
        )


@pytest.fixture()
def phase2_client(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'phase2-api.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("OPENALEX_ENABLED", "true")
    monkeypatch.setenv("CROSSREF_ENABLED", "true")
    monkeypatch.setenv("ARXIV_ENABLED", "false")
    monkeypatch.setenv("SEMANTIC_SCHOLAR_ENABLED", "false")
    monkeypatch.setenv("SEMANTIC_SCHOLAR_API_KEY", "semantic-secret-9876")
    from app.config import reset_settings_cache
    from app.main import create_app

    reset_settings_cache()
    with TestClient(create_app()) as client:
        yield client
    reset_settings_cache()


def _inject_sources(
    client: TestClient,
    sources: list[StubSource],
) -> list[httpx.AsyncClient]:
    clients: list[httpx.AsyncClient] = []

    def client_factory() -> httpx.AsyncClient:
        created = httpx.AsyncClient(
            transport=httpx.MockTransport(
                lambda request: httpx.Response(500, request=request)
            ),
            trust_env=False,
        )
        clients.append(created)
        return created

    client.app.state.paper_source_client_factory = client_factory
    client.app.state.paper_source_builder = (
        lambda settings, http_client: list(sources)
    )
    return clients


def test_phase2_request_dtos_reject_coerced_boolean_and_unknown_source() -> None:
    from app.schemas import PaperImportRequest

    with pytest.raises(ValidationError):
        PaperImportRequest(
            source="openalex",
            external_id="W123",
            download_open_pdf=1,
        )
    with pytest.raises(ValidationError):
        PaperImportRequest(
            source="unknown",
            external_id="W123",
            download_open_pdf=False,
        )


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/search/papers?q=x",
        "/api/v1/search/papers?q=battery&year_from=true",
        "/api/v1/search/papers?q=battery&year_from=nan",
        "/api/v1/search/papers?q=battery&open_access_only=1",
        "/api/v1/search/papers?q=battery&page=0",
        "/api/v1/search/papers?q=battery&page=51",
        "/api/v1/search/papers?q=battery&page_size=51",
        "/api/v1/search/papers?q=battery&source=unknown",
    ],
)
def test_search_rejects_invalid_boundaries(
    phase2_client: TestClient,
    path: str,
) -> None:
    response = phase2_client.get(path)
    assert response.status_code == 422
    assert "请求参数不合法" in response.json()["detail"]


def test_search_rejects_reversed_year_range(
    phase2_client: TestClient,
) -> None:
    response = phase2_client.get(
        "/api/v1/search/papers",
        params={
            "q": "battery",
            "year_from": date.today().year,
            "year_to": 2000,
        },
    )
    assert response.status_code == 422


def test_search_returns_partial_results_statuses_and_closes_request_client(
    phase2_client: TestClient,
) -> None:
    good = StubSource("openalex", papers=[_paper()])
    failed = StubSource(
        "crossref",
        search_error=RuntimeError(
            "api_key=semantic-secret-9876 https://private.test"  # secret-scan: allow test fixture
        ),
    )
    clients = _inject_sources(phase2_client, [good, failed])

    response = phase2_client.get(
        "/api/v1/search/papers",
        params={"q": "sodium battery", "page": 1, "page_size": 1},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total_before_pagination"] == 1
    assert "total" not in payload
    assert payload["items"][0]["title"] == "P2 layered oxide cathode"
    assert payload["items"][0]["authors"] == ["Ada Chen"]
    assert payload["items"][0]["import_source"] == "openalex"
    assert payload["items"][0]["import_external_id"] == "W123"
    assert payload["items"][0]["already_imported"] is False
    assert payload["items"][0]["paper_id"] is None
    assert payload["source_statuses"][0]["source"] == "openalex"
    assert payload["source_statuses"][1]["ok"] is False
    assert payload["warnings"]
    assert "semantic-secret-9876" not in response.text
    assert "private.test" not in response.text
    assert len(clients) == 1
    assert clients[0].is_closed is True


def test_search_all_sources_failed_returns_safe_503(
    phase2_client: TestClient,
) -> None:
    sources = [
        StubSource(
            "openalex",
            search_error=RuntimeError("raw-key=semantic-secret-9876"),
        ),
        StubSource(
            "crossref",
            search_error=RuntimeError("https://private.test"),
        ),
    ]
    _inject_sources(phase2_client, sources)

    response = phase2_client.get(
        "/api/v1/search/papers",
        params={"q": "sodium battery"},
    )

    assert response.status_code == 503
    assert "所有论文来源" in response.json()["detail"]
    assert len(response.json()["source_statuses"]) == 2
    assert "semantic-secret-9876" not in response.text
    assert "private.test" not in response.text


def test_search_rejects_known_but_disabled_source_without_network(
    phase2_client: TestClient,
) -> None:
    openalex = StubSource("openalex", papers=[_paper()])
    crossref = StubSource("crossref")
    _inject_sources(phase2_client, [openalex, crossref])

    response = phase2_client.get(
        "/api/v1/search/papers",
        params={"q": "battery", "sources": "arxiv"},
    )

    assert response.status_code == 400
    assert openalex.search_calls == []
    assert crossref.search_calls == []


def test_search_uses_repeated_sources_filter_and_rejects_legacy_source(
    phase2_client: TestClient,
) -> None:
    openalex = StubSource("openalex", papers=[_paper()])
    crossref = StubSource("crossref", papers=[_paper("crossref", "C123")])
    _inject_sources(phase2_client, [openalex, crossref])

    selected = phase2_client.get(
        "/api/v1/search/papers",
        params=[("q", "battery"), ("sources", "openalex")],
    )
    legacy = phase2_client.get(
        "/api/v1/search/papers",
        params=[("q", "battery"), ("source", "openalex")],
    )

    assert selected.status_code == 200
    assert len(openalex.search_calls) == 1
    assert crossref.search_calls == []
    assert legacy.status_code == 422
    assert len(openalex.search_calls) == 1
    assert crossref.search_calls == []


def test_search_reports_total_before_pagination(
    phase2_client: TestClient,
) -> None:
    first = _paper()
    second = replace(
        _paper(external_id="W456", title="O3 layered oxide cathode"),
        normalized_title="o3 layered oxide cathode",
        doi="10.1000/o3",
    )
    _inject_sources(
        phase2_client,
        [StubSource("openalex", papers=[first, second])],
    )

    response = phase2_client.get(
        "/api/v1/search/papers",
        params={
            "q": "layered oxide",
            "page": 1,
            "page_size": 1,
            "sources": "openalex",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) == 1
    assert payload["total_before_pagination"] == 2
    assert "total" not in payload


def test_search_marks_previously_imported_paper_with_canonical_identity(
    phase2_client: TestClient,
) -> None:
    source = StubSource(
        "openalex",
        papers=[_paper()],
        detail=_paper(),
    )
    _inject_sources(phase2_client, [source])
    imported = phase2_client.post(
        "/api/v1/papers/import",
        json={
            "source": "openalex",
            "external_id": "W123",
            "download_open_pdf": False,
        },
    )

    response = phase2_client.get(
        "/api/v1/search/papers",
        params={"q": "battery", "sources": "openalex"},
    )

    assert imported.status_code == 200
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["import_source"] == "openalex"
    assert item["import_external_id"] == "W123"
    assert item["already_imported"] is True
    assert item["paper_id"] == imported.json()["paper"]["id"]

    state = phase2_client.patch(
        f"/api/v1/papers/{item['paper_id']}/state",
        json={"is_favorite": True, "is_read": False},
    )
    refreshed = phase2_client.get(
        "/api/v1/search/papers",
        params={"q": "battery", "sources": "openalex"},
    ).json()["items"][0]
    assert state.status_code == 200
    assert refreshed["is_favorite"] is True
    assert refreshed["is_read"] is False
    assert refreshed["article_type"] == ""
    assert refreshed["citation_count"] == 0


def test_search_does_not_match_title_identity_without_first_author(
    phase2_client: TestClient,
) -> None:
    from app.models import Paper

    with phase2_client.app.state.session_factory() as db:
        db.add(
            Paper(
                title="P2 layered oxide cathode",
                authors_json="[]",
                published_date="2026-01-02",
                file_size=0,
            )
        )
        db.commit()
    source_paper = replace(
        _paper(),
        authors=(),
        first_author="",
        doi=None,
        arxiv_id=None,
    )
    _inject_sources(
        phase2_client,
        [StubSource("openalex", papers=[source_paper])],
    )

    response = phase2_client.get(
        "/api/v1/search/papers",
        params={"q": "battery", "sources": "openalex"},
    )

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["already_imported"] is False
    assert item["paper_id"] is None


def test_search_conservatively_rejects_conflicting_database_identities(
    phase2_client: TestClient,
) -> None:
    from app.models import Paper, PaperSourceRecord

    with phase2_client.app.state.session_factory() as db:
        doi_owner = Paper(
            title="DOI identity owner",
            doi="10.1000/p2",
            file_size=0,
        )
        source_owner = Paper(
            title="Source identity owner",
            file_size=0,
        )
        db.add_all([doi_owner, source_owner])
        db.flush()
        db.add(
            PaperSourceRecord(
                paper_id=source_owner.id,
                source="openalex",
                external_id="W123",
            )
        )
        db.commit()
    _inject_sources(
        phase2_client,
        [StubSource("openalex", papers=[_paper()])],
    )

    response = phase2_client.get(
        "/api/v1/search/papers",
        params={"q": "battery", "sources": "openalex"},
    )

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["already_imported"] is False
    assert item["paper_id"] is None


def test_search_strong_doi_match_is_not_denied_by_weak_title_match(
    phase2_client: TestClient,
) -> None:
    from app.models import Paper

    with phase2_client.app.state.session_factory() as db:
        doi_owner = Paper(
            title="Canonical DOI owner",
            doi="10.1000/p2",
            file_size=0,
        )
        weak_title_owner = Paper(
            title="P2 layered oxide cathode",
            authors_json='["Ada Chen"]',
            published_date="2026-01-02",
            file_size=0,
        )
        db.add_all([doi_owner, weak_title_owner])
        db.commit()
        doi_owner_id = doi_owner.id
    _inject_sources(
        phase2_client,
        [StubSource("openalex", papers=[_paper()])],
    )

    response = phase2_client.get(
        "/api/v1/search/papers",
        params={"q": "battery", "sources": "openalex"},
    )

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["already_imported"] is True
    assert item["paper_id"] == doi_owner_id


def test_search_canonical_source_match_ignores_secondary_candidate_match(
    phase2_client: TestClient,
) -> None:
    from app.models import Paper, PaperSourceRecord

    with phase2_client.app.state.session_factory() as db:
        canonical_owner = Paper(
            title="Canonical source owner",
            file_size=0,
        )
        secondary_owner = Paper(
            title="Secondary source owner",
            file_size=0,
        )
        db.add_all([canonical_owner, secondary_owner])
        db.flush()
        db.add_all(
            [
                PaperSourceRecord(
                    paper_id=canonical_owner.id,
                    source="openalex",
                    external_id="W123",
                ),
                PaperSourceRecord(
                    paper_id=secondary_owner.id,
                    source="crossref",
                    external_id="C123",
                ),
            ]
        )
        db.commit()
        canonical_owner_id = canonical_owner.id

    openalex_paper = replace(_paper(), doi=None)
    crossref_paper = replace(
        _paper("crossref", "C123"),
        doi=None,
    )
    _inject_sources(
        phase2_client,
        [
            StubSource("openalex", papers=[openalex_paper]),
            StubSource("crossref", papers=[crossref_paper]),
        ],
    )

    response = phase2_client.get(
        "/api/v1/search/papers",
        params=[
            ("q", "battery"),
            ("sources", "openalex"),
            ("sources", "crossref"),
        ],
    )

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["import_source"] == "openalex"
    assert item["import_external_id"] == "W123"
    assert item["already_imported"] is True
    assert item["paper_id"] == canonical_owner_id


def test_import_refetches_server_side_and_duplicate_returns_existing_id(
    phase2_client: TestClient,
) -> None:
    source = StubSource("openalex", detail=_paper())
    clients = _inject_sources(phase2_client, [source])
    request = {
        "source": "openalex",
        "external_id": "W123",
        "download_open_pdf": False,
    }

    first = phase2_client.post("/api/v1/papers/import", json=request)
    second = phase2_client.post("/api/v1/papers/import", json=request)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["created"] is True
    assert second.json()["created"] is False
    assert second.json()["paper"]["id"] == first.json()["paper"]["id"]
    assert source.detail_calls == ["W123", "W123"]
    assert all(item.is_closed for item in clients)


def test_import_unknown_or_disabled_source_is_safe_4xx(
    phase2_client: TestClient,
) -> None:
    _inject_sources(phase2_client, [StubSource("openalex", detail=_paper())])

    unknown = phase2_client.post(
        "/api/v1/papers/import",
        json={
            "source": "other",
            "external_id": "x",
            "download_open_pdf": False,
        },
    )
    disabled = phase2_client.post(
        "/api/v1/papers/import",
        json={
            "source": "arxiv",
            "external_id": "2401.00001",
            "download_open_pdf": False,
        },
    )

    assert unknown.status_code == 422
    assert disabled.status_code == 400
    assert "semantic-secret-9876" not in disabled.text


def test_metadata_only_paper_response_parses_json_lists_without_raw_fields(
    phase2_client: TestClient,
) -> None:
    source = StubSource("openalex", detail=_paper())
    _inject_sources(phase2_client, [source])
    imported = phase2_client.post(
        "/api/v1/papers/import",
        json={
            "source": "openalex",
            "external_id": "W123",
            "download_open_pdf": False,
        },
    )

    assert imported.status_code == 200
    paper = imported.json()["paper"]
    assert paper["original_filename"] is None
    assert paper["file_hash"] is None
    assert paper["authors"] == ["Ada Chen"]
    assert paper["keywords"] == ["sodium-ion battery", "P2"]
    assert paper["acquisition_status"] == "abstract_only"
    assert "authors_json" not in paper
    assert "keywords_json" not in paper
    assert "file_path" not in paper


def test_source_status_lists_all_sources_skips_disabled_and_never_leaks_key(
    phase2_client: TestClient,
) -> None:
    openalex = StubSource("openalex")
    crossref = StubSource("crossref", health_ok=False)
    clients = _inject_sources(phase2_client, [openalex, crossref])

    response = phase2_client.get("/api/v1/sources/status")

    assert response.status_code == 200
    payload = response.json()
    assert [item["source"] for item in payload] == [
        "openalex",
        "crossref",
        "arxiv",
        "semantic_scholar",
    ]
    assert payload[0]["enabled"] is True
    assert payload[1]["ok"] is False
    assert payload[2]["enabled"] is False
    assert payload[3]["enabled"] is False
    assert payload[3]["key_configured"] is True
    assert openalex.health_calls == 1
    assert crossref.health_calls == 1
    assert "semantic-secret-9876" not in response.text
    assert all(item.is_closed for item in clients)


def test_diagnostics_aggregates_academic_source_statuses_without_leaking_key(
    phase2_client: TestClient,
) -> None:
    openalex = StubSource("openalex")
    crossref = StubSource("crossref", health_ok=False)
    clients = _inject_sources(phase2_client, [openalex, crossref])

    response = phase2_client.get("/api/v1/diagnostics")

    assert response.status_code == 200
    academic = response.json()["academic_search"]
    assert academic["status"] == "degraded"
    assert academic["message"] == "1/2 个已启用学术来源连接正常"
    assert [item["source"] for item in academic["sources"]] == [
        "openalex",
        "crossref",
        "arxiv",
        "semantic_scholar",
    ]
    assert academic["sources"][0]["message"] == "连接正常"
    assert academic["sources"][1]["message"] == "来源暂不可用"
    assert academic["sources"][2]["message"] == "未启用"
    assert academic["sources"][3]["key_configured"] is True
    assert openalex.health_calls == 1
    assert crossref.health_calls == 1
    assert "semantic-secret-9876" not in response.text
    assert all(item.is_closed for item in clients)
