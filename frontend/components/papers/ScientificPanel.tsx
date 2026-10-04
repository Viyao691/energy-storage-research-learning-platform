"use client";

import React, { useRef, useState } from "react";
import type { PaperVisual, ScientificAnalysis, ScientificDataset, ScientificRecipe } from "../../lib/api";
import { api } from "../../lib/api";
import { MarkdownContent } from "../MarkdownContent";
import GlideSelect from "../react-bits/GlideSelect";
import { numericCell, readScientificObject, SCIENTIFIC_FORMS, validateScientificForm } from "./scientificForm";
import type { ScientificColumn } from "./scientificForm";
import "./scientific-form.css";

type ScientificPanelProps = {
  id: string;
  selectedVisual: PaperVisual | undefined;
  scientificDatasets: ScientificDataset[];
  scientificRecipes: ScientificRecipe[];
  selectedDatasetId: number | null;
  setSelectedDatasetId: (id: number | null) => void;
  scientificData: string;
  setScientificData: (value: string) => void;
  scientificUnits: string;
  setScientificUnits: (value: string) => void;
  scientificParameters: string;
  setScientificParameters: (value: string) => void;
  scientificRecipe: string;
  setScientificRecipe: (value: string) => void;
  scientificResult: ScientificAnalysis | null;
  scientificBusy: boolean;
  scientificMessage?: string;
  createScientificDraft: () => void;
  saveScientificDataset: (confirm?: boolean) => void;
  runScientificRecipe: () => void;
};

const QUALITY_FIELDS = [
  ["row_column_complete", "我已核对数据行、列及其对应关系"],
  ["unit_complete", "我已核对单位与必要实验参数"],
  ["cells_complete", "我已逐项核对数值与论文或原始数据一致"],
] as const;

