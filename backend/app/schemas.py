from __future__ import annotations

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    StrictInt,
    StrictStr,
    field_validator,
    model_validator,
)


KnownPaperSource = Literal[
    "openalex",
    "crossref",
    "arxiv",
    "semantic_scholar",
]


class ApiKeyStatus(BaseModel):
    configured: bool
    last4: str | None = None


class GlossaryTerm(BaseModel):
    term: str = Field(min_length=1, max_length=100)
    explanation: str = Field(min_length=1, max_length=80)


class GlossaryGenerateResponse(BaseModel):
    terms: list[GlossaryTerm]
    evidence_status: str
    provider: str
    model_name: str


class GlossaryHistoryTurn(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=150)


class GlossaryAskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    history: list[GlossaryHistoryTurn] = Field(default_factory=list, max_length=12)


class GlossaryAskResponse(BaseModel):
    question: str
    answer: str
    evidence_status: str
    provider: str
    model_name: str


class SettingsUpdate(BaseModel):
    model_provider: str = "mock"
    model_name: str = "mock-energy-research-v1"
    vision_model: str = Field(default="", max_length=200)
    model_base_url: str = ""
    api_key: str | None = Field(default=None, min_length=1)
    timeout_seconds: int = Field(default=60, ge=5, le=600)
    backup_model: str = ""
    paper_budget: float = Field(default=1.0, ge=0)
    daily_budget: float = Field(default=5.0, ge=0)
    monthly_budget: float = Field(default=50.0, ge=0)
    campus_ai_daily_limit: int = Field(default=20, ge=0)
    campus_ai_max_tokens: int = Field(default=2400, ge=128, le=32768)
    document_vision_provider: str = Field(default="mock", max_length=80)
    document_vision_model: str = Field(default="", max_length=200)
    document_vision_base_url: str = Field(default="", max_length=500)
    document_vision_timeout_seconds: int = Field(default=90, ge=5, le=600)
    document_vision_api_key: str | None = Field(default=None, min_length=1)


class SettingsResponse(BaseModel):
    model_provider: str
    model_name: str
    vision_model: str
    model_base_url: str
    api_key: ApiKeyStatus
    timeout_seconds: int
    backup_model: str
    paper_budget: float
    daily_budget: float
    monthly_budget: float
    campus_ai_daily_limit: int
    campus_ai_max_tokens: int
    onboarding_completed: bool
    document_vision_provider: str
    document_vision_model: str
    document_vision_base_url: str
    document_vision_timeout_seconds: int
    document_vision_api_key: ApiKeyStatus


class ModelListResponse(BaseModel):
    provider: str
    ok: bool
    models: list[str]
    message: str


class PaperResponse(BaseModel):
    id: int
    original_filename: str | None
    title: str
    file_hash: str | None
    file_size: int
    page_count: int
    extracted_text: str
    parse_confidence: float
    extraction_warning: str | None
    fulltext_status: str
    doi: str | None
    arxiv_id: str | None
    authors: list[str]
    abstract: str
    journal: str
    published_date: str | None
    keywords: list[str]
    landing_url: str
    pdf_url: str | None
    oa_status: str
    license: str | None
    source_type: str
    acquisition_status: str
    article_type: str
    is_favorite: bool
    is_read: bool
    active_parse_run_id: int | None
    ocr_available: bool
    knowledge_index_stale: bool
    created_at: datetime


class PaperCollectionCounts(BaseModel):
    all: int
    favorites: int
    read: int
    unread: int


class PaperPage(BaseModel):
    items: list[PaperResponse]
    total: int
    page: int
    page_size: int
    collection_counts: PaperCollectionCounts


class PaperDeleteResponse(BaseModel):
    deleted: bool
    paper_id: int
    file_deleted: bool
    warning: str | None = None


class PaperDeleteRequest(BaseModel):
    confirmation_title: str = Field(min_length=1, max_length=500)


class PaperStateUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_favorite: StrictBool
    is_read: StrictBool


class PaperVisualResponse(BaseModel):
    id: int
    paper_id: int
    page_number: int
    kind: Literal["figure", "table", "page"]
    label: str
    caption: str
    analysis_markdown: str
    evidence_status: str
    provider: str
    model_name: str
    created_at: datetime
    updated_at: datetime


class PaperVisualCropCreate(BaseModel):
    left: float = Field(ge=0, le=1)
    top: float = Field(ge=0, le=1)
    width: float = Field(gt=0, le=1)
    height: float = Field(gt=0, le=1)
    label: str = Field(default="", max_length=100)

    @model_validator(mode="after")
    def validate_bounds(self) -> "PaperVisualCropCreate":
        if self.left + self.width > 1 or self.top + self.height > 1:
            raise ValueError("裁切区域不能超出页面范围")
        return self


class FormulaTranscriptionResponse(BaseModel):
    crop_id: int
    paper_id: int
    page_number: int
    latex: str
    evidence_status: str
    model_name: str


