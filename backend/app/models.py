from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, event
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.paper_identity import normalize_title
import app.campus_models  # noqa: F401  # register independent campus tables with Base


class Paper(Base):
    __tablename__ = "papers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(500))
    file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    file_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        unique=True,
        index=True,
    )
    file_size: Mapped[int] = mapped_column(Integer)
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    parse_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    extraction_warning: Mapped[str | None] = mapped_column(Text, nullable=True)
    fulltext_status: Mapped[str] = mapped_column(String(50), default="已读取全文")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    doi: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
        index=True,
    )
    arxiv_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
        index=True,
    )
    normalized_title: Mapped[str] = mapped_column(
        String(500),
        default="",
        index=True,
    )
    authors_json: Mapped[str] = mapped_column(Text, default="[]")
    abstract: Mapped[str] = mapped_column(Text, default="")
    journal: Mapped[str] = mapped_column(String(500), default="")
    published_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    keywords_json: Mapped[str] = mapped_column(Text, default="[]")
    landing_url: Mapped[str] = mapped_column(String(1000), default="")
    pdf_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    oa_status: Mapped[str] = mapped_column(String(50), default="unknown")
    license: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_type: Mapped[str] = mapped_column(String(80), default="upload")
    acquisition_status: Mapped[str] = mapped_column(String(50), default="fulltext")
    article_type: Mapped[str] = mapped_column(String(80), default="")
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    active_parse_run_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ocr_file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    knowledge_index_stale: Mapped[bool] = mapped_column(Boolean, default=False)
    glossary: Mapped["PaperGlossary | None"] = relationship(cascade="all, delete-orphan", uselist=False)
    source_records: Mapped[list["PaperSourceRecord"]] = relationship(
        back_populates="paper",
        cascade="all, delete-orphan",
    )
    visuals: Mapped[list["PaperVisual"]] = relationship(
        back_populates="paper",
        cascade="all, delete-orphan",
    )
    chunks: Mapped[list["PaperChunk"]] = relationship(
        back_populates="paper",
        cascade="all, delete-orphan",
    )
    claims = relationship(
        "PaperClaim",
        back_populates="paper",
        cascade="all, delete-orphan",
    )
    conversations: Mapped[list["KnowledgeConversation"]] = relationship(
        back_populates="paper",
        cascade="all, delete-orphan",
    )


@event.listens_for(Paper, "before_insert")
@event.listens_for(Paper, "before_update")
def _derive_normalized_title(_mapper, _connection, paper: Paper) -> None:
    if not (paper.normalized_title or "").strip():
        paper.normalized_title = normalize_title(paper.title)


