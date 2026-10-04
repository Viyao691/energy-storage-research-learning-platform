"use client";

import "./readability.css";

import LatticeLoader from "../../components/react-bits/LatticeLoader";
import GlassIcons from "../../components/react-bits/GlassIcons";

import React, { useEffect, useState } from "react";
import { EditorialEmptyState, StatusBadge, WorkspaceHeader } from "../../components/WorkspacePrimitives";
import { TopicArtwork } from "../../components/workspace/TopicArtwork";
import ResearchEmptyArt from "../../components/workspace/ResearchEmptyArt";
import { api, ScientificDataset, ScientificImport } from "../../lib/api";
import DatasetDetail from "../../components/research/DatasetDetail";
import "../../components/workspace/tools-refinement.css";
import "../../components/workspace/research-tools-pages.css";
import "../../components/workspace/research-tools-flow.css";

type DatasetFilter = "all" | "favorite" | "read" | "unread";

export default function ResearchDataPage() {
  const [imports, setImports] = useState<ScientificImport[]>([]);
  const [datasets, setDatasets] = useState<ScientificDataset[]>([]);
  const [datasetsLoaded, setDatasetsLoaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<ScientificImport | null>(null);
  const [openDatasetId, setOpenDatasetId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [units, setUnits] = useState("{}");
  const [checkedStructure, setCheckedStructure] = useState(false);
  const [checkedUnits, setCheckedUnits] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"upload" | "confirm" | null>(null);
  const [filter, setFilter] = useState<DatasetFilter>("all");
  const [stateBusyId, setStateBusyId] = useState<number | null>(null);
  const [stateError, setStateError] = useState("");

  useEffect(() => {
    Promise.all([api.scientificImports(), api.allScientificDatasets()]).then(([nextImports, nextDatasets]) => {
      setImports(nextImports);
      setDatasets(nextDatasets.items);
      setDatasetsLoaded(true);
    }).catch(error => setMessage(error.message));
  }, []);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file || busy) return;
    setBusy("upload");
    try { const item = await api.uploadScientificImport(file); setImports(current => [item, ...current]); setSelected(item); setName(file.name.replace(/\.(csv|xlsx)$/i, "")); setUnits("{}"); setCheckedStructure(false); setCheckedUnits(false); setAcceptedPolicy(false); }
    catch (error) { setMessage(error instanceof Error ? error.message : "读取失败"); }
    finally { setBusy(null); }
  }

  async function openImport(item: ScientificImport) {
    setBusy("upload"); setMessage("");
    try { const preview = await api.scientificImport(item.id, item.selected_sheet || undefined); setSelected(preview); setName(item.original_filename.replace(/\.(csv|xlsx)$/i, "")); setUnits("{}"); setCheckedStructure(false); setCheckedUnits(false); setAcceptedPolicy(false); }
    catch (error) { setMessage(error instanceof Error ? error.message : "预览读取失败"); }
    finally { setBusy(null); }
  }

  async function selectSheet(sheet: string) {
    if (!selected) return;
    setBusy("upload"); setMessage("");
    try { setSelected(await api.scientificImport(selected.id, sheet)); setUnits("{}"); setCheckedStructure(false); setCheckedUnits(false); setAcceptedPolicy(false); }
    catch (error) { setMessage(error instanceof Error ? error.message : "工作表读取失败"); }
    finally { setBusy(null); }
  }

  async function confirm() {
    if (!selected || busy || !checkedStructure || !checkedUnits || !acceptedPolicy) return;
    setBusy("confirm");
    try {
      const unitMap = JSON.parse(units);
      if (!unitMap || Array.isArray(unitMap) || typeof unitMap !== "object") throw new SyntaxError();
      const item = await api.confirmScientificImport(selected.id, { name, selected_sheet: selected.selected_sheet, domain: "general", dataset_type: "table", units: unitMap, parameters: { row_column_complete: checkedStructure, unit_complete: checkedUnits, quality_review: { reviewed: true, handling_policy: "exclude_missing_and_non_numeric" } } });
      setDatasets(current => [item, ...current]);
      setImports(current => current.map(entry => entry.id === selected.id ? { ...entry, status: "confirmed" } : entry));
    } catch (error) { setMessage(error instanceof SyntaxError ? "单位映射必须是 JSON 对象" : error instanceof Error ? error.message : "确认失败"); }
    finally { setBusy(null); }
  }

  async function updateState(item: ScientificDataset, field: "is_favorite" | "is_read") {
    if (stateBusyId !== null) return;
    setStateBusyId(item.id);
    setStateError("");
    try {
      const updated = await api.updateScientificDatasetState(item.id, {
        is_favorite: field === "is_favorite" ? !item.is_favorite : item.is_favorite,
        is_read: field === "is_read" ? !item.is_read : item.is_read,
      });
      setDatasets(current => current.map(entry => entry.id === item.id ? updated : entry));
    } catch (error) {
      setStateError(error instanceof Error ? error.message : "数据集状态保存失败");
    } finally { setStateBusyId(null); }
  }

  const importedDatasets = datasets.filter(item => item.source_type === "user_import");
  const confirmedCount = importedDatasets.filter(item => item.confirmation_status === "confirmed" && item.quality?.reviewed).length;
  const pendingCount = importedDatasets.length - confirmedCount;
  const independentCount = datasets.filter(item => !item.paper_id).length;
  const confirmedPercent = importedDatasets.length ? (confirmedCount / importedDatasets.length) * 100 : 0;
  const favoriteCount = datasets.filter(item => item.is_favorite).length;
  const readCount = datasets.filter(item => item.is_read).length;
  const visibleDatasets = datasets.filter(item => filter === "all" || filter === "favorite" && item.is_favorite || filter === "read" && item.is_read || filter === "unread" && !item.is_read);
  const filters = [
    { id: "all", label: "全部", count: datasets.length, color: "blue" as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
    { id: "favorite", label: "我的收藏", count: favoriteCount, color: "orange" as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg> },
    { id: "read", label: "已读", count: readCount, color: "green" as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5c-2.7-1.6-5.7-1.7-9-1v14c3.3-.7 6.3-.6 9 1 2.7-1.6 5.7-1.7 9-1V4c-3.3-.7-6.3-.6-9 1Zm0 0v14" /><path d="m15 11 2 2 3-4" /></svg> },
    { id: "unread", label: "未读", count: datasets.length - readCount, color: "purple" as const, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5c-2.7-1.6-5.7-1.7-9-1v14c3.3-.7 6.3-.6 9 1 2.7-1.6 5.7-1.7 9-1V4c-3.3-.7-6.3-.6-9 1Zm0 0v14" /></svg> },
  ];

  return <section className="workspace-page research-tools-refined data-refined research-data-workspace">
    <WorkspaceHeader eyebrow="RESEARCH TOOLS · DATA" title="科研数据" description="注意：先安全预览 CSV/XLSX，再确认列、单位和必要参数；确认后可供科研流程明确选用。" artwork action={<StatusBadge tone="quiet">不执行公式</StatusBadge>} />
    <ol className="tools-workflow" aria-label="科研数据流程">
      <li><strong>01 · 导入预览</strong><span>查看表格与工作表内容，核对列结构。</span></li>
      <li><strong>02 · 确认数据</strong><span>检查名称、单位与参数后再保存。</span></li>
      <li><strong>03 · 按需使用</strong><span>在想法或分析流程中明确选择数据集。</span></li>
    </ol>
    {datasetsLoaded && <>
      <section className="tools-metrics data-metrics" aria-label="已加载数据概况">
        <div className="tools-metric"><span>用户已核对</span><strong>{confirmedCount}</strong></div>
        <div className="tools-metric"><span>待复核</span><strong>{pendingCount}</strong></div>
        <div className="tools-metric"><span>独立数据</span><strong>{independentCount}</strong></div>
      </section>
      <section className="data-status-panel card" aria-label="用户导入复核状态分布">
        <div><div><strong>用户导入复核状态</strong><span>{importedDatasets.length} 个用户导入数据集</span></div><span className="data-status-legend"><i className="data-status-confirmed" />用户已核对 {confirmedCount}<i className="data-status-pending" />待复核 {pendingCount}</span></div>
        <div className="data-status-track" role="img" aria-label={`用户已核对 ${confirmedCount} 个，待复核 ${pendingCount} 个`}><span className="data-status-confirmed" style={{ width: `${confirmedPercent}%` }} /><span className="data-status-pending" style={{ width: `${100 - confirmedPercent}%` }} /></div>
      </section>
    </>}
    {message && <p className="error">{message}</p>}
    {!datasetsLoaded && !message && <LatticeLoader label="正在读取科研数据…" showTimer />}
    {busy && <LatticeLoader label={busy === "upload" ? "正在读取数据预览…" : "正在确认数据集…"} showTimer />}
    <section className="data-import-panel card">
      <div className="data-section-heading"><div><p className="data-kicker">SAFE IMPORT</p><h2>导入并预览</h2></div><TopicArtwork text="科研数据表格" motif="datacube" className="data-import-artwork" /></div>
      <form className="row data-import-form" onSubmit={upload}><label>选择 CSV 或 XLSX<input aria-label="选择 CSV 或 XLSX" type="file" accept=".csv,.xlsx" onChange={event => setFile(event.target.files?.[0] || null)} /></label><button disabled={busy !== null}>读取预览</button></form>
      {!!imports.length && <div className="data-import-history"><h3>历史导入</h3>{imports.map(item => <button className="secondary" type="button" key={item.id} disabled={busy !== null} onClick={() => void openImport(item)} aria-label={`预览 ${item.original_filename}`}>预览 {item.original_filename} · {item.status === "confirmed" ? "已保存" : "待确认"}</button>)}</div>}
    </section>
    {selected && <section className="card data-preview-panel">
      <div className="row"><div><p className="data-kicker">CHECK BEFORE SAVING</p><h2>{selected.original_filename}</h2></div><StatusBadge tone="warning">待确认</StatusBadge></div>
      <p>{selected.row_count} 行 · {selected.column_count} 列{selected.selected_sheet ? ` · ${selected.selected_sheet}` : ""}</p>
      {selected.available_sheets.length > 1 && <label>工作表<select aria-label="工作表" value={selected.selected_sheet || ""} disabled={busy !== null} onChange={event => void selectSheet(event.target.value)}>{selected.available_sheets.map(sheet => <option key={sheet} value={sheet}>{sheet}</option>)}</select></label>}
      <div className="data-quality-grid">{Object.keys(selected.column_types).map(column => <p key={column}><strong>{column}</strong> · {selected.column_types[column]} · 缺失 {selected.missing_values[column] || 0} · 区间 {selected.range_values?.[column] || 0} · 无效 {selected.invalid_values?.[column] || 0}</p>)}</div>
      <p>预览显示前 {Math.min(Math.max(Math.min(selected.preview.length, 8) - 1, 0), selected.row_count)} / {selected.row_count} 行；区间值与非数值保留原样，基础统计将排除它们。</p>
      <div className="table-scroll"><table><tbody>{selected.preview.slice(0, 8).map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{String(cell ?? "")}</td>)}</tr>)}</tbody></table></div>
      <div className="data-confirm-fields"><label>数据集名称<input value={name} onChange={event => setName(event.target.value)} /></label><label>单位映射（JSON）<textarea value={units} onChange={event => setUnits(event.target.value)} /></label></div>
      <div className="data-review-checks"><label><input type="checkbox" checked={checkedStructure} onChange={event => setCheckedStructure(event.target.checked)} />已核对行列结构</label><label><input type="checkbox" checked={checkedUnits} onChange={event => setCheckedUnits(event.target.checked)} />已核对单位映射</label><label><input type="checkbox" checked={acceptedPolicy} onChange={event => setAcceptedPolicy(event.target.checked)} />接受缺失和非数值样本排除策略</label></div>
      <button onClick={confirm} disabled={busy !== null || !name.trim() || !checkedStructure || !checkedUnits || !acceptedPolicy}>确认列、单位与参数</button>
    </section>}
    <section className="data-dataset-section" aria-labelledby="dataset-title">
      <div className="data-section-heading data-dataset-heading"><div><p className="data-kicker">YOUR DATASETS</p><h2 id="dataset-title">已加载数据集</h2></div>{datasetsLoaded && <span>{datasets.length} 个</span>}</div>
      {datasetsLoaded && <GlassIcons items={filters} value={filter} onChange={value => setFilter(value as DatasetFilter)} label="数据集筛选" panelId="data-dataset-results" className="data-dataset-filters" />}
      {stateError && <p className="data-dataset-state-error" role="alert">{stateError}</p>}
      <div id="data-dataset-results" role="tabpanel" aria-label="数据集筛选结果" className="research-card-grid data-dataset-grid">{visibleDatasets.map((item, index) => <article className="card data-dataset-card" key={item.id} aria-busy={stateBusyId === item.id}>
        <TopicArtwork text={`${item.name} ${item.dataset_type}`} variant={index} className="data-dataset-artwork" />
        <div className="data-dataset-copy"><StatusBadge tone={item.source_type === "user_import" ? item.confirmation_status === "confirmed" && item.quality?.reviewed ? "ready" : "warning" : item.confirmation_status === "confirmed" ? "ready" : "warning"}>{item.source_type === "user_import" ? item.confirmation_status === "confirmed" && item.quality?.reviewed ? "用户已核对" : "待复核" : item.confirmation_status === "confirmed" ? "已确认" : "待确认"}</StatusBadge><h3>{item.name}</h3><p>{item.dataset_type} · {item.paper_id ? `论文 ${item.paper_id}` : "独立数据集"}</p>
          <div className="data-dataset-actions">
            <button type="button" aria-label={`查看 ${item.name}`} onClick={() => setOpenDatasetId(item.id)}>查看</button>
            <button type="button" aria-label={`${item.is_favorite ? "取消收藏" : "收藏"} ${item.name}`} aria-pressed={item.is_favorite} disabled={stateBusyId !== null} onClick={() => void updateState(item, "is_favorite")}>{item.is_favorite ? "★ 已收藏" : "☆ 收藏"}</button>
            <button type="button" aria-label={`${item.is_read ? "标记未读" : "标记已读"} ${item.name}`} aria-pressed={item.is_read} disabled={stateBusyId !== null} onClick={() => void updateState(item, "is_read")}>{item.is_read ? "✓ 已读" : "标记已读"}</button>
          </div>
        </div>
      </article>)}</div>
      {datasetsLoaded && !datasets.length && <><ResearchEmptyArt /><EditorialEmptyState title="尚无科研数据集" description="导入文件、核对预览并确认后，数据集会出现在这里。" /></>}
      {datasetsLoaded && !!datasets.length && !visibleDatasets.length && <EditorialEmptyState title="当前筛选下没有数据集" description="可切换其他分类查看已加载数据集。" />}
    </section>
    {openDatasetId !== null && <DatasetDetail key={openDatasetId} id={openDatasetId} onClose={() => setOpenDatasetId(null)} onUpdate={updated => setDatasets(current => current.map(item => item.id === updated.id ? updated : item))} />}
  </section>;
}
