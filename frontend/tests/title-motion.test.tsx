// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkspaceHeader } from "../components/WorkspacePrimitives";
import TitleMotion from "../components/workspace/TitleMotion";

vi.mock("../components/react-bits/WarpText", () => ({ default: ({ text }: { text: string }) => <span data-effect="warp">{text}</span> }));
vi.mock("../components/react-bits/TechText", () => ({ default: ({ text }: { text: string }) => <span data-effect="tech">{text}</span> }));
vi.mock("../components/react-bits/TrueFocus", () => ({ default: ({ text }: { text: string }) => <span data-effect="focus">{text}</span> }));

afterEach(cleanup);

describe("page title motion", () => {
  it("keeps the selected route title as one semantic h1", () => {
    const { rerender } = render(<WorkspaceHeader eyebrow="ACADEMIC DISCOVERY" title="论文搜索" />);
    expect(screen.getByRole("heading", { level: 1, name: "论文搜索" }).querySelector('[data-effect="warp"]')).toBeTruthy();
    rerender(<WorkspaceHeader eyebrow="KNOWLEDGE WORKSPACE" title="论文库问答" />);
    expect(screen.getByRole("heading", { level: 1, name: "论文库问答" }).querySelector('[data-effect="focus"]')).toBeTruthy();
  });

  it("preserves a long dynamic title without truncation", () => {
    const title = "一种面向高安全储能系统的多尺度电极结构和循环寿命联合分析方法";
    render(<h1><TitleMotion text={title} variant="focus" /></h1>);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(title);
  });
});
