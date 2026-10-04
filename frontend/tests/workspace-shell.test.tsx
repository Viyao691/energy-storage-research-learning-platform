// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/search" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

import { WorkspaceShell } from "../components/workspace/WorkspaceShell";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("WorkspaceShell", () => {
  it.each(["/dashboard"])("keeps the legacy shell for %s", pathname => {
    route.pathname = pathname;
    const { container } = render(<WorkspaceShell><p>content</p></WorkspaceShell>);
    expect(container.querySelector(".workspace-v2")).toBeNull();
    expect(container.querySelector(".specular-interactions-anchor")).toBeNull();
    expect(container.querySelector(".app-shell .app-main .app-footer")).toBeTruthy();
  });

  it("gives non-home routes a contextual topbar and retains secondary navigation", () => {
    route.pathname = "/papers/42";
    const { container } = render(<WorkspaceShell><p>paper</p></WorkspaceShell>);
    expect(container.querySelector(".workspace-v2")).toBeTruthy();
    expect(container.querySelector(".specular-interactions-anchor")).toBeTruthy();
    expect(screen.getByText("论文详情")).toBeTruthy();
    expect(container.querySelector(".workspace-v2-search-link")?.getAttribute("href")).toBe("/search");
    for (const href of ["/contests", "/research-data", "/ideas", "/onboarding"]) {
      expect(container.querySelector(`.branched-menu a[href="${href}"]`)).toBeTruthy();
    }
  });

  it("persists theme changes and supports an accessible mobile menu", async () => {
    route.pathname = "/library";
    render(<WorkspaceShell><p>library</p></WorkspaceShell>);
    const theme = screen.getByRole("button", { name: "深色模式" });
    fireEvent.click(theme);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("energy-copilot-theme")).toBe("dark");
    const menu = screen.getByRole("button", { name: "打开导航" });
    fireEvent.click(menu);
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    await waitFor(() => expect(document.activeElement?.getAttribute("href")).toBe("/dashboard"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menu.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(menu);
  });

  it("syncs the theme control after the homepage changes the saved theme", () => {
    route.pathname = "/dashboard";
    const view = render(<WorkspaceShell><p>home</p></WorkspaceShell>);
    localStorage.setItem("energy-copilot-theme", "dark");
    document.documentElement.dataset.theme = "dark";
    route.pathname = "/search";
    view.rerender(<WorkspaceShell><p>search</p></WorkspaceShell>);
    expect(screen.getByRole("button", { name: "浅色模式" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "浅色模式" }));
    expect(localStorage.getItem("energy-copilot-theme")).toBe("light");
  });
});
