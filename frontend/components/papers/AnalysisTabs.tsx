"use client";

import React from "react";
import type { Analysis } from "../../lib/api";
import { MarkdownContent } from "../MarkdownContent";
import LatticeLoader from "../react-bits/LatticeLoader";
import type { PaperDetailTab } from "./usePaperDetail";

const TABS: Array<[PaperDetailTab, string]> = [
  ["summary", "快速理解"],
  ["plain", "通俗理解"],
  ["deep", "审稿人速解"],
  ["glossary", "名词解释"],
  ["claims", "证据核验"],
  ["visual", "图表解读"],
  ["scientific", "科研数据"],
  ["note", "我的笔记"],
];

type AnalysisTabsProps = {
  activeTab: PaperDetailTab;
  setActiveTab: (tab: PaperDetailTab) => void;
  analysis: Analysis | null;
  busy: boolean;
  analyzeCurrentReport: () => void;
  children?: React.ReactNode;
};

export function AnalysisTabs(props: AnalysisTabsProps) {
  const { activeTab, setActiveTab, analysis, busy, analyzeCurrentReport, children } = props;

  return (
    <>
      <div className="analysis-tabs" role="tablist" aria-label="深度研读内容">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            className={activeTab === key ? "active" : "secondary"}
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {["summary", "plain", "deep"].includes(activeTab) && (
        <div role="tabpanel" className="analysis-tab-panel">
          <div className="toolbar">
            <h2>{activeTab === "summary" ? "快速理解" : activeTab === "plain" ? "通俗理解" : "审稿人速解"}</h2>
            <button type="button" className="secondary" onClick={analyzeCurrentReport} disabled={busy}>
              {busy ? <LatticeLoader label="重新生成中…" showTimer /> : `重新生成${activeTab === "summary" ? "快速理解" : activeTab === "plain" ? "通俗理解" : "审稿人速解"}`}
            </button>
          </div>
          {analysis && (activeTab === "summary" ? analysis.quick_understanding : activeTab === "plain" ? analysis.layman_understanding : analysis.reviewer_analysis) ? (
            <MarkdownContent
              hideEvidenceAnnotations
              content={
                activeTab === "summary"
                  ? analysis.quick_understanding
                  : activeTab === "plain"
                    ? analysis.layman_understanding
                    : analysis.reviewer_analysis
              }
            />
          ) : (
            <div className="empty-analysis">
              <p>尚无论文分析。模型未配置时仍可使用 PDF 阅读器。</p>
              <button onClick={analyzeCurrentReport} disabled={busy}>
                {busy ? <LatticeLoader label="分析中…" showTimer /> : `生成${activeTab === "summary" ? "快速理解" : activeTab === "plain" ? "通俗理解" : "审稿人速解"}`}
              </button>
            </div>
          )}
        </div>
      )}

      {children}
    </>
  );
}
