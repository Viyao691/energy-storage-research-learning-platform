"use client";

import LatticeLoader from "../../../components/react-bits/LatticeLoader";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { StatusBadge, WorkspaceHeader } from "../../../components/WorkspacePrimitives";
import { api, ContestProject, ContestRuleSet, ContestRubricCheck, ContestSource, ContestTimeline } from "../../../lib/api";
import "../../../components/workspace/tools-refinement.css";
import "../../../components/workspace/contest-refinement.css";

const fields: Array<[keyof ContestProject, string, string]> = [
  ["summary", "项目摘要", "用一段话说明问题、方案与价值"],
  ["research_question", "研究问题", "写成可检验的问题"],
  ["innovation", "创新点", "说明与已有工作的可判别差异"],
  ["method", "研究方法", "说明设计、对照、测量与分析"],
  ["evidence", "证据基础", "列出论文、数据和前期结果"],
  ["feasibility", "可行性", "设备、时间、技能与已有基础"],
  ["expected_outcomes", "预期成果", "样品、数据、论文或原型"],
  ["risks", "风险", "技术、证据、时间与安全边界"],
  ["resources", "资源与分工", "资源需求与负责人"],
];

export default function ContestDetailPage() {
  const id = Number(useParams<{ id: string }>().id);
  const [project, setProject] = useState<ContestProject | null>(null);
  const [sources, setSources] = useState<ContestSource[]>([]);
  const [rules, setRules] = useState<ContestRuleSet | null>(null);
  const [timeline, setTimeline] = useState<ContestTimeline | null>(null);
  const [check, setCheck] = useState<ContestRubricCheck | null>(null);
  const [sourceName, setSourceName] = useState("竞赛通知.txt");
  const [sourceText, setSourceText] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");
  const [answer, setAnswer] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [defense, setDefense] = useState<{ question: string; feedback: string } | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([api.contest(id), api.contestSources(id), api.contestRules(id)])
      .then(([nextProject, nextSources, nextRules]) => { setProject(nextProject); setSources(nextSources); setRules(nextRules); })
      .catch(error => setMessage(error.message));
  }, [id]);

  async function run(action: () => Promise<void>) {
    setMessage("");
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : "操作失败"); }
  }

  if (!project) return <section className="workspace-page">{message ? <p>{message}</p> : <LatticeLoader label="正在载入竞赛项目…" showTimer />}</section>;

  const filledFields = fields.filter(([key]) => String(project[key] || "").trim().length > 0).length;

  return (
    <section className="workspace-page research-tools-refined contest-detail-refined contest-detail">
      <WorkspaceHeader eyebrow="CONTEST PROJECT" title={project.title} description={project.competition_name || "尚未填写竞赛名称"} action={<StatusBadge tone={rules?.status === "confirmed" ? "ready" : "warning"}>{rules?.status === "confirmed" ? "规则已确认" : "规则待确认"}</StatusBadge>} />
      {message && <p className="error">{message}</p>}

      <div className="tools-metrics" aria-label="当前项目概况">
        <div className="tools-metric"><span>九项内容已填写</span><strong>{filledFields}<em> / {fields.length}</em></strong><progress value={filledFields} max={fields.length} aria-label="九项内容填写进度" /><small>仅反映填写情况，不代表科研质量</small></div>
        <div className="tools-metric"><span>已解析规则</span><strong>{rules?.rules.length ?? 0}</strong><small>{rules?.status === "confirmed" ? "评分要求已人工确认" : "请在核对后人工确认"}</small></div>
        <div className="tools-metric"><span>规则来源</span><strong>{sources.length}</strong><small>文字、PDF、图片或 CSV 来源</small></div>
      </div>

      <nav className="contest-section-nav" aria-label="项目工作区"><a href="#contest-proposal">项目论证</a><a href="#contest-sources">规则来源</a><a href="#contest-rules">规则与评分</a><a href="#contest-timeline">时间表</a><a href="#contest-check">评分检查</a><a href="#contest-defense">答辩训练</a></nav>

      <section className="contest-detail-grid">
        <div className="card contest-content-panel" id="contest-proposal">
          <div className="contest-panel-intro"><p className="contest-kicker">PROJECT PROPOSAL</p><h2>项目论证九项内容</h2><p>按问题、方法和落地条件组织论证。保存后可随时继续完善。</p></div>
          <div className="contest-field-group"><h3>研究定位</h3><div className="contest-field-grid">{fields.slice(0, 3).map(([key, label, placeholder]) => <label key={key}>{label}<textarea value={String(project[key] || "")} placeholder={placeholder} onChange={event => setProject({ ...project, [key]: event.target.value })} /></label>)}</div></div>
          <div className="contest-field-group"><h3>方法与证据</h3><div className="contest-field-grid">{fields.slice(3, 6).map(([key, label, placeholder]) => <label key={key}>{label}<textarea value={String(project[key] || "")} placeholder={placeholder} onChange={event => setProject({ ...project, [key]: event.target.value })} /></label>)}</div></div>
          <div className="contest-field-group"><h3>成果与实施</h3><div className="contest-field-grid">{fields.slice(6).map(([key, label, placeholder]) => <label key={key}>{label}<textarea value={String(project[key] || "")} placeholder={placeholder} onChange={event => setProject({ ...project, [key]: event.target.value })} /></label>)}</div></div>
          <button onClick={() => run(async () => { const updated = await api.updateContest(id, Object.fromEntries(fields.map(([key]) => [key, project[key]]))); setProject(updated); })}>保存项目内容</button>
        </div>

        <div className="contest-side-stack">
          <section className="card" id="contest-sources">
            <h2>规则来源</h2><p>粘贴通知文字；PDF、图片与 CSV 上传入口会在来源区按文件类型安全检查。</p>
            <label>来源名称<input value={sourceName} onChange={event => setSourceName(event.target.value)} /></label>
            <label>规则文字<textarea value={sourceText} onChange={event => setSourceText(event.target.value)} /></label>
            <button onClick={() => run(async () => { const item = await api.addContestTextSource(id, { name: sourceName, source_type: "text", content: sourceText }); setSources(current => [...current, item]); setSourceText(""); })}>添加文字来源</button>
            <label>上传 PDF、图片或 CSV<input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv" onChange={event => setSourceFile(event.target.files?.[0] || null)} /></label>
            <button className="secondary" disabled={!sourceFile} onClick={() => run(async () => { if (!sourceFile) return; const item = await api.uploadContestSource(id, sourceFile); setSources(current => [...current, item]); setSourceFile(null); })}>上传规则文件</button>
            <ul>{sources.map(item => <li key={item.id}>{item.name} · {item.locator_count} 个定位 · {item.status}{item.source_type === "image" && item.status === "pending_ocr" ? <button className="secondary" onClick={() => run(async () => { const updated = await api.ocrContestSource(item.id); setSources(current => current.map(value => value.id === updated.id ? updated : value)); })}>识别图片</button> : null}</li>)}</ul>
          </section>

          <section className="card" id="contest-rules">
            <h2>规则与评分表</h2>
            <div className="row"><button onClick={() => run(async () => setRules(await api.parseContestRules(id)))}>解析规则</button><button className="secondary" disabled={!rules?.rules.length || rules.status === "confirmed"} onClick={() => run(async () => setRules(await api.confirmContestRules(id)))}>人工确认</button></div>
            {rules?.rules.map(item => <article key={item.id}><strong>{item.title}</strong><p>{item.deadline || "无截止日期"} · {item.citations.join("、")}</p></article>)}
            {rules?.rubric_items.map(item => <p key={item.id}>{item.title}{item.weight == null ? "" : ` · ${item.weight} 分`}</p>)}
          </section>

          <section className="card" id="contest-timeline">
            <h2>确定性时间表</h2>
            <label>里程碑<input value={milestoneTitle} onChange={event => setMilestoneTitle(event.target.value)} /></label>
            <label>日期<input type="date" value={milestoneDate} onChange={event => setMilestoneDate(event.target.value)} /></label>
            <div className="row"><button onClick={() => run(async () => { await api.createContestMilestone(id, { title: milestoneTitle, due_date: milestoneDate }); setTimeline(await api.generateContestTimeline(id)); })}>添加里程碑</button><button className="secondary" onClick={() => run(async () => setTimeline(await api.generateContestTimeline(id)))}>生成时间表</button></div>
            {timeline?.items.map(item => <p key={item.id}>{item.due_date} · {item.title}</p>)}
            {!timeline && <p className="contest-pending-note">生成后显示实际里程碑与日期。</p>}
          </section>

          <section className="card" id="contest-check">
            <h2>评分检查</h2><button onClick={() => run(async () => setCheck(await api.checkContestRubric(id)))}>按确认评分表检查</button>
            {check?.items.map(item => <article key={item.id}><StatusBadge tone={item.status === "satisfied" ? "ready" : item.status === "partial" ? "warning" : "quiet"}>{{ satisfied: "满足", partial: "部分满足", missing: "缺失" }[item.status]}</StatusBadge><strong>{item.title}</strong><p>{item.questions.join("；")}</p></article>)}
            {!check && <p className="contest-pending-note">完成检查后显示评分表条目与待补充问题。</p>}
          </section>

          <section className="card" id="contest-defense">
            <h2>文字与录音答辩</h2><p>回答由你输入或上传录音；AI 只追问和反馈，不替你虚构证据。录音需要已确认安装的本地 Whisper small 模型。</p>
            <label>本轮回答<textarea value={answer} onChange={event => setAnswer(event.target.value)} /></label>
            <button onClick={() => run(async () => { const session = await api.createDefenseSession(id, "text"); const turn = await api.createDefenseTurn(session.id, answer); setDefense(turn); })}>开始一轮答辩</button>
            <label>录音文件<input type="file" accept="audio/wav,audio/mpeg,audio/mp4,audio/webm,audio/ogg" onChange={event => setAudioFile(event.target.files?.[0] || null)} /></label>
            <button className="secondary" disabled={!audioFile} onClick={() => run(async () => { if (!audioFile) return; const session = await api.createDefenseSession(id, "voice"); const turn = await api.createAudioDefenseTurn(session.id, audioFile); setDefense(turn); })}>本地转写并答辩</button>
            {defense && <article><h3>{defense.question}</h3><p>{defense.feedback}</p></article>}
          </section>
        </div>
      </section>
    </section>
  );
}
