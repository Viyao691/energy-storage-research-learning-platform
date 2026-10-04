"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { groups } from "../navigation-groups";

type IconName = "home" | "book" | "cap" | "trophy" | "research" | "settings";
type Props = { papers?: number | null; subscriptions?: number | null; model?: string; unread?: number | null };

const entries: { label: string; icon: IconName; detail: string }[] = [
  { label: "论文", icon: "book", detail: "管理·检索·问答" },
  { label: "学习", icon: "cap", detail: "课程·日报·校园" },
  { label: "竞赛", icon: "trophy", detail: "科研创新竞赛" },
  { label: "科研", icon: "research", detail: "订阅·数据·灵感" },
  { label: "系统", icon: "settings", detail: "设置·诊断·备份" },
];

function Icon({ name }: { name: IconName }) {
  const shapes: Record<IconName, ReactNode> = {
    home: <path d="m3 10 9-8 9 8v11h-7v-8h-4v8H3Z" />,
    book: <><path d="M3 4h7a4 4 0 0 1 4 4v13a4 4 0 0 0-4-4H3z" /><path d="M21 4h-3a4 4 0 0 0-4 4v13a4 4 0 0 1 4-4h3z" /></>,
    cap: <><path d="m2 9 10-5 10 5-10 5z" /><path d="M6 11v6c4 3 8 3 12 0v-6M22 9v8" /></>,
    trophy: <><path d="M7 3h10v7a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 1h8" /></>,
    research: <><circle cx="12" cy="12" r="2" /><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" /></>,
    settings: <><path d="m9 2-.5 3-3 1L3 5l-2 4 2.5 2v3L1 16l2 4 3-1 2.5 1L9 23h5l1-3 3-1 3 1 2-4-2.5-2v-3L23 9l-2-4-3 1-3-1-.5-3Z" /><circle cx="12" cy="12.5" r="3.3" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}

function DockLinks({ id, group, summary, onNavigate }: { id: string; group: (typeof groups)[number]; summary: string | null; onNavigate: () => void }) {
  const [active, setActive] = useState<number | null>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const pill = useRef<HTMLSpanElement>(null);
  const highlight = (index: number) => {
    const row = links.current[index];
    if (!row || !pill.current) return;
    pill.current.style.height = `${row.offsetHeight}px`;
    pill.current.style.transform = `translateY(${row.offsetTop}px)`;
    pill.current.style.opacity = "1";
    setActive(index);
  };

  return <div id={id} className="hi-photo-dock-popover" role="group" aria-label={`${group.label}分类菜单`}>
    {summary && <p className="hi-photo-dock-summary">{summary}</p>}
    <div className="hi-photo-dock-links">
      <span ref={pill} className="hi-photo-dock-pill" aria-hidden="true" />
      {group.links.map(([href, label], index) => <Link ref={element => { links.current[index] = element; }} href={href} key={href} data-active={active === index ? "" : undefined} onPointerEnter={() => highlight(index)} onFocus={() => highlight(index)} onClick={onNavigate}>{label}</Link>)}
    </div>
  </div>;
}

export default function HomeDock({ papers, subscriptions, model, unread }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const dockRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const summary = (label: string) => {
    if (label === "论文") return `${papers == null ? "—" : papers.toLocaleString()} 篇本地论文`;
    if (label === "科研") return `${subscriptions == null ? "—" : subscriptions} 个主题 · ${unread == null ? "—" : unread} 条未读`;
    if (label === "系统") return model || "—";
    return null;
  };

  return <nav ref={dockRef} className="hi-photo-dock" aria-label="研究工作台导航">
    <Link className="hi-photo-dock-home" href="/dashboard" aria-current="page"><Icon name="home"/><span><strong>首页</strong><small>工作台总览</small></span></Link>
    {entries.map((entry, index) => {
      const group = groups.find(item => item.label === entry.label)!;
      const expanded = open === entry.label;
      return <div className="hi-photo-dock-item" key={entry.label}>
        <button type="button" className="hi-photo-dock-trigger" aria-label={`展开${entry.label}分类`} aria-expanded={expanded} aria-controls={`hi-dock-menu-${index}`} onClick={() => setOpen(expanded ? null : entry.label)}>
          <Icon name={entry.icon}/><span><strong>{entry.label}</strong><small>{entry.detail}</small></span>
        </button>
        {expanded && <DockLinks id={`hi-dock-menu-${index}`} group={group} summary={summary(entry.label)} onNavigate={() => setOpen(null)} />}
      </div>;
    })}
  </nav>;
}
