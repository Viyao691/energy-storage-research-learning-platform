// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const gpu = vi.hoisted(() => ({ create: vi.fn(), render: vi.fn(), dispose: vi.fn(), lose: vi.fn() }));
vi.mock("three", async importOriginal => {
  const real = await importOriginal<typeof import("three")>();
  return { ...real, WebGLRenderer: class {
    domElement = document.createElement("canvas");
    constructor() { gpu.create(); }
    setPixelRatio() {}
    setClearColor() {}
    setSize() {}
    render() { gpu.render(); }
    dispose() { gpu.dispose(); }
    forceContextLoss() { gpu.lose(); }
  } };
});
import { PixelSnow } from "../components/workspace/PixelSnow";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); gpu.create.mockClear(); gpu.render.mockClear(); gpu.dispose.mockClear(); gpu.lose.mockClear(); });

it("does not create WebGL under reduced motion", () => {
  const media = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => media);
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  const view = render(<PixelSnow color="#126c72" density={.15} speed={.55} />);
  expect(gpu.create).not.toHaveBeenCalled();
  view.unmount();
  expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
});

it("pauses when hidden or offscreen and releases its context on unmount", () => {
  const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  let observe: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;
  const frames: FrameRequestCallback[] = [];
  let hidden = false;
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  vi.stubGlobal("matchMedia", () => media);
  vi.stubGlobal("IntersectionObserver", class { constructor(callback: typeof observe) { observe = callback; } observe() {} disconnect() {} });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const view = render(<PixelSnow color="#126c72" density={.15} speed={.55} />);
  act(() => observe?.([{ isIntersecting: true }]));
  expect(gpu.create).toHaveBeenCalledTimes(1);
  act(() => frames.shift()?.(performance.now()));
  expect(gpu.render).toHaveBeenCalledTimes(1);
  hidden = true;
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  act(() => frames.shift()?.(performance.now()));
  expect(gpu.render).toHaveBeenCalledTimes(1);
  hidden = false;
  act(() => observe?.([{ isIntersecting: false }]));
  expect(gpu.render).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(gpu.dispose).toHaveBeenCalledTimes(1);
  expect(gpu.lose).toHaveBeenCalledTimes(1);
});
