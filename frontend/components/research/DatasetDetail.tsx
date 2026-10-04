"use client";

import React, { useEffect, useState } from "react";
import LatticeLoader from "../react-bits/LatticeLoader";
import { api, ScientificAnalysis, ScientificDataset } from "../../lib/api";

const PAGE_SIZE = 50;

function count(value: Record<string, number>, key: string) { return value[key] || 0; }
function recorded(value: Record<string, unknown>, key: string) { return value[key] == null ? "未记录" : String(value[key]); }

function tableColumns(results: Record<string, unknown>): Array<[string, Record<string, unknown>]> {
  const columns = results.columns;
  if (!columns || typeof columns !== "object" || Array.isArray(columns)) return [];
  return Object.entries(columns).filter((entry): entry is [string, Record<string, unknown>] => !!entry[1] && typeof entry[1] === "object" && !Array.isArray(entry[1]));
}

export default function DatasetDetail({ id, onClose, onUpdate }: { id: number; onClose: () => void; onUpdate: (item: ScientificDataset) => void }) {
  const [item, setItem] = useState<ScientificDataset | null>(null);
  const [analyses, setAnalyses] = useState<ScientificAnalysis[]>([]);
  const [page, setPage] = useState(0);
  const [checked, setChecked] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [sourceReference, setSourceReference] = useState("");
  const [unitsText, setUnitsText] = useState("{}");
  const [sourceUrl, setSourceUrl] = useState("");
  const [dataOrigin, setDataOrigin] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.scientificDataset(id), api.scientificDatasetAnalyses(id)]).then(([next, history]) => {
      setItem(next); setAnalyses(history);
      setUnitsText(JSON.stringify(next.units, null, 2));
      setSourceReference(String(next.parameters.source_reference || ""));
      setSourceUrl(String(next.parameters.source_url || ""));
      setDataOrigin(String(next.parameters.data_origin || ""));
    }).catch(cause => setError(cause instanceof Error ? cause.message : "读取数据集失败"));
  }, [id]);

  async function saveReview() {
    if (!item || !checked || !policyAccepted || busy) return;
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) { setError("来源链接须为 http(s) 地址"); return; }
    let units: Record<string, string>;
    try { const parsed = JSON.parse(unitsText); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || Object.values(parsed).some(value => typeof value !== "string")) throw new Error(); units = parsed; }
    catch { setError("单位映射必须是 JSON 对象，值须为文字"); return; }
    setBusy("正在保存复核…"); setError("");
    try {
      const updated = await api.updateScientificDataset(id, { units, parameters: { ...item.parameters, row_column_complete: true, unit_complete: true, source_reference: sourceReference, source_url: sourceUrl, data_origin: dataOrigin, quality_review: { reviewed: true, handling_policy: "exclude_missing_and_non_numeric" } }, confirmed: true });
      setItem(updated); onUpdate(updated);
      setAnalyses(await api.scientificDatasetAnalyses(id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "复核保存失败"); }
    finally { setBusy(""); }
  }

  async function analyze() {
    if (!item?.quality?.reviewed || busy) return;
    setBusy("正在计算基础统计…"); setError("");
    try { const result = await api.runScientificAnalysis(id, "generic.table_statistics", {}); setAnalyses(current => [result, ...current]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "统计失败"); }
    finally { setBusy(""); }
  }

  if (!item) return <section className="card data-detail-panel" aria-label="数据集详情"><button type="button" onClick={onClose}>关闭详情</button>{error ? <p role="alert">{error}</p> : <LatticeLoader label="正在读取完整数据…" showTimer />}</section>;
  const columns = Object.entries(item.data).filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]));
  const rowCount = Math.max(0, ...columns.map(([, values]) => values.length));
  const first = page * PAGE_SIZE;
  const quality = item.quality;
  return <section className="card data-detail-panel" aria-label="数据集详情">
    <div className="data-detail-heading"><div><p className="data-kicker">DATASET DETAIL</p><h2>{item.name}</h2><p>{rowCount} 行 · {columns.length} 列 · {quality?.reviewed ? "用户已核对" : "需要重新核对"}</p></div><button type="button" className="secondary" onClick={onClose}>关闭详情</button></div>
    <p className="data-quality-note">“已核对”表示用户接受处理策略，不表示没有缺失、区间或无效样本，也不表示实验结果可信。</p>
    <div className="data-quality-grid">{columns.map(([column]) => <p key={column}><strong>{column}</strong> · {String(item.units[column] || "无单位")} · {quality?.column_types[column] || "未知类型"} · 缺失 {quality ? count(quality.missing_values, column) : 0} · 区间 {quality ? count(quality.range_values, column) : 0} · 无效 {quality ? count(quality.invalid_values, column) : 0}</p>)}</div>
    <div className="table-scroll"><table><thead><tr><th>行</th>{columns.map(([name]) => <th key={name}>{name}</th>)}</tr></thead><tbody>{Array.from({ length: Math.min(PAGE_SIZE, rowCount - first) }, (_, offset) => <tr key={first + offset}><th>{first + offset + 1}</th>{columns.map(([name, values]) => <td key={name}>{String(values[first + offset] ?? "")}</td>)}</tr>)}</tbody></table></div>
    {rowCount > PAGE_SIZE && <div className="data-pagination"><button type="button" disabled={page === 0} onClick={() => setPage(current => current - 1)}>上一页</button><span>{first + 1}–{Math.min(first + PAGE_SIZE, rowCount)} / {rowCount}</span><button type="button" disabled={first + PAGE_SIZE >= rowCount} onClick={() => setPage(current => current + 1)}>下一页</button></div>}
    <div className="data-review-fields"><label>单位映射（JSON）<textarea aria-label="现有数据单位映射" value={unitsText} onChange={event => setUnitsText(event.target.value)} /></label><label>来源说明<input value={sourceReference} onChange={event => setSourceReference(event.target.value)} placeholder="例如 DOI 与 Table 2" /></label><label>来源链接<input value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://…" /></label><label>数据性质<input value={dataOrigin} onChange={event => setDataOrigin(event.target.value)} placeholder="例如文献汇总、模拟或实验" /></label></div>
    <div className="data-review-checks"><label><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />已核对现有数据的行列和单位</label><label><input type="checkbox" checked={policyAccepted} onChange={event => setPolicyAccepted(event.target.checked)} />接受有效数值统计策略</label></div>
    <p className="data-quality-note">基础统计仅纳入有效数值；缺失、区间和无效值保留在原表并逐列报告排除数量。跨来源汇总数据的均值不能直接解释为实验结论。</p>
    <div className="data-detail-actions"><button type="button" disabled={!checked || !policyAccepted || !!busy} onClick={() => void saveReview()}>保存复核</button><button type="button" disabled={!item.quality?.reviewed || !!busy} onClick={() => void analyze()}>运行基础统计</button></div>
    {busy && <LatticeLoader label={busy} showTimer />}{error && <p role="alert" className="error">{error}</p>}
    <div className="data-analysis-history"><h3>已保存分析</h3>{analyses.map(analysis => {
      const stats = tableColumns(analysis.results);
      const oldDiagnostics = stats.some(([, result]) => ["total_count", "excluded_count", "missing_count", "range_count", "invalid_count"].some(key => result[key] == null));
      return <article key={analysis.id}>
        <p>{analysis.recipe} · 算法版本：{analysis.algorithm_version} · {analysis.status} {analysis.is_stale ? "· 数据已更新，结果过期" : ""}</p>
        {oldDiagnostics && <p>旧版分析未记录样本排除诊断；“未记录”不能当作 0。</p>}
        {stats.length > 0 && <div className="table-scroll"><table>
          <thead><tr><th>列</th><th>有效 / 总计</th><th>排除（缺失 / 区间 / 无效）</th><th>均值</th><th>样本标准差</th><th>异常 CSV 行号（含表头）</th><th>状态与原因</th></tr></thead>
          <tbody>{stats.map(([column, result]) => <tr key={column}>
            <th>{column}</th><td>{recorded(result, "count")} / {recorded(result, "total_count")}</td>
            <td>{recorded(result, "excluded_count")}（{recorded(result, "missing_count")} / {recorded(result, "range_count")} / {recorded(result, "invalid_count")}）</td>
            <td>{result.mean == null ? "—" : String(result.mean)}</td><td>{result.standard_deviation == null ? "—" : String(result.standard_deviation)}</td>
            <td>{Array.isArray(result.outlier_indices) ? result.outlier_indices.map(index => Number(index) + 2).join("、") || "无" : "未记录"}</td>
            <td>{result.status === "skipped" ? "跳过" : result.status === "included" ? "纳入" : "未记录"} {String(result.reason || "")}</td>
          </tr>)}</tbody>
        </table></div>}
        {analysis.status === "completed" && !analysis.is_stale && <a href={api.scientificExportUrl(analysis.id)} download>下载分析 ZIP</a>}
      </article>;
    })}{!analyses.length && <p>暂无分析记录。</p>}</div>
  </section>;
}
