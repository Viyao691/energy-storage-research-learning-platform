import type { ApiSchemas } from "./api.generated";
export type FormulaTranscription = ApiSchemas["FormulaTranscriptionResponse"];
export type PaperNoteDraftRequest = ApiSchemas["PaperNoteDraftRequest"];
export type ResearchChallenge = ApiSchemas["ResearchChallengeResponse"];

// Response types below are generated from the backend OpenAPI schema
// (backend/openapi.json <- backend/scripts/export_openapi.py) and re-exported
// here.  Run `npm run generate:types` after backend schema changes.
// `Partial` keeps the previous permissive shape so consumers keep compiling;
// fields are still single-sourced from ApiSchemas.

export type Settings = Partial<ApiSchemas["SettingsResponse"]>;
export type ModelOptions = ApiSchemas["ModelListResponse"];
export type Paper = Omit<ApiSchemas["PaperResponse"], "id" | "authors"> & {
  id: string;
  availability?: string;
  authors?: string | string[];
};
export type DocumentAiStatus = ApiSchemas["DocumentAiStatusResponse"];
export type OcrRun = ApiSchemas["OcrRunResponse"];
export type EvidenceLocation = import("./evidenceBbox").EvidenceLocation;
export type DocumentParsersStatus = {
  docling: {
    installed: boolean;
    artifacts_available: boolean;
    ready: boolean;
    version: string;
    reason: string;
  };
};
export type ParseCandidate = {
  id: number;
  paper_id: number;
  version_number: number;
  mode: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  engine: "docling";
  engine_version: string;
  device: string;
  progress: number;
  quality_score: number;
  warnings: string[];
  error_message: string;
  pages: Array<{
    page_number: number;
    source_type: "docling";
    confidence: number;
    confirmation_status: string;
    page_width: number | null;
    page_height: number | null;
  }>;
};
export type ParseComparisonMetrics = {
  engine: string;
  characters: number;
  pages: number;
  tables: number;
  formulas: number;
  figures: number;
  duration_seconds: number | null;
  warnings: string[];
};
export type ParseCandidateComparison = {
  run_id: number;
  active: ParseComparisonMetrics;
  candidate: ParseComparisonMetrics;
};
export type ScientificDataset = ApiSchemas["ScientificDatasetResponse"];
export type ScientificRecipe = ApiSchemas["ScientificRecipeResponse"];
export type ScientificAnalysis = ApiSchemas["ScientificAnalysisResponse"];
export type Analysis = ApiSchemas["AnalysisReportPayload"];
export type GlossaryGenerate = ApiSchemas["GlossaryGenerateResponse"];
export type GlossaryAsk = ApiSchemas["GlossaryAskResponse"];
export type GlossaryHistoryTurn = ApiSchemas["GlossaryHistoryTurn"];
export type AnalysisReportType = ApiSchemas["AnalysisReportType"];
export type AnalysisReportResponse = {
  report_type: AnalysisReportType;
  quick_understanding?: string;
  layman_understanding?: string;
  reviewer_analysis?: string;
  prompt_version: string;
  schema_version: string;
  evidence_status: string;
};
export type PaperDetail = Omit<ApiSchemas["PaperDetailResponse"], "paper"> & {
  paper: Paper;
};
export type LearningEvidence = ApiSchemas["LearningEvidenceResponse"];
export type LearningReviewRating = ApiSchemas["LearningReviewStateResponse"]["last_rating"];
export type LearningReviewState = ApiSchemas["LearningReviewStateResponse"];
export type LearningCard = ApiSchemas["LearningCardResponse"];
export type LearningReviewItem = ApiSchemas["LearningReviewItemResponse"];
export type LearningReviewQueue = ApiSchemas["LearningReviewQueueResponse"];
export type LearningAttempt = ApiSchemas["LearningAttemptResponse"];
export type LearningQuestion = ApiSchemas["LearningQuestionResponse"];
export type LearningWeakness = ApiSchemas["LearningWeaknessResponse"];
export type LearningPlanTask = ApiSchemas["LearningPlanTaskResponse"];
export type LearningPlan = ApiSchemas["LearningPlanResponse"];
export type LearningLifecycleStatus = ApiSchemas["LearningPackResponse"]["lifecycle_status"];
export type LearningPack = ApiSchemas["LearningPackResponse"];
export type ContestProject = ApiSchemas["ContestProjectResponse"];
export type ContestSource = ApiSchemas["ContestSourceResponse"];
export type ContestRuleSet = ApiSchemas["ContestRuleSetResponse"];
export type ContestTimeline = ApiSchemas["ContestTimelineResponse"];
export type ContestRubricCheck = ApiSchemas["ContestRubricCheckResponse"];
export type ContestDefenseSession = ApiSchemas["ContestDefenseSessionResponse"];
export type ContestDefenseTurn = ApiSchemas["ContestDefenseTurnResponse"];
export type CampusSource = ApiSchemas["CampusSourceResponse"];
export type CampusEvent = ApiSchemas["CampusEventResponse"];
export type CampusNotice = ApiSchemas["CampusNoticeResponse"];
export type CampusPublicLink = ApiSchemas["CampusPublicLinkResponse"];
export type CampusPublicLinkList = ApiSchemas["CampusPublicLinkList"];
export type CampusSourceList = ApiSchemas["CampusSourceList"];
export type CampusEventList = ApiSchemas["CampusEventList"];
export type CampusNoticeList = ApiSchemas["CampusNoticeList"];
export type ScientificImport = ApiSchemas["ScientificImportResponse"];
export type ResearchIdea = ApiSchemas["ResearchIdeaResponse"];
export type ExperimentDesign = ApiSchemas["ExperimentDesignResponse"];
export type ResearchExport = ApiSchemas["ResearchExportResponse"];
export type Backup = ApiSchemas["BackupResponse"];
export type StorageStats = ApiSchemas["StorageStatsResponse"];
export type CleanupPreview = ApiSchemas["CleanupPreviewResponse"];
export type LearningAnalytics = ApiSchemas["LearningAnalyticsResponse"];
export type LearningPackComparison = ApiSchemas["LearningPackComparisonResponse"];
export type EligibleLearningPaper = ApiSchemas["LearningEligiblePaperResponse"];
export type LearningPaperCandidate = ApiSchemas["LearningPaperCandidateResponse"];
export type PaperList = Omit<ApiSchemas["PaperPage"], "items"> & { items: Paper[] };
export type PaperCollection = "all" | "favorites" | "read" | "unread";
export type PaperVisual = ApiSchemas["PaperVisualResponse"];
export type PaperVisualCrop = Omit<ApiSchemas["PaperVisualCropResponse"], "structured_data"> & {
  structured_data?: StructuredVisualData;
};
export type StructuredVisualData = {
  chart_type: string;
  x_axis: { label: string; unit: string };
  y_axis: { label: string; unit: string };
  series: { name: string; points: { x: string; y: string }[] }[];
  limitations: string[];
};
export type ExternalComparison = ApiSchemas["ExternalComparisonResponse"];
export type PaperDeleteResponse = ApiSchemas["PaperDeleteResponse"];
export type KnowledgeStatus = ApiSchemas["KnowledgeStatusResponse"];
export type KnowledgeReindexResult = ApiSchemas["KnowledgeReindexResponse"];
export type KnowledgeCitation = ApiSchemas["KnowledgeCitationResponse"] & {
  source_locations?: EvidenceLocation[];
};
export type ClaimEvidence = ApiSchemas["ClaimEvidenceResponse"] & {
  source_locations?: EvidenceLocation[];
};
export type PaperClaim = Omit<ApiSchemas["PaperClaimResponse"], "evidence"> & {
  evidence: ClaimEvidence[];
};
export type PaperComparison = ApiSchemas["PaperComparisonResponse"];
export type KnowledgeAnswer = Omit<ApiSchemas["KnowledgeAnswerResponse"], "citations"> & {
  citations: KnowledgeCitation[];
};
export type KnowledgeHistoryTurn = ApiSchemas["KnowledgeHistoryTurn"];
export type SavedConversation = {
  id: number;
  scope: "library" | "paper";
  paper_id: number | null;
  title: string;
  created_at: string;
  updated_at: string;
  turns: Array<KnowledgeAnswer & { turn_index: number }>;
};
export type SavedConversationSummary = Omit<SavedConversation, "turns">;
export type SavedComparison = PaperComparison & {
  id: number;
  title: string;
  paper_count: number;
  paper_ids: number[];
  created_at: string;
};
export type SavedComparisonSummary = Pick<SavedComparison, "id" | "title" | "paper_count" | "created_at">;
export type DiagnosticStatus = { status?: string; message?: string };
export type PaperSource = "openalex" | "crossref" | "arxiv" | "semantic_scholar";
export type SearchCandidate = { source: PaperSource; external_id: string };
export type SourceStatus = ApiSchemas["SourceStatusResponse"] & {
  source: PaperSource;
};
export type AcademicDiagnosticStatus = DiagnosticStatus & {
  sources?: SourceStatus[];
};
export type Diagnostics = {
  frontend: DiagnosticStatus;
  backend: DiagnosticStatus;
  database: DiagnosticStatus;
  model_api: DiagnosticStatus;
  academic_search: AcademicDiagnosticStatus;
  pdf_storage: DiagnosticStatus;
  scheduler: DiagnosticStatus;
  email: DiagnosticStatus;
  redis: DiagnosticStatus;
  worker: DiagnosticStatus;
  storage: DiagnosticStatus;
  backups: DiagnosticStatus;
};
export type SearchPaper = ApiSchemas["SearchPaperResponse"] & {
  source: PaperSource;
};
export type PaperSearchResponse = ApiSchemas["PaperSearchResponse"] & {
  items: SearchPaper[];
  source_statuses: SourceStatus[];
};
export type PaperSearchParams = {
  q: string;
  year_from?: number | string;
  year_to?: number | string;
  open_access_only: boolean;
  page: number;
  page_size: number;
  sources: PaperSource[];
};
export type ResearchSubscription = ApiSchemas["ResearchSubscriptionResponse"] & {
  id: number;
  name: string;
  query: string;
  sources: PaperSource[];
};
export type ResearchRun = ApiSchemas["ResearchRunResponse"];
export type ResearchNotification = ApiSchemas["ResearchNotificationResponse"];
export type ResearchRecommendation = ApiSchemas["ResearchRecommendationResponse"];
export type ResearchPage<T> = { items: T[]; total: number; page: number; page_size: number };
export type ImportedPaper = Omit<ApiSchemas["PaperResponse"], "id"> & {
  id: number;
  original_filename: string | null;
  title: string;
  file_hash: string | null;
  file_size: number;
  page_count: number;
  extracted_text: string;
  parse_confidence: number;
  extraction_warning: string | null;
  fulltext_status: string;
  doi: string | null;
  arxiv_id: string | null;
  authors: string[];
  abstract: string;
  journal: string;
  published_date: string | null;
  keywords: string[];
  landing_url: string;
  pdf_url: string | null;
  oa_status: string;
  license: string | null;
  source_type: string;
  acquisition_status: string;
  article_type: string;
  is_favorite: boolean;
  is_read: boolean;
  created_at: string;
};
export type PaperImportRequest = ApiSchemas["PaperImportRequest"];
export type PaperImportResponse = ApiSchemas["PaperImportResponse"] & {
  paper: ImportedPaper;
  created: boolean;
  download_attempted: boolean;
  download_succeeded: boolean;
  warning: string | null;
};
const BASE = "/backend-api/api/v1";

