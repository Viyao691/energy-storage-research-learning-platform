"use client";

import React, { useRef, type PropsWithChildren } from "react";
import "./SpotlightCard.css";

type Props = PropsWithChildren<{ className?: string; spotlightColor?: string }>;

/** Adapted from React Bits SpotlightCard. */
export default function SpotlightCard({ children, className = "", spotlightColor = "rgba(255, 255, 255, 0.25)" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !ref.current || typeof window.matchMedia !== "function" || !window.matchMedia("(prefers-reduced-motion: no-preference) and (hover: hover)").matches) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    ref.current.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
    ref.current.style.setProperty("--spotlight-color", spotlightColor);
  };
  return <div ref={ref} onPointerMove={onPointerMove} className={`card-spotlight ${className}`.trim()}>{children}</div>;
}
