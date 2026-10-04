"""Read, follow, and control the fixed public campus source catalogue."""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from typing import Literal

from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.campus_models import CampusEvent, CampusNotice, CampusPage, CampusPublicLink, CampusSource
from app.campus_sources import seed_sources
from app.services.campus import campus_today, feed_status
from app.services.campus_parse import classify


def _iso(moment: datetime | None) -> str | None:
    return moment.isoformat(timespec="seconds") + "Z" if moment else None


class CampusSourceResponse(BaseModel):
    id: int
    key: str
    name: str
    group: str
    url: str
    priority: int
    enabled: bool
    status: str
    detail: str
    last_checked_at: str | None
    last_success_at: str | None
    next_check_at: str | None
    robots_status: str
    activation_state: Literal["never_enabled", "enabled", "paused"]
    access_state: Literal["public", "login_required", "unreachable", "unknown"]
    coverage: Literal["column", "homepage", "unverified"]


class CampusSourceList(BaseModel):
    items: list[CampusSourceResponse]


class CampusOriginResponse(BaseModel):
    source_id: int
    name: str
    url: str
    published_on: str | None


class CampusEvidenceResponse(BaseModel):
    field: str
    quote: str
    url: str


class CampusAnalysisResponse(BaseModel):
    status: Literal["pending", "ready", "failed", "deferred", "not_configured"]
    method: Literal["rule", "ai", "mock"]
    model: str | None
    prompt_version: str | None
    unknowns: list[str]
    evidence: list[CampusEvidenceResponse]


class CampusDateResponse(BaseModel):
    kind: str
    day: str
    evidence: str


class CampusEventResponse(BaseModel):
    id: int
    title: str
    category: str | None
    subtype: str | None
    category_basis: Literal["ai", "mock", "rule", "unverified"]
    subtype_basis: Literal["ai", "mock", "rule", "unverified"]
    tags: list[str]
    competition_type: str | None
    competition_tracks: list[str]
    stage: str | None
    audience: str | None
    action: str | None
    summary: str
    key_points: list[str]
    analysis: CampusAnalysisResponse
    feed_status: Literal["recent", "unknown", "archive"]
    date_basis: Literal["published", "future_date", "past_date", "unknown", "conflict"]
    excerpt: str
    dates: list[CampusDateResponse]
    published_on: str | None
    priority: int
    followed: bool
    conflict: bool
    archived: bool
    origins: list[CampusOriginResponse]
    updated_at: str


class CampusEventList(BaseModel):
    items: list[CampusEventResponse]
    total: int
    counts: dict[str, int]
    days: int


class CampusNoticeResponse(BaseModel):
    id: int
    event_id: int
    title: str
    body: str
    kind: str
    read_at: str | None
    created_at: str
    url: str | None
    source_name: str | None


class CampusNoticeList(BaseModel):
    items: list[CampusNoticeResponse]


class CampusPublicLinkOriginResponse(BaseModel):
    source_id: int
    name: str
    url: str


class CampusPublicLinkResponse(BaseModel):
    url: str
    title: str
    published_on: str | None
    first_seen_at: str
    last_seen_at: str
    evidence_level: Literal["link_only"]
    origins: list[CampusPublicLinkOriginResponse]


class CampusPublicLinkList(BaseModel):
    items: list[CampusPublicLinkResponse]
    total: int
    counts: dict[str, int]
    days: int


class CampusSourceUpdate(BaseModel):
    enabled: bool


class CampusEventUpdate(BaseModel):
    followed: bool


def _source(row: CampusSource) -> CampusSourceResponse:
    return CampusSourceResponse(id=row.id, key=row.key, name=row.name, group=row.group,
                                url=row.url, priority=row.priority, enabled=row.enabled,
                                status=row.status, detail=row.detail,
                                last_checked_at=_iso(row.last_checked_at),
                                last_success_at=_iso(row.last_success_at),
                                next_check_at=_iso(row.next_check_at), robots_status=row.robots_status,
                                activation_state="enabled" if row.enabled else "paused" if row.ever_enabled else "never_enabled",
                                access_state=row.access_state if row.access_state in ("public", "login_required", "unreachable") else "unknown",
                                coverage=row.coverage if row.coverage in ("column", "homepage") else "unverified")


