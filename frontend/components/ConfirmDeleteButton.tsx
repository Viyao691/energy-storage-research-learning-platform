"use client";

import React, { useState } from "react";
import { api, type PaperDeleteResponse } from "../lib/api";

type ConfirmDeleteButtonProps = {
  paperId: string;
  paperTitle: string;
  onDeleted?: (result: PaperDeleteResponse) => void;
};

export function ConfirmDeleteButton({
  paperId,
  paperTitle,
  onDeleted
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function permanentlyDelete() {
    if (confirmation !== paperTitle) return;
    setBusy(true);
    setError("");
    let result: PaperDeleteResponse;
    try {
      result = await api.deletePaper(paperId, confirmation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "删除失败，请稍后重试。");
      setBusy(false);
      return;
    }
    setBusy(false);
    setOpen(false);
    setConfirmation("");
    onDeleted?.(result);
  }

  if (!open) {
    return (
      <button className="secondary" type="button" onClick={() => setOpen(true)}>
        删除论文
      </button>
    );
  }

  return (
    <div className="card" role="region" aria-label="永久删除论文">
      <h3>永久删除论文</h3>
      <p>
        此操作会删除论文记录、AI 分析和笔记，且无法撤销。请输入完整论文标题：
      </p>
      <p>
        <strong>{paperTitle}</strong>
      </p>
      <label htmlFor={`delete-paper-${paperId}`}>
        输入完整论文标题以确认永久删除
      </label>
      <input
        id={`delete-paper-${paperId}`}
        value={confirmation}
        onChange={event => setConfirmation(event.target.value)}
        autoComplete="off"
      />
      {error && <p className="error">{error}</p>}
      <div className="toolbar">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setOpen(false);
            setConfirmation("");
            setError("");
          }}
          disabled={busy}
        >
          取消
        </button>
        <button
          type="button"
          onClick={permanentlyDelete}
          disabled={busy || confirmation !== paperTitle}
        >
          {busy ? "正在删除…" : "永久删除"}
        </button>
      </div>
    </div>
  );
}
