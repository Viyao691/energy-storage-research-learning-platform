import { providerChoice } from "./modelCatalog";

export type CredentialSummary = { configured: boolean; last4?: string | null };

export function describeCredential(value: CredentialSummary): string {
  return value.configured && value.last4 ? `已配置（末尾 ${value.last4}）` : "未配置";
}

export function nextOnboardingPath(initialized: boolean): "/onboarding" | "/dashboard" {
  return initialized ? "/dashboard" : "/onboarding";
}

export type SettingsFormValues = {
  model_provider: string; model_name: string; vision_model: string; model_base_url: string; api_key: string;
  timeout_seconds: string; backup_model: string; paper_budget: string; daily_budget: string; monthly_budget: string;
};

export type DocumentVisionFormValues = {
  document_vision_provider: string;
  document_vision_model: string;
  document_vision_base_url: string;
  document_vision_timeout_seconds: string;
  document_vision_api_key: string;
};

export function applyDocumentVisionPreset(values: DocumentVisionFormValues, provider: string): DocumentVisionFormValues {
  if (provider === values.document_vision_provider) return values;
  const choice = providerChoice(provider);
  return {
    ...values,
    document_vision_provider: provider,
    document_vision_model: provider === "openai_compatible" ? values.document_vision_model : choice?.visionModels[0]?.value ?? "",
    document_vision_base_url: provider === "openai_compatible" ? values.document_vision_base_url : choice?.baseUrl ?? "",
    document_vision_api_key: ""
  };
}

export function applyProviderPreset(values: SettingsFormValues, provider: string): SettingsFormValues {
  if (provider === values.model_provider) return values;
  if (provider === "openai_compatible") return { ...values, model_provider: provider, api_key: "" };
  const choice = providerChoice(provider);
  if (!choice) return { ...values, model_provider: provider, api_key: "" };
  return {
    ...values,
    model_provider: provider,
    model_name: choice.defaultModel,
    vision_model: provider === "ollama" ? choice.visionModels[0]?.value ?? "" : "",
    model_base_url: choice.baseUrl,
    backup_model: choice.backupModel ?? "",
    api_key: ""
  };
}

export function providerNeedsApiKey(provider: string): boolean {
  return provider !== "mock" && provider !== "ollama";
}

export function modelConfigurationSaved(
  saved: { model_provider?: string; model_name?: string; model_base_url?: string; api_key?: CredentialSummary } | undefined,
  selected: SettingsFormValues
): boolean {
  return !!saved && saved.model_provider === selected.model_provider
    && (saved.model_name || "") === selected.model_name
    && (saved.model_base_url || "") === selected.model_base_url
    && !selected.api_key.trim()
    && (!providerNeedsApiKey(selected.model_provider) || !!saved.api_key?.configured);
}

export function credentialForSelectedProvider(
  savedProvider: string | undefined,
  selectedProvider: string,
  credential: CredentialSummary
): CredentialSummary {
  return savedProvider === selectedProvider
    ? credential
    : { configured: false, last4: null };
}

export function toSettingsPayload(values: SettingsFormValues): Record<string, string | number> {
  const payload: Record<string, string | number> = {
    model_provider: values.model_provider, model_name: values.model_name, vision_model: values.vision_model, model_base_url: values.model_base_url,
    timeout_seconds: Number(values.timeout_seconds), backup_model: values.backup_model,
    paper_budget: Number(values.paper_budget), daily_budget: Number(values.daily_budget), monthly_budget: Number(values.monthly_budget)
  };
  if (values.api_key.trim()) payload.api_key = values.api_key.trim();
  return payload;
}

export function paperItems<T>(response: { items: T[] }): T[] { return response.items; }

const ARTICLE_TYPE_LABELS: Record<string, string> = {
  review: "综述",
  "review-article": "综述",
  "journal-article": "研究论文",
  article: "研究论文",
  preprint: "预印本",
  "proceedings-article": "会议论文",
  conference: "会议论文",
  "book-chapter": "书籍章节",
  editorial: "社论"
};

export function articleTypeLabel(value?: string | null): string {
  const normalized = value?.trim();
  if (!normalized) return "体裁未提供";
  return ARTICLE_TYPE_LABELS[normalized.toLowerCase()] ?? normalized;
}

export function publicationYear(value?: string | null, fallback?: number | null): string {
  const match = value?.match(/^\d{4}/);
  return match?.[0] ?? (fallback ? String(fallback) : "年份未提供");
}

type SourceStatusView = {
  source: string;
  enabled: boolean;
  ok: boolean;
  message?: string;
};

type ImportResultView = {
  paper: { id: number; acquisition_status: string };
  created: boolean;
  duplicate_reason: { kind: string; paper_id: number } | null;
  download_attempted: boolean;
  download_succeeded: boolean;
  warning: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  openalex: "OpenAlex",
  crossref: "Crossref",
  arxiv: "arXiv",
  semantic_scholar: "Semantic Scholar"
};

const OA_LABELS: Record<string, string> = {
  gold: "金色 OA",
  green: "绿色 OA",
  hybrid: "混合 OA",
  bronze: "铜色 OA",
  diamond: "钻石 OA",
  open: "开放"
};

const ACQUISITION_LABELS: Record<string, string> = {
  fulltext: "已获取合法全文",
  abstract_only: "仅摘要",
  metadata_only: "仅元数据",
  download_failed: "开放全文下载失败（已保留元数据）",
  pending: "等待获取全文",
  unavailable: "全文不可用"
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function openAccessLabel(isOpenAccess: boolean, status: string): string {
  if (!isOpenAccess) return "非开放获取";
  const detail = OA_LABELS[status.trim().toLowerCase()];
  return detail ? `开放获取 · ${detail}` : "开放获取";
}

export function acquisitionLabel(status: string): string {
  return ACQUISITION_LABELS[status] ?? "全文状态未知";
}

export function partialSearchWarning(
  statuses: SourceStatusView[],
  warnings: string[]
): string | null {
  const failed = statuses.filter(status => status.enabled && !status.ok);
  if (failed.length) {
    return `部分来源暂不可用，结果可能不完整：${failed.map(status => sourceLabel(status.source)).join("、")}`;
  }
  return warnings.length ? "部分来源暂不可用，结果可能不完整。" : null;
}

export function importResultStatus(result: ImportResultView): {
  paperId: number;
  message: string;
  warning: boolean;
} {
  if (!result.created) {
    return { paperId: result.paper.id, message: "该论文已在论文库中。", warning: false };
  }
  if (result.download_attempted && !result.download_succeeded) {
    return {
      paperId: result.paper.id,
      message: "已入库；开放 PDF 下载失败，已保留论文元数据。",
      warning: true
    };
  }
  return {
    paperId: result.paper.id,
    message: result.paper.acquisition_status === "fulltext" ? "已入库并保存合法全文。" : "已入库。",
    warning: false
  };
}

export function legalFulltextHint(paper: {
  is_open_access: boolean;
  pdf_url: string | null;
  landing_url: string;
}): string {
  if (paper.is_open_access && paper.pdf_url) {
    return "检测到开放全文。入库时可由后端尝试合法下载，也可前往来源页面查看。";
  }
  if (paper.landing_url) return "当前仅提供论文来源页面，不代表可合法获取全文。";
  return "当前未提供可验证的合法全文入口。";
}

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}
