"""Persist public campus opportunity metadata and in-app notices."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CampusSource(Base):
    __tablename__ = "campus_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    group: Mapped[str] = mapped_column(String(40))
    url: Mapped[str] = mapped_column(String(1000))
    priority: Mapped[int] = mapped_column(Integer, default=0)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    ever_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(30), default="pending")
    access_state: Mapped[str] = mapped_column(String(30), default="unknown")
    coverage: Mapped[str] = mapped_column(String(30), default="unverified")
    detail: Mapped[str] = mapped_column(String(300), default="尚未检查")
    robots_status: Mapped[str] = mapped_column(String(60), default="unchecked")
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_check_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class CampusEvent(Base):
    __tablename__ = "campus_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    identity: Mapped[str] = mapped_column(String(500), unique=True)
    title: Mapped[str] = mapped_column(String(500))
    category: Mapped[str] = mapped_column(String(30))
    excerpt: Mapped[str] = mapped_column(String(350), default="")
    dates_json: Mapped[str] = mapped_column(Text, default="[]")
    published_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    followed: Mapped[bool] = mapped_column(Boolean, default=False)
    conflict: Mapped[bool] = mapped_column(Boolean, default=False)
    analysis_json: Mapped[str] = mapped_column(Text, default="{}")
    content_hash: Mapped[str] = mapped_column(String(64), default="")
    first_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    pages: Mapped[list[CampusPage]] = relationship(back_populates="event")


class CampusPage(Base):
    __tablename__ = "campus_pages"
    __table_args__ = (UniqueConstraint("source_id", "url", name="uq_campus_pages_source_url"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("campus_sources.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(1000))
    title: Mapped[str] = mapped_column(String(500), default="")
    event_id: Mapped[int | None] = mapped_column(ForeignKey("campus_events.id", ondelete="SET NULL"), nullable=True, index=True)
    fingerprint: Mapped[str] = mapped_column(String(64), default="")
    dates_json: Mapped[str] = mapped_column(Text, default="[]")
    published_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    publication_evidence: Mapped[str] = mapped_column(String(120), default="")
    content_hash: Mapped[str] = mapped_column(String(64), default="")
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_error: Mapped[str] = mapped_column(String(300), default="")
    event: Mapped[CampusEvent | None] = relationship(back_populates="pages")
    source: Mapped[CampusSource] = relationship()


class CampusNotice(Base):
    __tablename__ = "campus_notices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("campus_events.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(String(300), default="")
    kind: Mapped[str] = mapped_column(String(30))
    dedupe_key: Mapped[str] = mapped_column(String(500), unique=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CampusAnalysisCache(Base):
    __tablename__ = "campus_analysis_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cache_key: Mapped[str] = mapped_column(String(64), unique=True)
    content_hash: Mapped[str] = mapped_column(String(64))
    provider: Mapped[str] = mapped_column(String(80))
    model: Mapped[str] = mapped_column(String(200))
    prompt_version: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(30), default="pending")
    result_json: Mapped[str] = mapped_column(Text, default="{}")
    input_text: Mapped[str] = mapped_column(Text, default="")
    attempted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    retry_after: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    error_code: Mapped[str] = mapped_column(String(100), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CampusPublicLink(Base):
    """An official campus page's link to a public WeChat article; no article body."""

    __tablename__ = "campus_public_links"
    __table_args__ = (UniqueConstraint("source_id", "url", name="uq_campus_public_links_source_url"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("campus_sources.id", ondelete="CASCADE"), index=True)
    source_page_url: Mapped[str] = mapped_column(String(1000))
    url: Mapped[str] = mapped_column(String(1200), index=True)
    title: Mapped[str] = mapped_column(String(500), default="")
    published_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
