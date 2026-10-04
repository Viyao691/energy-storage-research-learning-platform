// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/search" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("../components/workspace/FullMaterialBackdrop", () => ({ FullMaterialBackdrop: ({ kind }: { kind: string }) => <div className="full-material-backdrop" data-kind={kind} /> }));
import { WorkspaceShell } from "../components/workspace/WorkspaceShell";

afterEach(cleanup);

it("maps selected root routes to full-page materials without replacing research data or detail pages", () => {
  const view = render(<WorkspaceShell><section>Page</section></WorkspaceShell>);
  for (const [pathname, kind] of [["/search", "carbon"], ["/compare", "electrode"], ["/knowledge", "crystal"], ["/learning", "learning"], ["/contests", "contest"]]) {
    route.pathname = pathname;
    view.rerender(<WorkspaceShell><section>Page</section></WorkspaceShell>);
    expect(view.container.querySelector(".full-material-backdrop")?.getAttribute("data-kind")).toBe(kind);
    expect(view.container.querySelector(".material-stack-scene")).toBeNull();
    expect(view.container.querySelector(".energy-material-scene")).toBeNull();
  }
  route.pathname = "/research-data";
  view.rerender(<WorkspaceShell><section>Page</section></WorkspaceShell>);
  expect(view.container.querySelector(".full-material-backdrop")).toBeNull();
  expect(view.container.querySelector(".material-stack-scene")).toBeTruthy();
  for (const pathname of ["/learning/42", "/contests/42"]) {
    route.pathname = pathname;
    view.rerender(<WorkspaceShell><section>Page</section></WorkspaceShell>);
    expect(view.container.querySelector(".full-material-backdrop")).toBeNull();
  }
});
