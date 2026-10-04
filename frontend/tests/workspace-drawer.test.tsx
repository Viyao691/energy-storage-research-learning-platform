// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { WorkspaceDrawer } from "../components/workspace/WorkspaceDrawer";
import { EvidenceDrawer } from "../components/workspace/EvidenceDrawer";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(() => cleanup());

function ControlledDrawer({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(true);
  return <WorkspaceDrawer open={open} title="检查证据" onClose={() => { onClose(); setOpen(false); }}><p>抽取内容</p><a href="/paper">打开论文</a></WorkspaceDrawer>;
}

describe("WorkspaceDrawer", () => {
  it("renders children and calls onClose for the close button", () => {
    const onClose = vi.fn();
    const { container } = render(<ControlledDrawer onClose={onClose} />);
    expect(screen.getByText("抽取内容")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "关闭面板" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(container.querySelector("dialog")?.hasAttribute("open")).toBe(false);
  });

  it("wraps Tab from the final drawer control to the first", () => {
    const { container } = render(<ControlledDrawer />);
    const controls = container.querySelectorAll("dialog button, dialog a[href]");
    const first = controls[0] as HTMLElement;
    const last = controls[1] as HTMLElement;
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);
  });

  it("wraps Shift+Tab from the first drawer control to the last", () => {
    const { container } = render(<ControlledDrawer />);
    const controls = container.querySelectorAll("dialog button, dialog a[href]");
    const first = controls[0] as HTMLElement;
    const last = controls[1] as HTMLElement;
    first.focus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("requests close when Escape raises the dialog cancel event", () => {
    const onClose = vi.fn();
    render(<ControlledDrawer onClose={onClose} />);
    fireEvent(screen.getByRole("dialog", { name: "检查证据" }), new Event("cancel", { bubbles: false, cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("EvidenceDrawer", () => {
  const base = { open: true, onClose: vi.fn(), paperId: 42, paperTitle: "钠离子电池研究", excerpt: "循环容量保持率为 90%。", sourceScope: "fulltext" as const };

  it("links to the requested valid full text page", () => {
    render(<EvidenceDrawer {...base} pageNumber={7} section="实验结果" />);
    expect(screen.getByRole("link", { name: "打开原文第 7 页" }).getAttribute("href")).toBe("/papers/42?page=7");
    expect(screen.getByText("实验结果")).toBeTruthy();
  });

  it.each([
    ["abstract", 7], ["note", 7], ["fulltext", null], ["fulltext", 0], ["fulltext", 1.5], ["fulltext", Number.NaN],
  ] as const)("uses a general paper link for %s with page %s", (sourceScope, pageNumber) => {
    render(<EvidenceDrawer {...base} sourceScope={sourceScope} pageNumber={pageNumber} />);
    expect(screen.getByRole("link", { name: "查看论文" }).getAttribute("href")).toBe("/papers/42");
    expect(screen.getByText(/无法确认可靠的原文页码/)).toBeTruthy();
  });
});





