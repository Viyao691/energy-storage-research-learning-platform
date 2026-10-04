"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";
import GlideSelect from "../../components/react-bits/GlideSelect";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { LearningAnalyticsPanel } from "../../components/LearningAnalyticsPanel";
import { EditorialEmptyState, StatusBadge, WorkspaceHeader } from "../../components/WorkspacePrimitives";
import { TopicArtwork } from "../../components/workspace/TopicArtwork";
import LearningTechHeading from "../../components/workspace/LearningTechHeading";
import { api, LearningAnalytics, LearningLifecycleStatus, LearningPack, LearningPaperCandidate, LearningPlanTask, LearningReviewItem, LearningWeakness } from "../../lib/api";
import "../../components/learning/learning-refinement.css";

const RECOMMENDED_GOALS = [
  "科学问题与研究逻辑",
  "材料设计与作用机制",
  "关键实验与表征判读",
  "Claim–Evidence 证据链",
  "替代解释与证据边界",
  "创新性与审稿人质疑",
  "复现实验与下一步研究",
  "跨论文比较与领域路线",
];

type OverviewPanel = "tasks" | "weaknesses" | "packs";

export default function LearningPage() {
  const [candidates, setCandidates] = useState<LearningPaperCandidate[]>([]);
  const [packs, setPacks] = useState<LearningPack[]>([]);
  const [tasks, setTasks] = useState<LearningPlanTask[]>([]);
  const [dueReviews, setDueReviews] = useState<LearningReviewItem[]>([]);
  const [weaknesses, setWeaknesses] = useState<LearningWeakness[]>([]);
  const [activeOverview, setActiveOverview] = useState<OverviewPanel | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [personalGoal, setPersonalGoal] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const [analyticsDays, setAnalyticsDays] = useState<7 | 30 | 90>(30);
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewReady, setOverviewReady] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<LearningLifecycleStatus | "all">("active");

  useEffect(() => {
    Promise.all([api.learningPaperCandidates(), api.learningOverview(), api.learningPacks("all")]).then(([papers, overview, allPacks]) => {
      setCandidates(papers.items);
      setPacks(allPacks.items);
      setTasks(overview.today_tasks);
      setDueReviews(overview.due_reviews || []);
      setWeaknesses(overview.open_weaknesses);
      setOverviewReady(true);
      setOverviewLoading(false);
    }).catch(error => { setMessage(error.message); setOverviewLoading(false); });
  }, []);
  useEffect(() => {
    let current = true;
    setAnalytics(null);
    setAnalyticsLoading(true);
    setAnalyticsError("");
    api.learningAnalytics(analyticsDays).then(result => {
      if (current) { setAnalytics(result); setAnalyticsLoading(false); }
    }).catch(error => {
      if (current) { setAnalyticsError(error instanceof Error ? error.message : "学习趋势读取失败"); setAnalyticsLoading(false); }
    });
    return () => { current = false; };
  }, [analyticsDays]);

  const incompleteTasks = useMemo(() => tasks.filter(item => !item.completed_at), [tasks]);
  const packById = useMemo(() => new Map(packs.map(pack => [pack.id, pack])), [packs]);
  const filteredPacks = useMemo(() => packs.filter(pack => lifecycleFilter === "all" || pack.lifecycle_status === lifecycleFilter), [packs, lifecycleFilter]);

  function toggleOverview(panel: OverviewPanel) {
    setActiveOverview(current => current === panel ? null : panel);
  }

  function togglePaper(id: number) {
    setSelected(current => current.includes(id) ? current.filter(value => value !== id) : current.length < 5 ? [...current, id] : current);
  }

  function toggleGoal(goal: string) {
    setSelectedGoals(current => current.includes(goal) ? current.filter(item => item !== goal) : [...current, goal]);
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (creatingRef.current) return;
    creatingRef.current = true; setCreating(true);
    setMessage("");
    const learningGoal = [...selectedGoals, personalGoal.trim()].filter(Boolean).join("；");
    try {
      const pack = await api.createLearningPack({ title, learning_goal: learningGoal, paper_ids: selected });
      setPacks(current => [pack, ...current]);
      setTitle("");
      setPersonalGoal("");
      setSelectedGoals([]);
      setSelected([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建失败");
    } finally { creatingRef.current = false; setCreating(false); }
  }

  return <section className="learning-workspace learning-refined workspace-page">
    <WorkspaceHeader eyebrow="RESEARCH LEARNING" title={<LearningTechHeading />}  artwork action={<StatusBadge tone="ready">手动掌握</StatusBadge>} />
    {message && <p className="error">{message}</p>}

    {overviewLoading && <LatticeLoader label="正在读取学习概览…" showTimer className="learning-overview-loading" />}
    {!overviewLoading && !overviewReady && <p className="learning-overview-loading">学习概览暂不可用。请稍后重试。</p>}
    {overviewReady && <div className="learning-overview-grid">
      <button type="button" className="card learning-overview-card" aria-expanded={activeOverview === "tasks"} aria-controls="learning-overview-tasks" onClick={() => toggleOverview("tasks")}>
        <span><strong>今日任务</strong><small>{activeOverview === "tasks" ? "收起" : "展开"}</small></span>
        <b className="learning-number">{dueReviews.length + incompleteTasks.length}</b><span>项待完成</span>
      </button>
      <button type="button" className="card learning-overview-card" aria-expanded={activeOverview === "weaknesses"} aria-controls="learning-overview-weaknesses" onClick={() => toggleOverview("weaknesses")}>
        <span><strong>开放薄弱项</strong><small>{activeOverview === "weaknesses" ? "收起" : "展开"}</small></span>
        <b className="learning-number">{weaknesses.length}</b><span>项待复习</span>
      </button>
      <button type="button" className="card learning-overview-card" aria-expanded={activeOverview === "packs"} aria-controls="learning-overview-packs" onClick={() => toggleOverview("packs")}>
        <span><strong>学习包</strong><small>{activeOverview === "packs" ? "收起" : "展开"}</small></span>
        <b className="learning-number">{packs.length}</b><span>个学习包版本</span>
      </button>
    </div>}

    <LearningAnalyticsPanel data={analytics} days={analyticsDays} onDays={setAnalyticsDays} loading={analyticsLoading} error={analyticsError} />

    {activeOverview === "tasks" && <section id="learning-overview-tasks" className="card learning-overview-detail" aria-label="今日任务详情">
      <h2>今日任务详情</h2>
      {dueReviews.map(item => <article className="learning-review-task" key={`review-${item.state.id}`}>
        <div><StatusBadge tone={item.overdue_days > 0 ? "warning" : "quiet"}>{item.overdue_days > 0 ? `逾期 ${item.overdue_days} 天` : "今日到期"}</StatusBadge><strong>复习：{item.card.concept}</strong><small>{item.pack_title}</small></div>
        <Link href={`/learning/${item.state.pack_id}?tab=review`}>开始复习</Link>
      </article>)}
      {incompleteTasks.map(task => <article key={task.id}>
        <div><StatusBadge tone="quiet">{{ card: "卡片学习", quiz: "自测", weakness: "薄弱复习" }[task.task_type]}</StatusBadge><strong>{task.title}</strong><small>未完成 · {packById.get(task.pack_id)?.title || "所属学习包"}</small></div>
        <Link href={`/learning/${task.pack_id}`}>打开学习包</Link>
      </article>)}
      {!dueReviews.length && !incompleteTasks.length && <p className="muted">今天暂无待完成任务。创建学习计划或开始卡片复习后，任务会显示在这里。</p>}
    </section>}

    {activeOverview === "weaknesses" && <section id="learning-overview-weaknesses" className="card learning-overview-detail" aria-label="开放薄弱项详情">
      <h2>开放薄弱项详情</h2>
      {weaknesses.map(item => <article key={item.id}>
        <div><strong>{item.concept}</strong><p>{item.description}</p><small>出现 {item.occurrence_count} 次 · {packById.get(item.pack_id)?.title || "所属学习包"}</small></div>
        <Link href={`/learning/${item.pack_id}`}>打开学习包</Link>
      </article>)}
      {!weaknesses.length && <p className="muted">目前没有开放薄弱项。自测错题或手动记录的薄弱概念会显示在这里。</p>}
    </section>}

    {activeOverview === "packs" && <section id="learning-overview-packs" className="card learning-overview-detail" aria-label="学习包详情">
      <h2>学习包详情</h2>
      {filteredPacks.map(pack => <article key={pack.id}>
        <div><strong>{pack.title}</strong><p>{pack.learning_goal || "未填写学习目标"}</p><small>卡片 {pack.card_count} · 题目 {pack.question_count} · 卡片生成 {pack.cards_status} · 自测生成 {pack.quiz_status}</small></div>
        <Link href={`/learning/${pack.id}`}>查看详情</Link>
      </article>)}
      {!filteredPacks.length && <p className="muted">当前筛选下没有学习包。</p>}
    </section>}

    <section className="learning-pack-list" aria-label="学习包列表"><div className="learning-section-toolbar"><div><p className="learning-section-kicker">MY LEARNING COLLECTION</p><h2>我的学习包</h2></div><label>状态<GlideSelect ariaLabel="学习包状态" value={lifecycleFilter} onChange={value => setLifecycleFilter(value as LearningLifecycleStatus | "all")} options={[{ value: "active", label: "当前激活" }, { value: "draft", label: "草稿" }, { value: "archived", label: "已归档" }, { value: "all", label: "全部" }]} /></label></div>
      {filteredPacks.map((pack, index) => <Link className="card learning-pack-card" href={`/learning/${pack.id}`} key={pack.id}><TopicArtwork text={`${pack.title} ${pack.learning_goal}`} motif="learningtree" variant={index} className="learning-pack-artwork" /><div className="learning-pack-copy"><p className="learning-pack-eyebrow">LEARNING PACK · v{pack.version_number}</p><h3>{pack.title}</h3><p>{pack.learning_goal || "建立完整论文理解"}</p><div className="learning-pack-meta"><StatusBadge tone={pack.lifecycle_status === "active" ? "ready" : "quiet"}>{{ active: "当前", draft: "草稿", archived: "归档" }[pack.lifecycle_status]}</StatusBadge><span>卡片 {pack.card_count}</span><span>自测 {pack.question_count}</span></div></div><span className="learning-pack-open" aria-hidden="true">↗</span></Link>)}
      {overviewLoading && <LatticeLoader label="正在读取学习包列表…" showTimer className="learning-collection-state" />}
      {!overviewLoading && !overviewReady && <p className="learning-collection-state">学习包列表暂不可用。</p>}
      {overviewReady && !filteredPacks.length && <EditorialEmptyState title="当前筛选下没有学习包" description="" />}
    </section>

    <section className="card learning-create-panel">
      <h2>创建学习包</h2>
      <p className="muted">先选择 1–5 篇论文。可选论文必须已读、全文可用，并至少有一份当前版本解析。</p>
      <form onSubmit={create}>
        <fieldset className="learning-paper-list">
          <legend>1. 选择论文</legend>
          <strong className="learning-paper-selection-count">已选 {selected.length}/5</strong>
          {candidates.map(paper => <article className={`learning-paper-option${paper.eligible ? "" : " is-disabled"}`} key={paper.id}>
            <label>
              <input aria-label={`选择 ${paper.title}`} type="checkbox" checked={selected.includes(paper.id)} onChange={() => togglePaper(paper.id)} disabled={!paper.eligible || (!selected.includes(paper.id) && selected.length >= 5)} />
              <span><strong>{paper.title}</strong><small>{paper.journal || "期刊未提供"} · {paper.available_reports.length} 类当前解析</small></span>
            </label>
            {paper.eligible ? <StatusBadge tone="ready">可选择</StatusBadge> : <div className="learning-paper-blockers">
              <div>{paper.blocking_reasons.map(reason => <span key={reason}>{reason}</span>)}</div>
              <nav>
                {!paper.is_read && <Link href="/library">去论文库标记已读</Link>}
                {!paper.fulltext_available && <Link href={`/papers/${paper.id}`}>查看全文状态</Link>}
                {!paper.available_reports.length && <Link href={`/papers/${paper.id}`}>去生成解析</Link>}
              </nav>
            </div>}
          </article>)}
          {overviewLoading && <LatticeLoader label="正在读取论文候选…" showTimer />}
          {!overviewLoading && !overviewReady && <p>论文候选暂不可用。</p>}
          {overviewReady && !candidates.length && <p>论文库暂无论文。请先上传论文并完成解析。</p>}
        </fieldset>

        <label>2. 学习包标题<input aria-label="学习包标题" required value={title} onChange={event => setTitle(event.target.value)} /></label>

        <fieldset className="learning-goal-options">
          <legend>3. 选择学习目标（可多选）</legend>
          <div>{RECOMMENDED_GOALS.map(goal => <label key={goal}><input type="checkbox" checked={selectedGoals.includes(goal)} onChange={() => toggleGoal(goal)} />{goal}</label>)}</div>
          <label>个人补充目标<textarea aria-label="个人补充目标" value={personalGoal} onChange={event => setPersonalGoal(event.target.value)} placeholder="例如：准备组会汇报、梳理可复现实验参数" /></label>
        </fieldset>

        <button aria-label="创建学习包" disabled={!selected.length || creating}>4. 创建学习包</button>
        {creating && <LatticeLoader label="正在创建学习包…" showTimer className="learning-operation-loading" />}
      </form>
    </section>

  </section>;
}
