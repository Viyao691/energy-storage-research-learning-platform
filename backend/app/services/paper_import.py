"""Trusted paper import orchestration.

The browser supplies only a source name and external identifier.  This service
always re-fetches the record from the configured adapter before it makes any
open-access or download decision.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import Awaitable, Callable, Mapping
from dataclasses import asdict, dataclass, replace
from pathlib import Path
from typing import Protocol

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Paper, PaperSourceRecord
from app.paper_identity import normalize_arxiv_id, normalize_doi, normalize_title
from app.paper_sources.base import SourcePaper
from app.services.paper_download import (
    DownloadedPdf,
    PaperDownloadError,
    download_open_pdf,
)
from app.services.paper_orphans import (
    OrphanLifecycleError,
    claim_downloaded_pdf,
    download_lease_guard,
    retain_download_as_orphan,
)


_DOWNLOAD_FAILURE_WARNING = (
    "开放 PDF 下载失败，已保留论文元数据；可稍后重试或手动上传合法 PDF。"
)


class _FreshPaperSource(Protocol):
    async def get_by_id(self, external_id: str) -> SourcePaper: ...


Downloader = Callable[..., Awaitable[DownloadedPdf]]


class PaperImportError(RuntimeError):
    """A stable, sanitized import failure suitable for an API boundary."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


@dataclass(frozen=True, slots=True)
class DuplicateReason:
    kind: str
    value: str
    paper_id: int


@dataclass(frozen=True, slots=True)
class PaperImportResult:
    paper: Paper
    created: bool
    duplicate_reason: DuplicateReason | None
    download_attempted: bool
    download_succeeded: bool
    warning: str | None


def _json_dump(value: object) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _json_list(value: str) -> list[str]:
    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        return []
    if not isinstance(parsed, list):
        return []
    return [item for item in parsed if isinstance(item, str)]


def _paper_year(paper: Paper) -> int | None:
    value = (paper.published_date or "").strip()
    if len(value) < 4 or not value[:4].isdigit():
        return None
    year = int(value[:4])
    return year if 1 <= year <= 9999 else None


def _normalized_first_author(authors_json: str) -> str:
    authors = _json_list(authors_json)
    return normalize_title(authors[0]) if authors else ""


def _canonical_external_id(source: str, external_id: str) -> str:
    value = external_id.strip()
    if source == "openalex":
        lowered = value.lower()
        prefix = "https://openalex.org/"
        if lowered.startswith(prefix):
            value = value[len(prefix) :]
        return value.lower()
    if source == "crossref":
        return normalize_doi(value) or ""
    if source == "arxiv":
        return normalize_arxiv_id(value) or ""
    return value


def _source_record_payload(paper: SourcePaper) -> str:
    payload = asdict(paper)
    payload["authors"] = list(paper.authors)
    payload["keywords"] = list(paper.keywords)
    return _json_dump(payload)


