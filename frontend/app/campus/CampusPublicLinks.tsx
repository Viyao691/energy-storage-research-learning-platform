"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { api, CampusPublicLink } from "../../lib/api";

const PAGE_SIZE = 20;
type Scope = "recent" | "unknown" | "archive";
const labels: Record<Scope, string> = { recent: "近 90 天", unknown: "日期待核实", archive: "历史记录" };
const dateTimeLabel = (value: string) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date)
    : "时间待核实";
};

export default function CampusPublicLinks() {
  const [scope, setScope] = useState<Scope>("unknown");
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<CampusPublicLink[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<Scope, number>>({ recent: 0, unknown: 0, archive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  const load = useCallback(async (quiet = false) => {
    const sequence = ++requestSequence.current;
    if (!quiet) {
      setLoading(true);
      setItems([]);
      setError("");
    }
    try {
      const result = await api.listCampusPublicLinks({ offset, limit: PAGE_SIZE, scope, days: 90 });
      if (sequence !== requestSequence.current) return;
      setItems(result.items);
      setTotal(result.total);
      setCounts({ recent: result.counts.recent ?? 0, unknown: result.counts.unknown ?? 0, archive: result.counts.archive ?? 0 });
      setError("");
    } catch (reason) {
      if (sequence === requestSequence.current) setError(reason instanceof Error ? reason.message : "公众号公开索引暂不可用");
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [offset, scope]);

  useEffect(() => {
    void load();
    return () => { requestSequence.current += 1; };
  }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => { void load(true); }, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return <section className="campus-panel campus-public-links" aria-labelledby="campus-public-links-title">
    <div className="campus-panel-heading"><div><p className="campus-panel-kicker">OFFICIAL PUBLIC LINKS</p><h2 id="campus-public-links-title">公众号公开索引</h2></div><span>{loading ? "读取中…" : `${total} 条链接`}</span></div>
    <p className="campus-public-links-note">仅从校方公开网页发现文章标题与链接，不代表订阅公众号全部内容；未读取正文、未生成摘要或截止提醒。首次发现时间不等于发布日期。</p>
    <div className="campus-scope-tabs" role="tablist" aria-label="公众号文章日期范围">
      {(["recent", "unknown", "archive"] as const).map(key => <button key={key} type="button" role="tab" aria-selected={scope === key} onClick={() => { setScope(key); setOffset(0); }}>{labels[key]} <span>{counts[key]}</span></button>)}
    </div>
    {error && <p className="campus-state campus-state-error" role="status">公众号索引暂不可用：{error}</p>}
    {!error && loading && items.length === 0 ? <LatticeLoader label="正在读取公开链接…" showTimer className="campus-state" />
      : items.length ? <div className="campus-event-list">{items.map((item, index) => <article className="campus-event campus-public-link" key={`${item.url}-${index}`}>
        <div className="campus-event-top"><span className="campus-tag campus-tag-quiet">{item.evidence_level === "link_only" ? "仅标题与链接" : item.evidence_level}</span><time dateTime={item.published_on || undefined}>发布日期：{item.published_on || "日期待核实"}</time></div>
        <h3><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h3>
        <p className="campus-public-link-times">首次发现：{dateTimeLabel(item.first_seen_at)} · 最近发现：{dateTimeLabel(item.last_seen_at)}</p>
        <div className="campus-event-footer"><div className="campus-event-sources">{item.origins.map(origin => <a key={`${origin.source_id}-${origin.url}`} href={origin.url} target="_blank" rel="noreferrer" aria-label={`${origin.name} · 校方列表页`}>{origin.name} · 校方列表页</a>)}</div><a className="campus-public-link-original" href={item.url} target="_blank" rel="noreferrer">打开公众号原文</a></div>
      </article>)}</div> : !error && <p className="campus-state">当前范围下暂无公开文章索引。</p>}
    {total > PAGE_SIZE && <nav className="campus-pagination" aria-label="公众号公开索引分页"><span>第 {Math.floor(offset / PAGE_SIZE) + 1} / {Math.ceil(total / PAGE_SIZE)} 页</span><div className="campus-pagination-controls"><button className="campus-button" type="button" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>上一页</button><button className="campus-button" type="button" disabled={offset + PAGE_SIZE >= total || loading} onClick={() => setOffset(offset + PAGE_SIZE)}>下一页</button></div></nav>}
  </section>;
}