class PaperSourceRecord(Base):
    __tablename__ = "paper_source_records"
    __table_args__ = (
        UniqueConstraint(
            "source",
            "external_id",
            name="uq_paper_source_records_source_external_id",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(
        ForeignKey(
            "papers.id",
            name="fk_paper_source_records_paper_id_papers",
            ondelete="CASCADE",
        ),
        index=True,
    )
    source: Mapped[str] = mapped_column(String(80))
    external_id: Mapped[str] = mapped_column(String(500))
    landing_url: Mapped[str] = mapped_column(String(1000), default="")
    pdf_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_open_access: Mapped[bool] = mapped_column(Boolean, default=False)
    license: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_metadata_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    paper: Mapped[Paper] = relationship(back_populates="source_records")


class PaperVisual(Base):
    __tablename__ = "paper_visuals"
    __table_args__ = (
        UniqueConstraint(
            "paper_id",
            "page_number",
            "kind",
            "label",
            name="uq_paper_visuals_paper_page_kind_label",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(
        ForeignKey(
            "papers.id",
            name="fk_paper_visuals_paper_id_papers",
            ondelete="CASCADE",
        ),
        index=True,
    )
    page_number: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(20))
    label: Mapped[str] = mapped_column(String(100))
    caption: Mapped[str] = mapped_column(Text)
    analysis_markdown: Mapped[str] = mapped_column(Text, default="")
    evidence_status: Mapped[str] = mapped_column(String(80), default="")
    provider: Mapped[str] = mapped_column(String(80), default="")
    model_name: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    paper: Mapped[Paper] = relationship(back_populates="visuals")
    crops: Mapped[list["PaperVisualCrop"]] = relationship(
        back_populates="visual",
        cascade="all, delete-orphan",
    )


class PaperChunk(Base):
    __tablename__ = "paper_chunks"
    __table_args__ = (
        UniqueConstraint(
            "paper_id",
            "content_hash",
            "embedding_model",
            name="uq_paper_chunks_paper_content_model",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(
        ForeignKey(
            "papers.id",
            name="fk_paper_chunks_paper_id_papers",
            ondelete="CASCADE",
        ),
        index=True,
    )
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    section: Mapped[str] = mapped_column(String(255), default="")
    content: Mapped[str] = mapped_column(Text)
    content_hash: Mapped[str] = mapped_column(String(64), index=True)
    source_scope: Mapped[str] = mapped_column(String(30))
    parse_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    parse_run_id: Mapped[int | None] = mapped_column(
        ForeignKey("paper_parse_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source_locations_json: Mapped[str] = mapped_column(Text, default="[]")
    embedding_json: Mapped[str] = mapped_column(Text)
    embedding_model: Mapped[str] = mapped_column(String(200), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    paper: Mapped[Paper] = relationship(back_populates="chunks")
    claim_links = relationship(
        "ClaimEvidence",
        back_populates="chunk",
        cascade="all, delete-orphan",
    )


class PaperClaim(Base):
    __tablename__ = "paper_claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(
        ForeignKey(
            "papers.id",
            name="fk_paper_claims_paper_id_papers",
            ondelete="CASCADE",
        ),
        index=True,
    )
    claim_text: Mapped[str] = mapped_column(Text)
    claim_type: Mapped[str] = mapped_column(String(40), default="AI归纳")
    evidence_status: Mapped[str] = mapped_column(String(100))
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    paper: Mapped[Paper] = relationship(back_populates="claims")
    evidence_links = relationship(
        "ClaimEvidence",
        back_populates="claim",
        cascade="all, delete-orphan",
        order_by="ClaimEvidence.rank",
    )


class ClaimEvidence(Base):
    __tablename__ = "claim_evidence"
    __table_args__ = (
        UniqueConstraint(
            "claim_id",
            "chunk_id",
            name="uq_claim_evidence_claim_chunk",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    claim_id: Mapped[int] = mapped_column(
        ForeignKey(
            "paper_claims.id",
            name="fk_claim_evidence_claim_id_paper_claims",
            ondelete="CASCADE",
        ),
        index=True,
    )
    chunk_id: Mapped[int] = mapped_column(
        ForeignKey(
            "paper_chunks.id",
            name="fk_claim_evidence_chunk_id_paper_chunks",
            ondelete="CASCADE",
        ),
        index=True,
    )
    rank: Mapped[int] = mapped_column(Integer)
    similarity: Mapped[float] = mapped_column(Float)
    locator: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    claim: Mapped[PaperClaim] = relationship(back_populates="evidence_links")
    chunk: Mapped[PaperChunk] = relationship(back_populates="claim_links")


class KnowledgeConversation(Base):
    __tablename__ = "knowledge_conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scope: Mapped[str] = mapped_column(String(20))
    paper_id: Mapped[int | None] = mapped_column(
        ForeignKey("papers.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    paper: Mapped[Paper | None] = relationship(back_populates="conversations")
    turns: Mapped[list["KnowledgeConversationTurn"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="KnowledgeConversationTurn.turn_index",
    )


class KnowledgeConversationTurn(Base):
    __tablename__ = "knowledge_conversation_turns"
    __table_args__ = (
        UniqueConstraint(
            "conversation_id",
            "turn_index",
            name="uq_knowledge_conversation_turns_conversation_turn",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("knowledge_conversations.id", ondelete="CASCADE"),
        index=True,
    )
    turn_index: Mapped[int] = mapped_column(Integer)
    question: Mapped[str] = mapped_column(Text)
    answer_markdown: Mapped[str] = mapped_column(Text)
    citations_json: Mapped[str] = mapped_column(Text, default="[]")
    evidence_status: Mapped[str] = mapped_column(String(160))
    confidence_level: Mapped[str] = mapped_column(String(10))
    confidence_explanation: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(String(80))
    model_name: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    conversation: Mapped[KnowledgeConversation] = relationship(back_populates="turns")


class SavedComparison(Base):
    __tablename__ = "saved_comparisons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    paper_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    question: Mapped[str] = mapped_column(Text)
    comparison_markdown: Mapped[str] = mapped_column(Text)
    papers_json: Mapped[str] = mapped_column(Text, default="[]")
    citations_json: Mapped[str] = mapped_column(Text, default="[]")
    fairness_warnings_json: Mapped[str] = mapped_column(Text, default="[]")
    evidence_status: Mapped[str] = mapped_column(String(160))
    confidence_level: Mapped[str] = mapped_column(String(10))
    confidence_explanation: Mapped[str] = mapped_column(Text)
    provider: Mapped[str] = mapped_column(String(80))
    model_name: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PaperVisualCrop(Base):
    __tablename__ = "paper_visual_crops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(
        ForeignKey("papers.id", ondelete="CASCADE"),
        index=True,
    )
    visual_id: Mapped[int] = mapped_column(
        ForeignKey("paper_visuals.id", ondelete="CASCADE"),
        index=True,
    )
    left: Mapped[float] = mapped_column(Float)
    top: Mapped[float] = mapped_column(Float)
    width: Mapped[float] = mapped_column(Float)
    height: Mapped[float] = mapped_column(Float)
    label: Mapped[str] = mapped_column(String(100), default="")
    analysis_markdown: Mapped[str] = mapped_column(Text, default="")
    structured_data_json: Mapped[str] = mapped_column(Text, default="{}")
    evidence_status: Mapped[str] = mapped_column(String(160), default="")
    provider: Mapped[str] = mapped_column(String(80), default="")
    model_name: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    paper: Mapped[Paper] = relationship()
    visual: Mapped[PaperVisual] = relationship(back_populates="crops")


class Analysis(Base):
    __tablename__ = "analyses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    summary: Mapped[str] = mapped_column(Text)
    plain_explanation: Mapped[str] = mapped_column(Text)
    deep_analysis: Mapped[str] = mapped_column(Text)
    quick_understanding: Mapped[str] = mapped_column(Text, default="")
    quick_prompt_version: Mapped[str] = mapped_column(String(80), default="")
    quick_schema_version: Mapped[str] = mapped_column(String(80), default="")
    quick_evidence_status: Mapped[str] = mapped_column(String(80), default="")
    layman_understanding: Mapped[str] = mapped_column(Text, default="")
    layman_prompt_version: Mapped[str] = mapped_column(String(80), default="")
    layman_schema_version: Mapped[str] = mapped_column(String(80), default="")
    layman_evidence_status: Mapped[str] = mapped_column(String(80), default="")
    reviewer_analysis: Mapped[str] = mapped_column(Text, default="")
    reviewer_prompt_version: Mapped[str] = mapped_column(String(80), default="")
    reviewer_schema_version: Mapped[str] = mapped_column(String(80), default="")
    reviewer_evidence_status: Mapped[str] = mapped_column(String(80), default="")
    evidence_status: Mapped[str] = mapped_column(String(80))
    provider: Mapped[str] = mapped_column(String(80))
    model_name: Mapped[str] = mapped_column(String(200))
    source_parse_run_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_stale: Mapped[bool] = mapped_column(Boolean, default=False)
    stale_reason: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PaperParseRun(Base):
    __tablename__ = "paper_parse_runs"
    __table_args__ = (
        CheckConstraint("status IN ('queued','running','completed','failed','cancelled')", name="ck_paper_parse_runs_status"),
        UniqueConstraint("paper_id", "version_number", name="uq_paper_parse_runs_version"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), index=True)
    version_number: Mapped[int] = mapped_column(Integer)
    mode: Mapped[str] = mapped_column(String(20), default="auto")
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)
    engine: Mapped[str] = mapped_column(String(80), default="pymupdf+pp-structurev3")
    engine_version: Mapped[str] = mapped_column(String(80), default="")
    device: Mapped[str] = mapped_column(String(20), default="cpu")
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    source_quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    derivative_file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    warnings_json: Mapped[str] = mapped_column(Text, default="[]")
    error_message: Mapped[str] = mapped_column(Text, default="")
    cancel_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    comparison_viewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    comparison_active_parse_run_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PaperPageExtraction(Base):
    __tablename__ = "paper_page_extractions"
    __table_args__ = (
        UniqueConstraint("parse_run_id", "page_number", name="uq_page_extractions_run_page"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parse_run_id: Mapped[int] = mapped_column(ForeignKey("paper_parse_runs.id", ondelete="CASCADE"), index=True)
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), index=True)
    page_number: Mapped[int] = mapped_column(Integer)
    source_type: Mapped[str] = mapped_column(String(30))
    text: Mapped[str] = mapped_column(Text, default="")
    layout_json: Mapped[str] = mapped_column(Text, default="[]")
    tables_json: Mapped[str] = mapped_column(Text, default="[]")
    formulas_json: Mapped[str] = mapped_column(Text, default="[]")
    figures_json: Mapped[str] = mapped_column(Text, default="[]")
    coordinates_json: Mapped[str] = mapped_column(Text, default="[]")
    page_width: Mapped[float | None] = mapped_column(Float, nullable=True)
    page_height: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    confirmation_status: Mapped[str] = mapped_column(String(20), default="not_required")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ScientificDataset(Base):
    __tablename__ = "scientific_datasets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int | None] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(500), default="未命名数据集")
    import_id: Mapped[int | None] = mapped_column(ForeignKey("scientific_imports.id", ondelete="SET NULL"), nullable=True)
    idea_id: Mapped[int | None] = mapped_column(ForeignKey("research_ideas.id", ondelete="SET NULL"), nullable=True)
    contest_project_id: Mapped[int | None] = mapped_column(ForeignKey("contest_projects.id", ondelete="SET NULL"), nullable=True)
    parse_run_id: Mapped[int | None] = mapped_column(ForeignKey("paper_parse_runs.id", ondelete="SET NULL"), nullable=True)
    visual_id: Mapped[int | None] = mapped_column(ForeignKey("paper_visuals.id", ondelete="SET NULL"), nullable=True)
    crop_id: Mapped[int | None] = mapped_column(ForeignKey("paper_visual_crops.id", ondelete="SET NULL"), nullable=True)
    source_type: Mapped[str] = mapped_column(String(30))
    domain: Mapped[str] = mapped_column(String(50))
    dataset_type: Mapped[str] = mapped_column(String(80))
    data_json: Mapped[str] = mapped_column(Text, default="{}")
    units_json: Mapped[str] = mapped_column(Text, default="{}")
    parameters_json: Mapped[str] = mapped_column(Text, default="{}")
    revision_history_json: Mapped[str] = mapped_column(Text, default="[]")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    confirmation_status: Mapped[str] = mapped_column(String(20), default="pending")
    is_stale: Mapped[bool] = mapped_column(Boolean, default=False)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ScientificAnalysisRun(Base):
    __tablename__ = "scientific_analysis_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dataset_id: Mapped[int] = mapped_column(ForeignKey("scientific_datasets.id", ondelete="CASCADE"), index=True)
    recipe_key: Mapped[str] = mapped_column(String(100))
    parameters_json: Mapped[str] = mapped_column(Text, default="{}")
    algorithm_version: Mapped[str] = mapped_column(String(50))
    results_json: Mapped[str] = mapped_column(Text, default="{}")
    diagnostics_json: Mapped[str] = mapped_column(Text, default="{}")
    report_markdown: Mapped[str] = mapped_column(Text, default="")
    artifacts_json: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String(20), default="queued")
    is_stale: Mapped[bool] = mapped_column(Boolean, default=False)
    error_message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Note(Base):
    __tablename__ = "notes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    content: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserSetting(Base):
    __tablename__ = "user_settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model_provider: Mapped[str] = mapped_column(String(80), default="mock")
    model_name: Mapped[str] = mapped_column(String(200), default="mock-energy-research-v1")
    vision_model: Mapped[str] = mapped_column(String(200), default="")
    model_base_url: Mapped[str] = mapped_column(String(500), default="")
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60)
    backup_model: Mapped[str] = mapped_column(String(200), default="")
    paper_budget: Mapped[float] = mapped_column(Float, default=1.0)
    daily_budget: Mapped[float] = mapped_column(Float, default=5.0)
    monthly_budget: Mapped[float] = mapped_column(Float, default=50.0)
    campus_ai_daily_limit: Mapped[int] = mapped_column(Integer, default=20)
    campus_ai_max_tokens: Mapped[int] = mapped_column(Integer, default=2400)
    onboarding_completed: Mapped[bool] = mapped_column(default=False)
    study_mode: Mapped[str] = mapped_column(String(100), default="科研助手")
    research_topics: Mapped[str] = mapped_column(Text, default="[]")
    keywords: Mapped[str] = mapped_column(Text, default="[]")
    daily_task_time: Mapped[str] = mapped_column(String(20), default="08:00")
    document_vision_provider: Mapped[str] = mapped_column(String(80), default="mock")
    document_vision_model: Mapped[str] = mapped_column(String(200), default="")
    document_vision_base_url: Mapped[str] = mapped_column(String(500), default="")
    document_vision_timeout_seconds: Mapped[int] = mapped_column(Integer, default=90)


class TaskRun(Base):
    __tablename__ = "task_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    task_name: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50))
    detail: Mapped[str] = mapped_column(Text, default="")
    resource_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    resource_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    queue_job_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=1)
    error_code: Mapped[str] = mapped_column(String(80), default="")
    cancel_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ContestProject(Base):
    __tablename__ = "contest_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    competition_name: Mapped[str] = mapped_column(String(300), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    research_question: Mapped[str] = mapped_column(Text, default="")
    innovation: Mapped[str] = mapped_column(Text, default="")
    method: Mapped[str] = mapped_column(Text, default="")
    evidence: Mapped[str] = mapped_column(Text, default="")
    feasibility: Mapped[str] = mapped_column(Text, default="")
    expected_outcomes: Mapped[str] = mapped_column(Text, default="")
    risks: Mapped[str] = mapped_column(Text, default="")
    resources: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ContestSource(Base):
    __tablename__ = "contest_sources"
    __table_args__ = (UniqueConstraint("project_id", "sha256", name="uq_contest_sources_project_hash"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("contest_projects.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(500))
    source_type: Mapped[str] = mapped_column(String(20))
    sha256: Mapped[str] = mapped_column(String(64))
    file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    locators_json: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String(30), default="ready")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ContestRule(Base):
    __tablename__ = "contest_rules"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("contest_projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text, default="")
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    citations_json: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ContestRubricItem(Base):
    __tablename__ = "contest_rubric_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("contest_projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text, default="")
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    citations_json: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ContestMilestone(Base):
    __tablename__ = "contest_milestones"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("contest_projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    due_date: Mapped[date] = mapped_column(Date)
    source: Mapped[str] = mapped_column(String(20), default="manual")
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ContestRubricCheck(Base):
    __tablename__ = "contest_rubric_checks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("contest_projects.id", ondelete="CASCADE"), index=True)
    rubric_item_id: Mapped[int] = mapped_column(ForeignKey("contest_rubric_items.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(20))
    evidence_json: Mapped[str] = mapped_column(Text, default="[]")
    questions_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ContestDefenseSession(Base):
    __tablename__ = "contest_defense_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("contest_projects.id", ondelete="CASCADE"), index=True)
    mode: Mapped[str] = mapped_column(String(20), default="text")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ContestDefenseTurn(Base):
    __tablename__ = "contest_defense_turns"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("contest_defense_sessions.id", ondelete="CASCADE"), index=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text, default="")
    feedback: Mapped[str] = mapped_column(Text, default="")
    audio_file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    transcript: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ScientificImport(Base):
    __tablename__ = "scientific_imports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    original_filename: Mapped[str] = mapped_column(String(500))
    file_path: Mapped[str] = mapped_column(String(1000))
    sha256: Mapped[str] = mapped_column(String(64), unique=True)
    file_format: Mapped[str] = mapped_column(String(20))
    available_sheets_json: Mapped[str] = mapped_column(Text, default="[]")
    selected_sheet: Mapped[str | None] = mapped_column(String(300), nullable=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    column_count: Mapped[int] = mapped_column(Integer, default=0)
    column_types_json: Mapped[str] = mapped_column(Text, default="{}")
    missing_values_json: Mapped[str] = mapped_column(Text, default="{}")
    preview_json: Mapped[str] = mapped_column(Text, default="[]")
    status: Mapped[str] = mapped_column(String(30), default="preview")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ResearchIdea(Base):
    __tablename__ = "research_ideas"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    source_mode: Mapped[str] = mapped_column(String(30), default="user")
    selected_paper_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    selected_dataset_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    hypothesis: Mapped[str] = mapped_column(Text, default="")
    evidence: Mapped[str] = mapped_column(Text, default="")
    novelty: Mapped[str] = mapped_column(Text, default="")
    falsification: Mapped[str] = mapped_column(Text, default="")
    feasibility: Mapped[str] = mapped_column(Text, default="")
    resources: Mapped[str] = mapped_column(Text, default="")
    evidence_gaps: Mapped[str] = mapped_column(Text, default="")
    ai_review: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExperimentDesign(Base):
    __tablename__ = "experiment_designs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    idea_id: Mapped[int | None] = mapped_column(ForeignKey("research_ideas.id", ondelete="SET NULL"), nullable=True)
    contest_project_id: Mapped[int | None] = mapped_column(ForeignKey("contest_projects.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(500))
    variables: Mapped[str] = mapped_column(Text, default="")
    controls: Mapped[str] = mapped_column(Text, default="")
    replication: Mapped[str] = mapped_column(Text, default="")
    randomization: Mapped[str] = mapped_column(Text, default="")
    measurement: Mapped[str] = mapped_column(Text, default="")
    statistics: Mapped[str] = mapped_column(Text, default="")
    stopping_criteria: Mapped[str] = mapped_column(Text, default="")
    resources: Mapped[str] = mapped_column(Text, default="")
    risks: Mapped[str] = mapped_column(Text, default="")
    deterministic_findings_json: Mapped[str] = mapped_column(Text, default="[]")
    ai_review: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ResearchExport(Base):
    __tablename__ = "research_exports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    export_type: Mapped[str] = mapped_column(String(20))
    selected_paper_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    selected_dataset_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    selected_analysis_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    markdown: Mapped[str] = mapped_column(Text, default="")
    file_path: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="completed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class LearningPack(Base):
    __tablename__ = "learning_packs"
    __table_args__ = (
        CheckConstraint(
            "lifecycle_status IN ('active', 'draft', 'archived')",
            name="ck_learning_packs_lifecycle_status",
        ),
        UniqueConstraint("lineage_id", "version_number", name="uq_learning_packs_lineage_version"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    learning_goal: Mapped[str] = mapped_column(Text, default="")
    cards_status: Mapped[str] = mapped_column(String(30), default="pending")
    quiz_status: Mapped[str] = mapped_column(String(30), default="pending")
    cards_prompt_version: Mapped[str] = mapped_column(String(80), default="learning-cards-v1")
    cards_schema_version: Mapped[str] = mapped_column(String(80), default="learning-cards-schema-v1")
    quiz_prompt_version: Mapped[str] = mapped_column(String(80), default="learning-quiz-v1")
    quiz_schema_version: Mapped[str] = mapped_column(String(80), default="learning-quiz-schema-v1")
    provider: Mapped[str] = mapped_column(String(80), default="")
    model_name: Mapped[str] = mapped_column(String(200), default="")
    lineage_id: Mapped[str] = mapped_column(String(64), default=lambda: uuid.uuid4().hex)
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    lifecycle_status: Mapped[str] = mapped_column(String(20), default="active")
    archived_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    cards_started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    quiz_started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    sources: Mapped[list["LearningPackSource"]] = relationship(back_populates="pack", cascade="all, delete-orphan")
    cards: Mapped[list["LearningCard"]] = relationship(back_populates="pack", cascade="all, delete-orphan", order_by="LearningCard.position")
    questions: Mapped[list["LearningQuestion"]] = relationship(back_populates="pack", cascade="all, delete-orphan", order_by="LearningQuestion.position")
    weaknesses: Mapped[list["LearningWeakness"]] = relationship(back_populates="pack", cascade="all, delete-orphan")
    plan: Mapped["LearningPlan | None"] = relationship(back_populates="pack", cascade="all, delete-orphan", uselist=False)
    review_states: Mapped[list["LearningReviewState"]] = relationship(
        back_populates="pack", cascade="all, delete-orphan"
    )
    review_events: Mapped[list["LearningReviewEvent"]] = relationship(
        back_populates="pack", cascade="all, delete-orphan"
    )


class LearningPackSource(Base):
    __tablename__ = "learning_pack_sources"
    __table_args__ = (UniqueConstraint("pack_id", "paper_id", name="uq_learning_pack_sources_pack_paper"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pack_id: Mapped[int] = mapped_column(ForeignKey("learning_packs.id", ondelete="CASCADE"), index=True)
    paper_id: Mapped[int | None] = mapped_column(ForeignKey("papers.id", ondelete="SET NULL"), nullable=True, index=True)
    paper_title: Mapped[str] = mapped_column(String(500))
    available_reports_json: Mapped[str] = mapped_column(Text, default="[]")
    analysis_versions_json: Mapped[str] = mapped_column(Text, default="{}")
    analysis_hash: Mapped[str] = mapped_column(String(64), default="")
    evidence_scope: Mapped[str] = mapped_column(String(50), default="fulltext")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    pack: Mapped[LearningPack] = relationship(back_populates="sources")
    paper: Mapped[Paper | None] = relationship()


class LearningCard(Base):
    __tablename__ = "learning_cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pack_id: Mapped[int] = mapped_column(ForeignKey("learning_packs.id", ondelete="CASCADE"), index=True)
    concept: Mapped[str] = mapped_column(String(200))
    generated_content: Mapped[str] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    importance: Mapped[str] = mapped_column(Text, default="")
    common_mistake: Mapped[str] = mapped_column(Text, default="")
    evidence_json: Mapped[str] = mapped_column(Text, default="[]")
    is_user_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    mastery_status: Mapped[str] = mapped_column(String(20), default="未学习")
    mastery_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    position: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    pack: Mapped[LearningPack] = relationship(back_populates="cards")
    review_state: Mapped["LearningReviewState | None"] = relationship(
        back_populates="card", cascade="all, delete-orphan", uselist=False
    )
    review_events: Mapped[list["LearningReviewEvent"]] = relationship(
        back_populates="card", cascade="all, delete-orphan"
    )


class LearningQuestion(Base):
    __tablename__ = "learning_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pack_id: Mapped[int] = mapped_column(ForeignKey("learning_packs.id", ondelete="CASCADE"), index=True)
    question_type: Mapped[str] = mapped_column(String(20))
    prompt: Mapped[str] = mapped_column(Text)
    options_json: Mapped[str] = mapped_column(Text, default="[]")
    correct_answer: Mapped[str] = mapped_column(Text, default="")
    accepted_answers_json: Mapped[str] = mapped_column(Text, default="[]")
    explanation: Mapped[str] = mapped_column(Text, default="")
    reference_points_json: Mapped[str] = mapped_column(Text, default="[]")
    related_card_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    evidence_json: Mapped[str] = mapped_column(Text, default="[]")
    position: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    pack: Mapped[LearningPack] = relationship(back_populates="questions")
    attempts: Mapped[list["LearningAttempt"]] = relationship(back_populates="question", cascade="all, delete-orphan")


class LearningAttempt(Base):
    __tablename__ = "learning_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("learning_questions.id", ondelete="CASCADE"), index=True)
    answer: Mapped[str] = mapped_column(Text)
    result: Mapped[str | None] = mapped_column(String(30), nullable=True)
    self_rating: Mapped[str | None] = mapped_column(String(20), nullable=True)
    feedback_markdown: Mapped[str] = mapped_column(Text, default="")
    feedback_provider: Mapped[str] = mapped_column(String(80), default="")
    feedback_model_name: Mapped[str] = mapped_column(String(200), default="")
    feedback_prompt_version: Mapped[str] = mapped_column(String(80), default="")
    feedback_evidence_status: Mapped[str] = mapped_column(String(50), default="")
    feedback_generated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    question: Mapped[LearningQuestion] = relationship(back_populates="attempts")


class LearningWeakness(Base):
    __tablename__ = "learning_weaknesses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pack_id: Mapped[int] = mapped_column(ForeignKey("learning_packs.id", ondelete="CASCADE"), index=True)
    card_id: Mapped[int | None] = mapped_column(ForeignKey("learning_cards.id", ondelete="SET NULL"), nullable=True)
    concept: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(20), default="manual")
    occurrence_count: Mapped[int] = mapped_column(Integer, default=1)
    recurrence_count: Mapped[int] = mapped_column(Integer, default=0)
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    pack: Mapped[LearningPack] = relationship(back_populates="weaknesses")
    card: Mapped[LearningCard | None] = relationship()


class LearningPlan(Base):
    __tablename__ = "learning_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pack_id: Mapped[int] = mapped_column(ForeignKey("learning_packs.id", ondelete="CASCADE"), unique=True, index=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    weekdays_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    pack: Mapped[LearningPack] = relationship(back_populates="plan")
    tasks: Mapped[list["LearningPlanTask"]] = relationship(back_populates="plan", cascade="all, delete-orphan", order_by="LearningPlanTask.position")


class LearningPlanTask(Base):
    __tablename__ = "learning_plan_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("learning_plans.id", ondelete="CASCADE"), index=True)
    task_date: Mapped[date] = mapped_column(Date, index=True)
    task_type: Mapped[str] = mapped_column(String(20))
    card_id: Mapped[int | None] = mapped_column(ForeignKey("learning_cards.id", ondelete="SET NULL"), nullable=True)
    question_id: Mapped[int | None] = mapped_column(ForeignKey("learning_questions.id", ondelete="SET NULL"), nullable=True)
    weakness_id: Mapped[int | None] = mapped_column(ForeignKey("learning_weaknesses.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(500))
    position: Mapped[int] = mapped_column(Integer)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    plan: Mapped[LearningPlan] = relationship(back_populates="tasks")


class LearningReviewState(Base):
    __tablename__ = "learning_review_states"
    __table_args__ = (
        CheckConstraint(
            "last_rating IN ('不会', '模糊', '基本掌握', '已掌握')",
            name="ck_learning_review_states_rating",
        ),
        CheckConstraint("review_count >= 1", name="ck_learning_review_states_review_count"),
        CheckConstraint("lapse_count >= 0", name="ck_learning_review_states_lapse_count"),
        UniqueConstraint("card_id", name="uq_learning_review_states_card_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pack_id: Mapped[int] = mapped_column(
        ForeignKey("learning_packs.id", ondelete="CASCADE"), index=True
    )
    card_id: Mapped[int] = mapped_column(
        ForeignKey("learning_cards.id", ondelete="CASCADE")
    )
    last_rating: Mapped[str] = mapped_column(String(20))
    next_review_date: Mapped[date] = mapped_column(Date, index=True)
    review_count: Mapped[int] = mapped_column(Integer, default=1)
    lapse_count: Mapped[int] = mapped_column(Integer, default=0)
    is_paused: Mapped[bool] = mapped_column(Boolean, default=False)
    last_reviewed_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    pack: Mapped[LearningPack] = relationship(back_populates="review_states")
    card: Mapped[LearningCard] = relationship(back_populates="review_state")


class LearningReviewEvent(Base):
    __tablename__ = "learning_review_events"
    __table_args__ = (
        CheckConstraint(
            "rating IN ('不会', '模糊', '基本掌握', '已掌握')",
            name="ck_learning_review_events_rating",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pack_id: Mapped[int] = mapped_column(
        ForeignKey("learning_packs.id", ondelete="CASCADE"), index=True
    )
    card_id: Mapped[int] = mapped_column(
        ForeignKey("learning_cards.id", ondelete="CASCADE"), index=True
    )
    rating: Mapped[str] = mapped_column(String(20))
    next_review_date: Mapped[date] = mapped_column(Date)
    is_lapse: Mapped[bool] = mapped_column(Boolean, default=False)
    resulting_mastery: Mapped[str] = mapped_column(String(20))
    reviewed_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    pack: Mapped[LearningPack] = relationship(back_populates="review_events")
    card: Mapped[LearningCard] = relationship(back_populates="review_events")


class ResearchSubscription(Base):
    __tablename__ = "research_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    query: Mapped[str] = mapped_column(String(300))
    sources_json: Mapped[str] = mapped_column(Text, default="[]")
    year_from: Mapped[int | None] = mapped_column(Integer, nullable=True)
    year_to: Mapped[int | None] = mapped_column(Integer, nullable=True)
    open_access_only: Mapped[bool] = mapped_column(Boolean, default=False)
    interval_hours: Mapped[int] = mapped_column(Integer, default=168)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    runs: Mapped[list["ResearchRun"]] = relationship(
        back_populates="subscription",
        cascade="all, delete-orphan",
    )
    recommendations: Mapped[list["ResearchRecommendation"]] = relationship(
        back_populates="subscription",
        cascade="all, delete-orphan",
    )
    notifications: Mapped[list["ResearchNotification"]] = relationship(
        back_populates="subscription",
        cascade="all, delete-orphan",
    )


class ResearchRun(Base):
    __tablename__ = "research_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("research_subscriptions.id", ondelete="CASCADE"),
        index=True,
    )
    status: Mapped[str] = mapped_column(String(40))
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    discovered_count: Mapped[int] = mapped_column(Integer, default=0)
    recommended_count: Mapped[int] = mapped_column(Integer, default=0)
    source_statuses_json: Mapped[str] = mapped_column(Text, default="[]")
    warnings_json: Mapped[str] = mapped_column(Text, default="[]")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    subscription: Mapped[ResearchSubscription] = relationship(back_populates="runs")
    recommendations: Mapped[list["ResearchRecommendation"]] = relationship(
        back_populates="run",
    )
    notifications: Mapped[list["ResearchNotification"]] = relationship(
        back_populates="run",
    )


class ResearchRecommendation(Base):
    __tablename__ = "research_recommendations"
    __table_args__ = (
        UniqueConstraint(
            "subscription_id",
            "identity_key",
            name="uq_research_recommendations_subscription_identity",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("research_subscriptions.id", ondelete="CASCADE"),
        index=True,
    )
    run_id: Mapped[int | None] = mapped_column(
        ForeignKey("research_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source: Mapped[str] = mapped_column(String(80))
    external_id: Mapped[str] = mapped_column(String(500))
    identity_key: Mapped[str] = mapped_column(String(600))
    paper_snapshot_json: Mapped[str] = mapped_column(Text)
    relevance_score: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    subscription: Mapped[ResearchSubscription] = relationship(
        back_populates="recommendations",
    )
    run: Mapped[ResearchRun | None] = relationship(back_populates="recommendations")


class ResearchNotification(Base):
    __tablename__ = "research_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("research_subscriptions.id", ondelete="CASCADE"),
        index=True,
    )
    run_id: Mapped[int | None] = mapped_column(
        ForeignKey("research_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    kind: Mapped[str] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    subscription: Mapped[ResearchSubscription] = relationship(
        back_populates="notifications",
    )
    run: Mapped[ResearchRun | None] = relationship(back_populates="notifications")


class PaperGlossary(Base):
    __tablename__ = "paper_glossaries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    paper_id: Mapped[int] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), unique=True)
    response_json: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
