"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";

import Link from "next/link";
import React, { FormEvent, useEffect, useState } from "react";

import { WorkspaceHeader } from "../../components/WorkspacePrimitives";
import { EvidenceDrawer } from "../../components/workspace/EvidenceDrawer";
import { TopicArtwork } from "../../components/workspace/TopicArtwork";
import "../../components/workspace/samples.css";
import "../../components/workspace/evidence-workspaces.css";

import { MarkdownContent } from "../../components/MarkdownContent";
import {
  api,
  type Paper,
  type PaperComparison,
  type SavedComparisonSummary
} from "../../lib/api";

export default function ComparePage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [question, setQuestion] = useState(
    "比较研究问题、材料体系、实验条件、核心结果、机理解释和局限。"
  );
  const [result, setResult] = useState<PaperComparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [papersLoading, setPapersLoading] = useState(true);
  const [saved, setSaved] = useState<SavedComparisonSummary[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<PaperComparison["citations"][number] | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  useEffect(() => {
    api.papers().then(data => setPapers(data.items)).catch(caught =>
      setError(caught instanceof Error ? caught.message : "论文库读取失败")
    ).finally(() => setPapersLoading(false));
  }, []);

  useEffect(() => {
    api.savedComparisons().then(data => setSaved(data.items)).catch(() => undefined);
  }, []);

  async function saveCurrentComparison() {
    if (!result) return;
    setBusy(true);
    try {
      const item = await api.saveComparison(result);
      setSaved(current => [item, ...current.filter(savedItem => savedItem.id !== item.id)]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存比较失败");
    } finally {
      setBusy(false);
    }
  }

  async function openSavedComparison(id: number) {
    try {
      setResult(await api.savedComparison(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "读取已保存比较失败");
    }
  }

  async function deleteSavedComparison(id: number) {
    try {
      await api.deleteSavedComparison(id);
      setSaved(current => current.filter(item => item.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "删除已保存比较失败");
    }
  }

  function toggle(id: number) {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : current.length < 6
          ? [...current, id]
          : current
    );
  }

  async function compare(event: FormEvent) {
    event.preventDefault();
    if (selected.length < 2) {
      setError("请至少选择两篇论文。");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await api.comparePapers(selected, question.trim()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "多论文比较失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="compare-workspace evidence-workspace workspace-page">
      <WorkspaceHeader artwork eyebrow="COMPARISON DESK" title="多论文比较" description="选择 2–6 篇论文，在保留原文证据与比较边界的前提下形成研究结论。" />
      <form className="card compare-form" onSubmit={compare}>
        <div className="evidence-section-heading">
          <div><p className="evidence-kicker">01 / SELECT SOURCES</p><h2>建立比较范围</h2></div>
          <TopicArtwork text="储能研究论文比较" motif="splitprism" className="compare-topic-artwork" />
        </div>
        <fieldset>
          <legend>选择论文（已选 {selected.length} / 6）</legend>
          <div className="compare-selection-tray" aria-live="polite">
            <span className="compare-selection-label">本次选择</span>
            {selected.length ? selected.map(id => {
              const paper = papers.find(item => Number(item.id) === id);
              return <span className="compare-selected-paper" key={id}>{paper?.title ?? `论文 ${id}`}</span>;
            }) : <span className="muted">至少选择 2 篇，最多 6 篇</span>}
          </div>
          {papersLoading && <LatticeLoader label="正在读取论文库…" showTimer />}
          {!papersLoading && papers.length === 0 && !error && <p className="muted">论文库暂无可选论文。</p>}
          <div className="paper-choice-list">
            {papers.map(paper => {
              const numericId = Number(paper.id);
              return (
                <label key={paper.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(numericId)}
                    onChange={() => toggle(numericId)}
                    disabled={
                      !selected.includes(numericId) && selected.length >= 6
                    }
                  />
                  <span>{paper.title}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <label htmlFor="compare-question">比较重点</label>
        <textarea
          id="compare-question"
          maxLength={500}
          value={question}
          onChange={event => setQuestion(event.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? "正在检索并比较…" : "开始比较"}
        </button>
      </form>
      {busy && <LatticeLoader label="正在检索并比较…" showTimer />}
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="knowledge-results compare-result-layout">
          <div className="compare-result-main">
          <section className="card compare-result-panel">
            <p className="evidence-kicker">02 / COMPARISON</p><h2>比较结果</h2>
            <p className="muted">以下内容按原始比较输出呈现；核对条件与数值时请展开对应证据。</p>
            <div className="row">
              <span className="status">证据状态：{result.evidence_status}</span>
              <span className="status">置信度：{result.confidence.level}</span>
            </div>
            <div className="compare-markdown"><MarkdownContent content={result.comparison_markdown} /></div>
            <button type="button" onClick={saveCurrentComparison} disabled={busy}>
              保存本次比较
            </button>
            <p className="muted">默认不保存；保存的是不可改写的历史快照。</p>
          </section>
          <section className="card compare-fairness-panel">
            <p className="evidence-kicker">CONDITIONS</p><h2>公平性检查</h2>
            {result.fairness_warnings.length > 0 ? <ul>{result.fairness_warnings.map(warning => <li key={warning}>{warning}</li>)}</ul> : <p className="muted">本次比较未返回额外的公平性警告；仍需核对原文条件。</p>}
          </section>
          </div>
          <section className="compare-evidence-panel">
            <p className="evidence-kicker">03 / SOURCES</p><h2>比较所用证据</h2>
            <p className="muted">{result.citations.length} 条引用 · 点击预览按钮可查看摘录与来源范围</p>
            <div className="citation-list">
              {result.citations.map(citation => (
                <article className="card citation-card" key={citation.citation_id}>
                  <div className="citation-heading"><strong>证据 {citation.citation_id}</strong><span className="status">{citation.source_scope === "fulltext" ? "全文证据" : citation.source_scope === "abstract" ? "摘要证据" : "用户笔记（非论文证据）"}</span></div>
                  <h3><Link href={`/papers/${citation.paper_id}`}>{citation.paper_title}</Link></h3>
                  <p className="muted">{citation.page_number === null ? citation.source_scope === "note" ? "用户笔记（无页码）" : "摘要（无全文页码）" : `第 ${citation.page_number} 页`}{" · "}{citation.section}{" · "}解析置信度 {(citation.parse_confidence * 100).toFixed(0)}%</p>
                  <blockquote>{citation.excerpt}</blockquote>
                  <button type="button" className="secondary citation-preview-button" onClick={() => { setSelectedCitation(citation); setEvidenceOpen(true); }}>预览证据 {citation.citation_id}</button>
                  {citation.source_scope === "fulltext" && citation.page_number !== null && citation.page_number > 0 && (
                    <Link href={`/papers/${citation.paper_id}?page=${citation.page_number}`} target="_blank" rel="noreferrer noopener">打开原文第 {citation.page_number} 页</Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
      {saved.length > 0 && (
        <section className="card evidence-history-panel">
          <h2>已保存比较</h2>
          {saved.map(item => (
            <div className="row" key={item.id}>
              <button type="button" onClick={() => openSavedComparison(item.id)}>
                {item.title}（{item.paper_count} 篇）
              </button>
              <button type="button" onClick={() => deleteSavedComparison(item.id)}>
                删除
              </button>
            </div>
          ))}
        </section>
      )}
      {selectedCitation && <EvidenceDrawer open={evidenceOpen} onClose={() => setEvidenceOpen(false)} paperId={selectedCitation.paper_id} paperTitle={selectedCitation.paper_title} excerpt={selectedCitation.excerpt} sourceScope={selectedCitation.source_scope} pageNumber={selectedCitation.page_number} section={selectedCitation.section} />}
    </section>
  );
}
