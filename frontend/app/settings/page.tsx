"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";
import GlideSelect from "../../components/react-bits/GlideSelect";
import SettingsModelPicker from "../../components/workspace/SettingsModelPicker";

import React, { useEffect, useRef, useState } from "react";

import { WorkspaceHeader } from "../../components/WorkspacePrimitives";
import { api, DocumentAiStatus, Settings } from "../../lib/api";
import { MODEL_PROVIDERS, modelChoices } from "../../lib/modelCatalog";
import {
  applyDocumentVisionPreset,
  applyProviderPreset,
  credentialForSelectedProvider,
  describeCredential,
  modelConfigurationSaved,
  providerNeedsApiKey,
  SettingsFormValues,
  toSettingsPayload
} from "../../lib/presentation";
import "../../components/workspace/system-refinement.css";

const empty: SettingsFormValues = {
  model_provider: "mock",
  model_name: "",
  vision_model: "",
  model_base_url: "",
  api_key: "",
  timeout_seconds: "60",
  backup_model: "",
  paper_budget: "0",
  daily_budget: "0",
  monthly_budget: "0"
};

const campusBudgetPresets = [
  { label: "低 · 20/天", limit: "20" },
  { label: "标准 · 100/天", limit: "100" },
  { label: "高 · 不限", limit: "0" }
];

