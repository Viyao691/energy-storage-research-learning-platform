"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import "./SpecularInteractions.css";

const PAD = 20;
const PROXIMITY = 190;
const VERT = `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}`;
// Rounded SDF, elliptical edge normal and two opposed angular highlights from React Bits SpecularButton.
const FRAG = `#version 300 es
precision highp float;
uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;
out vec4 fragColor;
float sdRoundedRect(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}
float gaussianLine(float d,float sigma){float x=d/(sigma+1e-6);float k=mix(1.0,1.6,smoothstep(0.0,1.5,x));return exp(-k*x*x);}
void main(){
  vec2 p=gl_FragCoord.xy-uCenter;
  float d=sdRoundedRect(p,uHalfSize,uRadius);
  vec2 L=vec2(cos(uAngle),sin(uAngle));
  float base=(1.0-smoothstep(0.0,uBaseWidth,abs(d)))*0.13;
  vec2 nEll=normalize(p/(uHalfSize*uHalfSize)+1e-6);
  float phi=acos(clamp(abs(dot(nEll,L)),0.0,1.0));
  float rim=1.0-smoothstep(uShineSize-uShineFade,uShineSize+uShineFade+1e-4,phi);
  float line=gaussianLine(d,uThickness);
  float edgeClamp=1.0-smoothstep(0.5*uPx,3.0*uPx,abs(d));
  float hi=line*rim*edgeClamp*uIntensity;
  vec3 col=uBaseColor*base+uLineColor*hi;
  fragColor=vec4(col,clamp(base+hi,0.0,1.0));
}`;

export function eligibleSpecularTarget(element: HTMLElement): boolean {
  const isButton = element.tagName === "BUTTON";
  const isLink = element.tagName === "A" && (element.classList.contains("button") || element.classList.contains("button-link")) && element.hasAttribute("href");
  const isFileLabel = element.tagName === "LABEL" && element.classList.contains("material-file-select") && element.getAttribute("for") === "file";
  if (!isButton && !isLink && !isFileLabel) return false;
  if (element.matches(":disabled,[disabled],[aria-disabled='true'],[role='combobox'],[role='tab'],.glide-select__trigger,.paper-state-button,.card,.danger,.destructive,[data-variant='danger'],[data-specular='off']")) return false;
  if (element.closest("[role='tablist'],.analysis-tabs,.learning-tabs,.campus-scope-tabs,.segmented-control")) return false;
  if (/删除|移除|清空|取消订阅|归档/.test(element.getAttribute("aria-label") || element.textContent || "")) return false;
  return true;
}

type Candidate = { element: HTMLElement; rect: DOMRect };

