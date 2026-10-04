"use client";

import React, { useEffect, useRef, useState } from "react";
import { api, LearningPack, LearningPackComparison } from "../lib/api";
import { StatusBadge } from "./WorkspacePrimitives";
import GlideSelect from "./react-bits/GlideSelect";
import LatticeLoader from "./react-bits/LatticeLoader";

const STATUS_LABEL = { active: "当前激活", draft: "草稿", archived: "已归档" } as const;

export function LearningVersionsPanel({ pack, onChange }: { pack: LearningPack; onChange: (pack: LearningPack) => void }) {
  const [versions, setVersions] = useState<LearningPack[]>([]);
  const [compareId, setCompareId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<LearningPackComparison | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const pendingRef = useRef(false);
  const load = async () => setVersions((await api.learningVersions(pack.id)).items);
  useEffect(() => {
    let current = true;
    setLoading(true); setMessage("");
    api.learningVersions(pack.id).then(result => { if (current) setVersions(result.items); }).catch(error => { if (current) setMessage(error instanceof Error ? error.message : "读取版本列表失败"); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [pack.id]);
  async function run(label: string, action: () => Promise<void>) {
    if (pendingRef.current) return;
    pendingRef.current = true; setPending(label); setMessage("");
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "操作失败"); }
    finally { pendingRef.current = false; setPending(""); }
  }

  async function createVersion() {
    await run("正在创建草稿版本…", async () => { const created = await api.createLearningVersion(pack.id); setVersions(current => [created, ...current]); setMessage(`已创建草稿 v${created.version_number}`); });
  }
  const activate = (id: number) => run("正在激活版本…", async () => { const updated = await api.activateLearningPack(id); if (id === pack.id) onChange(updated); await load(); });
  const archive = (id: number) => run("正在归档版本…", async () => { const updated = await api.archiveLearningPack(id); if (id === pack.id) onChange(updated); await load(); });
  function compare() { if (compareId === null) return; return run("正在比较版本…", async () => { setComparison(await api.compareLearningPacks(compareId, pack.id)); }); }

  return <section className="learning-version-panel">
    <div className="learning-section-toolbar"><div><h2>版本与导出</h2><p>新版本先成为草稿；激活时会原子归档同谱系原 active 版本。</p></div><button disabled={Boolean(pending) || loading} onClick={createVersion}>基于当前解析创建草稿</button></div>
    {loading && <LatticeLoader label="正在读取版本列表…" showTimer className="learning-operation-loading" />}
    {pending && <LatticeLoader label={pending} showTimer className="learning-operation-loading" />}
    {message && <p className="learning-review-message">{message}</p>}
    <div className="learning-version-actions card">
      <a className="button-link" href={api.learningExportUrl(pack.id, "markdown")} download>导出 Markdown</a>
      <a className="button-link secondary" href={api.learningExportUrl(pack.id, "json")} download>导出 JSON</a>
      <label>比较版本<GlideSelect ariaLabel="比较版本" value={compareId ?? ""} onChange={value => setCompareId(value ? Number(value) : null)} options={[{ value: "", label: "选择版本" }, ...versions.filter(item => item.id !== pack.id).map(item => ({ value: String(item.id), label: `v${item.version_number} · ${STATUS_LABEL[item.lifecycle_status]}` }))]} /></label>
      <button className="secondary" disabled={compareId === null || Boolean(pending) || loading} onClick={compare}>比较</button>
    </div>
    {comparison && <div className="card learning-comparison"><h3>确定性差异</h3><p>来源变更：{comparison.source_changes.changed.join("、") || "无"}</p><p>新增卡片：{comparison.cards.added.join("、") || "无"}</p><p>移除卡片：{comparison.cards.removed.join("、") || "无"}</p><p>题目变更：{comparison.questions.changed.join("、") || "无"}</p></div>}
    <div className="learning-version-list">{versions.map(item => <article className="card" key={item.id}><div><h3>v{item.version_number} · {item.title}</h3><p>卡片 {item.card_count} · 题目 {item.question_count}</p></div><div className="learning-actions"><StatusBadge tone={item.lifecycle_status === "active" ? "ready" : "quiet"}>{STATUS_LABEL[item.lifecycle_status]}</StatusBadge>{item.lifecycle_status !== "active" && <button className="secondary" disabled={Boolean(pending)} onClick={() => activate(item.id)}>激活</button>}{item.lifecycle_status !== "archived" && <button className="secondary" disabled={Boolean(pending)} onClick={() => archive(item.id)}>归档</button>}</div></article>)}</div>
  </section>;
}
