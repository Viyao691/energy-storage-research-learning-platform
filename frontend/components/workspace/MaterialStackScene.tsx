"use client";

import React, { useEffect, useRef, useState } from "react";
import "./MaterialStackScene.css";

const atlas = "/workspace/motion/electrode-stack-atlas-v1.png";

export function MaterialStackScene() {
  const [expanded, setExpanded] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const main = scene.closest("main");
    const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    let visible = true;
    let formFocused = false;
    let frame = 0;
    const sync = () => {
      scene.dataset.active = String(visible && !document.hidden && !media?.matches && !formFocused);
      if (scene.dataset.active === "false") {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        if (groupRef.current) groupRef.current.style.transform = "";
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || scene.dataset.active !== "true" || frame) return;
      const x = event.clientX / window.innerWidth - .5;
      const y = event.clientY / window.innerHeight - .5;
      frame = requestAnimationFrame(() => {
        if (groupRef.current) groupRef.current.style.transform = `rotateX(${-y * 5}deg) rotateY(${x * 7}deg)`;
        frame = 0;
      });
    };
    const reset = () => { if (groupRef.current) groupRef.current.style.transform = ""; };
    const onFocusIn = (event: FocusEvent) => {
      formFocused = event.target instanceof Element && event.target.matches("input, select, textarea, [contenteditable='true']");
      sync();
    };
    const onFocusOut = (event: FocusEvent) => {
      formFocused = event.relatedTarget instanceof Element && event.relatedTarget.matches("input, select, textarea, [contenteditable='true']");
      sync();
    };
    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; sync(); })
      : null;
    observer?.observe(scene);
    scene.addEventListener("pointermove", onPointerMove);
    scene.addEventListener("pointerleave", reset);
    main?.addEventListener("focusin", onFocusIn);
    main?.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", sync);
    media?.addEventListener?.("change", sync);
    sync();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      scene.removeEventListener("pointermove", onPointerMove);
      scene.removeEventListener("pointerleave", reset);
      main?.removeEventListener("focusin", onFocusIn);
      main?.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", sync);
      media?.removeEventListener?.("change", sync);
    };
  }, []);

  return <div ref={sceneRef} className="material-stack-scene" data-expanded={expanded} data-active="false">
    <div ref={groupRef} className="material-stack-group" aria-hidden="true">
      <div className="material-stack-layer material-stack-copper"><img src={atlas} alt="" draggable="false" /></div>
      <div className="material-stack-layer material-stack-separator"><img src={atlas} alt="" draggable="false" /></div>
      <div className="material-stack-layer material-stack-aluminum"><img src={atlas} alt="" draggable="false" /></div>
    </div>
    <div className="material-stack-caption">
      <span>材料结构示意</span>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? "收拢材料" : "展开材料"}</button>
    </div>
  </div>;
}
