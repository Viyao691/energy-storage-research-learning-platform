// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Onboarding from "../app/onboarding/page";
import { MODEL_PROVIDERS } from "../lib/modelCatalog";

const { apiMock } = vi.hoisted(() => ({ apiMock: { saveSettings: vi.fn() } }));
vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));
vi.mock("../components/workspace/TitleMotion", () => ({ default: ({ text }: { text: string }) => <span>{text}</span> }));

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); apiMock.saveSettings.mockResolvedValue({}); });

it("offers the same supplier catalog as settings, with a grid menu and Mock default model", async () => {
  const user = userEvent.setup();
  render(<Onboarding />);
  await user.click(screen.getByRole("button", { name: "下一步" }));
  expect(screen.getByRole("combobox", { name: "模型名称" }).textContent).toContain("mock-research-copilot");
  await user.click(screen.getByRole("combobox", { name: "模型供应商" }));
  expect(document.querySelector('.glide-select__menu[data-layout="grid"]')).toBeTruthy();
  expect(screen.getAllByRole("option").map(option => option.querySelector(".glide-select__name")?.textContent)).toEqual(MODEL_PROVIDERS.map(item => item.label));
});

it("selects a new supplier default and saves a custom model ID through the existing flow", async () => {
  const user = userEvent.setup();
  render(<Onboarding />);
  await user.click(screen.getByRole("button", { name: "下一步" }));
  await user.click(screen.getByRole("combobox", { name: "模型供应商" }));
  await user.click(screen.getByRole("option", { name: "Anthropic Claude" }));
  expect(screen.getByRole("combobox", { name: "模型名称" }).textContent).toContain("claude-sonnet-5");
  await user.click(screen.getByRole("combobox", { name: "模型名称" }));
  expect(screen.getByRole("option", { name: "claude-opus-5-5" })).toBeTruthy();
  await user.click(screen.getByRole("option", { name: "自定义模型 ID" }));
  await user.type(screen.getByRole("textbox", { name: "输入供应商提供的模型 ID（自定义）" }), "my-claude-model");
  await user.click(screen.getByRole("button", { name: "保存模型设置" }));
  await waitFor(() => expect(apiMock.saveSettings).toHaveBeenCalledWith(expect.objectContaining({
    model_provider: "anthropic", model_name: "my-claude-model", model_base_url: "https://api.anthropic.com/v1", backup_model: ""
  })));
});
