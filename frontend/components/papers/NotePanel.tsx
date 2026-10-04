"use client";

import React from "react";
import { MarkdownContent } from "../MarkdownContent";

type NotePanelProps = {
  note: string;
  setNote: (value: string) => void;
  save: () => void;
  busy: boolean;
};

export function NotePanel(props: NotePanelProps) {
  const { note, setNote, save, busy } = props;

  return (
    <div role="tabpanel" className="analysis-tab-panel">
      <h2>我的笔记</h2>
      <textarea
        value={note}
        onChange={event => setNote(event.target.value)}
        placeholder="记录问题、想法和待验证的证据…"
      />
      <button onClick={save} disabled={busy}>
        {busy ? "保存中…" : "保存笔记"}
      </button>
      {note && <details>
        <summary>预览笔记与引用链接</summary>
        <MarkdownContent content={note} />
      </details>}
    </div>
  );
}
