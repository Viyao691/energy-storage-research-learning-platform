"""Normalized paper-source contracts and built-in adapters."""

from .arxiv import ArXivSource, ArxivSource
from .base import (
    PaperSource,
    SearchFilters,
    SourcePaper,
    SourceRequestError,
    SourceStatus,
)
from .crossref import CrossrefSource
from .openalex import OpenAlexSource
from .registry import build_paper_sources, enabled_source_names
from .semantic_scholar import SemanticScholarSource

__all__ = [
    "ArXivSource",
    "ArxivSource",
    "build_paper_sources",
    "CrossrefSource",
    "enabled_source_names",
    "OpenAlexSource",
    "PaperSource",
    "SearchFilters",
    "SemanticScholarSource",
    "SourcePaper",
    "SourceRequestError",
    "SourceStatus",
]
