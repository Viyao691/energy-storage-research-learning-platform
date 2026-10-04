// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { EnergyMaterialScene } from "../components/workspace/EnergyMaterialScene";

afterEach(() => cleanup());

it("renders four separate atlas cells and expands from page scroll without adding a scroll track", async () => {
  const view = render(<main><EnergyMaterialScene variant="carbon" /><input aria-label="query" /></main>);
  const scene = view.container.querySelector<HTMLElement>(".energy-material-scene")!;
  expect(scene.querySelectorAll(".energy-layer-cell")).toHaveLength(4);
  expect(scene.querySelector("canvas")).toBeNull();
  Object.defineProperty(scene, "getBoundingClientRect", { value: () => ({ top: -250, width: 1000, height: 420 }) });
  act(() => window.dispatchEvent(new Event("scroll")));
  await waitFor(() => expect(Number(scene.dataset.progress)).toBeGreaterThan(.9));
  fireEvent.focusIn(view.container.querySelector("input")!);
  expect(scene.dataset.active).toBe("false");
});
