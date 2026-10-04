// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import React, { useState } from "react";
import GlideSelect from "../components/react-bits/GlideSelect";

afterEach(cleanup);

it("uses a labelled combobox with keyboard selection and controlled updates", async () => {
  const user = userEvent.setup();
  function Example() {
    const [value, setValue] = useState("");
    return <><label htmlFor="choice">选择</label><GlideSelect id="choice" value={value} onChange={setValue} options={[{ value: "", label: "请选择" }, { value: "a", label: "甲" }, { value: "b", label: "乙" }]} /></>;
  }
  render(<Example />);
  const control = screen.getByRole("combobox", { name: "选择" });
  expect(screen.getByLabelText("选择")).toBe(control);
  control.focus();
  await user.keyboard("{ArrowDown}{End}{Enter}");
  expect(control.textContent).toContain("乙");
  await user.keyboard("{ArrowDown}{Home}{ArrowDown}{Enter}");
  expect(control.textContent).toContain("甲");
});

it("keeps disabled controls closed and handles dynamic empty options", async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  const { rerender } = render(<GlideSelect ariaLabel="动态" value="" onChange={changed} disabled options={[]} />);
  const control = screen.getByRole("combobox", { name: "动态" });
  expect(control.hasAttribute("disabled")).toBe(true);
  await user.click(control);
  expect(screen.queryByRole("listbox")).toBeNull();
  rerender(<GlideSelect ariaLabel="动态" value="" onChange={changed} options={[{ value: "x", label: "新增" }]} />);
  await user.click(control);
  await user.click(screen.getByRole("option", { name: "新增" }));
  expect(changed).toHaveBeenCalledWith("x");
});

it("moves across grid columns with arrow keys without changing list menus", async () => {
  const user = userEvent.setup();
  function Example() {
    const [value, setValue] = useState("0");
    return <><label htmlFor="supplier">供应商</label><GlideSelect id="supplier" menuLayout="grid" value={value} onChange={setValue} options={Array.from({ length: 9 }, (_, index) => ({ value: String(index), label: `供应商 ${index}` }))} /></>;
  }
  render(<Example />);
  const picker = screen.getByRole("combobox", { name: "供应商" });
  picker.focus();
  await user.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}");
  expect(screen.getByRole("listbox").parentElement?.getAttribute("data-layout")).toBe("grid");
  expect(picker.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "供应商 5" }).id);
  await user.keyboard("{Enter}");
  expect(picker.textContent).toContain("供应商 5");
});
