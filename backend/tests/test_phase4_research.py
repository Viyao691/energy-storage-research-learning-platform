from __future__ import annotations

import asyncio
import json
import threading
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from pydantic import ValidationError
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient


BACKEND_ROOT = Path(__file__).resolve().parents[1]
ALEMBIC_DIR = BACKEND_ROOT / "alembic"


def _database_url(database_path: Path) -> str:
    return f"sqlite:///{database_path.as_posix()}"


def _alembic_config(database_url: str) -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", ALEMBIC_DIR.as_posix())
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def _upgrade_database(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> sa.Engine:
    database_url = _database_url(tmp_path / "phase4.db")
    monkeypatch.setenv("DATABASE_URL", database_url)
    from app.config import reset_settings_cache
    from app.database import enable_sqlite_foreign_keys

    reset_settings_cache()
    command.upgrade(_alembic_config(database_url), "0012")
    command.upgrade(_alembic_config(database_url), "head")
    return enable_sqlite_foreign_keys(sa.create_engine(database_url))


@pytest.fixture()
def phase4_engine(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> sa.Engine:
    engine = _upgrade_database(tmp_path, monkeypatch)
    yield engine
    engine.dispose()


def test_research_subscription_create_defaults_to_weekly_interval(
) -> None:
    from app import schemas

    dto_type = getattr(schemas, "ResearchSubscriptionCreate", None)
    assert dto_type is not None
    assert {
        "name",
        "sources",
        "year_from",
        "year_to",
        "open_access_only",
    }.issubset(dto_type.model_fields)
    subscription = dto_type(
        name="Layered oxide weekly scan",
        query="  sodium-ion layered oxide cathode  ",
    )
    assert subscription.query == "sodium-ion layered oxide cathode"
    assert subscription.interval_hours == 168


def test_news_failure_preserves_paper_results_and_reports_partial(phase4_engine):
    from app.models import ResearchSubscription
    from app.services.research import ResearchService

    class FailedNews:
        name = "mit-energy"

        async def search(self, *_args):
            raise RuntimeError("controlled unavailable feed")

    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    subscription_id = _research_subscription_id(phase4_engine)
    paper = _research_paper(external_id="news-failure-paper", title="Sodium storage")
    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda *_: [_ResearchSource("openalex", [paper])],
        paper_source_client_factory=_NoopClient,
        settings_provider=lambda: object(),
        now_provider=lambda: datetime(2026, 9, 30),
        news_source_builder=lambda _: [FailedNews()],
    )
    run = _run(service.run_subscription(subscription_id))
    assert run.status == "partial"
    assert run.recommended_count == 1
    assert "mit-energy" in run.warnings_json
    with factory() as db:
        assert db.get(ResearchSubscription, subscription_id).last_success_at == datetime(2026, 9, 30)


def test_research_subscription_create_rejects_invalid_boundaries_and_unknown_fields(
) -> None:
    from app import schemas

    dto_type = getattr(schemas, "ResearchSubscriptionCreate", None)
    assert dto_type is not None
    with pytest.raises(ValidationError):
        dto_type(
            name="Layered oxide weekly scan",
            query="sodium-ion layered oxide cathode",
            interval_hours=23,
        )
    with pytest.raises(ValidationError):
        dto_type(
            name="Layered oxide weekly scan",
            query="sodium-ion layered oxide cathode",
            year_from=2026,
            year_to=2025,
        )
    with pytest.raises(ValidationError):
        dto_type(
            name="Layered oxide weekly scan",
            query="sodium-ion layered oxide cathode",
            unexpected=True,
        )
    with pytest.raises(ValidationError):
        dto_type(name="Layered oxide weekly scan", query="   ")
    with pytest.raises(ValidationError):
        schemas.ResearchSubscriptionUpdate(query="   ")


def test_research_migration_from_0012_creates_cascading_subscription_tables(
    phase4_engine: sa.Engine,
) -> None:
    inspector = sa.inspect(phase4_engine)
    assert {
        "research_subscriptions",
        "research_runs",
        "research_recommendations",
        "research_notifications",
    }.issubset(inspector.get_table_names())
    assert {
        "name",
        "sources_json",
        "year_from",
        "year_to",
        "open_access_only",
        "last_started_at",
        "last_success_at",
    }.issubset(
        {column["name"] for column in inspector.get_columns("research_subscriptions")}
    )
    assert "run_id" in {
        column["name"] for column in inspector.get_columns("research_notifications")
    }
    assert {
        "ix_research_subscriptions_next_run_at",
    }.issubset(
        {index["name"] for index in inspector.get_indexes("research_subscriptions")}
    )
    assert {
        "ix_research_recommendations_read_at",
    }.issubset(
        {index["name"] for index in inspector.get_indexes("research_recommendations")}
    )
    assert {
        "ix_research_notifications_read_at",
    }.issubset(
        {index["name"] for index in inspector.get_indexes("research_notifications")}
    )

    created_at = datetime(2026, 8, 1, 9, 0, 0)
    with phase4_engine.begin() as connection:
        subscription_id = connection.execute(
            sa.text(
                """
                INSERT INTO research_subscriptions (
                    name, query, sources_json, year_from, year_to, open_access_only,
                    interval_hours, enabled, created_at, updated_at
                ) VALUES (
                    :name, :query, :sources_json, :year_from, :year_to, :open_access_only,
                    :interval_hours, :enabled, :created_at, :updated_at
                )
                """
            ),
            {
                "name": "Layered oxide weekly scan",
                "query": "sodium-ion layered oxide cathode",
                "sources_json": "[\"openalex\"]",
                "year_from": 2020,
                "year_to": 2026,
                "open_access_only": True,
                "interval_hours": 168,
                "enabled": True,
                "created_at": created_at,
                "updated_at": created_at,
            },
        ).lastrowid
        run_id = connection.execute(
            sa.text(
                """
                INSERT INTO research_runs (
                    subscription_id, status, started_at, completed_at, discovered_count,
                    recommended_count, source_statuses_json, warnings_json
                ) VALUES (
                    :subscription_id, :status, :started_at, :completed_at, :discovered_count,
                    :recommended_count, :source_statuses_json, :warnings_json
                )
                """
            ),
            {
                "subscription_id": subscription_id,
                "status": "completed",
                "started_at": created_at,
                "completed_at": created_at,
                "discovered_count": 1,
                "recommended_count": 1,
                "source_statuses_json": "[]",
                "warnings_json": "[]",
            },
        ).lastrowid
        connection.execute(
            sa.text(
                """
                INSERT INTO research_recommendations (
                    subscription_id, run_id, source, external_id, identity_key,
                    paper_snapshot_json, relevance_score, created_at
                ) VALUES (
                    :subscription_id, :run_id, :source, :external_id, :identity_key,
                    :paper_snapshot_json, :relevance_score, :created_at
                )
                """
            ),
            {
                "subscription_id": subscription_id,
                "run_id": run_id,
                "source": "openalex",
                "external_id": "W123",
                "identity_key": "doi:10.1000/example",
                "paper_snapshot_json": "{}",
                "relevance_score": 0.9,
                "created_at": created_at,
            },
        )
        connection.execute(
            sa.text(
                """
                INSERT INTO research_notifications (
                    subscription_id, run_id, kind, title, body, created_at
                ) VALUES (:subscription_id, :run_id, :kind, :title, :body, :created_at)
                """
            ),
            {
                "subscription_id": subscription_id,
                "run_id": run_id,
                "kind": "recommendations_ready",
                "title": "New recommendations",
                "body": "One paper matched.",
                "created_at": created_at,
            },
        )
        with pytest.raises(sa.exc.IntegrityError):
            connection.execute(
                sa.text(
                    """
                    INSERT INTO research_recommendations (
                        subscription_id, run_id, source, external_id, identity_key,
                        paper_snapshot_json, relevance_score, created_at
                    ) VALUES (
                        :subscription_id, :run_id, :source, :external_id, :identity_key,
                        :paper_snapshot_json, :relevance_score, :created_at
                    )
                    """
                ),
                {
                    "subscription_id": subscription_id,
                    "run_id": run_id,
                    "source": "openalex",
                    "external_id": "W124",
                    "identity_key": "doi:10.1000/example",
                    "paper_snapshot_json": "{}",
                    "relevance_score": 0.8,
                    "created_at": created_at,
                },
            )
        with pytest.raises(sa.exc.IntegrityError):
            connection.execute(
                sa.text(
                    """
                    INSERT INTO research_subscriptions (
                        name, query, sources_json, open_access_only, interval_hours,
                        enabled, created_at, updated_at
                    ) VALUES (
                        :name, :query, :sources_json, :open_access_only, :interval_hours,
                        :enabled, :created_at, :updated_at
                    )
                    """
                ),
                {
                    "name": "Invalid interval",
                    "query": "sodium-ion layered oxide cathode",
                    "sources_json": "[]",
                    "open_access_only": False,
                    "interval_hours": 23,
                    "enabled": True,
                    "created_at": created_at,
                    "updated_at": created_at,
                },
            )
        connection.execute(
            sa.text("DELETE FROM research_runs WHERE id = :id"),
            {"id": run_id},
        )
        assert connection.scalar(
            sa.text("SELECT run_id FROM research_notifications")
        ) is None
        connection.execute(
            sa.text("DELETE FROM research_subscriptions WHERE id = :id"),
            {"id": subscription_id},
        )
        for table_name in (
            "research_runs",
            "research_recommendations",
            "research_notifications",
        ):
            assert connection.scalar(
                sa.text(f"SELECT COUNT(*) FROM {table_name}")
            ) == 0


def _run(coroutine: Any) -> Any:
    return asyncio.run(coroutine)


class _ResearchSource:
    def __init__(self, name: str, papers: list[object]) -> None:
        self.name = name
        self.papers = papers
        self.calls: list[tuple[str, object]] = []

    async def search(self, query: str, filters: object) -> list[object]:
        self.calls.append((query, filters))
        return self.papers

    async def get_by_id(self, external_id: str) -> object:
        raise AssertionError("research runs must not import papers")

    async def download(self, *_args: object, **_kwargs: object) -> object:
        raise AssertionError("research runs must not download PDFs")


class _NoopClient:
    async def __aenter__(self) -> object:
        return self

    async def __aexit__(self, *args: object) -> None:
        return None


def _research_paper(
    *,
    external_id: str,
    title: str,
    doi: str | None = None,
    arxiv_id: str | None = None,
    first_author: str = "Li",
    year: int | None = 2026,
    abstract: str = "A public abstract.",
) -> object:
    from app.paper_identity import normalize_title
    from app.services.paper_search import SearchPaper, SourceCandidate

    return SearchPaper(
        source="openalex",
        external_id=external_id,
        title=title,
        normalized_title=normalize_title(title),
        authors=(first_author,) if first_author else (),
        first_author=first_author,
        abstract=abstract,
        doi=doi,
        arxiv_id=arxiv_id,
        journal="Journal of Storage",
        published_date="2026-01-01",
        year=year,
        keywords=("sodium-ion",),
        landing_url="https://example.test/paper",
        pdf_url="https://example.test/paper.pdf",
        is_open_access=True,
        oa_status="gold",
        license="CC-BY",
        sources=("openalex",),
        candidates=(SourceCandidate(source="openalex", external_id=external_id),),
        relevance_score=0.9,
        relevance_reasons=("关键词匹配",),
    )


def _research_subscription_id(
    engine: sa.Engine,
    sources: tuple[str, ...] = ("openalex",),
) -> int:
    from app.models import ResearchSubscription

    now = datetime(2026, 8, 1, 9, 0, 0)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with factory() as db:
        subscription = ResearchSubscription(
            name="Layered oxide weekly scan",
            query="sodium-ion layered oxide cathode",
            sources_json=json.dumps(sources),
            year_from=2020,
            year_to=2026,
            open_access_only=True,
            interval_hours=48,
            enabled=True,
            created_at=now,
            updated_at=now,
        )
        db.add(subscription)
        db.commit()
        return subscription.id


def test_thermal_storage_subscription_sends_english_paper_query_but_keeps_saved_chinese(phase4_engine):
    from app.models import ResearchSubscription
    from app.services.research import ResearchService

    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    subscription_id = _research_subscription_id(phase4_engine)
    with factory() as db:
        subscription = db.get(ResearchSubscription, subscription_id)
        subscription.query = "储热"
        db.commit()
    source = _ResearchSource("openalex", [_research_paper(external_id="thermal-1", title="Thermal energy storage review")])
    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda *_: [source],
        paper_source_client_factory=_NoopClient,
        settings_provider=lambda: object(),
        now_provider=lambda: datetime(2026, 10, 4),
    )
    _run(service.run_subscription(subscription_id))
    assert source.calls[0][0] == "thermal energy storage"
    with factory() as db:
        assert db.get(ResearchSubscription, subscription_id).query == "储热"


