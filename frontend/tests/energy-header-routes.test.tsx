// @vitest-environment jsdom
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/library" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("../components/workspace/PixelSnow", () => ({ PixelSnow: () => <div data-testid="pixel-snow" /> }));
import { WorkspaceShell } from "../components/workspace/WorkspaceShell";

afterEach(() => cleanup());

it.each([
  ["/library", "library", "library-page", "workspace-header"],
  ["/research-daily", "digest", "research-daily-refined", "daily-hero"],
  ["/learning", "learning", "learning-refined", "workspace-header"],
  ["/settings", "system", "settings-page", "workspace-header"],
])("limits the %s material and shader particles to its header", (path, kind, pageClass, headerClass) => {
  route.pathname = path;
  const { container } = render(<WorkspaceShell><section className={pageClass}><header className={headerClass}><div><h1>标题</h1></div></header></section></WorkspaceShell>);
  const header = container.querySelector(`.${headerClass}`)!;
  expect(header.classList.contains(`energy-header-${kind}`)).toBe(true);
  expect(header.querySelector(".energy-header-material")).toBeTruthy();
  expect(header.querySelector('[data-testid="pixel-snow"]')).toBeTruthy();
  expect(container.querySelector(".workspace-page-atmosphere")).toBeNull();
  expect(container.querySelector(".energy-material-scene")).toBeNull();
});

it("leaves onboarding free of the previous atlas and energy header", () => {
  route.pathname = "/onboarding";
  const { container } = render(<WorkspaceShell><section className="onboarding-refined"><header className="onboarding-intro"><h1>首次设置向导</h1></header></section></WorkspaceShell>);
  expect(container.querySelector(".energy-header-material")).toBeNull();
  expect(container.querySelector('[data-testid="pixel-snow"]')).toBeNull();
  expect(container.querySelector(".workspace-page-atmosphere")).toBeNull();
  expect(container.querySelector(".workspace-v2-atmospheric")).toBeNull();
});
