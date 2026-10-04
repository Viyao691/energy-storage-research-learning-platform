// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import HelpPage from "../app/help/page";

afterEach(cleanup);

describe("help guide", () => {
  it("groups all 40 guide entries and filters topics and FAQs by search", async () => {
    const user = userEvent.setup();
    render(<HelpPage />);
    expect(document.querySelectorAll(".material-help-group")).toHaveLength(5);
    expect(document.querySelectorAll(".material-help-entries details")).toHaveLength(40);
    await user.type(screen.getByRole("searchbox", { name: "搜索帮助主题与常见问题" }), "轻量研究挑战");
    expect(screen.getByText("轻量研究挑战怎么用")).toBeTruthy();
    expect(screen.getByText(/系统不会自动作答或评分/)).toBeTruthy();
    await user.clear(screen.getByRole("searchbox", { name: "搜索帮助主题与常见问题" }));
    await user.type(screen.getByRole("searchbox", { name: "搜索帮助主题与常见问题" }), "OCR");
    expect(screen.getByText("混合 OCR 怎么使用")).toBeTruthy();
    expect(screen.getByText("为什么 OCR 只使用 CPU？")).toBeTruthy();
    expect(screen.queryByText("费用与预算")).toBeNull();
    await user.clear(screen.getByRole("searchbox", { name: "搜索帮助主题与常见问题" }));
    await user.type(screen.getByRole("searchbox", { name: "搜索帮助主题与常见问题" }), "校园资讯 AI 预算");
    expect(screen.getByText("校园资讯 AI 预算")).toBeTruthy();
    expect(screen.getByText(/失败请求同样占每日次数/)).toBeTruthy();
    expect((screen.getByText("校园资讯 AI 预算").closest("details") as HTMLDetailsElement).open).toBe(true);
    await user.clear(screen.getByRole("searchbox", { name: "搜索帮助主题与常见问题" }));
    await user.type(screen.getByRole("searchbox", { name: "搜索帮助主题与常见问题" }), "重复配置");
    expect(screen.getByText("配置引导的用途与重复配置")).toBeTruthy();
    expect(screen.getByText(/第 2 步点击“保存模型设置”会立即覆盖全局模型/)).toBeTruthy();
    expect((screen.getByText("配置引导的用途与重复配置").closest("details") as HTMLDetailsElement).open).toBe(true);
    await user.clear(screen.getByRole("searchbox", { name: "搜索帮助主题与常见问题" }));
    await user.type(screen.getByRole("searchbox", { name: "搜索帮助主题与常见问题" }), "竞赛助手有什么区别");
    expect(screen.getByText("学习导师、科研助手与竞赛助手有什么区别")).toBeTruthy();
    expect(screen.getByText(/不改变功能、权限、模型或 AI 提示词/)).toBeTruthy();
  });
});
