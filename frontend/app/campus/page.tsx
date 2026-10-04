"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";
import GlideSelect from "../../components/react-bits/GlideSelect";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { StatusBadge } from "../../components/WorkspacePrimitives";
import { api, CampusEvent, CampusNotice, CampusSource } from "../../lib/api";
import CampusPublicLinks from "./CampusPublicLinks";
import TitleMotion from "../../components/workspace/TitleMotion";
import "./campus.css";

const PAGE_SIZE = 20;
const categories = ["竞赛创新", "学业升学", "科研学术", "讲座交流", "招募实践", "校园活动", "校务通知"];
const subtypes: Record<string, string[]> = {
  竞赛创新: ["学科竞赛", "数学建模", "AI与编程", "工程设计", "创新创业", "挑战杯/大创", "竞赛结果"],
  学业升学: ["保研推免", "考研招考", "招生培养", "课程考试", "奖助学金", "海外交流"],
  科研学术: ["前沿研究", "学术成果", "科研项目申报", "课题组招募", "科研平台"],
  讲座交流: ["知识讲座", "学术报告", "行业交流", "研究生论坛", "技能工作坊"],
  招募实践: ["学生组织招募", "志愿服务", "实习就业", "社会实践"],
  校园活动: ["趣味活动", "文艺体育", "书院活动", "校园生活"],
  校务通知: ["教学事务", "场地服务", "制度安排", "综合通知"],
};
const dateTimeLabel = (value: string | null | undefined) => {
  if (!value) return "未安排";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date)
    : "时间未提供";
};
const activationLabel = (source: CampusSource) => source.activation_state === "never_enabled" ? "从未启用" : source.activation_state === "paused" ? "用户已暂停" : "已启用";
const accessLabel = (source: CampusSource) => source.access_state === "login_required" ? "需登录" : source.access_state === "unreachable" ? "连接失败" : source.access_state === "public" ? "公开可访问" : "访问状态待核实";
const sourceStatus = (source: CampusSource) => {
  if (source.status === "error" || source.status === "blocked") return { text: source.detail || "读取受限", state: "error" };
  if (source.status === "partial") return { text: source.detail || "部分栏目可读", state: "warning" };
  if (source.status === "pending") return { text: source.detail || "等待检查", state: "quiet" };
  if (source.status === "paused") return { text: source.detail || "已暂停检查", state: "quiet" };
  return { text: source.detail || "检查正常", state: "ok" };
};
const institutionName = (source: CampusSource) => {
  const [name, column] = source.name.split(/\s*·\s*/, 2);
  if (column && (name === "西安交通大学" || name === "西安交大")) return column === "教务处" ? "教务处" : "西安交通大学";
  if (column) return name;
  return source.group && !["学校", "学院", "工科学院", "书院"].includes(source.group) && name.startsWith(source.group)
    ? source.group : name;
};
const sourceColumnName = (source: CampusSource) => source.name.includes(" · ")
  ? source.name.split(" · ").slice(1).join(" · ") : source.coverage === "homepage" ? "官网" : source.name;
const groupSources = (sources: CampusSource[]) => {
  const groups = new Map<string, CampusSource[]>();
  sources.forEach(source => {
    const name = institutionName(source);
    groups.set(name, [...(groups.get(name) || []), source]);
  });
  return [...groups];
};
const scopeLabel: Record<string, string> = { recent: "近 90 天", unknown: "日期待核实", archive: "历史记录" };
const genericUnknowns = new Set(["具体要求请核对原文", "日期未确认", "日期待核实", "活动/截止日期未能从原文确认"]);

