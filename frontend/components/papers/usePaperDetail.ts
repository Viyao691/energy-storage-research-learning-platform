"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import type {
  Analysis,
  FormulaTranscription,
  AnalysisReportType,
  DocumentParsersStatus,
  EvidenceLocation,
  GlossaryAsk,
  GlossaryGenerate,
  ExternalComparison,
  KnowledgeAnswer,
  PaperNoteDraftRequest,
  ResearchChallenge,
  OcrRun,
  ParseCandidate,
  ParseCandidateComparison,
  Paper,
  PaperClaim,
  PaperVisual,
  PaperVisualCrop,
  ScientificAnalysis,
  ScientificDataset,
  ScientificRecipe,
} from "../../lib/api";
import { api } from "../../lib/api";

type CropSelection = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PaperDetailTab =
  | "summary"
  | "plain"
  | "deep"
  | "glossary"
  | "claims"
  | "visual"
  | "scientific"
  | "note";

const REPORT_FIELDS_BY_TAB = {
  summary: {
    type: "quick_understanding" as AnalysisReportType,
    field: "quick_understanding" as const,
    promptField: "quick_prompt_version" as const,
    schemaField: "quick_schema_version" as const,
    evidenceField: "quick_evidence_status" as const,
    label: "快速理解",
  },
  plain: {
    type: "layman_understanding" as AnalysisReportType,
    field: "layman_understanding" as const,
    promptField: "layman_prompt_version" as const,
    schemaField: "layman_schema_version" as const,
    evidenceField: "layman_evidence_status" as const,
    label: "通俗理解",
  },
  deep: {
    type: "reviewer_analysis" as AnalysisReportType,
    field: "reviewer_analysis" as const,
    promptField: "reviewer_prompt_version" as const,
    schemaField: "reviewer_schema_version" as const,
    evidenceField: "reviewer_evidence_status" as const,
    label: "审稿人速解",
  },
} as const;