export function SpecularInteractions() {
  const anchor = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const main = anchor.current?.closest("main.app-main");
    if (!main) return;
    const sync = () => main.querySelectorAll<HTMLElement>("button,a.button,a.button-link,label.material-file-select").forEach(element => {
      element.toggleAttribute("data-specular-action", eligibleSpecularTarget(element));
    });
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(main, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["disabled", "aria-disabled", "class", "hidden", "role"] });
    return () => { observer.disconnect(); main.querySelectorAll<HTMLElement>("[data-specular-action]").forEach(element => element.removeAttribute("data-specular-action")); };
  }, []);

  useEffect(() => {
    const main = anchor.current?.closest("main.app-main") ?? anchor.current?.parentElement;
    if (!main || !window.matchMedia) return;
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)");

    let candidates: Candidate[] = [];
    let dirty = true;
    let overlay: HTMLDivElement | null = null;
    let renderer: Renderer | null = null;
    let failed = false;
    let gl: Renderer["gl"] | null = null;
    let program: Program | null = null;
    let mesh: Mesh | null = null;
    let raf = 0;
    let target: HTMLElement | null = null;
    let placedRect: DOMRect | null = null;
    let targetAngle = 2.4;
    let angle = 2.4;
    let targetBright = 0;
    let bright = 0;
    let lastTime = 0;
    let focusTarget: HTMLElement | null = null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const markDirty = () => { dirty = true; };
    const readCandidates = () => {
      if (!dirty) return;
      dirty = false;
      candidates = [...main.querySelectorAll<HTMLElement>("button,a.button,a.button-link,label.material-file-select")]
        .filter(eligibleSpecularTarget)
        .map(element => ({ element, rect: element.getBoundingClientRect() }))
        .filter(item => item.rect.width > 0 && item.rect.height > 0 && item.rect.right > 0 && item.rect.bottom > 0 && item.rect.left < window.innerWidth && item.rect.top < window.innerHeight);
    };

    const makeRenderer = () => {
      if (renderer) return true;
      if (failed) return false;
      try {
        renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, antialias: true, dpr });
        gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const geometry = new Triangle(gl);
        if (geometry.attributes.uv) delete geometry.attributes.uv;
        program = new Program(gl, { vertex: VERT, fragment: FRAG, uniforms: {
          uCenter: { value: [0, 0] }, uHalfSize: { value: [1, 1] }, uRadius: { value: 0 }, uAngle: { value: 2.4 }, uPx: { value: dpr },
          uLineColor: { value: [0.6, 0.9, 1] }, uBaseColor: { value: [0.1, 0.3, 0.4] }, uIntensity: { value: 0 },
          uShineSize: { value: 10 * Math.PI / 180 }, uShineFade: { value: 40 * Math.PI / 180 },
          uThickness: { value: dpr }, uBaseWidth: { value: dpr }
        } });
        mesh = new Mesh(gl, { geometry, program });
        overlay = document.createElement("div");
        overlay.className = "specular-interactions-overlay";
        overlay.dataset.specularOverlay = "";
        overlay.setAttribute("aria-hidden", "true");
        overlay.appendChild(gl.canvas);
        document.body.appendChild(overlay);
        return true;
      } catch {
        failed = true;
        overlay?.remove();
        overlay = null;
        renderer?.gl.getExtension("WEBGL_lose_context")?.loseContext();
        renderer = null;
        gl = null;
        return false;
      }
    };

    const place = (element: HTMLElement, rect: DOMRect) => {
      if (!makeRenderer() || !overlay || !renderer || !program) return false;
      overlay.style.left = `${rect.left - PAD}px`;
      overlay.style.top = `${rect.top - PAD}px`;
      overlay.style.width = `${rect.width + PAD * 2}px`;
      overlay.style.height = `${rect.height + PAD * 2}px`;
      overlay.style.display = "block";
      overlay.dataset.target = element.textContent?.trim() || element.getAttribute("aria-label") || "";
      placedRect = rect;
      renderer.setSize(rect.width + PAD * 2, rect.height + PAD * 2);
      program.uniforms.uCenter.value = [(PAD + rect.width / 2) * dpr, (PAD + rect.height / 2) * dpr];
      program.uniforms.uHalfSize.value = [rect.width / 2 * dpr, rect.height / 2 * dpr];
      const rawRadius = parseFloat(getComputedStyle(element).borderTopLeftRadius);
      const radius = Number.isFinite(rawRadius) ? rawRadius : 7;
      program.uniforms.uRadius.value = Math.min(radius, rect.width / 2, rect.height / 2) * dpr;
      const dark = document.documentElement.dataset.theme === "dark";
      const line = new Color(dark ? "#ccefff" : "#3da4c9");
      const base = new Color(dark ? "#8ab9d0" : "#50788d");
      program.uniforms.uLineColor.value = [line.r, line.g, line.b];
      program.uniforms.uBaseColor.value = [base.r, base.g, base.b];
      return true;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!renderer || !program || !mesh || document.hidden || motionMedia.matches) return;
      if (target) {
        const rect = target.getBoundingClientRect();
        if (!eligibleSpecularTarget(target) || !rect.width || !rect.height || rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) { if (overlay) overlay.style.display = "none"; return; }
        if (!placedRect || rect.left !== placedRect.left || rect.top !== placedRect.top || rect.width !== placedRect.width || rect.height !== placedRect.height) place(target, rect);
      }
      const dt = Math.min((now - (lastTime || now)) / 1000, .05);
      lastTime = now;
      const diff = ((targetAngle - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      angle += diff * (1 - Math.exp(-dt * 9));
      bright += (targetBright - bright) * (1 - Math.exp(-dt * 10));
      program.uniforms.uAngle.value = angle;
      program.uniforms.uIntensity.value = bright;
      renderer.render({ scene: mesh });
      if (Math.abs(diff) > .005 || Math.abs(targetBright - bright) > .005) raf = requestAnimationFrame(frame);
      else if (targetBright === 0 && overlay) overlay.style.display = "none";
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const clear = () => { target = null; targetBright = 0; wake(); };

    const onPointer = (event: PointerEvent) => {
      if (focusTarget && event.pointerType === "mouse") focusTarget = null;
      if (focusTarget || document.hidden || motionMedia.matches) return;
      if (document.querySelector("dialog[open], [role='dialog'][aria-modal='true']")) { clear(); return; }
      readCandidates();
      let best: Candidate | null = null;
      let distance = PROXIMITY;
      for (const candidate of candidates) {
        const r = candidate.rect;
        const dx = Math.max(r.left - event.clientX, 0, event.clientX - r.right);
        const dy = Math.max(r.top - event.clientY, 0, event.clientY - r.bottom);
        const dist = Math.hypot(dx, dy);
        if (dist < distance) { best = candidate; distance = dist; }
      }
      if (!best) { clear(); return; }
      if (best.element !== target) {
        target = best.element;
        if (!place(best.element, best.rect)) return;
      }
      const r = best.rect;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = (event.clientX - cx) / (r.width / 2);
      const ny = (cy - event.clientY) / (r.height / 2);
      targetAngle = distance === 0 ? Math.atan2(2 / r.height, -2 / r.width) + nx * .3 + ny * .15 : Math.atan2(cy - event.clientY, event.clientX - cx);
      const proximity = Math.max(0, 1 - distance / PROXIMITY);
      targetBright = proximity * proximity * (3 - 2 * proximity);
      wake();
    };
    const onFocus = (event: Event) => {
      const element = event.target;
      if (!(element instanceof HTMLElement) || !main.contains(element) || !eligibleSpecularTarget(element) || !element.matches(":focus-visible") || motionMedia.matches) return;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight || !place(element, rect)) return;
      focusTarget = element;
      target = element;
      targetAngle = 2.4;
      targetBright = 1;
      wake();
    };
    const onBlur = () => { focusTarget = null; clear(); };
    const onLayout = () => { markDirty(); if (target) { if (overlay) overlay.style.display = "none"; target = null; targetBright = 0; } };
    const onVisibility = () => { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; if (overlay) overlay.style.display = "none"; } else markDirty(); };
    const onMotionChange = () => {
      if (motionMedia.matches) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        target = null;
        focusTarget = null;
        targetBright = 0;
        if (overlay) overlay.style.display = "none";
      } else markDirty();
    };
    const observer = new MutationObserver(() => {
      markDirty();
      if (document.querySelector("dialog[open], [role='dialog'][aria-modal='true']") || (target && (!target.isConnected || !main.contains(target) || !eligibleSpecularTarget(target)))) {
        target = null;
        targetBright = 0;
        if (overlay) overlay.style.display = "none";
      }
    });
    observer.observe(main, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "aria-disabled", "class", "style", "hidden"] });
    const themeObserver = new MutationObserver(() => { if (target && !motionMedia.matches && place(target, target.getBoundingClientRect())) wake(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    motionMedia.addEventListener?.("change", onMotionChange);
    window.addEventListener("pointermove", onPointer, { passive: true });
    main.addEventListener("focusin", onFocus);
    main.addEventListener("focusout", onBlur);
    window.addEventListener("scroll", onLayout, true);
    window.addEventListener("resize", onLayout);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      motionMedia.removeEventListener?.("change", onMotionChange);
      window.removeEventListener("pointermove", onPointer);
      main.removeEventListener("focusin", onFocus);
      main.removeEventListener("focusout", onBlur);
      window.removeEventListener("scroll", onLayout, true);
      window.removeEventListener("resize", onLayout);
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
      overlay?.remove();
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <span ref={anchor} className="specular-interactions-anchor" aria-hidden="true" />;
}
