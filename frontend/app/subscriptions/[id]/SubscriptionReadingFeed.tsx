"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import LatticeLoader from "../../../components/react-bits/LatticeLoader";

export type ReadingEntry = { key: string; recommendationId?: number; kind: "paper" | "news"; title: string; summary: string; source: string; date: string; url: string; read?: boolean };
type Highlight = Awaited<ReturnType<typeof api.researchReadingHighlights>>["items"][number];

export function SubscriptionReadingFeed({ entries, filter, revision }: { entries: ReadingEntry[]; filter: "all" | "paper" | "news"; revision: number }) {
  const [highlights, setHighlights] = useState<Record<string, Highlight>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState("");
  const [attempted, setAttempted] = useState<Set<string>>(new Set());
  const [read, setRead] = useState<Set<string>>(new Set());
  const visible = useMemo(() => entries.filter(item => filter === "all" || item.kind === filter), [entries, filter]);
  const latest = useMemo(() => [...visible].sort((a, b) => a.kind === b.kind ? (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) : a.kind === "paper" ? -1 : 1).slice(0, 5), [visible]);
  const batchKey = latest.map(item => item.key).join("|");
  useEffect(() => {
    const missing = latest.filter(item => !highlights[item.key]);
    if (busy || !missing.length || attempted.has(batchKey)) return;
    setBusy(true); setFailed(""); setAttempted(current => new Set(current).add(batchKey));
    api.researchReadingHighlights({ recommendation_ids: missing.filter(item => item.recommendationId !== undefined).map(item => item.recommendationId!), news_urls: missing.filter(item => item.recommendationId === undefined).map(item => item.url) })
      .then(result => setHighlights(current => ({ ...current, ...Object.fromEntries(result.items.map(item => [item.key, item])) })))
      .catch(error => setFailed(error instanceof Error ? error.message : "中文重点整理失败"))
      .finally(() => setBusy(false));
  }, [latest, batchKey, busy, attempted, highlights, revision]);
  const sections = [
    { key: "papers", title: "相关论文", entries: visible.filter(item => item.kind === "paper") },
    { key: "topic-news", title: "本主题资讯", entries: visible.filter(item => item.kind === "news") },
  ].map(section => ({ ...section, entries: section.entries.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)) }));
  return <div className="subscription-reading-feed">
    <p className="subscription-reading-note">当前页签最新 5 条自动中文整理</p>
    {busy && <LatticeLoader label="正在整理中文重点…" showTimer />}
    {failed && <div className="subscription-reading-error" role="alert"><span>{failed}</span><button className="secondary" onClick={() => { setFailed(""); setAttempted(current => { const next = new Set(current); next.delete(batchKey); return next; }); }}>重试中文重点</button></div>}
    {sections.filter(section => section.entries.length || (section.key === "topic-news" && filter !== "paper")).map(section => <section key={section.key} className="subscription-feed-section" aria-label={section.title}>
      <div className="subscription-feed-section-heading"><h2>{section.title}</h2><span>{section.entries.length} 条</span></div>
      {!section.entries.length && <p><strong>暂无本主题资讯。</strong>当前来源尚未取得匹配的新闻，相关论文仍可在“论文”页签查看。</p>}
      {section.entries.map(item => {
        const highlight = highlights[item.key];
        const safeUrl = /^https?:\/\//i.test(item.url) ? item.url : "";
        return <article className="subscription-reading-card" key={item.key}>
          <div className="subscription-reading-meta"><span>{item.source}</span><time>{item.date || "日期未提供"}</time>{(item.read || read.has(item.key)) && <span>已读</span>}{highlight && <span>AI 中文整理</span>}</div>
          <h3>{highlight?.title_zh || item.title || "未提供标题"}</h3>
          {highlight && <ul className="subscription-reading-points">{highlight.points.map((point, index) => <li key={index}>{point}</li>)}</ul>}
          <details className="subscription-original"><summary>查看原文摘要</summary><h4>{item.title}</h4><p>{item.summary || "来源未提供摘要。"}</p></details>
          {safeUrl ? <a className="subscription-original-link" href={safeUrl} target="_blank" rel="noopener noreferrer" onClick={() => { if (item.recommendationId !== undefined) void api.markResearchRecommendationRead(item.recommendationId).then(() => setRead(current => new Set(current).add(item.key))).catch(() => {}); }}>查看原文 ↗</a> : <span className="subscription-reading-note">来源未提供原文链接</span>}
        </article>;
      })}
    </section>)}
    {!visible.length && filter === "paper" && <p>当前已加载内容中暂无相关论文。</p>}
    {!visible.length && filter === "all" && <p>当前订阅尚无相关论文或本主题资讯。</p>}
  </div>;
}
