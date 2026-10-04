"use client";

import React, { useEffect, useRef } from "react";
import "./EnergyMaterialScene.css";

export type EnergyVariant = "carbon" | "layers" | "roll";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value: number) => value * value * (3 - 2 * value);

/** A short page-scroll expansion adapted from ScrollExpand; it adds no scroll track. */
export function EnergyMaterialScene({ variant }: { variant: EnergyVariant }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const frame = frameRef.current;
    const main = root?.closest("main");
    if (!root || !frame) return;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let visible = true, formFocused = false;
    let targetProgress = 0, progress = 0;
    let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
    let frameId = 0;
    const apply = () => {
      const opened = ease(progress);
      const mobile = window.innerWidth <= 700;
      const closed = 1 - opened;
      frame.style.clipPath = `inset(${closed * (mobile ? 31 : 6)}% ${closed * (mobile ? 2 : 5)}% ${closed * (mobile ? 2 : 6)}% ${closed * (mobile ? 2 : 38)}% round ${closed * (mobile ? 18 : 22)}px)`;
      root.style.setProperty("--energy-progress", opened.toFixed(4));
      root.style.setProperty("--energy-zoom", (1.13 - opened * .13).toFixed(4));
      root.style.setProperty("--energy-pointer-x", pointerX.toFixed(3));
      root.style.setProperty("--energy-pointer-y", pointerY.toFixed(3));
      root.dataset.progress = progress.toFixed(3);
    };
    const animate = () => {
      frameId = 0;
      progress += (targetProgress - progress) * .18;
      pointerX += (targetX - pointerX) * .14;
      pointerY += (targetY - pointerY) * .14;
      if (Math.abs(progress - targetProgress) < .002) progress = targetProgress;
      if (Math.abs(pointerX - targetX) < .002) pointerX = targetX;
      if (Math.abs(pointerY - targetY) < .002) pointerY = targetY;
      apply();
      if (progress !== targetProgress || pointerX !== targetX || pointerY !== targetY) frameId = requestAnimationFrame(animate);
    };
    const kick = () => { if (!frameId) frameId = requestAnimationFrame(animate); };
    const stop = () => { if (frameId) cancelAnimationFrame(frameId); frameId = 0; };
    const active = () => visible && !document.hidden && !formFocused && !media?.matches;
    const sync = () => {
      root.dataset.active = String(active());
      if (!active()) {
        stop(); targetX = targetY = pointerX = pointerY = 0;
        progress = targetProgress;
        apply();
      } else kick();
    };
    const readScroll = () => {
      const top = root.getBoundingClientRect().top;
      const topbar = window.innerWidth <= 700 ? 64 : 68;
      targetProgress = clamp((topbar - top) / 170);
      if (!active()) { progress = targetProgress; apply(); }
      else kick();
    };
    const pointerMove = (event: PointerEvent) => {
      if (!active() || event.pointerType !== "mouse") return;
      targetX = clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1);
      targetY = clamp(event.clientY / window.innerHeight * 2 - 1, -1, 1);
      kick();
    };
    const focusIn = (event: FocusEvent) => {
      formFocused = event.target instanceof Element && !!event.target.closest("input, select, textarea, [role='combobox'], [contenteditable='true']");
      sync();
    };
    const focusOut = (event: FocusEvent) => {
      formFocused = event.relatedTarget instanceof Element && !!event.relatedTarget.closest("input, select, textarea, [role='combobox'], [contenteditable='true']");
      sync();
    };
    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }) : null;
    observer?.observe(root);
    main?.addEventListener("focusin", focusIn);
    main?.addEventListener("focusout", focusOut);
    window.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    document.addEventListener("visibilitychange", sync);
    media?.addEventListener?.("change", sync);
    readScroll(); sync();
    return () => {
      stop(); observer?.disconnect();
      main?.removeEventListener("focusin", focusIn);
      main?.removeEventListener("focusout", focusOut);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      document.removeEventListener("visibilitychange", sync);
      media?.removeEventListener?.("change", sync);
    };
  }, []);

  return <div ref={rootRef} className={`energy-material-scene energy-material-scene-${variant}`} data-variant={variant} data-active="false" data-progress="0" aria-hidden="true">
    <div ref={frameRef} className="energy-layer-frame">
      <div className="energy-layer-cell energy-layer-cell-atmosphere" />
      {[0, 1, 2].map(index => <div key={index} className={`energy-layer-cell energy-layer-cell-${index}`}><div className="energy-layer-ambient" /></div>)}
    </div>
  </div>;
}