def test_research_run_stores_new_recommendation_snapshots_without_importing_papers(
    phase4_engine: sa.Engine,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.providers as providers_module
    from app.paper_sources import SearchFilters
    from app.services.research import ResearchService
    from app.models import (
        Paper,
        ResearchNotification,
        ResearchRecommendation,
        ResearchRun,
        ResearchSubscription,
    )

    def fail_model_provider(*_args: object, **_kwargs: object) -> object:
        raise AssertionError("research runs must not call ModelProvider")

    monkeypatch.setattr(providers_module, "make_provider", fail_model_provider)

    fixed_now = datetime(2026, 8, 1, 10, 0, 0)
    subscription_id = _research_subscription_id(phase4_engine)
    source = _ResearchSource(
        "openalex",
        [
            _research_paper(
                external_id="W1",
                title="Layered oxide cathodes for sodium-ion batteries",
                doi="https://doi.org/10.1000/NEW",
            )
        ],
    )
    unselected_source = _ResearchSource(
        "crossref",
        [_research_paper(external_id="C1", title="Unselected result")],
    )
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    marker = object()

    class Settings:
        source_builder_marker = marker

    settings = Settings()
    client = _NoopClient()
    received: dict[str, object] = {}

    def build_sources(received_settings: object, received_client: object) -> list[object]:
        received["settings"] = received_settings
        received["client"] = received_client
        return [source, unselected_source]

    service = ResearchService(
        session_factory=factory,
        paper_source_builder=build_sources,
        paper_source_client_factory=lambda: client,
        settings_provider=lambda: settings,
        now_provider=lambda: fixed_now,
    )

    result = _run(service.run_subscription(subscription_id))

    assert result.status == "success"
    assert result.recommended_count == 1
    assert source.calls == [
        (
            "sodium-ion layered oxide cathode",
            SearchFilters(
                year_from=2020,
                year_to=2026,
                open_access_only=True,
                limit=50,
            ),
        )
    ]
    assert unselected_source.calls == []
    assert received["client"] is client
    assert getattr(received["settings"], "source_builder_marker") is marker
    assert getattr(received["settings"], "semantic_scholar_enabled") is False
    with factory() as db:
        run = db.get(ResearchRun, result.id)
        recommendations = db.query(ResearchRecommendation).all()
        notifications = db.query(ResearchNotification).all()
        assert run is not None
        assert run.discovered_count == 1
        assert run.recommended_count == 1
        assert json.loads(run.source_statuses_json) == [
            {
                "source": "openalex",
                "ok": True,
                "message": "搜索成功",
                "result_count": 1,
            }
        ]
        assert len(recommendations) == 1
        assert recommendations[0].identity_key == "doi:10.1000/new"
        snapshot = json.loads(recommendations[0].paper_snapshot_json)
        assert snapshot == {
            "source": "openalex",
            "external_id": "W1",
            "title": "Layered oxide cathodes for sodium-ion batteries",
            "normalized_title": "layered oxide cathodes for sodium ion batteries",
            "authors": ["Li"],
            "first_author": "Li",
            "abstract": "A public abstract.",
            "doi": "10.1000/new",
            "arxiv_id": None,
            "journal": "Journal of Storage",
            "published_date": "2026-01-01",
            "year": 2026,
            "keywords": ["sodium-ion"],
            "article_type": "",
            "citation_count": 0,
            "landing_url": "https://example.test/paper",
            "pdf_url": "https://example.test/paper.pdf",
            "is_open_access": True,
            "oa_status": "gold",
            "license": "CC-BY",
            "sources": ["openalex"],
            "candidates": [{"source": "openalex", "external_id": "W1"}],
            "relevance_score": 46.0,
            "relevance_reasons": [
                "标题命中",
                "近期论文",
                "有开放全文",
                "元数据完整",
            ],
        }
        assert [(item.kind, item.run_id) for item in notifications] == [
            ("digest_ready", result.id)
        ]
        assert db.query(Paper).count() == 0
        subscription = db.get(ResearchSubscription, subscription_id)
        assert subscription is not None
        assert subscription.next_run_at == datetime(2026, 8, 3, 10, 0, 0)


def test_equivalent_second_research_run_creates_no_duplicate_or_notification(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import (
        ResearchNotification,
        ResearchRecommendation,
        ResearchRun,
        ResearchSubscription,
    )
    from app.services.research import ResearchService

    subscription_id = _research_subscription_id(phase4_engine)
    source = _ResearchSource(
        "openalex",
        [
            _research_paper(
                external_id="W1",
                title="Layered oxide cathodes for sodium-ion batteries",
                doi="10.1000/new",
            )
        ],
    )
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda _settings, _client: [source],
        paper_source_client_factory=_NoopClient,
        settings_provider=object,
        now_provider=lambda: datetime(2026, 8, 1, 10, 0, 0),
    )

    first = _run(service.run_subscription(subscription_id))
    second = _run(service.run_subscription(subscription_id))

    assert first.status == "success"
    assert second.status == "no_new_results"
    assert second.recommended_count == 0
    with factory() as db:
        assert db.query(ResearchRecommendation).count() == 1
        assert db.query(ResearchRun).count() == 2
        assert db.query(ResearchNotification).count() == 1
        subscription = db.get(ResearchSubscription, subscription_id)
        assert subscription is not None
        assert subscription.next_run_at == datetime(2026, 8, 3, 10, 0, 0)


def test_all_failed_research_run_records_safe_error_and_advances_next_run(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchNotification, ResearchRun, ResearchSubscription
    from app.services.research import ResearchService

    class FailedSource(_ResearchSource):
        async def search(self, query: str, filters: object) -> list[object]:
            self.calls.append((query, filters))
            raise RuntimeError("api_key=private-value")

    fixed_now = datetime(2026, 8, 1, 10, 0, 0)
    subscription_id = _research_subscription_id(phase4_engine)
    source = FailedSource("openalex", [])
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda _settings, _client: [source],
        paper_source_client_factory=_NoopClient,
        settings_provider=object,
        now_provider=lambda: fixed_now,
    )

    result = _run(service.run_subscription(subscription_id))

    assert result.status == "failed"
    with factory() as db:
        subscription = db.get(ResearchSubscription, subscription_id)
        run = db.get(ResearchRun, result.id)
        notification = db.query(ResearchNotification).one()
        assert subscription is not None
        assert subscription.next_run_at == datetime(2026, 8, 3, 10, 0, 0)
        assert subscription.last_error == "所有论文来源暂时不可用，请稍后重试"
        assert run is not None
        assert run.error == subscription.last_error
        assert "private-value" not in repr((subscription, run))
        assert notification.kind == "run_failed"
        assert notification.run_id == result.id


def test_partial_research_run_saves_available_new_items(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import (
        ResearchNotification,
        ResearchRecommendation,
        ResearchRun,
        ResearchSubscription,
    )
    from app.services.research import ResearchService

    class FailedSource(_ResearchSource):
        async def search(self, query: str, filters: object) -> list[object]:
            self.calls.append((query, filters))
            raise RuntimeError("upstream private response")

    subscription_id = _research_subscription_id(
        phase4_engine,
        sources=("openalex", "crossref"),
    )
    good = _ResearchSource(
        "openalex",
        [
            _research_paper(
                external_id="W2",
                title="Stable layered sodium cathode",
                doi="10.1000/partial",
            )
        ],
    )
    failed = FailedSource("crossref", [])
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda _settings, _client: [good, failed],
        paper_source_client_factory=_NoopClient,
        settings_provider=object,
        now_provider=lambda: datetime(2026, 8, 1, 10, 0, 0),
    )

    result = _run(service.run_subscription(subscription_id))

    assert result.status == "partial"
    assert result.recommended_count == 1
    with factory() as db:
        run = db.get(ResearchRun, result.id)
        assert db.query(ResearchRecommendation).count() == 1
        assert run is not None
        assert json.loads(run.warnings_json) == ["crossref 来源暂不可用"]
        assert [notification.kind for notification in db.query(ResearchNotification)] == [
            "digest_ready"
        ]
        subscription = db.get(ResearchSubscription, subscription_id)
        assert subscription is not None
        assert subscription.next_run_at == datetime(2026, 8, 3, 10, 0, 0)


def test_recommendation_identity_prefers_doi_then_arxiv_then_title_author_year() -> None:
    from app.services.research import recommendation_identity

    assert recommendation_identity(
        _research_paper(
            external_id="W1",
            title="Same title",
            doi="HTTPS://doi.org/10.1000/Example",
            arxiv_id="arXiv:2601.00001v2",
        )
    ) == "doi:10.1000/example"
    assert recommendation_identity(
        _research_paper(
            external_id="W2",
            title="Same title",
            arxiv_id="https://arxiv.org/pdf/2601.00001v2.pdf",
        )
    ) == "arxiv:2601.00001"
    assert recommendation_identity(
        _research_paper(
            external_id="W3",
            title="  Sodium-Ion: Cathodes! ",
            first_author="",
            year=2024,
        )
    ) == "title:sodium ion cathodes|author:|year:2024"


def test_research_run_saves_twenty_highest_relevance_recommendations(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchRecommendation
    from app.services.research import ResearchService

    subscription_id = _research_subscription_id(phase4_engine)
    papers = [
        *[
            _research_paper(
                external_id=f"high-{index}",
                title=f"sodium ion layered oxide cathode high {index}",
                doi=f"10.1000/high-{index}",
            )
            for index in range(5)
        ],
        *[
            _research_paper(
                external_id=f"middle-{index}",
                title=f"sodium middle result {index}",
                doi=f"10.1000/middle-{index}",
            )
            for index in range(15)
        ],
        *[
            _research_paper(
                external_id=f"low-{index}",
                title=f"Unrelated storage result {index}",
                doi=f"10.1000/low-{index}",
                abstract="cathode",
            )
            for index in range(5)
        ],
    ]
    source = _ResearchSource("openalex", papers)
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda _settings, _client: [source],
        paper_source_client_factory=_NoopClient,
        settings_provider=object,
        now_provider=lambda: datetime(2026, 8, 1, 10, 0, 0),
    )

    result = _run(service.run_subscription(subscription_id))

    assert result.recommended_count == 20
    with factory() as db:
        recommendations = db.query(ResearchRecommendation).all()
        assert len(recommendations) == 20
        assert {item.external_id for item in recommendations} == {
            *(f"high-{index}" for index in range(5)),
            *(f"middle-{index}" for index in range(15)),
        }


def test_same_identity_is_saved_separately_for_each_subscription(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchRecommendation
    from app.services.research import ResearchService

    first_subscription_id = _research_subscription_id(phase4_engine)
    second_subscription_id = _research_subscription_id(phase4_engine)
    source = _ResearchSource(
        "openalex",
        [
            _research_paper(
                external_id="W-same",
                title="Shared research result",
                doi="10.1000/same",
            )
        ],
    )
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda _settings, _client: [source],
        paper_source_client_factory=_NoopClient,
        settings_provider=object,
        now_provider=lambda: datetime(2026, 8, 1, 10, 0, 0),
    )

    _run(service.run_subscription(first_subscription_id))
    _run(service.run_subscription(second_subscription_id))

    with factory() as db:
        recommendations = db.query(ResearchRecommendation).all()
        assert {
            recommendation.subscription_id for recommendation in recommendations
        } == {first_subscription_id, second_subscription_id}
        assert {recommendation.identity_key for recommendation in recommendations} == {
            "doi:10.1000/same"
        }


def test_empty_sources_uses_enabled_safe_sources_without_reading_semantic_scholar_key(
    phase4_engine: sa.Engine,
) -> None:
    from app.services.research import ResearchService

    class SecretAccessor:
        def get_secret_value(self) -> str:
            raise AssertionError("Phase 4 must not read the Semantic Scholar key")

    class Settings:
        openalex_enabled = True
        crossref_enabled = False
        arxiv_enabled = False
        semantic_scholar_enabled = True
        semantic_scholar_api_key = SecretAccessor()

    subscription_id = _research_subscription_id(phase4_engine, sources=())
    source = _ResearchSource(
        "openalex",
        [
            _research_paper(
                external_id="W-default",
                title="Default source result",
                doi="10.1000/default",
            )
        ],
    )
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)

    def build_sources(settings: object, _client: object) -> list[object]:
        if getattr(settings, "semantic_scholar_enabled"):
            getattr(settings, "semantic_scholar_api_key").get_secret_value()
        return [source]

    service = ResearchService(
        session_factory=factory,
        paper_source_builder=build_sources,
        paper_source_client_factory=_NoopClient,
        settings_provider=Settings,
        now_provider=lambda: datetime(2026, 8, 1, 10, 0, 0),
    )

    result = _run(service.run_subscription(subscription_id))

    assert result.status == "success"
    assert result.recommended_count == 1
    assert source.calls


