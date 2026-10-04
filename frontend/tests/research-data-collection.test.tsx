// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResearchDataPage from "../app/research-data/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: {
  scientificImports: vi.fn(), allScientificDatasets: vi.fn(), updateScientificDatasetState: vi.fn(),
} }));
vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));

const first = { id: 1, name: "数据集甲", source_type: "user_import", dataset_type: "table", paper_id: null, confirmation_status: "confirmed", quality: { reviewed: true }, is_favorite: false, is_read: false };
const second = { id: 2, name: "数据集乙", source_type: "user_import", dataset_type: "table", paper_id: 3, confirmation_status: "pending", quality: { reviewed: false }, is_favorite: true, is_read: true };

describe("research data collection", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.scientificImports.mockResolvedValue([]);
    apiMock.allScientificDatasets.mockResolvedValue({ items: [{ ...first }, { ...second }] });
  });

  it("filters by independent favorite and reading state without changing confirmation totals", async () => {
    render(<ResearchDataPage />);
    const grid = await screen.findByRole("tabpanel", { name: "数据集筛选结果" });
    expect(within(grid).getByText("数据集甲")).toBeTruthy();
    expect(within(grid).getByText("数据集乙")).toBeTruthy();
    expect(screen.getByText("2 个用户导入数据集")).toBeTruthy();
    await userEvent.click(screen.getByRole("tab", { name: /我的收藏/ }));
    expect(within(grid).queryByText("数据集甲")).toBeNull();
    expect(within(grid).getByText("数据集乙")).toBeTruthy();
    await userEvent.click(screen.getByRole("tab", { name: /未读/ }));
    expect(within(grid).getByText("数据集甲")).toBeTruthy();
    expect(within(grid).queryByText("数据集乙")).toBeNull();
    expect(screen.getByText("2 个用户导入数据集")).toBeTruthy();
  });

  it("persists each flag, preserves confirmation status, and exposes failures without false success", async () => {
    apiMock.updateScientificDatasetState.mockResolvedValueOnce({ ...first, is_favorite: true });
    apiMock.updateScientificDatasetState.mockRejectedValueOnce(new Error("保存失败"));
    render(<ResearchDataPage />);
    const favorite = await screen.findByRole("button", { name: "收藏 数据集甲" });
    await userEvent.click(favorite);
    expect(apiMock.updateScientificDatasetState).toHaveBeenCalledWith(1, { is_favorite: true, is_read: false });
    expect(screen.getByRole("button", { name: "取消收藏 数据集甲" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "标记已读 数据集甲" }).getAttribute("aria-pressed")).toBe("false");
    expect(within(screen.getByRole("tabpanel", { name: "数据集筛选结果" })).getByText("用户已核对")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "标记已读 数据集甲" }));
    expect(apiMock.updateScientificDatasetState).toHaveBeenLastCalledWith(1, { is_favorite: true, is_read: true });
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "保存失败");
    expect(screen.getByRole("button", { name: "标记已读 数据集甲" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("distinguishes an empty collection from an empty filtered result", async () => {
    apiMock.allScientificDatasets.mockResolvedValueOnce({ items: [{ ...first }] });
    const view = render(<ResearchDataPage />);
    await screen.findByText("数据集甲");
    await userEvent.click(screen.getByRole("tab", { name: /我的收藏/ }));
    expect(screen.getByText("当前筛选下没有数据集")).toBeTruthy();
    expect(screen.queryByText("尚无科研数据集")).toBeNull();
    view.unmount();
    apiMock.allScientificDatasets.mockResolvedValue({ items: [] });
    render(<ResearchDataPage />);
    expect(await screen.findByText("尚无科研数据集")).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "我的收藏0" })).toBeTruthy();
  });
});
