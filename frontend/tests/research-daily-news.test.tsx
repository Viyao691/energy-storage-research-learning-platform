// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ResearchDailyPage from "../app/research-daily/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: {
  latestResearchNews: vi.fn(), listResearchRuns: vi.fn(), listResearchNotifications: vi.fn(),
} }));
vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.listResearchRuns.mockResolvedValue({ items: [] });
  apiMock.listResearchNotifications.mockResolvedValue({ items: [] });
  apiMock.latestResearchNews.mockResolvedValue({ warnings: [], fetched_at: "2026-10-04", items: [
    { title: "AI model update", source: "MIT News · 人工智能", url: "https://news.mit.edu/ai", published_date: "2026-10-04", summary: "AI research" },
    { title: "Natural gas market", source: "EIA · 美国能源信息署（官方）", url: "https://www.eia.gov/todayinenergy/detail.php?id=1", published_date: "2026-10-03", summary: "Market report" },
    { title: "Grid expansion", source: "Clean Energy Wire · 能源新闻（媒体）", url: "https://www.cleanenergywire.org/news/grid", published_date: "2026-10-02", summary: "Grid news" },
  ] });
});
afterEach(cleanup);

it("shows multiple real sources with energy ahead of a separate AI group", async () => {
  render(createElement(ResearchDailyPage));
  const energy = await screen.findByRole("region", { name: "能源新闻" });
  const ai = screen.getByRole("region", { name: "AI 前沿" });
  expect(energy.compareDocumentPosition(ai) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(energy).getByText("EIA · 美国能源信息署（官方）")).toBeTruthy();
  expect(within(energy).getByText("2026-10-03")).toBeTruthy();
  expect(within(energy).getByRole("link", { name: /Natural gas market/ }).getAttribute("href")).toBe("https://www.eia.gov/todayinenergy/detail.php?id=1");
  expect(within(ai).getByText("MIT News · 人工智能")).toBeTruthy();
  expect(screen.getByText("3 个来源")).toBeTruthy();
});
