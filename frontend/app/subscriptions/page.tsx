"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";
import GlideSelect from "../../components/react-bits/GlideSelect";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { EditorialEmptyState, StatusBadge, WorkspaceHeader } from "../../components/WorkspacePrimitives";
import { WorkspaceDrawer } from "../../components/workspace/WorkspaceDrawer";
import { TopicArtwork, getResearchTopic } from "../../components/workspace/TopicArtwork";
import "../../components/workspace/research-results.css";
import { ResearchRunChart } from "../../components/workspace/ResearchRunChart";
import { api, type ResearchRun, type ResearchSubscription } from "../../lib/api";
import "../../components/workspace/refinement.css";

function scheduleLabel(hours: number) {
  return hours === 168 ? "每周一次" : "每 " + hours + " 小时";
}

function nextRunLabel(value: string | null) {
  if (!value) return "尚未安排下一次运行";
  return "下次运行：" + new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function displayName(value: string) {
  return value.includes("?") ? "本地研究订阅" : value;
}

export default function SubscriptionsPage() {
  const [runningIds, setRunningIds] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [items, setItems] = useState<ResearchSubscription[]>([]);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingIntervals, setPendingIntervals] = useState<Record<number, number>>({});
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [runsError, setRunsError] = useState("");
  const [itemsLoading, setItemsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.listResearchSubscriptions().then(response => setItems(response.items)).catch(error => setMessage(error.message)).finally(() => setItemsLoading(false));
    api.listResearchRuns().then(response => setRuns(response.items)).catch(error => setRunsError(error instanceof Error ? error.message : "运行记录读取失败")).finally(() => setRunsLoading(false));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const item = await api.createResearchSubscription({
        name, query, sources: [], year_from: null, year_to: null,
        open_access_only: false, interval_hours: 168, enabled: true,
      });
      setItems(current => [item, ...current]);
      setName("");
      setQuery("");
      setFormError("");
      setCreateOpen(false);
      setMessage("订阅已保存，正在进行首次检查。");
      void runNow(item);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "保存失败");
    } finally { setSaving(false); }
  }

  async function runNow(item: ResearchSubscription) {
    if (runningIds.includes(item.id)) return;
    setRunningIds(current => [...current, item.id]);
    setFeedback(current => ({ ...current, [item.id]: "正在检查官方资讯与相关论文…" }));
    try {
      const run = await api.runResearchSubscription(item.id);
      setRuns(current => [run, ...current.filter(entry => entry.id !== run.id)]);
      setRunsError("");
      setRunsLoading(false);
      setFeedback(current => ({ ...current, [item.id]: run.error || `检查完成：发现 ${run.discovered_count} 条，新增 ${run.recommended_count} 条${run.status === "partial" ? `，${run.source_statuses.filter(source => !source.ok).map(source => source.source).join("、")} 暂不可用` : ""}` }));
      const response = await api.listResearchSubscriptions();
      setItems(response.items);
    } catch (error) {
      setFeedback(current => ({ ...current, [item.id]: error instanceof Error ? error.message : "检查失败" }));
    } finally { setRunningIds(current => current.filter(id => id !== item.id)); }
  }

  async function updateInterval(item: ResearchSubscription, intervalHours: number) {
    try {
      const updated = await api.updateResearchSubscription(item.id, { interval_hours: intervalHours });
      setItems(current => current.map(entry => entry.id === updated.id ? updated : entry));
      setPendingIntervals(current => { const next = { ...current }; delete next[item.id]; return next; });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "修改周期失败");
    }
  }

  async function cancelSubscription(item: ResearchSubscription) {
    const confirmationName = window.prompt(`请输入“${item.name}”以确认取消订阅`);
    if (confirmationName !== item.name) return;
    try {
      await api.deleteResearchSubscription(item.id, confirmationName);
      setItems(current => current.filter(entry => entry.id !== item.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "取消订阅失败");
    }
  }

  return (
    <section className="subscriptions-workspace workspace-page refinement-page">
      <WorkspaceHeader eyebrow="LOCAL RESEARCH ROUTINE" title="研究订阅" description="追踪能源与 AI 前沿资讯及主题论文。" artwork action={<button type="button" className="subscription-add-button" aria-label="添加主题" onClick={() => { setFormError(""); setCreateOpen(true); }}>添加主题</button>} />
      {message && <p className="error">{message}</p>}
      {itemsLoading && <LatticeLoader label="正在读取研究订阅…" showTimer />}
      {saving && <LatticeLoader label="正在保存研究订阅…" showTimer />}
      <div className="subscription-section-heading"><div><span className="refinement-kicker">WATCHED TOPICS</span><h2>关注中的主题</h2><p>下次调度和最近状态来自本地订阅。</p></div><span className="subscription-total">{items.length} 个主题</span></div>
      <section className="subscription-list" aria-label="研究订阅列表">
        {items.map((item, index) => (
          <article className={`card subscription-card topic-${getResearchTopic(`${item.name} ${item.query}`).key}`} key={item.id}>
            <div className="subscription-artwork-wrap"><TopicArtwork text={`${item.name} ${item.query}`} variant={index} className="subscription-artwork" /></div>
            <div className="subscription-card-content"><div className="subscription-card-top"><span className="subscription-topic-type">{getResearchTopic(`${item.name} ${item.query}`).label}</span><StatusBadge tone={item.enabled ? "ready" : "quiet"}>{item.enabled ? "已启用" : "已暂停"}</StatusBadge></div>
              <h2>{displayName(item.name)}</h2>
              <p className="subscription-query">{item.query}</p>
              <div className="subscription-meta">
                <span>{scheduleLabel(item.interval_hours)}</span>
                <span>{nextRunLabel(item.next_run_at)}</span>
                {item.last_error && <span>{item.last_error}</span>}
                <span>{item.last_success_at ? "最近检查：" + new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.last_success_at)) : "等待首次检查"}</span>
              </div>
            <div className="subscription-actions"><button type="button" className="secondary" disabled={runningIds.includes(item.id)} onClick={() => runNow(item)}>{runningIds.includes(item.id) ? "正在检查…" : "立即检查"}</button><Link className="secondary subscription-content-link" href={`/subscriptions/${item.id}`}>查看订阅内容</Link></div>
            {feedback[item.id] && <p className="subscription-feedback" role="status">{feedback[item.id]}</p>}
            <details className="subscription-details"><summary>订阅设置</summary><div className="subscription-actions">
              <label>订阅周期
                <GlideSelect ariaLabel={`${item.name}的订阅周期`} value={pendingIntervals[item.id] ?? item.interval_hours} onChange={value => setPendingIntervals(current => ({ ...current, [item.id]: Number(value) }))} options={[{ value: "24", label: "每天一次" }, { value: "72", label: "每 3 天一次" }, { value: "168", label: "每周一次" }, { value: "336", label: "每两周一次" }]} />
              </label>
              <button className="secondary" type="button" onClick={() => updateInterval(item, pendingIntervals[item.id] ?? item.interval_hours)}>修改周期</button>
              <button className="secondary" type="button" onClick={() => cancelSubscription(item)}>取消订阅</button>
            </div></details></div>
          </article>
        ))}
        {!items.length && <EditorialEmptyState title="尚未创建研究订阅" description="从一个持续关注的关键词开始，新的本地订阅会出现在这里。" />}
      </section>
      <section className="subscription-intelligence" aria-label="近期运行记录"><div className="subscription-section-heading"><div><span className="refinement-kicker">LOCAL RUN LOG</span><h2>近期检索运行</h2></div></div>
        {runsLoading ? <LatticeLoader label="正在读取运行记录…" showTimer /> : runsError ? <p className="error">{runsError}</p> : runs.length ? <div className="subscription-insights-grid"><div className="subscription-chart-panel"><ResearchRunChart runs={runs} /></div><div className="subscription-history-panel"><h3>最近记录</h3><ol>{runs.slice().sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at)).slice(0, 4).map(run => <li key={run.id}><span>{Number.isNaN(Date.parse(run.started_at)) ? "时间未提供" : new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(new Date(run.started_at))}</span><strong>发现 {run.discovered_count} · 推荐 {run.recommended_count}</strong></li>)}</ol></div></div> : <p className="subscription-runs-empty">暂无运行记录。创建主题后，运行结果会在这里显示。</p>}
      </section>
      <WorkspaceDrawer open={createOpen} title="添加研究主题" onClose={() => setCreateOpen(false)}><form className="subscription-create-form" onSubmit={save}>
        <p>设置持续关注的主题，默认每周检查一次。电脑关闭或休眠时暂停，服务启动后补检。</p>
        {formError && <p className="error">{formError}</p>}
        <label>订阅名称<input aria-label="订阅名称" value={name} onChange={event => setName(event.target.value)} required /></label>
        <label>检索关键词<input aria-label="检索关键词" value={query} onChange={event => setQuery(event.target.value)} required /></label>
        <button type="submit" disabled={saving}>保存订阅</button>
      </form></WorkspaceDrawer>
    </section>
  );
}