function parseScientificJson(value: string, label: string): Record<string, unknown> {
  const parsed = JSON.parse(value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error(`${label}必须是 JSON 对象。`);
  return parsed as Record<string, unknown>;
}

export function usePaperDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPageValue = searchParams.get("page");
  const hasPageParameter = requestedPageValue !== null;
  const requestedPage =
    requestedPageValue !== null && /^\d+$/.test(requestedPageValue)
      ? Number(requestedPageValue)
      : null;
  const hasRequestedPage = requestedPage !== null && requestedPage > 0;
  const [paper, setPaper] = useState<Paper>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [note, setNote] = useState("");
  const [challenge, setChallenge] = useState<ResearchChallenge | null>(null);
  const [challengeAnswers, setChallengeAnswers] = useState(["", "", ""]);
  const [draftBusy, setDraftBusy] = useState(false);

  async function appendNoteDraft(payload: PaperNoteDraftRequest) {
    setDraftBusy(true);
    try {
      const result = await api.paperNoteDraft(id, payload);
      setNote(current => current ? current + "\n\n" + result.markdown : result.markdown);
      setActiveTab("note");
      setMessage("已追加到笔记草稿，原有编辑已保留；请查看后点击保存笔记。");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "追加失败，笔记未修改");
    } finally {
      setDraftBusy(false);
    }
  }

  async function openChallenge() {
    setDraftBusy(true);
    try {
      setChallenge(await api.researchChallenge(id));
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "读取挑战失败");
    } finally {
      setDraftBusy(false);
    }
  }
  const [visuals, setVisuals] = useState<PaperVisual[]>([]);
  const [claims, setClaims] = useState<PaperClaim[]>([]);
  const [claimsBusy, setClaimsBusy] = useState(false);
  const [claimsFeedback, setClaimsFeedback] = useState("");
  const [claimsError, setClaimsError] = useState("");
  const [selectedVisualId, setSelectedVisualId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(
    hasRequestedPage ? requestedPage : 1
  );
  const [visualMessage, setVisualMessage] = useState("");
  const [visualBusy, setVisualBusy] = useState(false);
  const [paperQuestion, setPaperQuestion] = useState("");
  const [paperAnswers, setPaperAnswers] = useState<KnowledgeAnswer[]>([]);
  const [paperQuestionBusy, setPaperQuestionBusy] = useState(false);
  const [paperQuestionStatus, setPaperQuestionStatus] = useState<"idle" | "working" | "success" | "error">("idle");
  const [paperQuestionError, setPaperQuestionError] = useState("");
  const [paperQuestionStartedAt, setPaperQuestionStartedAt] = useState<number | null>(null);
  const [paperQuestionElapsedMs, setPaperQuestionElapsedMs] = useState(0);
  const [paperConversationSaveBusy, setPaperConversationSaveBusy] = useState(false);
  const askingRef = useRef(false);
  const savingConversationRef = useRef(false);
  const [externalQuestion, setExternalQuestion] = useState("");
  const [externalComparison, setExternalComparison] = useState<ExternalComparison | null>(null);
  const [externalBusy, setExternalBusy] = useState(false);
  const [crops, setCrops] = useState<PaperVisualCrop[]>([]);
  const [formulas, setFormulas] = useState<Record<number, FormulaTranscription>>({});

  async function transcribeFormula(cropId: number) {
    setVisualBusy(true);
    setVisualMessage("本地公式转写中，通常约 1 分钟，最长 180 秒；不会上传云端。");
    try {
      const result = await api.transcribeFormula(cropId);
      setFormulas(current => ({ ...current, [cropId]: result }));
      setVisualMessage("公式转写完成，请对照裁切原图核验后再追加笔记。");
    } catch (caught) {
      setVisualMessage("公式转写失败：" + (caught instanceof Error ? caught.message : "请重试"));
    } finally {
      setVisualBusy(false);
    }
  }

  function appendFormula(cropId: number) {
    const result = formulas[cropId];
    if (!result || String(result.paper_id) !== id) return;
    const draft = `## 公式转写（待核验）\n\n${result.evidence_status} · ${result.model_name}\n\n$$\n${result.latex}\n$$\n\n[原文第 ${result.page_number} 页](/papers/${id}?page=${result.page_number}) · 裁切区域 #${cropId}（手动框选，非自动定位）`;
    setNote(current => current ? current + "\n\n" + draft : draft);
    setActiveTab("note");
    setMessage("已追加公式到笔记草稿，原有编辑已保留；核验后请点击保存笔记。");
  }
  const [cropSelection, setCropSelection] = useState<CropSelection | null>(null);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfVariant, setPdfVariant] = useState<"original" | "ocr">("original");
  const [ocrRuns, setOcrRuns] = useState<OcrRun[]>([]);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [parserStatus, setParserStatus] = useState<DocumentParsersStatus | null>(null);
  const [parseCandidates, setParseCandidates] = useState<ParseCandidate[]>([]);
  const [parseComparison, setParseComparison] = useState<ParseCandidateComparison | null>(null);
  const [parseCandidateBusy, setParseCandidateBusy] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceLocation | null>(null);
  const [evidenceMessage, setEvidenceMessage] = useState("");
  const [scientificDatasets, setScientificDatasets] = useState<ScientificDataset[]>([]);
  const [scientificRecipes, setScientificRecipes] = useState<ScientificRecipe[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [scientificData, setScientificData] = useState("{}");
  const [scientificUnits, setScientificUnits] = useState("{}");
  const [scientificParameters, setScientificParameters] = useState("{}");
  const [scientificRecipe, setScientificRecipe] = useState("electrochem.cycle_retention");
  const [scientificResult, setScientificResult] = useState<ScientificAnalysis | null>(null);
  const [scientificBusy, setScientificBusy] = useState(false);
  const [scientificMessage, setScientificMessage] = useState("");
  const [activeTab, setActiveTab] = useState<PaperDetailTab>("summary");
  const [glossary, setGlossary] = useState<GlossaryGenerate | null>(null);
  const [glossaryAnswers, setGlossaryAnswers] = useState<GlossaryAsk[]>([]);
  const [glossaryQuestion, setGlossaryQuestion] = useState("");
  const [glossaryBusy, setGlossaryBusy] = useState(false);
  const [glossaryAskBusy, setGlossaryAskBusy] = useState(false);
  const [glossaryError, setGlossaryError] = useState("");
  const glossaryController = useRef<AbortController | null>(null);
  const glossaryAskController = useRef<AbortController | null>(null);

  useEffect(() => {
    setGlossary(null);
    setGlossaryAnswers([]);
    setGlossaryQuestion("");
    setGlossaryError("");
    setGlossaryBusy(false);
    setGlossaryAskBusy(false);
    const loadController = new AbortController();
    if (typeof api.paperGlossary === "function") {
      api.paperGlossary(id, loadController.signal)
        .then(result => { if (!loadController.signal.aborted) setGlossary(current => current ?? result); })
        .catch(caught => { if (!loadController.signal.aborted) setGlossaryError(caught instanceof Error ? caught.message : "读取术语失败"); });
    }
    return () => {
      loadController.abort();
      glossaryController.current?.abort();
      glossaryAskController.current?.abort();
      glossaryController.current = null;
      glossaryAskController.current = null;
    };
  }, [id]);

  async function generateGlossary() {
    if (glossaryController.current) return;
    const controller = new AbortController();
    glossaryController.current = controller;
    setGlossaryBusy(true);
    setGlossaryError("");
    try {
      const result = await api.generatePaperGlossary(id, controller.signal, Boolean(glossary));
      if (!controller.signal.aborted) setGlossary(result);
    } catch (caught) {
      if (!controller.signal.aborted) setGlossaryError(caught instanceof Error ? caught.message : "生成术语失败，请重试");
    } finally {
      if (glossaryController.current === controller) {
        glossaryController.current = null;
        setGlossaryBusy(false);
      }
    }
  }

  async function askGlossary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = glossaryQuestion.trim();
    if (!question || glossaryAskController.current) return;
    const controller = new AbortController();
    glossaryAskController.current = controller;
    setGlossaryAskBusy(true);
    setGlossaryError("");
    try {
      const history = glossaryAnswers.map(({ question, answer }) => ({ question, answer }));
      const result = await api.askPaperGlossary(id, question, history, controller.signal);
      if (!controller.signal.aborted) {
        setGlossaryAnswers(current => [...current, result]);
        setGlossaryQuestion("");
      }
    } catch (caught) {
      if (!controller.signal.aborted) setGlossaryError(caught instanceof Error ? caught.message : "提问失败，请重试");
    } finally {
      if (glossaryAskController.current === controller) {
        glossaryAskController.current = null;
        setGlossaryAskBusy(false);
      }
    }
  }

  function stopGlossaryAsk() {
    glossaryAskController.current?.abort();
    glossaryAskController.current = null;
    setGlossaryAskBusy(false);
  }

  useEffect(() => {
    api
      .paper(id)
      .then(detail => {
        setPaper(detail.paper);
        setAnalysis(detail.analysis);
        setNote(detail.note || "");
        if (hasPageParameter) {
          setCurrentPage(hasRequestedPage ? requestedPage : 1);
        }
        if (typeof api.claims === "function") {
          Promise.resolve(api.claims(id))
            .then(result => {
              if (result) setClaims(result.items);
            })
            .catch(() => {});
        }
        const hasLocalPdf =
          Boolean(detail.paper.file_hash) &&
          detail.paper.acquisition_status === "fulltext";
        if (hasLocalPdf) {
          if (typeof api.paperOcrRuns === "function") {
            api.paperOcrRuns(id).then(result => setOcrRuns(result.items)).catch(() => undefined);
          }
          if (typeof api.documentParsersStatus === "function") {
            api.documentParsersStatus().then(setParserStatus).catch(() => undefined);
          }
          if (typeof api.paperParseCandidates === "function") {
            api.paperParseCandidates(id).then(result => setParseCandidates(result.items)).catch(() => undefined);
          }
          if (typeof api.scientificDatasets === "function") {
            api.scientificDatasets(id).then(result => {
              setScientificDatasets(result.items);
              setSelectedDatasetId(result.items[0]?.id ?? null);
            }).catch(() => undefined);
          }
          if (typeof api.scientificRecipes === "function") {
            api.scientificRecipes().then(setScientificRecipes).catch(() => undefined);
          }
          api
            .visuals(id)
            .then(items => {
              setVisuals(items);
              if (items.length > 0) {
                if (!hasPageParameter) {
                  setCurrentPage(items[0].page_number);
                }
                const matchingVisual = hasRequestedPage
                  ? items.find(item => item.page_number === requestedPage)
                  : hasPageParameter
                    ? undefined
                    : items[0];
                setSelectedVisualId(matchingVisual?.id ?? null);
              }
            })
            .catch(caught => {
              setVisualMessage(
                caught instanceof Error
                  ? caught.message
                  : "图表目录暂时无法读取"
              );
            });
        }
      })
      .catch(caught => setMessage(caught.message));
  }, [id, hasPageParameter, hasRequestedPage, requestedPage]);

  useEffect(() => {
    if (selectedVisualId === null) {
      setCrops([]);
      return;
    }
    if (typeof api.paperCrops === "function") {
      const pending = api.paperCrops(id, selectedVisualId);
      if (pending) pending.then(setCrops).catch(() => setCrops([]));
    }
  }, [id, selectedVisualId]);

  useEffect(() => {
    const latest = ocrRuns[0];
    if (!latest || !["queued", "running"].includes(latest.status)) return;
    const timer = window.setInterval(() => {
      api.ocrRun(latest.id).then(updated => {
        setOcrRuns(current => [updated, ...current.filter(item => item.id !== updated.id)]);
        if (updated.status === "completed") {
          setPaper(current => current ? { ...current, ocr_available: true, parse_confidence: updated.quality_score } : current);
          setPdfVariant("ocr");
        }
      }).catch(() => undefined);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [ocrRuns]);

  useEffect(() => {
    const latest = parseCandidates[0];
    if (!latest || !["queued", "running"].includes(latest.status)) return;
    const timer = window.setInterval(() => {
      api.parseCandidate(latest.id).then(updated => {
        setParseCandidates(current => [updated, ...current.filter(item => item.id !== updated.id)]);
      }).catch(() => undefined);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [parseCandidates]);

  async function startOcr(mode: "auto" | "full") {
    setOcrBusy(true);
    try {
      const run = await api.createOcrRun(id, mode);
      setOcrRuns(current => [run, ...current]);
      setMessage(mode === "auto" ? "已启动自动识别低质量页。" : "已启动完整本地 OCR。原 PDF 不会被覆盖。");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "OCR 启动失败");
    } finally {
      setOcrBusy(false);
    }
  }

  async function enhanceCurrentPage(pageNumber: number) {
    if (!window.confirm(`仅向独立文档视觉供应商发送第 ${pageNumber} 页及局部文字，继续吗？`)) return;
    setOcrBusy(true);
    try {
      await api.cloudEnhancePage(id, pageNumber);
      setMessage(`第 ${pageNumber} 页云端视觉增强预览已生成，标记为待人工确认。`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "疑难页增强失败");
    } finally {
      setOcrBusy(false);
    }
  }

  async function startParseCandidate() {
    if (!window.confirm("运行 Docling 实验解析？它不会自动替换当前版本。")) return;
    setParseCandidateBusy(true);
    setParseComparison(null);
    try {
      const run = await api.createParseCandidate(id);
      setParseCandidates(current => [run, ...current.filter(item => item.id !== run.id)]);
      setMessage("Docling 实验解析已启动；完成后请先查看对比。 ");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "实验解析启动失败");
    } finally {
      setParseCandidateBusy(false);
    }
  }

  async function compareParseCandidate(runId: number) {
    setParseCandidateBusy(true);
    try {
      setParseComparison(await api.parseCandidateComparison(runId));
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "解析版本对比失败");
    } finally {
      setParseCandidateBusy(false);
    }
  }

  async function activateParseCandidate(runId: number) {
    if (!window.confirm("确认启用这个实验候选？当前索引会原子重建，失败时保留原版本。")) return;
    setParseCandidateBusy(true);
    try {
      const updated = await api.activateParseCandidate(runId);
      setParseCandidates(current => [updated, ...current.filter(item => item.id !== updated.id)]);
      const detail = await api.paper(id);
      setPaper(detail.paper);
      setAnalysis(detail.analysis);
      setParseComparison(null);
      setMessage("实验解析已启用，证据索引已切换到同一解析版本。 ");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "实验解析启用失败");
    } finally {
      setParseCandidateBusy(false);
    }
  }

  async function cancelParseCandidate(runId: number) {
    setParseCandidateBusy(true);
    try {
      await api.cancelParseCandidate(runId);
      const updated = await api.parseCandidate(runId);
      setParseCandidates(current => [updated, ...current.filter(item => item.id !== updated.id)]);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "实验解析取消失败");
    } finally {
      setParseCandidateBusy(false);
    }
  }

  function selectEvidence(locations: EvidenceLocation[], pageNumber: number | null) {
    const location = locations[0] ?? null;
    const targetPage = location?.page_number ?? pageNumber;
    if (targetPage !== null) setCurrentPage(targetPage);
    setSelectedEvidence(location);
    setEvidenceMessage(
      location
        ? `已定位第 ${location.page_number} 页证据区域。`
        : targetPage !== null
          ? `已跳到第 ${targetPage} 页；区域无法确认。`
          : "该证据没有可靠页码，区域无法确认。"
    );
  }

  async function createScientificDraft(selectedVisual: PaperVisual | undefined, crops: PaperVisualCrop[]) {
    setScientificBusy(true);
    setScientificMessage("");
    try {
      const created = await api.createScientificDataset(id, {
        crop_id: crops[0]?.id ?? null,
        visual_id: selectedVisual?.id ?? null,
        source_type: "manual",
        domain: scientificRecipes.find(recipe => recipe.key === scientificRecipe)?.domain ?? "generic",
        dataset_type: scientificRecipe === "generic.curve_digitize" ? "curve" : "table",
        data: parseScientificJson(scientificData, "数据"),
        units: parseScientificJson(scientificUnits, "单位"),
        parameters: { ...parseScientificJson(scientificParameters, "参数"), recipe_key: scientificRecipe },
        confidence: 0.5
      });
      setScientificDatasets(current => [created, ...current]);
      setSelectedDatasetId(created.id);
      setScientificParameters(JSON.stringify(created.parameters));
      setScientificResult(null);
      setScientificMessage("科研数据草稿已建立，请核对数据并人工确认。 ");
    } catch (caught) {
      setScientificMessage(caught instanceof Error ? caught.message : "科研数据草稿创建失败");
    } finally {
      setScientificBusy(false);
    }
  }

  async function saveScientificDataset(confirm = false) {
    if (selectedDatasetId === null) return;
    setScientificBusy(true);
    setScientificMessage("");
    try {
      const updated = await api.updateScientificDataset(selectedDatasetId, {
        data: parseScientificJson(scientificData, "数据"),
        units: parseScientificJson(scientificUnits, "单位"),
        parameters: { ...parseScientificJson(scientificParameters, "参数"), recipe_key: scientificRecipe },
        confirmed: confirm
      });
      setScientificDatasets(current => current.map(item => item.id === updated.id ? updated : item));
      setScientificParameters(JSON.stringify(updated.parameters));
      setScientificResult(current => current ? { ...current, is_stale: true } : null);
      setScientificMessage(confirm ? "已人工确认数据，可以运行固定算法。" : "科研数据修订已保存，请重新核对并确认；旧分析已标记过期。 ");
    } catch (caught) {
      setScientificMessage(caught instanceof Error ? caught.message : "科研数据保存失败");
    } finally {
      setScientificBusy(false);
    }
  }

  async function runScientificRecipe() {
    if (selectedDatasetId === null) return;
    setScientificBusy(true);
    setScientificMessage("");
    try {
      const result = await api.runScientificAnalysis(selectedDatasetId, scientificRecipe, parseScientificJson(scientificParameters, "参数"));
      setScientificResult(result);
      setScientificMessage("固定算法已完成计算，请结合原始数据复核结果。 ");
    } catch (caught) {
      setScientificMessage(caught instanceof Error ? caught.message : "科研分析失败");
    } finally {
      setScientificBusy(false);
    }
  }

  async function analyzeCurrentReport() {
    if (!(activeTab in REPORT_FIELDS_BY_TAB)) return;
    const current = REPORT_FIELDS_BY_TAB[activeTab as keyof typeof REPORT_FIELDS_BY_TAB];
    setBusy(true);
    setMessage("");
    try {
      const result = await api.analyzeReport(id, current.type);
      const report = result[current.field];
      if (!report) throw new Error("模型未返回当前模块的独立报告字段");
      setAnalysis(previous => ({
        quick_understanding: previous?.quick_understanding || "",
        quick_prompt_version: previous?.quick_prompt_version || "",
        quick_schema_version: previous?.quick_schema_version || "",
        quick_evidence_status: previous?.quick_evidence_status || "",
        layman_understanding: previous?.layman_understanding || "",
        layman_prompt_version: previous?.layman_prompt_version || "",
        layman_schema_version: previous?.layman_schema_version || "",
        layman_evidence_status: previous?.layman_evidence_status || "",
        reviewer_analysis: previous?.reviewer_analysis || "",
        reviewer_prompt_version: previous?.reviewer_prompt_version || "",
        reviewer_schema_version: previous?.reviewer_schema_version || "",
        reviewer_evidence_status: previous?.reviewer_evidence_status || "",
        [current.field]: report,
        [current.promptField]: result.prompt_version,
        [current.schemaField]: result.schema_version,
        [current.evidenceField]: result.evidence_status
      }));
      setMessage(`${current.label}已独立生成；另外两份报告未被覆盖。`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "分析失败");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      const result = await api.saveNote(id, note);
      setMessage(result.message || "笔记已保存。");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function analyzeSelectedVisual() {
    if (selectedVisualId === null) return;
    setVisualBusy(true);
    setVisualMessage("");
    try {
      const updated = await api.analyzeVisual(id, selectedVisualId);
      setVisuals(items =>
        items.map(item => (item.id === updated.id ? updated : item))
      );
      setVisualMessage("图表分析已保存，请结合原始页面和测试条件核对。");
    } catch (caught) {
      setVisualMessage(
        caught instanceof Error ? caught.message : "图表分析失败"
      );
    } finally {
      setVisualBusy(false);
    }
  }

  async function rebuildClaims() {
    setClaimsBusy(true);
    setClaimsFeedback("");
    setClaimsError("");
    setMessage("");
    try {
      const result = await api.rebuildClaims(id);
      setClaims(result.items);
      setClaimsFeedback(result.items.length
        ? `已建立 ${result.items.length} 条结论—证据映射。点击证据页码可回到原文核验。`
        : "未找到可核验的结论，请先生成包含结论的论文分析。");
    } catch (caught) {
      setClaimsError(
        caught instanceof Error ? caught.message : "结论—证据映射失败"
      );
    } finally {
      setClaimsBusy(false);
    }
  }

  async function askPaper(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = paperQuestion.trim();
    if (normalized.length < 2 || normalized.length > 500 || askingRef.current) return;
    askingRef.current = true;
    setPaperQuestionBusy(true);
    setPaperQuestionStatus("working");
    setPaperQuestionError("");
    const startedAt = performance.now();
    setPaperQuestionStartedAt(startedAt);
    setPaperQuestionElapsedMs(0);
    try {
      const result = await api.askPaperKnowledge(
        id,
        normalized,
        6,
        paperAnswers.slice(-4).map(item => ({
          question: item.question,
          answer_markdown: item.answer_markdown
        }))
      );
      setPaperAnswers(current => [...current, result]);
      setPaperQuestion("");
      setPaperQuestionStatus("success");
    } catch (caught) {
      const error = caught instanceof Error ? caught.message : "本篇论文追问失败";
      setPaperQuestionError(error);
      setPaperQuestionStatus("error");
      setMessage(error);
    } finally {
      setPaperQuestionElapsedMs(performance.now() - startedAt);
      askingRef.current = false;
      setPaperQuestionBusy(false);
    }
  }

  async function savePaperConversation() {
    if (!paperAnswers.length || askingRef.current || savingConversationRef.current) return;
    savingConversationRef.current = true;
    setPaperConversationSaveBusy(true);
    try {
      await api.saveConversation(paperAnswers, Number(id));
      setMessage("本篇会话已保存为只读历史快照。");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "保存本篇会话失败");
    } finally {
      savingConversationRef.current = false;
      setPaperConversationSaveBusy(false);
    }
  }

  async function compareWithExternalSources(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = externalQuestion.trim();
    if (normalized.length < 2) return;
    setExternalBusy(true);
    try {
      setExternalComparison(await api.externalComparePaper(id, normalized));
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "外部来源比较失败");
    } finally {
      setExternalBusy(false);
    }
  }

  function cropPoint(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalize = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
    return {
      x: normalize(Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))),
      y: normalize(Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)))
    };
  }

  function updateCropSelection(start: { x: number; y: number }, end: { x: number; y: number }) {
    setCropSelection({
      left: Math.round(Math.min(start.x, end.x) * 1_000_000) / 1_000_000,
      top: Math.round(Math.min(start.y, end.y) * 1_000_000) / 1_000_000,
      width: Math.round(Math.abs(end.x - start.x) * 1_000_000) / 1_000_000,
      height: Math.round(Math.abs(end.y - start.y) * 1_000_000) / 1_000_000
    });
  }

  async function saveCrop(selectedVisual: PaperVisual | undefined) {
    if (!selectedVisual || !cropSelection || cropSelection.width < 0.01 || cropSelection.height < 0.01) return;
    setVisualBusy(true);
    try {
      const crop = await api.savePaperCrop(id, selectedVisual.id, { ...cropSelection, label: "" });
      setCrops(current => [crop, ...current]);
      setCropSelection(null);
      setVisualMessage("裁切区域已保存；只有点击分析按钮时才会发送该区域给视觉模型。");
    } catch (caught) {
      setVisualMessage(caught instanceof Error ? caught.message : "保存裁切区域失败");
    } finally {
      setVisualBusy(false);
    }
  }

  async function analyzeCrop(cropId: number) {
    setVisualBusy(true);
    try {
      const updated = await api.analyzePaperCrop(cropId);
      setCrops(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (caught) {
      setVisualMessage(caught instanceof Error ? caught.message : "裁切区域分析失败");
    } finally {
      setVisualBusy(false);
    }
  }

  async function extractCropData(cropId: number) {
    setVisualBusy(true);
    try {
      const updated = await api.extractPaperCropData(cropId);
      setCrops(current => current.map(item => item.id === updated.id ? updated : item));
    } catch (caught) {
      setVisualMessage(caught instanceof Error ? caught.message : "图表结构化提取失败");
    } finally {
      setVisualBusy(false);
    }
  }

  async function deleteCrop(cropId: number, selectedVisual: PaperVisual | undefined) {
    if (!selectedVisual) return;
    setVisualBusy(true);
    try {
      await api.deletePaperCrop(id, selectedVisual.id, cropId);
      setCrops(current => current.filter(item => item.id !== cropId));
    } catch (caught) {
      setVisualMessage(caught instanceof Error ? caught.message : "删除裁切区域失败");
    } finally {
      setVisualBusy(false);
    }
  }

  const hasLocalPdf =
    Boolean(paper?.file_hash) && paper?.acquisition_status === "fulltext";
  const authors = Array.isArray(paper?.authors)
    ? (paper?.authors as string[]).join("、")
    : paper?.authors;
  const boundedCurrentPage = Math.min(
    Math.max(currentPage, 1),
    Math.max(paper?.page_count || 1, 1)
  );
  const selectedVisual =
    visuals.find(item => item.id === selectedVisualId) ??
    visuals.find(item => item.page_number === boundedCurrentPage);

  return {
    id,
    router,
    paper,
    analysis,
    note,
    setNote,
    visuals,
    claims,
    claimsBusy,
    claimsFeedback,
    claimsError,
    selectedVisualId,
    setSelectedVisualId,
    currentPage,
    setCurrentPage,
    visualMessage,
    visualBusy,
    paperQuestion,
    setPaperQuestion,
    paperAnswers,
    paperQuestionBusy,
    paperQuestionStatus,
    paperQuestionError,
    paperQuestionStartedAt,
    paperQuestionElapsedMs,
    paperConversationSaveBusy,
    externalQuestion,
    setExternalQuestion,
    externalComparison,
    externalBusy,
    crops,
    formulas,
    transcribeFormula,
    appendFormula,
    cropSelection,
    setCropSelection,
    cropStart,
    setCropStart,
    message,
    setMessage,
    busy,
    pdfVariant,
    setPdfVariant,
    ocrRuns,
    ocrBusy,
    parserStatus,
    parseCandidates,
    parseComparison,
    parseCandidateBusy,
    selectedEvidence,
    evidenceMessage,
    scientificDatasets,
    scientificRecipes,
    selectedDatasetId,
    setSelectedDatasetId,
    scientificData,
    setScientificData,
    scientificUnits,
    setScientificUnits,
    scientificParameters,
    setScientificParameters,
    scientificRecipe,
    setScientificRecipe,
    scientificResult,
    scientificBusy,
    scientificMessage,
    activeTab,
    setActiveTab,
    glossary,
    glossaryAnswers,
    glossaryQuestion,
    setGlossaryQuestion,
    glossaryBusy,
    glossaryAskBusy,
    glossaryError,
    generateGlossary,
    askGlossary,
    stopGlossaryAsk,
    hasLocalPdf,
    authors,
    boundedCurrentPage,
    selectedVisual,
    startOcr,
    enhanceCurrentPage,
    startParseCandidate,
    compareParseCandidate,
    activateParseCandidate,
    cancelParseCandidate,
    selectEvidence,
    createScientificDraft,
    saveScientificDataset,
    runScientificRecipe,
    analyzeCurrentReport,
    save,
    analyzeSelectedVisual,
    rebuildClaims,
    askPaper,
    savePaperConversation,
    appendNoteDraft,
    draftBusy,
    challenge,
    challengeAnswers,
    setChallengeAnswers,
    openChallenge,
    compareWithExternalSources,
    cropPoint,
    updateCropSelection,
    saveCrop,
    analyzeCrop,
    extractCropData,
    deleteCrop,
  };
}
