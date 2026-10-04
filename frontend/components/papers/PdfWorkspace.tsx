"use client";

import React from "react";
import type { DocumentParsersStatus, EvidenceLocation, OcrRun, Paper, PaperVisual, ParseCandidate, ParseCandidateComparison } from "../../lib/api";
import { api } from "../../lib/api";
import { EvidencePagePreview } from "./EvidencePagePreview";
import { ParseCandidateControls } from "./ParseCandidateControls";

function PageThumbnail({ id, page, selected, onSelect }: { id: string; page: number; selected: boolean; onSelect: () => void }) {
  const [failed, setFailed] = React.useState(false);
  return (
    <button type="button" className="reader-thumbnail" aria-label={`跳转到第 ${page} 页`} aria-current={selected ? "page" : undefined} onClick={onSelect}>
      {failed ? <span className="reader-thumbnail-fallback">第 {page} 页图像不可用</span> : <img src={api.pageImageUrl(id, page)} alt={`第 ${page} 页缩略图`} onError={() => setFailed(true)} />}
      <span className="reader-thumbnail-number">{page}</span>
    </button>
  );
}

type PdfWorkspaceProps = {
  id: string;
  paper: Paper;
  hasLocalPdf: boolean;
  pdfVariant: "original" | "ocr";
  setPdfVariant: (variant: "original" | "ocr") => void;
  currentPage: number;
  boundedCurrentPage: number;
  setCurrentPage: (updater: number | ((page: number) => number)) => void;
  ocrRuns: OcrRun[];
  ocrBusy: boolean;
  startOcr: (mode: "auto" | "full") => void;
  enhanceCurrentPage: (pageNumber: number) => void;
  visuals: PaperVisual[];
  visualMessage: string;
  selectedVisualId: number | null;
  setSelectedVisualId: (id: number | null) => void;
  parserStatus: DocumentParsersStatus | null;
  parseCandidates: ParseCandidate[];
  parseComparison: ParseCandidateComparison | null;
  parseCandidateBusy: boolean;
  startParseCandidate: () => void;
  compareParseCandidate: (runId: number) => void;
  activateParseCandidate: (runId: number) => void;
  cancelParseCandidate: (runId: number) => void;
  selectedEvidence: EvidenceLocation | null;
  evidenceMessage: string;
};

