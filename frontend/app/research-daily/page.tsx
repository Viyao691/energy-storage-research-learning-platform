"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "../../components/WorkspacePrimitives";
import "../../components/workspace/research-results.css";
import { ResearchRunChart } from "../../components/workspace/ResearchRunChart";
import { TopicArtwork } from "../../components/workspace/TopicArtwork";
import TitleMotion from "../../components/workspace/TitleMotion";
import { api, ResearchNotification, ResearchRun } from "../../lib/api";
import "../../components/workspace/daily.css";

type LoadState = "loading" | "ready" | "error";

const statusLabels: Record<string, string> = {
  success: "成功",
  partial: "部分可用",
  no_new_results: "无新增结果",
  running: "运行中",
  failed: "失败",
};
const statusTone = (status: string) => status === "success" ? "ready" : status === "partial" || status === "running" ? "warning" : "quiet";
const statusGroups = [
  { key: "success", label: "成功", color: "success" },
  { key: "partial", label: "部分可用", color: "partial" },
  { key: "running", label: "运行中", color: "running" },
  { key: "failed", label: "失败", color: "failed" },
  { key: "no_new_results", label: "无新增结果", color: "empty" },
  { key: "other", label: "其他状态", color: "other" },
];

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date)
    : "时间未提供";
}

function metricValue(state: LoadState, value: number) {
  return state === "loading" ? "读取中" : state === "error" ? "读取失败" : String(value);
}

function statusLabel(status: string) {
  return statusLabels[status] ?? "状态未知";
}

function getRunGroup(status: string) {
  return statusGroups.some(group => group.key === status) ? status : "other";
}

function MetricIcon({ kind }: { kind: "runs" | "discovered" | "recommended" | "unread" }) {
  if (kind === "runs") return <svg className="daily-metric-icon daily-metric-icon-runs" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" strokeWidth="3" /></svg>;
  if (kind === "discovered") return <svg className="daily-metric-icon daily-metric-icon-discovered" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.75h8l4 4v12.5H6z" /><path d="M14 3.75v4h4M9 12h6M9 15.5h6" /></svg>;
  if (kind === "recommended") return <svg className="daily-metric-icon daily-metric-icon-recommended" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.25 2.7 5.47 6.04.88-4.37 4.26 1.03 6.02L12 17.04l-5.4 2.84 1.03-6.02-4.37-4.26 6.04-.88z" /></svg>;
  return <svg className="daily-metric-icon daily-metric-icon-unread" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9.75a6 6 0 0 0-12 0c0 7-2.5 7-2.5 8.75h17C20.5 16.75 18 16.75 18 9.75ZM9.5 21h5" /><path d="M12 1.5v2" /></svg>;
}

