"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, type ResearchSubscription, type ResearchRecommendation } from "../../../lib/api";
import TitleMotion from "../../../components/workspace/TitleMotion";
import LatticeLoader from "../../../components/react-bits/LatticeLoader";
import { SubscriptionReadingFeed, type ReadingEntry } from "./SubscriptionReadingFeed";
import "./subscription-detail.css";

export default function SubscriptionDetail({ subscriptionId, runId }: { subscriptionId: number; runId?: number }) {
  const [subscription, setSubscription] = useState<ResearchSubscription | null>(null);
  const [entries, setEntries] = useState<ReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState<"all" | "paper" | "news">("all");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [topic, recommendations] = await Promise.allSettled([api.getResearchSubscription(subscriptionId), api.listResearchRecommendations(subscriptionId, runId)]);
    if (topic.status === "fulfilled") setSubscription(topic.value);
    else setError(topic.reason instanceof Error ? topic.reason.message : "订阅读取失败");
    const items: ReadingEntry[] = recommendations.status === "fulfilled" ? recommendations.value.items.map((item: ResearchRecommendation) => {
      const text = (key: string) => typeof item.paper_snapshot[key] === "string" ? String(item.paper_snapshot[key]) : "";
      return { key: `paper:${item.id}`, recommendationId: item.id, kind: text("article_type") === "news" ? "news" : "paper", title: text("title"), summary: text("abstract"), source: text("journal") || item.source, date: text("published_date"), url: text("landing_url") || (text("doi") ? `https://doi.org/${text("doi")}` : ""), read: !!item.read_at };
    }) : [];
    if (recommendations.status === "rejected") setError(recommendations.reason instanceof Error ? recommendations.reason.message : "订阅内容读取失败");
    setEntries(items); setLoading(false); setRevision(value => value + 1);
  }, [subscriptionId, runId]);
  useEffect(() => { void load(); }, [load]);
  const paperCount = entries.filter(item => item.kind === "paper").length;
  const newsCount = entries.filter(item => item.kind === "news").length;
  return <section className="workspace-page subscription-detail-page">
    <header className="subscription-detail-header">
      <div className="subscription-detail-navigation"><Link className="subscription-detail-back" href="/subscriptions">← 返回研究订阅</Link>{runId && <Link className="subscription-detail-back" href={`/subscriptions/${subscriptionId}`}>查看主题全部内容</Link>}</div>
      <p className="subscription-detail-kicker">{runId ? "本次运行新增内容" : "研究主题 · 订阅内容"}</p>
      <h1><TitleMotion text={subscription?.name || "订阅内容"} variant="tech" /></h1>
      {subscription && <p className="subscription-detail-query"><span>检索主题</span>{subscription.query}</p>}
    </header>
    <div className="subscription-feed-toolbar"><div role="group" aria-label="内容类型">{([["all", "全部", entries.length], ["paper", "论文", paperCount], ["news", "资讯", newsCount]] as const).map(([value, label, count]) => <button key={value} className={filter === value ? "active" : "secondary"} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label} {count}</button>)}</div><button className="secondary" disabled={loading} onClick={() => void load()}>刷新内容</button></div>
    {error && <p className="error" role="alert">{error}</p>}
    {loading ? <LatticeLoader label="正在读取本主题内容…" showTimer /> : <SubscriptionReadingFeed entries={entries} filter={filter} revision={revision} />}
  </section>;
}