def test_builder_failure_is_recorded_after_a_run_is_persisted(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchNotification, ResearchRun, ResearchSubscription
    from app.services.research import ResearchService

    fixed_now = datetime(2026, 8, 1, 10, 0, 0)
    subscription_id = _research_subscription_id(phase4_engine)
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    observed: dict[str, int] = {}

    def fail_build(_settings: object, _client: object) -> list[object]:
        with factory() as db:
            observed["run_count_before_failure"] = db.query(ResearchRun).count()
        raise RuntimeError("builder leaked-token")

    service = ResearchService(
        session_factory=factory,
        paper_source_builder=fail_build,
        paper_source_client_factory=_NoopClient,
        settings_provider=object,
        now_provider=lambda: fixed_now,
    )

    result = _run(service.run_subscription(subscription_id))

    assert observed == {"run_count_before_failure": 1}
    assert result.status == "failed"
    with factory() as db:
        subscription = db.get(ResearchSubscription, subscription_id)
        run = db.get(ResearchRun, result.id)
        notification = db.query(ResearchNotification).one()
        assert subscription is not None
        assert subscription.next_run_at == datetime(2026, 8, 3, 10, 0, 0)
        assert run is not None
        assert run.error is not None
        assert "leaked-token" not in repr((subscription, run, notification))
        assert notification.kind == "run_failed"
        assert notification.run_id == result.id


def test_invalid_stored_search_year_becomes_a_safe_failed_run(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchNotification, ResearchRun, ResearchSubscription
    from app.services.research import ResearchService

    fixed_now = datetime(2026, 8, 1, 10, 0, 0)
    subscription_id = _research_subscription_id(phase4_engine)
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    with factory() as db:
        subscription = db.get(ResearchSubscription, subscription_id)
        assert subscription is not None
        subscription.year_to = date.today().year + 2
        db.commit()
    source = _ResearchSource("openalex", [])
    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda _settings, _client: [source],
        paper_source_client_factory=_NoopClient,
        settings_provider=object,
        now_provider=lambda: fixed_now,
    )

    result = _run(service.run_subscription(subscription_id))

    assert result.status == "failed"
    assert source.calls == []
    with factory() as db:
        subscription = db.get(ResearchSubscription, subscription_id)
        run = db.get(ResearchRun, result.id)
        notification = db.query(ResearchNotification).one()
        assert subscription is not None
        assert subscription.next_run_at == datetime(2026, 8, 3, 10, 0, 0)
        assert run is not None
        assert run.error is not None
        assert "year_to" not in repr((subscription, run, notification))
        assert notification.kind == "run_failed"


def test_research_subscription_year_bounds_match_paper_search() -> None:
    from app.schemas import ResearchSubscriptionCreate, ResearchSubscriptionUpdate

    maximum_year = date.today().year + 1
    assert ResearchSubscriptionCreate(
        name="Weekly scan",
        query="sodium cathode",
        year_to=maximum_year,
    ).year_to == maximum_year
    assert ResearchSubscriptionUpdate(year_from=maximum_year).year_from == maximum_year
    with pytest.raises(ValidationError):
        ResearchSubscriptionCreate(
            name="Weekly scan",
            query="sodium cathode",
            year_to=maximum_year + 1,
        )
    with pytest.raises(ValidationError):
        ResearchSubscriptionUpdate(year_from=maximum_year + 1)


def test_settings_provider_failure_becomes_a_safe_failed_run(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchNotification, ResearchRun, ResearchSubscription
    from app.services.research import ResearchService

    fixed_now = datetime(2026, 8, 1, 10, 0, 0)
    subscription_id = _research_subscription_id(phase4_engine)
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)

    def fail_settings() -> object:
        raise RuntimeError("settings leaked-token")

    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda _settings, _client: [],
        paper_source_client_factory=_NoopClient,
        settings_provider=fail_settings,
        now_provider=lambda: fixed_now,
    )

    result = _run(service.run_subscription(subscription_id))

    assert result.status == "failed"
    with factory() as db:
        subscription = db.get(ResearchSubscription, subscription_id)
        run = db.get(ResearchRun, result.id)
        notification = db.query(ResearchNotification).one()
        assert subscription is not None
        assert subscription.next_run_at == datetime(2026, 8, 3, 10, 0, 0)
        assert run is not None
        assert run.error is not None
        assert "leaked-token" not in repr((subscription, run, notification))
        assert notification.kind == "run_failed"
        assert notification.run_id == result.id


