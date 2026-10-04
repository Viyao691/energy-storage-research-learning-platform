// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Nav } from "../components/Nav";

const route = vi.hoisted(() => ({ pathname: "/papers/42" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

afterEach(() => { cleanup(); route.pathname = "/papers/42"; });

describe("branched sidebar navigation", () => {
  it("opens the matching route group and follows later route changes", () => {
    const view = render(<Nav />);
    expect(screen.getByRole("button", { name: "论文" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "论文库" }).getAttribute("aria-current")).toBe("page");

    route.pathname = "/learning/course-1";
    view.rerender(<Nav />);
    expect(screen.getByRole("button", { name: "学习" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "学习中心" }).getAttribute("aria-current")).toBe("page");
  });

  it("hides folded links from keyboard focus and the accessibility tree", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const section = screen.getByRole("button", { name: "论文" });
    expect(section.getAttribute("aria-controls")).toBeTruthy();
    await user.click(section);
    expect(section.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link", { name: "上传论文" })).toBeNull();
    expect((screen.getByRole("link", { name: "上传论文", hidden: true }) as HTMLAnchorElement).tabIndex).toBe(-1);
  });

  it("keeps all 18 destination links and the active top-level home link", () => {
    route.pathname = "/dashboard";
    render(<Nav />);
    const nav = screen.getByRole("navigation", { name: "主导航" });
    const hrefs = Array.from(nav.querySelectorAll("a[href]"), link => link.getAttribute("href"));
    expect(hrefs).toEqual([
      "/dashboard", "/upload", "/search", "/library", "/compare", "/knowledge",
      "/learning", "/research-daily", "/campus", "/contests", "/subscriptions",
      "/research-data", "/ideas", "/settings", "/diagnostics", "/maintenance",
      "/help", "/onboarding"
    ]);
    expect(within(nav).getByRole("link", { name: "首页" }).getAttribute("aria-current")).toBe("page");
  });
});
