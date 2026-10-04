// @vitest-environment jsdom

import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  knowledgeStatus: vi.fn(),
  reindexKnowledge: vi.fn(),
  askKnowledge: vi.fn(),
  savedConversations: vi.fn(),
  saveConversation: vi.fn(),
  savedConversation: vi.fn(),
  deleteSavedConversation: vi.fn()
}));

vi.mock("../lib/api", () => ({
  api: apiMocks
}));

import KnowledgePage from "../app/knowledge/page";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

afterEach(cleanup);

const firstAnswer = {
  question: "为什么会发生结构衰减？",
  answer_markdown:
    "## 检索结论\n\n高电压下的层间滑移可能导致结构衰减。[证据1]",
  evidence_status: "AI归纳（Mock 论文库问答演示）",
  provider: "mock",
  model_name: "mock-research-copilot",
  confidence: {
    level: "中" as const,
    explanation: "检索到全文证据并定位到页码。"
  },
  citations: [
    {
      citation_id: 1,
      paper_id: 7,
      paper_title: "P2 layered oxide",
      page_number: 4,
      section: "Results and Discussion",
      excerpt: "Slab gliding causes structural degradation.",
      source_scope: "fulltext" as const,
      parse_confidence: 0.92,
      similarity: 0.73
    }
  ]
};

describe("KnowledgePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.knowledgeStatus.mockResolvedValue({
      total_papers: 2,
      indexed_papers: 1,
      stale_papers: 1,
      chunk_count: 8,
      embedding_provider: "mock",
      embedding_model: "mock-multilingual-embedding",
      ready: true,
      message: "Mock 向量索引已就绪"
    });
    apiMocks.reindexKnowledge.mockResolvedValue({
      indexed_papers: 2,
      indexed_chunks: 12,
      skipped_papers: 0,
      embedding_provider: "mock",
      embedding_model: "mock-multilingual-embedding"
    });
    apiMocks.askKnowledge.mockResolvedValue(firstAnswer);
    apiMocks.savedConversations.mockResolvedValue({ items: [] });
    apiMocks.saveConversation.mockResolvedValue({
      id: 1,
      scope: "library",
      paper_id: null,
      title: firstAnswer.question,
      created_at: "2026-08-01T00:00:00",
      updated_at: "2026-08-01T00:00:00",
      turns: [{ ...firstAnswer, turn_index: 1 }]
    });
  });

  it("updates the index and asks the personal paper library with citations", async () => {
    const user = userEvent.setup();
    render(<KnowledgePage />);

    expect(
      await screen.findByRole("heading", { name: "论文库问答", level: 1 })
    ).toBeTruthy();
    expect(screen.getByText("1 篇论文需要更新索引")).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "建立或更新索引" })
    );
    await waitFor(() => {
      expect(apiMocks.reindexKnowledge).toHaveBeenCalledTimes(1);
      expect(screen.getByText("已索引 2 篇论文，共 12 个文本块。")).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("向个人论文库提问"), {
      target: { value: "为什么会发生结构衰减？" }
    });
    await user.click(screen.getByRole("button", { name: "检索并回答" }));

    expect(
      await screen.findByRole("heading", { name: "检索结论", level: 2 })
    ).toBeTruthy();
    expect(screen.getByText("证据 1")).toBeTruthy();
    expect(screen.getByRole("link", { name: "P2 layered oxide" })).toBeTruthy();
    expect(screen.getByText(/Results and Discussion/)).toBeTruthy();
    expect(screen.getByText("全文证据")).toBeTruthy();
    expect(
      screen.getByText("Slab gliding causes structural degradation.")
    ).toBeTruthy();
    expect(screen.getByText(/置信度：中/)).toBeTruthy();
    const sourceLink = screen.getByRole("link", {
      name: "打开原文第 4 页"
    });
    expect(sourceLink.getAttribute("href")).toBe("/papers/7?page=4");
    expect(sourceLink.getAttribute("target")).toBe("_blank");
    expect(sourceLink.getAttribute("rel")).toBe("noreferrer noopener");
    await user.click(screen.getByRole("button", { name: "预览证据 1" }));
    const dialog = screen.getByRole("dialog", { name: "原文证据" });
    expect(within(dialog).getByText("Slab gliding causes structural degradation.")).toBeTruthy();
    expect(within(dialog).getByRole("link", { name: "打开原文第 4 页" }).getAttribute("href")).toBe("/papers/7?page=4");
  });

  it("keeps earlier answers and sends them as follow-up history", async () => {
    const user = userEvent.setup();
    apiMocks.askKnowledge
      .mockResolvedValueOnce(firstAnswer)
      .mockResolvedValueOnce({
        ...firstAnswer,
        question: "为什么这能支持上一轮结论？",
        answer_markdown:
          "## 追问结论\n\n因为原位结构证据显示相变。[证据1]"
      });
    render(<KnowledgePage />);

    await user.type(
      screen.getByLabelText("向个人论文库提问"),
      "为什么会发生结构衰减？"
    );
    await user.click(screen.getByRole("button", { name: "检索并回答" }));
    await screen.findByRole("heading", { name: "检索结论", level: 2 });

    const input = screen.getByLabelText("继续追问");
    await user.type(input, "为什么这能支持上一轮结论？");
    await user.click(screen.getByRole("button", { name: "继续追问" }));

    expect(
      await screen.findByRole("heading", { name: "追问结论", level: 2 })
    ).toBeTruthy();
    expect(screen.getByText("为什么会发生结构衰减？")).toBeTruthy();
    expect(screen.getByText("为什么这能支持上一轮结论？")).toBeTruthy();
    expect(apiMocks.askKnowledge).toHaveBeenLastCalledWith(
      "为什么这能支持上一轮结论？",
      6,
      [
        {
          question: firstAnswer.question,
          answer_markdown: firstAnswer.answer_markdown
        }
      ]
    );
  });

  it("only saves a whole conversation after the user explicitly requests it", async () => {
    const user = userEvent.setup();
    render(<KnowledgePage />);
    await user.type(screen.getByLabelText("向个人论文库提问"), firstAnswer.question);
    await user.click(screen.getByRole("button", { name: "检索并回答" }));
    await screen.findByRole("heading", { name: "检索结论", level: 2 });

    expect(apiMocks.saveConversation).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "保存整段会话" }));

    await waitFor(() => {
      expect(apiMocks.saveConversation).toHaveBeenCalledWith([firstAnswer]);
    });
    expect(screen.getByText("会话已保存为只读历史快照。") ).toBeTruthy();
  });
});