def test_cancelled_research_run_finalizes_safely_before_propagating(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchNotification, ResearchRun
    from app.services.research import ResearchService

    class CancelledSource(_ResearchSource):
        async def search(self, query: str, filters: object) -> list[object]:
            self.calls.append((query, filters))
            raise asyncio.CancelledError("cancel leaked-token")

    class TrackingClient:
        exited = False

        async def __aenter__(self) -> object:
            return self

        async def __aexit__(self, *args: object) -> None:
            self.exited = True

    fixed_now = datetime(2026, 8, 1, 10, 0, 0)
    subscription_id = _research_subscription_id(phase4_engine)
    source = CancelledSource("openalex", [])
    client = TrackingClient()
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    service = ResearchService(
        session_factory=factory,
        paper_source_builder=lambda _settings, _client: [source],
        paper_source_client_factory=lambda: client,
        settings_provider=object,
        now_provider=lambda: fixed_now,
    )

    with pytest.raises(asyncio.CancelledError):
        _run(service.run_subscription(subscription_id))

    assert client.exited is True
    with factory() as db:
        run = db.query(ResearchRun).one()
        notification = db.query(ResearchNotification).one()
        assert run.status == "failed"
        assert run.completed_at == fixed_now
        assert run.error is not None
        assert "leaked-token" not in repr((run, notification))
        assert json.loads(run.source_statuses_json) == []
        assert json.loads(run.warnings_json) == []
        assert notification.kind == "run_failed"
        assert notification.run_id == run.id


def test_scheduler_start_runs_an_overdue_subscription_once(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchSubscription
    from app.services.research_scheduler import ResearchScheduler

    subscription_id = _research_subscription_id(phase4_engine)
    fixed_now = datetime(2026, 8, 1, 10, 0, 0)
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    with factory() as db:
        subscription = db.get(ResearchSubscription, subscription_id)
        assert subscription is not None
        subscription.next_run_at = datetime(2020, 1, 1)
        db.commit()

    class RecordingService:
        def __init__(self) -> None:
            self.calls: list[int] = []

        async def run_subscription(self, item_id: int) -> object:
            self.calls.append(item_id)
            return object()

    service = RecordingService()
    scheduler = ResearchScheduler(
        session_factory=factory,
        research_service=service,
        now_provider=lambda: fixed_now,
    )

    async def exercise() -> None:
        await scheduler.start()
        await asyncio.sleep(0)
        await scheduler.stop()

    _run(exercise())
    assert service.calls == [subscription_id]


def test_scheduler_rejects_an_overlapping_manual_run(
    phase4_engine: sa.Engine,
) -> None:
    from app.services.research_scheduler import (
        ResearchRunInProgress,
        ResearchScheduler,
    )

    subscription_id = _research_subscription_id(phase4_engine)
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    started = asyncio.Event()
    release = asyncio.Event()

    class BlockingService:
        async def run_subscription(self, _item_id: int) -> object:
            started.set()
            await release.wait()
            return object()

    scheduler = ResearchScheduler(
        session_factory=factory,
        research_service=BlockingService(),
        now_provider=lambda: datetime(2026, 8, 1, 10, 0, 0),
    )

    async def exercise() -> None:
        first = asyncio.create_task(scheduler.run_now(subscription_id))
        await started.wait()
        with pytest.raises(ResearchRunInProgress):
            await scheduler.run_now(subscription_id)
        release.set()
        await first

    _run(exercise())


def test_scheduler_start_does_not_block_an_overdue_run_from_health(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.config import reset_settings_cache
    from app.models import ResearchSubscription
    import app.main as main_module

    database_url = _database_url(tmp_path / "startup-overdue.db")
    monkeypatch.setenv("DATABASE_URL", database_url)
    reset_settings_cache()
    engine = _upgrade_database(tmp_path, monkeypatch)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with factory() as db:
        subscription = ResearchSubscription(
            name="Overdue scan",
            query="sodium cathode",
            sources_json='["openalex"]',
            interval_hours=24,
            enabled=True,
            next_run_at=datetime(2020, 1, 1),
        )
        db.add(subscription)
        db.commit()

    started = threading.Event()
    release = threading.Event()

    class SlowSource(_ResearchSource):
        async def search(self, query: str, filters: object) -> list[object]:
            self.calls.append((query, filters))
            started.set()
            await asyncio.to_thread(release.wait)
            return []

    monkeypatch.setattr(
        main_module,
        "build_paper_sources",
        lambda *_args: [SlowSource("openalex", [])],
    )
    app = main_module.create_app()
    holder: dict[str, TestClient] = {}
    entered = threading.Event()

    def start_client() -> None:
        with TestClient(app) as client:
            holder["client"] = client
            entered.set()
            release.wait(timeout=5)

    thread = threading.Thread(target=start_client)
    thread.start()
    try:
        assert started.wait(timeout=5)
        assert entered.wait(timeout=1)
        assert holder["client"].get("/health").status_code == 200
    finally:
        release.set()
        thread.join(timeout=5)
        engine.dispose()
    assert not thread.is_alive()


def test_scheduler_skips_stale_due_subscription_and_keeps_loop_alive(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchSubscription
    from app.services.research_scheduler import ResearchScheduler

    subscription_id = _research_subscription_id(phase4_engine)
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    with factory() as db:
        subscription = db.get(ResearchSubscription, subscription_id)
        assert subscription is not None
        subscription.next_run_at = datetime(2020, 1, 1)
        db.commit()

    class DeletedSubscriptionService:
        async def run_subscription(self, _item_id: int) -> object:
            raise ValueError("research subscription not found")

    scheduler = ResearchScheduler(
        session_factory=factory,
        research_service=DeletedSubscriptionService(),
        now_provider=lambda: datetime(2026, 8, 1, 10, 0, 0),
    )

    async def exercise() -> None:
        await scheduler.start()
        await asyncio.sleep(0)
        assert scheduler.diagnostic_status()["status"] == "running"
        await scheduler.stop()

    _run(exercise())


def test_scheduler_status_reports_unexpected_background_failure(
    phase4_engine: sa.Engine,
) -> None:
    from app.models import ResearchSubscription
    from app.services.research_scheduler import ResearchScheduler

    subscription_id = _research_subscription_id(phase4_engine)
    factory = sessionmaker(bind=phase4_engine, autoflush=False, autocommit=False)
    with factory() as db:
        subscription = db.get(ResearchSubscription, subscription_id)
        assert subscription is not None
        subscription.next_run_at = datetime(2020, 1, 1)
        db.commit()

    class FailingService:
        async def run_subscription(self, _item_id: int) -> object:
            raise RuntimeError("unexpected upstream response")

    scheduler = ResearchScheduler(
        session_factory=factory,
        research_service=FailingService(),
        now_provider=lambda: datetime(2026, 8, 1, 10, 0, 0),
    )

    async def exercise() -> None:
        await scheduler.start()
        await asyncio.sleep(0)
        assert scheduler.diagnostic_status()["status"] == "error"
        await scheduler.stop()

    _run(exercise())


def test_research_api_crud_runs_and_read_actions(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.config import reset_settings_cache
    import app.main as main_module

    async def fake_news_search(*_args, **_kwargs):
        return []
    monkeypatch.setattr(main_module.ResearchNewsSource, "search", fake_news_search)

    database_url = _database_url(tmp_path / "research-api.db")
    monkeypatch.setenv("DATABASE_URL", database_url)
    reset_settings_cache()
    source = _ResearchSource(
        "openalex",
        [
            _research_paper(
                external_id="api-W1",
                title="Layered oxide cathodes for sodium-ion batteries",
                doi="10.1000/api",
            )
        ],
    )
    monkeypatch.setattr(main_module, "build_paper_sources", lambda *_args: [source])

    async def fake_statuses(*_args: object, **_kwargs: object) -> list[object]:
        return []

    from app.routers import settings as settings_module

    monkeypatch.setattr(settings_module, "_collect_source_statuses", fake_statuses)
    app = main_module.create_app()
    with TestClient(app) as client:
        created = client.post(
            "/api/v1/research/subscriptions",
            json={
                "name": "API weekly scan",
                "query": "sodium cathode",
                "sources": ["openalex"],
                "year_to": 2025,
            },
        )
        assert created.status_code == 201
        subscription = created.json()
        subscription_id = subscription["id"]
        assert subscription["enabled"] is True
        assert client.get("/api/v1/research/subscriptions").json()["total"] == 1
        assert client.get(
            f"/api/v1/research/subscriptions/{subscription_id}"
        ).json()["name"] == "API weekly scan"
        updated = client.patch(
            f"/api/v1/research/subscriptions/{subscription_id}",
            json={"name": "API updated scan", "interval_hours": 48},
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "API updated scan"
        invalid_year_range = client.patch(
            f"/api/v1/research/subscriptions/{subscription_id}",
            json={"year_from": 2026},
        )
        assert invalid_year_range.status_code == 422
        assert client.get(
            f"/api/v1/research/subscriptions/{subscription_id}"
        ).json()["year_from"] is None
        assert client.get(
            "/api/v1/research/subscriptions?page_size=51"
        ).status_code == 422

        run = client.post(f"/api/v1/research/subscriptions/{subscription_id}/run")
        assert run.status_code == 200
        assert run.json()["status"] == "success"
        run_id = run.json()["id"]
        assert client.get(f"/api/v1/research/runs/{run_id}").json()["id"] == run_id
        assert client.get(
            f"/api/v1/research/subscriptions/{subscription_id}/runs"
        ).json()["total"] == 1
        global_runs = client.get(
            f"/api/v1/research/runs?subscription_id={subscription_id}&status=success"
        )
        assert global_runs.status_code == 200
        assert global_runs.json()["items"][0]["id"] == run_id
        assert client.get("/api/v1/research/runs?page_size=51").status_code == 422

        assert client.get(f"/api/v1/research/recommendations?run_id={run_id}").json()["total"] == 1
        assert client.get("/api/v1/research/recommendations?run_id=999").json()["total"] == 0
        recommendation = client.get("/api/v1/research/recommendations").json()["items"][0]
        assert client.post(
            f"/api/v1/research/recommendations/{recommendation['id']}/read"
        ).status_code == 200
        notification = client.get("/api/v1/research/notifications").json()["items"][0]
        assert client.post(
            f"/api/v1/research/notifications/{notification['id']}/read"
        ).status_code == 200
        assert client.post("/api/v1/research/notifications/read-all").status_code == 200
        assert client.post("/api/v1/research/recommendations/999/read").status_code == 404
        assert client.post("/api/v1/research/notifications/999/read").status_code == 404

        status = client.get("/api/v1/research/status")
        assert status.status_code == 200
        assert status.json()["scheduler"]["status"] == "running"
        assert status.json()["next_due_at"] is not None
        assert status.json()["recent_run"]["id"] == run_id
        diagnostics = client.get("/api/v1/diagnostics")
        assert diagnostics.status_code == 200
        assert diagnostics.json()["scheduler"]["status"] == "running"

        assert client.request(
            "DELETE",
            f"/api/v1/research/subscriptions/{subscription_id}",
            json={"confirmation_name": "wrong"},
        ).status_code == 400
        assert client.request(
            "DELETE",
            f"/api/v1/research/subscriptions/{subscription_id}",
            json={"confirmation_name": "API updated scan"},
        ).status_code == 204


def test_research_run_api_returns_conflict_and_health_stays_available(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.config import reset_settings_cache
    import app.main as main_module

    monkeypatch.setenv("DATABASE_URL", _database_url(tmp_path / "running-api.db"))
    reset_settings_cache()
    started = threading.Event()
    release = threading.Event()

    class BlockingSource(_ResearchSource):
        async def search(self, query: str, filters: object) -> list[object]:
            self.calls.append((query, filters))
            started.set()
            await asyncio.to_thread(release.wait)
            return []

    monkeypatch.setattr(
        main_module,
        "build_paper_sources",
        lambda *_args: [BlockingSource("openalex", [])],
    )
    app = main_module.create_app()
    with TestClient(app) as client:
        created = client.post(
            "/api/v1/research/subscriptions",
            json={"name": "Running scan", "query": "sodium cathode"},
        )
        subscription_id = created.json()["id"]
        result: dict[str, object] = {}

        def run_request() -> None:
            result["response"] = client.post(
                f"/api/v1/research/subscriptions/{subscription_id}/run"
            )

        thread = threading.Thread(target=run_request)
        thread.start()
        assert started.wait(timeout=5)
        assert client.get("/health").status_code == 200
        conflict = client.post(
            f"/api/v1/research/subscriptions/{subscription_id}/run"
        )
        assert conflict.status_code == 409
        release.set()
        thread.join(timeout=5)
        assert not thread.is_alive()
        assert getattr(result["response"], "status_code") == 200


def test_research_global_runs_list_filters_and_paginates(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.config import reset_settings_cache
    import app.main as main_module

    monkeypatch.setenv("DATABASE_URL", _database_url(tmp_path / "global-runs.db"))
    reset_settings_cache()
    monkeypatch.setattr(
        main_module,
        "build_paper_sources",
        lambda *_args: [_ResearchSource("openalex", [])],
    )
    app = main_module.create_app()
    with TestClient(app) as client:
        created = client.post(
            "/api/v1/research/subscriptions",
            json={"name": "Global runs", "query": "sodium cathode"},
        )
        subscription_id = created.json()["id"]
        assert client.post(
            f"/api/v1/research/subscriptions/{subscription_id}/run"
        ).status_code == 200
        response = client.get(
            f"/api/v1/research/runs?subscription_id={subscription_id}&status=no_new_results"
        )
        assert response.status_code == 200
        assert response.json()["total"] == 1
        assert client.get("/api/v1/research/runs?page_size=51").status_code == 422
