"use client";

import React, { type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import "./GlassIcons.css";

export type GlassIconsItem = {
  id: string;
  icon: ReactNode;
  color: "blue" | "purple" | "red" | "indigo" | "orange" | "green";
  label: string;
  count: number | null;
};

type Props = {
  items: GlassIconsItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
  panelId?: string;
};

const gradients: Record<GlassIconsItem["color"], string> = {
  blue: "linear-gradient(hsl(223 90% 50%), hsl(208 90% 50%))",
  purple: "linear-gradient(hsl(283 90% 50%), hsl(268 90% 50%))",
  red: "linear-gradient(hsl(3 90% 50%), hsl(348 90% 50%))",
  indigo: "linear-gradient(hsl(253 90% 50%), hsl(238 90% 50%))",
  orange: "linear-gradient(hsl(43 90% 50%), hsl(28 90% 50%))",
  green: "linear-gradient(hsl(123 90% 40%), hsl(108 90% 40%))",
};

export default function GlassIcons({ items, value, onChange, label, className = "", panelId }: Props) {
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? (index + 1) % items.length
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (index - 1 + items.length) % items.length
        : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    onChange(items[next].id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']")[next]?.focus();
  }

  return <div className={`glass-icons ${className}`.trim()} role="tablist" aria-label={label}>
    {items.map((item, index) => <button
      key={item.id}
      type="button"
      role="tab"
      className="glass-icons__button"
      aria-selected={item.id === value}
      aria-controls={panelId}
      tabIndex={item.id === value ? 0 : -1}
      onClick={() => onChange(item.id)}
      onKeyDown={event => move(event, index)}
    >
      <span className="glass-icons__tile">
        <span className="glass-icons__back" style={{ background: gradients[item.color] } as CSSProperties} aria-hidden="true" />
        <span className="glass-icons__front"><span className="glass-icons__icon" aria-hidden="true">{item.icon}</span></span>
      </span>
      <span className="glass-icons__label">{item.label}<span className="glass-icons__count">{item.count ?? "—"}</span></span>
    </button>)}
  </div>;
}
