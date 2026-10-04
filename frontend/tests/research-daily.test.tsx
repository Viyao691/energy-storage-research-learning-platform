// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResearchDailyPage from "../app/research-daily/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: { listResearchRuns: vi.fn(), listResearchNotifications: vi.fn() } }));
vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));

describe("ResearchDailyPage", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.listResearchRuns.mockResolvedValue({ items: [{ id: 1, status: "partial", started_at: "2026-08-01T09:00:00", discovered_count: 5, recommended_count: 2, warnings: ["Crossref 暂不可用"], error: null }, { id: 2, status: "running", started_at: "2026-08-02T09:00:00", discovered_count: 4, recommended_count: 1, warnings: [], error: null }], total: 80, page: 1, page_size: 20 });
    apiMock.listResearchNotifications.mockResolvedValue({ items: [{ id: 4, title: "固态电解质界面", body: "有 2 条新推荐", created_at: "2026-08-02T10:00:00", read_at: null }], total: 45, page: 1, page_size: 20 });
  });
  it("derives counts only from returned run and notification items", async () => {
    render(createElement(ResearchDailyPage));
    expect((await screen.findAllByText("部分可用")).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "科研日报" })).toBeTruthy();
    const summary = within(screen.getByLabelText("返回数据概览"));
    expect(summary.getByText("9", { selector: "strong" })).toBeTruthy();
    expect(summary.getByText("3", { selector: "strong" })).toBeTruthy();
    expect(summary.getByText("1", { selector: "strong" })).toBeTruthy();
    expect(screen.getByText(/按当前返回的 2 条运行记录分类/)).toBeTruthy();
    expect((await screen.findAllByText("运行中")).length).toBeGreaterThan(0);
    expect(screen.getByText(/Crossref 暂不可用/)).toBeTruthy();
    expect(screen.getByLabelText("固态电池主题示意")).toBeTruthy();
  });

  it("keeps loading metrics distinct from zero while requests are pending", () => {
    apiMock.listResearchRuns.mockReturnValue(new Promise(() => {}));
    apiMock.listResearchNotifications.mockReturnValue(new Promise(() => {}));
    render(createElement(ResearchDailyPage));
    expect(screen.getAllByText("读取中")).toHaveLength(4);
    expect(screen.queryByText("0", { selector: "strong" })).toBeNull();
  });

  it("shows independent request errors while preserving the successful dataset", async () => {
    apiMock.listResearchRuns.mockRejectedValue(new Error("运行记录暂不可用"));
    render(createElement(ResearchDailyPage));
    expect((await screen.findAllByText("运行记录暂不可用")).length).toBeGreaterThan(0);
    expect(screen.getByText("有 2 条新推荐")).toBeTruthy();
    expect(screen.getAllByText("读取失败")).toHaveLength(3);
    expect(within(screen.getByLabelText("返回数据概览")).getAllByText("读取失败", { selector: "strong" })).toHaveLength(3);
    await waitFor(() => expect(apiMock.listResearchNotifications).toHaveBeenCalledOnce());
  });

  it("shows notification request errors while preserving successful run data", async () => {
    apiMock.listResearchNotifications.mockRejectedValue(new Error("提醒暂不可用"));
    render(createElement(ResearchDailyPage));
    expect(await screen.findByText("提醒暂不可用")).toBeTruthy();
    expect((await screen.findAllByText("部分可用")).length).toBeGreaterThan(0);
    expect(within(screen.getByLabelText("返回数据概览")).getByText("9", { selector: "strong" })).toBeTruthy();
  });
});
