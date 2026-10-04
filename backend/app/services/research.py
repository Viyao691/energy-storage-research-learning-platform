"""Persisted local research-subscription runs."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from contextlib import AbstractAsyncContextManager
from dataclasses import asdict
from datetime import datetime, timedelta
import json
from typing import Any

from sqlalchemy import select

from app.models import (
    ResearchNotification,
    ResearchRecommendation,
    ResearchRun,
    ResearchSubscription,
)
from app.paper_identity import normalize_arxiv_id, normalize_doi, normalize_title
from app.paper_sources import SearchFilters
from app.paper_sources.registry import enabled_source_names
from app.services.paper_search import AllSourcesFailed, PaperSearchService, SearchPaper, SearchResult


_PHASE4_SAFE_SOURCE_NAMES = frozenset({"openalex", "crossref", "arxiv"})
_ALL_SOURCES_FAILED_MESSAGE = "所有论文来源暂时不可用，请稍后重试"
_RUN_FAILED_MESSAGE = "研究订阅运行失败，请稍后重试"
_RUN_CANCELLED_MESSAGE = "研究订阅运行已取消"


def recommendation_identity(paper: SearchPaper) -> str:
    """Return the stable per-subscription identity for a search result."""

    if paper.article_type == "news":
        return f"news:{paper.landing_url}"
    if doi := normalize_doi(paper.doi):
        return f"doi:{doi}"
    if arxiv_id := normalize_arxiv_id(paper.arxiv_id):
        return f"arxiv:{arxiv_id}"
    title = normalize_title(paper.title)
    first_author = normalize_title(paper.first_author)
    year = paper.year if type(paper.year) is int else ""
    return f"title:{title}|author:{first_author}|year:{year}"


class ResearchService:
    """Run one stored subscription without importing papers or calling models."""

    def __init__(
        self,
        *,
        session_factory: Callable[[], Any],
        paper_source_builder: Callable[[Any, Any], list[Any]],
        paper_source_client_factory: Callable[[], AbstractAsyncContextManager[Any]],
        settings_provider: Callable[[], Any],
        now_provider: Callable[[], datetime],
        news_source_builder: Callable[[Any], list[Any]] | None = None,
    ) -> None:
        self._session_factory = session_factory
        self._paper_source_builder = paper_source_builder
        self._paper_source_client_factory = paper_source_client_factory
        self._settings_provider = settings_provider
        self._now_provider = now_provider
        self._news_source_builder = news_source_builder

    async def run_subscription(self, subscription_id: int) -> ResearchRun:
        now = self._now_provider()
        with self._session_factory() as db:
            subscription = db.get(ResearchSubscription, subscription_id)
            if subscription is None:
                raise ValueError("research subscription not found")
            subscription.last_started_at = now
            subscription.next_run_at = now + timedelta(
                hours=subscription.interval_hours
            )
            search_filters = SearchFilters(
                year_from=subscription.year_from,
                year_to=subscription.year_to,
                open_access_only=subscription.open_access_only,
                limit=50,
            )
            query = subscription.query
            sources_json = subscription.sources_json
            run = ResearchRun(
                subscription_id=subscription_id,
                status="running",
                started_at=now,
                discovered_count=0,
                recommended_count=0,
                source_statuses_json="[]",
                warnings_json="[]",
            )
            db.add(run)
            db.commit()
            run_id = run.id

        try:
            settings = self._settings_provider()
            source_names = _selected_source_names(
                sources_json,
                settings,
            )
            async with self._paper_source_client_factory() as client:
                sources = self._paper_source_builder(
                    _Phase4SafeSettings(settings),
                    client,
                )
                selected_sources = [
                    source
                    for source in sources
                    if getattr(source, "name", None) in source_names
                ]
                paper_query = "thermal energy storage" if query.strip() in {"储热", "热储能"} else query
                searches = [PaperSearchService(selected_sources).search(paper_query, search_filters)]
                if self._news_source_builder is not None:
                    searches.append(PaperSearchService(self._news_source_builder(client)).search(query, SearchFilters(limit=20)))
                outcomes = await asyncio.gather(*searches, return_exceptions=True)
                available = [outcome for outcome in outcomes if isinstance(outcome, SearchResult)]
                failed = [outcome for outcome in outcomes if isinstance(outcome, AllSourcesFailed)]
                if not available:
                    raise AllSourcesFailed(status for failure in failed for status in failure.statuses)
                result = SearchResult(
                    items=tuple(paper for outcome in available for paper in outcome.items),
                    source_statuses=tuple(status for outcome in available for status in outcome.source_statuses) + tuple(status for failure in failed for status in failure.statuses),
                    warnings=tuple(warning for outcome in available for warning in outcome.warnings) + tuple(f"{status.source} 来源暂不可用" for failure in failed for status in failure.statuses),
                )
        except AllSourcesFailed as exc:
            return self._store_failed_run(
                subscription_id,
                run_id,
                now,
                [asdict(status) for status in exc.statuses],
                _ALL_SOURCES_FAILED_MESSAGE,
            )
        except asyncio.CancelledError:
            self._store_failed_run(
                subscription_id,
                run_id,
                now,
                [],
                _RUN_CANCELLED_MESSAGE,
            )
            raise
        except Exception:
            return self._store_failed_run(
                subscription_id,
                run_id,
                now,
                [],
                _RUN_FAILED_MESSAGE,
            )

        return self._store_search_result(subscription_id, run_id, now, result)

    def _store_failed_run(
        self,
        subscription_id: int,
        run_id: int,
        now: datetime,
        statuses: list[dict[str, object]],
        error: str,
    ) -> ResearchRun:
        with self._session_factory() as db:
            subscription = db.get(ResearchSubscription, subscription_id)
            if subscription is None:
                raise ValueError("research subscription not found")
            subscription.last_error = error
            run = db.get(ResearchRun, run_id)
            if run is None:
                raise ValueError("research run not found")
            run.status = "failed"
            run.completed_at = now
            run.discovered_count = 0
            run.recommended_count = 0
            run.source_statuses_json = _json_snapshot(statuses)
            run.warnings_json = "[]"
            run.error = error
            db.add(
                ResearchNotification(
                    subscription_id=subscription_id,
                    run_id=run.id,
                    kind="run_failed",
                    title="研究订阅运行失败",
                    body=error,
                    created_at=now,
                )
            )
            db.commit()
            db.refresh(run)
            return run

    def _store_search_result(
        self,
        subscription_id: int,
        run_id: int,
        now: datetime,
        result: Any,
    ) -> ResearchRun:
        statuses = [asdict(status) for status in result.source_statuses]
        warnings = list(result.warnings)
        with self._session_factory() as db:
            subscription = db.get(ResearchSubscription, subscription_id)
            if subscription is None:
                raise ValueError("research subscription not found")
            existing = set(
                db.scalars(
                    select(ResearchRecommendation.identity_key).where(
                        ResearchRecommendation.subscription_id == subscription_id
                    )
                )
            )
            new_papers: list[tuple[SearchPaper, str]] = []
            seen = set(existing)
            news_count = 0
            for paper in sorted(
                result.items,
                key=lambda item: (item.article_type == "news", item.relevance_score),
                reverse=True,
            ):
                identity = recommendation_identity(paper)
                if identity in seen:
                    continue
                if paper.article_type == "news":
                    if news_count == 10:
                        continue
                    news_count += 1
                seen.add(identity)
                new_papers.append((paper, identity))
                if len(new_papers) == 20:
                    break

            partial = any(not status.ok for status in result.source_statuses)
            status = (
                "partial"
                if partial
                else "success"
                if new_papers
                else "no_new_results"
            )
            run = db.get(ResearchRun, run_id)
            if run is None:
                raise ValueError("research run not found")
            run.status = status
            run.completed_at = now
            run.discovered_count = len(result.items)
            run.recommended_count = len(new_papers)
            run.source_statuses_json = _json_snapshot(statuses)
            run.warnings_json = _json_snapshot(warnings)
            run.error = None
            for paper, identity in new_papers:
                db.add(
                    ResearchRecommendation(
                        subscription_id=subscription_id,
                        run_id=run.id,
                        source=paper.source,
                        external_id=paper.external_id,
                        identity_key=identity,
                        paper_snapshot_json=_json_snapshot(asdict(paper)),
                        relevance_score=paper.relevance_score,
                        created_at=now,
                    )
                )
            subscription.last_success_at = now
            subscription.last_error = None
            if new_papers:
                db.add(
                    ResearchNotification(
                        subscription_id=subscription_id,
                        run_id=run.id,
                        kind="digest_ready",
                        title="研究订阅发现新内容",
                        body=f"发现 {sum(p.article_type == 'news' for p, _ in new_papers)} 条前沿资讯与 {sum(p.article_type != 'news' for p, _ in new_papers)} 篇相关论文。",
                        created_at=now,
                    )
                )
            db.commit()
            db.refresh(run)
            return run


def _source_names(value: object) -> set[str]:
    try:
        decoded = json.loads(value) if isinstance(value, str) else []
    except ValueError:
        decoded = []
    if not isinstance(decoded, list):
        return set()
    return {name for name in decoded if isinstance(name, str)}


def _selected_source_names(value: object, settings: object) -> set[str]:
    selected = _source_names(value)
    if not selected:
        selected = set(enabled_source_names(settings))
    return selected & _PHASE4_SAFE_SOURCE_NAMES


class _Phase4SafeSettings:
    """Prevent the Phase 4 service from materializing credentialed sources."""

    semantic_scholar_enabled = False

    def __init__(self, settings: object) -> None:
        self._settings = settings

    def __getattr__(self, name: str) -> object:
        return getattr(self._settings, name)


def _json_snapshot(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
