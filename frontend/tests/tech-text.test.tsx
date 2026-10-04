// @vitest-environment jsdom

import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TechText from "../components/react-bits/TechText";

const draw = vi.fn();
let frames: FrameRequestCallback[] = [];
const context = {
  setTransform: vi.fn(), clearRect: vi.fn(), drawImage: draw, fillText: vi.fn(), strokeText: vi.fn(),
  measureText: (value: string) => ({ width: value.length * 28, actualBoundingBoxLeft: 0, actualBoundingBoxRight: value.length * 28, actualBoundingBoxAscent: 36, actualBoundingBoxDescent: 8 }),
  setLineDash: vi.fn(), beginPath: vi.fn(), rect: vi.fn(), strokeRect: vi.fn(), fillRect: vi.fn(),
  moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), fill: vi.fn(), createRadialGradient: () => ({ addColorStop: vi.fn() }),
};

beforeEach(() => {
  draw.mockClear();
  frames = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(96);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 320, bottom: 96, width: 320, height: 96, toJSON: () => ({}) });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frames.push(callback); return frames.length; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("TechText", () => {
  it("draws once without scheduling an idle sweep", () => {
    const { container } = render(<h1><TechText text="论文库" color="#19384b" accentColor="#477985" sweep={false} /></h1>);
    expect(screen.getByRole("heading", { level: 1, name: "论文库" })).toBeTruthy();
    expect(container.querySelector("canvas")?.width).toBe(384);
    expect(container.querySelector("canvas")?.height).toBe(160);
    expect(draw).toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("selects a glyph on pointer movement and springs it home after dragging", () => {
    const { container, unmount } = render(<h1><TechText text="论文库" color="#19384b" accentColor="#477985" sweep={false} /></h1>);
    const title = container.querySelector<HTMLElement>(".tech-text")!;
    fireEvent.pointerMove(title, { clientX: 130, clientY: 45 });
    expect(frames.length).toBe(1);
    act(() => { frames.shift()?.(performance.now() + 16); });
    expect(context.stroke).toHaveBeenCalled();
    fireEvent.pointerDown(title, { clientX: 130, clientY: 45, pointerId: 1, pointerType: "mouse", button: 0 });
    fireEvent.pointerMove(title, { clientX: 175, clientY: 55 });
    act(() => { frames.shift()?.(performance.now() + 32); });
    fireEvent.pointerUp(title, { clientX: 400, clientY: 200, pointerId: 1 });
    const scheduled = vi.mocked(requestAnimationFrame).mock.calls.length;
    act(() => { frames.shift()?.(performance.now() + 48); });
    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBeGreaterThan(scheduled);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("supports keyboard selection without changing the accessible heading name", () => {
    const { container } = render(<h1><TechText text="论文库" color="#19384b" accentColor="#477985" sweep={false} /></h1>);
    const title = container.querySelector<HTMLElement>(".tech-text")!;
    title.focus();
    fireEvent.keyDown(title, { key: "ArrowRight" });
    expect(document.activeElement).toBe(title);
    expect(container.querySelector("h1")?.getAttribute("aria-label")).toBeNull();
    expect(title.getAttribute("aria-label")).toBe("论文库");
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it("keeps reduced-motion interaction static without a recurring frame", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    const { container } = render(<h1><TechText text="论文库" color="#19384b" accentColor="#477985" sweep={false} /></h1>);
    fireEvent.pointerMove(container.querySelector(".tech-text")!, { clientX: 130, clientY: 45 });
    expect(draw).toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
