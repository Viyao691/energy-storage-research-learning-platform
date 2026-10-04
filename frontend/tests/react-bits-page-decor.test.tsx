// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/search" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("../components/react-bits/GhostFibers", () => ({ default: ({ paused }: { paused?: boolean }) => <div data-testid="ghost" data-paused={String(paused)} /> }));
vi.mock("../components/react-bits/TextLoop", () => ({ default: ({ text, paused }: { text: string; paused?: boolean }) => <div data-testid="text-loop" data-text={text} data-paused={String(paused)} /> }));
vi.mock("../components/workspace/EnergyMaterialScene", () => ({ EnergyMaterialScene: ({ variant }: { variant: string }) => <div data-testid="energy-scene" data-variant={variant} /> }));
vi.mock("../components/workspace/FullMaterialBackdrop", () => ({ FullMaterialBackdrop: ({ kind }: { kind: string }) => <div data-testid="full-material" data-kind={kind} /> }));
import { WorkspaceShell } from "../components/workspace/WorkspaceShell";

afterEach(() => { cleanup(); document.documentElement.removeAttribute("data-theme"); });

describe("React Bits page decoration", () => {
  it("uses full materials on learning and contests without the old page loop", () => {
    const view = render(<WorkspaceShell><section className="workspace-page">Page</section></WorkspaceShell>);
    expect(view.container.querySelector('[data-testid="full-material"]')?.getAttribute("data-kind")).toBe("carbon");
    expect(view.container.querySelector(".workspace-page-atmosphere")).toBeNull();
    route.pathname = "/knowledge";
    view.rerender(<WorkspaceShell><section className="workspace-page">Page</section></WorkspaceShell>);
    expect(view.container.querySelector('[data-testid="full-material"]')?.getAttribute("data-kind")).toBe("crystal");
    route.pathname = "/learning";
    view.rerender(<WorkspaceShell><section className="workspace-page">Page</section></WorkspaceShell>);
    expect(view.container.querySelector('[data-testid="energy-scene"]')).toBeNull();
    expect(view.container.querySelector('[data-testid="full-material"]')?.getAttribute("data-kind")).toBe("learning");
    route.pathname = "/contests";
    view.rerender(<WorkspaceShell><section className="workspace-page">Page</section></WorkspaceShell>);
    expect(view.container.querySelector('[data-testid="full-material"]')?.getAttribute("data-kind")).toBe("contest");
    expect(view.container.querySelector('[data-testid="text-loop"]')).toBeNull();
    route.pathname = "/learning/42";
    view.rerender(<WorkspaceShell><section className="workspace-page">Page</section></WorkspaceShell>);
    expect(view.container.querySelector(".react-bits-page-decor")).toBeNull();
    route.pathname = "/research-data";
    view.rerender(<WorkspaceShell><section className="workspace-page">Page</section></WorkspaceShell>);
    expect(view.container.querySelector(".react-bits-page-decor")).toBeNull();
  });

});
