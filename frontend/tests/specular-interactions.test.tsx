// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { eligibleSpecularTarget, SpecularInteractions } from "../components/react-bits/SpecularInteractions";

afterEach(cleanup);

it("keeps original buttons and links interactive", () => {
  const click = vi.fn();
  const { container } = render(<main className="app-main"><SpecularInteractions /><button onClick={click}>运行</button><a className="button" href="#done">查看</a></main>);
  fireEvent.click(screen.getByRole("button", { name: "运行" }));
  expect(click).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "运行" }).hasAttribute("data-specular-action")).toBe(true);
  expect(container.querySelector("a.button")?.getAttribute("href")).toBe("#done");
});

it("accepts usable actions and excludes disabled, select and tab controls", () => {
  const { container } = render(<main><button>运行</button><button disabled>禁止</button><button role="combobox">选择</button><button role="tab">页签</button><button data-specular="off">自定义动效</button><a className="button" href="/help">帮助</a><a className="button-link" href="/export">导出</a><label className="material-file-select" htmlFor="file">选择 PDF</label><a href="/paper">正文链接</a></main>);
  const targets = [...container.querySelectorAll<HTMLElement>("button,a,label")];
  expect(targets.map(eligibleSpecularTarget)).toEqual([true, false, false, false, false, true, true, true, false]);
});

it("does not create a WebGL surface when motion is reduced", () => {
  const old = window.matchMedia;
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  const { container, unmount } = render(<main><SpecularInteractions /><button>运行</button></main>);
  fireEvent.pointerMove(container.querySelector("button")!, { clientX: 10, clientY: 10 });
  expect(document.querySelector("[data-specular-overlay]")).toBeNull();
  unmount();
  window.matchMedia = old;
});