class PaperImportService:
    def __init__(
        self,
        *,
        session: Session,
        sources: Mapping[str, _FreshPaperSource],
        storage_dir: str | Path,
        timeout_seconds: int | float,
        max_size_mb: int | float,
        downloader: Downloader = download_open_pdf,
    ) -> None:
        self._session = session
        self._sources = dict(sources)
        self._storage_dir = Path(storage_dir)
        self._timeout_seconds = timeout_seconds
        self._max_size_mb = max_size_mb
        self._downloader = downloader

    async def import_paper(
        self,
        source: str,
        external_id: str,
        *,
        download_open_pdf: bool,
    ) -> PaperImportResult:
        source_name = source.strip().lower() if isinstance(source, str) else ""
        selected_id = external_id.strip() if isinstance(external_id, str) else ""
        if not source_name or source_name not in self._sources:
            raise PaperImportError("unknown_source", "未启用或不支持该论文来源")
        if not selected_id or len(selected_id) > 500:
            raise PaperImportError("invalid_external_id", "论文来源标识无效")

        if (
            self._session.in_transaction()
            or self._session_has_pending_writes()
        ):
            raise PaperImportError(
                "session_not_clean",
                "论文导入需要专用且未开启事务的数据库会话；当前会话未被更改",
            )
        try:
            fresh = await self._sources[source_name].get_by_id(selected_id)
        except asyncio.CancelledError:
            self._rollback_preserving_cancellation()
            raise
        except PaperImportError:
            self._rollback_or_database_error()
            raise
        except Exception:
            self._rollback_or_database_error()
            raise PaperImportError(
                "source_fetch_failed",
                "无法从论文来源重新确认记录，请稍后重试",
            ) from None

        if (
            fresh.source != source_name
            or _canonical_external_id(source_name, fresh.external_id)
            != _canonical_external_id(source_name, selected_id)
        ):
            raise PaperImportError(
                "source_identity_mismatch",
                "论文来源返回了不匹配的记录，已停止导入",
            )

        fresh = self._canonicalize(fresh)
        if not fresh.title.strip() or not fresh.normalized_title:
            raise PaperImportError(
                "invalid_source_record",
                "论文来源返回的记录缺少有效标题，已停止导入",
            )

        try:
            preexisting, _ = self._find_duplicate(fresh)
            preexisting_has_fulltext = (
                preexisting is not None and self._has_fulltext(preexisting)
            )
        except PaperImportError:
            self._rollback_or_database_error()
            raise
        except Exception:
            self._rollback_or_database_error()
            raise PaperImportError(
                "database_error",
                "论文数据库暂时不可用，请稍后重试",
            ) from None
        self._rollback_or_database_error()

        download_attempted = False
        download_succeeded = False
        warning: str | None = None
        downloaded: DownloadedPdf | None = None
        should_download = (
            download_open_pdf is True
            and fresh.is_open_access is True
            and bool(fresh.pdf_url)
            and not preexisting_has_fulltext
        )
        if should_download:
            download_attempted = True
            try:
                downloaded = await self._downloader(
                    fresh.pdf_url,
                    self._storage_dir,
                    timeout_seconds=self._timeout_seconds,
                    max_size_mb=self._max_size_mb,
                )
                if downloaded.lease_id is None:
                    downloaded = replace(
                        downloaded,
                        lease_id=claim_downloaded_pdf(
                            self._storage_dir,
                            downloaded.sha256,
                        ),
                    )
            except asyncio.CancelledError:
                self._rollback_preserving_cancellation()
                raise
            except PaperDownloadError:
                warning = _DOWNLOAD_FAILURE_WARNING
            except OrphanLifecycleError:
                self._rollback_or_database_error()
                raise PaperImportError(
                    "storage_lifecycle_error",
                    "无法建立全文安全生命周期状态，请稍后重试",
                ) from None
            except Exception:
                self._rollback_or_database_error()
                raise PaperImportError(
                    "download_failed",
                    "开放 PDF 下载异常，未写入不完整记录；请稍后重试",
                ) from None

        try:
            paper, duplicate_reason = self._find_duplicate(fresh)
            created = paper is None
            paper = paper or self._new_paper(fresh)
            self._fill_missing_metadata(paper, fresh)
            warning, download_succeeded = self._merge_download_state(
                paper,
                downloaded,
                download_attempted=download_attempted,
                warning=warning,
            )
            if created:
                self._session.add(paper)
                self._session.flush()
            self._upsert_source_record(paper, fresh)
            self._commit_with_download_fence(paper, downloaded)
        except OrphanLifecycleError:
            self._rollback_then_retain(downloaded)
            raise PaperImportError(
                "storage_lifecycle_error",
                "全文安全租约已失效，数据库未采用该文件；请稍后重试",
            ) from None
        except IntegrityError:
            self._rollback_for_retry(downloaded)
            try:
                concurrent, concurrent_reason = self._find_duplicate(fresh)
            except PaperImportError:
                self._rollback_then_retain(downloaded)
                raise
            except Exception:
                self._rollback_then_retain(downloaded)
                raise PaperImportError(
                    "database_error",
                    "论文数据库暂时不可用，请稍后重试",
                ) from None
            if concurrent is None:
                self._rollback_then_retain(downloaded)
                raise PaperImportError(
                    "database_conflict",
                    "论文导入发生并发冲突，请重试",
                ) from None
            paper = concurrent
            duplicate_reason = concurrent_reason or DuplicateReason(
                kind="source_identity",
                value=f"{fresh.source}:{fresh.external_id}",
                paper_id=paper.id,
            )
            created = False
            try:
                self._fill_missing_metadata(paper, fresh)
                warning, download_succeeded = self._merge_download_state(
                    paper,
                    downloaded,
                    download_attempted=download_attempted,
                    warning=warning,
                )
                self._upsert_source_record(paper, fresh)
                self._commit_with_download_fence(paper, downloaded)
            except OrphanLifecycleError:
                self._rollback_then_retain(downloaded)
                raise PaperImportError(
                    "storage_lifecycle_error",
                    "全文安全租约已失效，数据库未采用该文件；请稍后重试",
                ) from None
            except PaperImportError:
                self._rollback_then_retain(downloaded)
                raise
            except Exception:
                self._rollback_then_retain(downloaded)
                raise PaperImportError(
                    "database_error",
                    "论文数据库暂时不可用，请稍后重试",
                ) from None
        except PaperImportError:
            self._rollback_then_retain(downloaded)
            raise
        except Exception:
            self._rollback_then_retain(downloaded)
            raise PaperImportError(
                "database_error",
                "论文数据库暂时不可用，请稍后重试",
            ) from None

        try:
            self._session.refresh(paper)
        except Exception:
            self._rollback_or_database_error()
            raise PaperImportError(
                "database_error",
                "论文数据库暂时不可用，请稍后重试",
            ) from None
        return PaperImportResult(
            paper=paper,
            created=created,
            duplicate_reason=duplicate_reason,
            download_attempted=download_attempted,
            download_succeeded=download_succeeded,
            warning=warning,
        )

    @staticmethod
    def _canonicalize(paper: SourcePaper) -> SourcePaper:
        values = asdict(paper)
        values["doi"] = normalize_doi(paper.doi)
        values["arxiv_id"] = normalize_arxiv_id(paper.arxiv_id)
        values["normalized_title"] = normalize_title(paper.title)
        values["authors"] = tuple(paper.authors)
        values["first_author"] = (
            paper.authors[0] if paper.authors else paper.first_author
        )
        values["keywords"] = tuple(paper.keywords)
        return SourcePaper(**values)

    def _find_duplicate(
        self,
        fresh: SourcePaper,
    ) -> tuple[Paper | None, DuplicateReason | None]:
        doi_paper: Paper | None = None
        arxiv_paper: Paper | None = None
        source_paper: Paper | None = None
        if fresh.doi:
            doi_paper = self._session.scalar(
                select(Paper).where(Paper.doi == fresh.doi)
            )
        if fresh.arxiv_id:
            arxiv_paper = self._session.scalar(
                select(Paper).where(Paper.arxiv_id == fresh.arxiv_id)
            )
        source_record = self._session.scalar(
            select(PaperSourceRecord).where(
                PaperSourceRecord.source == fresh.source,
                PaperSourceRecord.external_id == fresh.external_id,
            )
        )
        if source_record is not None:
            source_paper = self._session.get(Paper, source_record.paper_id)

        strong_matches = {
            paper.id: paper
            for paper in (doi_paper, arxiv_paper, source_paper)
            if paper is not None
        }
        if len(strong_matches) > 1:
            raise PaperImportError(
                "identity_conflict",
                "论文的 DOI、arXiv 或来源标识指向不同记录，已停止导入",
            )
        if doi_paper is not None:
            return doi_paper, DuplicateReason(
                "doi",
                fresh.doi or "",
                doi_paper.id,
            )
        if arxiv_paper is not None:
            return arxiv_paper, DuplicateReason(
                "arxiv_id",
                fresh.arxiv_id or "",
                arxiv_paper.id,
            )
        if source_paper is not None:
            return source_paper, DuplicateReason(
                "source_identity",
                f"{fresh.source}:{fresh.external_id}",
                source_paper.id,
            )

        expected_author = normalize_title(fresh.first_author)
        if (
            fresh.normalized_title
            and fresh.year is not None
            and expected_author
        ):
            candidates = self._session.scalars(
                select(Paper)
                .where(Paper.normalized_title == fresh.normalized_title)
                .order_by(Paper.id)
            )
            for paper in candidates:
                candidate_author = _normalized_first_author(paper.authors_json)
                if (
                    _paper_year(paper) == fresh.year
                    and candidate_author
                    and candidate_author == expected_author
                ):
                    value = (
                        f"{fresh.normalized_title}|"
                        f"{expected_author}|{fresh.year}"
                    )
                    return paper, DuplicateReason(
                        "title_author_year",
                        value,
                        paper.id,
                    )
        return None, None

    @staticmethod
    def _new_paper(fresh: SourcePaper) -> Paper:
        return Paper(
            title=fresh.title,
            normalized_title=fresh.normalized_title,
            file_size=0,
            doi=fresh.doi,
            arxiv_id=fresh.arxiv_id,
            authors_json=_json_dump(list(fresh.authors)),
            abstract=fresh.abstract,
            journal=fresh.journal,
            published_date=fresh.published_date,
            keywords_json=_json_dump(list(fresh.keywords)),
            landing_url=fresh.landing_url,
            pdf_url=fresh.pdf_url,
            oa_status=fresh.oa_status or "unknown",
            license=fresh.license,
            source_type=fresh.source,
            acquisition_status=(
                "abstract_only" if fresh.abstract.strip() else "metadata_only"
            ),
            fulltext_status="仅元数据或摘要",
            article_type=fresh.article_type,
        )

    def _fill_missing_metadata(
        self,
        paper: Paper,
        fresh: SourcePaper,
    ) -> None:
        if not paper.title.strip():
            paper.title = fresh.title
            paper.normalized_title = normalize_title(fresh.title)
        elif not paper.normalized_title:
            paper.normalized_title = normalize_title(paper.title)
        if not paper.doi and fresh.doi:
            with self._session.no_autoflush:
                doi_owner = self._session.scalar(
                    select(Paper.id).where(
                        Paper.doi == fresh.doi,
                        Paper.id != paper.id,
                    )
                )
            if doi_owner is None:
                paper.doi = fresh.doi
        if not paper.arxiv_id and fresh.arxiv_id:
            with self._session.no_autoflush:
                arxiv_owner = self._session.scalar(
                    select(Paper.id).where(
                        Paper.arxiv_id == fresh.arxiv_id,
                        Paper.id != paper.id,
                    )
                )
            if arxiv_owner is None:
                paper.arxiv_id = fresh.arxiv_id
        if not paper.normalized_title:
            paper.normalized_title = fresh.normalized_title
        if not _json_list(paper.authors_json) and fresh.authors:
            paper.authors_json = _json_dump(list(fresh.authors))
        if not paper.abstract.strip() and fresh.abstract:
            paper.abstract = fresh.abstract
        if not paper.journal.strip() and fresh.journal:
            paper.journal = fresh.journal
        if not paper.published_date and fresh.published_date:
            paper.published_date = fresh.published_date
        if not _json_list(paper.keywords_json) and fresh.keywords:
            paper.keywords_json = _json_dump(list(fresh.keywords))
        if not paper.landing_url.strip() and fresh.landing_url:
            paper.landing_url = fresh.landing_url
        if not paper.pdf_url and fresh.pdf_url:
            paper.pdf_url = fresh.pdf_url
        if paper.oa_status in {"", "unknown"} and fresh.oa_status:
            paper.oa_status = fresh.oa_status
        if not paper.license and fresh.license:
            paper.license = fresh.license
        if not paper.article_type and fresh.article_type:
            paper.article_type = fresh.article_type

    @staticmethod
    def _apply_download(paper: Paper, downloaded: DownloadedPdf) -> None:
        paper.original_filename = downloaded.final_path.name
        paper.file_path = str(downloaded.final_path)
        paper.file_hash = downloaded.sha256
        paper.file_size = downloaded.file_size
        paper.page_count = downloaded.page_count
        paper.extracted_text = downloaded.extracted_text
        paper.parse_confidence = downloaded.parse_confidence
        paper.extraction_warning = downloaded.extraction_warning
        paper.fulltext_status = downloaded.fulltext_status
        paper.acquisition_status = "fulltext"

    def _upsert_source_record(
        self,
        paper: Paper,
        fresh: SourcePaper,
    ) -> None:
        record = self._session.scalar(
            select(PaperSourceRecord).where(
                PaperSourceRecord.source == fresh.source,
                PaperSourceRecord.external_id == fresh.external_id,
            )
        )
        if record is None:
            record = PaperSourceRecord(
                paper_id=paper.id,
                source=fresh.source,
                external_id=fresh.external_id,
            )
            self._session.add(record)
        elif record.paper_id != paper.id:
            raise PaperImportError(
                "identity_conflict",
                "论文来源记录与现有论文冲突，已停止导入",
            )
        record.landing_url = fresh.landing_url
        record.pdf_url = fresh.pdf_url
        record.is_open_access = fresh.is_open_access is True
        record.license = fresh.license
        record.raw_metadata_json = _source_record_payload(fresh)

    @staticmethod
    def _has_fulltext(paper: Paper) -> bool:
        return bool(paper.file_path) or paper.acquisition_status == "fulltext"

    def _merge_download_state(
        self,
        paper: Paper,
        downloaded: DownloadedPdf | None,
        *,
        download_attempted: bool,
        warning: str | None,
    ) -> tuple[str | None, bool]:
        if downloaded is not None:
            if self._has_fulltext(paper):
                if paper.file_path != str(downloaded.final_path):
                    retained_warning = (
                        "数据库中已有全文，未覆盖现有文件；新下载的内容寻址文件已安全保留，"
                        "等待后续带锁的延迟清理。"
                    )
                    warning = (
                        f"{warning} {retained_warning}"
                        if warning
                        else retained_warning
                    )
            else:
                self._apply_download(paper, downloaded)
            return warning, True
        if download_attempted and not self._has_fulltext(paper):
            paper.acquisition_status = "download_failed"
        elif not self._has_fulltext(paper):
            paper.acquisition_status = (
                "abstract_only" if paper.abstract.strip() else "metadata_only"
            )
        return warning, False

    def _session_has_pending_writes(self) -> bool:
        if self._session.new or self._session.deleted:
            return True
        return any(
            self._session.is_modified(item, include_collections=True)
            for item in self._session.dirty
        )

    def _try_retain_download(
        self,
        downloaded: DownloadedPdf | None,
    ) -> None:
        if downloaded is None:
            return
        try:
            retain_download_as_orphan(
                self._storage_dir,
                downloaded.sha256,
                downloaded.lease_id,
            )
        except OrphanLifecycleError:
            # The original failure remains authoritative. A lifecycle
            # diagnostic can recover an unmarked content-addressed file.
            pass

    def _rollback_then_retain(
        self,
        downloaded: DownloadedPdf | None,
    ) -> None:
        rollback_failed = False
        try:
            self._session.rollback()
        except Exception:
            rollback_failed = True
        self._try_retain_download(downloaded)
        if rollback_failed:
            raise PaperImportError(
                "database_error",
                "论文数据库暂时不可用，请稍后重试",
            ) from None

    def _rollback_for_retry(
        self,
        downloaded: DownloadedPdf | None,
    ) -> None:
        try:
            self._session.rollback()
        except Exception:
            self._try_retain_download(downloaded)
            raise PaperImportError(
                "database_error",
                "论文数据库暂时不可用，请稍后重试",
            ) from None

    def _commit_with_download_fence(
        self,
        paper: Paper,
        downloaded: DownloadedPdf | None,
    ) -> None:
        if downloaded is None:
            self._session.commit()
            return
        adopted = (
            paper.file_hash == downloaded.sha256
            or paper.file_path == str(downloaded.final_path)
        )
        if not adopted:
            self._session.commit()
            retain_download_as_orphan(
                self._storage_dir,
                downloaded.sha256,
                downloaded.lease_id,
            )
            return
        if downloaded.lease_id is None:
            raise OrphanLifecycleError("download lease is missing")
        with download_lease_guard(
            self._storage_dir,
            downloaded.sha256,
            downloaded.lease_id,
        ) as guard:
            # Cleanup shares this per-hash lock, so it cannot remove the PDF
            # between the database commit and lifecycle adoption.
            self._session.commit()
            guard.adopt()

    def _rollback_or_database_error(self) -> None:
        try:
            self._session.rollback()
        except Exception:
            raise PaperImportError(
                "database_error",
                "论文数据库暂时不可用，请稍后重试",
            ) from None

    def _rollback_preserving_cancellation(self) -> None:
        try:
            self._session.rollback()
        except Exception:
            # Cancellation must remain cancellation; the caller owns disposal
            # of an unusable session if rollback itself fails.
            pass
