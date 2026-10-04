"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import "./FullMaterialBackdrop.css";

export type FullMaterialKind = "carbon" | "electrode" | "crystal" | "learning" | "contest";

const images: Record<FullMaterialKind, string> = {
  carbon: "/workspace/motion/full-carbon-v1.png",
  electrode: "/workspace/motion/full-electrode-v1.png",
  crystal: "/workspace/motion/full-crystal-v1.png",
  learning: "/workspace/motion/full-learning-v1.png",
  contest: "/workspace/motion/full-contest-v1.png",
};
const darkImages: Record<FullMaterialKind, string> = {
  carbon: "/workspace/motion/night-v2/full-carbon.png",
  electrode: "/workspace/motion/night-v2/full-electrode.png",
  crystal: "/workspace/motion/night-v2/full-crystal.png",
  learning: "/workspace/motion/night-v2/full-learning.png",
  contest: "/workspace/motion/night-v2/full-contest.png",
};

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = `#version 300 es
precision highp float;
uniform sampler2D uImage;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform float uTime;
uniform float uScroll;
uniform float uDark;
out vec4 fragColor;
void main() {
  vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
  float cover = max(uResolution.x / uImageSize.x, uResolution.y / uImageSize.y);
  vec2 imageSpan = uImageSize * cover;
  vec2 imageUv = (uv - 0.5) * uResolution / imageSpan + 0.5;
  float wave = sin(uv.y * 8.0 + uv.x * 2.0 + uTime * 0.27 + uScroll * 1.6);
  float crossWave = cos(uv.x * 7.0 - uv.y * 2.5 - uTime * 0.19);
  vec2 drift = vec2(wave, crossWave) * 0.0035;
  vec2 pointerOffset = uv - uPointer;
  drift += pointerOffset * exp(-dot(pointerOffset, pointerOffset) * 16.0) * uPointerStrength * 0.022;
  imageUv += drift + vec2(0.0, uScroll * 0.008);
  vec3 material = texture(uImage, clamp(imageUv, vec2(0.002), vec2(0.998))).rgb;
  float lightSweep = 0.95 + 0.05 * sin(uv.x * 7.0 + uv.y * 3.0 - uTime * 0.31);
  material *= lightSweep;
  vec3 lightColor = mix(material, vec3(0.94, 0.95, 0.94), 0.12);
  fragColor = vec4(mix(lightColor, material, uDark), 1.0);
}
`;

export function FullMaterialBackdrop({ kind, theme = "light" }: { kind: FullMaterialKind; theme?: "light" | "dark" }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const root = rootRef.current, viewport = viewportRef.current;
    const main = root?.closest("main");
    if (!root || !viewport) return;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let cleanupRuntime = () => {};
    const onMediaChange = () => {
      if (!media?.matches) setRetry(value => value + 1);
      else cleanupRuntime();
    };
    media?.addEventListener?.("change", onMediaChange);
    if (media?.matches) return () => media.removeEventListener?.("change", onMediaChange);

    let disposed = false;
    const image = new Image();
    image.onload = () => {
      if (disposed || media?.matches) return;
      let renderer: Renderer | null = null;
      let canvas: HTMLCanvasElement | null = null;
      try {
        renderer = new Renderer({ webgl: 2, alpha: false, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
        const gl = renderer.gl;
        canvas = gl.canvas;
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText = "display:block;width:100%;height:100%";
        viewport.appendChild(canvas);
        const texture = new Texture(gl, { image, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
        const uniforms = {
          uImage: { value: texture },
          uResolution: { value: new Float32Array([1, 1]) },
          uImageSize: { value: new Float32Array([image.naturalWidth, image.naturalHeight]) },
          uPointer: { value: new Float32Array([.5, .5]) },
          uPointerStrength: { value: 0 },
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uDark: { value: theme === "dark" ? 1 : 0 },
        };
        const program = new Program(gl, { vertex, fragment, uniforms });
        const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
        let frame = 0, lastDraw = 0, previous = performance.now(), elapsed = 0;
        let inView = true, focused = false;
        const draw = () => renderer?.render({ scene: mesh });
        const canRun = () => inView && !document.hidden && !focused && !media?.matches;
        const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
        const loop = (now: number) => {
          frame = 0;
          if (!canRun()) return;
          elapsed += Math.min((now - previous) / 1000, .1);
          previous = now;
          if (now - lastDraw >= 1000 / 30) {
            uniforms.uTime.value = elapsed;
            draw();
            lastDraw = now;
          }
          frame = requestAnimationFrame(loop);
        };
        const sync = () => {
          root.dataset.active = String(canRun());
          if (canRun() && !frame) { previous = performance.now(); frame = requestAnimationFrame(loop); }
          else if (!canRun()) stop();
        };
        const size = () => {
          const rect = viewport.getBoundingClientRect();
          renderer?.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
          uniforms.uResolution.value[0] = gl.drawingBufferWidth;
          uniforms.uResolution.value[1] = gl.drawingBufferHeight;
          draw();
        };
        const pointer = (event: PointerEvent) => {
          if (!canRun() || event.pointerType !== "mouse") return;
          const rect = viewport.getBoundingClientRect();
          uniforms.uPointer.value[0] = (event.clientX - rect.left) / Math.max(1, rect.width);
          uniforms.uPointer.value[1] = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
          uniforms.uPointerStrength.value = 1;
        };
        const scroll = () => {
          const maxScroll = Math.max(1, main?.scrollHeight || 1);
          uniforms.uScroll.value = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        };
        const focusIn = (event: FocusEvent) => { focused = event.target instanceof Element && !!event.target.closest("input, select, textarea, [role='combobox'], [contenteditable='true']"); sync(); };
        const focusOut = (event: FocusEvent) => { focused = event.relatedTarget instanceof Element && !!event.relatedTarget.closest("input, select, textarea, [role='combobox'], [contenteditable='true']"); sync(); };
        const intersection = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }) : null;
        const resize = typeof ResizeObserver === "function" ? new ResizeObserver(size) : null;
        intersection?.observe(viewport);
        resize?.observe(viewport);
        if (!resize) window.addEventListener("resize", size);
        window.addEventListener("pointermove", pointer, { passive: true });
        window.addEventListener("scroll", scroll, { passive: true });
        main?.addEventListener("focusin", focusIn);
        main?.addEventListener("focusout", focusOut);
        document.addEventListener("visibilitychange", sync);
        size(); scroll(); sync();
        cleanupRuntime = () => {
          stop(); intersection?.disconnect(); resize?.disconnect();
          if (!resize) window.removeEventListener("resize", size);
          window.removeEventListener("pointermove", pointer);
          window.removeEventListener("scroll", scroll);
          main?.removeEventListener("focusin", focusIn);
          main?.removeEventListener("focusout", focusOut);
          document.removeEventListener("visibilitychange", sync);
          if (canvas?.parentNode === viewport) viewport.removeChild(canvas);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
          root.dataset.active = "false";
        };
      } catch {
        if (canvas?.parentNode === viewport) viewport.removeChild(canvas);
        renderer?.gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
    image.src = theme === "dark" ? darkImages[kind] : images[kind];
    return () => {
      disposed = true;
      image.onload = null;
      media?.removeEventListener?.("change", onMediaChange);
      cleanupRuntime();
    };
  }, [kind, theme, retry]);

  return <div ref={rootRef} className={`full-material-backdrop full-material-backdrop-${kind}`} data-kind={kind} data-active="false" aria-hidden="true">
    <div ref={viewportRef} className="full-material-backdrop-viewport">
      <div className="full-material-backdrop-static" />
    </div>
  </div>;
}
