"use client";

import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import "./ThemePillSwitch.css";

type Theme = "light" | "dark";
type Props = { theme: Theme; onChange: (theme: Theme) => void; className?: string };
const choices: { value: Theme; label: string }[] = [{ value: "light", label: "浅色" }, { value: "dark", label: "深色" }];

export default function ThemePillSwitch({ theme, onChange, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const normalRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const activeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const pill = pillRef.current;
    if (!root || !pill) return;
    const buttons = root.querySelectorAll<HTMLButtonElement>("button");
    const selected = theme === "dark" ? 1 : 0;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const duration = initialized.current && !reduced ? .28 : 0;
    const x = buttons[selected].offsetLeft - buttons[0].offsetLeft;
    gsap.to(pill, { x, width: buttons[selected].offsetWidth || 49, duration, ease: "power3.out", overwrite: "auto" });
    normalRefs.current.forEach((label, index) => {
      if (label) gsap.to(label, { y: index === selected ? -20 : 0, opacity: index === selected ? 0 : 1, duration, ease: "power3.out", overwrite: "auto" });
    });
    activeRefs.current.forEach((label, index) => {
      if (label) gsap.to(label, { y: index === selected ? 0 : 20, opacity: index === selected ? 1 : 0, duration, ease: "power3.out", overwrite: "auto" });
    });
    initialized.current = true;
    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => gsap.set(pill, { x: buttons[selected].offsetLeft - buttons[0].offsetLeft, width: buttons[selected].offsetWidth })) : null;
    resize?.observe(root);
    return () => { resize?.disconnect(); gsap.killTweensOf(pill); normalRefs.current.forEach(label => label && gsap.killTweensOf(label)); activeRefs.current.forEach(label => label && gsap.killTweensOf(label)); };
  }, [theme]);

  const hover = (index: number, enter: boolean) => {
    const circle = circleRefs.current[index];
    if (!circle) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    gsap.to(circle, { xPercent: -50, scale: enter ? 1.2 : 0, duration: reduced ? 0 : enter ? .3 : .2, ease: "power3.out", overwrite: "auto" });
  };

  return <div ref={rootRef} className={`theme-pill-switch ${className}`} data-mode={theme} role="group" aria-label="颜色模式">
    <span ref={pillRef} className="theme-pill-switch__active" aria-hidden="true" />
    {choices.map((choice, index) => <button key={choice.value} type="button" aria-label={`${choice.label}模式`} aria-pressed={theme === choice.value} onClick={() => onChange(choice.value)} onPointerEnter={() => hover(index, true)} onPointerLeave={() => hover(index, false)} onKeyDown={event => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const next = event.key === "ArrowLeft" ? 0 : 1;
        onChange(choices[next].value);
        rootRef.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
      }
    }}>
      <span ref={node => { circleRefs.current[index] = node; }} className="theme-pill-switch__circle" aria-hidden="true" />
      <span className="theme-pill-switch__labels" aria-hidden="true"><span ref={node => { normalRefs.current[index] = node; }} className="theme-pill-switch__label">{choice.label}</span><span ref={node => { activeRefs.current[index] = node; }} className="theme-pill-switch__label-active">{choice.label}</span></span>
    </button>)}
  </div>;
}
