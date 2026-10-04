"use client";
import React from "react";
import { MarkdownContent } from "../MarkdownContent";

export function FormulaResult({ latex, append }: { latex: string; append: () => void }) {
  return <section aria-label="本地公式转写结果">
    <p className="muted">AI转写（本地实验，未经人工核验）。请对照上方原图检查分母、上下标和符号；刷新后临时结果不会保留。</p>
    <MarkdownContent content={`$$\n${latex}\n$$`} />
    <pre>{latex}</pre>
    <button type="button" onClick={append}>追加公式到笔记草稿</button>
  </section>;
}
