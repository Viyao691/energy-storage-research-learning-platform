"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";

import React, { useEffect, useState } from "react";
import { StatusBadge, WorkspaceHeader } from "../../components/WorkspacePrimitives";
import { api, Backup, CleanupPreview, StorageStats } from "../../lib/api";
import "../../components/workspace/system-refinement.css";

function bytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatBeijingTime(value: string) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second}（北京时间）`;
}

export default function MaintenancePage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [message, setMessage] = useState("");
  const sizeRows = stats ? [
    { key: "managed", label: "受管文件", detail: `${stats.managed_files} 个文件`, value: stats.managed_bytes },
    { key: "backup", label: "备份归档", detail: `${stats.backup_count} 份备份`, value: stats.backup_bytes },
    { key: "cache", label: "可再生成缓存", detail: `${stats.cache_files} 个文件`, value: stats.cache_bytes }
  ] : [];
  const scale = Math.max(1, ...sizeRows.map(row => row.value));
  async function load() { const [nextStats, nextBackups] = await Promise.all([api.storageStats(), api.backups()]); setStats(nextStats); setBackups(nextBackups); }
  useEffect(() => { load().catch(error => setMessage(error.message)); }, []);
  async function run(action: () => Promise<void>) { setMessage(""); try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : "操作失败"); } }
  async function deleteBackup(item: Backup) {
    const confirmed = window.confirm(`确认删除这份备份？\n\n文件名：${item.name}\n时间：${formatBeijingTime(item.created_at)}\n大小：${bytes(item.size_bytes)}\nSHA-256：${item.sha256.slice(0, 12)}…\n\n当前数据库和论文不会被删除。`);
    if (!confirmed) return;
    await run(async () => {
      await api.deleteBackup(item.name);
      await load();
      setMessage(`已删除备份 ${item.name}`);
    });
  }
  return <section className="workspace-page maintenance-workspace system-refined">
    <WorkspaceHeader eyebrow="SYSTEM · MAINTENANCE" title="存储与备份"  artwork action={<StatusBadge tone="ready">原始资料默认保留</StatusBadge>} />
    {message && <p className="error">{message}</p>}
    <section className="card system-storage-panel" aria-label="存储分项">
      <div className="system-panel-heading"><span className="system-panel-glyph" aria-hidden="true">▥</span><div><small>MANAGED STORAGE</small><h2>空间分项</h2></div></div>
      {stats ? <>
        <div className="system-storage-rows">{sizeRows.map(row => <div className={`system-storage-row storage-${row.key}`} key={row.key}><div><strong>{row.label}</strong><small>{row.detail}</small></div><div className="system-storage-measure"><strong>{bytes(row.value)}</strong><span className="system-storage-track" aria-hidden="true"><span style={{ width: `${row.value / scale * 100}%` }} /></span></div></div>)}</div>
        
      </> : message ? <p className="muted">受管存储统计暂不可用，请查看上方提示。</p> : <LatticeLoader label="正在读取受管存储统计…" showTimer />}
    </section>
    <section className="card system-backup-panel"><div className="row"><div><div className="system-panel-heading"><span className="system-panel-glyph" aria-hidden="true">◷</span><div><small>VERIFIED ARCHIVES</small><h2>备份时间线</h2></div></div><p>包含数据库、受管文件、清单与 SHA-256；不包含环境文件、主密钥或 OCR 模型。</p></div><button onClick={() => run(async () => { const item = await api.createBackup(); setBackups(current => [item, ...current]); await load(); })}>立即创建备份</button></div><div className="system-backup-timeline">{backups.map(item => <article className="maintenance-row" key={item.name}><div><strong>{item.name}</strong><p>{formatBeijingTime(item.created_at)} · {item.file_count} 个清单项 · {bytes(item.size_bytes)}</p></div><div className="maintenance-backup-actions"><code>{item.sha256.slice(0, 12)}…</code><button aria-label={`删除备份 ${item.name}`} className="secondary" disabled={backups.length <= 1} title={backups.length <= 1 ? "至少保留一份备份" : "删除这份备份"} onClick={() => deleteBackup(item)}>删除备份</button>{backups.length <= 1 && <small>最后一份备份受保护</small>}</div></article>)}{!backups.length && <p className="muted">暂无可显示的备份记录。</p>}</div></section>
    <section className="card system-cleanup-panel"><div className="system-panel-heading"><span className="system-panel-glyph" aria-hidden="true">⌑</span><div><small>REVIEW BEFORE CLEANUP</small><h2>安全清理</h2></div></div><p>只识别受管缓存目录中的临时文件；论文原件、OCR 模型、确认数据、当前派生 PDF 与备份不会列入。</p><button className="secondary" onClick={() => run(async () => setPreview(await api.previewStorageCleanup()))}>预览可清理缓存</button>{preview && <div className="cleanup-preview"><p>预计释放 {bytes(preview.bytes_reclaimable)}</p>{preview.paths.length ? <ul>{preview.paths.map(path => <li key={path}>{path}</li>)}</ul> : <p>当前没有可清理缓存。</p>}<button disabled={!preview.paths.length} onClick={() => run(async () => { await api.confirmStorageCleanup(preview.token); setMessage(`已清理 ${preview.paths.length} 个可再生成缓存文件`); setPreview(null); await load(); })}>确认清理 {preview.paths.length} 个文件</button></div>}</section>
  </section>;
}
