"use client";

import { useEffect, useRef } from "react";
import { Camera, Geometry, Mesh, Program, Renderer } from "ogl";
import "./particles.css";

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uBaseSize;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 point = modelMatrix * vec4(position, 1.0);
    point.x += sin(uTime * random.z + 6.28 * random.w) * 0.12;
    point.y += cos(uTime * random.y + 6.28 * random.x) * 0.09;
    vec4 viewPoint = viewMatrix * point;
    gl_PointSize = uBaseSize * (0.7 + random.x * 0.6) / length(viewPoint.xyz);
    gl_Position = projectionMatrix * viewPoint;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  void main() {
    float distanceToCenter = length(gl_PointCoord.xy - vec2(0.5));
    float alpha = smoothstep(0.5, 0.08, distanceToCenter) * 0.45;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255];
}

export default function Particles({ theme }: { theme: "light" | "dark" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer: Renderer | null = null;
    let camera: Camera | null = null;
    let geometry: Geometry | null = null;
    let program: Program | null = null;
    let particles: Mesh | null = null;
    let frameId = 0;
    let previousTime = 0;
    let elapsed = 0;

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      previousTime = 0;
    };
    const resize = () => {
      if (!renderer || !camera || !container.clientWidth || !container.clientHeight) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.perspective({ aspect: container.clientWidth / container.clientHeight });
    };
    const draw = (time: number) => {
      frameId = 0;
      if (!renderer || !camera || !program || !particles || document.hidden || reducedMotion.matches) return;
      if (previousTime) elapsed += (time - previousTime) * 0.001 * 0.03;
      previousTime = time;
      program.uniforms.uTime.value = elapsed;
      renderer.render({ scene: particles, camera });
      frameId = requestAnimationFrame(draw);
    };
    const start = () => {
      if (renderer && !frameId && !document.hidden && !reducedMotion.matches) frameId = requestAnimationFrame(draw);
    };
    const teardown = () => {
      stop();
      window.removeEventListener("resize", resize);
      geometry?.remove();
      program?.remove();
      if (renderer) {
        const canvas = renderer.gl.canvas;
        renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.remove();
      }
      renderer = null;
      camera = null;
      geometry = null;
      program = null;
      particles = null;
    };
    const setup = () => {
      if (renderer || reducedMotion.matches) return;
      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        renderer = new Renderer({ dpr, depth: false, alpha: true });
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0);
        container.appendChild(gl.canvas);
        camera = new Camera(gl, { fov: 15 });
        camera.position.set(0, 0, 20);
        const count = 50;
        const positions = new Float32Array(count * 3);
        const randoms = new Float32Array(count * 4);
        const colors = new Float32Array(count * 3);
        const visibleHeight = 40 * Math.tan(7.5 * Math.PI / 180);
        const visibleWidth = visibleHeight * container.clientWidth / Math.max(container.clientHeight, 1);
        const palette = theme === "dark" ? ["#fff8df", "#d8aa69"] : ["#ffffff", "#b88949"];
        for (let index = 0; index < count; index++) {
          positions.set([((0.38 + Math.random() * 0.62) - 0.5) * visibleWidth, (Math.random() - 0.5) * visibleHeight, Math.random() * 0.4 - 0.2], index * 3);
          randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], index * 4);
          colors.set(hexToRgb(palette[index % palette.length]), index * 3);
        }
        geometry = new Geometry(gl, {
          position: { size: 3, data: positions },
          random: { size: 4, data: randoms },
          color: { size: 3, data: colors },
        });
        program = new Program(gl, {
          vertex, fragment,
          uniforms: { uTime: { value: 0 }, uBaseSize: { value: 42 * dpr } },
          transparent: true, depthTest: false, depthWrite: false,
        });
        particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });
        window.addEventListener("resize", resize);
        resize();
        start();
      } catch {
        teardown();
      }
    };
    const onMotionPreference = () => {
      if (reducedMotion.matches) teardown();
      else setup();
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    reducedMotion.addEventListener("change", onMotionPreference);
    document.addEventListener("visibilitychange", onVisibility);
    setup();
    return () => {
      reducedMotion.removeEventListener("change", onMotionPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      teardown();
    };
  }, [theme]);

  return <div ref={containerRef} className="hi-photo-particles" aria-hidden="true" />;
}