export default function CampusPage() {
  const [sources, setSources] = useState<CampusSource[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [notices, setNotices] = useState<CampusNotice[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ recent: 0, unknown: 0, archive: 0 });
  const [scope, setScope] = useState<"recent" | "unknown" | "archive">("recent");
  const [category, setCategory] = useState("");
  const [subtype, setSubtype] = useState("");
  const [followed, setFollowed] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | "activate" | null>(null);
  const [expandedInstitutions, setExpandedInstitutions] = useState<Set<string>>(new Set());
  const directoryInitialized = useRef(false);
  const requestSequence = useRef(0);

  const load = useCallback(async (quiet = false) => {
    const sequence = ++requestSequence.current;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const [sourceResult, eventResult, noticeResult] = await Promise.all([
        api.listCampusSources(),
        api.listCampusEvents({ offset, limit: PAGE_SIZE, scope, days: 90, category, subtype, followed }),
        api.listCampusNotices(),
      ]);
      if (sequence !== requestSequence.current) return;
      if (!directoryInitialized.current && sourceResult.items.length) {
        setExpandedInstitutions(new Set([institutionName(sourceResult.items[0])]));
        directoryInitialized.current = true;
      }
      setSources(sourceResult.items);
      setEvents(eventResult.items);
      setTotal(eventResult.total);
      setCounts({ recent: eventResult.counts.recent ?? 0, unknown: eventResult.counts.unknown ?? 0, archive: eventResult.counts.archive ?? 0 });
      setNotices(noticeResult.items);
    } catch (reason) {
      if (sequence === requestSequence.current) setError(reason instanceof Error ? reason.message : "校园资讯读取失败");
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [category, followed, offset, scope, subtype]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => { void load(true); }, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const run = async (key: number | "activate", action: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try { await action(); await load(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "操作未完成"); }
    finally { setBusy(null); }
  };

  const changeFilter = (update: () => void) => { update(); setOffset(0); };
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return <section className="campus-page workspace-page">
    <header className="campus-hero">
      <div className="campus-hero-copy">
        <p className="campus-kicker">XJTU PUBLIC OPPORTUNITIES · 校园公开资讯</p>
        <h1><TitleMotion text="校园机会与学术资讯" variant="focus" /></h1>
        <p>自动整理西交大公开栏目中的竞赛、升学、科研、讲座和校园活动。</p>
      </div>
    </header>
    <div className="campus-action-row">
      <StatusBadge tone={sources.some(source => source.activation_state === "enabled" && source.status === "ok") ? "ready" : "quiet"}>{sources.filter(source => source.activation_state === "enabled").length} 个来源已启用</StatusBadge>
      <button className="campus-button" type="button" onClick={() => void load()} disabled={loading}>刷新列表</button>
      <button className="campus-button campus-button-primary" type="button" onClick={() => void run("activate", api.activateCampus)} disabled={busy !== null}>{busy === "activate" ? "正在启用…" : "启用自动发现"}</button>
    </div>

    {error && <p className="campus-state campus-state-error" role="alert">{error}</p>}
    {busy !== null && <LatticeLoader label={busy === "activate" ? "正在启用自动发现…" : "正在更新校园资讯…"} showTimer />}

    <div className="campus-overview">
      <section className="campus-panel" aria-labelledby="campus-sources-title">
        <div className="campus-panel-heading"><div><p className="campus-panel-kicker">PUBLIC SOURCE MONITOR</p><h2 id="campus-sources-title">监测来源</h2></div><span>{sources.length} 个登记栏目</span></div>
        <div className="campus-channel-list" aria-label="来源渠道概况">
          <span>官网网站 · {sources.length} 个栏目</span>
          <a href="#campus-public-links-title">公众号 · 公开外链索引</a>
          <span>群消息 · 未接入</span>
          <span>小程序 · 未接入</span>
        </div>
        {loading && sources.length === 0 ? <LatticeLoader label="正在读取来源状态…" showTimer className="campus-state" />
          : sources.length ? <div className="campus-source-groups">{groupSources(sources).map(([institution, entries]) => <details className="campus-source-group" key={institution} open={expandedInstitutions.has(institution)} onToggle={event => {
            const open = event.currentTarget.open;
            setExpandedInstitutions(previous => {
              if (previous.has(institution) === open) return previous;
              const next = new Set(previous);
              if (open) next.add(institution); else next.delete(institution);
              return next;
            });
          }}>
            <summary><span>{institution} · {entries.length} 个栏目</span><span aria-hidden="true" className="campus-source-chevron">⌄</span></summary>
            <div className="campus-source-list">{entries.map(source => {
            const status = sourceStatus(source);
            const inactive = source.activation_state !== "enabled";
            return <article className="campus-source" key={source.id}>
              <div className="campus-source-copy"><a className="campus-source-name" href={source.url} title={source.name} aria-label={source.name.includes(" · ") ? undefined : source.name} target="_blank" rel="noreferrer">{sourceColumnName(source)}</a><p><span className="campus-source-channel">官网网站</span> · {source.coverage === "homepage" ? "官网入口" : source.coverage === "unverified" ? "栏目待核实" : "公开栏目"}</p><small className="campus-source-url">{source.url}</small><div className="campus-source-badges"><span data-state={inactive ? "quiet" : "ok"}>{activationLabel(source)}</span><span data-state={source.access_state === "login_required" || source.access_state === "unreachable" ? "warning" : "quiet"}>{accessLabel(source)}</span><span data-state={status.state}>{status.text}</span></div><small>最近检查：{dateTimeLabel(source.last_checked_at)} · 下次计划：{dateTimeLabel(source.next_check_at)}</small></div>
              <div><button className="campus-source-toggle" type="button" aria-label={source.activation_state === "enabled" ? "暂停此来源" : "启用此来源"} disabled={busy !== null} onClick={() => void run(source.id, () => api.updateCampusSource(source.id, { enabled: source.activation_state !== "enabled" }))}>{source.activation_state === "enabled" ? "暂停" : source.activation_state === "paused" ? "恢复" : "启用"}</button></div>
            </article>;
          })}</div>
          </details>)}</div> : <p className="campus-state">暂无登记来源。</p>}
      </section>

      <section className="campus-panel" aria-labelledby="campus-events-title">
        <div className="campus-panel-heading"><div><p className="campus-panel-kicker">DISCOVERED OPPORTUNITIES</p><h2 id="campus-events-title">发现与整理</h2></div><span>{loading ? "读取中…" : `${total} 条资讯`}</span></div>
        <div className="campus-scope-tabs" role="tablist" aria-label="资讯时间范围">
          {(["recent", "unknown", "archive"] as const).map(key => <button key={key} type="button" role="tab" aria-selected={scope === key} onClick={() => changeFilter(() => setScope(key))}>{scopeLabel[key]} <span>{counts[key]}</span></button>)}
        </div>
        <div className="campus-controls">
          <label>主类别<GlideSelect ariaLabel="按主类别筛选" value={category} onChange={value => changeFilter(() => { setCategory(value); setSubtype(""); })} options={[{ value: "", label: "全部类别" }, ...categories.map(value => ({ value, label: value }))]} /></label>
          <label>细类<GlideSelect ariaLabel="按细类筛选" value={subtype} onChange={value => changeFilter(() => setSubtype(value))} disabled={!category} options={[{ value: "", label: "全部细类" }, ...(subtypes[category] || []).map(value => ({ value, label: value }))]} /></label>
          <label><input type="checkbox" checked={followed} onChange={event => changeFilter(() => setFollowed(event.target.checked))} />只看关注</label>
        </div>
        {loading && events.length === 0 ? <LatticeLoader label="正在读取校园资讯…" showTimer className="campus-state" />
          : events.length ? <div className="campus-event-list">{events.map(item => {
            const unknowns = item.analysis.status === "ready" ? item.analysis.unknowns.filter(value => !genericUnknowns.has(value.trim())) : [];
            return <article className="campus-event" key={item.id}>
            <div className="campus-event-top"><div className="campus-event-flags">{item.tags.filter(tag => tag !== item.subtype).map(tag => <span className="campus-tag campus-tag-quiet" key={tag}>{tag}</span>)}{item.conflict && <span className="campus-tag campus-tag-warning">日期证据冲突</span>}{item.feed_status === "archive" && <span className="campus-tag campus-tag-quiet">历史记录</span>}{item.feed_status === "unknown" && item.published_on && <span className="campus-tag campus-tag-warning">日期待核实</span>}{item.analysis.method === "mock" && <span className="campus-tag campus-tag-quiet">AI推断（Mock演示）</span>}</div><time dateTime={item.published_on || undefined}>发布日期：{item.published_on ? item.published_on.slice(0, 10) : "日期待核实"}</time></div>
            <h3>{item.title}</h3>
            <div className="campus-event-classification" aria-label="资讯类别"><div><strong>主类别</strong><span>{item.category || "待确认"}</span></div><div><strong>细类</strong><span>{item.subtype || "待确认"}</span></div></div>
            <p className="campus-event-summary">{item.summary || item.excerpt || "暂无摘要，请查看官方原文。"}</p>
            {item.key_points.length > 0 && <ul className="campus-key-points">{item.key_points.slice(0, 4).map((point, index) => <li key={`${index}-${point}`}>{point}</li>)}</ul>}
            {(item.competition_type || item.competition_tracks.length > 0 || item.stage) && <div className="campus-fact-row"><strong>竞赛信息</strong>{item.competition_type && <span>{item.competition_type}</span>}{item.competition_tracks.map(track => <span key={track}>{track}</span>)}{item.stage && <span>阶段：{item.stage}</span>}</div>}
            {(item.audience || item.action) && <div className="campus-event-facts">{item.audience && <div><strong>面向对象</strong><span>{item.audience}</span></div>}{item.action && <div><strong>下一步</strong><span>{item.action}</span></div>}</div>}
            {(item.dates.length > 0 || item.date_basis === "conflict") && <div className="campus-event-dates">{item.dates.map((date, index) => <span className="campus-event-date" key={`${date.kind}-${date.day}-${index}`} title={`原文依据：${date.evidence}`}>{date.kind}：{date.day}</span>)}{item.date_basis === "future_date" && <span className="campus-tag">依据明确未来日期保留</span>}{item.date_basis === "conflict" && <span className="campus-tag campus-tag-warning">日期冲突，暂不提醒</span>}</div>}
            {unknowns.length > 0 && <p className="campus-unknowns"><strong>尚未确认：</strong>{unknowns.join("；")}</p>}
            <div className="campus-event-footer"><div className="campus-event-sources">{item.origins.map((origin, index) => <a key={`${origin.url}-${index}`} href={origin.url} target="_blank" rel="noreferrer" aria-label={`查看原文：${origin.name}`}>{origin.name} · 查看原文</a>)}</div><div className="campus-event-actions"><button className="campus-follow-button" type="button" aria-pressed={item.followed} aria-label={item.followed ? "取消关注此资讯" : "关注此资讯"} disabled={busy !== null} onClick={() => void run(item.id, () => api.updateCampusEvent(item.id, { followed: !item.followed }))}>{item.followed ? "已关注" : "关注"}</button></div></div>
          </article>; })}</div>
            : <p className="campus-state">{error ? "资讯暂不可用，请稍后刷新。" : "当前范围与筛选条件下暂无资讯。"}</p>}
        {total > PAGE_SIZE && <nav className="campus-pagination" aria-label="校园资讯分页"><span>第 {pageNumber} / {pageCount} 页</span><div className="campus-pagination-controls"><button className="campus-button" type="button" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>上一页</button><button className="campus-button" type="button" disabled={offset + PAGE_SIZE >= total || loading} onClick={() => setOffset(offset + PAGE_SIZE)}>下一页</button></div></nav>}
      </section>
    </div>

    <section className="campus-panel" aria-labelledby="campus-notices-title">
      <div className="campus-panel-heading"><div><p className="campus-panel-kicker">IN-APP REMINDERS</p><h2 id="campus-notices-title">站内提醒</h2></div><span>{notices.filter(notice => !notice.read_at).length} 条未读</span></div>
      {notices.length ? <div className="campus-notices">{notices.map(notice => <article className="campus-notice" key={notice.id}><div className="campus-notice-heading"><h3>{notice.title}</h3><StatusBadge tone={notice.read_at ? "quiet" : "warning"}>{notice.read_at ? "已读" : "未读"}</StatusBadge></div><p>{notice.body}</p><div className="campus-event-actions">{notice.url && <a href={notice.url} target="_blank" rel="noreferrer" aria-label={`查看原文：${notice.source_name || "官方通知来源"}`}>{notice.source_name || "官方通知来源"} · 查看原文</a>}{!notice.read_at && <button type="button" aria-label="标记为已读" disabled={busy !== null} onClick={() => void run(notice.id, () => api.markCampusNoticeRead(notice.id))}>标记为已读</button>}</div></article>)}</div>
        : <p className="campus-state">还没有站内提醒。来源服务运行期间会按计划检查，并在有明确依据时创建提醒。</p>}
    </section>

    <CampusPublicLinks />

    <p className="campus-coverage-note">公开索引只记录从校方网页发现的公众号标题与链接，不代表订阅全部账号。西交学生智慧社区小程序及指定群消息仍待可用连接；登录授权本身不代表读取能力已验证。提醒要求明确日期证据；分类、对象和行动不确定时会标为待核实。</p>
  </section>;
}
