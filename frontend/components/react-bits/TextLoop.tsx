"use client";

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import "./TextLoop.css";

type Shape = "wave" | "circle" | "infinity" | "arch" | "line";
type Props = {
  text?: string; shape?: Shape; path?: string; speed?: number; direction?: "forward" | "reverse";
  separator?: string; curviness?: number; fontSize?: number; fontWeight?: number;
  letterSpacing?: number; uppercase?: boolean; color?: string; ribbon?: boolean;
  ribbonColor?: string; ribbonWidth?: number; pauseOnHover?: boolean;
  paused?: boolean; className?: string; style?: CSSProperties;
};
const VIEW_W = 1200, VIEW_H = 520, CX = VIEW_W / 2, CY = VIEW_H / 2, EDGE_PAD = 6;

function buildPath(shape: Shape, curviness: number, ribbonWidth: number) {
  const c = Math.max(0, curviness);
  const room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);
  switch (shape) {
    case "circle": {
      const r = Math.min(90 + c * .95, room);
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`;
    }
    case "infinity": {
      const r = 150 + c * 1.4, h = Math.min(60 + c * .95, room);
      return [`M ${CX} ${CY}`, `C ${CX + r * .55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * .55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * .55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * .55} ${CY + h} ${CX} ${CY}`, "Z"].join(" ");
    }
    case "arch": {
      const rise = Math.min(120 + c * 1.1, room * 2);
      return `M 120 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W - 120} ${CY + rise / 2}`;
    }
    case "line": return `M -320 ${CY} L ${VIEW_W + 320} ${CY}`;
    case "wave": default: {
      const a = Math.min(c * 2.2, room * 2);
      return `M -320 ${CY} Q -160 ${CY - a} 0 ${CY} T 320 ${CY} T 640 ${CY} T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`;
    }
  }
}

export default function TextLoop({ text = "React ✦ Bits", shape = "wave", path, speed = 90,
  direction = "forward", separator = "✦", curviness = 90, fontSize = 46,
  fontWeight = 800, letterSpacing = 2, uppercase = true, color = "#ffffff",
  ribbon = true, ribbonColor = "#5227FF", ribbonWidth = 86,
  pauseOnHover = true, paused = false, className = "", style = {},
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const headRef = useRef<SVGTextPathElement>(null);
  const tailRef = useRef<SVGTextPathElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<(() => void) | null>(null);
  const [metrics, setMetrics] = useState({ length: 0, reps: 1 });
  const rawId = useId();
  const pathId = `text-loop-${rawId.replace(/:/g, "")}`;
  const d = useMemo(() => path || buildPath(shape, curviness, ribbonWidth), [path, shape, curviness, ribbonWidth]);
  const unit = useMemo(() => {
    const base = uppercase ? String(text).toUpperCase() : String(text);
    const gap = separator ? `\u00A0${separator}\u00A0` : "\u00A0\u00A0\u00A0";
    return `${base}${gap}`;
  }, [text, separator, uppercase]);
  const textStyle = useMemo(() => ({ fontSize: `${fontSize}px`, fontWeight, letterSpacing: `${letterSpacing}px` }),
    [fontSize, fontWeight, letterSpacing]);

  useLayoutEffect(() => {
    const pathEl = pathRef.current, measureEl = measureRef.current;
    if (!pathEl || !measureEl) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      let length = 0, unitWidth = 0;
      try { length = pathEl.getTotalLength(); unitWidth = measureEl.getComputedTextLength(); } catch { return; }
      if (!length) return;
      const reps = unitWidth > 0 ? Math.max(1, Math.round(length / unitWidth)) : 1;
      setMetrics(prev => prev.length === length && prev.reps === reps ? prev : { length, reps });
    };
    measure();
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => { cancelled = true; };
  }, [d, unit, fontSize, fontWeight, letterSpacing]);

  useEffect(() => {
    const { length } = metrics;
    const head = headRef.current, tail = tailRef.current, root = rootRef.current;
    if (!head || !tail || !root || !length) return;
    const apply = (offset: number) => {
      const partner = offset >= 0 ? offset - length : offset + length;
      head.setAttribute("startOffset", String(offset));
      tail.setAttribute("startOffset", String(partner));
    };
    apply(0);
    const reduced = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    if (speed <= 0) return;
    const state = { offset: 0 };
    const tween = gsap.to(state, { offset: direction === "reverse" ? -length : length,
      duration: length / speed, ease: "none", repeat: -1, onUpdate: () => apply(state.offset) });
    let visible = true, hovered = false;
    const sync = () => { if (pausedRef.current || document.hidden || reduced?.matches || !visible || hovered) tween.pause(); else tween.resume(); };
    syncRef.current = sync;
    const enter = () => { hovered = true; sync(); };
    const leave = () => { hovered = false; sync(); };
    const intersection = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0 }) : null;
    intersection?.observe(root);
    if (pauseOnHover) { root.addEventListener("pointerenter", enter); root.addEventListener("pointerleave", leave); }
    document.addEventListener("visibilitychange", sync);
    reduced?.addEventListener?.("change", sync);
    sync();
    return () => {
      if (syncRef.current === sync) syncRef.current = null;
      tween.kill(); intersection?.disconnect();
      if (pauseOnHover) { root.removeEventListener("pointerenter", enter); root.removeEventListener("pointerleave", leave); }
      document.removeEventListener("visibilitychange", sync);
      reduced?.removeEventListener?.("change", sync);
    };
  }, [metrics, speed, direction, pauseOnHover]);

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current?.();
  }, [paused]);

  const loopText = unit.repeat(metrics.reps);
  const fitLength = metrics.length || undefined;
  return <div ref={rootRef} className={`text-loop ${className}`.trim()} style={style}>
    <svg className="text-loop-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={text}>
      <path ref={pathRef} id={pathId} d={d} fill="none" stroke={ribbon ? ribbonColor : "none"}
        strokeWidth={ribbon ? ribbonWidth : 0} strokeLinecap="round" strokeLinejoin="round" />
      <text ref={measureRef} className="text-loop-measure" style={textStyle} aria-hidden="true">{unit}</text>
      <text className="text-loop-text" style={textStyle} fill={color} dominantBaseline="central"
        aria-hidden="true" textLength={fitLength} lengthAdjust="spacing">
        <textPath ref={headRef} href={`#${pathId}`} startOffset={0}>{loopText}</textPath>
      </text>
      <text className="text-loop-text" style={textStyle} fill={color} dominantBaseline="central"
        aria-hidden="true" textLength={fitLength} lengthAdjust="spacing">
        <textPath ref={tailRef} href={`#${pathId}`} startOffset={0}>{loopText}</textPath>
      </text>
    </svg>
  </div>;
}
