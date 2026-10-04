"use client";

import React, { type FormEvent, type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GlossaryAsk, GlossaryGenerate } from "../../lib/api";
import LatticeLoader from "../react-bits/LatticeLoader";
import "./glossary-panel.css";

const ARROW = [12, 4.5, 18.5, 11, 14.25, 11, 14.25, 19.5, 9.75, 19.5, 9.75, 11, 5.5, 11];
const SQUARE = [12, 6, 18, 6, 18, 12, 18, 18, 6, 18, 6, 12, 6, 6];
const pathAt = (progress: number) => ARROW.reduce((path, value, index) =>
  `${path}${index % 2 === 0 ? (index ? "L" : "M") : " "}${(value + (SQUARE[index] - value) * progress).toFixed(2)}`, "") + "Z";

function SendGlyph({ busy }: { busy: boolean }) {
  const path = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const progress = useRef(busy ? 1 : 0);

  useEffect(() => {
    const target = busy ? 1 : 0;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      progress.current = target;
      path.current?.setAttribute("d", pathAt(target));
      if (svg.current) svg.current.style.transform = "";
      return;
    }
    const start = performance.now();
    const from = progress.current;
    let frame = 0;
    const tick = (now: number) => {
      const fraction = Math.min(1, (now - start) / 240);
      const eased = fraction * fraction * (3 - 2 * fraction);
      const value = from + (target - from) * eased;
      progress.current = value;
      path.current?.setAttribute("d", pathAt(value));
      const pinch = Math.sin(value * Math.PI);
      const scale = 1 - 0.12 * pinch;
      if (svg.current) svg.current.style.transform = `rotate(${(busy ? 8 : -8) * pinch}deg) scale(${scale}, ${1 / scale})`;
      if (fraction < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [busy]);

  return <svg ref={svg} className="glossary-prompt__glyph" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path ref={path} d={pathAt(progress.current)} />
  </svg>;
}

type Props = {
  glossary: GlossaryGenerate | null;
  answers: GlossaryAsk[];
  question: string;
  setQuestion: (value: string) => void;
  generating: boolean;
  asking: boolean;
  error: string;
  generate: () => void;
  ask: (event: FormEvent<HTMLFormElement>) => void;
  stop: () => void;
};

export function GlossaryPanel({ glossary, answers, question, setQuestion, generating, asking, error, generate, ask, stop }: Props) {
  const input = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  const [typing, setTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (!input.current) return;
    input.current.style.height = "0px";
    input.current.style.height = `${Math.max(48, Math.min(input.current.scrollHeight, 156))}px`;
    input.current.style.overflowY = input.current.scrollHeight > 156 ? "auto" : "hidden";
  }, [question]);
  useEffect(() => () => { if (typingTimer.current) clearTimeout(typingTimer.current); }, []);

  function change(value: string) {
    setQuestion(value.slice(0, 500));
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 650);
  }
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (!asking && question.trim()) event.currentTarget.form?.requestSubmit();
  }

  return <section className="analysis-tab-panel glossary-panel" role="tabpanel" aria-label="名词解释">
    <div className="toolbar"><h2>名词解释</h2><button type="button" className="secondary" disabled={generating} onClick={generate}>{generating ? <LatticeLoader label="生成术语中…" showTimer /> : glossary ? "重新生成术语" : "生成本篇重点术语"}</button></div>
    <p className="muted">点击生成 15–20 个专业术语，包含专业短语与缩写。</p>
    {glossary && <>
      <dl className="glossary-panel__terms">{glossary.terms.map((item, index) => <div key={`${item.term}-${index}`}><dt>{item.term}</dt><dd>{item.explanation}</dd></div>)}</dl></>}
    <div className="glossary-panel__chat">
      <h3>继续问一个概念</h3>
      {answers.map((answer, index) => <article className="glossary-panel__answer" key={index}><strong>{answer.question}</strong><p>{answer.answer}</p></article>)}
      <form onSubmit={ask} className="glossary-prompt" aria-busy={asking}>
        <label htmlFor="glossary-question">概念提问</label>
        <div className="glossary-prompt__field" data-typing={typing ? "true" : undefined}>
          <span className="glossary-prompt__spark glossary-prompt__spark--one" aria-hidden="true" /><span className="glossary-prompt__spark glossary-prompt__spark--two" aria-hidden="true" /><span className="glossary-prompt__spark glossary-prompt__spark--three" aria-hidden="true" />
          <textarea ref={input} id="glossary-question" value={question} readOnly={asking} rows={1} maxLength={500} placeholder="例如：什么是固态电解质？" onChange={event => change(event.target.value)} onKeyDown={keyDown} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} />
          <div className="glossary-prompt__bar"><span>Enter 发送 · Shift+Enter 换行</span><span className="glossary-prompt__count">{question.length}/500</span><button type={asking ? "button" : "submit"} data-specular="off" className="glossary-prompt__send" disabled={!asking && !question.trim()} onClick={asking ? stop : undefined} aria-label={asking ? "停止等待" : "发送概念问题"}><SendGlyph busy={asking} /></button></div>
        </div>
      </form>
      {error && <p className="error" role="alert" aria-label="名词解释错误">{error}</p>}
    </div>
  </section>;
}
