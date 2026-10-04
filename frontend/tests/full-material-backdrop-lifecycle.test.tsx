// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FullMaterialBackdrop } from "../components/workspace/FullMaterialBackdrop";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("keeps a static material visible and avoids GPU work under reduced motion", () => {
  const media = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => media);
  const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
  const view = render(<main><FullMaterialBackdrop kind="carbon" /></main>);
  expect(view.container.querySelector(".full-material-backdrop-static")).toBeTruthy();
  expect(view.container.querySelector("canvas")).toBeNull();
  expect(context).not.toHaveBeenCalled();
  view.unmount();
  expect(media.removeEventListener).toHaveBeenCalled();
  vi.unstubAllGlobals();
});

it("does not create a canvas when reduced motion turns on before the image loads", () => {
  const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => media);
  const image = window.Image;
  const pendingImages: HTMLImageElement[] = [];
  vi.stubGlobal("Image", class {
    onload: (() => void) | null = null;
    set src(_value: string) { pendingImages.push(this as unknown as HTMLImageElement); }
  });
  const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
  const view = render(<main><FullMaterialBackdrop kind="carbon" /></main>);
  media.matches = true;
  const onChange = media.addEventListener.mock.calls.find(([type]) => type === "change")?.[1];
  onChange?.();
  pendingImages[0].onload?.(new Event("load"));
  expect(view.container.querySelector("canvas")).toBeNull();
  expect(context).not.toHaveBeenCalled();
  view.unmount();
  vi.stubGlobal("Image", image);
  vi.unstubAllGlobals();
});

it("loads the matching night texture and retires pending images on theme changes", () => {
  const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => media);
  const pending: Array<{ src: string; onload: (() => void) | null }> = [];
  vi.stubGlobal("Image", class {
    onload: (() => void) | null = null;
    private source = "";
    get src() { return this.source; }
    set src(value: string) { this.source = value; pending.push(this); }
  });
  const view = render(<main><FullMaterialBackdrop kind="carbon" theme="light" /></main>);
  expect(pending[0].src).toBe("/workspace/motion/full-carbon-v1.png");
  view.rerender(<main><FullMaterialBackdrop kind="carbon" theme="dark" /></main>);
  expect(pending[0].onload).toBeNull();
  expect(pending[1].src).toBe("/workspace/motion/night-v2/full-carbon.png");
  view.rerender(<main><FullMaterialBackdrop kind="carbon" theme="light" /></main>);
  expect(pending[1].onload).toBeNull();
  expect(pending[2].src).toBe("/workspace/motion/full-carbon-v1.png");
  view.unmount();
  expect(pending[2].onload).toBeNull();
  vi.unstubAllGlobals();
});
