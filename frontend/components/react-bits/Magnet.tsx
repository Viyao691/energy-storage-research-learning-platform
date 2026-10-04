"use client";

import React, { useRef, type HTMLAttributes, type ReactNode } from "react";
import "./Magnet.css";

interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
}

/** Adapted from React Bits Magnet. Pointer handling stays local to the component. */
export default function Magnet({ children, padding = 100, disabled = false, magnetStrength = 2,
  activeTransition = "transform .3s ease-out", inactiveTransition = "transform .5s ease-in-out",
  wrapperClassName = "", innerClassName = "", className, style, ...props }: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const reset = () => {
    if (!inner.current) return;
    active.current = false;
    inner.current.style.transition = inactiveTransition;
    inner.current.style.transform = "translate3d(0,0,0)";
  };
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || event.pointerType !== "mouse" || !ref.current || !inner.current || typeof window.matchMedia !== "function" || !window.matchMedia("(prefers-reduced-motion: no-preference) and (hover: hover)").matches) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const dx = event.clientX - (left + width / 2);
    const dy = event.clientY - (top + height / 2);
    if (Math.abs(dx) > width / 2 + padding || Math.abs(dy) > height / 2 + padding) { reset(); return; }
    active.current = true;
    inner.current.style.transition = activeTransition;
    inner.current.style.transform = `translate3d(${dx / magnetStrength}px, ${dy / magnetStrength}px, 0)`;
  };
  return <div {...props} ref={ref} onPointerMove={move} onPointerLeave={reset} className={["react-bits-magnet", wrapperClassName, className].filter(Boolean).join(" ")} style={style}>
    <div ref={inner} className={innerClassName}>{children}</div>
  </div>;
}