class PaperVisualCropResponse(BaseModel):
    id: int
    paper_id: int
    visual_id: int
    page_number: int
    left: float
    top: float
    width: float
    height: float
    label: str
    analysis_markdown: str
    structured_data: dict[str, object]
    evidence_status: str
    provider: str
    model_name: str
    created_at: datetime
    updated_at: datetime


class SearchCandidateResponse(BaseModel):
    source: KnownPaperSource
    external_id: str


class SearchPaperResponse(BaseModel):
    source: KnownPaperSource
    external_id: str
    import_source: KnownPaperSource
    import_external_id: str
    already_imported: bool
    paper_id: int | None
    title: str
    authors: list[str]
    first_author: str
    abstract: str
    doi: str | None
    arxiv_id: str | None
    journal: str
    published_date: str | None
    year: int | None
    keywords: list[str]
    landing_url: str
    pdf_url: str | None
    is_open_access: bool
    oa_status: str
    license: str | None
    sources: list[KnownPaperSource]
    candidates: list[SearchCandidateResponse]
    relevance_score: float
    relevance_reasons: list[str]
    article_type: str
    citation_count: int
    is_favorite: bool
    is_read: bool


class SourceStatusResponse(BaseModel):
    source: KnownPaperSource
    enabled: bool
    ok: bool
    message: str
    result_count: int | None = None
    key_configured: bool | None = None


class PaperSearchResponse(BaseModel):
    items: list[SearchPaperResponse]
    total_before_pagination: int
    page: int
    page_size: int
    warnings: list[str]
    source_statuses: list[SourceStatusResponse]


class PaperImportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: KnownPaperSource
    external_id: str = Field(min_length=1, max_length=500)
    download_open_pdf: StrictBool = False


class DuplicateReasonResponse(BaseModel):
    kind: str
    paper_id: int


class PaperImportResponse(BaseModel):
    paper: PaperResponse
    created: bool
    duplicate_reason: DuplicateReasonResponse | None
    download_attempted: bool
    download_succeeded: bool
    warning: str | None


class NoteUpdate(BaseModel):
    content: str = Field(max_length=20000)


class KnowledgeStatusResponse(BaseModel):
    total_papers: int
    indexed_papers: int
    stale_papers: int
    chunk_count: int
    embedding_provider: str
    embedding_model: str
    ready: bool
    message: str


class KnowledgeReindexResponse(BaseModel):
    indexed_papers: int
    indexed_chunks: int
    skipped_papers: int
    embedding_provider: str
    embedding_model: str


class KnowledgeHistoryTurn(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    answer_markdown: str = Field(min_length=1, max_length=6000)


class KnowledgeAskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    max_citations: int = Field(default=6, ge=1, le=8)
    history: list[KnowledgeHistoryTurn] = Field(
        default_factory=list,
        max_length=4,
    )


class EvidenceBboxResponse(BaseModel):
    left: float
    top: float
    right: float
    bottom: float


class EvidenceLocationResponse(BaseModel):
    page_number: int
    element_id: str
    bbox: EvidenceBboxResponse
    coord_origin: Literal["TOPLEFT"]
    page_width: float
    page_height: float


class KnowledgeCitationResponse(BaseModel):
    chunk_id: int | None = None
    evidence_key: str | None = None
    citation_id: int
    paper_id: int
    paper_title: str
    page_number: int | None
    section: str
    excerpt: str
    source_scope: Literal["fulltext", "abstract", "note"]
    parse_confidence: float
    similarity: float
    source_locations: list[EvidenceLocationResponse] = Field(default_factory=list)


class KnowledgeConfidenceResponse(BaseModel):
    level: Literal["低", "中", "高"]
    explanation: str


class PaperNoteDraftRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    answer_markdown: str = Field(min_length=1, max_length=20000)
    citations: list[KnowledgeCitationResponse] = Field(min_length=1, max_length=8)
    kind: Literal["answer", "challenge"] = "answer"
    evidence_status: str = Field(default="AI推断（待核验）", max_length=160)


class PaperNoteDraftResponse(BaseModel):
    markdown: str


class ResearchChallengeResponse(BaseModel):
    questions: list[str]
    criteria: list[str]
    citations: list[KnowledgeCitationResponse]
    evidence_status: str


class KnowledgeAnswerResponse(BaseModel):
    question: str
    answer_markdown: str
    citations: list[KnowledgeCitationResponse]
    evidence_status: str
    confidence: KnowledgeConfidenceResponse
    provider: str
    model_name: str


class SavedConversationTurn(BaseModel):
    turn_index: int = Field(ge=1)
    question: str = Field(min_length=2, max_length=500)
    answer_markdown: str = Field(min_length=1, max_length=6000)
    citations: list[KnowledgeCitationResponse] = Field(default_factory=list, max_length=8)
    evidence_status: str = Field(min_length=1, max_length=160)
    confidence: KnowledgeConfidenceResponse
    provider: str = Field(min_length=1, max_length=80)
    model_name: str = Field(min_length=1, max_length=200)


class SavedConversationCreate(BaseModel):
    scope: Literal["library", "paper"]
    paper_id: int | None = Field(default=None, ge=1)
    title: str = Field(min_length=1, max_length=500)
    turns: list[SavedConversationTurn] = Field(min_length=1, max_length=100)


class SavedConversationSummary(BaseModel):
    id: int
    scope: Literal["library", "paper"]
    paper_id: int | None
    title: str
    created_at: datetime
    updated_at: datetime


class SavedConversationResponse(SavedConversationSummary):
    turns: list[SavedConversationTurn]


class SavedConversationListResponse(BaseModel):
    items: list[SavedConversationSummary]


class ClaimEvidenceResponse(BaseModel):
    chunk_id: int
    page_number: int | None
    section: str
    excerpt: str
    source_scope: Literal["fulltext", "abstract", "note"]
    parse_confidence: float
    similarity: float
    locator: str
    source_locations: list[EvidenceLocationResponse] = Field(default_factory=list)


class PaperClaimResponse(BaseModel):
    id: int
    paper_id: int
    claim_text: str
    claim_type: str
    evidence_status: str
    confidence: float
    evidence: list[ClaimEvidenceResponse]


class PaperClaimsResponse(BaseModel):
    items: list[PaperClaimResponse]


class PaperComparisonRequest(BaseModel):
    paper_ids: list[int] = Field(min_length=2, max_length=6)
    question: str = Field(
        default="比较研究问题、材料体系、实验条件、核心结果、机理解释和局限。",
        min_length=2,
        max_length=500,
    )


class ComparisonPaperResponse(BaseModel):
    paper_id: int
    title: str
    evidence_basis: str
    research_focus: str
    citation_count: int


class PaperComparisonResponse(BaseModel):
    question: str
    comparison_markdown: str
    papers: list[ComparisonPaperResponse]
    citations: list[KnowledgeCitationResponse]
    fairness_warnings: list[str]
    evidence_status: str
    confidence: KnowledgeConfidenceResponse
    provider: str
    model_name: str


class ExternalComparisonRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)


