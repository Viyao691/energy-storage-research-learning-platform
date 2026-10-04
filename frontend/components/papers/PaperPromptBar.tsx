"use client";

import React, { type FormEvent, type KeyboardEvent, useLayoutEffect, useRef } from "react";
import "./paper-prompt.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
};

export function PaperPromptBar({ value, onChange, onSubmit, busy }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "0px";
    input.style.height = `${Math.max(48, Math.min(input.scrollHeight, 156))}px`;
    input.style.overflowY = input.scrollHeight > 156 ? "auto" : "hidden";
  }, [value]);

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    if (!busy && value.trim().length >= 2) event.currentTarget.form?.requestSubmit();
  }

  return <form className="paper-prompt" onSubmit={onSubmit} aria-busy={busy}>
    <label htmlFor="paper-question">基于本篇论文追问</label>
    <div className="paper-prompt__field">
      <span className="paper-prompt__spark paper-prompt__spark--one" aria-hidden="true" />
      <span className="paper-prompt__spark paper-prompt__spark--two" aria-hidden="true" />
      <span className="paper-prompt__spark paper-prompt__spark--three" aria-hidden="true" />
      <textarea
        ref={inputRef}
        id="paper-question"
        className="paper-prompt__input"
        placeholder="围绕本篇论文提出问题…"
        value={value}
        maxLength={500}
        readOnly={busy}
        rows={1}
        onChange={event => onChange(event.target.value.slice(0, 500))}
        onKeyDown={keyDown}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={() => { composing.current = false; }}
      />
      <div className="paper-prompt__bar">
        <span className="paper-prompt__hint">Enter 发送 · Shift+Enter 换行</span>
        <span className="paper-prompt__count">{value.length}/500</span>
        <button className="paper-prompt__send" data-specular="off" type="submit" disabled={busy || value.trim().length < 2} aria-label={busy ? "正在追问，请稍候" : "基于本篇追问"}>
          <svg className="paper-prompt__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="paper-prompt__busy-glyph" aria-hidden="true"><i /><i /><i /></span>
        </button>
      </div>
    </div>
  </form>;
}
