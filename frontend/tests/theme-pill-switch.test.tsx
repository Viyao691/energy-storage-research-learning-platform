// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { afterEach, expect, it } from "vitest";
import ThemePillSwitch from "../components/react-bits/ThemePillSwitch";

afterEach(cleanup);

it("shows both themes and changes the pressed choice by click or arrow key", async () => {
  const user = userEvent.setup();
  function Example() {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    return <ThemePillSwitch theme={theme} onChange={setTheme} />;
  }
  render(<Example />);
  const light = screen.getByRole("button", { name: "浅色模式" });
  const dark = screen.getByRole("button", { name: "深色模式" });
  expect(light.getAttribute("aria-pressed")).toBe("true");
  await user.click(dark);
  expect(dark.getAttribute("aria-pressed")).toBe("true");
  dark.focus();
  await user.keyboard("{ArrowLeft}");
  expect(light.getAttribute("aria-pressed")).toBe("true");
});
