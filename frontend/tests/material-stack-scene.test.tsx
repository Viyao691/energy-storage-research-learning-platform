// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/research-data" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
import { WorkspaceShell } from "../components/workspace/WorkspaceShell";

afterEach(() => cleanup());

describe("material stack scene", () => {
  it("appears only on research data, and toggles by button", () => {
    const view = render(<WorkspaceShell><section className="workspace-page"><header className="workspace-header workspace-header-artwork">Page</header></section></WorkspaceShell>);
    expect(view.container.querySelectorAll(".material-stack-layer")).toHaveLength(3);
    expect(view.container.querySelector(".workspace-page-atmosphere")).toBeNull();
    const button = screen.getByRole("button", { name: "展开材料" });
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "收拢材料" })).toBeTruthy();
    route.pathname = "/compare";
    view.rerender(<WorkspaceShell><section className="workspace-page"><header className="workspace-header workspace-header-artwork">Compare</header></section></WorkspaceShell>);
    expect(view.container.querySelector(".material-stack-scene")).toBeNull();
    expect(view.container.querySelector(".full-material-backdrop")?.getAttribute("data-kind")).toBe("electrode");
    route.pathname = "/search";
    view.rerender(<WorkspaceShell><section className="workspace-page">Search</section></WorkspaceShell>);
    expect(view.container.querySelector(".material-stack-scene")).toBeNull();
    expect(view.container.querySelector(".full-material-backdrop")?.getAttribute("data-kind")).toBe("carbon");
  });
});
