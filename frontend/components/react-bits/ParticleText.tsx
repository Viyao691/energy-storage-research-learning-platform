"use client";

import React, { useEffect, useRef } from "react";
import "./ParticleText.css";

type Particle = { x: number; y: number; startX: number; startY: number; targetX: number; targetY: number; size: number; delay: number; color: string };
type Props = { text: string; color: string; highlightColor: string; className?: string };

export default function ParticleText({ text, color, highlightColor, className = "" }: Props) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!host || !canvas || !ctx) return;

    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduced = motion?.matches ?? false;
    let visible = true;
    let frame = 0;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let particles: Particle[] = [];
    let start = 0;
    let gathering = true;
    let pointer: { x: number; y: number } | null = null;
    let build = 0;

    const draw = (now: number) => {
      frame = 0;
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      let unsettled = false;
      particles.forEach(particle => {
        const progress = reduced ? 1 : Math.min(1, Math.max(0, (now - start - particle.delay) / 1100));
        const eased = 1 - Math.pow(1 - progress, 3);
        let x = gathering ? particle.startX + (particle.targetX - particle.startX) * eased : particle.targetX;
        let y = gathering ? particle.startY + (particle.targetY - particle.startY) * eased : particle.targetY;
        if (progress < 1) unsettled = true;
        if (pointer && !reduced) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 84) {
            const force = (1 - distance / 84) ** 2 * 20;
            x += dx / distance * force;
            y += dy / distance * force;
          }
        }
        particle.x = x;
        particle.y = y;
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = .45 + progress * .55;
        ctx.fillRect(x, y, particle.size, particle.size);
      });
      ctx.globalAlpha = 1;
      if (!unsettled) gathering = false;
      if (unsettled && !reduced && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };

    const wake = () => {
      if (frame) cancelAnimationFrame(frame);
      if (visible && !document.hidden) frame = requestAnimationFrame(draw);
    };

    const sample = async () => {
      const ticket = ++build;
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const large = className.includes("research-display");
      const computed = getComputedStyle(host);
      const font = (size: number) => `${computed.fontWeight || 400} ${size}px ${computed.fontFamily}`;
      await document.fonts?.load(font(108), text);
      if (ticket !== build) return;
      const scratch = document.createElement("canvas");
      const ink = scratch.getContext("2d", { willReadFrequently: true });
      if (!ink) return;
      let size = Math.min(large ? 112 : 70, height * (large ? .65 : .68));
      ink.font = font(size);
      size *= Math.min(1, width * .9 / Math.max(ink.measureText(text).width, 1));
      ink.font = font(size);
      const metrics = ink.measureText(text);
      const padding = 8;
      const inkWidth = Math.ceil(metrics.width + padding * 2);
      const inkHeight = Math.ceil(size * 1.5);
      scratch.width = inkWidth;
      scratch.height = inkHeight;
      ink.font = font(size);
      ink.textBaseline = "middle";
      ink.fillStyle = "#fff";
      ink.fillText(text, padding, inkHeight / 2);
      const pixels = ink.getImageData(0, 0, inkWidth, inkHeight).data;
      const next: Particle[] = [];
      const step = large ? 2 : 3;
      for (let y = 0; y < inkHeight; y += step) {
        for (let x = 0; x < inkWidth; x += step) {
          const alpha = pixels[(y * inkWidth + x) * 4 + 3];
          if (alpha < 55) continue;
          const index = next.length;
          const seed = ((index * 9301 + 49297) % 233280) / 233280;
          const targetX = (width - inkWidth) / 2 + x;
          const targetY = (height - inkHeight) / 2 + y;
          const angle = seed * Math.PI * 2;
          const scatter = reduced ? 0 : 48 + seed * 62;
          const selectedColor = seed > .77 ? highlightColor : color;
          next.push({ x: targetX, y: targetY, startX: targetX + Math.cos(angle) * scatter, startY: targetY + Math.sin(angle) * scatter, targetX, targetY, size: large ? 1.8 + alpha / 255 * .5 : 1.2 + alpha / 255 * .65, delay: reduced ? 0 : seed * 240, color: selectedColor });
        }
      }
      particles = next;
      gathering = !reduced;
      start = performance.now();
      wake();
    };

    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      wake();
    };
    const leave = () => { pointer = null; wake(); };
    const changeMotion = (event: MediaQueryListEvent) => { reduced = event.matches; sample(); };
    const changeVisibility = () => { if (document.hidden && frame) cancelAnimationFrame(frame); else wake(); };
    const resize = new ResizeObserver(sample);
    resize.observe(host);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else if (frame) cancelAnimationFrame(frame);
    });
    intersection.observe(host);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    motion?.addEventListener("change", changeMotion);
    document.addEventListener("visibilitychange", changeVisibility);
    sample();
    return () => {
      build++;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      motion?.removeEventListener("change", changeMotion);
      document.removeEventListener("visibilitychange", changeVisibility);
    };
  }, [text, color, highlightColor, className]);

  return <span ref={hostRef} className={`particle-text ${className}`}><canvas ref={canvasRef} aria-hidden="true" /><span className="particle-text__sr">{text}</span></span>;
}
