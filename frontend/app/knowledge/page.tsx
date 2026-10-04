"use client";

import "./readability.css";

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
  KnowledgeAnswer,
  KnowledgeStatus,
  SavedConversationSummary
} from "../../lib/api";

export default function KnowledgePage() {
  const [status, setStatus] = useState<KnowledgeStatus | null>(null);
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<KnowledgeAnswer[]>([]);
  const [busy, setBusy] = useState<"index" | "ask" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [saved, setSaved] = useState<SavedConversationSummary[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<KnowledgeAnswer["citations"][number] | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  useEffect(() => {
    api
      .knowledgeStatus()
      .then(setStatus)
      .catch(errorValue =>
        setStatusError(errorValue instanceof Error ? errorValue.message : "索引状态读取失败")
      );
  }, []);

  useEffect(() => {
    api.savedConversations().then(data => setSaved(data.items)).catch(() => undefined);
  }, []);

  async function saveConversation() {
    if (!answers.length) return;
    setBusy("ask");
    setError("");
    try {
      const item = await api.saveConversation(answers);
      setSaved(current => [item, ...current.filter(savedItem => savedItem.id !== item.id)]);
      setMessage("会话已保存为只读历史快照。");
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : "保存会话失败");
    } finally {
      setBusy(null);
    }
  }

  async function openConversation(id: number) {
    try {
      const item = await api.savedConversation(id);
      setAnswers(item.turns);
      setMessage("已打开只读历史快照；继续追问会从当前页面的新会话开始。");
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : "读取已保存会话失败");
    }
  }

  async function deleteConversation(id: number) {
    try {
      await api.deleteSavedConversation(id);
      setSaved(current => current.filter(item => item.id !== id));
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : "删除已保存会话失败");
    }
  }

  async function rebuildIndex() {
    setBusy("index");
    setError("");
    setMessage("");
    try {
      const result = await api.reindexKnowledge();
      setMessage(
        `已索引 ${result.indexed_papers} 篇论文，共 ${result.indexed_chunks} 个文本块。`
      );
      setStatus(current =>
        current
          ? {
              ...current,
              indexed_papers: result.indexed_papers,
              stale_papers: Math.max(
                current.total_papers - result.indexed_papers,
                0
              ),
              chunk_count: result.indexed_chunks,
              embedding_provider: result.embedding_provider,
              embedding_model: result.embedding_model
            }
          : current
      );
    } catch (errorValue) {
      setError(
        errorValue instanceof Error ? errorValue.message : "论文索引建立失败"
      );
    } finally {
      setBusy(null);
    }
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = question.trim();
    if (normalized.length < 2) {
      setError("请输入至少两个字的问题。");
      return;
    }
    setBusy("ask");
    setError("");
    try {
      const history = answers.slice(-4).map(item => ({
        question: item.question,
        answer_markdown: item.answer_markdown
      }));
      const result = await api.askKnowledge(normalized, 6, history);
      setAnswers(current => [...current, result]);
      setQuestion("");
    } catch (errorValue) {
      setError(
        errorValue instanceof Error ? errorValue.message : "论文库问答失败"
      );
    } finally {
      setBusy(null);
    }
  }

  const isFollowUp = answers.length > 0;

  return (
    <section className="knowledge-page evidence-workspace workspace-page">
      <WorkspaceHeader artwork eyebrow="KNOWLEDGE WORKSPACE" title="论文库问答" description="优先检索你的个人论文库。论文名、页码和原文片段由数据库提供，AI 归纳仍需回到原文核验。" />

      <div className="knowledge-start-grid">
      <form className="card knowledge-question" onSubmit={ask}>
        <div className="evidence-section-heading">
          <div><p className="evidence-kicker">ASK YOUR LIBRARY</p><h2>从研究问题开始</h2></div>
          <TopicArtwork text="论文证据研究问题" motif="neuralbrain" className="knowledge-topic-artwork" />
        </div>
        <label htmlFor="knowledge-question">
          {isFollowUp ? "继续追问" : "向个人论文库提问"}
        </label>
        <textarea
          id="knowledge-question"
          maxLength={500}
          value={question}
          onChange={event => setQuestion(event.target.value)}
          placeholder={isFollowUp ? "可以继续提出相关问题，或追问上一轮分析的依据与限制。" : "例如：P2型层状氧化物中的层间滑移为什么会导致循环衰减？"}
        />
        <div className="row">
          <button type="submit" disabled={busy !== null}>{busy === "ask" ? "正在检索并回答…" : isFollowUp ? "继续追问" : "检索并回答"}</button>
          <span className="muted">{question.length} / 500</span>
        </div>
      </form>
      {busy === "ask" && <LatticeLoader label="正在检索并回答…" showTimer />}

      <div className="card knowledge-status">
        <div>
          <p className="evidence-kicker">INDEX STATUS</p><h2>个人知识索引</h2>
          {!status ? (
            statusError ? <p className="error" role="status">{statusError}</p> : <LatticeLoader label="正在读取索引状态…" showTimer />
          ) : (
            <>
              <div className="knowledge-index-facts"><span><strong>{status.indexed_papers}</strong><small>已索引论文 / {status.total_papers} 篇</small></span><span><strong>{status.chunk_count}</strong><small>文本块</small></span></div>
              <p className={status.ready ? "success" : "alert"}>
                {status.message}
              </p>
              {status.stale_papers > 0 && (
                <p className="alert">
                  {status.stale_papers} 篇论文需要更新索引
                </p>
              )}
              <p className="muted">
                向量模型：{status.embedding_provider} / {status.embedding_model}
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={rebuildIndex}
          disabled={busy !== null || status?.ready === false}
        >
          {busy === "index" ? "正在建立索引…" : "建立或更新索引"}
        </button>
      </div>
      {busy === "index" && <LatticeLoader label="正在建立索引…" showTimer />}
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      {answers.length > 0 && (
        <div className="row">
          <button type="button" onClick={saveConversation} disabled={busy !== null}>
            保存整段会话
          </button>
          <span className="muted">默认不保存；仅在点击后写入本地历史。</span>
        </div>
      )}

      {answers.map((answer, turnIndex) => (
        <div className="knowledge-results knowledge-turn-layout" key={turnIndex}>
          <section className="card knowledge-answer-panel">
            <p className="evidence-kicker">QUESTION {turnIndex + 1}</p><h2>第 {turnIndex + 1} 轮问题</h2>
            <p className="knowledge-asked-question">{answer.question}</p>
            <div className="row">
              <span className="status">证据状态：{answer.evidence_status}</span>
              <span className="status">置信度：{answer.confidence.level}</span>
            </div>
            <div className="knowledge-answer-copy"><MarkdownContent content={answer.answer_markdown} /></div>
            <p className="muted">{answer.confidence.explanation}</p>
          </section>

          <section className="knowledge-sources-panel">
            <p className="evidence-kicker">CITED SOURCES</p><h2>原文证据</h2>
            <p className="muted">{answer.citations.length} 条引用 · 来源范围见各卡片标记</p>
            <div className="citation-list">
              {answer.citations.map(citation => (
                <article className="card citation-card" key={citation.citation_id}>
                  <div className="citation-heading">
                    <strong>证据 {citation.citation_id}</strong>
                    <span className="status">
                      {citation.source_scope === "fulltext"
                        ? "全文证据"
                        : citation.source_scope === "abstract"
                          ? "摘要证据"
                          : "用户笔记（非论文证据）"}
                    </span>
                  </div>
                  <h3>
                    <Link href={`/papers/${citation.paper_id}`}>
                      {citation.paper_title}
                    </Link>
                  </h3>
                  <p className="muted">
                    {citation.page_number === null
                      ? citation.source_scope === "note"
                        ? "用户笔记（无页码）"
                        : "摘要（无全文页码）"
                      : `第 ${citation.page_number} 页`}
                    {" · "}
                    {citation.section}
                    {" · "}
                    解析置信度 {(citation.parse_confidence * 100).toFixed(0)}%
                  </p>
                  <blockquote>{citation.excerpt}</blockquote>
                  <button type="button" className="secondary citation-preview-button" onClick={() => { setSelectedCitation(citation); setEvidenceOpen(true); }}>预览证据 {citation.citation_id}</button>
                  {citation.source_scope === "fulltext" &&
                    citation.page_number !== null &&
                    citation.page_number > 0 && (
                      <Link
                        href={`/papers/${citation.paper_id}?page=${citation.page_number}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        打开原文第 {citation.page_number} 页
                      </Link>
                    )}
                  <p className="muted">
                    检索相似度 {citation.similarity.toFixed(3)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ))}

      {saved.length > 0 && (
        <section className="card evidence-history-panel">
          <h2>已保存会话</h2>
          {saved.map(item => (
            <div className="row" key={item.id}>
              <button type="button" onClick={() => openConversation(item.id)}>{item.title}</button>
              <button type="button" onClick={() => deleteConversation(item.id)}>删除</button>
            </div>
          ))}
        </section>
      )}

      {selectedCitation && <EvidenceDrawer open={evidenceOpen} onClose={() => setEvidenceOpen(false)} paperId={selectedCitation.paper_id} paperTitle={selectedCitation.paper_title} excerpt={selectedCitation.excerpt} sourceScope={selectedCitation.source_scope} pageNumber={selectedCitation.page_number} section={selectedCitation.section} />}

    </section>
  );
}
