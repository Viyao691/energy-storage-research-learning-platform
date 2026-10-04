"use client";

import React from "react";
import type {
  DocumentParsersStatus,
  ParseCandidate,
  ParseCandidateComparison
} from "../../lib/api";

type Props = {
  status: DocumentParsersStatus | null;
  candidates: ParseCandidate[];
  comparison: ParseCandidateComparison | null;
  busy: boolean;
  start: () => void;
  compare: (runId: number) => void;
  activate: (runId: number) => void;
  cancel: (runId: number) => void;
};

function Metrics({ label, value }: { label: string; value: ParseCandidateComparison["active"] }) {
  return (
    <div>
      <strong>{label}</strong>
      <span> {value.pages} 页 · {value.characters} 字 · 表 {value.tables} · 公式 {value.formulas} · 图 {value.figures} · 耗时 {value.duration_seconds == null ? "—" : `${value.duration_seconds.toFixed(2)} 秒`}</span>
    </div>
  );
}

export function ParseCandidateControls({ status, candidates, comparison, busy, start, compare, activate, cancel }: Props) {
  const latest = candidates[0];
  const running = latest && ["queued", "running"].includes(latest.status);
  return (
    <div className="ocr-run-summary" aria-label="Docling 实验解析">
      <div className="toolbar">
        <div>
          <strong>Docling 实验解析</strong>
          <p className="muted">实验解析，不会自动替换当前版本。完成后先比较，再由你确认启用。</p>
          <p className="muted">文本覆盖不等于解析准确率。复杂公式、表格行列与单位须回原文核验。</p>
        </div>
        <button type="button" className="secondary" disabled={busy || Boolean(running) || !status?.docling.ready} onClick={start}>
          运行实验解析
        </button>
      </div>
      {status && !status.docling.ready && <p className="muted">{status.docling.reason}</p>}
      {latest && (
        <div>
          <span className="status">{latest.status}</span>
          <span> Docling {latest.engine_version || "—"} · 进度 {(latest.progress * 100).toFixed(0)}%</span>
          {latest.error_message && <p className="error">{latest.error_message}</p>}
          {(latest.warnings || []).map((warning, index) => <p className="muted" key={index}>{warning}</p>)}
          <div className="row">
            {running && <button type="button" className="secondary" onClick={() => cancel(latest.id)}>取消</button>}
            {latest.status === "completed" && <button type="button" className="secondary" onClick={() => compare(latest.id)}>查看对比</button>}
          </div>
        </div>
      )}
      {comparison && (
        <div aria-label="解析版本对比">
          <Metrics label="当前版本" value={comparison.active} />
          <Metrics label="实验候选" value={comparison.candidate} />
          <p className="muted">以上仅陈列可核验指标，不自动判断哪个版本更好。</p>
          <button type="button" onClick={() => activate(comparison.run_id)} disabled={busy}>确认启用这个候选</button>
        </div>
      )}
    </div>
  );
}
