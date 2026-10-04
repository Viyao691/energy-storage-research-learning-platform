"use client";

import React, { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import "./GhostFibers.css";

type Props = {
  lineColor?: string; glowColor?: string; speed?: number; scale?: number;
  rotation?: number; rotationSpeed?: number; layers?: number;
  waveAmplitude?: number; waveFrequency?: number; waveSpeed?: number; layerSpeed?: number;
  twist?: number; twistFrequency?: number; twistSpeed?: number;
  lineFrequency?: number; lineSpacing?: number; lineSharpness?: number;
  glowFalloff?: number; glowIntensity?: number; brightness?: number; blueBoost?: number;
  vignette?: number; grain?: number; lightMode?: boolean; dpr?: number;
  fps?: number; paused?: boolean; className?: string;
};
type Settings = Required<Omit<Props, "className">>;
type Runtime = { update: (settings: Settings) => void };

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.trim().replace(/^#/, "");
  const normalized = value.length === 3 ? value.replace(/./g, channel => channel + channel) : value;
  const match = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
  if (!match) return [1, 1, 1];
  return [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255];
}

function setColor(uniform: { value: Float32Array }, hex: string) {
  const color = hexToRgb(hex);
  uniform.value.set(color);
}

const vertex = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uLayers;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uLayerSpeed;
uniform float uTwist;
uniform float uTwistFrequency;
uniform float uTwistSpeed;
uniform float uLineFrequency;
uniform float uLineSpacing;
uniform float uLineSharpness;
uniform float uGlowFalloff;
uniform float uGlowIntensity;
uniform float uBrightness;
uniform float uBlueBoost;
uniform float uVignette;
uniform float uGrain;
uniform float uRotationSpeed;
uniform float uLightMode;
uniform vec3 uLineColor;
uniform vec3 uGlowColor;

out vec4 fragColor;

#define MAX_LAYERS 10

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

float grainHash(vec2 point) {
  point = floor(point);
  float hash = 52.9829189 * fract(dot(point, vec2(0.065, 0.005)));
  return fract(hash);
}

float layeredGrain(vec2 fragmentPixel) {
  vec2 point = mod(fragmentPixel + vec2(uTime * 30.0, -uTime * 21.0), 1024.0);
  vec2 rotated = mat2(0.8, -0.5, 0.5, 0.8) * point;
  float grain = 0.0;
  grain += 0.40 * grainHash(rotated);
  grain += 0.25 * grainHash(rotated * 2.0 + 17.0);
  grain += 0.20 * grainHash(rotated * 4.0 + 47.0);
  grain += 0.10 * grainHash(rotated * 8.0 + 113.0);
  grain += 0.05 * grainHash(rotated * 16.0 + 191.0);
  return grain;
}

void main() {
  vec2 resolution = max(uResolution, vec2(1.0));
  vec2 uv = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;
  float time = uTime * uSpeed;
  vec3 backdrop = mix(vec3(0.070588, 0.058824, 0.090196), vec3(1.0), step(0.5, uLightMode));
  vec3 centerTone = max(uLineColor * 0.85567 - uGlowColor * 0.06186, vec3(0.0));
  vec3 cloudTone = uLineColor * 0.19588 + uGlowColor * 0.2268;
  vec2 p = uv;
  p /= max(uScale, 0.05);
  p = rotate2d(radians(uRotation) + time * uRotationSpeed) * p;
  vec3 color = vec3(0.0);
  float fiberField = 0.0;

  for (int index = 0; index < MAX_LAYERS; index++) {
    float fi = float(index) + 1.0;
    if (fi > uLayers) break;

    p += uWaveAmplitude * sin(p.yx * fi * uWaveFrequency + time * (uWaveSpeed + fi * uLayerSpeed));

    float radius = length(p);
    float polarAngle = atan(p.y, p.x);
    polarAngle += sin(radius * uTwistFrequency - time * uTwistSpeed + fi) * uTwist;
    p = vec2(cos(polarAngle), sin(polarAngle)) * radius;

    float lines = abs(sin(p.x * (uLineFrequency + fi * uLineSpacing) + sin(p.y * 3.0 + time)));
    lines = pow(max(0.0, 1.0 - lines), uLineSharpness);
    fiberField += lines / fi;
    color += uLineColor * lines / fi;

    float glow = exp(-uGlowFalloff * abs(sin(p.x * 3.0 + time + fi)));
    color += uGlowColor * glow * uGlowIntensity / (fi * 2.0);
  }

  float center = exp(-2.2 * dot(uv, uv));
  color += centerTone * center;

  float cloud = exp(-1.5 * length(uv + vec2(sin(time * 0.3) * 0.25, cos(time * 0.25) * 0.18)));
  color += cloudTone * cloud;

  float vignette = 1.0 - smoothstep(0.35, 1.45, length(uv));
  color *= mix(1.0 - uVignette, 1.0, vignette);
  color = 1.0 - exp(-color * uBrightness);
  color.b *= uBlueBoost;

  vec3 outputColor;
  if (uLightMode > 0.5) {
    float edgeFade = mix(1.0 - uVignette, 1.0, vignette);
    float fibers = pow(smoothstep(0.12, 1.05, fiberField) * edgeFade, 1.5);
    float atmosphere = (center * 0.025 + cloud * 0.015) * edgeFade;
    vec3 fiberInk = mix(backdrop, uLineColor, 0.52);
    vec3 airColor = mix(backdrop, uGlowColor, 0.16);

    outputColor = mix(backdrop, airColor, atmosphere);
    outputColor = mix(outputColor, fiberInk, fibers * mix(0.3, 0.48, step(0.5, uLightMode)));
  } else {
    outputColor = backdrop + color;
  }

  float noise = (layeredGrain(gl_FragCoord.xy) - 0.5) * uGrain;
  outputColor = clamp(outputColor + noise, 0.0, 1.0);
  fragColor = vec4(outputColor, 1.0);
}
`;

export default function GhostFibers({
  lineColor = "#140E35", glowColor = "#3437A0", speed = .2, scale = 2,
  rotation = 0, rotationSpeed = .25, layers = 4, waveAmplitude = .015,
  waveFrequency = 3, waveSpeed = .15, layerSpeed = .08, twist = .1,
  twistFrequency = 5, twistSpeed = 1.2, lineFrequency = 5, lineSpacing = 2,
  lineSharpness = 16, glowFalloff = 10, glowIntensity = 1.6, brightness = 2,
  blueBoost = 1.25, vignette = .8, grain = .05, lightMode = false,
  dpr = 1, fps = 60, paused = false, className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let renderer: Renderer | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let cleanup = () => {};
    try {
      renderer = new Renderer({ webgl: 2, alpha: false, antialias: false, dpr: Math.min(Math.max(dpr, .5), 2) });
      const gl = renderer.gl;
      canvas = gl.canvas;
      canvas.style.cssText = "width:100%;height:100%;display:block";
      canvas.setAttribute("aria-hidden", "true");
      container.appendChild(canvas);
      const geometry = new Triangle(gl);
      const uniforms = {
        uResolution: { value: new Float32Array([1, 1]) }, uTime: { value: 0 },
        uSpeed: { value: .2 }, uScale: { value: 2 }, uRotation: { value: 0 },
        uRotationSpeed: { value: .25 }, uLayers: { value: 4 },
        uWaveAmplitude: { value: .015 }, uWaveFrequency: { value: 3 },
        uWaveSpeed: { value: .15 }, uLayerSpeed: { value: .08 },
        uTwist: { value: .1 }, uTwistFrequency: { value: 5 }, uTwistSpeed: { value: 1.2 },
        uLineFrequency: { value: 5 }, uLineSpacing: { value: 2 }, uLineSharpness: { value: 16 },
        uGlowFalloff: { value: 10 }, uGlowIntensity: { value: 1.6 },
        uBrightness: { value: 2 }, uBlueBoost: { value: 1.25 },
        uVignette: { value: .8 }, uGrain: { value: .05 }, uLightMode: { value: 0 },
        uLineColor: { value: new Float32Array(hexToRgb("#140E35")) },
        uGlowColor: { value: new Float32Array(hexToRgb("#3437A0")) },
      };
      const program = new Program(gl, { vertex, fragment, uniforms });
      const mesh = new Mesh(gl, { geometry, program });
      let frame = 0, elapsed = 0, previous = performance.now(), lastRender = 0;
      let frameRate = 60, isPaused = false, isVisible = true, pageVisible = !document.hidden;
      const reduced = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
      const render = () => renderer?.render({ scene: mesh });
      const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
      const canRun = () => isVisible && pageVisible && !isPaused && !reduced?.matches;
      const loop = (now: number) => {
        frame = 0;
        if (!canRun()) return;
        elapsed += Math.min((now - previous) / 1000, .1);
        previous = now;
        if (now - lastRender >= 1000 / frameRate - .5) {
          uniforms.uTime.value = elapsed;
          render();
          lastRender = now;
        }
        frame = requestAnimationFrame(loop);
      };
      const start = () => { if (!canRun() || frame) return; previous = performance.now(); frame = requestAnimationFrame(loop); };
      const sync = () => { if (canRun()) start(); else stop(); };
      const size = () => {
        const rect = container.getBoundingClientRect();
        renderer?.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
        uniforms.uResolution.value[0] = gl.drawingBufferWidth;
        uniforms.uResolution.value[1] = gl.drawingBufferHeight;
        render();
      };
      const resize = typeof ResizeObserver === "function" ? new ResizeObserver(size) : null;
      resize?.observe(container);
      if (!resize) window.addEventListener("resize", size);
      const intersection = typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; sync(); }, { threshold: 0 }) : null;
      intersection?.observe(container);
      const visibility = () => { pageVisible = !document.hidden; sync(); };
      document.addEventListener("visibilitychange", visibility);
      reduced?.addEventListener?.("change", sync);
      runtimeRef.current = { update(next) {
        setColor(uniforms.uLineColor, next.lineColor);
        setColor(uniforms.uGlowColor, next.glowColor);
        uniforms.uSpeed.value = next.speed; uniforms.uScale.value = next.scale;
        uniforms.uRotation.value = next.rotation; uniforms.uRotationSpeed.value = next.rotationSpeed;
        uniforms.uLayers.value = Math.min(Math.max(Math.round(next.layers), 1), 10);
        uniforms.uWaveAmplitude.value = next.waveAmplitude; uniforms.uWaveFrequency.value = next.waveFrequency;
        uniforms.uWaveSpeed.value = next.waveSpeed; uniforms.uLayerSpeed.value = next.layerSpeed;
        uniforms.uTwist.value = next.twist; uniforms.uTwistFrequency.value = next.twistFrequency;
        uniforms.uTwistSpeed.value = next.twistSpeed; uniforms.uLineFrequency.value = next.lineFrequency;
        uniforms.uLineSpacing.value = next.lineSpacing; uniforms.uLineSharpness.value = next.lineSharpness;
        uniforms.uGlowFalloff.value = next.glowFalloff; uniforms.uGlowIntensity.value = next.glowIntensity;
        uniforms.uBrightness.value = next.brightness; uniforms.uBlueBoost.value = next.blueBoost;
        uniforms.uVignette.value = next.vignette; uniforms.uGrain.value = next.grain;
        uniforms.uLightMode.value = next.lightMode ? 1 : 0;
        frameRate = Math.min(Math.max(next.fps, 1), 120);
        isPaused = next.paused;
        sync();
        render();
      } };
      size();
      sync();
      cleanup = () => {
        stop(); resize?.disconnect(); intersection?.disconnect();
        if (!resize) window.removeEventListener("resize", size);
        document.removeEventListener("visibilitychange", visibility);
        reduced?.removeEventListener?.("change", sync);
        runtimeRef.current = null;
        if (canvas?.parentNode === container) container.removeChild(canvas);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    } catch {
      // WebGL can be unavailable in tests, remote sessions, or low-power browsers.
      runtimeRef.current = null;
      if (canvas?.parentNode === container) container.removeChild(canvas);
      renderer?.gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    return () => cleanup();
  }, [dpr]);

  useEffect(() => {
    runtimeRef.current?.update({ lineColor, glowColor, speed, scale, rotation, rotationSpeed, layers,
      waveAmplitude, waveFrequency, waveSpeed, layerSpeed, twist, twistFrequency, twistSpeed,
      lineFrequency, lineSpacing, lineSharpness, glowFalloff, glowIntensity, brightness,
      blueBoost, vignette, grain, lightMode, dpr, fps, paused });
  }, [lineColor, glowColor, speed, scale, rotation, rotationSpeed, layers, waveAmplitude,
    waveFrequency, waveSpeed, layerSpeed, twist, twistFrequency, twistSpeed, lineFrequency,
    lineSpacing, lineSharpness, glowFalloff, glowIntensity, brightness, blueBoost, vignette,
    grain, lightMode, dpr, fps, paused]);

  return <div ref={containerRef} className={`ghost-fibers-container ${className}`.trim()} />;
}

