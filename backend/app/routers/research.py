"""Research subscription, run, recommendation and notification routes."""

from __future__ import annotations

import json
from datetime import datetime

from fastapi import Depends, HTTPException, Query, Response
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session
from app.config import get_settings
from app.providers import make_provider
from app.secrets import get_model_api_key

from app.models import (
    ResearchNotification,
    ResearchRecommendation,
    ResearchRun,
    ResearchSubscription,
)
from app.schemas import (
    ResearchNotificationResponse,
    ResearchRecommendationResponse,
    ResearchRunResponse,
    ResearchNewsResponse,
    ResearchReadingHighlightsRequest,
    ResearchReadingHighlightsResponse,
    ResearchSubscriptionCreate,
    ResearchSubscriptionDeleteRequest,
    ResearchSubscriptionResponse,
    ResearchSubscriptionUpdate,
)
from app.services.research_scheduler import ResearchRunInProgress
from app.services.research_reading import ResearchReadingHighlights

from ._shared import (
    _PAPER_SOURCE_NAMES,
    _get_setting,
    _json_object_list,
    _json_string_list,
    _research_notification_response,
    _research_recommendation_response,
    _research_run_response,
    _research_subscription_response,
)


def register_research_routes(app, get_db) -> None:
    app.state.research_reading = ResearchReadingHighlights(get_settings().paper_storage_dir.parent / "cache" / "research-reading" / "highlights.json")

    @app.post("/api/v1/research/reading-highlights", response_model=ResearchReadingHighlightsResponse)
    async def research_reading_highlights(payload: ResearchReadingHighlightsRequest, db: Session = Depends(get_db)):
        items = []
        for recommendation_id in dict.fromkeys(payload.recommendation_ids):
            record = db.get(ResearchRecommendation, recommendation_id)
            if record is None:
                raise HTTPException(404, "订阅内容已不存在，请刷新后重试")
            snapshot = _research_recommendation_response(record).paper_snapshot
            title = snapshot.get("title")
            abstract = snapshot.get("abstract")
            if not isinstance(title, str) or not title.strip():
                raise HTTPException(422, "该订阅内容缺少标题，暂时无法整理")
            items.append({"key": f"paper:{record.id}", "title": title, "abstract": abstract if isinstance(abstract, str) else ""})
        if payload.news_urls:
            news = await app.state.research_news.latest()
            available = {item["url"]: item for item in news["items"]}
            for url in dict.fromkeys(payload.news_urls):
                if url not in available:
                    raise HTTPException(404, "该资讯不在当前官方来源中，请刷新后重试")
                article = available[url]
                items.append({"key": f"news:{url}", "title": article["title"], "abstract": article["summary"]})
        setting = _get_setting(db)

        def provider_factory():
            return make_provider(setting.model_provider, get_model_api_key(setting.model_provider, setting.model_base_url), setting.model_base_url, setting.model_name, setting.timeout_seconds, setting.vision_model)

        try:
            highlights = await app.state.research_reading.summarize(items, provider_factory)
        except Exception:
            raise HTTPException(502, "中文标题与重点暂未生成，请稍后重试；原始内容已保留。") from None
        return ResearchReadingHighlightsResponse(items=highlights)

    @app.get("/api/v1/research/news", response_model=ResearchNewsResponse)
    async def latest_research_news():
        return await app.state.research_news.latest()

    @app.post(
        "/api/v1/research/subscriptions",
        response_model=ResearchSubscriptionResponse,
        status_code=201,
    )
    def create_research_subscription(
        payload: ResearchSubscriptionCreate,
        db: Session = Depends(get_db),
    ) -> ResearchSubscriptionResponse:
        now = datetime.utcnow()
        subscription = ResearchSubscription(
            name=payload.name,
            query=payload.query,
            sources_json=json.dumps(payload.sources, ensure_ascii=False),
            year_from=payload.year_from,
            year_to=payload.year_to,
            open_access_only=payload.open_access_only,
            interval_hours=payload.interval_hours,
            enabled=payload.enabled,
            next_run_at=now if payload.enabled else None,
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        return _research_subscription_response(subscription)

    @app.get("/api/v1/research/subscriptions")
    def list_research_subscriptions(
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=50),
        db: Session = Depends(get_db),
    ) -> dict[str, object]:
        total = db.scalar(
            select(func.count()).select_from(ResearchSubscription)
        ) or 0
        subscriptions = list(
            db.scalars(
                select(ResearchSubscription)
                .order_by(ResearchSubscription.created_at.desc(), ResearchSubscription.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return {
            "items": [
                _research_subscription_response(subscription).model_dump(mode="json")
                for subscription in subscriptions
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @app.get(
        "/api/v1/research/subscriptions/{subscription_id}",
        response_model=ResearchSubscriptionResponse,
    )
    def get_research_subscription(
        subscription_id: int,
        db: Session = Depends(get_db),
    ) -> ResearchSubscriptionResponse:
        subscription = db.get(ResearchSubscription, subscription_id)
        if subscription is None:
            raise HTTPException(404, "研究订阅不存在")
        return _research_subscription_response(subscription)

    @app.patch(
        "/api/v1/research/subscriptions/{subscription_id}",
        response_model=ResearchSubscriptionResponse,
    )
    def update_research_subscription(
        subscription_id: int,
        payload: ResearchSubscriptionUpdate,
        db: Session = Depends(get_db),
    ) -> ResearchSubscriptionResponse:
        subscription = db.get(ResearchSubscription, subscription_id)
        if subscription is None:
            raise HTTPException(404, "研究订阅不存在")
        changes = payload.model_dump(exclude_unset=True)
        year_from = changes.get("year_from", subscription.year_from)
        year_to = changes.get("year_to", subscription.year_to)
        if (
            year_from is not None
            and year_to is not None
            and year_from > year_to
        ):
            raise HTTPException(422, "请求参数不合法：year_from 不能晚于 year_to")
        if "sources" in changes:
            subscription.sources_json = json.dumps(changes.pop("sources"), ensure_ascii=False)
        for field, value in changes.items():
            setattr(subscription, field, value)
        if not subscription.enabled:
            subscription.next_run_at = None
        elif subscription.next_run_at is None:
            subscription.next_run_at = datetime.utcnow()
        db.commit()
        db.refresh(subscription)
        return _research_subscription_response(subscription)

    @app.delete(
        "/api/v1/research/subscriptions/{subscription_id}",
        status_code=204,
    )
    def delete_research_subscription(
        subscription_id: int,
        payload: ResearchSubscriptionDeleteRequest,
        db: Session = Depends(get_db),
    ) -> Response:
        subscription = db.get(ResearchSubscription, subscription_id)
        if subscription is None:
            raise HTTPException(404, "研究订阅不存在")
        if payload.confirmation_name != subscription.name:
            raise HTTPException(400, "请完整输入订阅名称以确认删除")
        if app.state.research_scheduler.is_running(subscription_id):
            raise HTTPException(409, "该研究订阅正在运行，请稍后再试")
        db.delete(subscription)
        db.commit()
        return Response(status_code=204)

    @app.post(
        "/api/v1/research/subscriptions/{subscription_id}/run",
        response_model=ResearchRunResponse,
    )
    async def run_research_subscription(
        subscription_id: int,
        db: Session = Depends(get_db),
    ) -> ResearchRunResponse:
        if db.get(ResearchSubscription, subscription_id) is None:
            raise HTTPException(404, "研究订阅不存在")
        try:
            run = await app.state.research_scheduler.run_now(subscription_id)
        except ResearchRunInProgress:
            raise HTTPException(409, "该研究订阅正在运行，请稍后再试") from None
        return _research_run_response(run)

    @app.get("/api/v1/research/subscriptions/{subscription_id}/runs")
    def list_research_runs(
        subscription_id: int,
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=50),
        db: Session = Depends(get_db),
    ) -> dict[str, object]:
        if db.get(ResearchSubscription, subscription_id) is None:
            raise HTTPException(404, "研究订阅不存在")
        base = select(ResearchRun).where(ResearchRun.subscription_id == subscription_id)
        total = db.scalar(
            select(func.count()).select_from(base.subquery())
        ) or 0
        runs = list(
            db.scalars(
                base.order_by(ResearchRun.started_at.desc(), ResearchRun.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return {
            "items": [_research_run_response(run).model_dump(mode="json") for run in runs],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @app.get("/api/v1/research/runs")
    def list_all_research_runs(
        subscription_id: int | None = Query(default=None, ge=1),
        status: str | None = Query(default=None, min_length=1, max_length=40),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=50),
        db: Session = Depends(get_db),
    ) -> dict[str, object]:
        base = select(ResearchRun)
        if subscription_id is not None:
            base = base.where(ResearchRun.subscription_id == subscription_id)
        if status is not None:
            base = base.where(ResearchRun.status == status)
        total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
        runs = list(
            db.scalars(
                base.order_by(ResearchRun.started_at.desc(), ResearchRun.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return {
            "items": [_research_run_response(run).model_dump(mode="json") for run in runs],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @app.get(
        "/api/v1/research/runs/{run_id}",
        response_model=ResearchRunResponse,
    )
    def get_research_run(
        run_id: int,
        db: Session = Depends(get_db),
    ) -> ResearchRunResponse:
        run = db.get(ResearchRun, run_id)
        if run is None:
            raise HTTPException(404, "研究订阅运行记录不存在")
        return _research_run_response(run)

    @app.get("/api/v1/research/recommendations")
    def list_research_recommendations(
        subscription_id: int | None = Query(default=None, ge=1),
        run_id: int | None = Query(default=None, ge=1),
        unread_only: bool = False,
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=50),
        db: Session = Depends(get_db),
    ) -> dict[str, object]:
        base = select(ResearchRecommendation)
        if subscription_id is not None:
            base = base.where(ResearchRecommendation.subscription_id == subscription_id)
        if run_id is not None:
            base = base.where(ResearchRecommendation.run_id == run_id)
        if unread_only:
            base = base.where(ResearchRecommendation.read_at.is_(None))
        total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
        recommendations = list(
            db.scalars(
                base.order_by(
                    ResearchRecommendation.created_at.desc(),
                    ResearchRecommendation.id.desc(),
                )
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return {
            "items": [
                _research_recommendation_response(item).model_dump(mode="json")
                for item in recommendations
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @app.post(
        "/api/v1/research/recommendations/{recommendation_id}/read",
        response_model=ResearchRecommendationResponse,
    )
    def mark_research_recommendation_read(
        recommendation_id: int,
        db: Session = Depends(get_db),
    ) -> ResearchRecommendationResponse:
        recommendation = db.get(ResearchRecommendation, recommendation_id)
        if recommendation is None:
            raise HTTPException(404, "研究推荐不存在")
        if recommendation.read_at is None:
            recommendation.read_at = datetime.utcnow()
            db.commit()
            db.refresh(recommendation)
        return _research_recommendation_response(recommendation)

    @app.get("/api/v1/research/notifications")
    def list_research_notifications(
        subscription_id: int | None = Query(default=None, ge=1),
        unread_only: bool = False,
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=50),
        db: Session = Depends(get_db),
    ) -> dict[str, object]:
        base = select(ResearchNotification)
        if subscription_id is not None:
            base = base.where(ResearchNotification.subscription_id == subscription_id)
        if unread_only:
            base = base.where(ResearchNotification.read_at.is_(None))
        total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
        notifications = list(
            db.scalars(
                base.order_by(
                    ResearchNotification.created_at.desc(),
                    ResearchNotification.id.desc(),
                )
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return {
            "items": [
                _research_notification_response(item).model_dump(mode="json")
                for item in notifications
            ],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @app.post(
        "/api/v1/research/notifications/{notification_id}/read",
        response_model=ResearchNotificationResponse,
    )
    def mark_research_notification_read(
        notification_id: int,
        db: Session = Depends(get_db),
    ) -> ResearchNotificationResponse:
        notification = db.get(ResearchNotification, notification_id)
        if notification is None:
            raise HTTPException(404, "研究通知不存在")
        if notification.read_at is None:
            notification.read_at = datetime.utcnow()
            db.commit()
            db.refresh(notification)
        return _research_notification_response(notification)

    @app.post("/api/v1/research/notifications/read-all")
    def mark_all_research_notifications_read(
        db: Session = Depends(get_db),
    ) -> dict[str, int]:
        updated = db.execute(
            ResearchNotification.__table__.update()
            .where(ResearchNotification.read_at.is_(None))
            .values(read_at=datetime.utcnow())
        ).rowcount
        db.commit()
        return {"updated": updated or 0}

    @app.get("/api/v1/research/status")
    def research_status(db: Session = Depends(get_db)) -> dict[str, object]:
        next_due_at = db.scalar(
            select(func.min(ResearchSubscription.next_run_at)).where(
                ResearchSubscription.enabled.is_(True),
                ResearchSubscription.next_run_at.is_not(None),
            )
        )
        recent_run = db.scalar(
            select(ResearchRun).order_by(
                ResearchRun.started_at.desc(),
                ResearchRun.id.desc(),
            )
        )
        return {
            "scheduler": app.state.research_scheduler.diagnostic_status(),
            "subscription_count": db.scalar(
                select(func.count()).select_from(ResearchSubscription)
            ) or 0,
            "unread_recommendation_count": db.scalar(
                select(func.count())
                .select_from(ResearchRecommendation)
                .where(ResearchRecommendation.read_at.is_(None))
            ) or 0,
            "unread_notification_count": db.scalar(
                select(func.count())
                .select_from(ResearchNotification)
                .where(ResearchNotification.read_at.is_(None))
            ) or 0,
            "next_due_at": next_due_at,
            "recent_run": (
                _research_run_response(recent_run).model_dump(mode="json")
                if recent_run is not None
                else None
            ),
        }
