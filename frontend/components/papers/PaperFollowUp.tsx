"use client";

import React, { FormEvent } from "react";
import LatticeLoader from "../react-bits/LatticeLoader";
import { PaperPromptBar } from "./PaperPromptBar";
import { PaperThoughtLine } from "./PaperThoughtLine";
import type { EvidenceLocation, ExternalComparison, KnowledgeAnswer, PaperNoteDraftRequest, ResearchChallenge } from "../../lib/api";
import { MarkdownContent } from "../MarkdownContent";

type PaperFollowUpProps = {
  showResearchTools?: boolean;
  paperAnswers: KnowledgeAnswer[];
  paperQuestion: string;
  setPaperQuestion: (value: string) => void;
  paperQuestionBusy: boolean;
  paperQuestionStatus: "idle" | "working" | "success" | "error";
  paperQuestionError: string;
  paperQuestionStartedAt: number | null;
  paperQuestionElapsedMs: number;
  paperConversationSaveBusy: boolean;
  askPaper: (event: FormEvent<HTMLFormElement>) => void;
  savePaperConversation: () => void;
  appendNoteDraft: (payload: PaperNoteDraftRequest) => void;
  draftBusy: boolean;
  challenge: ResearchChallenge | null;
  challengeAnswers: string[];
  setChallengeAnswers: (answers: string[]) => void;
  openChallenge: () => void;
  externalQuestion: string;
  setExternalQuestion: (value: string) => void;
  externalBusy: boolean;
  externalComparison: ExternalComparison | null;
  compareWithExternalSources: (event: FormEvent<HTMLFormElement>) => void;
  selectEvidence: (locations: EvidenceLocation[], pageNumber: number | null) => void;
};

export function PaperFollowUp(props: PaperFollowUpProps) {
  const {
    paperAnswers,
    paperQuestion,
    setPaperQuestion,
    paperQuestionBusy,
    paperQuestionStatus,
    paperQuestionError,
    paperQuestionStartedAt,
    paperQuestionElapsedMs,
    paperConversationSaveBusy,
    askPaper,
    savePaperConversation,
    externalQuestion,
    setExternalQuestion,
    externalBusy,
    externalComparison,
    compareWithExternalSources,
    selectEvidence,
  } = props;

  return (
    <>
      <section className="paper-follow-up">
        <h2>基于本篇论文追问</h2>
        <PaperPromptBar value={paperQuestion} onChange={setPaperQuestion} onSubmit={askPaper} busy={paperQuestionBusy} />
        {(paperQuestionStatus === "working" || paperQuestionStatus === "success") && <PaperThoughtLine working={paperQuestionStatus === "working"} startedAt={paperQuestionStartedAt} elapsedMs={paperQuestionElapsedMs} />}
        {paperQuestionStatus === "error" && <p className="error" role="alert" aria-label="本篇追问错误">{paperQuestionError}</p>}
        {paperAnswers.length ? (
          <button type="button" onClick={savePaperConversation} disabled={paperQuestionBusy || paperConversationSaveBusy}>
            {paperConversationSaveBusy ? "正在保存本篇会话…" : "保存本篇会话"}
          </button>
        ) : null}
        {paperAnswers.map((answer, index) => (
          <article className="card" key={index}>
            <p className="muted">{answer.evidence_status} · 置信度：{answer.confidence.level}</p>
            <MarkdownContent content={answer.answer_markdown} hideEvidenceAnnotations />
            <button type="button" className="secondary"
              disabled={props.draftBusy || !answer.citations.length}
              onClick={() => props.appendNoteDraft({
                question: answer.question, answer_markdown: answer.answer_markdown,
                citations: answer.citations, kind: "answer", evidence_status: answer.evidence_status
              })}>追加到笔记草稿</button>
            {answer.citations.length > 0 && (
              <div className="row" aria-label="本篇追问引用">
                {answer.citations.map(citation => (
                  <button
                    key={citation.citation_id}
                    type="button"
                    className="secondary"
                    onClick={() => selectEvidence(citation.source_locations || [], citation.page_number)}
                  >
                    证据 {citation.citation_id}{citation.page_number ? ` · 第 ${citation.page_number} 页` : ""}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
      {props.showResearchTools !== false && <><section className="paper-follow-up">
        <h2>轻量研究挑战</h2>
        <button type="button" disabled={props.draftBusy} onClick={props.openChallenge}>
          {props.challenge ? "刷新挑战证据" : "打开三问挑战"}
        </button>
        {props.challenge && <>
          <p className="muted">{props.challenge.evidence_status}</p>
          {props.challenge.citations.map(citation => <details key={citation.citation_id}>
            <summary>证据 {citation.citation_id} · {citation.source_scope === "fulltext" ? "全文" : "仅摘要"}</summary>
            <p>{citation.excerpt}</p>
            <button type="button" className="secondary"
              onClick={() => selectEvidence(citation.source_locations || [], citation.page_number)}>
              {citation.page_number ? `查看第 ${citation.page_number} 页` : "查看证据来源"}
            </button>
          </details>)}
          {props.challenge.questions.map((question, index) => <div key={question}>
            <label htmlFor={`challenge-${index}`}>{index + 1}. {question}</label>
            <textarea id={`challenge-${index}`} maxLength={4000}
              value={props.challengeAnswers[index]}
              onChange={event => props.setChallengeAnswers(props.challengeAnswers.map(
                (value, position) => position === index ? event.target.value : value
              ))} />
            <p className="muted">自查：{props.challenge!.criteria[index]}</p>
          </div>)}
          <button type="button" disabled={props.draftBusy || props.challengeAnswers.some(answer => !answer.trim())}
            onClick={() => props.appendNoteDraft({
              question: "单篇论文研究挑战",
              answer_markdown: props.challenge!.questions.map((question, index) =>
                `### ${index + 1}. ${question}\n\n${props.challengeAnswers[index]}`).join("\n\n"),
              citations: props.challenge!.citations, kind: "challenge"
            })}>将三问回答追加到笔记草稿</button>
        </>}
      </section>
      <section className="paper-follow-up">
        <h2>外部来源比较问答</h2>
        <form onSubmit={compareWithExternalSources}>
          <label htmlFor="external-comparison-question">外部来源比较问答</label>
          <textarea
            id="external-comparison-question"
            value={externalQuestion}
            maxLength={500}
            onChange={event => setExternalQuestion(event.target.value)}
          />
          <button type="submit" disabled={externalBusy}>
            {externalBusy ? "正在查询外部来源…" : "查询外部来源并比较"}
          </button>
        </form>
        {externalBusy && <LatticeLoader label="正在查询外部来源…" showTimer />}
        {externalComparison && (
          <article className="card">
            <p className="muted">{externalComparison.evidence_status}</p>
            <p>当前论文：{externalComparison.current_paper.evidence_basis}</p>
            {externalComparison.external_papers.map(item => (
              <div key={`${item.source}-${item.external_id}`}>
                <strong>{item.title}</strong>
                <p className="muted">{item.evidence_basis}</p>
              </div>
            ))}
            <MarkdownContent content={externalComparison.answer_markdown} hideEvidenceAnnotations />
          </article>
        )}
      </section></>}
    </>
  );
}
