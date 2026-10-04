// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlassIcons from "../components/react-bits/GlassIcons";

describe("GlassIcons", () => {
  afterEach(cleanup);

  it("keeps labels and counts visible and changes tabs by click and arrow key", async () => {
    const onChange = vi.fn();
    render(createElement(GlassIcons, {
      items: [
        { id: "all", icon: createElement("span", null, "A"), color: "blue", label: "全部", count: 23 },
        { id: "favorite", icon: createElement("span", null, "F"), color: "red", label: "我的收藏", count: 4 },
      ],
      value: "all",
      onChange,
      label: "论文分栏",
      panelId: "papers",
    }));
    const user = userEvent.setup();
    const all = screen.getByRole("tab", { name: "全部23" });
    const favorite = screen.getByRole("tab", { name: "我的收藏4" });
    expect(all.getAttribute("aria-selected")).toBe("true");
    expect(all.getAttribute("aria-controls")).toBe("papers");
    await user.click(favorite);
    expect(onChange).toHaveBeenCalledWith("favorite");
    all.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("favorite");
    expect(document.activeElement).toBe(favorite);
  });
});
