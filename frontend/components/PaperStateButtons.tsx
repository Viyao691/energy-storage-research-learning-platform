"use client";

import React, { useState } from "react";
import { api } from "../lib/api";

type Props = {
  paperId: string | number;
  isFavorite: boolean;
  isRead: boolean;
  onChange?: (state: { is_favorite: boolean; is_read: boolean }) => void;
};

export function PaperStateButtons({ paperId, isFavorite, isRead, onChange }: Props) {
  const [state, setState] = useState({ is_favorite: isFavorite, is_read: isRead });
  const [busy, setBusy] = useState(false);

  async function update(next: typeof state) {
    if (busy) return;
    setBusy(true);
    try {
      const saved = await api.updatePaperState(String(paperId), next);
      const confirmed = { is_favorite: Boolean(saved.is_favorite), is_read: Boolean(saved.is_read) };
      setState(confirmed);
      onChange?.(confirmed);
    } catch {
      return;
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="paper-state-buttons" onClick={event => event.stopPropagation()}>
      <button aria-label={state.is_favorite ? "取消收藏" : "收藏"} aria-pressed={state.is_favorite} className={state.is_favorite ? "paper-state-button active" : "paper-state-button"} disabled={busy} onClick={event => { event.preventDefault(); void update({ ...state, is_favorite: !state.is_favorite }); }} type="button">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 3 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 17.03 6.5 19.92l1.05-6.12L3.1 9.47l6.15-.9z" /></svg>
      </button>
      <button aria-label={state.is_read ? "标记为未读" : "标记为已读"} aria-pressed={state.is_read} className={state.is_read ? "paper-state-button active" : "paper-state-button"} disabled={busy} onClick={event => { event.preventDefault(); void update({ ...state, is_read: !state.is_read }); }} type="button">
        <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="m8 12 2.5 2.5L16 9" /></svg>
      </button>
    </span>
  );
}
