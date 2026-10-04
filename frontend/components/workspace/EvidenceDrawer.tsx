"use client";

import React from "react";
import Link from "next/link";
import { WorkspaceDrawer } from "./WorkspaceDrawer";

type EvidenceDrawerProps = {
  open: boolean;
  onClose: () => void;
  paperId: string | number;
  paperTitle: string;
  excerpt: string;
  sourceScope: "fulltext" | "abstract" | "note";
  pageNumber: number | null;
  section?: string;
};

const scopeLabels = { fulltext: "论文原文", abstract: "论文摘要", note: "用户笔记" } as const;

export function EvidenceDrawer({ open, onClose, paperId, paperTitle, excerpt, sourceScope, pageNumber, section }: EvidenceDrawerProps) {
  const hasReliablePage = sourceScope === "fulltext" && Number.isFinite(pageNumber) && Number.isInteger(pageNumber) && pageNumber! > 0;
  const paperHref = `/papers/${encodeURIComponent(String(paperId))}`;
  const href = hasReliablePage ? `${paperHref}?page=${pageNumber}` : paperHref;

  return <WorkspaceDrawer open={open} title="原文证据" onClose={onClose}>
    <div className="workspace-evidence">
      <span className="workspace-evidence-scope">{scopeLabels[sourceScope]}</span>
      <h3>{paperTitle}</h3>
      {section && <p className="workspace-evidence-section">{section}</p>}
      <blockquote>{excerpt}</blockquote>
      {!hasReliablePage && <p className="workspace-evidence-page-note">当前证据无法确认可靠的原文页码。</p>}
      <Link className="workspace-evidence-link" href={href}>{hasReliablePage ? `打开原文第 ${pageNumber} 页` : "查看论文"}</Link>
    </div>
  </WorkspaceDrawer>;
}

