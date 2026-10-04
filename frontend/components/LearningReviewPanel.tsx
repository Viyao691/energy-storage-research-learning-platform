"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { api, LearningCard, LearningPack, LearningReviewItem, LearningReviewRating, LearningReviewState } from "../lib/api";
import { MarkdownContent } from "./MarkdownContent";
import { StatusBadge } from "./WorkspacePrimitives";
import LatticeLoader from "./react-bits/LatticeLoader";

const RATINGS: LearningReviewRating[] = ["不会", "模糊", "基本掌握", "已掌握"];

type ReviewEntry = { card: LearningCard; overdueDays: number | null; section: "due" | "new" | "scheduled" };

function ReviewCard({ entry, onCardUpdate }: { entry: ReviewEntry; onCardUpdate: (card: LearningCard) => void }) {
  const [card, setCard] = useState(entry.card);
  const [state, setState] = useState<LearningReviewState | null>(entry.card.review_state);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingLabel, setPendingLabel] = useState("");
  const [date, setDate] = useState(entry.card.review_state?.next_review_date || "");
  const [message, setMessage] = useState("");

  async function submit(rating: LearningReviewRating) {
    if (busy) return;
    setBusy(true); setPendingLabel("正在保存复习评价…"); setMessage("");
    try {
      const result = await api.submitLearningReview(card.id, rating);
      setCard(result.card); setState(result.state); setDate(result.state.next_review_date || "");
      onCardUpdate(result.card);
      setMessage(`下次复习：${result.state.next_review_date}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally { setBusy(false); setPendingLabel(""); }
  }

  async function update(payload: { next_review_date?: string; is_paused?: boolean }) {
    if (!state || busy) return;
    setBusy(true); setPendingLabel(payload.next_review_date ? "正在保存复习日期…" : "正在更新复习状态…"); setMessage("");
    try {
      const updated = await api.updateLearningReviewState(state.id, payload);
      setState(updated); setDate(updated.next_review_date || "");
      setCard(current => ({ ...current, review_state: updated }));
      onCardUpdate({ ...card, review_state: updated });
      setMessage(payload.next_review_date ? `已改期至 ${updated.next_review_date}` : updated.is_paused ? "复习已暂停" : "复习已恢复");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新失败");
    } finally { setBusy(false); setPendingLabel(""); }
  }

  return <article className="card learning-review-card">
    <div className="learning-card-heading">
      <h3>{card.concept}</h3>
      {entry.overdueDays !== null && <StatusBadge tone={entry.overdueDays > 0 ? "warning" : "quiet"}>{entry.overdueDays > 0 ? `逾期 ${entry.overdueDays} 天` : "今日到期"}</StatusBadge>}
      {entry.section === "new" && <StatusBadge tone="quiet">未开始</StatusBadge>}
      {state?.is_paused && <StatusBadge tone="quiet">已暂停</StatusBadge>}
    </div>
    <p className="learning-review-concept">先回想概念，再查看答案和论文证据。</p>
    <button type="button" className="secondary" onClick={() => setRevealed(value => !value)}>{revealed ? "收起答案与证据" : "展开答案与证据"}</button>
    {revealed && <div className="learning-review-answer">
      <MarkdownContent content={card.content} />
      <p><strong>易错点：</strong>{card.common_mistake}</p>
      <div className="learning-evidence">{card.evidence.map(item => {
        const label = `[${item.evidence_id}] ${item.paper_title} · ${item.page_number ? `第 ${item.page_number} 页` : "页码无法确认"} · ${item.section || "章节无法确认"}`;
        return item.paper_id && item.page_number
          ? <Link key={item.evidence_id} href={`/papers/${item.paper_id}?page=${item.page_number}`}>{label}</Link>
          : <small key={item.evidence_id}>{label}</small>;
      })}</div>
    </div>}
    <div className="learning-review-ratings" aria-label={`${card.concept}掌握评价`}>
      {RATINGS.map(rating => <button type="button" className="secondary" disabled={busy} onClick={() => submit(rating)} key={rating}>{rating}</button>)}
    </div>
    {state && <div className="learning-review-schedule">
      <label>下次复习日期<input type="date" value={date} disabled={busy} onChange={event => setDate(event.target.value)} /></label>
      <button type="button" className="secondary" disabled={busy || !date || date === state.next_review_date} onClick={() => update({ next_review_date: date })}>保存日期</button>
      <button type="button" className="secondary" disabled={busy} onClick={() => update({ is_paused: !state.is_paused })}>{state.is_paused ? "恢复复习" : "暂停复习"}</button>
    </div>}
    {pendingLabel && <LatticeLoader label={pendingLabel} showTimer className="learning-operation-loading" />}
    {message && <p className={message.includes("失败") ? "error" : "learning-review-message"}>{message}</p>}
  </article>;
}

export function LearningReviewPanel({ pack, onCardUpdate }: { pack: LearningPack; onCardUpdate: (card: LearningCard) => void }) {
  const [queue, setQueue] = useState<LearningReviewItem[]>([]);
  const [today, setToday] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    setLoading(true); setError("");
    api.learningReviewQueue(pack.id).then(result => { if (current) { setQueue(result.items); setToday(result.today); } }).catch(reason => { if (current) setError(reason instanceof Error ? reason.message : "读取复习队列失败"); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [pack.id]);

  const entries = useMemo(() => {
    const dueIds = new Set(queue.map(item => item.card.id));
    const due: ReviewEntry[] = queue.map(item => ({ card: item.card, overdueDays: item.overdue_days, section: "due" }));
    const fresh: ReviewEntry[] = (pack.cards || []).filter(card => !card.review_state && !dueIds.has(card.id)).map(card => ({ card, overdueDays: null, section: "new" }));
    const scheduled: ReviewEntry[] = (pack.cards || []).filter(card => card.review_state && !dueIds.has(card.id)).map(card => ({ card, overdueDays: null, section: "scheduled" }));
    return [...due, ...fresh, ...scheduled];
  }, [pack.cards, queue]);

  return <section>
    <div className="learning-section-toolbar"><div><h2>复习</h2><p>到期内容优先；评价后系统按固定规则安排下一次日期。</p></div>{today && <StatusBadge tone="quiet">本地日期 {today}</StatusBadge>}</div>
    {error && <p className="error">{error}</p>}
    {loading && <LatticeLoader label="正在读取复习队列…" showTimer className="learning-operation-loading" />}
    <div className="learning-review-list">{entries.map(entry => <ReviewCard entry={entry} onCardUpdate={onCardUpdate} key={`${entry.section}-${entry.card.id}`} />)}</div>
    {!loading && !entries.length && !error && <p className="muted">暂无可复习卡片。请先生成知识卡片。</p>}
  </section>;
}
