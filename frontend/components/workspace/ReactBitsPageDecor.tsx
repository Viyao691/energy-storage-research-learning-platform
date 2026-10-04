"use client";

import React, { useEffect, useRef, useState } from "react";
import GhostFibers from "../react-bits/GhostFibers";
import TextLoop from "../react-bits/TextLoop";
import "./ReactBitsPageDecor.css";

export type DecorKind = "ghost-search" | "ghost-knowledge" | "loop-learning" | "loop-contests";

export function ReactBitsPageDecor({ kind }: { kind: DecorKind }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const root = rootRef.current, main = root?.closest("main");
    if (!root || !main) return;
    let visible = true, formFocused = false;
    const theme = () => setDark(document.documentElement.dataset.theme === "dark");
    const sync = () => setPaused(!visible || document.hidden || formFocused);
    const focusIn = (event: FocusEvent) => {
      formFocused = event.target instanceof Element && event.target.matches("input, select, textarea, [contenteditable='true']");
      sync();
    };
    const focusOut = (event: FocusEvent) => {
      formFocused = event.relatedTarget instanceof Element && event.relatedTarget.matches("input, select, textarea, [contenteditable='true']");
      sync();
    };
    const intersection = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0 }) : null;
    intersection?.observe(root);
    const themeObserver = typeof MutationObserver === "function"
      ? new MutationObserver(theme) : null;
    themeObserver?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    main.addEventListener("focusin", focusIn);
    main.addEventListener("focusout", focusOut);
    document.addEventListener("visibilitychange", sync);
    theme(); sync();
    return () => {
      intersection?.disconnect(); themeObserver?.disconnect();
      main.removeEventListener("focusin", focusIn);
      main.removeEventListener("focusout", focusOut);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [kind]);

  const ghost = kind.startsWith("ghost");
  const knowledge = kind === "ghost-knowledge";
  const learning = kind === "loop-learning";
  return <div ref={rootRef} className={`react-bits-page-decor ${ghost ? "react-bits-page-decor-ghost" : "react-bits-page-decor-loop"}`} aria-hidden="true">
    {ghost ? <GhostFibers
      lineColor={knowledge ? dark ? "#d9af83" : "#977a62" : dark ? "#9ccfd0" : "#5d8c88"}
      glowColor={knowledge ? dark ? "#9a7458" : "#c3a17e" : dark ? "#74aeb6" : "#8ebcbb"}
      lightMode={!dark} speed={.22} scale={1.65} rotationSpeed={.09}
      layers={knowledge ? 3 : 4} waveAmplitude={.014} lineFrequency={5.5}
      glowIntensity={1.45} brightness={1.8} blueBoost={1} vignette={.65}
      grain={.015} dpr={1.25} fps={30} paused={paused}
    /> : <TextLoop
      text={learning ? "文献阅读 · 知识关联 · 学习实践" : "选题 · 设计 · 验证"}
      shape="wave" speed={36} curviness={54} separator="✦" fontSize={36}
      fontWeight={600} letterSpacing={1} uppercase={false}
      color={dark ? "#bdd5d1" : "#6b8a85"} ribbon={false}
      pauseOnHover paused={paused}
    />}
  </div>;
}
