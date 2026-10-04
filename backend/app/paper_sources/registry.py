"""Configuration-driven construction of paper-source adapters."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import httpx

from app.config import AppSettings

from .arxiv import ArxivSource
from .base import PaperSource
from .crossref import CrossrefSource
from .openalex import OpenAlexSource
from .semantic_scholar import SemanticScholarSource


USER_AGENT = "EnergyResearchCopilot/0.2"


@dataclass(frozen=True)
class _SourceDescriptor:
    name: str
    enabled_setting: str
    build: Callable[[AppSettings, httpx.AsyncClient], PaperSource]


def _build_openalex(
    settings: AppSettings,
    client: httpx.AsyncClient,
) -> PaperSource:
    return OpenAlexSource(
        client=client,
        base_url=settings.openalex_base_url,
        timeout=settings.paper_source_timeout_seconds,
    )


def _build_crossref(
    settings: AppSettings,
    client: httpx.AsyncClient,
) -> PaperSource:
    return CrossrefSource(
        client=client,
        base_url=settings.crossref_base_url,
        timeout=settings.paper_source_timeout_seconds,
        mailto=settings.crossref_mailto,
        user_agent=USER_AGENT,
    )


def _build_arxiv(
    settings: AppSettings,
    client: httpx.AsyncClient,
) -> PaperSource:
    return ArxivSource(
        client=client,
        base_url=settings.arxiv_base_url,
        timeout=settings.paper_source_timeout_seconds,
    )


def _build_semantic_scholar(
    settings: AppSettings,
    client: httpx.AsyncClient,
) -> PaperSource:
    return SemanticScholarSource(
        client=client,
        base_url=settings.semantic_scholar_base_url,
        timeout=settings.paper_source_timeout_seconds,
        api_key=settings.semantic_scholar_api_key.get_secret_value(),
    )


_SOURCE_DESCRIPTORS = (
    _SourceDescriptor("openalex", "openalex_enabled", _build_openalex),
    _SourceDescriptor("crossref", "crossref_enabled", _build_crossref),
    _SourceDescriptor("arxiv", "arxiv_enabled", _build_arxiv),
    _SourceDescriptor(
        "semantic_scholar",
        "semantic_scholar_enabled",
        _build_semantic_scholar,
    ),
)


def enabled_source_names(settings: AppSettings) -> tuple[str, ...]:
    """Return enabled source names in stable search order."""
    return tuple(
        descriptor.name
        for descriptor in _SOURCE_DESCRIPTORS
        if getattr(settings, descriptor.enabled_setting)
    )


def build_paper_sources(
    settings: AppSettings,
    client: httpx.AsyncClient,
) -> list[PaperSource]:
    """Build enabled adapters around one caller-owned HTTP client."""
    return [
        descriptor.build(settings, client)
        for descriptor in _SOURCE_DESCRIPTORS
        if getattr(settings, descriptor.enabled_setting)
    ]
