// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/search" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("../components/workspace/EnergyMaterialScene", () => ({ EnergyMaterialScene: ({ variant }: { variant: string }) => <div data-testid="energy-scene" data-variant={variant} /> }));
vi.mock("../components/workspace/FullMaterialBackdrop", () => ({ FullMaterialBackdrop: ({ kind }: { kind: string }) => <div data-testid="full-material" data-kind={kind} /> }));
import { WorkspaceShell } from "../components/workspace/WorkspaceShell";
import IdeasIonScene from "../components/workspace/IdeasIonScene";

afterEach(() => cleanup());

it("selects full-page materials for search, compare, and knowledge while preserving research data", () => {
  const view = render(<WorkspaceShell><section>Page</section></WorkspaceShell>);
  for (const [path, kind] of [["/search", "carbon"], ["/compare", "electrode"], ["/knowledge", "crystal"]]) {
    route.pathname = path;
    view.rerender(<WorkspaceShell><section>Page</section></WorkspaceShell>);
    expect(view.container.querySelector('[data-testid="full-material"]')?.getAttribute("data-kind")).toBe(kind);
    expect(view.container.querySelector('[data-testid="energy-scene"]')).toBeNull();
  }
  route.pathname = "/learning";
  view.rerender(<WorkspaceShell><section>Page</section></WorkspaceShell>);
  expect(view.container.querySelector('[data-testid="energy-scene"]')).toBeNull();
  expect(view.container.querySelector('[data-testid="full-material"]')?.getAttribute("data-kind")).toBe("learning");
  route.pathname = "/contests";
  view.rerender(<WorkspaceShell><section>Page</section></WorkspaceShell>);
  expect(view.container.querySelector('[data-testid="energy-scene"]')).toBeNull();
  expect(view.container.querySelector('[data-testid="full-material"]')?.getAttribute("data-kind")).toBe("contest");
  route.pathname = "/research-data";
  view.rerender(<WorkspaceShell><section>Page</section></WorkspaceShell>);
  expect(view.container.querySelector(".material-stack-scene")).toBeTruthy();
  expect(view.container.querySelector(".energy-material-backdrop")).toBeTruthy();
  expect(view.container.querySelector('[data-testid="full-material"]')).toBeNull();
});

it("reveals aligned interior material through a local pointer spotlight", async () => {
  const view = render(<div className="ideas-ion-stage"><IdeasIonScene quiet={false} selectedDataset={null} /></div>);
  const stage = view.container.querySelector(".ideas-ion-stage")!;
  Object.defineProperty(stage, "getBoundingClientRect", { value: () => ({ left: 100, top: 50, width: 800, height: 600 }) });
  fireEvent.pointerMove(stage, { clientX: 500, clientY: 350, pointerType: "mouse" });
  const reveal = view.container.querySelector<HTMLElement>(".ideas-ion-reveal")!;
  await waitFor(() => expect(reveal.style.getPropertyValue("--reveal-x")).toBe("400.0px"));
  expect(reveal.style.getPropertyValue("--reveal-y")).toBe("300.0px");
  expect(reveal.style.opacity).toBe("1");
  expect(view.container.querySelector(".ideas-ion-scene")?.getAttribute("data-selected-dataset")).toBe("");
});
