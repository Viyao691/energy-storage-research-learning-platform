"use client";

import React, { useEffect, useRef } from "react";
import "./ideas-ion-reveal.css";

export default function IdeasIonScene({ selectedDataset, quiet }: { selectedDataset: number | null; quiet: boolean }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const reveal = revealRef.current;
    const stage = scene?.closest(".ideas-ion-stage");
    if (!scene || !reveal || !stage) return;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame = 0;
    let current = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let active = false;
    const draw = () => {
      frame = 0;
      if (!active) return;
      current.x += (target.x - current.x) * .18;
      current.y += (target.y - current.y) * .18;
      reveal.style.setProperty("--reveal-x", `${current.x.toFixed(1)}px`);
      reveal.style.setProperty("--reveal-y", `${current.y.toFixed(1)}px`);
      if (Math.abs(target.x - current.x) > .5 || Math.abs(target.y - current.y) > .5) frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      active = false;
      reveal.style.opacity = "0";
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const blocked = () => quiet || !visible || document.hidden || !!media?.matches;
    const move = (event: Event) => {
      if (blocked()) { stop(); return; }
      const pointer = event as PointerEvent;
      if (pointer.pointerType === "touch" && event.type !== "pointerdown") return;
      const rect = stage.getBoundingClientRect();
      target = { x: pointer.clientX - rect.left, y: pointer.clientY - rect.top };
      if (!active) current = { ...target };
      active = true;
      reveal.style.opacity = "1";
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const sync = () => { if (blocked()) stop(); };
    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }) : null;
    observer?.observe(stage);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerdown", move);
    stage.addEventListener("pointerleave", stop);
    document.addEventListener("visibilitychange", sync);
    media?.addEventListener?.("change", sync);
    sync();
    return () => {
      stop(); observer?.disconnect();
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerdown", move);
      stage.removeEventListener("pointerleave", stop);
      document.removeEventListener("visibilitychange", sync);
      media?.removeEventListener?.("change", sync);
    };
  }, [quiet]);

  return <div ref={sceneRef} className="ideas-ion-scene" data-testid="ideas-ion-scene" data-selected-dataset={selectedDataset ?? ""} aria-hidden="true">
    <div className="ideas-ion-image" />
    <div ref={revealRef} className="ideas-ion-reveal" />
  </div>;
}
