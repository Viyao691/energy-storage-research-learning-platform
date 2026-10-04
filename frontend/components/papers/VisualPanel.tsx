"use client";

import LatticeLoader from "../react-bits/LatticeLoader";

import React from "react";
import type { PaperVisual, PaperVisualCrop, FormulaTranscription } from "../../lib/api";
import { FormulaResult } from "./FormulaResult";
import { api } from "../../lib/api";
import { MarkdownContent } from "../MarkdownContent";

type CropSelection = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type VisualPanelProps = {
  formulas?: Record<number, FormulaTranscription>;
  transcribeFormula?: (cropId: number) => void;
  appendFormula?: (cropId: number) => void;
  id: string;
  selectedVisual: PaperVisual | undefined;
  visualMessage: string;
  visualBusy: boolean;
  cropStart: { x: number; y: number } | null;
  setCropStart: (point: { x: number; y: number } | null) => void;
  cropSelection: CropSelection | null;
  setCropSelection: (selection: CropSelection | null) => void;
  crops: PaperVisualCrop[];
  cropPoint: (event: React.PointerEvent<HTMLDivElement>) => { x: number; y: number };
  updateCropSelection: (start: { x: number; y: number }, end: { x: number; y: number }) => void;
  saveCrop: () => void;
  analyzeCrop: (cropId: number) => void;
  extractCropData: (cropId: number) => void;
  deleteCrop: (cropId: number) => void;
  analyzeSelectedVisual: () => void;
};

export function VisualPanel(props: VisualPanelProps) {
  const {
    id,
    selectedVisual,
    visualMessage,
    visualBusy,
    cropStart,
    setCropStart,
    cropSelection,
    setCropSelection,
    crops,
    cropPoint,
    updateCropSelection,
    saveCrop,
    analyzeCrop,
    extractCropData,
    deleteCrop,
    analyzeSelectedVisual,
  } = props;

  return (
    <div role="tabpanel" className="analysis-tab-panel">
      <h2>按需图表解读</h2>
      <p className="muted">
        只有点击下方按钮时，当前选中页才会发送给支持视觉的模型。
        Ollama 会在本机分析，不产生云端 API 费用；DeepSeek 当前不支持图像。
      </p>
      {selectedVisual ? (
        <>
          <div className="selected-visual-summary">
            <strong>{selectedVisual.label}</strong>
            <span>第 {selectedVisual.page_number} 页</span>
            <p>{selectedVisual.caption}</p>
          </div>
          <div
            aria-label="图表裁切框选区"
            className="crop-selector"
            onPointerDown={event => {
              const point = cropPoint(event);
              setCropStart(point);
              setCropSelection({ left: point.x, top: point.y, width: 0, height: 0 });
            }}
            onPointerMove={event => {
              if (cropStart) updateCropSelection(cropStart, cropPoint(event));
            }}
            onPointerUp={event => {
              if (cropStart) updateCropSelection(cropStart, cropPoint(event));
              setCropStart(null);
            }}
          >
            <img
              className="analysis-page-preview"
              src={api.pageImageUrl(id, selectedVisual.page_number)}
              alt={`${selectedVisual.label} 所在的第 ${selectedVisual.page_number} 页`}
              draggable={false}
            />
            {cropSelection && (
              <span
                aria-hidden="true"
                className="crop-selection"
                style={{
                  left: `${cropSelection.left * 100}%`,
                  top: `${cropSelection.top * 100}%`,
                  width: `${cropSelection.width * 100}%`,
                  height: `${cropSelection.height * 100}%`
                }}
              />
            )}
          </div>
          <p className="muted">在上图拖拽框选后保存。未保存的框选不会触发模型调用。</p>
          <p className="muted">公式请单独框选并保存，再点击“本地公式转写（实验）”。</p>
          <button type="button" onClick={saveCrop} disabled={visualBusy || !cropSelection || cropSelection.width < 0.01 || cropSelection.height < 0.01}>
            保存框选区域
          </button>
          {crops.map(crop => (
            <article className="card" key={crop.id}>
              <img src={api.cropImageUrl(crop.id)} alt="已保存的裁切区域" />
              <button type="button" onClick={() => analyzeCrop(crop.id)} disabled={visualBusy}>
                分析该裁切区域
              </button>
              <button type="button" onClick={() => extractCropData(crop.id)} disabled={visualBusy}>
                提取结构化数据
              </button>
              {props.transcribeFormula && <button type="button" onClick={() => props.transcribeFormula?.(crop.id)} disabled={visualBusy}>
                本地公式转写（实验）
              </button>}
              {props.formulas?.[crop.id] && <FormulaResult latex={props.formulas[crop.id].latex}
                append={() => props.appendFormula?.(crop.id)} />}
              <button type="button" className="secondary" onClick={() => deleteCrop(crop.id)} disabled={visualBusy}>
                删除裁切区域
              </button>
              {crop.analysis_markdown && <div className="paper-visual-analysis"><MarkdownContent content={crop.analysis_markdown} hideEvidenceAnnotations /></div>}
              {crop.structured_data && Object.keys(crop.structured_data).length > 0 && (
                <div>
                  <h3>结构化数据</h3>
                  <p>{crop.structured_data.chart_type || "未识别图表类型"}</p>
                  <p>横轴：{crop.structured_data.x_axis.label} {crop.structured_data.x_axis.unit}</p>
                  <p>纵轴：{crop.structured_data.y_axis.label} {crop.structured_data.y_axis.unit}</p>
                  {crop.structured_data.limitations.map((item, index) => <p className="muted" key={index}>{item}</p>)}
                </div>
              )}
            </article>
          ))}
          <p className="alert">
            云端模型可能产生费用并接收这一页；Ollama 模式仅发送到你的本机服务。
          </p>
          <button
            type="button"
            onClick={analyzeSelectedVisual}
            disabled={visualBusy}
          >
            {visualBusy
              ? selectedVisual.analysis_markdown
                ? "正在重新分析…"
                : "正在分析这一页…"
              : selectedVisual.analysis_markdown
                ? "重新分析这一页"
                : "分析这一页"}
          </button>
          {visualBusy && <LatticeLoader label="正在分析所选页面…" showTimer />}
          {visualMessage && (
            <p
              className={
                visualMessage.includes("失败") ||
                visualMessage.includes("不支持") ||
                visualMessage.includes("配置")
                  ? "error"
                  : "success"
              }
            >
              {visualMessage}
            </p>
          )}
          {selectedVisual.analysis_markdown ? (
            <div className="paper-visual-analysis"><MarkdownContent content={selectedVisual.analysis_markdown} hideEvidenceAnnotations /></div>
          ) : (
            <p>尚无这一页的图表分析。</p>
          )}
        </>
      ) : (
        <p>未识别到可选择的 Figure 或 Table 图注。</p>
      )}
    </div>
  );
}
