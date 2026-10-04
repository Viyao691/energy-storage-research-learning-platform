"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./TrueFocus.css";

type Props = { text: string; className?: string };

function splitText(text: string) {
  const words = ["论文库", "科研", "想法", "实验", "设计", "校园", "机会", "学术", "资讯", "问答", "学习", "上传", "论文", "数据", "日报", "知识", "与"];
  return (text.match(/[\p{Script=Han}]+|[A-Za-z0-9]+|\s+|[^\s]/gu) ?? [text]).flatMap(part => {
    if (!/^[\p{Script=Han}]+$/u.test(part)) return [part];
    const result: string[] = [];
    for (let index = 0; index < part.length;) {
      const word = words.find(candidate => part.startsWith(candidate, index));
      const next = word ?? part.slice(index, index + 2);
      result.push(next);
      index += next.length;
    }
    return result;
  });
}

export default function TrueFocus({ text, className = "" }: Props) {
  const parts = splitText(text);
  const targets = parts.map((part, index) => part.trim() ? index : -1).filter(index => index >= 0);
  const hostRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(Boolean(motion?.matches));
    const syncPage = () => setPageVisible(!document.hidden);
    syncMotion();
    syncPage();
    motion?.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncPage);
    const observer = typeof IntersectionObserver === "function" && hostRef.current
      ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
      : null;
    if (observer && hostRef.current) observer.observe(hostRef.current);
    return () => {
      observer?.disconnect();
      motion?.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncPage);
    };
  }, []);

  useEffect(() => {
    if (reduced || !visible || !pageVisible || targets.length < 2) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % targets.length), 1800);
    return () => window.clearInterval(timer);
  }, [reduced, visible, pageVisible, targets.length]);

  useLayoutEffect(() => {
    activeRef.current = active;
    const measure = () => {
      const host = hostRef.current;
      const frame = frameRef.current;
      const word = wordRefs.current[targets[activeRef.current]];
      if (!host || !frame || !word) return;
      const parent = host.getBoundingClientRect();
      const rect = word.getBoundingClientRect();
      frame.style.transform = `translate(${rect.left - parent.left}px, ${rect.top - parent.top}px)`;
      frame.style.width = `${rect.width}px`;
      frame.style.height = `${rect.height}px`;
      frame.style.opacity = visible ? "1" : "0";
    };
    measure();
    const observer = typeof ResizeObserver === "function" && hostRef.current ? new ResizeObserver(measure) : null;
    if (observer && hostRef.current) observer.observe(hostRef.current);
    document.fonts?.ready.then(measure);
    return () => observer?.disconnect();
  }, [active, text, visible]);

  return <span ref={hostRef} className={`true-focus ${className}`} data-title-effect="focus">
    {parts.map((part, index) => <span key={index} ref={element => { wordRefs.current[index] = element; }} className={index === targets[active] ? "true-focus__part is-active" : "true-focus__part"} style={{ filter: reduced || !part.trim() || index === targets[active] ? "none" : "blur(1px)" }} onPointerEnter={() => { const next = targets.indexOf(index); if (next >= 0) setActive(next); }}>{part}</span>)}
    <span ref={frameRef} className="true-focus__frame" aria-hidden="true"><i /><i /><i /><i /></span>
  </span>;
}
