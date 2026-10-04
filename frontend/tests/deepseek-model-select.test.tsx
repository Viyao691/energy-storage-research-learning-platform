// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DeepSeekModelSelect from "../components/DeepSeekModelSelect";

describe("DeepSeek model picker", () => {
  afterEach(cleanup);

  it("shows DeepSeek V4 Pro as an explicit option", () => {
    render(<DeepSeekModelSelect value="deepseek-v4-flash" onChange={vi.fn()} />);

    const picker = screen.getByRole("combobox", { name: "模型名称" });
    expect(within(picker).getByRole("option", { name: "DeepSeek V4 Pro（深度模型）" }).getAttribute("value")).toBe("deepseek-v4-pro");
  });

  it("offers the vision experimental model as an explicit option", () => {
    render(<DeepSeekModelSelect value="deepseek-v4-flash" onChange={vi.fn()} />);

    const picker = screen.getByRole("combobox", { name: "模型名称" });
    expect(within(picker).getByRole("option", { name: "DeepSeek V4 Flash Vision（视觉实验版）" }).getAttribute("value")).toBe("deepseek-v4-flash-vision-exp");
  });
});
