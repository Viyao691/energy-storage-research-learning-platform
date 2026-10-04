from __future__ import annotations

import argparse
import asyncio
import json
from dataclasses import replace
from pathlib import Path

import fitz
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import make_session_factory
from app.models import Paper
from app.paper_identity import normalize_title
from app.paper_metadata import complete_public_bibliography, extract_local_paper_metadata, pdf_bibliography_metadata, replaceable_paper_title


def backfill_paper_metadata(db: Session, storage_root: Path, *, dry_run: bool = False, bibliography_only: bool = False, public_lookup: bool = False, source: object | None = None) -> dict[str, object]:
    return asyncio.run(_backfill(db, storage_root, dry_run=dry_run, bibliography_only=bibliography_only, public_lookup=public_lookup, source=source))


async def _backfill(db: Session, storage_root: Path, *, dry_run: bool, bibliography_only: bool, public_lookup: bool, source: object | None) -> dict[str, object]:
    summary = {"scanned": 0, "updated": 0, "skipped": 0, "failed": 0}
    changes: list[dict[str, object]] = []
    root = storage_root.resolve()
    papers = db.scalars(select(Paper).where(Paper.file_path.is_not(None)).order_by(Paper.id)).all()
    for paper in papers:
        summary["scanned"] += 1
        if not bibliography_only and not _has_metadata_gaps(paper) and not replaceable_paper_title(paper.title, paper.original_filename or ""):
            summary["skipped"] += 1
            continue
        try:
            pdf_path = Path(paper.file_path or "").resolve()
            pdf_path.relative_to(root)
            if not pdf_path.is_file() or pdf_path.suffix.lower() != ".pdf":
                raise OSError("managed PDF is missing")
            with fitz.open(pdf_path) as document:
                document_metadata = pdf_bibliography_metadata(document)
                extracted_text = paper.extracted_text or "\n".join(
                    page.get_text("text") for page in list(document)[:2]
                )
            metadata = extract_local_paper_metadata(
                filename=paper.original_filename or pdf_path.name,
                text=extracted_text,
                document_metadata=document_metadata,
            )
            if paper.doi:
                metadata = replace(metadata, doi=paper.doi)
            needs_title = replaceable_paper_title(paper.title, paper.original_filename or "", metadata.title)
            if public_lookup:
                metadata = await complete_public_bibliography(metadata, source=source, need_title=needs_title, need_journal=not paper.journal.strip())
            fields = ("title", "normalized_title", "journal") if bibliography_only else ("title", "normalized_title", "journal", "doi", "published_date", "keywords_json", "article_type")
            before = {field: getattr(paper, field) for field in fields}
            if metadata.title and replaceable_paper_title(paper.title, paper.original_filename or "", metadata.title):
                paper.title = metadata.title
                paper.normalized_title = normalize_title(metadata.title)
            if bibliography_only:
                if not paper.journal.strip() and metadata.journal:
                    paper.journal = metadata.journal
            else:
                with db.no_autoflush:
                    _fill_empty_fields(db, paper, metadata)
            updates = {field: {"before": value, "after": getattr(paper, field)} for field, value in before.items() if value != getattr(paper, field)}
            changed = bool(updates)
            if changed:
                changes.append({"paper_id": paper.id, "filename": paper.original_filename, "fields": updates})
            if dry_run:
                for field, value in before.items():
                    setattr(paper, field, value)
        except (fitz.FileDataError, RuntimeError, OSError, ValueError):
            summary["failed"] += 1
            continue
        summary["updated" if changed else "skipped"] += 1
    if not dry_run:
        db.commit()
    if dry_run or bibliography_only:
        summary["changes"] = changes
    return summary


def _has_metadata_gaps(paper: Paper) -> bool:
    keywords = _json_string_list(paper.keywords_json)
    return not all(
        (
            paper.doi,
            paper.journal.strip(),
            paper.published_date,
            len(keywords) >= 8,
            paper.article_type.strip(),
        )
    )


def _fill_empty_fields(db: Session, paper: Paper, metadata: object) -> bool:
    changed = False
    doi = getattr(metadata, "doi", None)
    if not paper.doi and doi:
        owner = db.scalar(select(Paper.id).where(Paper.doi == doi, Paper.id != paper.id))
        if owner is None:
            paper.doi = doi
            changed = True
    journal = getattr(metadata, "journal", "")
    if not paper.journal.strip() and journal:
        paper.journal = journal
        changed = True
    published_date = getattr(metadata, "published_date", None)
    if not paper.published_date and published_date:
        paper.published_date = published_date
        changed = True
    keywords = tuple(getattr(metadata, "keywords", ()))
    existing_keywords = _json_string_list(paper.keywords_json)
    merged_keywords: list[str] = []
    keyword_candidates = keywords if getattr(metadata, "keywords_are_explicit", False) and keywords else (*keywords, *existing_keywords)
    for keyword in keyword_candidates:
        if keyword.casefold() not in {item.casefold() for item in merged_keywords}:
            merged_keywords.append(keyword)
        if len(merged_keywords) == 8:
            break
    if merged_keywords != existing_keywords:
        paper.keywords_json = json.dumps(merged_keywords, ensure_ascii=False)
        changed = True
    article_type = getattr(metadata, "article_type", "")
    if not paper.article_type.strip() and article_type:
        paper.article_type = article_type
        changed = True
    return changed


def _json_string_list(raw: str) -> list[str]:
    try:
        value = json.loads(raw or "[]")
    except (TypeError, json.JSONDecodeError):
        return []
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(description="Fill PDF metadata; preview bibliography repairs before applying.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--bibliography-only", action="store_true", help="Repair titles and fill missing journals only")
    parser.add_argument("--public-lookup", action="store_true", help="Allow exact DOI Crossref fallback for missing title/journal")
    args = parser.parse_args()
    settings = get_settings()
    factory = make_session_factory()
    with factory() as db:
        summary = backfill_paper_metadata(db, settings.paper_storage_dir, dry_run=args.dry_run, bibliography_only=args.bibliography_only, public_lookup=args.public_lookup)
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
