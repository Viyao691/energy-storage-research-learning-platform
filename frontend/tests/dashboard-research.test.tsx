// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React, { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../app/dashboard/page";

vi.mock("../components/home-hero/Particles", async () => {
  const React = await import("react");
  return { default: ({ theme }: { theme: string }) => React.createElement("div", { className: "hi-photo-particles", "data-theme": theme }) };
});

const { apiMock, routerMock } = vi.hoisted(() => ({
  apiMock: {
    settings: vi.fn(), papers: vi.fn(), listResearchSubscriptions: vi.fn(), listResearchRuns: vi.fn(), listResearchNotifications: vi.fn(),
  },
  routerMock: { push: vi.fn() },
}));

vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));
vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));

describe("single-screen category dashboard", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("React", React);
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    apiMock.settings.mockResolvedValue({ onboarding_completed: true });
    apiMock.papers.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });
    apiMock.listResearchSubscriptions.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });
    apiMock.listResearchRuns.mockResolvedValue({ items: [], total: 0 });
    apiMock.listResearchNotifications.mockResolvedValue({ items: [], total: 0 });
  });

  it("renders only the photographic Hero with six category entries", async () => {
    render(createElement(Dashboard));
    expect(await screen.findByRole("heading", { name: "储能科研，洞见未来" })).toBeTruthy();
    expect(document.querySelector(".hi-photo-scene")?.getAttribute("src")).toBe("/home-hero/scene-light.webp");
    expect(within(screen.getByRole("navigation", { name: "科研工作入口" })).getAllByRole("link")).toHaveLength(6);
    expect(document.querySelector(".dashboard-metrics, .dashboard-workspace")).toBeNull();
  });

  it("routes an incomplete profile to onboarding", async () => {
    apiMock.settings.mockResolvedValue({ onboarding_completed: false });
    render(createElement(Dashboard));
    expect((await screen.findByRole("link", { name: "开始配置" })).getAttribute("href")).toBe("/onboarding");
  });

  it("keeps live totals and model label in the category menus", async () => {
    apiMock.settings.mockResolvedValue({ onboarding_completed: true, api_key: { configured: true }, model_provider: "ollama", model_name: "qwen2.5:7b" });
    apiMock.papers.mockResolvedValue({ items: [{ id: 1 }], total: 33, page: 1, page_size: 20 });
    apiMock.listResearchSubscriptions.mockResolvedValue({ items: [{ id: 1 }], total: 2, page: 1, page_size: 20 });
    apiMock.listResearchNotifications.mockResolvedValue({ items: [{ id: 1, read_at: null }], total: 1 });
    render(createElement(Dashboard));

    fireEvent.click(screen.getByRole("button", { name: "展开论文分类" }));
    expect(await within(screen.getByRole("group", { name: "论文分类菜单" })).findByText("33 篇本地论文")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "展开科研分类" }));
    const research = screen.getByRole("group", { name: "科研分类菜单" });
    expect(await within(research).findByText("2 个主题 · 1 条未读")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "展开系统分类" }));
    expect(within(screen.getByRole("group", { name: "系统分类菜单" })).getByText("Ollama · qwen2.5:7b")).toBeTruthy();
  });

  it("keeps theme persistence and Ctrl+K search", async () => {
    render(createElement(Dashboard));
    fireEvent.click(await screen.findByRole("button", { name: "深色模式" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("energy-copilot-theme")).toBe("dark");
    expect(document.querySelector(".hi-photo-scene")?.getAttribute("src")).toBe("/home-hero/scene-dark.webp");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(routerMock.push).toHaveBeenCalledWith("/search");
  });

  it("keeps the categories available when reminders fail", async () => {
    apiMock.listResearchRuns.mockRejectedValue(new Error("提醒不可用"));
    apiMock.listResearchNotifications.mockRejectedValue(new Error("提醒不可用"));
    render(createElement(Dashboard));
    fireEvent.click(await screen.findByRole("button", { name: "展开科研分类" }));
    expect(await within(screen.getByRole("group", { name: "科研分类菜单" })).findByText("0 个主题 · — 条未读")).toBeTruthy();
    expect(screen.getByRole("link", { name: /搜索论文、主题或作者/ }).getAttribute("href")).toBe("/search");
  });
});