export function PdfWorkspace(props: PdfWorkspaceProps) {
  const {
    id,
    paper,
    hasLocalPdf,
    pdfVariant,
    setPdfVariant,
    boundedCurrentPage,
    setCurrentPage,
    ocrRuns,
    ocrBusy,
    startOcr,
    enhanceCurrentPage,
    visuals,
    visualMessage,
    setSelectedVisualId,
    parserStatus,
    parseCandidates,
    parseComparison,
    parseCandidateBusy,
    startParseCandidate,
    compareParseCandidate,
    activateParseCandidate,
    cancelParseCandidate,
    selectedEvidence,
    evidenceMessage,
  } = props;
  const pageCount = Math.max(1, paper.page_count || 1);
  const thumbnailStart = Math.max(1, Math.min(boundedCurrentPage - 2, pageCount - 4));
  const thumbnailPages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => thumbnailStart + index);

  return (
    <div className="card pdf-workspace">
      <div className="reader-section-heading"><span>01 / SOURCE DOCUMENT</span><h2>PDF 原文</h2></div>
      {hasLocalPdf ? (
        <p className="muted">
          PDF 在本机浏览器中打开。图表目录来自本地文字识别，选择条目可跳到相应页。
        </p>
      ) : (
        <p className="muted">当前仅有摘要或元数据。</p>
      )}
      {hasLocalPdf && (
        <details className="ocr-controls reader-tool-details">
          <summary>PDF 版本与解析工具</summary>
          <section aria-label="文档 OCR 与版本">
          <div className="toolbar">
            <div>
              <strong>解析质量与 PDF 版本</strong>
              <p className="muted">原生文字层优先；OCR 只生成衍生版，绝不覆盖原件。</p>
            </div>
            <div className="row">
              <button type="button" className={pdfVariant === "original" ? "" : "secondary"} onClick={() => setPdfVariant("original")}>原件</button>
              <button type="button" className={pdfVariant === "ocr" ? "" : "secondary"} disabled={!paper.ocr_available} onClick={() => setPdfVariant("ocr")}>OCR 衍生版</button>
            </div>
          </div>
          <div className="row">
            <button type="button" onClick={() => startOcr("auto")} disabled={ocrBusy || ocrRuns.some(run => ["queued", "running"].includes(run.status))}>自动识别低质量页</button>
            <button type="button" className="secondary" onClick={() => startOcr("full")} disabled={ocrBusy || ocrRuns.some(run => ["queued", "running"].includes(run.status))}>完整本地 OCR</button>
            <button type="button" className="secondary" onClick={() => enhanceCurrentPage(boundedCurrentPage)} disabled={ocrBusy}>疑难页云端增强</button>
          </div>
          {ocrRuns[0] && (
            <div className="ocr-run-summary">
              <span className="status">{ocrRuns[0].status}</span>
              <span>引擎 {ocrRuns[0].engine} · {ocrRuns[0].device.toUpperCase()} · 进度 {(ocrRuns[0].progress * 100).toFixed(0)}%</span>
              {ocrRuns[0].error_message && <p className="error">{ocrRuns[0].error_message}</p>}
              {ocrRuns[0].pages.length > 0 && (
                <div className="ocr-page-quality">
                  {ocrRuns[0].pages.map(page => <span key={page.page_number}>P{page.page_number} {page.source_type === "native" ? "原生" : page.source_type === "local_ocr" ? "本地 OCR" : "云端增强"} {(page.confidence * 100).toFixed(0)}%</span>)}
                </div>
              )}
            </div>
          )}
          <ParseCandidateControls
            status={parserStatus}
            candidates={parseCandidates}
            comparison={parseComparison}
            busy={parseCandidateBusy}
            start={startParseCandidate}
            compare={compareParseCandidate}
            activate={activateParseCandidate}
            cancel={cancelParseCandidate}
          />
          </section>
        </details>
      )}

      {hasLocalPdf ? (
        <>
          <div className="reader-document-frame">
            <nav className="reader-thumbnail-rail" aria-label="PDF 页面缩略图">
              {thumbnailPages.map(page => <PageThumbnail key={page} id={id} page={page} selected={page === boundedCurrentPage} onSelect={() => setCurrentPage(page)} />)}
            </nav>
            <iframe
              className="pdf-reader"
              title="PDF 阅读器"
              src={`${api.paperFileUrl(id, pdfVariant)}#page=${boundedCurrentPage}`}
            />
          </div>
          <div className="page-toolbar" aria-label="PDF 页码控制">
            <button
              className="secondary"
              type="button"
              disabled={boundedCurrentPage <= 1}
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            >
              上一页
            </button>
            <span>
              第 {boundedCurrentPage} / {paper.page_count || 1} 页
            </span>
            <button
              className="secondary"
              type="button"
              disabled={boundedCurrentPage >= (paper.page_count || 1)}
              onClick={() =>
                setCurrentPage(page =>
                  Math.min(paper.page_count || 1, page + 1)
                )
              }
            >
              下一页
            </button>
          </div>

          <section className="visual-browser" aria-labelledby="visual-navigation">
            <h2 id="visual-navigation">图表导航</h2>
            {visualMessage ? (
              <p className="error">{visualMessage}</p>
            ) : visuals.length > 0 ? (
              <div className="visual-list">
                {visuals.map(visual => (
                  <button
                    className={
                      visual.page_number === boundedCurrentPage
                        ? "visual-link selected"
                        : "visual-link"
                    }
                    type="button"
                    key={visual.id}
                    aria-pressed={
                      visual.page_number === boundedCurrentPage
                    }
                    onClick={() => {
                      setCurrentPage(visual.page_number);
                      setSelectedVisualId(visual.id);
                    }}
                  >
                    <strong>{visual.label}</strong>
                    <span>第 {visual.page_number} 页</span>
                    <small>{visual.caption}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">
                未识别到图表图注，可以直接使用 PDF 阅读器翻页。
              </p>
            )}
          </section>

          <EvidencePagePreview
            id={id}
            pageNumber={boundedCurrentPage}
            location={selectedEvidence}
            message={evidenceMessage}
          />

          <details className="extracted-text-details">
            <summary>查看本地解析文本</summary>
            <p className="muted">
              解析质量不足时，提取文本不应当作可靠的原文证据。
            </p>
            <div className="text-block">
              {paper.extracted_text ||
                "未提取到可用文本。建议更换高清 PDF 或等待 OCR 模块。"}
            </div>
          </details>
          {paper.extraction_warning && (
            <p className="alert">{paper.extraction_warning}</p>
          )}
        </>
      ) : (
        <div className="metadata-fallback">
          <strong>当前仅有摘要或元数据</strong>
          <p>
            系统没有可合法读取的本地 PDF，因此不会显示空白阅读器，也不会把摘要分析伪装成全文分析。
          </p>
          {paper.abstract && <p className="paper-abstract">{paper.abstract}</p>}
          <p className="muted">如需逐页阅读，请自行上传有权使用的 PDF。</p>
        </div>
      )}
    </div>
  );
}
