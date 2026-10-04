// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import SubscriptionsPage from "../app/subscriptions/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: { listResearchSubscriptions: vi.fn(), createResearchSubscription: vi.fn(), updateResearchSubscription: vi.fn(), deleteResearchSubscription: vi.fn(), listResearchRuns: vi.fn() } }));
vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));

describe("SubscriptionsPage", () => {
  afterEach(cleanup);

  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.listResearchSubscriptions.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });
    apiMock.createResearchSubscription.mockResolvedValue({ id: 1, name: "钠离子正极", query: "sodium cathode", interval_hours: 168, enabled: true });
    apiMock.updateResearchSubscription.mockResolvedValue({ id: 1, name: "钠离子正极", query: "sodium cathode", interval_hours: 24, enabled: true, next_run_at: null, last_error: null });
    apiMock.deleteResearchSubscription.mockResolvedValue(undefined);
    apiMock.listResearchRuns.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 });
  });
  it("creates a weekly local subscription", async () => {
    render(createElement(SubscriptionsPage));
    expect(screen.queryByRole("textbox", { name: "订阅名称" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "添加主题" }));
    expect(screen.getByRole("dialog", { name: "添加研究主题" })).toBeTruthy();
    await userEvent.type(await screen.findByLabelText("订阅名称"), "钠离子正极");
    await userEvent.type(screen.getByLabelText("检索关键词"), "sodium cathode");
    await userEvent.click(screen.getByRole("button", { name: "保存订阅" }));
    expect(apiMock.createResearchSubscription).toHaveBeenCalledWith(expect.objectContaining({ interval_hours: 168 }));
    expect(screen.queryByRole("dialog", { name: "添加研究主题" })).toBeNull();
  });

  it("updates a subscription interval and cancels it with name confirmation", async () => {
    apiMock.listResearchSubscriptions.mockResolvedValue({
      items: [{ id: 1, name: "钠离子正极", query: "sodium cathode", sources: [], year_from: null, year_to: null, open_access_only: false, interval_hours: 168, enabled: true, next_run_at: null, last_error: null }],
      total: 1, page: 1, page_size: 20,
    });
    vi.spyOn(window, "prompt").mockReturnValue("钠离子正极");

    render(createElement(SubscriptionsPage));
    const interval = await screen.findByLabelText("钠离子正极的订阅周期");
    await userEvent.click(interval);
    await userEvent.click(screen.getByRole("option", { name: "每天一次" }));
    await userEvent.click(screen.getByRole("button", { name: "修改周期" }));
    expect(apiMock.updateResearchSubscription).toHaveBeenCalledWith(1, { interval_hours: 24 });

    await userEvent.click(screen.getByRole("button", { name: "取消订阅" }));
    expect(apiMock.deleteResearchSubscription).toHaveBeenCalledWith(1, "钠离子正极");
  });

  it("keeps topics available when run history fails", async () => {
    apiMock.listResearchSubscriptions.mockResolvedValue({ items: [{ id: 1, name: "钠离子正极", query: "sodium cathode", interval_hours: 168, enabled: true, next_run_at: null, last_error: null }], total: 1, page: 1, page_size: 20 });
    apiMock.listResearchRuns.mockRejectedValue(new Error("运行记录暂不可用"));
    render(createElement(SubscriptionsPage));
    expect(await screen.findByText("钠离子正极")).toBeTruthy();
    expect(await screen.findByText("运行记录暂不可用")).toBeTruthy();
    expect(screen.getByText("sodium cathode")).toBeTruthy();
  });

  it("shows the empty run range without invented values", async () => {
    render(createElement(SubscriptionsPage));
    expect(await screen.findByText(/暂无运行记录/)).toBeTruthy();
    expect(apiMock.listResearchRuns).toHaveBeenCalledOnce();
  });
});
