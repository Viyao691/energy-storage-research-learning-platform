"use client";

import React from "react";
import LatticeLoader from "../react-bits/LatticeLoader";
import type { EvidenceLocation, PaperClaim } from "../../lib/api";

type ClaimsPanelProps = {
  claims: PaperClaim[];
  claimsBusy: boolean;
  claimsFeedback?: string;
  claimsError?: string;
  rebuildClaims: () => void;
  selectEvidence: (locations: EvidenceLocation[], pageNumber: number | null) => void;
};

export function ClaimsPanel(props: ClaimsPanelProps) {
  const { claims, claimsBusy, claimsFeedback, claimsError, rebuildClaims, selectEvidence } = props;

  return (
    <div role="tabpanel" className="analysis-tab-panel">
      <div className="toolbar">
        <div>
          <h2>证据核验</h2>
          <p className="muted">把分析报告中的结论与本篇论文原文或摘要片段对应，便于逐条核验。</p>
        </div>
        <button
          type="button"
          onClick={rebuildClaims}
          disabled={claimsBusy}
        >
          {claimsBusy ? "正在准备本篇索引并定位证据…" : "建立或更新映射"}
        </button>
      </div>
      {claimsBusy && <LatticeLoader label="正在准备本篇索引并定位论文证据…" showTimer />}
      {claimsError && <p role="alert" className="error">{claimsError}</p>}
      {claimsFeedback && <p role="status">{claimsFeedback}</p>}
      {claims.length ? (
        <div className="claim-list">
          {claims.map(claim => (
            <article className="claim-card" key={claim.id}>
              <p><strong>{claim.claim_text}</strong></p>
              <p className="muted">
                {claim.claim_type} · {claim.evidence_status} ·
                置信度 {(claim.confidence * 100).toFixed(0)}%
              </p>
              {claim.evidence.map(item => (
                <blockquote key={item.chunk_id}>
                  <div className="row">
                    <span className="status">
                      {item.source_scope === "fulltext"
                        ? "全文证据"
                        : item.source_scope === "abstract"
                          ? "摘要证据"
                          : "用户笔记（非论文证据）"}
                    </span>
                    {item.page_number !== null && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => selectEvidence(item.source_locations || [], item.page_number)}
                      >
                        查看第 {item.page_number} 页证据
                      </button>
                    )}
                  </div>
                  <p>{item.excerpt}</p>
                  <small>
                    {item.section}
                    {item.locator ? ` · ${item.locator}` : ""}
                    {` · 相似度 ${item.similarity.toFixed(3)}`}
                  </small>
                </blockquote>
              ))}
            </article>
          ))}
        </div>
      ) : (
        !claimsBusy && !claimsFeedback && <p>尚未建立映射。生成论文分析后，点击上方按钮会自动准备本篇索引并定位证据。</p>
      )}
    </div>
  );
}
