"use client";

import React, { useEffect, useState } from "react";
import "./paper-prompt.css";

export function PaperThoughtLine({ working, startedAt, elapsedMs }: { working: boolean; startedAt: number | null; elapsedMs: number }) {
  const [visible, setVisible] = useState(true);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);

  useEffect(() => {
    if (working) { setVisible(true); return; }
    const timer = window.setTimeout(() => setVisible(false), 3400);
    return () => window.clearTimeout(timer);
  }, [working]);

  useEffect(() => {
    if (!working || startedAt === null) return;
    const update = () => setLiveElapsedMs(performance.now() - startedAt);
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [working, startedAt]);

  if (!visible) return null;
  return <div className="paper-thought-line" data-working={working || undefined} role="status" aria-label="本篇追问状态" aria-live="polite">
    <svg className="paper-thought-line__glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Zm6 13 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
    <span className="paper-thought-line__text">{working ? "正在基于本篇论文检索并生成回答" : "回答已生成"}</span>
    <span className="paper-thought-line__time" aria-hidden="true">{((working ? liveElapsedMs : elapsedMs) / 1000).toFixed(1)} 秒</span>
  </div>;
}