class ExternalComparisonCurrentPaperResponse(BaseModel):
    paper_id: int
    title: str
    evidence_basis: str


class ExternalComparisonPaperResponse(BaseModel):
    source: KnownPaperSource
    external_id: str
    title: str
    authors: list[str]
    abstract: str
    landing_url: str
    evidence_basis: str


class ExternalComparisonResponse(BaseModel):
    question: str
    current_paper: ExternalComparisonCurrentPaperResponse
    external_papers: list[ExternalComparisonPaperResponse]
    answer_markdown: str
    evidence_status: str
    provider: str
    model_name: str


class SavedComparisonCreate(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    comparison_markdown: str = Field(min_length=1, max_length=30000)
    papers: list[ComparisonPaperResponse] = Field(min_length=2, max_length=6)
    citations: list[KnowledgeCitationResponse] = Field(default_factory=list, max_length=48)
    fairness_warnings: list[str] = Field(default_factory=list, max_length=20)
    evidence_status: str = Field(min_length=1, max_length=160)
    confidence: KnowledgeConfidenceResponse
    provider: str = Field(min_length=1, max_length=80)
    model_name: str = Field(min_length=1, max_length=200)


class SavedComparisonSummary(BaseModel):
    id: int
    title: str
    paper_count: int
    created_at: datetime


class SavedComparisonResponse(SavedComparisonSummary):
    paper_ids: list[int]
    question: str
    comparison_markdown: str
    papers: list[ComparisonPaperResponse]
    citations: list[KnowledgeCitationResponse]
    fairness_warnings: list[str]
    evidence_status: str
    confidence: KnowledgeConfidenceResponse
    provider: str
    model_name: str


class SavedComparisonListResponse(BaseModel):
    items: list[SavedComparisonSummary]


class ResearchSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ResearchSubscriptionCreate(ResearchSchema):
    name: StrictStr = Field(min_length=1, max_length=200)
    query: StrictStr = Field(min_length=2, max_length=300)
    sources: list[KnownPaperSource] = Field(default_factory=list, max_length=4)
    year_from: StrictInt | None = Field(default=None, ge=1800)
    year_to: StrictInt | None = Field(default=None, ge=1800)
    open_access_only: StrictBool = False
    interval_hours: StrictInt = Field(default=168, ge=24, le=720)
    enabled: StrictBool = True

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("query must not be blank")
        return value

    @field_validator("year_from", "year_to")
    @classmethod
    def validate_year_limit(cls, value: int | None) -> int | None:
        if value is not None and value > date.today().year + 1:
            raise ValueError("year must not be later than next year")
        return value

    @model_validator(mode="after")
    def validate_year_range(self) -> "ResearchSubscriptionCreate":
        if (
            self.year_from is not None
            and self.year_to is not None
            and self.year_from > self.year_to
        ):
            raise ValueError("year_from must not be later than year_to")
        return self


class ResearchSubscriptionUpdate(ResearchSchema):
    name: StrictStr | None = Field(default=None, min_length=1, max_length=200)
    query: StrictStr | None = Field(default=None, min_length=2, max_length=300)
    sources: list[KnownPaperSource] | None = Field(default=None, max_length=4)
    year_from: StrictInt | None = Field(default=None, ge=1800)
    year_to: StrictInt | None = Field(default=None, ge=1800)
    open_access_only: StrictBool | None = None
    interval_hours: StrictInt | None = Field(default=None, ge=24, le=720)
    enabled: StrictBool | None = None

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("query must not be blank")
        return value

    @field_validator("year_from", "year_to")
    @classmethod
    def validate_year_limit(cls, value: int | None) -> int | None:
        if value is not None and value > date.today().year + 1:
            raise ValueError("year must not be later than next year")
        return value

    @model_validator(mode="after")
    def validate_year_range(self) -> "ResearchSubscriptionUpdate":
        if (
            self.year_from is not None
            and self.year_to is not None
            and self.year_from > self.year_to
        ):
            raise ValueError("year_from must not be later than year_to")
        return self


class ResearchSubscriptionDeleteRequest(ResearchSchema):
    confirmation_name: StrictStr = Field(min_length=1, max_length=200)


class ResearchSubscriptionResponse(ResearchSchema):
    id: int
    name: str
    query: str
    sources: list[KnownPaperSource]
    year_from: int | None
    year_to: int | None
    open_access_only: bool
    interval_hours: int
    enabled: bool
    last_started_at: datetime | None
    last_success_at: datetime | None
    next_run_at: datetime | None
    last_error: str | None
    created_at: datetime
    updated_at: datetime


class ResearchRunResponse(ResearchSchema):
    id: int
    subscription_id: int
    status: str
    started_at: datetime
    completed_at: datetime | None
    discovered_count: int
    recommended_count: int
    source_statuses: list[dict[str, object]]
    warnings: list[str]
    error: str | None


class ResearchRecommendationResponse(ResearchSchema):
    id: int
    subscription_id: int
    run_id: int | None
    source: str
    external_id: str
    identity_key: str
    paper_snapshot: dict[str, object]
    relevance_score: float
    created_at: datetime
    read_at: datetime | None


class ResearchNewsItem(ResearchSchema):
    title: str
    source: str
    url: str
    published_date: str | None
    summary: str


class ResearchNewsResponse(ResearchSchema):
    items: list[ResearchNewsItem]
    warnings: list[str]
    fetched_at: datetime


class ResearchReadingHighlightsRequest(ResearchSchema):
    recommendation_ids: list[Annotated[StrictInt, Field(ge=1)]] = Field(default_factory=list, max_length=5)
    news_urls: list[StrictStr] = Field(default_factory=list, max_length=5)

    @model_validator(mode="after")
    def limit_reading_items(self):
        if not 1 <= len(self.recommendation_ids) + len(self.news_urls) <= 5:
            raise ValueError("每次整理请选择 1–5 条内容")
        return self


class ResearchReadingHighlight(ResearchSchema):
    key: str
    title_zh: Annotated[StrictStr, Field(min_length=1, max_length=45)]
    points: list[Annotated[StrictStr, Field(min_length=1, max_length=65)]] = Field(min_length=3, max_length=3)


class ResearchReadingHighlightsResponse(ResearchSchema):
    items: list[ResearchReadingHighlight]


class ResearchNotificationResponse(ResearchSchema):
    id: int
    subscription_id: int
    run_id: int | None
    kind: str
    title: str
    body: str
    created_at: datetime
    read_at: datetime | None


class OnboardingComplete(BaseModel):
    study_mode: str = Field(default="科研助手", max_length=100)
    research_topics: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    daily_task_time: str = Field(default="08:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    daily_budget: float = Field(default=5.0, ge=0)
    monthly_budget: float = Field(default=50.0, ge=0)


class LearningPackCreate(BaseModel):
    title: StrictStr = Field(min_length=1, max_length=200)
    learning_goal: StrictStr = Field(default="", max_length=2000)
    paper_ids: list[int] = Field(min_length=1, max_length=5)

    @field_validator("paper_ids")
    @classmethod
    def unique_papers(cls, value: list[int]) -> list[int]:
        if len(set(value)) != len(value):
            raise ValueError("paper_ids must be unique")
        if any(item <= 0 for item in value):
            raise ValueError("paper_ids must be positive")
        return value


class LearningPackDeleteRequest(BaseModel):
    confirmation_title: StrictStr = Field(min_length=1, max_length=200)


class LearningCardUpdate(BaseModel):
    concept: StrictStr | None = Field(default=None, min_length=1, max_length=200)
    content: StrictStr | None = Field(default=None, min_length=1, max_length=12000)
    importance: StrictStr | None = Field(default=None, max_length=4000)
    common_mistake: StrictStr | None = Field(default=None, max_length=4000)

    @model_validator(mode="after")
    def require_change(self) -> "LearningCardUpdate":
        if all(getattr(self, name) is None for name in ("concept", "content", "importance", "common_mistake")):
            raise ValueError("at least one field is required")
        return self


class LearningMasteryUpdate(BaseModel):
    mastery_status: Literal["未学习", "学习中", "已掌握"]


class LearningReviewSubmit(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rating: Literal["不会", "模糊", "基本掌握", "已掌握"]


class LearningReviewUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    next_review_date: date | None = None
    is_paused: StrictBool | None = None

    @model_validator(mode="after")
    def require_change(self) -> "LearningReviewUpdate":
        if self.next_review_date is None and self.is_paused is None:
            raise ValueError("next_review_date or is_paused is required")
        return self


class LearningAttemptCreate(BaseModel):
    answer: StrictStr = Field(min_length=1, max_length=12000)


class LearningAttemptSelfRating(BaseModel):
    self_rating: Literal["答对", "部分答对", "答错"]


class LearningFeedbackRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    regenerate: StrictBool = False


class LearningWeaknessCreate(BaseModel):
    concept: StrictStr = Field(min_length=1, max_length=200)
    description: StrictStr = Field(default="", max_length=4000)
    card_id: int | None = Field(default=None, gt=0)


class LearningWeaknessUpdate(BaseModel):
    concept: StrictStr | None = Field(default=None, min_length=1, max_length=200)
    description: StrictStr | None = Field(default=None, max_length=4000)

    @model_validator(mode="after")
    def require_change(self) -> "LearningWeaknessUpdate":
        if self.concept is None and self.description is None:
            raise ValueError("at least one field is required")
        return self


class LearningPlanUpsert(BaseModel):
    start_date: date
    end_date: date
    weekdays: list[int] = Field(min_length=1, max_length=7)

    @field_validator("weekdays")
    @classmethod
    def valid_weekdays(cls, value: list[int]) -> list[int]:
        if len(set(value)) != len(value) or any(item < 1 or item > 7 for item in value):
            raise ValueError("weekdays must contain unique ISO values 1-7")
        return value

    @model_validator(mode="after")
    def valid_range(self) -> "LearningPlanUpsert":
        if self.start_date > self.end_date:
            raise ValueError("start_date must not be later than end_date")
        return self


class LearningPlanTaskUpdate(BaseModel):
    completed: StrictBool


class LearningOrderUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ids: list[int] = Field(min_length=1)

    @field_validator("ids")
    @classmethod
    def complete_unique_ids(cls, value: list[int]) -> list[int]:
        if any(item <= 0 for item in value) or len(set(value)) != len(value):
            raise ValueError("ids must contain unique positive values")
        return value


class LearningWeaknessTaskCreate(BaseModel):
    task_date: date


# --- Scientific analysis responses (Phase 6) ---


class ScientificRecipeResponse(BaseModel):
    key: str
    domain: str
    algorithm_version: str
    required_inputs: list[str]
    description: str


class ScientificQualityResponse(BaseModel):
    row_count: int
    column_count: int
    column_types: dict[str, str]
    missing_values: dict[str, int]
    range_values: dict[str, int]
    invalid_values: dict[str, int]
    reviewed: bool
    handling_policy: str


class ScientificDatasetResponse(BaseModel):
    id: int
    paper_id: int | None
    name: str
    import_id: int | None
    idea_id: int | None
    contest_project_id: int | None
    parse_run_id: int | None
    visual_id: int | None
    crop_id: int | None
    source_type: str
    domain: str
    dataset_type: str
    data: dict[str, object]
    units: dict[str, object]
    parameters: dict[str, object]
    confidence: float
    confirmation_status: Literal["pending", "confirmed"]
    is_stale: bool
    is_favorite: bool
    is_read: bool
    revision_count: int
    quality: ScientificQualityResponse


class ScientificDatasetStateUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_favorite: StrictBool
    is_read: StrictBool


class ScientificDatasetListResponse(BaseModel):
    items: list[ScientificDatasetResponse]


class ScientificAnalysisResponse(BaseModel):
    id: int
    dataset_id: int
    recipe: str
    algorithm_version: str
    parameters: dict[str, object]
    results: dict[str, object]
    diagnostics: dict[str, object]
    report_markdown: str
    status: str
    is_stale: bool
    error_message: str


# --- Document intelligence responses (Phase 6 OCR) ---


class DocumentAiLocalModelResponse(BaseModel):
    id: str
    version: str
    installed: bool
    status: str
    download_size_mb: float
    error: str | None


class DocumentAiCapabilitiesResponse(BaseModel):
    cpu: bool
    gpu: bool
    preferred_device: Literal["cpu", "gpu"]


class DocumentAiCurrentTaskResponse(BaseModel):
    type: str
    id: int
    paper_id: int
    progress: float


class DocumentAiStatusResponse(BaseModel):
    local_model: DocumentAiLocalModelResponse
    capabilities: DocumentAiCapabilitiesResponse
    current_task: DocumentAiCurrentTaskResponse | None


class OcrRunPageResponse(BaseModel):
    page_number: int
    source_type: Literal["native", "local_ocr", "cloud_vision"]
    confidence: float
    confirmation_status: str


class OcrRunResponse(BaseModel):
    id: int
    paper_id: int
    version_number: int
    mode: str
    status: Literal["queued", "running", "completed", "failed", "cancelled"]
    engine: str
    device: str
    progress: float
    quality_score: float
    derivative_file_path: str | None
    warnings: list[str]
    error_message: str
    pages: list[OcrRunPageResponse]


class OcrRunListResponse(BaseModel):
    items: list[OcrRunResponse]


class CloudEnhanceResponse(BaseModel):
    run_id: int
    page_number: int
    text: str
    confidence: float
    confirmation_status: str
    evidence_status: str


class DocumentAiInstallResponse(BaseModel):
    status: str


class OcrCancelResponse(BaseModel):
    id: int
    status: str


class ParserCapabilityResponse(BaseModel):
    installed: bool
    artifacts_available: bool
    ready: bool
    version: str
    reason: str


class DocumentParsersStatusResponse(BaseModel):
    docling: ParserCapabilityResponse


class ParseCandidatePageResponse(BaseModel):
    page_number: int
    source_type: Literal["docling"]
    confidence: float
    confirmation_status: str
    page_width: float | None
    page_height: float | None


class ParseCandidateResponse(BaseModel):
    id: int
    paper_id: int
    version_number: int
    mode: str
    status: Literal["queued", "running", "completed", "failed", "cancelled"]
    engine: Literal["docling"]
    engine_version: str
    device: str
    progress: float
    quality_score: float
    warnings: list[str]
    error_message: str
    pages: list[ParseCandidatePageResponse]


class ParseCandidateListResponse(BaseModel):
    items: list[ParseCandidateResponse]


class ParseComparisonMetricsResponse(BaseModel):
    engine: str
    characters: int
    pages: int
    tables: int
    formulas: int
    figures: int
    duration_seconds: float | None
    warnings: list[str]


class ParseCandidateComparisonResponse(BaseModel):
    run_id: int
    active: ParseComparisonMetricsResponse
    candidate: ParseComparisonMetricsResponse


# --- Learning system responses (Phase 5) ---


class LearningEvidenceResponse(BaseModel):
    evidence_id: str
    paper_id: int
    paper_title: str
    page_number: int | None
    section: str
    excerpt: str
    source_scope: str


class LearningReviewStateResponse(BaseModel):
    id: int
    pack_id: int
    card_id: int
    last_rating: Literal["不会", "模糊", "基本掌握", "已掌握"]
    next_review_date: date | None
    review_count: int
    lapse_count: int
    is_paused: bool
    last_reviewed_at: datetime | None


class LearningCardResponse(BaseModel):
    id: int
    pack_id: int | None
    concept: str
    generated_content: str
    content: str
    importance: str
    common_mistake: str
    evidence: list[LearningEvidenceResponse]
    is_user_edited: bool
    mastery_status: Literal["未学习", "学习中", "已掌握"]
    mastery_confirmed_at: datetime | None
    position: int
    review_state: LearningReviewStateResponse | None


class LearningCardListResponse(BaseModel):
    items: list[LearningCardResponse]


class LearningCardGenerateResponse(BaseModel):
    cards: list[LearningCardResponse]
    status: str


class LearningAttemptResponse(BaseModel):
    id: int
    question_id: int
    answer: str
    result: Literal["correct", "partial", "wrong", "pending_self_review"]
    self_rating: str | None
    correct_answer: str | None = None
    explanation: str | None = None
    reference_points: list[str] | None = None
    feedback_markdown: str | None = None
    feedback_provider: str | None = None
    feedback_model_name: str | None = None
    feedback_prompt_version: str | None = None
    feedback_evidence_status: str | None = None
    feedback_generated_at: datetime | None = None
    created_at: datetime | None = None


class LearningQuestionResponse(BaseModel):
    id: int
    pack_id: int
    question_type: Literal["multiple_choice", "true_false", "fill_blank", "short_answer"]
    prompt: str
    options: list[str]
    related_card_ids: list[int]
    evidence: list[LearningEvidenceResponse]
    position: int
    attempts: list[LearningAttemptResponse]


class LearningQuestionListResponse(BaseModel):
    items: list[LearningQuestionResponse]


class LearningQuizGenerateResponse(BaseModel):
    questions: list[LearningQuestionResponse]
    status: str


class LearningWeaknessResponse(BaseModel):
    id: int
    pack_id: int
    card_id: int | None
    concept: str
    description: str
    source: Literal["manual", "quiz"]
    occurrence_count: int
    recurrence_count: int
    is_resolved: bool
    resolved_at: datetime | None


class LearningWeaknessListResponse(BaseModel):
    items: list[LearningWeaknessResponse]


class LearningPlanTaskResponse(BaseModel):
    id: int
    pack_id: int
    task_date: date
    task_type: Literal["card", "quiz", "weakness"]
    card_id: int | None = None
    question_id: int | None = None
    weakness_id: int | None = None
    title: str
    position: int | None = None
    completed_at: datetime | None = None


class LearningPlanTaskListResponse(BaseModel):
    items: list[LearningPlanTaskResponse]


class LearningPlanResponse(BaseModel):
    id: int
    pack_id: int
    start_date: date
    end_date: date
    weekdays: list[int]
    tasks: list[LearningPlanTaskResponse]


class LearningPackSourceResponse(BaseModel):
    id: int
    paper_id: int | None
    paper_title: str
    available_reports: list[str]
    analysis_versions: dict[str, object]
    analysis_hash: str | None = None
    evidence_scope: str | None = None
    source_has_newer_analysis: bool


class LearningPackResponse(BaseModel):
    id: int
    title: str
    learning_goal: str
    cards_status: str
    quiz_status: str
    cards_prompt_version: str
    cards_schema_version: str
    quiz_prompt_version: str
    quiz_schema_version: str
    provider: str
    model_name: str
    lineage_id: str
    version_number: int
    lifecycle_status: Literal["active", "draft", "archived"]
    archived_at: datetime | None
    last_error: str | None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    source_count: int
    card_count: int
    question_count: int
    sources: list[LearningPackSourceResponse] | None = None
    cards: list[LearningCardResponse] | None = None
    questions: list[LearningQuestionResponse] | None = None
    weaknesses: list[LearningWeaknessResponse] | None = None
    plan: LearningPlanResponse | None = None


class LearningPackListResponse(BaseModel):
    items: list[LearningPackResponse]


class LearningReviewItemResponse(BaseModel):
    state: LearningReviewStateResponse
    pack_title: str
    overdue_days: int
    card: LearningCardResponse


class LearningReviewQueueResponse(BaseModel):
    today: date
    items: list[LearningReviewItemResponse]


class LearningReviewSubmitResponse(BaseModel):
    state: LearningReviewStateResponse
    card: LearningCardResponse


class LearningEligiblePaperResponse(BaseModel):
    id: int
    title: str
    journal: str
    published_date: str | None
    available_reports: list[str]


class LearningEligiblePaperListResponse(BaseModel):
    items: list[LearningEligiblePaperResponse]


class LearningPaperCandidateResponse(LearningEligiblePaperResponse):
    eligible: bool
    is_read: bool
    fulltext_available: bool
    blocking_reasons: list[str]


class LearningPaperCandidateListResponse(BaseModel):
    items: list[LearningPaperCandidateResponse]


class LearningOverviewResponse(BaseModel):
    packs: list[LearningPackResponse]
    today_tasks: list[LearningPlanTaskResponse]
    open_weaknesses: list[LearningWeaknessResponse]
    due_reviews: list[LearningReviewItemResponse]
    due_review_count: int


class LearningAnalyticsDailyResponse(BaseModel):
    date: date
    reviews: int
    attempts: int
    completed_tasks: int


class LearningAnalyticsWeaknessResponse(BaseModel):
    concept: str
    score: float
    pack_count: int
    occurrence_count: int
    recurrence_count: int


class LearningAnalyticsResponse(BaseModel):
    days: Literal[7, 30, 90]
    from_date: date
    to_date: date
    history_start_date: date | None
    daily: list[LearningAnalyticsDailyResponse]
    rating_distribution: dict[str, int]
    correct_rate: float | None
    mastery_distribution: dict[str, int]
    due_review_count: int
    weaknesses: list[LearningAnalyticsWeaknessResponse]


class LearningDiffResponse(BaseModel):
    added: list[str]
    removed: list[str]
    changed: list[str]


class LearningPackComparisonResponse(BaseModel):
    left_pack_id: int
    right_pack_id: int
    source_changes: LearningDiffResponse
    cards: LearningDiffResponse
    questions: LearningDiffResponse


class LearningFeedbackResponse(BaseModel):
    feedback_markdown: str
    provider: str
    model_name: str
    evidence_status: str
    prompt_version: str
    schema_version: str


# --- Paper detail composite response ---


class AnalysisReportPayload(BaseModel):
    quick_understanding: str
    quick_prompt_version: str
    quick_schema_version: str
    quick_evidence_status: str
    layman_understanding: str
    layman_prompt_version: str
    layman_schema_version: str
    layman_evidence_status: str
    reviewer_analysis: str
    reviewer_prompt_version: str
    reviewer_schema_version: str
    reviewer_evidence_status: str


class PaperDetailResponse(BaseModel):
    paper: PaperResponse
    analysis: AnalysisReportPayload | None
    note: str


# --- Phase 5G contest workspace ---


class ContestProjectResponse(BaseModel):
    id: int
    title: str
    competition_name: str
    summary: str
    research_question: str
    innovation: str
    method: str
    evidence: str
    feasibility: str
    expected_outcomes: str
    risks: str
    resources: str
    created_at: datetime
    updated_at: datetime


class ContestProjectListResponse(BaseModel):
    items: list[ContestProjectResponse]


class ContestSourceResponse(BaseModel):
    id: int
    project_id: int
    name: str
    source_type: Literal["pdf", "text", "image", "csv"]
    sha256: str
    status: str
    locator_count: int
    created_at: datetime


class ContestRuleResponse(BaseModel):
    id: int
    title: str
    description: str
    deadline: date | None
    citations: list[str]
    status: Literal["draft", "confirmed"]


class ContestRubricItemResponse(BaseModel):
    id: int
    title: str
    description: str
    weight: float | None
    citations: list[str]
    status: Literal["draft", "confirmed"]


class ContestRuleSetResponse(BaseModel):
    status: Literal["draft", "confirmed"]
    rules: list[ContestRuleResponse]
    rubric_items: list[ContestRubricItemResponse]


class ContestMilestoneResponse(BaseModel):
    id: int
    title: str
    due_date: date
    source: Literal["manual", "confirmed_rule"]
    completed: bool


class ContestTimelineResponse(BaseModel):
    items: list[ContestMilestoneResponse]


class ContestRubricCheckItemResponse(BaseModel):
    id: int
    rubric_item_id: int
    title: str
    status: Literal["satisfied", "partial", "missing"]
    evidence: list[str]
    questions: list[str]


class ContestRubricCheckResponse(BaseModel):
    items: list[ContestRubricCheckItemResponse]


class ContestDefenseSessionResponse(BaseModel):
    id: int
    project_id: int
    mode: Literal["text", "voice"]
    created_at: datetime


class ContestDefenseTurnResponse(BaseModel):
    id: int
    session_id: int
    question: str
    answer: str
    feedback: str
    transcript: str
    created_at: datetime


# --- Phase 6B research assistance ---


class ScientificImportResponse(BaseModel):
    id: int
    original_filename: str
    sha256: str
    file_format: Literal["csv", "xlsx"]
    available_sheets: list[str]
    selected_sheet: str | None
    row_count: int
    column_count: int
    column_types: dict[str, str]
    missing_values: dict[str, int]
    range_values: dict[str, int] = Field(default_factory=dict)
    invalid_values: dict[str, int] = Field(default_factory=dict)
    preview: list[list[object | None]]
    status: Literal["preview", "confirmed"]
    created_at: datetime


class ResearchIdeaResponse(BaseModel):
    id: int
    title: str
    source_mode: Literal["user", "selected_evidence"]
    selected_paper_ids: list[int]
    selected_dataset_ids: list[int]
    hypothesis: str
    evidence: str
    novelty: str
    falsification: str
    feasibility: str
    resources: str
    evidence_gaps: str
    ai_review: str
    created_at: datetime
    updated_at: datetime


class ExperimentDesignResponse(BaseModel):
    id: int
    idea_id: int | None
    contest_project_id: int | None
    title: str
    variables: str
    controls: str
    replication: str
    randomization: str
    measurement: str
    statistics: str
    stopping_criteria: str
    resources: str
    risks: str
    deterministic_findings: list[dict[str, str]]
    ai_review: str
    created_at: datetime
    updated_at: datetime


class ResearchExportResponse(BaseModel):
    id: int
    title: str
    export_type: Literal["markdown", "docx", "pptx"]
    selected_paper_ids: list[int]
    selected_dataset_ids: list[int]
    selected_analysis_ids: list[int]
    markdown: str
    status: str
    download_available: bool
    created_at: datetime


class TaskRunResponse(BaseModel):
    id: int
    task_name: str
    status: Literal["queued", "running", "completed", "failed", "cancelled", "interrupted"]
    detail: str
    resource_type: str | None
    resource_id: int | None
    queue_job_id: str | None
    progress: float
    attempt_count: int
    max_attempts: int
    error_code: str
    cancel_requested: bool
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class BackupResponse(BaseModel):
    name: str
    created_at: datetime
    size_bytes: int
    sha256: str
    file_count: int


class BackupDeleteResponse(BaseModel):
    deleted_name: str
    remaining_count: int


class StorageStatsResponse(BaseModel):
    managed_bytes: int
    managed_files: int
    backup_bytes: int
    backup_count: int
    cache_bytes: int
    cache_files: int


class CleanupPreviewResponse(BaseModel):
    token: str
    paths: list[str]
    bytes_reclaimable: int
