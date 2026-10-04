"use client";

import React, { useEffect, useState } from "react";
import LatticeLoader from "../../components/react-bits/LatticeLoader";
import GlideSelect from "../../components/react-bits/GlideSelect";
import { MarkdownContent } from "../../components/MarkdownContent";
import { StatusBadge } from "../../components/WorkspacePrimitives";
import IdeasIonScene from "../../components/workspace/IdeasIonScene";
import TitleMotion from "../../components/workspace/TitleMotion";
import { api, ExperimentDesign, Paper, ResearchExport, ResearchIdea, ScientificAnalysis, ScientificDataset } from "../../lib/api";
import "../../components/workspace/ideas-ion.css";
import "../../components/workspace/research-tools-flow.css";

const ideaFields = [["title", "选题名称"], ["hypothesis", "可检验假设"], ["evidence", "证据"], ["novelty", "创新点"], ["falsification", "证伪条件"], ["feasibility", "可行性"], ["resources", "所需资源"], ["evidence_gaps", "证据缺口"]] as const;
const designFields = [["variables", "变量"], ["controls", "对照"], ["replication", "重复"], ["randomization", "随机化"], ["measurement", "测量"], ["statistics", "统计"], ["stopping_criteria", "停止准则"], ["resources", "资源"], ["risks", "风险"]] as const;
type IdeaField = typeof ideaFields[number][0];
type DesignField = typeof designFields[number][0];
type IdeaDraft = Record<IdeaField, string>;
type DesignDraft = Record<DesignField | "title", string>;
const emptyIdea = (): IdeaDraft => Object.fromEntries(ideaFields.map(([field]) => [field, ""])) as IdeaDraft;
const fromIdea = (item: ResearchIdea): IdeaDraft => Object.fromEntries(ideaFields.map(([field]) => [field, item[field]])) as IdeaDraft;
const fromDesign = (item: ExperimentDesign): DesignDraft => Object.fromEntries(["title", ...designFields.map(([field]) => field)].map(field => [field, item[field as keyof ExperimentDesign]])) as DesignDraft;

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<ResearchIdea[]>([]);
  const [datasets, setDatasets] = useState<ScientificDataset[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [ideaDraft, setIdeaDraft] = useState<IdeaDraft>(emptyIdea);
  const [editingIdeaId, setEditingIdeaId] = useState<number | null>(null);
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<number[]>([]);
  const [selectedAnalysisIds, setSelectedAnalysisIds] = useState<number[]>([]);
  const [analyses, setAnalyses] = useState<ScientificAnalysis[]>([]);
  const [designs, setDesigns] = useState<Record<number, ExperimentDesign[]>>({});
  const [quiet, setQuiet] = useState(false);
  const [design, setDesign] = useState<ExperimentDesign | null>(null);
  const [designDraft, setDesignDraft] = useState<DesignDraft | null>(null);
  const [exportItem, setExportItem] = useState<ResearchExport | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { Promise.all([api.researchIdeas(), api.allScientificDatasets(), api.papers({ page: 1, page_size: 100 })]).then(async ([nextIdeas, nextDatasets, nextPapers]) => { setIdeas(nextIdeas); setDatasets(nextDatasets.items); setPapers(nextPapers.items); setDesigns(Object.fromEntries(await Promise.all(nextIdeas.map(async item => [item.id, await api.experimentDesigns(item.id)] as const)))); }).catch(error => setMessage(error.message)).finally(() => setLoaded(true)); }, []);
  useEffect(() => { let active = true; setSelectedAnalysisIds([]); setAnalyses([]); if (selectedDatasetIds.length) Promise.all(selectedDatasetIds.map(id => api.scientificDatasetAnalyses(id))).then(groups => { if (active) setAnalyses(groups.flat().filter(item => selectedDatasetIds.includes(item.dataset_id))); }).catch(error => { if (active) setMessage(error.message); }); return () => { active = false; }; }, [selectedDatasetIds]);
  useEffect(() => { setExportItem(null); }, [selectedDatasetIds, selectedPaperIds, selectedAnalysisIds]);
  async function run(action: () => Promise<void>) { if (busy) return; setMessage(""); setBusy(true); try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : "操作失败"); } finally { setBusy(false); } }
  function toggle(id: number, values: number[], setter: (ids: number[]) => void) { setter(values.includes(id) ? values.filter(value => value !== id) : [...values, id]); }
  async function saveIdea(event: React.FormEvent) { event.preventDefault(); await run(async () => { const item = editingIdeaId === null ? await api.createResearchIdea({ ...ideaDraft, paper_ids: selectedPaperIds, dataset_ids: selectedDatasetIds }) : await api.updateResearchIdea(editingIdeaId, { ...ideaDraft, paper_ids: selectedPaperIds, dataset_ids: selectedDatasetIds }); setIdeas(current => editingIdeaId === null ? [item, ...current] : current.map(entry => entry.id === item.id ? item : entry)); if (editingIdeaId !== null) { setDesigns(current => ({ ...current, [item.id]: (current[item.id] || []).map(entry => ({ ...entry, ai_review: "" })) })); if (design?.idea_id === item.id) setDesign(current => current ? { ...current, ai_review: "" } : null); } setEditingIdeaId(null); setIdeaDraft(emptyIdea()); }); }
  async function createDesign(item: ResearchIdea) { await run(async () => { const created = await api.createExperimentDesign({ idea_id: item.id, title: `${item.title}实验设计`, ...Object.fromEntries(designFields.map(([field]) => [field, ""])) }); setDesigns(current => ({ ...current, [item.id]: [created, ...(current[item.id] || [])] })); setDesign(created); setDesignDraft(fromDesign(created)); }); }
  async function openDesign(id: number) { await run(async () => { const saved = await api.experimentDesign(id); setDesign(saved); setDesignDraft(fromDesign(saved)); }); }
  async function saveDesign(event: React.FormEvent) { event.preventDefault(); if (!design || !designDraft) return; await run(async () => { const updated = await api.updateExperimentDesign(design.id, designDraft); setDesign(updated); setDesignDraft(fromDesign(updated)); if (updated.idea_id !== null) setDesigns(current => ({ ...current, [updated.idea_id!]: (current[updated.idea_id!] || []).map(entry => entry.id === updated.id ? updated : entry) })); }); }
  async function reviewDesign() { if (!design || !designDraft) return; await run(async () => { const saved = await api.updateExperimentDesign(design.id, designDraft); setDesign(saved); setDesignDraft(fromDesign(saved)); const reviewed = await api.reviewExperimentDesign(saved.id); setDesign(reviewed); setDesignDraft(fromDesign(reviewed)); }); }
  async function createExport(format: "markdown" | "docx" | "pptx") { await run(async () => { setExportItem(await api.createResearchExport({ title: "所选证据与分析综述", export_type: format, paper_ids: selectedPaperIds, dataset_ids: selectedDatasetIds, analysis_ids: selectedAnalysisIds })); }); }

  return <section className="ideas-ion-page">
    <div className="ideas-ion-stage" onFocusCapture={() => setQuiet(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setQuiet(false); }}>
      <IdeasIonScene selectedDataset={selectedDatasetIds[0] || null} quiet={quiet} />
      <div className="ideas-ion-heading">
        <p className="ideas-ion-eyebrow">RESEARCH IDEAS / 材料研究</p>
        <h1><TitleMotion text="科研想法与实验设计" variant="focus" /></h1>
        
        <StatusBadge tone="quiet">证据包限定</StatusBadge>
      </div>
      <section className="ideas-ion-entry" aria-label="科研想法来源">
        <div className="ideas-ion-entry-column">
          <p className="ideas-ion-column-number">01 / YOUR QUESTION</p>
          <h2>{editingIdeaId === null ? "用户立题" : "编辑科研想法"}</h2>
          
          <form onSubmit={saveIdea}>{ideaFields.map(([field, label]) => <label key={field}>{label}{field === "title" ? <input aria-label={label} required value={ideaDraft[field]} onChange={event => setIdeaDraft(current => ({ ...current, [field]: event.target.value }))} /> : <textarea aria-label={label} value={ideaDraft[field]} onChange={event => setIdeaDraft(current => ({ ...current, [field]: event.target.value }))} />}</label>)}<button disabled={busy} type="submit">{editingIdeaId === null ? "保存科研想法" : "保存想法修改"}</button></form>
        </div>
        <div className="ideas-ion-entry-column ideas-ion-evidence-entry">
          <p className="ideas-ion-column-number">02 / SELECTED EVIDENCE</p>
          <h2>明确选择证据</h2>
          
          <label>选择数据集<GlideSelect value={selectedDatasetIds[0] ?? ""} onChange={value => setSelectedDatasetIds(value ? [Number(value)] : [])} options={[{ value: "", label: "请选择" }, ...datasets.map(item => ({ value: String(item.id), label: item.name }))]} /></label>
          <div className="ideas-evidence-list" aria-label="追加数据集">{datasets.map(item => <label key={item.id}><input type="checkbox" checked={selectedDatasetIds.includes(item.id)} onChange={() => toggle(item.id, selectedDatasetIds, setSelectedDatasetIds)} />{item.name} · {item.quality?.reviewed ? "已核对" : "待复核"}</label>)}</div>
          <div className="ideas-evidence-list" aria-label="选择论文">{papers.map(item => <label key={item.id}><input type="checkbox" checked={selectedPaperIds.includes(Number(item.id))} onChange={() => toggle(Number(item.id), selectedPaperIds, setSelectedPaperIds)} />{item.title} · 全文状态：{item.fulltext_status}</label>)}</div>
          <button type="button" disabled={busy || (!selectedDatasetIds.length && !selectedPaperIds.length)} onClick={() => run(async () => { const item = await api.generateResearchIdea(selectedPaperIds, selectedDatasetIds); setIdeas(current => [item, ...current]); setDesigns(current => ({ ...current, [item.id]: [] })); })}>生成候选选题</button>
          <p className="ideas-ion-source-note">只有勾选的论文与数据集进入候选生成；证据范围以实际来源状态为准。</p>
        </div>
      </section>
      <div className="ideas-ion-stage-foot">
        <span>材料示意 · 非实验数据或结构模拟</span>
        {!loaded && !message && <LatticeLoader label="正在读取科研想法与数据集…" showTimer />}
        {busy && <LatticeLoader label="正在处理科研想法…" showTimer />}
        {message && <p className="ideas-ion-message" role="alert">{message}</p>}
      </div>
    </div>

    <div className="ideas-ion-content">
      <section className="ideas-ion-list" aria-labelledby="ideas-list-title">
        <div className="ideas-ion-section-heading"><div><p>RESEARCH QUESTIONS / {String(ideas.length).padStart(2, "0")}</p><h2 id="ideas-list-title">已有想法</h2></div><span>{ideas.length} 项</span></div>
        <div className="ideas-ion-list-items">{ideas.map(item => <article className="ideas-ion-item" key={item.id}>
          <div className="ideas-ion-item-heading"><StatusBadge tone={item.source_mode === "user" ? "neutral" : "warning"}>{item.source_mode === "user" ? "用户立题" : "所选证据生成"}</StatusBadge><h3>{item.title}</h3><p>{item.source_mode === "user" ? "来源：用户提出的研究问题" : `来源：已选论文 ${item.selected_paper_ids.length} 项 · 数据集 ${item.selected_dataset_ids.length} 项`}</p></div>
          <div className="ideas-ion-item-facts">
            <section><h4>假设</h4><p>{item.hypothesis || "尚未填写可检验假设。"}</p></section>
            <section><h4>证据</h4><p>{item.evidence || "尚未整理支持该想法的证据。"}</p></section>
            <section><h4>缺口</h4><p>{item.evidence_gaps || "尚未记录证据缺口。"}</p></section>
          </div>
          <div className="ideas-item-actions"><button type="button" className="secondary" disabled={busy} onClick={() => { setEditingIdeaId(item.id); setIdeaDraft(fromIdea(item)); setSelectedPaperIds(item.selected_paper_ids); setSelectedDatasetIds(item.selected_dataset_ids); }}>编辑想法</button><button type="button" className="secondary" disabled={busy} onClick={() => void createDesign(item)}>建立实验检查表</button></div>
          {(designs[item.id] || []).map(saved => <button type="button" className="ideas-saved-design" key={saved.id} disabled={busy} onClick={() => void openDesign(saved.id)}>打开{saved.title}</button>)}
        </article>)}</div>
        {loaded && !ideas.length && <div className="ideas-ion-empty"><p>尚无科研想法。先提出一个可检验假设，或明确选择证据生成候选。</p></div>}
      </section>
      {design && designDraft && <section className="ideas-ion-panel ideas-ion-design"><div><p className="ideas-ion-panel-kicker">EXPERIMENT CHECKLIST</p><h2>{design.title}</h2></div><form className="ideas-design-form" onSubmit={saveDesign}><label>设计标题<input value={designDraft.title} onChange={event => setDesignDraft(current => current && ({ ...current, title: event.target.value }))} /></label>{designFields.map(([field, label]) => <label key={field}>{label}<textarea aria-label={label} value={designDraft[field]} onChange={event => setDesignDraft(current => current && ({ ...current, [field]: event.target.value }))} /></label>)}<button disabled={busy} type="submit">保存实验设计</button></form>{design.deterministic_findings.map(item => <p key={item.field}><StatusBadge tone={item.status === "present" ? "ready" : "warning"}>{item.status === "present" ? "已填写" : "缺失"}</StatusBadge> {designFields.find(([field]) => field === item.field)?.[1] || item.field} · {item.message}</p>)}<button disabled={busy} onClick={() => void reviewDesign()}>保存并触发 AI 审查</button>{design.ai_review && <div className="ideas-review"><h3>AI 审查</h3><MarkdownContent content={design.ai_review} /></div>}</section>}
      <section className="ideas-ion-panel ideas-ion-export"><div><p className="ideas-ion-panel-kicker">SELECTED EVIDENCE PACKAGE</p><h2>所选证据与分析导出</h2></div><p>仅导出明确选择的论文、数据集与分析；不会自动包含未选择的想法内容。结果和出处仍须回到原始记录核验。</p><div className="ideas-evidence-list" aria-label="选择分析记录">{analyses.filter(item => selectedDatasetIds.includes(item.dataset_id) && item.status === "completed" && !item.is_stale).map(item => <label key={item.id}><input type="checkbox" checked={selectedAnalysisIds.includes(item.id)} onChange={() => toggle(item.id, selectedAnalysisIds, setSelectedAnalysisIds)} />分析 #{item.id} · 数据集 #{item.dataset_id} · {item.recipe}</label>)}</div><div className="ideas-export-actions"><button disabled={busy || (!selectedPaperIds.length && !selectedDatasetIds.length)} onClick={() => void createExport("markdown")}>生成 Markdown</button><button disabled={busy || (!selectedPaperIds.length && !selectedDatasetIds.length)} onClick={() => void createExport("docx")}>生成 Word</button><button disabled={busy || (!selectedPaperIds.length && !selectedDatasetIds.length)} onClick={() => void createExport("pptx")}>生成 PPT</button></div>{exportItem && <div className="ideas-export-result"><p>{exportItem.export_type.toUpperCase()} 已生成 · 论文 {exportItem.selected_paper_ids.length} · 数据集 {exportItem.selected_dataset_ids.length} · 分析 {exportItem.selected_analysis_ids.length}</p><a href={api.researchExportUrl(exportItem.id)} download>下载 {exportItem.export_type.toUpperCase()}</a><div className="research-markdown-preview"><MarkdownContent content={exportItem.markdown} /></div></div>}</section>
    </div>
  </section>;
}
