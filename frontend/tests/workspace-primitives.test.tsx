// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import {
  EditorialEmptyState,
  StatusBadge,
  WorkspaceHeader,
} from "../components/WorkspacePrimitives";

describe("Workspace primitives", () => {
  it("renders a title, status, and editorial empty state", () => {
    render(
      createElement(
        "section",
        null,
        createElement(WorkspaceHeader, {
          eyebrow: "RESEARCH WORKSPACE",
          title: "知识工作区",
          description: "围绕本地论文展开检索和阅读。",
          action: createElement("a", { href: "/library" }, "打开论文库"),
        }),
        createElement(StatusBadge, { tone: "ready", children: "索引已就绪" }),
        createElement(EditorialEmptyState, {
          title: "暂无研究记录",
          description: "新的本地结果会出现在这里。",
          action: createElement("a", { href: "/upload" }, "上传论文"),
        }),
      ),
    );

    expect(screen.getByRole("heading", { name: "知识工作区" })).toBeTruthy();
    expect(screen.getByText("索引已就绪")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "暂无研究记录" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "上传论文" }).getAttribute("href")).toBe("/upload");
  });
});
