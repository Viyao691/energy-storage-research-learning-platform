"""Normalization helpers for stable paper identifiers."""

import re
import unicodedata
from urllib.parse import unquote, urlsplit


def _clean_text(value: object | None) -> str:
    if not isinstance(value, str):
        return ""
    return unicodedata.normalize("NFKC", value).strip()


def normalize_doi(value: object | None) -> str | None:
    """Return a canonical lowercase DOI, or ``None`` for an empty value."""
    normalized = _clean_text(value)
    normalized = re.sub(r"^doi:\s*", "", normalized, flags=re.IGNORECASE)
    if re.match(
        r"^https?://(?:dx\.)?doi\.org(?:/|$)",
        normalized,
        flags=re.IGNORECASE,
    ):
        normalized = _clean_text(unquote(urlsplit(normalized).path.lstrip("/")))
    normalized = normalized.lower()
    return normalized or None


def normalize_arxiv_id(value: object | None) -> str | None:
    """Return an arXiv identifier without URL, PDF, or version decoration."""
    normalized = _clean_text(value)
    normalized = re.sub(r"^arxiv:\s*", "", normalized, flags=re.IGNORECASE)
    normalized = re.sub(
        r"^https?://(?:www\.)?arxiv\.org/(?:abs|pdf)/",
        "",
        normalized,
        flags=re.IGNORECASE,
    )
    normalized = re.split(r"[?#]", normalized, maxsplit=1)[0].strip()
    normalized = re.sub(r"\.pdf$", "", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"v\d+$", "", normalized, flags=re.IGNORECASE)
    normalized = normalized.lower()
    return normalized or None


def normalize_title(value: object | None) -> str:
    """Normalize a title for case- and punctuation-insensitive matching."""
    normalized = _clean_text(value).lower()
    without_punctuation = "".join(
        " " if unicodedata.category(character)[0] in {"P", "S"} else character
        for character in normalized
    )
    return " ".join(without_punctuation.split())