def _event(db: Session, row: CampusEvent, today: date, days: int) -> CampusEventResponse:
    dates = json.loads(row.dates_json)
    origins = [CampusOriginResponse(source_id=page.source_id, name=page.source.name, url=page.url,
                                    published_on=page.published_on.isoformat() if page.published_on else None)
               for page in db.scalars(select(CampusPage).where(CampusPage.event_id == row.id)
                                      .order_by(CampusPage.id))]
    status, basis = feed_status(dates, row.published_on, today, row.conflict, days)
    rule = classify(row.title, row.excerpt)
    try:
        saved = json.loads(row.analysis_json or "{}")
    except ValueError:
        saved = {}
    if saved.get("status") != "ready":
        saved = {"status": saved.get("status", "pending"), "method": "rule", "model": None,
                 "prompt_version": None, "unknowns": ["具体要求请核对原文"], "evidence": []}
    analysis = CampusAnalysisResponse.model_validate(saved)
    result = saved.get("result", {}) if analysis.status == "ready" else {}
    category = result.get("category") or rule.category
    subtype = result.get("subtype") or (rule.subtype if rule.category == category else None)
    result_basis = analysis.method if analysis.method in ("ai", "mock") else "rule"
    category_basis = result_basis if result.get("category") else "rule" if rule.category else "unverified"
    subtype_basis = result_basis if result.get("subtype") else "rule" if subtype else "unverified"
    summary = result.get("summary") or (row.excerpt[:180] if row.excerpt else row.title)
    key_points = result.get("key_points") or [item["evidence"] for item in dates[:4]]
    return CampusEventResponse(id=row.id, title=row.title, category=category, subtype=subtype,
                               category_basis=category_basis, subtype_basis=subtype_basis,
                               tags=result.get("tags") or ([subtype] if subtype else []),
                               competition_type=result.get("competition_type") or rule.competition_type,
                               competition_tracks=result.get("competition_tracks") or [],
                               stage=result.get("stage") or rule.stage,
                               audience=result.get("audience"), action=result.get("action"),
                               summary=summary, key_points=key_points[:4], analysis=analysis,
                               feed_status=status, date_basis=basis,
                               excerpt=row.excerpt, dates=dates, published_on=row.published_on.isoformat() if row.published_on else None,
                               priority=row.priority, followed=row.followed, conflict=row.conflict,
                               archived=status == "archive", origins=origins, updated_at=_iso(row.updated_at) or "")