export function ScientificPanel(props: ScientificPanelProps) {
  const { selectedVisual, scientificDatasets, scientificRecipes, selectedDatasetId, setSelectedDatasetId,
    scientificData, setScientificData, scientificUnits, setScientificUnits, scientificParameters, setScientificParameters,
    scientificRecipe, setScientificRecipe, scientificResult, scientificBusy, scientificMessage,
    createScientificDraft, saveScientificDataset, runScientificRecipe } = props;
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newColumn, setNewColumn] = useState("");
  const [extraRows, setExtraRows] = useState(0);
  const drafts = useRef<Record<string, { data: string; units: string; parameters: string }>>({});
  const form = SCIENTIFIC_FORMS[scientificRecipe];
  const data = readScientificObject(scientificData);
  const units = readScientificObject(scientificUnits);
  const parameters = readScientificObject(scientificParameters);
  const isGroup = scientificRecipe === "generic.group_compare";
  const values = isGroup ? (data.groups ?? {}) as Record<string, unknown> : data;
  const dynamicColumns = form?.columns.length === 0;
  const columns: ScientificColumn[] = dynamicColumns
    ? (Object.keys(values).filter(key => Array.isArray(values[key])).length ? Object.keys(values).filter(key => Array.isArray(values[key])) : isGroup ? ["组1", "组2"] : ["数值"]).map(key => ({ key, label: key }))
    : form?.columns.filter(column => !column.optional || Array.isArray(data[column.key])) ?? [];
  const rowCount = Math.max(form?.minRows ?? 1, extraRows, ...columns.map(column => Array.isArray(values[column.key]) ? (values[column.key] as unknown[]).length : 0));
  const effectiveUnits = { ...units };
  for (const column of columns) if (column.unit && effectiveUnits[column.key] === undefined) effectiveUnits[column.key] = column.unit;
  const selected = scientificDatasets.find(item => item.id === selectedDatasetId);
  const saved = !!selected && JSON.stringify(selected.data) === JSON.stringify(data) && JSON.stringify(selected.units) === JSON.stringify(effectiveUnits) && JSON.stringify(selected.parameters) === JSON.stringify(parameters);
  const confirmed = saved && selected?.confirmation_status === "confirmed";

  function writeParameters(next: Record<string, unknown>, invalidate = true) {
    if (invalidate) for (const [key] of QUALITY_FIELDS) next[key] = false;
    setScientificParameters(JSON.stringify({ ...next, recipe_key: scientificRecipe }));
    setError("");
  }
  function writeData(nextValues: Record<string, unknown>) {
    setScientificData(JSON.stringify(isGroup ? { groups: nextValues } : nextValues));
    setScientificUnits(JSON.stringify(effectiveUnits));
    if (QUALITY_FIELDS.some(([key]) => parameters[key] === true)) writeParameters({ ...parameters });
    setError("");
  }
  function changeCell(key: string, row: number, value: string) {
    const next = { ...values };
    if (isGroup) {
      for (const column of columns) if (!Array.isArray(next[column.key])) next[column.key] = [];
      const list = [...(Array.isArray(next[key]) ? next[key] as unknown[] : [])];
      while (list.length <= row) list.push("");
      list[row] = numericCell(value);
      while (list.length && list[list.length - 1] === "") list.pop();
      next[key] = list;
    } else {
      for (const column of columns) {
        const list = [...(Array.isArray(next[column.key]) ? next[column.key] as unknown[] : [])];
        while (list.length < rowCount) list.push("");
        if (column.key === key) list[row] = numericCell(value);
        next[column.key] = list;
      }
    }
    writeData(next);
  }
  function changeRecipe(next: string) {
    drafts.current[scientificRecipe] = { data: scientificData, units: scientificUnits, parameters: scientificParameters };
    const draft = drafts.current[next];
    setScientificRecipe(next);
    setSelectedDatasetId(null);
    setScientificData(draft?.data ?? "{}");
    setScientificUnits(draft?.units ?? "{}");
    setScientificParameters(draft?.parameters ?? "{}");
    setExtraRows(0);
    setError("");
    setNotice("已切换为独立草稿；切回可继续编辑先前数据，已保存的数据集保留。 ");
  }
  function chooseDataset(value: string) {
    drafts.current[scientificRecipe] = { data: scientificData, units: scientificUnits, parameters: scientificParameters };
    const next = scientificDatasets.find(item => item.id === Number(value));
    setSelectedDatasetId(next?.id ?? null);
    setExtraRows(0);
    setError("");
    if (next) {
      const recipe = String(next.parameters.recipe_key ?? "");
      if (SCIENTIFIC_FORMS[recipe]) setScientificRecipe(recipe);
      setScientificData(JSON.stringify(next.data));
      setScientificUnits(JSON.stringify(next.units));
      setScientificParameters(JSON.stringify(next.parameters));
      setNotice(recipe ? "已载入已保存的数据；修改后请重新核对并人工确认。" : "此数据集没有记录计算方法，请核对当前方法及所需数据列。原始结构可在下方展开查看。 ");
    } else {
      setScientificData("{}"); setScientificUnits("{}"); setScientificParameters("{}");
      setNotice("已打开空白草稿；刚才的草稿可切换计算方法后再切回恢复。 ");
    }
  }
  function submit(action: "create" | "save" | "confirm" | "run") {
    const validation = validateScientificForm(scientificRecipe, data, effectiveUnits, parameters, columns);
    if (validation) { setError(validation); return; }
    if ((action === "confirm" || action === "run") && !QUALITY_FIELDS.every(([key]) => parameters[key] === true)) {
      setError("请完成下面三项人工核对，再确认数据。"); return;
    }
    setError(""); setNotice("");
    if (action === "create") createScientificDraft();
    else if (action === "run") runScientificRecipe();
    else saveScientificDataset(action === "confirm");
  }
  function addColumn() {
    const key = newColumn.trim();
    if (!key || Object.prototype.hasOwnProperty.call(values, key)) { setError("请填写一个不重复的数值列名。"); return; }
    const next = { ...values };
    if (isGroup) for (const column of columns) if (!Array.isArray(next[column.key])) next[column.key] = [];
    next[key] = [];
    writeData(next); setNewColumn("");
  }
  function auxiliaryTable(kind: "peak" | "scan") {
    const peak = kind === "peak";
    const rows: unknown[][] = peak
      ? (Array.isArray(parameters.peak_ranges) ? parameters.peak_ranges as unknown[][] : [["", ""]])
      : Array.from({ length: Math.max(2, (parameters.scan_rates as unknown[] | undefined)?.length ?? 0) }, (_, index) => [(parameters.scan_rates as unknown[] | undefined)?.[index] ?? "", (parameters.peak_currents as unknown[] | undefined)?.[index] ?? ""]);
    const labels = peak ? ["区间下限", "区间上限"] : ["扫描速率", "峰电流"];
    function saveRows(next: unknown[][]) {
      if (peak) writeParameters({ ...parameters, peak_ranges: next });
      else writeParameters({ ...parameters, scan_rates: next.map(row => row[0]), peak_currents: next.map(row => row[1]) });
    }
    return <div className="scientific-table-wrap"><table className="scientific-data-table"><caption>{peak ? "峰位约束区间（使用横轴单位）" : "多扫速率数据（各列使用同一单位）"}</caption><thead><tr>{labels.map(label => <th key={label}>{label}</th>)}<th>操作</th></tr></thead><tbody>{rows.map((pair, index) => <tr key={index}>{labels.map((label, cell) => <td key={label}><input aria-label={`第${index + 1}组 ${label}`} inputMode="decimal" value={String(pair[cell] ?? "")} placeholder={peak ? cell ? "例如 535" : "例如 530" : cell ? "例如 0.001" : "例如 0.1"} onChange={event => saveRows(rows.map((row, i) => i === index ? row.map((value, j) => j === cell ? numericCell(event.target.value) : value) : row))} /></td>)}<td><button type="button" className="secondary" disabled={rows.length <= (peak ? 1 : 2)} onClick={() => saveRows(rows.filter((_, i) => i !== index))}>删除</button></td></tr>)}</tbody></table><button type="button" className="secondary" onClick={() => saveRows([...rows, ["", ""]])}>{peak ? "添加峰位区间" : "添加扫描速率"}</button></div>;
  }

  return <div role="tabpanel" className="analysis-tab-panel scientific-workbench">
    <h2>科研数据</h2>
    <p className="muted">用于计算你提供的论文或实验数值。数据可来自论文表格、补充材料、仪器导出文件，或手工数字化的曲线点；目前不会自动从图片提取曲线坐标。</p>
    <label htmlFor="scientific-dataset">数据集</label>
    <GlideSelect id="scientific-dataset" ariaLabel="数据集" value={selectedDatasetId ?? ""} onChange={chooseDataset} disabled={scientificBusy} options={[{ value: "", label: "新建数据草稿" }, ...scientificDatasets.map(item => ({ value: String(item.id), label: `#${item.id} ${item.name || "论文数据"} · ${item.confirmation_status === "confirmed" ? "已确认" : "待确认"}${item.is_stale ? " · 已过期" : ""}` }))]} />
    <label htmlFor="scientific-recipe">计算方法</label>
    <GlideSelect id="scientific-recipe" ariaLabel="计算方法" value={scientificRecipe} onChange={changeRecipe} disabled={scientificBusy} options={scientificRecipes.map(recipe => ({ value: recipe.key, label: `${SCIENTIFIC_FORMS[recipe.key]?.title ?? recipe.description} · v${recipe.algorithm_version}` }))} />
    {notice && <p role="status" className="muted">{notice}</p>}
    {form && <>
      <p className="scientific-purpose">{form.purpose}</p>
      {selectedVisual && <p className="muted">原图对照：{selectedVisual.label} · 第{selectedVisual.page_number}页。选中图片仅用于对照，不会自动填写下面的数据。</p>}
      <fieldset disabled={scientificBusy} className="scientific-fields">
        <legend>1. 填写数值与单位</legend>
        <p className="muted">示例仅供参考；请填写自己的真实数据。固定单位须先自行换算，系统不自动换算。无量纲单位填1。</p>
        {dynamicColumns && <div className="row"><label htmlFor="scientific-new-column">{isGroup ? "新组名" : "新数值列名"}</label><input id="scientific-new-column" value={newColumn} onChange={event => setNewColumn(event.target.value)} placeholder={isGroup ? "例如 对照组" : "例如 比容量"} /><button type="button" className="secondary" onClick={addColumn}>{isGroup ? "添加实验组" : "添加数值列"}</button></div>}
        <div className="scientific-table-wrap"><table className="scientific-data-table"><caption>{isGroup ? "每列一个实验组，末尾可留空" : "每行一个数据点，按论文或采样顺序填写"}</caption><thead><tr><th>行</th>{columns.map(column => <th key={column.key}>{column.label}{column.unit ? `（${column.unit}）` : ""}<input aria-label={`${column.label}单位`} value={String(effectiveUnits[column.key] ?? "")} placeholder={column.unit ? `须使用 ${column.unit}` : "单位，如 mAh/g"} onChange={event => { setScientificUnits(JSON.stringify({ ...effectiveUnits, [column.key]: event.target.value })); if (QUALITY_FIELDS.some(([key]) => parameters[key] === true)) writeParameters({ ...parameters }); setError(""); }} /></th>)}<th>操作</th></tr></thead><tbody>{Array.from({ length: rowCount }, (_, row) => <tr key={row}><th scope="row">{row + 1}</th>{columns.map(column => <td key={column.key}><input aria-label={`第${row + 1}行 ${column.label}`} inputMode="decimal" value={String((values[column.key] as unknown[] | undefined)?.[row] ?? "")} placeholder={column.example ? `例如 ${column.example}` : "数值"} onChange={event => changeCell(column.key, row, event.target.value)} /></td>)}<td><button type="button" className="secondary" aria-label={`删除第${row + 1}行`} disabled={rowCount <= (form.minRows ?? 1)} onClick={() => { const next = { ...values }; for (const column of columns) next[column.key] = (Array.isArray(next[column.key]) ? next[column.key] as unknown[] : []).filter((_, i) => i !== row); writeData(next); setExtraRows(rowCount - 1); }}>删除</button></td></tr>)}</tbody></table></div>
        <button type="button" className="secondary" onClick={() => { setExtraRows(rowCount + 1); if (!isGroup) { const next = { ...values }; for (const column of columns) next[column.key] = [...Array.from({ length: rowCount }, (_, i) => (values[column.key] as unknown[] | undefined)?.[i] ?? ""), ""]; writeData(next); } }}>添加数据行</button>
        {scientificRecipe === "materials.xrd_bragg" && <label className="scientific-check"><input type="checkbox" checked={Array.isArray(data.fwhm_deg)} onChange={event => { const next = { ...data }; if (event.target.checked) next.fwhm_deg = Array(rowCount).fill(""); else delete next.fwhm_deg; writeData(next); }} />同时计算Scherrer尺寸（需要峰宽与仪器展宽）</label>}
      </fieldset>
      <fieldset disabled={scientificBusy} className="scientific-fields">
        <legend>2. 必要实验参数</legend>
        <p className="muted">参数来自论文实验方法、补充材料或仪器记录。未知时不要猜填。</p>
        <div className="scientific-parameter-grid">{form.parameters?.filter(field => !["instrument_broadening_deg", "scherrer_k"].includes(field.key) || Array.isArray(data.fwhm_deg)).map(field => <label key={field.key}>{field.label}<input aria-label={field.label} inputMode="decimal" placeholder={field.example ? `例如 ${field.example}` : "填写数值"} value={parameters[field.key] === undefined ? "" : String(field.row && typeof parameters[field.key] === "number" ? Number(parameters[field.key]) + 1 : parameters[field.key])} onChange={event => { const value = numericCell(event.target.value); const next = { ...parameters }; if (field.optional && event.target.value.trim() === "") delete next[field.key]; else next[field.key] = field.row && typeof value === "number" ? value - 1 : value; writeParameters(next); }} /></label>)}</div>
        {scientificRecipe === "electrochem.eis" && <label>等效电路<select aria-label="等效电路" value={String(parameters.equivalent_circuit ?? "")} onChange={event => writeParameters({ ...parameters, equivalent_circuit: event.target.value })}><option value="">请根据论文方法选择</option>{["R0-p(R1,C1)", "R0-p(R1,CPE1)-W", "R0-p(R1,CPE1)-p(R2,CPE2)-W"].map(circuit => <option key={circuit}>{circuit}</option>)}</select></label>}
        {scientificRecipe === "materials.xps_constrained" || scientificRecipe === "materials.raman_ftir" ? auxiliaryTable("peak") : null}
        {scientificRecipe === "electrochem.cv" && <><label className="scientific-check"><input type="checkbox" checked={Array.isArray(parameters.scan_rates)} onChange={event => { const next = { ...parameters }; if (event.target.checked) { next.scan_rates = ["", ""]; next.peak_currents = ["", ""]; } else { delete next.scan_rates; delete next.peak_currents; } writeParameters(next); }} />另算多扫速率log(i)–log(v)斜率</label>{Array.isArray(parameters.scan_rates) && auxiliaryTable("scan")}</>}
        {!form.parameters?.length && !["electrochem.eis", "electrochem.cv", "materials.xps_constrained", "materials.raman_ftir"].includes(scientificRecipe) && <p className="muted">此方法无需额外参数。</p>}
      </fieldset>
      <div className="row">{selectedDatasetId === null ? <button type="button" disabled={scientificBusy} onClick={() => submit("create")}>建立数据草稿</button> : <button type="button" className="secondary" disabled={scientificBusy} onClick={() => submit("save")}>保存修订</button>}</div>
      <fieldset disabled={scientificBusy} className="scientific-fields"><legend>3. 人工核对并确认</legend>{QUALITY_FIELDS.map(([key, label]) => <label className="scientific-check" key={key}><input type="checkbox" checked={parameters[key] === true} onChange={event => writeParameters({ ...parameters, [key]: event.target.checked }, false)} />{label}</label>)}<button type="button" disabled={scientificBusy || selectedDatasetId === null} onClick={() => submit("confirm")}>人工确认数据</button><p className="muted">{selectedDatasetId === null ? "先建立数据草稿，再核对并确认。" : confirmed ? "当前数据已保存并确认，可以计算。" : "修改后需重新确认；运行算法只读取已保存的数据。"}</p></fieldset>
      {(error || scientificMessage) && <p className="alert" role={error ? "alert" : "status"}>{error || scientificMessage}</p>}
      <button type="button" disabled={scientificBusy || !confirmed} onClick={() => submit("run")}>{scientificBusy ? "处理中…" : "运行固定算法"}</button>
      <details className="scientific-advanced"><summary>查看保存的数据结构</summary><pre>{JSON.stringify({ data, units: effectiveUnits, parameters }, null, 2)}</pre></details>
    </>}
    {scientificResult && scientificResult.dataset_id === selectedDatasetId && scientificResult.recipe === scientificRecipe && <article className="scientific-result"><p className="muted">算法 {form?.title ?? scientificResult.recipe} v{scientificResult.algorithm_version}{scientificResult.is_stale || !confirmed ? " · 数据已修改，请重新计算" : ""}</p><MarkdownContent content={scientificResult.report_markdown} hideEvidenceAnnotations /><a className="button secondary" href={api.scientificExportUrl(scientificResult.id)}>导出可复现 ZIP</a></article>}
  </div>;
}
