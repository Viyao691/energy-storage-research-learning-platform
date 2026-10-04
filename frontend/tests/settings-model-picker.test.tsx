// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { afterEach, expect, it } from "vitest";
import SettingsModelPicker from "../components/workspace/SettingsModelPicker";
import { modelChoices } from "../lib/modelCatalog";

afterEach(cleanup);

it("keeps an unknown saved model editable and changes to a catalog model", async () => {
  const user = userEvent.setup();
  function Example() {
    const [model, setModel] = useState("my-endpoint-model");
    return <><label htmlFor="model">模型</label><SettingsModelPicker id="model" value={model} options={modelChoices("qwen")} onChange={setModel} placeholder="模型 ID" /></>;
  }
  render(<Example />);
  expect((screen.getByRole("textbox", { name: "模型 ID（自定义）" }) as HTMLInputElement).value).toBe("my-endpoint-model");
  await user.click(screen.getByRole("combobox", { name: "模型" }));
  await user.click(screen.getByRole("option", { name: "qwen3.8-flash" }));
  expect(screen.queryByRole("textbox", { name: "模型 ID（自定义）" })).toBeNull();
  expect(screen.getByRole("combobox", { name: "模型" }).textContent).toContain("qwen3.8-flash");
});

it("opens a custom ID input and resets the picker when the supplier changes", async () => {
  const user = userEvent.setup();
  function Example() {
    const [provider, setProvider] = useState("minimax");
    const [model, setModel] = useState("MiniMax-M3");
    return <><button onClick={() => { setProvider("qwen"); setModel("qwen3.8-flash"); }}>切换供应商</button><label htmlFor="model">模型</label><SettingsModelPicker key={provider} id="model" value={model} options={modelChoices(provider)} onChange={setModel} placeholder="模型 ID" /></>;
  }
  render(<Example />);
  await user.click(screen.getByRole("combobox", { name: "模型" }));
  await user.click(screen.getByRole("option", { name: "自定义模型 ID" }));
  await user.type(screen.getByRole("textbox", { name: "模型 ID（自定义）" }), "my-model");
  expect((screen.getByRole("textbox", { name: "模型 ID（自定义）" }) as HTMLInputElement).value).toBe("my-model");
  await user.click(screen.getByRole("button", { name: "切换供应商" }));
  expect(screen.queryByRole("textbox", { name: "模型 ID（自定义）" })).toBeNull();
  expect(screen.getByRole("combobox", { name: "模型" }).textContent).toContain("qwen3.8-flash");
});