export function errorDetail(body: { detail?: unknown }, status: number): string {
  if (typeof body.detail === "string") return body.detail;
  if (body.detail && typeof body.detail === "object" && "message" in body.detail && typeof body.detail.message === "string") return body.detail.message;
  return `请求失败（${status}）`;
}

async function request<T>(path: string, init?: RequestInit, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { ...init, headers: { ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init?.headers }, cache: "no-store", signal: signal ?? init?.signal });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(errorDetail(body, response.status)); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function buildPaperSearchQuery(params: PaperSearchParams): string {
  const query = new URLSearchParams();
  query.set("q", params.q.trim().replace(/\s+/g, " "));
  if (params.year_from !== undefined && params.year_from !== "") query.set("year_from", String(params.year_from));
  if (params.year_to !== undefined && params.year_to !== "") query.set("year_to", String(params.year_to));
  query.set("open_access_only", String(params.open_access_only));
  query.set("page", String(params.page));
  query.set("page_size", String(params.page_size));
  params.sources.forEach(source => query.append("sources", source));
  return query.toString();
}

export const api = {
  health: (signal?: AbortSignal) => fetch("/backend-api/health", { cache: "no-store", signal }).then(async response => {
    if (!response.ok) throw new Error(`健康检查失败（${response.status}）`);
    return response.json();
  }),
  settings: () => request<Settings>("/settings"),
  saveSettings: (settings: Record<string, unknown>) => request<Settings>("/settings", { method: "POST", body: JSON.stringify(settings) }),
  testModel: () => request<{ ok?: boolean; message?: string }>("/settings/test-model", { method: "POST" }),
  modelOptions: () => request<ModelOptions>("/settings/models"),
  diagnostics: (signal?: AbortSignal) => request<Diagnostics>("/diagnostics", undefined, signal),
  papers: (params?: { page?: number; page_size?: number; collection?: PaperCollection }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.page_size !== undefined) query.set("page_size", String(params.page_size));
    if (params?.collection !== undefined) query.set("collection", params.collection);
    return request<PaperList>(`/papers${query.size ? `?${query}` : ""}`);
  },
  listContests: () => request<{ items: ContestProject[] }>("/contests"),
  listCampusSources: () => request<CampusSourceList>("/campus/sources"),
  activateCampus: () => request<CampusSourceList>("/campus/activate", { method: "POST" }),
  updateCampusSource: (id: number, payload: { enabled: boolean }) => request<CampusSource>(`/campus/sources/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  listCampusEvents: (params: { offset: number; limit: number; scope: "recent" | "unknown" | "archive"; days: number; category: string; subtype: string; followed: boolean }) => {
    const query = new URLSearchParams({ offset: String(params.offset), limit: String(params.limit), scope: params.scope, days: String(params.days), followed: String(params.followed) });
    if (params.category) query.set("category", params.category);
    if (params.subtype) query.set("subtype", params.subtype);
    return request<CampusEventList>(`/campus/events?${query.toString()}`);
  },
  updateCampusEvent: (id: number, payload: { followed: boolean }) => request<CampusEvent>(`/campus/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  listCampusNotices: () => request<CampusNoticeList>("/campus/notices"),
  listCampusPublicLinks: (params: { offset: number; limit: number; scope: "recent" | "unknown" | "archive"; days: number }) => {
    const query = new URLSearchParams({ offset: String(params.offset), limit: String(params.limit), scope: params.scope, days: String(params.days) });
    return request<CampusPublicLinkList>(`/campus/public-links?${query.toString()}`);
  },
  markCampusNoticeRead: (id: number) => request<CampusNotice>(`/campus/notices/${id}/read`, { method: "POST" }),
  createContest: (payload: { title: string; competition_name: string }) => request<ContestProject>("/contests", { method: "POST", body: JSON.stringify(payload) }),
  contest: (id: number) => request<ContestProject>(`/contests/${id}`),
  updateContest: (id: number, payload: Partial<ContestProject>) => request<ContestProject>(`/contests/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  contestSources: (id: number) => request<ContestSource[]>(`/contests/${id}/sources`),
  addContestTextSource: (id: number, payload: { name: string; source_type: "text"; content: string }) => request<ContestSource>(`/contests/${id}/sources/text`, { method: "POST", body: JSON.stringify(payload) }),
  uploadContestSource: (id: number, file: File) => { const form = new FormData(); form.append("file", file); return request<ContestSource>(`/contests/${id}/sources/upload`, { method: "POST", body: form }); },
  ocrContestSource: (sourceId: number) => request<ContestSource>(`/contest-sources/${sourceId}/ocr`, { method: "POST" }),
  contestRules: (id: number) => request<ContestRuleSet>(`/contests/${id}/rules`),
  parseContestRules: (id: number) => request<ContestRuleSet>(`/contests/${id}/rules/parse`, { method: "POST" }),
  confirmContestRules: (id: number) => request<ContestRuleSet>(`/contests/${id}/rules/confirm`, { method: "POST", body: JSON.stringify({ confirmed: true }) }),
  createContestMilestone: (id: number, payload: { title: string; due_date: string }) => request<ApiSchemas["ContestMilestoneResponse"]>(`/contests/${id}/milestones`, { method: "POST", body: JSON.stringify(payload) }),
  generateContestTimeline: (id: number) => request<ContestTimeline>(`/contests/${id}/timeline/generate`, { method: "POST" }),
  checkContestRubric: (id: number) => request<ContestRubricCheck>(`/contests/${id}/rubric/check`, { method: "POST" }),
  createDefenseSession: (id: number, mode: "text" | "voice") => request<ContestDefenseSession>(`/contests/${id}/defense-sessions`, { method: "POST", body: JSON.stringify({ mode }) }),
  createDefenseTurn: (sessionId: number, answer: string) => request<ContestDefenseTurn>(`/contest-defense-sessions/${sessionId}/turns`, { method: "POST", body: JSON.stringify({ answer }) }),
  createAudioDefenseTurn: (sessionId: number, file: File) => { const form = new FormData(); form.append("file", file); return request<ContestDefenseTurn>(`/contest-defense-sessions/${sessionId}/audio`, { method: "POST", body: form }); },
  scientificImports: () => request<ScientificImport[]>("/scientific-imports"),
  scientificImport: (id: number, selectedSheet?: string) => request<ScientificImport>(`/scientific-imports/${id}${selectedSheet ? `?${new URLSearchParams({ selected_sheet: selectedSheet })}` : ""}`),
  uploadScientificImport: (file: File) => { const form = new FormData(); form.append("file", file); return request<ScientificImport>("/scientific-imports", { method: "POST", body: form }); },
  confirmScientificImport: (id: number, payload: Record<string, unknown>) => request<ScientificDataset>(`/scientific-imports/${id}/confirm`, { method: "POST", body: JSON.stringify(payload) }),
  allScientificDatasets: () => request<{ items: ScientificDataset[] }>("/scientific-datasets"),
  scientificDataset: (id: number) => request<ScientificDataset>(`/scientific-datasets/${id}`),
  scientificDatasetAnalyses: (id: number) => request<ScientificAnalysis[]>(`/scientific-datasets/${id}/analyses`),
  updateScientificDatasetState: (id: number, state: { is_favorite: boolean; is_read: boolean }) =>
    request<ScientificDataset>(`/scientific-datasets/${id}/state`, { method: "PATCH", body: JSON.stringify(state) }),
  researchIdeas: () => request<ResearchIdea[]>("/research-ideas"),
  updateResearchIdea: (id: number, payload: Record<string, unknown>) => request<ResearchIdea>(`/research-ideas/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  createResearchIdea: (payload: Record<string, unknown>) => request<ResearchIdea>("/research-ideas", { method: "POST", body: JSON.stringify(payload) }),
  generateResearchIdea: (paperIds: number[], datasetIds: number[]) => request<ResearchIdea>("/research-ideas/generate", { method: "POST", body: JSON.stringify({ paper_ids: paperIds, dataset_ids: datasetIds }) }),
  createExperimentDesign: (payload: Record<string, unknown>) => request<ExperimentDesign>("/experiment-designs", { method: "POST", body: JSON.stringify(payload) }),
  experimentDesigns: (ideaId: number) => request<ExperimentDesign[]>(`/experiment-designs?${new URLSearchParams({ idea_id: String(ideaId) })}`),
  experimentDesign: (id: number) => request<ExperimentDesign>(`/experiment-designs/${id}`),
  updateExperimentDesign: (id: number, payload: Record<string, unknown>) => request<ExperimentDesign>(`/experiment-designs/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  reviewExperimentDesign: (id: number) => request<ExperimentDesign>(`/experiment-designs/${id}/review`, { method: "POST" }),
  createResearchExport: (payload: Record<string, unknown>) => request<ResearchExport>("/research-exports", { method: "POST", body: JSON.stringify(payload) }),
  researchExportUrl: (id: number) => `${BASE}/research-exports/${id}/download`,
  storageStats: () => request<StorageStats>("/maintenance/storage"),
  backups: () => request<Backup[]>("/maintenance/backups"),
  createBackup: () => request<Backup>("/maintenance/backups", { method: "POST" }),
  deleteBackup: (name: string) => request<ApiSchemas["BackupDeleteResponse"]>(`/maintenance/backups/${encodeURIComponent(name)}`, { method: "DELETE" }),
  previewStorageCleanup: () => request<CleanupPreview>("/maintenance/storage/cleanup/preview", { method: "POST" }),
  confirmStorageCleanup: (token: string) => request<{ deleted_files: number; reclaimed_bytes: number }>("/maintenance/storage/cleanup/confirm", { method: "POST", body: JSON.stringify({ token }) }),
  updatePaperState: (id: string, state: { is_favorite: boolean; is_read: boolean }) =>
    request<Paper>(`/papers/${id}/state`, { method: "PATCH", body: JSON.stringify(state) }),
  paper: (id: string) => request<PaperDetail>(`/papers/${id}`),
  paperFileUrl: (id: string, variant: "original" | "ocr" = "original") => `${BASE}/papers/${id}/file?variant=${variant}`,
  documentAiStatus: () => request<DocumentAiStatus>("/document-ai/status"),
  installDocumentAi: () => request<{ status: string }>("/document-ai/models/install", { method: "POST", body: JSON.stringify({ confirmed: true }) }),
  createOcrRun: (id: string, mode: "auto" | "full") => request<OcrRun>(`/papers/${id}/ocr-runs`, { method: "POST", body: JSON.stringify({ mode }) }),
  paperOcrRuns: (id: string) => request<{ items: OcrRun[] }>(`/papers/${id}/ocr-runs`),
  ocrRun: (runId: number) => request<OcrRun>(`/ocr-runs/${runId}`),
  cancelOcrRun: (runId: number) => request<{ id: number; status: string }>(`/ocr-runs/${runId}/cancel`, { method: "POST" }),
  documentParsersStatus: () => request<DocumentParsersStatus>("/document-parsers/status"),
  createParseCandidate: (id: string) => request<ParseCandidate>(`/papers/${id}/parse-candidates`, { method: "POST", body: JSON.stringify({ confirmed: true }) }),
  paperParseCandidates: (id: string) => request<{ items: ParseCandidate[] }>(`/papers/${id}/parse-candidates`),
  parseCandidate: (runId: number) => request<ParseCandidate>(`/parse-candidates/${runId}`),
  parseCandidateComparison: (runId: number) => request<ParseCandidateComparison>(`/parse-candidates/${runId}/comparison`),
  cancelParseCandidate: (runId: number) => request<{ id: number; status: string }>(`/parse-candidates/${runId}/cancel`, { method: "POST" }),
  activateParseCandidate: (runId: number) => request<ParseCandidate>(`/parse-candidates/${runId}/activate`, { method: "POST", body: JSON.stringify({ confirmed: true }) }),
  cloudEnhancePage: (id: string, page: number) => request<Record<string, unknown>>(`/papers/${id}/pages/${page}/cloud-enhance`, { method: "POST", body: JSON.stringify({ confirmed: true }) }),
  scientificRecipes: () => request<ScientificRecipe[]>("/scientific-recipes"),
  scientificDatasets: (id: string) => request<{ items: ScientificDataset[] }>(`/papers/${id}/scientific-datasets`),
  createScientificDataset: (id: string, payload: Record<string, unknown>) => request<ScientificDataset>(`/papers/${id}/scientific-datasets`, { method: "POST", body: JSON.stringify(payload) }),
  updateScientificDataset: (datasetId: number, payload: Record<string, unknown>) => request<ScientificDataset>(`/scientific-datasets/${datasetId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  runScientificAnalysis: (datasetId: number, recipe: string, parameters: Record<string, unknown>) => request<ScientificAnalysis>(`/scientific-datasets/${datasetId}/analyses`, { method: "POST", body: JSON.stringify({ recipe, parameters }) }),
  scientificAnalysis: (analysisId: number) => request<ScientificAnalysis>(`/scientific-analyses/${analysisId}`),
  scientificExportUrl: (analysisId: number) => `${BASE}/scientific-analyses/${analysisId}/export`,
  visuals: (id: string) => request<PaperVisual[]>(`/papers/${id}/visuals`),
  analyzeVisual: (id: string, visualId: number) =>
    request<PaperVisual>(`/papers/${id}/visuals/${visualId}/analyze`, {
      method: "POST"
    }),
  askPaperKnowledge: (
    id: string,
    question: string,
    maxCitations = 6,
    history: KnowledgeHistoryTurn[] = []
  ) => request<KnowledgeAnswer>(`/papers/${id}/knowledge/ask`, {
    method: "POST",
    body: JSON.stringify({ question, max_citations: maxCitations, history: history.slice(-4) })
  }),
  paperGlossary: (id: string, signal?: AbortSignal) =>
    request<GlossaryGenerate | null>(`/papers/${id}/glossary`, {}, signal),
  savePaperGlossary: (id: string, payload: GlossaryGenerate) =>
    request<GlossaryGenerate>(`/papers/${id}/glossary`, { method: "POST", body: JSON.stringify(payload) }),
  generatePaperGlossary: (id: string, signal?: AbortSignal, regenerate = false) =>
    request<GlossaryGenerate>(`/papers/${id}/glossary/generate${regenerate ? "?regenerate=true" : ""}`, { method: "POST" }, signal),
  askPaperGlossary: (id: string, question: string, history: GlossaryHistoryTurn[], signal?: AbortSignal) =>
    request<GlossaryAsk>(`/papers/${id}/glossary/ask`, {
      method: "POST", body: JSON.stringify({ question, history: history.slice(-6) })
    }, signal),
  paperNoteDraft: (id: string, payload: PaperNoteDraftRequest) =>
    request<ApiSchemas["PaperNoteDraftResponse"]>(`/papers/${id}/note-draft`, {
      method: "POST", body: JSON.stringify(payload)
    }),
  researchChallenge: (id: string) => request<ResearchChallenge>(`/papers/${id}/research-challenge`),
  externalComparePaper: (id: string, question: string) =>
    request<ExternalComparison>(`/papers/${id}/external-compare`, {
      method: "POST",
      body: JSON.stringify({ question })
    }),
  paperCrops: (id: string, visualId: number) =>
    request<PaperVisualCrop[]>(`/papers/${id}/visuals/${visualId}/crops`),
  savePaperCrop: (id: string, visualId: number, crop: Omit<ApiSchemas["PaperVisualCropCreate"], "label"> & { label?: string }) =>
    request<PaperVisualCrop>(`/papers/${id}/visuals/${visualId}/crops`, { method: "POST", body: JSON.stringify(crop) }),
  analyzePaperCrop: (cropId: number) =>
    request<PaperVisualCrop>(`/crops/${cropId}/analyze`, { method: "POST" }),
  extractPaperCropData: (cropId: number) =>
    request<PaperVisualCrop>(`/crops/${cropId}/extract-data`, { method: "POST" }),
  transcribeFormula: (cropId: number) =>
    request<FormulaTranscription>(`/crops/${cropId}/transcribe-formula`, { method: "POST" }),
  deletePaperCrop: (id: string, visualId: number, cropId: number) =>
    request<void>(`/papers/${id}/visuals/${visualId}/crops/${cropId}`, { method: "DELETE" }),
  cropImageUrl: (cropId: number) => `${BASE}/crops/${cropId}/image`,
  pageImageUrl: (id: string, page: number) =>
    `${BASE}/papers/${id}/pages/${page}/image`,
  figureThumbnailUrl: (id: string) => `${BASE}/papers/${id}/figure-thumbnail`,
  deletePaper: (id: string, confirmationTitle: string) =>
    request<PaperDeleteResponse>(`/papers/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ confirmation_title: confirmationTitle })
    }),
  upload: (file: File) => { const form = new FormData(); form.append("file", file); return request<Paper>("/papers/upload", { method: "POST", body: form }); },
  searchPapers: (params: PaperSearchParams, signal?: AbortSignal) => request<PaperSearchResponse>(`/search/papers?${buildPaperSearchQuery(params)}`, undefined, signal),
  importPaper: (payload: PaperImportRequest, signal?: AbortSignal) => request<PaperImportResponse>("/papers/import", { method: "POST", body: JSON.stringify(payload) }, signal),
  latestResearchNews: () => request<ApiSchemas["ResearchNewsResponse"]>("/research/news"),
  researchReadingHighlights: (payload: ApiSchemas["ResearchReadingHighlightsRequest"]) => request<ApiSchemas["ResearchReadingHighlightsResponse"]>("/research/reading-highlights", { method: "POST", body: JSON.stringify(payload) }),
  listResearchSubscriptions: () => request<ResearchPage<ResearchSubscription>>("/research/subscriptions"),
  getResearchSubscription: (id: number) => request<ResearchSubscription>(`/research/subscriptions/${id}`),
  createResearchSubscription: (payload: ApiSchemas["ResearchSubscriptionCreate"]) => request<ResearchSubscription>("/research/subscriptions", { method: "POST", body: JSON.stringify(payload) }),
  updateResearchSubscription: (id: number, payload: Pick<ResearchSubscription, "interval_hours">) => request<ResearchSubscription>(`/research/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteResearchSubscription: (id: number, confirmation_name: string) => request<void>(`/research/subscriptions/${id}`, { method: "DELETE", body: JSON.stringify({ confirmation_name }) }),
  listResearchRuns: () => request<ResearchPage<ResearchRun>>("/research/runs"),
  listResearchNotifications: () => request<ResearchPage<ResearchNotification>>("/research/notifications"),
  runResearchSubscription: (id: number) => request<ResearchRun>(`/research/subscriptions/${id}/run`, { method: "POST" }),
  listResearchRecommendations: (subscriptionId?: number, runId?: number) => request<ResearchPage<ResearchRecommendation>>(`/research/recommendations?page_size=50${subscriptionId ? `&subscription_id=${subscriptionId}` : ""}${runId ? `&run_id=${runId}` : ""}`),
  markResearchNotificationRead: (id: number) => request<ResearchNotification>(`/research/notifications/${id}/read`, { method: "POST" }),
  markResearchRecommendationRead: (id: number) => request<ResearchRecommendation>(`/research/recommendations/${id}/read`, { method: "POST" }),
  sourceStatuses: (signal?: AbortSignal) => request<SourceStatus[]>("/sources/status", undefined, signal),
  analyzeReport: (id: string, reportType: AnalysisReportType) =>
    request<AnalysisReportResponse>(`/papers/${id}/analysis/${reportType}`, { method: "POST" }),
  knowledgeStatus: () => request<KnowledgeStatus>("/knowledge/status"),
  reindexKnowledge: () =>
    request<KnowledgeReindexResult>("/knowledge/reindex", { method: "POST" }),
  askKnowledge: (
    question: string,
    maxCitations = 6,
    history: KnowledgeHistoryTurn[] = []
  ) =>
    request<KnowledgeAnswer>("/knowledge/ask", {
      method: "POST",
      body: JSON.stringify({
        question,
        max_citations: maxCitations,
        history: history.slice(-4)
      })
    }),
  savedConversations: () => request<{ items: SavedConversationSummary[] }>("/knowledge/conversations"),
  saveConversation: (turns: KnowledgeAnswer[], paperId?: number) =>
    request<SavedConversation>("/knowledge/conversations", {
      method: "POST",
      body: JSON.stringify({
        scope: paperId === undefined ? "library" : "paper",
        paper_id: paperId,
        title: turns[0]?.question.slice(0, 80) || "已保存问答",
        turns: turns.map((turn, index) => ({ ...turn, turn_index: index + 1 }))
      })
    }),
  savedConversation: (id: number) => request<SavedConversation>(`/knowledge/conversations/${id}`),
  deleteSavedConversation: (id: number) =>
    request<void>(`/knowledge/conversations/${id}`, { method: "DELETE" }),
  claims: (id: string) =>
    request<{ items: PaperClaim[] }>(`/papers/${id}/claims`),
  rebuildClaims: (id: string) =>
    request<{ items: PaperClaim[] }>(`/papers/${id}/claims/rebuild`, {
      method: "POST"
    }),
  comparePapers: (paperIds: number[], question: string) =>
    request<PaperComparison>("/knowledge/compare", {
      method: "POST",
      body: JSON.stringify({ paper_ids: paperIds, question })
    }),
  savedComparisons: () => request<{ items: SavedComparisonSummary[] }>("/comparisons/saved"),
  saveComparison: (comparison: PaperComparison) =>
    request<SavedComparison>("/comparisons/saved", {
      method: "POST",
      body: JSON.stringify(comparison)
    }),
  savedComparison: (id: number) => request<SavedComparison>(`/comparisons/saved/${id}`),
  deleteSavedComparison: (id: number) =>
    request<void>(`/comparisons/saved/${id}`, { method: "DELETE" }),
  saveNote: (id: string, content: string) => request<{ message: string }>(`/papers/${id}/note`, { method: "PUT", body: JSON.stringify({ content }) }),
  completeOnboarding: (profile: Record<string, unknown>) => request<Settings>("/onboarding/complete", { method: "POST", body: JSON.stringify(profile) })
  ,learningEligiblePapers: () => request<{ items: EligibleLearningPaper[] }>("/learning/eligible-papers")
  ,learningPaperCandidates: () => request<{ items: LearningPaperCandidate[] }>("/learning/paper-candidates")
  ,learningOverview: () => request<{ packs: LearningPack[]; today_tasks: LearningPlanTask[]; open_weaknesses: LearningWeakness[]; due_reviews: LearningReviewItem[]; due_review_count: number }>("/learning/overview")
  ,learningPacks: (status: LearningLifecycleStatus | "all" = "active") => request<{ items: LearningPack[] }>(`/learning/packs?status=${status}`)
  ,learningAnalytics: (days: 7 | 30 | 90) => request<LearningAnalytics>(`/learning/analytics?days=${days}`)
  ,createLearningPack: (payload: { title: string; learning_goal: string; paper_ids: number[] }) => request<LearningPack>("/learning/packs", { method: "POST", body: JSON.stringify(payload) })
  ,learningPack: (id: number) => request<LearningPack>(`/learning/packs/${id}`)
  ,learningVersions: (id: number) => request<{ items: LearningPack[] }>(`/learning/packs/${id}/versions`)
  ,createLearningVersion: (id: number) => request<LearningPack>(`/learning/packs/${id}/versions`, { method: "POST" })
  ,activateLearningPack: (id: number) => request<LearningPack>(`/learning/packs/${id}/activate`, { method: "POST" })
  ,archiveLearningPack: (id: number) => request<LearningPack>(`/learning/packs/${id}/archive`, { method: "POST" })
  ,compareLearningPacks: (leftId: number, rightId: number) => request<LearningPackComparison>(`/learning/pack-comparisons?left_pack_id=${leftId}&right_pack_id=${rightId}`)
  ,learningExportUrl: (id: number, format: "markdown" | "json") => `${BASE}/learning/packs/${id}/export?format=${format}`
  ,deleteLearningPack: (id: number, confirmation_title: string) => request<void>(`/learning/packs/${id}`, { method: "DELETE", body: JSON.stringify({ confirmation_title }) })
  ,generateLearningCards: (id: number) => request<{ cards: LearningCard[]; status: string }>(`/learning/packs/${id}/generate-cards`, { method: "POST" })
  ,generateLearningQuiz: (id: number) => request<{ questions: LearningQuestion[]; status: string }>(`/learning/packs/${id}/generate-quiz`, { method: "POST" })
  ,updateLearningCard: (id: number, payload: Partial<Pick<LearningCard, "concept" | "content" | "importance" | "common_mistake">>) => request<LearningCard>(`/learning/cards/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
  ,updateLearningMastery: (id: number, mastery_status: LearningCard["mastery_status"]) => request<LearningCard>(`/learning/cards/${id}/mastery`, { method: "PATCH", body: JSON.stringify({ mastery_status }) })
  ,learningReviewQueue: (packId?: number) => request<LearningReviewQueue>(`/learning/review-queue${packId === undefined ? "" : `?pack_id=${packId}`}`)
  ,submitLearningReview: (cardId: number, rating: LearningReviewRating) => request<{ state: LearningReviewState; card: LearningCard }>(`/learning/cards/${cardId}/review`, { method: "POST", body: JSON.stringify({ rating }) })
  ,updateLearningReviewState: (stateId: number, payload: { next_review_date?: string; is_paused?: boolean }) => request<LearningReviewState>(`/learning/review-states/${stateId}`, { method: "PATCH", body: JSON.stringify(payload) })
  ,submitLearningAttempt: (id: number, answer: string) => request<LearningAttempt>(`/learning/questions/${id}/attempts`, { method: "POST", body: JSON.stringify({ answer }) })
  ,rateLearningAttempt: (id: number, self_rating: "答对" | "部分答对" | "答错") => request<LearningAttempt>(`/learning/attempts/${id}/self-rating`, { method: "PATCH", body: JSON.stringify({ self_rating }) })
  ,generateLearningFeedback: (id: number, regenerate = false) => request<LearningAttempt>(`/learning/attempts/${id}/feedback`, { method: "POST", body: JSON.stringify({ regenerate }) })
  ,orderLearningCards: (packId: number, ids: number[]) => request<{ items: LearningCard[] }>(`/learning/packs/${packId}/cards/order`, { method: "PATCH", body: JSON.stringify({ ids }) })
  ,orderLearningQuestions: (packId: number, ids: number[]) => request<{ items: LearningQuestion[] }>(`/learning/packs/${packId}/questions/order`, { method: "PATCH", body: JSON.stringify({ ids }) })
  ,orderLearningPlanTasks: (packId: number, ids: number[]) => request<{ items: LearningPlanTask[] }>(`/learning/packs/${packId}/plan/tasks/order`, { method: "PATCH", body: JSON.stringify({ ids }) })
  ,createLearningWeakness: (packId: number, payload: { concept: string; description: string; card_id?: number | null }) => request<LearningWeakness>(`/learning/packs/${packId}/weaknesses`, { method: "POST", body: JSON.stringify(payload) })
  ,updateLearningWeakness: (id: number, payload: { concept?: string; description?: string }) => request<LearningWeakness>(`/learning/weaknesses/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
  ,setLearningWeaknessResolved: (id: number, resolved: boolean) => request<LearningWeakness>(`/learning/weaknesses/${id}/${resolved ? "resolve" : "reopen"}`, { method: "PATCH" })
  ,saveLearningPlan: (packId: number, payload: { start_date: string; end_date: string; weekdays: number[] }) => request<LearningPlan>(`/learning/packs/${packId}/plan`, { method: "PUT", body: JSON.stringify(payload) })
  ,updateLearningPlanTask: (id: number, completed: boolean) => request<LearningPlanTask>(`/learning/plan-tasks/${id}`, { method: "PATCH", body: JSON.stringify({ completed }) })
  ,addWeaknessPlanTask: (id: number, task_date: string) => request<LearningPlanTask>(`/learning/weaknesses/${id}/plan-task`, { method: "POST", body: JSON.stringify({ task_date }) })
};