export default function ResearchDailyPage() {
  const [news, setNews] = useState<Awaited<ReturnType<typeof api.latestResearchNews>> | null>(null);
  const [newsError, setNewsError] = useState("");
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [notices, setNotices] = useState<ResearchNotification[]>([]);
  const [runsState, setRunsState] = useState<LoadState>("loading");
  const [noticesState, setNoticesState] = useState<LoadState>("loading");
  const [runsError, setRunsError] = useState("");
  const [noticesError, setNoticesError] = useState("");

  useEffect(() => {
    api.latestResearchNews().then(setNews).catch(error => setNewsError(error instanceof Error ? error.message : "资讯读取失败"));
    api.listResearchRuns()
      .then(response => { setRuns(response.items); setRunsState("ready"); })
      .catch(error => { setRunsError(error instanceof Error ? error.message : "运行记录读取失败"); setRunsState("error"); });
    api.listResearchNotifications()
      .then(response => { setNotices(response.items); setNoticesState("ready"); })
      .catch(error => { setNoticesError(error instanceof Error ? error.message : "提醒读取失败"); setNoticesState("error"); });
  }, []);

  const discovered = runs.reduce((sum, run) => sum + run.discovered_count, 0);
  const recommended = runs.reduce((sum, run) => sum + run.recommended_count, 0);
  const unread = notices.filter(notice => !notice.read_at).length;
  const distribution = statusGroups.map(group => ({ ...group, count: runs.filter(run => getRunGroup(run.status) === group.key).length }));
  const newsGroups = news ? [
    { id: "energy-news", title: "能源新闻", items: news.items.filter(item => item.source !== "MIT News · 人工智能") },
    { id: "ai-news", title: "AI 前沿", items: news.items.filter(item => item.source === "MIT News · 人工智能") },
  ] : [];
  const sourceCount = news ? new Set(news.items.map(item => item.source)).size : 0;

  return <section className="research-daily-refined workspace-page">
    <header className="daily-hero">
      <div className="daily-hero-copy">
        <p className="daily-kicker">LOCAL RESEARCH DIGEST <span>·</span> 订阅与发现</p>
        <h1><TitleMotion text="科研日报" variant="tech" /></h1>

      </div>
      <StatusBadge tone="quiet">能源 · AI</StatusBadge>
    </header>

    <section className="daily-panel research-news-panel" aria-labelledby="research-news-title">
      <div className="daily-panel-heading"><div><p className="daily-panel-kicker">ENERGY + AI FRONTIERS</p><h2 id="research-news-title">能源与 AI 前沿</h2></div><span>{news ? `${sourceCount} 个来源` : "多源资讯"}</span></div>
      {newsError ? <p className="error">{newsError}</p> : !news ? <LatticeLoader label="正在读取能源与 AI 资讯…" showTimer /> : <>
        {news.warnings.map(warning => <p key={warning} className="error">{warning}</p>)}
        {news.items.length ? newsGroups.map(group => <section className="research-news-group" aria-labelledby={group.id} key={group.id}>
          <h3 id={group.id}>{group.title}</h3>
          {group.items.length ? <div className="research-results research-news-grid">{group.items.map(item => <article className="research-result" key={item.url}><div className="research-result-meta"><span>{item.source}</span><time dateTime={item.published_date || undefined}>{item.published_date || "日期未提供"}</time></div><h4><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title} ↗</a></h4><p>{item.summary}</p></article>)}</div> : <p>暂无{group.title}。</p>}
        </section>) : <p>暂未取得能源与 AI 资讯，稍后重试。</p>}
      </>}
    </section>

    <section className="daily-metrics" aria-label="返回数据概览">
      <article className="daily-metric daily-metric-runs"><div className="daily-metric-heading"><MetricIcon kind="runs" /><span>运行记录</span></div><strong aria-live="polite">{metricValue(runsState, runs.length)}</strong></article>
      <article className="daily-metric daily-metric-discovered"><div className="daily-metric-heading"><MetricIcon kind="discovered" /><span>发现结果</span></div><strong aria-live="polite">{metricValue(runsState, discovered)}</strong></article>
      <article className="daily-metric daily-metric-recommended"><div className="daily-metric-heading"><MetricIcon kind="recommended" /><span>推荐结果</span></div><strong aria-live="polite">{metricValue(runsState, recommended)}</strong></article>
      <article className="daily-metric daily-metric-unread"><div className="daily-metric-heading"><MetricIcon kind="unread" /><span>未读提醒</span></div><strong aria-live="polite">{metricValue(noticesState, unread)}</strong></article>
    </section>



    <div className="daily-primary-grid">
      <section className="daily-panel daily-chart-panel" aria-label="订阅运行趋势">
        {runsState === "loading" ? <LatticeLoader label="正在读取运行记录…" showTimer className="daily-state" />
          : runsState === "error" ? <p className="daily-state daily-state-error">{runsError}</p>
            : <ResearchRunChart runs={runs} />}
      </section>

      <section className="daily-panel daily-notice-panel" aria-labelledby="daily-notices-title">
        <div className="daily-panel-heading"><div><p className="daily-panel-kicker">RESEARCH NOTES</p><h2 id="daily-notices-title">最近提醒</h2></div><span>{noticesState === "ready" ? `${notices.length} 条` : ""}</span></div>
        {noticesState === "ready" && notices.length > 0 && <p className="daily-artwork-note">插画为主题示意</p>}
        {noticesState === "loading" ? <LatticeLoader label="正在读取提醒…" showTimer className="daily-state" />
          : noticesState === "error" ? <p className="daily-state daily-state-error">{noticesError}</p>
            : notices.length ? <div className="daily-notice-list">{notices.map((notice, index) => <article className="daily-notice" key={notice.id}>
              <TopicArtwork text={notice.title} motif="datacube" variant={index} className="daily-notice-artwork" />
              <div className="daily-notice-copy"><div className="daily-notice-meta"><time dateTime={notice.created_at}>{dateTime(notice.created_at)}</time><StatusBadge tone={notice.read_at ? "quiet" : "warning"}>{notice.read_at ? "已读" : "未读"}</StatusBadge></div><h3>{notice.title}</h3><p>{notice.body}</p><Link className="secondary research-results-toggle" href={`/subscriptions/${notice.subscription_id}${notice.run_id ? `?run=${notice.run_id}` : ""}`} onClick={() => {
                if (!notice.read_at) api.markResearchNotificationRead(notice.id).then(updated => setNotices(current => current.map(entry => entry.id === notice.id ? updated : entry))).catch(error => setNoticesError(error.message));
              }}>查看内容 →</Link></div>
            </article>)}</div>
              : <div className="daily-empty"><span aria-hidden="true">✳</span><strong>暂时没有提醒</strong><p>新的订阅结果会在这里显示。</p></div>}
      </section>
    </div>

    <div className="daily-secondary-grid">
      <section className="daily-panel daily-distribution-panel" aria-labelledby="daily-distribution-title">
        <div className="daily-panel-heading"><div><p className="daily-panel-kicker">RUN STATUS</p><h2 id="daily-distribution-title">运行状态</h2></div><span>{runsState === "ready" ? `${runs.length} 条` : ""}</span></div>
        {runsState === "loading" ? <LatticeLoader label="正在读取运行记录…" showTimer className="daily-state" />
          : runsState === "error" ? <p className="daily-state daily-state-error">{runsError}</p>
            : runs.length ? <div className="daily-status-list">{distribution.filter(group => group.count > 0).map(group => <div className="daily-status-row" key={group.key}><div><span>{group.label}</span><strong>{group.count}</strong></div><progress className={`daily-progress daily-progress-${group.color}`} value={group.count} max={runs.length} aria-label={`${group.label} ${group.count} 条`} /></div>)}</div>
              : <p className="daily-state">暂无运行记录可分类。</p>}
      </section>

      <section className="daily-panel daily-run-panel" aria-labelledby="daily-run-list-title">
        <div className="daily-panel-heading"><div><p className="daily-panel-kicker">SUBSCRIPTION HISTORY</p><h2 id="daily-run-list-title">最近运行</h2></div><span>{runsState === "ready" ? `${runs.length} 条` : ""}</span></div>
        {runsState === "loading" ? <LatticeLoader label="正在读取运行记录…" showTimer className="daily-state" />
          : runsState === "error" ? <p className="daily-state daily-state-error">{runsError}</p>
            : runs.length ? <ol className="daily-run-list">{runs.map(run => <li className="daily-run-item" key={run.id}>
              <div className="daily-run-marker" aria-hidden="true" />
              <div className="daily-run-body"><div className="daily-run-top"><time dateTime={run.started_at}>{dateTime(run.started_at)}</time><StatusBadge tone={statusTone(run.status)}>{statusLabel(run.status)}</StatusBadge></div><p className="daily-run-counts">发现 <strong>{run.discovered_count}</strong> 条检索结果 <span>·</span> 推荐 <strong>{run.recommended_count}</strong> 条检索结果</p>{run.error && <p className="daily-run-error">{run.error}</p>}{run.warnings.map((warning, index) => <p className="daily-run-warning" key={`${run.id}-${index}`}>注意：{warning}</p>)}<Link className="secondary research-results-toggle" href={`/subscriptions/${run.subscription_id}?run=${run.id}`}>查看本次新增内容 →</Link></div>
            </li>)}</ol>
              : <p className="daily-state">订阅完成第一次本地运行后，记录会出现在这里。</p>}
      </section>
    </div>
  </section>;
}
