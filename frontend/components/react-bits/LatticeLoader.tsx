"use client";

import React, { useEffect, useState, type CSSProperties } from "react";
import "./LatticeLoader.css";

type PatternSpec = { cells: (number | null)[]; loop?: number; scale?: number; lit?: number };
type PatternName = "arrow" | "dots" | "ripple" | "spiral" | "orbit" | "snake" | "sweep" | "spin" | "rain" | "pulse";
type Props = {
  label?: string; doneLabel?: string; errorLabel?: string;
  status?: "working" | "done" | "error";
  pattern?: PatternName | PatternSpec; grid?: 3 | 4; shape?: "square" | "round";
  color?: string; doneColor?: string; errorColor?: string;
  cellSize?: number; gap?: number; fontSize?: number; step?: number;
  idleOpacity?: number; glow?: boolean; glowColor?: string;
  showTimer?: boolean; elapsed?: number; className?: string; style?: CSSProperties;
};

const patterns: Record<PatternName, Partial<Record<3 | 4, PatternSpec>>> = {
  arrow: { 3: { cells: [1, 2, 3, 0, 1, 2, 1, 2, 3], loop: 7.2, scale: 1 } },
  dots: { 3: { cells: [0, 1, 2, 0, 1, 2, 0, 1, 2], loop: 3, scale: 2.4 } },
  ripple: { 3: { cells: [2, 1, 2, 1, 0, 1, 2, 1, 2], loop: 4.8, scale: 1.5 } },
  spiral: { 3: { cells: [0, 1, 2, 7, 8, 3, 6, 5, 4], loop: 9, scale: 1.2, lit: .35 } },
  orbit: {
    3: { cells: [0, 1, 2, 7, null, 3, 6, 5, 4], loop: 8, scale: 1.2 },
    4: { cells: [0, 1, 2, 3, 11, null, null, 4, 10, null, null, 5, 9, 8, 7, 6], loop: 6, scale: 1.2, lit: .45 },
  },
  snake: {
    3: { cells: [0, 1, 2, 5, 4, 3, 6, 7, 8], loop: 9, scale: 1, lit: .35 },
    4: { cells: [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11, 15, 14, 13, 12], loop: 16, scale: 1, lit: .25 },
  },
  sweep: { 4: { cells: [0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6], loop: 5, scale: 1, lit: .45 } },
  spin: { 4: { cells: [0, 0, 1, 1, 0, 0, 1, 1, 3, 3, 2, 2, 3, 3, 2, 2], loop: 4, scale: 1.6, lit: .35 } },
  rain: { 4: { cells: [0, 2, 1, 3, 1, 3, 2, 4, 2, 4, 3, 5, 3, 5, 4, 6], loop: 4, scale: 1.2, lit: .35 } },
  pulse: { 4: { cells: [2, 1, 1, 2, 1, 0, 0, 1, 1, 0, 0, 1, 2, 1, 1, 2], loop: 2.4, scale: 2.5, lit: .45 } },
};
const marks = {
  3: { done: [2, 3, 5, 7], error: [0, 2, 4, 6, 8] },
  4: { done: [7, 8, 10, 13], error: [0, 3, 5, 6, 9, 10, 12, 15] },
};

function resolvePattern(pattern: PatternName | PatternSpec, grid: 3 | 4): Required<PatternSpec> {
  const source = typeof pattern === "string"
    ? patterns[pattern][grid] ?? patterns[grid === 3 ? "orbit" : "sweep"][grid]!
    : pattern;
  const cells = Array.from({ length: grid * grid }, (_, i) => source.cells[i] ?? null);
  const max = Math.max(0, ...cells.filter((value): value is number => value !== null));
  return { cells, loop: source.loop ?? max + 4.2, scale: source.scale ?? 1, lit: source.lit ?? .62 };
}

function format(deciseconds: number) {
  return deciseconds < 600
    ? `${(deciseconds / 10).toFixed(1)}s`
    : `${Math.floor(deciseconds / 600)}m ${((deciseconds % 600) / 10).toFixed(1)}s`;
}

export function LatticeLoader({
  label = "处理中", doneLabel = "已完成", errorLabel = "处理失败", status = "working",
  pattern = "orbit", grid = 3, shape = "round", color = "currentColor",
  doneColor = "#22c55e", errorColor = "#ef4444", cellSize = 6, gap = 2,
  fontSize = 14, step = 90, idleOpacity = .15, glow = false, glowColor = "",
  showTimer = true, elapsed, className = "", style,
}: Props) {
  const n = grid === 4 ? 4 : 3;
  const pat = resolvePattern(pattern, n);
  const [internalElapsed, setInternalElapsed] = useState(0);

  useEffect(() => {
    if (elapsed != null || status !== "working") return;
    const started = Date.now();
    setInternalElapsed(0);
    const id = window.setInterval(() => setInternalElapsed(Math.floor((Date.now() - started) / 100)), 100);
    return () => window.clearInterval(id);
  }, [status, elapsed]);

  const time = elapsed == null ? internalElapsed : Math.round(elapsed * 10);
  const activeMark = status === "error" ? "error" : "done";
  const activeLabel = status === "working" ? label : status === "done" ? doneLabel : errorLabel;
  const delay = step * pat.scale;
  const vars = {
    "--ll-n": n, "--ll-cell": `${cellSize}px`, "--ll-gap": `${gap}px`,
    "--ll-font": `${fontSize}px`, "--ll-color": color,
    "--ll-mark": status === "error" ? errorColor : doneColor,
    "--ll-idle": idleOpacity, "--ll-glow": glowColor || color,
    "--ll-mark-glow": glowColor || (status === "error" ? errorColor : doneColor),
    "--ll-cycle": `${Math.round(pat.loop * delay)}ms`, ...style,
  } as CSSProperties;

  return <span role="status" aria-live="polite" aria-label={activeLabel} className={`lattice-loader${className ? ` ${className}` : ""}`} data-status={status} data-shape={shape} data-glow={glow ? "" : undefined} style={vars}>
    <span className="lattice-loader__grid" aria-hidden="true">
      <span className="lattice-loader__layer lattice-loader__run">
        {pat.cells.map((unit, i) => <span key={i} className="lattice-loader__cell" data-hole={unit == null ? "" : undefined} data-lit={pat.lit !== .62 ? Math.round(pat.lit * 100) : undefined} style={unit == null ? undefined : { animationDelay: `${Math.round(unit * delay)}ms` }} />)}
      </span>
      <span className="lattice-loader__layer lattice-loader__mark">
        {pat.cells.map((_, i) => <span key={i} className="lattice-loader__cell" data-on={marks[n][activeMark].includes(i) ? "" : undefined} />)}
      </span>
    </span>
    <span className="lattice-loader__label" aria-hidden="true">
      <span className="lattice-loader__text" data-active={status === "working" ? "" : undefined}>{label}</span>
      <span className="lattice-loader__text" data-active={status === "done" ? "" : undefined}>{doneLabel}</span>
      <span className="lattice-loader__text" data-active={status === "error" ? "" : undefined}>{errorLabel}</span>
    </span>
    {showTimer && <span className="lattice-loader__timer" aria-hidden="true">{format(time)}</span>}
  </span>;
}

export default LatticeLoader;
