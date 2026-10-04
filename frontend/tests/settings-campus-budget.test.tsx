// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import SettingsPage from "../app/settings/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: {
  settings: vi.fn(), saveSettings: vi.fn(), documentAiStatus: vi.fn()
} }));
vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));

const saved = {
  model_provider: "mock", model_name: "mock-research-copilot", model_base_url: "", api_key: { configured: false },
  document_vision_provider: "mock", document_vision_model: "", document_vision_base_url: "",
  campus_ai_daily_limit: 20, campus_ai_max_tokens: 2400
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  apiMock.settings.mockResolvedValue(saved);
  apiMock.saveSettings.mockImplementation(async payload => ({ ...saved, ...payload }));
  apiMock.documentAiStatus.mockResolvedValue(undefined);
});

it("keeps the saved low tier, accepts custom numbers, and blocks invalid values before saving", async () => {
  const user = userEvent.setup();
  render(<SettingsPage />);
  const daily = await screen.findByLabelText("每日最大整理数") as HTMLInputElement;
  const tokens = screen.getByLabelText("单条最大 Token") as HTMLInputElement;
  expect(daily.value).toBe("20");
  expect(tokens.value).toBe("2400");
  expect(screen.getByRole("button", { name: "低 · 20/天" }).getAttribute("aria-pressed")).toBe("true");
  await user.click(screen.getByRole("button", { name: "标准 · 100/天" }));
  expect(daily.value).toBe("100");
  fireEvent.change(daily, { target: { value: "37" } });
  expect(screen.getByRole("button", { name: "标准 · 100/天" }).getAttribute("aria-pressed")).toBe("false");
  fireEvent.change(tokens, { target: { value: "" } });
  await user.click(screen.getByRole("button", { name: "保存校园资讯预算" }));
  expect(apiMock.saveSettings).not.toHaveBeenCalled();
  fireEvent.change(tokens, { target: { value: "2400.5" } });
  await user.click(screen.getByRole("button", { name: "保存校园资讯预算" }));
  expect(apiMock.saveSettings).not.toHaveBeenCalled();
  fireEvent.change(tokens, { target: { value: "3000" } });
  fireEvent.change(daily, { target: { value: "-1" } });
  await user.click(screen.getByRole("button", { name: "保存校园资讯预算" }));
  expect(apiMock.saveSettings).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "高 · 不限" }));
  expect(daily.value).toBe("0");
  await user.click(screen.getByRole("button", { name: "保存校园资讯预算" }));
  await waitFor(() => expect(apiMock.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ campus_ai_daily_limit: 0, campus_ai_max_tokens: 3000, model_provider: "mock" })));
});

it("restores a previously saved standard tier and token limit", async () => {
  apiMock.settings.mockResolvedValue({ ...saved, campus_ai_daily_limit: 100, campus_ai_max_tokens: 4096 });
  render(<SettingsPage />);
  expect((await screen.findByLabelText("每日最大整理数") as HTMLInputElement).value).toBe("100");
  expect((screen.getByLabelText("单条最大 Token") as HTMLInputElement).value).toBe("4096");
  expect(screen.getByRole("button", { name: "标准 · 100/天" }).getAttribute("aria-pressed")).toBe("true");
});
