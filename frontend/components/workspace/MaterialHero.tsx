"use client";

import React, { useEffect, useRef } from "react";

type MaterialHeroProps = { kind: "upload" | "help"; dragging?: boolean; className?: string };

const tracks = [
  { x: 3, y: 68, dx: 88, dy: -25, speed: 0.000055, phase: 0 },
  { x: 9, y: 80, dx: 83, dy: -36, speed: 0.000039, phase: 0.35 },
  { x: 1, y: 89, dx: 93, dy: -23, speed: 0.000047, phase: 0.7 },
];

export default function MaterialHero({ kind, className = "" }: MaterialHeroProps) {
  const root = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLDivElement>(null);
  const points = useRef<SVGCircleElement[]>([]);
  const lines = useRef<SVGPathElement[]>([]);
  useEffect(() => {
    const element = root.current;
    if (!element || typeof window.requestAnimationFrame !== "function" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame = 0;
    let px = 0;
    let py = 0;
    let sx = 0;
    let sy = 0;
    let elapsed = 0;
    let previous = 0;
    let focused = false;
    const pointerTarget = kind === "upload" ? element.parentElement ?? element : element;

    const active = () => visible && !document.hidden && !media.matches && !(kind === "upload" && focused);
    const tick = (time: number) => {
      if (!active()) { frame = 0; previous = 0; return; }
      elapsed += Math.min(time - (previous || time), 64);
      previous = time;
      sx += (px - sx) * 0.055;
      sy += (py - sy) * 0.055;
      if (image.current) image.current.style.transform = `translate3d(${(sx * (kind === "help" ? 7 : 13)).toFixed(2)}px, ${(sy * (kind === "help" ? 5 : 9)).toFixed(2)}px, 0) scale(1.04)`;
      points.current.forEach((point, index) => {
        if (!point) return;
        const track = tracks[index];
        const progress = (elapsed * track.speed + track.phase) % 1;
        const remaining = 1 - progress;
        const x = remaining * remaining * track.x + 2 * remaining * progress * 46 + progress * progress * (track.x + track.dx) + sx * 1.3;
        const y = remaining * remaining * track.y + 2 * remaining * progress * (track.y - 18) + progress * progress * (track.y + track.dy) + sy;
        point.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
        point.setAttribute("opacity", `${Math.sin(progress * Math.PI).toFixed(2)}`);
      });
      lines.current.forEach((line, index) => { if (line) line.style.strokeDashoffset = `${(-elapsed * (0.0007 + index * 0.0002)).toFixed(2)}`; });
      frame = window.requestAnimationFrame(tick);
    };
    const sync = () => {
      if (active() && !frame) frame = window.requestAnimationFrame(tick);
      if (!active() && frame) { window.cancelAnimationFrame(frame); frame = 0; previous = 0; }
    };
    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; sync(); })
      : null;
    observer?.observe(element);
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const bounds = pointerTarget.getBoundingClientRect();
      px = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      py = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const leave = () => { px = 0; py = 0; };
    const onFocusIn = (event: FocusEvent) => {
      if (kind === "upload" && event.target instanceof HTMLElement && event.target.matches("input, select, textarea")) { focused = true; sync(); }
    };
    const onFocusOut = (event: FocusEvent) => {
      if (kind === "upload") { focused = event.relatedTarget instanceof HTMLElement && event.relatedTarget.matches("input, select, textarea"); sync(); }
    };
    pointerTarget.addEventListener("pointermove", onPointer);
    pointerTarget.addEventListener("pointerleave", leave);
    if (kind === "upload") { pointerTarget.addEventListener("focusin", onFocusIn); pointerTarget.addEventListener("focusout", onFocusOut); }
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    sync();
    return () => {
      observer?.disconnect();
      pointerTarget.removeEventListener("pointermove", onPointer);
      pointerTarget.removeEventListener("pointerleave", leave);
      if (kind === "upload") { pointerTarget.removeEventListener("focusin", onFocusIn); pointerTarget.removeEventListener("focusout", onFocusOut); }
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [kind]);

  return (
    <div ref={root} className={`material-hero material-hero-${kind} ${className}`} aria-hidden="true">
      <div ref={image} className="material-hero-image" />
      {kind === "help" && <svg className="material-flow" viewBox="0 0 100 100" preserveAspectRatio="none">
        {tracks.map((track, index) => (
          <g key={index}>
            <path ref={node => { if (node) lines.current[index] = node; }} d={`M ${track.x} ${track.y} Q 46 ${track.y - 18} ${track.x + track.dx} ${track.y + track.dy}`} />
            <circle ref={node => { if (node) points.current[index] = node; }} r={.36} />
          </g>
        ))}
      </svg>}
    </div>
  );
}