function campusBudgetNumber(value: string, minimum: number, maximum?: number): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && (maximum === undefined || parsed <= maximum) ? parsed : null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>();
  const [form, setForm] = useState<SettingsFormValues>(empty);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelListMessage, setModelListMessage] = useState("");
  const modelRequest = useRef(0);
  const selectedProvider = useRef("mock");
  const customModel = useRef<{ model: string; baseUrl: string; backup: string } | null>(null);
  const customVision = useRef<{ model: string; baseUrl: string } | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentAiStatus>();
  const [documentForm, setDocumentForm] = useState({
    document_vision_provider: "mock",
    document_vision_model: "",
    document_vision_base_url: "",
    document_vision_timeout_seconds: "90",
    document_vision_api_key: ""
  });
  const [campusForm, setCampusForm] = useState({ dailyLimit: "20", maxTokens: "2400" });

  useEffect(() => {
    api.settings()
      .then((value) => {
        setSettings(value);
        selectedProvider.current = value.model_provider || "mock";
        if (value.model_provider === "openai_compatible") customModel.current = { model: value.model_name || "", baseUrl: value.model_base_url || "", backup: value.backup_model || "" };
        if (value.document_vision_provider === "openai_compatible" || value.document_vision_provider === "openai-compatible") customVision.current = { model: value.document_vision_model || "", baseUrl: value.document_vision_base_url || "" };
        setForm({
          model_provider: value.model_provider || "mock",
          model_name: value.model_name || "",
          vision_model: value.vision_model || "",
          model_base_url: value.model_base_url || "",
          api_key: "",
          timeout_seconds: String(value.timeout_seconds || 60),
          backup_model: value.backup_model || "",
          paper_budget: String(value.paper_budget ?? 0),
          daily_budget: String(value.daily_budget ?? 0),
          monthly_budget: String(value.monthly_budget ?? 0)
        });
        setDocumentForm({
          document_vision_provider: value.document_vision_provider === "openai-compatible" ? "openai_compatible" : value.document_vision_provider || "mock",
          document_vision_model: value.document_vision_model || "",
          document_vision_base_url: value.document_vision_base_url || "",
          document_vision_timeout_seconds: String(value.document_vision_timeout_seconds || 90),
          document_vision_api_key: ""
        });
        setCampusForm({ dailyLimit: String(value.campus_ai_daily_limit ?? 20), maxTokens: String(value.campus_ai_max_tokens ?? 2400) });
      })
      .catch((error) => setMessage(error.message));
    if (typeof api.documentAiStatus === "function") api.documentAiStatus().then(setDocumentStatus).catch(() => undefined);
  }, []);

  const update = (key: keyof SettingsFormValues, value: string) => {
    if (form.model_provider === "openai_compatible") {
      const previous = customModel.current || { model: form.model_name, baseUrl: form.model_base_url, backup: form.backup_model };
      if (key === "model_name") customModel.current = { ...previous, model: value };
      if (key === "model_base_url") customModel.current = { ...previous, baseUrl: value };
      if (key === "backup_model") customModel.current = { ...previous, backup: value };
    }
    setForm(current => ({ ...current, [key]: value }));
  };

  const updateProvider = (provider: string) => {
    if (form.model_provider === "openai_compatible") customModel.current = { model: form.model_name, baseUrl: form.model_base_url, backup: form.backup_model };
    selectedProvider.current = provider;
    modelRequest.current += 1;
    setAvailableModels([]);
    setModelListMessage("");
    setForm(current => {
      const next = applyProviderPreset(current, provider);
      return provider === "openai_compatible" && customModel.current
        ? { ...next, model_name: customModel.current.model, model_base_url: customModel.current.baseUrl, backup_model: customModel.current.backup }
        : next;
    });
  };

  const updateDocumentProvider = (provider: string) => {
    if (documentForm.document_vision_provider === "openai_compatible") customVision.current = { model: documentForm.document_vision_model, baseUrl: documentForm.document_vision_base_url };
    setDocumentForm(current => {
      const next = applyDocumentVisionPreset(current, provider);
      return provider === "openai_compatible" && customVision.current
        ? { ...next, document_vision_model: customVision.current.model, document_vision_base_url: customVision.current.baseUrl }
        : next;
    });
  };

  const updateDocument = (key: "document_vision_model" | "document_vision_base_url", value: string) => {
    if (documentForm.document_vision_provider === "openai_compatible") {
      const previous = customVision.current || { model: documentForm.document_vision_model, baseUrl: documentForm.document_vision_base_url };
      customVision.current = key === "document_vision_model" ? { ...previous, model: value } : { ...previous, baseUrl: value };
    }
    setDocumentForm(current => ({ ...current, [key]: value }));
  };

  async function refreshModels() {
    const provider = form.model_provider;
    const request = ++modelRequest.current;
    setModelListMessage("正在读取已保存供应商的模型目录…");
    try {
      const result = await api.modelOptions();
      if (request !== modelRequest.current || provider !== selectedProvider.current) return;
      setAvailableModels(result.models);
      setModelListMessage(result.message);
    } catch (error) {
      if (request !== modelRequest.current || provider !== selectedProvider.current) return;
      setModelListMessage(error instanceof Error ? error.message : "模型目录读取失败");
    }
  }

  async function save() {
    const dailyLimit = campusBudgetNumber(campusForm.dailyLimit, 0);
    const maxTokens = campusBudgetNumber(campusForm.maxTokens, 128, 32768);
    if (dailyLimit === null || maxTokens === null) {
      setMessage("校园资讯 AI 预算须为整数：每日最大整理数不少于 0，单条最大 Token 为 128–32768。");
      return;
    }
    setBusy(true);
    try {
      const documentPayload: Record<string, string | number> = {
        document_vision_provider: documentForm.document_vision_provider,
        document_vision_model: documentForm.document_vision_model,
        document_vision_base_url: documentForm.document_vision_base_url,
        document_vision_timeout_seconds: Number(documentForm.document_vision_timeout_seconds)
      };
      if (documentForm.document_vision_api_key.trim()) documentPayload.document_vision_api_key = documentForm.document_vision_api_key.trim();
      const saved = await api.saveSettings({ ...toSettingsPayload(form), ...documentPayload, campus_ai_daily_limit: dailyLimit, campus_ai_max_tokens: maxTokens });
      setSettings(saved);
      setCampusForm({ dailyLimit: String(saved.campus_ai_daily_limit ?? dailyLimit), maxTokens: String(saved.campus_ai_max_tokens ?? maxTokens) });
      setForm((current) => ({ ...current, api_key: "" }));
      setDocumentForm((current) => ({ ...current, document_vision_api_key: "" }));
      setMessage("设置已保存。输入的密钥仅会传给后端一次，之后不会显示或回填。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  async function installDocumentAi() {
    if (!window.confirm("将下载固定版本的 PP-StructureV3 本地模型到独立 Docker 模型卷。继续吗？")) return;
    setBusy(true);
    try {
      await api.installDocumentAi();
      setMessage("模型下载已启动；可稍后刷新查看状态和 CPU/GPU 能力。");
      setDocumentStatus(await api.documentAiStatus());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "模型下载启动失败");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      const result = await api.testModel();
      setMessage(result.message || (result.ok ? "模型连接成功。" : "模型连接不可用。"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "测试失败");
    } finally {
      setBusy(false);
    }
  }

  const modelSaved = modelConfigurationSaved(settings, form);

  return (
    <section className="editorial-page settings-page system-refined">
      <WorkspaceHeader eyebrow="SYSTEM · CONFIGURATION" title="系统设置"  artwork />
      <nav className="system-section-nav" aria-label="设置分组">
        <a href="#settings-model">01 模型连接</a>
        <a href="#settings-budget">02 成本控制</a>
        <a href="#settings-campus-budget">03 校园资讯 AI 预算</a>
        <a href="#settings-document">04 文档视觉与 OCR</a>
      </nav>
      {message && <p className={message.includes("失败") || message.includes("不可用") ? "error" : "success"}>{message}</p>}
      {busy && <LatticeLoader label="正在处理设置…" showTimer />}
      <div className="grid system-settings-grid">
        <div className="card system-panel system-panel-model" id="settings-model">
          <div className="system-panel-heading"><span className={`system-panel-glyph system-model-glyph${modelSaved ? " is-saved" : ""}`} aria-hidden="true">◇</span><div><small>MODEL CONNECTION</small><h2>模型连接</h2><span className="system-model-save-state" role="status">{modelSaved ? "配置已保存" : "配置待保存"}</span></div></div>
          <p>API 密钥：<strong>{providerNeedsApiKey(form.model_provider) ? describeCredential(credentialForSelectedProvider(`${settings?.model_provider}|${settings?.model_base_url}`, `${form.model_provider}|${form.model_base_url}`, settings?.api_key || { configured: false })) : "无需配置"}</strong></p>
          <label htmlFor="settings-model-provider">模型供应商</label>
          <GlideSelect id="settings-model-provider" value={form.model_provider} onChange={updateProvider} disabled={busy} menuLayout="grid" options={MODEL_PROVIDERS.map(({ value, label }) => ({ value, label }))} />
          <label htmlFor="settings-model-name">模型名称</label>
          <SettingsModelPicker key={form.model_provider} id="settings-model-name" value={form.model_name} options={modelChoices(form.model_provider, false, availableModels)} onChange={value => update("model_name", value)} placeholder="输入供应商提供的模型 ID" />
          <button type="button" className="secondary" onClick={refreshModels} disabled={busy || form.model_provider !== settings?.model_provider}>刷新已保存供应商的更多模型</button>
          {modelListMessage && <p className="muted">{modelListMessage}</p>}
          {form.model_provider === "ollama" && (
            <>
              <label htmlFor="settings-ollama-vision">本机视觉模型</label>
              <SettingsModelPicker id="settings-ollama-vision" value={form.vision_model} options={modelChoices("ollama", true)} onChange={value => update("vision_model", value)} placeholder="例如 qwen2.5vl:3b" />
              <p className="muted">Ollama 在本机运行，不需要 API 密钥。文本与视觉模型会分别检查。</p>
              {!availableModels.length && (
                <p className="muted">
                  文本模型：ollama pull qwen2.5:7b；视觉模型：ollama pull qwen2.5vl:3b（约 3.2 GB）。
                </p>
              )}
            </>
          )}
          {providerNeedsApiKey(form.model_provider) && (
            <p className="muted">切换供应商后，请在本机输入该供应商的 API 密钥；页面不会回显已保存的密钥。</p>
          )}
          <label>API 基础地址</label>
          <input value={form.model_base_url} onChange={(event) => update("model_base_url", event.target.value)} placeholder="https://api.example.com/v1" />
          {providerNeedsApiKey(form.model_provider) && (
            <>
              <label>输入或更换 API 密钥</label>
              <input type="password" value={form.api_key} onChange={(event) => update("api_key", event.target.value)} autoComplete="new-password" placeholder={settings?.model_provider === form.model_provider && settings?.model_base_url === form.model_base_url ? "留空保留此连接已保存的密钥" : "请输入所选连接的密钥"} />
            </>
          )}
          <label>备用模型</label>
          <input value={form.backup_model} onChange={(event) => update("backup_model", event.target.value)} />
          <label>调用超时（秒）</label>
          <input type="number" value={form.timeout_seconds} onChange={(event) => update("timeout_seconds", event.target.value)} />
          <button className="secondary" onClick={test} disabled={busy}>测试已保存的 API 连接</button>
        </div>
        <div className="card system-panel system-panel-budget" id="settings-budget">
          <div className="system-panel-heading"><span className="system-panel-glyph" aria-hidden="true">¥</span><div><small>SPENDING LIMITS</small><h2>成本控制</h2></div></div>
          <label>单篇论文预算</label>
          <input type="number" step="0.01" value={form.paper_budget} onChange={(event) => update("paper_budget", event.target.value)} />
          <label>每日预算</label>
          <input type="number" step="0.01" value={form.daily_budget} onChange={(event) => update("daily_budget", event.target.value)} />
          <label>每月预算</label>
          <input type="number" step="0.01" value={form.monthly_budget} onChange={(event) => update("monthly_budget", event.target.value)} />
          <p className="muted">Mock 和 Ollama 不产生模型 API 费用；Ollama 会占用本机内存、CPU 或 GPU。</p>
          <button onClick={save} disabled={busy}>{busy ? "正在保存…" : "保存设置"}</button>
        </div>
        <div className="card system-panel system-panel-campus-budget" id="settings-campus-budget">
          <div className="system-panel-heading"><span className="system-panel-glyph" aria-hidden="true">✦</span><div><small>CAMPUS AI BUDGET</small><h2>校园资讯 AI 预算</h2></div></div>
          <div className="campus-budget-presets" role="group" aria-label="每日整理档位">
            {campusBudgetPresets.map(preset => <button key={preset.limit} type="button" className="campus-budget-preset" aria-pressed={campusForm.dailyLimit === preset.limit} disabled={busy} onClick={() => setCampusForm(current => ({ ...current, dailyLimit: preset.limit }))}>{preset.label}</button>)}
          </div>
          <label htmlFor="settings-campus-daily-limit">每日最大整理数</label>
          <input id="settings-campus-daily-limit" type="number" min="0" step="1" inputMode="numeric" value={campusForm.dailyLimit} onChange={event => setCampusForm(current => ({ ...current, dailyLimit: event.target.value }))} disabled={busy} />
          <p className="muted">0 表示不限；按 API 实际费用计费，失败请求也计入每日次数。</p>
          <label htmlFor="settings-campus-max-tokens">单条最大 Token</label>
          <input id="settings-campus-max-tokens" type="number" min="128" max="32768" step="1" inputMode="numeric" value={campusForm.maxTokens} onChange={event => setCampusForm(current => ({ ...current, maxTokens: event.target.value }))} disabled={busy} />
          <p className="muted">输出 Token 上限；输入 Token 另计费。</p>
          <p className="muted">整理优先顺序：科研 → 比赛 → 推免 → 讲座 → 活动。</p>
          <button type="button" onClick={save} disabled={busy}>{busy ? "正在保存…" : "保存校园资讯预算"}</button>
        </div>
        <div className="card document-ai-settings system-panel system-panel-document" id="settings-document">
          <div className="system-panel-heading"><span className="system-panel-glyph" aria-hidden="true">▤</span><div><small>DOCUMENT PROCESSING</small><h2>文档视觉与 OCR</h2></div></div>
          <p className="muted">原生文字层优先；仅低质量页自动使用本地 PP-StructureV3。模型权重首次启用时才下载。</p>
          <p>
            本地模型：<strong>{documentStatus?.local_model.installed ? "已安装" : documentStatus?.local_model.status === "installing" ? "下载中" : "未安装"}</strong>
            {documentStatus && ` · ${documentStatus.capabilities.preferred_device.toUpperCase()} 优先`}
          </p>
          {!documentStatus?.local_model.installed && (
            <button type="button" className="secondary" onClick={installDocumentAi} disabled={busy}>下载 PP-StructureV3</button>
          )}
          <label htmlFor="settings-document-provider">疑难页视觉供应商</label>
          <GlideSelect id="settings-document-provider" value={documentForm.document_vision_provider} onChange={updateDocumentProvider} disabled={busy} menuLayout="grid" options={MODEL_PROVIDERS.filter(item => item.value !== "ollama" && (item.value === "mock" || item.value === "openai_compatible" || item.visionModels.length > 0 || item.value === "siliconflow" || item.value === "openrouter" || item.value === "xai" || item.value === "mistral")).map(({ value, label }) => ({ value, label }))} />
          {documentForm.document_vision_provider !== "mock" && <>
            <label htmlFor="settings-document-model">文档视觉模型</label>
            <SettingsModelPicker key={documentForm.document_vision_provider} id="settings-document-model" value={documentForm.document_vision_model} options={modelChoices(documentForm.document_vision_provider, true)} onChange={value => updateDocument("document_vision_model", value)} placeholder="输入可接收图片的模型 ID" />
            {modelChoices(documentForm.document_vision_provider, true).length === 0 && <p className="muted">该平台的视觉型号随账户或模型目录变化；请填写已确认支持图像输入的模型 ID。</p>}
          </>}
          <label>文档视觉基础地址</label>
          <input value={documentForm.document_vision_base_url} onChange={(event) => updateDocument("document_vision_base_url", event.target.value)} placeholder="https://vision.example/v1" />
          <label>文档视觉超时（秒）</label>
          <input type="number" value={documentForm.document_vision_timeout_seconds} onChange={(event) => setDocumentForm(current => ({ ...current, document_vision_timeout_seconds: event.target.value }))} />
          {documentForm.document_vision_provider !== "mock" && (
            <>
              <p>视觉密钥：<strong>{describeCredential(credentialForSelectedProvider(`${settings?.document_vision_provider === "openai-compatible" ? "openai_compatible" : settings?.document_vision_provider}|${settings?.document_vision_base_url}`, `${documentForm.document_vision_provider}|${documentForm.document_vision_base_url}`, settings?.document_vision_api_key || { configured: false }))}</strong></p>
              <label>输入或更换文档视觉 API 密钥</label>
              <input type="password" autoComplete="new-password" value={documentForm.document_vision_api_key} onChange={(event) => setDocumentForm(current => ({ ...current, document_vision_api_key: event.target.value }))} placeholder={settings?.document_vision_provider === documentForm.document_vision_provider && settings?.document_vision_base_url === documentForm.document_vision_base_url ? "留空保留此连接已保存的密钥" : "请输入所选视觉连接的密钥"} />
            </>
          )}
          
          <button type="button" onClick={save} disabled={busy}>{busy ? "正在保存…" : "保存文档视觉设置"}</button>
        </div>
      </div>
    </section>
  );
}