def register_campus_routes(app, get_db) -> None:
    @app.get("/api/v1/campus/sources", response_model=CampusSourceList)
    def sources(db: Session = Depends(get_db)) -> CampusSourceList:
        seed_sources(db)
        rows = db.scalars(select(CampusSource).order_by(CampusSource.priority.desc(), CampusSource.id))
        return CampusSourceList(items=[_source(row) for row in rows])

    @app.post("/api/v1/campus/activate", response_model=CampusSourceList)
    def activate(db: Session = Depends(get_db)) -> CampusSourceList:
        seed_sources(db)
        for row in db.scalars(select(CampusSource)):
            if row.key == "hainan-profile":
                continue
            if not row.enabled:
                row.enabled = True
                row.ever_enabled = True
                row.status = "pending"
                row.detail = "等待下次检查"
        db.commit()
        return sources(db)

    @app.patch("/api/v1/campus/sources/{source_id}", response_model=CampusSourceResponse)
    def set_source(source_id: int, body: CampusSourceUpdate,
                   db: Session = Depends(get_db)) -> CampusSourceResponse:
        row = db.get(CampusSource, source_id)
        if not row:
            raise HTTPException(404, "来源不存在")
        row.enabled = body.enabled
        row.ever_enabled = True
        row.status = "pending" if body.enabled else "paused"
        row.detail = "等待下次检查" if body.enabled else "已暂停"
        db.commit()
        return _source(row)

    @app.get("/api/v1/campus/events", response_model=CampusEventList)
    def events(offset: int = Query(0, ge=0), limit: int = Query(30, ge=1, le=100),
               scope: Literal["recent", "unknown", "archive"] | None = None,
               days: int = Query(90, ge=1, le=365), subtype: str = "",
               category: str = "", archived: bool = False, followed: bool = False,
               db: Session = Depends(get_db)) -> CampusEventList:
        today = campus_today(datetime.utcnow())
        rows = list(db.scalars(select(CampusEvent)))
        items = [_event(db, row, today, days) for row in rows]
        items = [item for item in items if (not category or item.category == category) and
                 (not subtype or item.subtype == subtype) and (not followed or item.followed)]
        counts = {key: sum(item.feed_status == key for item in items) for key in ("recent", "unknown", "archive")}
        if scope is not None:
            items = [item for item in items if item.feed_status == scope]
        elif not archived:
            items = [item for item in items if item.feed_status == "recent"]
        def sort_key(item: CampusEventResponse):
            future_days = [part.day for part in item.dates if part.day >= today.isoformat()]
            verified = item.published_on or (min(future_days) if future_days else "")
            return (verified, item.priority, item.id)
        items.sort(key=sort_key, reverse=True)
        return CampusEventList(items=items[offset:offset + limit], total=len(items), counts=counts, days=days)

    @app.get("/api/v1/campus/public-links", response_model=CampusPublicLinkList)
    def public_links(offset: int = Query(0, ge=0), limit: int = Query(30, ge=1, le=100),
                     scope: Literal["recent", "unknown", "archive"] = "unknown",
                     days: int = Query(90, ge=1, le=365),
                     db: Session = Depends(get_db)) -> CampusPublicLinkList:
        today = campus_today(datetime.utcnow())
        rows = list(db.execute(select(CampusPublicLink, CampusSource)
                               .join(CampusSource, CampusSource.id == CampusPublicLink.source_id)
                               .order_by(CampusPublicLink.last_seen_at.desc(), CampusPublicLink.id.desc())))
        grouped: dict[str, dict] = {}
        for row, source in rows:
            item = grouped.get(row.url)
            if item is None:
                item = {
                    "url": row.url, "title": row.title, "published_on": row.published_on,
                    "first_seen_at": row.first_seen_at, "last_seen_at": row.last_seen_at,
                    "origins": [],
                }
                grouped[row.url] = item
            if row.published_on and (item["published_on"] is None or row.published_on > item["published_on"]):
                item["published_on"] = row.published_on
            item["first_seen_at"] = min(item["first_seen_at"], row.first_seen_at)
            item["last_seen_at"] = max(item["last_seen_at"], row.last_seen_at)
            item["origins"].append(CampusPublicLinkOriginResponse(
                source_id=source.id, name=source.name, url=row.source_page_url))

        counts = {key: 0 for key in ("recent", "unknown", "archive")}
        items: list[CampusPublicLinkResponse] = []
        cutoff = today - timedelta(days=days)
        for item in grouped.values():
            published = item["published_on"]
            status = "unknown" if published is None or published > today else (
                "recent" if published >= cutoff else "archive")
            counts[status] += 1
            if status != scope:
                continue
            items.append(CampusPublicLinkResponse(
                url=item["url"], title=item["title"],
                published_on=published.isoformat() if published else None,
                first_seen_at=_iso(item["first_seen_at"]) or "",
                last_seen_at=_iso(item["last_seen_at"]) or "",
                evidence_level="link_only", origins=item["origins"],
            ))
        if scope == "recent":
            items.sort(key=lambda item: (item.published_on or "", item.last_seen_at), reverse=True)
        elif scope == "archive":
            items.sort(key=lambda item: (item.published_on or "", item.last_seen_at), reverse=True)
        else:
            items.sort(key=lambda item: item.last_seen_at, reverse=True)
        return CampusPublicLinkList(items=items[offset:offset + limit], total=len(items),
                                    counts=counts, days=days)

    @app.patch("/api/v1/campus/events/{event_id}", response_model=CampusEventResponse)
    def set_event(event_id: int, body: CampusEventUpdate,
                  db: Session = Depends(get_db)) -> CampusEventResponse:
        row = db.get(CampusEvent, event_id)
        if not row:
            raise HTTPException(404, "资讯不存在")
        row.followed = body.followed
        db.commit()
        return _event(db, row, campus_today(datetime.utcnow()), 90)

    @app.get("/api/v1/campus/notices", response_model=CampusNoticeList)
    def notices(db: Session = Depends(get_db)) -> CampusNoticeList:
        rows = db.scalars(select(CampusNotice).order_by(CampusNotice.created_at.desc(),
                                                         CampusNotice.id.desc()).limit(100))
        return CampusNoticeList(items=[_notice(db, row) for row in rows])

    @app.post("/api/v1/campus/notices/{notice_id}/read", response_model=CampusNoticeResponse)
    def mark_read(notice_id: int, db: Session = Depends(get_db)) -> CampusNoticeResponse:
        row = db.get(CampusNotice, notice_id)
        if not row:
            raise HTTPException(404, "提醒不存在")
        if row.read_at is None:
            row.read_at = datetime.utcnow()
            db.commit()
        return _notice(db, row)


def _notice(db: Session, row: CampusNotice) -> CampusNoticeResponse:
    origin = db.scalar(select(CampusPage).where(CampusPage.event_id == row.event_id)
                       .order_by(CampusPage.id))
    return CampusNoticeResponse(id=row.id, event_id=row.event_id, title=row.title,
                                body=row.body, kind=row.kind, read_at=_iso(row.read_at),
                                created_at=_iso(row.created_at) or "",
                                url=origin.url if origin else None,
                                source_name=origin.source.name if origin else None)
