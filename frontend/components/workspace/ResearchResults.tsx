"use client";

import React, { useEffect, useState } from "react";
import { api, type ResearchRecommendation } from "../../lib/api";
import LatticeLoader from "../react-bits/LatticeLoader";
import "./research-results.css";

export function ResearchResults({ subscriptionId, runId }: { subscriptionId?: number; runId?: number }) {
  const [items, setItems] = useState<ResearchRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.listResearchRecommendations(subscriptionId, runId).then(response => {
      if (active) setItems(response.items.sort((a, b) => Number(b.paper_snapshot.article_type === "news") - Number(a.paper_snapshot.article_type === "news")));
    }).catch(error => { if (active) setError(error instanceof Error ? error.message : "结果读取失败"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [subscriptionId, runId]);

  if (loading) return <LatticeLoader label="正在读取订阅内容…" showTimer />;
  if (error) return <p className="error">{error}</p>;
  if (!items.length) return <p className="research-results-empty">本次暂无新增内容。后续检查会继续追踪主题。</p>;
  return <div className="research-results">{items.map(item => {
    const snapshot = item.paper_snapshot;
    const text = (key: string) => typeof snapshot[key] === "string" ? String(snapshot[key]) : "";
    const url = text("landing_url") || (text("doi") ? `https://doi.org/${text("doi")}` : "");
    const safeUrl = /^https?:\/\//i.test(url) ? url : "";
    return <article key={item.id} className="research-result">
      <div className="research-result-meta"><span>{text("article_type") === "news" ? "前沿资讯" : "相关论文"}</span><span>{text("journal") || item.source}</span><time>{text("published_date")}</time>{item.read_at && <span>已读</span>}</div>
      <h3>{safeUrl ? <a href={safeUrl} target="_blank" rel="noopener noreferrer" onClick={() => {
        api.markResearchRecommendationRead(item.id).then(updated => setItems(current => current.map(entry => entry.id === item.id ? updated : entry))).catch(() => {});
      }}>{text("title") || "未提供标题"} ↗</a> : text("title") || "未提供标题"}</h3>
      {text("abstract") && <p>{text("abstract")}</p>}
      {!safeUrl && <span className="research-result-meta">来源未提供原文链接</span>}
    </article>;
  })}</div>;
}
