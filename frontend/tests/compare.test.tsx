// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  papers: vi.fn(),
  comparePapers: vi.fn(),
  savedComparisons: vi.fn(),
  saveComparison: vi.fn(),
  savedComparison: vi.fn(),
  deleteSavedComparison: vi.fn()
}));

vi.mock("../lib/api", () => ({ api: apiMocks }));

import ComparePage from "../app/compare/page";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(cleanup);

describe("ComparePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.papers.mockResolvedValue({
      items: [
        { id: "1", title: "P2 half-cell paper" },
        { id: "2", title: "O3 full-cell paper" }
      ],
      total: 2,
      page: 1,
      page_size: 20
    });
    apiMocks.comparePapers.mockResolvedValue({
      question: "比较测试条件",
      comparison_markdown: "## 对比矩阵\n\n## 争议分析\n\n存在条件差异。[证据1]",
      papers: [],
      citations: [{
        citation_id: 1,
        paper_id: 1,
        paper_title: "P2 half-cell paper",
        page_number: 3,
        section: "Results",
        excerpt: "The sample was tested in a sodium half cell.",
        source_scope: "fulltext",
        parse_confidence: 0.9,
        similarity: 0.7
      }],
      fairness_warnings: ["半电池和全电池不能直接横比。"],
      evidence_status: "AI归纳（Mock 论文库问答演示）",
      confidence: { level: "中", explanation: "包含全文证据。" },
      provider: "mock",
      model_name: "mock-research-copilot"
    });
    apiMocks.savedComparisons.mockResolvedValue({ items: [] });
    apiMocks.saveComparison.mockResolvedValue({
      id: 1,
      title: "比较测试条件",
      paper_count: 2,
      paper_ids: [1, 2],
      created_at: "2026-08-01T00:00:00",
      question: "比较测试条件",
      comparison_markdown: "## 对比矩阵",
      papers: [],
      citations: [],
      fairness_warnings: [],
      evidence_status: "AI推断（Mock 演示）",
      confidence: { level: "中", explanation: "测试" },
      provider: "mock",
      model_name: "mock"
    });
  });

  it("selects papers and displays comparison warnings with citations", async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await user.click(await screen.findByLabelText("P2 half-cell paper"));
    await user.click(screen.getByLabelText("O3 full-cell paper"));
    await user.click(screen.getByRole("button", { name: "开始比较" }));

    expect(await screen.findByText("半电池和全电池不能直接横比。")).toBeTruthy();
    expect(screen.getByText("证据 1")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "预览证据 1" }));
    const dialog = screen.getByRole("dialog", { name: "原文证据" });
    expect(within(dialog).getByText("The sample was tested in a sodium half cell.")).toBeTruthy();
    expect(within(dialog).getByRole("link", { name: "打开原文第 3 页" }).getAttribute("href")).toBe("/papers/1?page=3");
    expect(apiMocks.comparePapers).toHaveBeenCalledWith(
      [1, 2],
      expect.any(String)
    );
  });

  it("only saves a comparison after the user explicitly requests it", async () => {
    const user = userEvent.setup();
    render(<ComparePage />);
    await user.click(await screen.findByLabelText("P2 half-cell paper"));
    await user.click(screen.getByLabelText("O3 full-cell paper"));
    await user.click(screen.getByRole("button", { name: "开始比较" }));
    await screen.findByText("半电池和全电池不能直接横比。" );
    await user.click(screen.getByRole("button", { name: "保存本次比较" }));
    expect(apiMocks.saveComparison).toHaveBeenCalledTimes(1);
  });
});
