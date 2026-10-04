// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HelpPage from "../app/help/page";
import Library from "../app/library/page";
import PaperDetail from "../app/papers/[id]/page";
import { ConfirmDeleteButton } from "../components/ConfirmDeleteButton";
import { MarkdownContent } from "../components/MarkdownContent";
import { Nav } from "../components/Nav";
import { PaperThoughtLine } from "../components/papers/PaperThoughtLine";
import { normalizeScientificMarkdown } from "../lib/scientificMarkdown";

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  page: null as string | null
}));

const apiMocks = vi.hoisted(() => ({
  papers: vi.fn(),
  paper: vi.fn(),
  deletePaper: vi.fn(),
  visuals: vi.fn(),
  analyzeVisual: vi.fn(),
  askPaperKnowledge: vi.fn(),
  paperGlossary: vi.fn().mockResolvedValue(null),
  generatePaperGlossary: vi.fn(),
  askPaperGlossary: vi.fn(),
  externalComparePaper: vi.fn(),
  paperCrops: vi.fn(),
  savePaperCrop: vi.fn(),
  analyzePaperCrop: vi.fn(),
  extractPaperCropData: vi.fn(),
  transcribeFormula: vi.fn(),
  deletePaperCrop: vi.fn(),
  cropImageUrl: vi.fn(),
  saveConversation: vi.fn(),
  paperFileUrl: vi.fn(),
  pageImageUrl: vi.fn(),
  analyzeReport: vi.fn(),
  saveNote: vi.fn(),
  paperNoteDraft: vi.fn(),
  researchChallenge: vi.fn(),
  documentParsersStatus: vi.fn().mockResolvedValue({ docling: { installed: false, artifacts_available: false, ready: false, version: "", reason: "Docling 本地模型尚未准备" } }),
  paperParseCandidates: vi.fn().mockResolvedValue({ items: [] }),
  createParseCandidate: vi.fn(),
  parseCandidate: vi.fn(),
  parseCandidateComparison: vi.fn(),
  cancelParseCandidate: vi.fn(),
  activateParseCandidate: vi.fn(),
  claims: vi.fn().mockResolvedValue({ items: [] })
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help",
  useParams: () => ({ id: "7" }),
  useRouter: () => ({ push: navigationMocks.push }),
  useSearchParams: () => ({
    get: (name: string) => (name === "page" ? navigationMocks.page : null)
  })
}));

vi.mock("../lib/api", () => ({
  api: apiMocks
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  navigationMocks.page = null;
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("MarkdownContent", () => {
  it("keeps edited notes when explicitly appending a three-question challenge and never auto-saves", async () => {
    apiMocks.paper.mockResolvedValue({
      paper: { id: "7", title: "Research", acquisition_status: "abstract", abstract: "Abstract" },
      analysis: null, note: "已有笔记"
    });
    apiMocks.researchChallenge.mockResolvedValue({
      questions: ["证据复核", "适用边界", "最小验证"],
      criteria: ["回到原文", "写清未知", "可以证伪"], citations: [],
      evidence_status: "固定三问"
    });
    apiMocks.paperNoteDraft.mockResolvedValue({ markdown: "研究挑战草稿" });
    render(<PaperDetail />);
    await screen.findByRole("button", { name: "打开三问挑战" });
    fireEvent.click(screen.getByRole("tab", { name: "我的笔记" }));
    fireEvent.change(screen.getByPlaceholderText("记录问题、想法和待验证的证据…"), {
      target: { value: "已有笔记，尚未保存的编辑" }
    });
    expect(apiMocks.researchChallenge).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "打开三问挑战" }));
    await screen.findByLabelText("1. 证据复核");
    fireEvent.change(screen.getByLabelText("1. 证据复核"), { target: { value: "回答一" } });
    fireEvent.change(screen.getByLabelText("2. 适用边界"), { target: { value: "回答二" } });
    fireEvent.change(screen.getByLabelText("3. 最小验证"), { target: { value: "回答三" } });
    fireEvent.click(screen.getByRole("button", { name: "将三问回答追加到笔记草稿" }));
    await waitFor(() => expect(screen.getByDisplayValue(/尚未保存的编辑.*研究挑战草稿/s)).toBeTruthy());
    expect(apiMocks.saveNote).not.toHaveBeenCalled();
    expect(apiMocks.paperNoteDraft).toHaveBeenCalledWith("7", expect.objectContaining({ kind: "challenge" }));
  });
  it("renders headings, emphasis, lists and GFM tables instead of raw Markdown symbols", () => {
    const markdown = [
      "### 论文核心贡献",
      "",
      "**循环稳定性**得到改善。",
      "",
      "- 原文明示",
      "- AI 归纳",
      "",
      "| 指标 | 数值 |",
      "| --- | --- |",
      "| 容量 | 120 mAh/g |"
    ].join("\n");

    const { container } = render(<MarkdownContent content={markdown} />);

    expect(screen.getByRole("heading", { name: "论文核心贡献", level: 3 })).toBeTruthy();
    expect(screen.getByText("循环稳定性").tagName).toBe("STRONG");
    expect(screen.getByRole("list")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(container.textContent).not.toContain("###");
    expect(container.textContent).not.toContain("**");
  });

  it("does not execute raw HTML and protects external links", () => {
    const { container } = render(
      <MarkdownContent content={'<script>alert("xss")</script>\n\n[查看来源](https://example.com/paper)'} />
    );

    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByRole("link", { name: "查看来源" }).getAttribute("rel")).toBe(
      "noreferrer noopener"
    );
  });

  it("does not render or preload remote Markdown images", () => {
    const { container } = render(
      <MarkdownContent content="![论文图表](https://tracker.example/pixel.png)" />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('link[rel="preload"]')).toBeNull();
    expect(screen.getByText("图片已隐藏：论文图表")).toBeTruthy();
  });

  it("opens only HTTP links in a new tab and removes dangerous protocols", () => {
    const { container } = render(
      <MarkdownContent
        content={[
          "[外部来源](https://example.com/paper)",
          "[外部 HTTP](http://example.com/paper)",
          "[站内帮助](/help)",
          "[页内证据](#evidence)",
          "[危险链接](javascript:alert(1))"
        ].join("\n\n")}
      />
    );

    for (const name of ["外部来源", "外部 HTTP"]) {
      const external = screen.getByRole("link", { name });
      expect(external.getAttribute("target")).toBe("_blank");
      expect(external.getAttribute("rel")).toBe("noreferrer noopener");
    }

    for (const name of ["站内帮助", "页内证据"]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("target")).toBeNull();
      expect(link.getAttribute("rel")).toBeNull();
    }

    const dangerous = screen.getByText("危险链接").closest("a");
    expect(dangerous?.getAttribute("href")).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it("shows a readable placeholder when no analysis content is available", () => {
    render(<MarkdownContent content="   " />);

    expect(screen.getByText("暂无内容。")).toBeTruthy();
  });

  it("renders chemistry and equations with KaTeX while preserving normal code", () => {
    const { container } = render(
      <MarkdownContent
        content={[
          "`H_2O\\,(g) + CO_2\\,(g) \\rightarrow H_2CO_3\\,(aq)`",
          "",
          "TM^{n+} 与 O^{2-}",
          "",
          "\\(Na_xTMO_2\\)",
          "",
          "$$\\frac{1}{2}O_2 + 2e^- \\rightarrow 2OH^-$$",
          "",
          "`npm run build`"
        ].join("\n")}
      />
    );

    expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(5);
    const code = container.querySelectorAll("code");
    expect(code).toHaveLength(1);
    expect(code[0].textContent).toBe("npm run build");
  });

  it("renders unwrapped multi-line LaTex optimization equations as a display formula", () => {
    const content = [
      "\\min_{\\pi^{+}} \\left[",
      "\\sum_{r\\in\\mathcal{R}} c_r\\pi_{r,t}",
      "\\right]",
      "\\tag{1}",
      "",
      "其中："
    ].join("\n");
    const { container } = render(
      <MarkdownContent
        content={content}
      />
    );

    expect(normalizeScientificMarkdown(content)).toContain("$$\n\\min_{\\pi^{+}}");
    expect(container.querySelector(".katex-display .katex-html")).toBeTruthy();
    expect(container.querySelector(".katex-html")?.textContent).not.toContain("\\min_{\\pi^{+}}");
    expect(container.querySelector(".katex-html")?.textContent).not.toContain("\\tag{1}");
    expect(screen.getByText("其中：")).toBeTruthy();
  });

  it("renders an unwrapped aligned equation block as a display formula", () => {
    const { container } = render(
      <MarkdownContent
        content={[
          "\\begin{aligned}",
          "x_t &\\le y_t",
          "\\end{aligned}"
        ].join("\n")}
      />
    );

    expect(container.querySelector(".katex")).toBeTruthy();
    expect(container.querySelector(".katex-html")?.textContent).not.toContain("\\begin{aligned}");
  });

  it("renders an aligned environment embedded after prose without exposing raw Latex", () => {
    const { container } = render(
      <MarkdownContent content={"约束关系如下：\\begin{aligned}x_t &\\le y_t\\\\ z_t &= 1\\end{aligned}，因此变量受限。"} />
    );

    expect(container.querySelector(".katex")).toBeTruthy();
    expect(container.querySelector(".katex-html")?.textContent).not.toContain("\\begin{aligned}");
    expect(container.textContent).toContain("约束关系如下");
    expect(container.textContent).toContain("因此变量受限");
  });

  it("renders tagged rows inside an aligned equation without exposing its source", () => {
    const { container } = render(
      <MarkdownContent
        content={[
          "$$",
          "\\begin{aligned}",
          "\\pi_{r,t}^{+} &\\le \\bar{\\pi}_{r,t}^{+} y_{r,t} + \\gamma_r^{+} z_r, \\quad \\forall r\\in\\mathcal{R}, t\\in\\mathcal{T} \\tag{2a}\\\\",
          "\\pi_{r,t}^{-} &\\le \\bar{\\pi}_{r,t}^{-} y_{r,t} + \\gamma_r^{-} z_r, \\quad \\forall r\\in\\mathcal{R}, t\\in\\mathcal{T} \\tag{2b}",
          "\\end{aligned}",
          "$$"
        ].join("\n")}
      />
    );

    expect(container.querySelector(".katex-display .katex-html")).toBeTruthy();
    expect(container.querySelector(".katex-html")?.textContent).not.toContain("\\begin{aligned}");
    expect(container.querySelector(".katex-html")?.textContent).not.toContain("\\tag{2a}");
  });

  it("does not nest delimiters around an aligned equation that is already display math", () => {
    const content = [
      "$$",
      "\\begin{aligned}",
      "\\pi_{r,t}^{+} &\\le \\bar{\\pi}_{r,t}^{+} y_{r,t} + \\gamma_r^{+} z_r, \\quad \\forall r\\in\\mathcal{R}, t\\in\\mathcal{T} \\tag{2a}\\\\",
      "\\pi_{r,t}^{-} &\\le \\bar{\\pi}_{r,t}^{-} y_{r,t} + \\gamma_r^{-} z_r, \\quad \\forall r\\in\\mathcal{R}, t\\in\\mathcal{T} \\tag{2b}",
      "\\end{aligned}",
      "$$"
    ].join("\\n");

    const normalized = normalizeScientificMarkdown(content);

    expect(normalized).not.toContain("$$$$");
    expect(normalized).toContain("\\text{(2a)}");
    expect(normalized).toContain("\\bar{\\pi}_{r,t}^{+} y_{r,t}");
  });

  it("converts legacy scientific sup and sub tags without enabling raw HTML", () => {
    const { container } = render(
      <MarkdownContent
        content={[
          "Ni<sup>2+</sup>/Ni<sup>4+</sup>，Fe<sup>3+</sup>/Fe<sup>4+</sup>",
          "",
          "O<sup>2-</sup>、H<sub>2</sub>O、SO<sub>4</sub><sup>2-</sup>、e<sup>-</sup>",
          "",
          "Fe(CN)<sub>6</sub><sup>4-</sup>",
          "",
          "<script>alert('still blocked')</script>"
        ].join("\n")}
      />
    );

    expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(9);
    expect(container.textContent).not.toContain("<sup>");
    expect(container.textContent).not.toContain("</sup>");
    expect(container.textContent).not.toContain("<sub>");
    expect(container.textContent).not.toContain("</sub>");
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>");
  });

  it("renders common bare scientific scripts while preserving ordinary code", () => {
    const { container } = render(
      <MarkdownContent
        content={[
          "PO_4、R_ct、V_x、z_i",
          "",
          "Ni^2+/Ni^4+ 与 O^2-",
          "",
          "`file_name`"
        ].join("\n")}
      />
    );

    expect(container.querySelectorAll(".katex").length).toBeGreaterThanOrEqual(7);
    const visibleMath = Array.from(container.querySelectorAll(".katex-html"))
      .map(node => node.textContent)
      .join(" ");
    expect(visibleMath).not.toContain("PO_4");
    expect(visibleMath).not.toContain("Ni^2+");
    expect(container.querySelector("code")?.textContent).toBe("file_name");
  });

  it("keeps malformed scientific text visible instead of crashing", () => {
    const { container } = render(
      <MarkdownContent content={"未闭合公式 $\\frac{1}{$ 仍需人工检查"} />
    );

    expect(container.textContent).toContain("仍需人工检查");
    expect(container.textContent).toContain("未闭合公式");
  });
});

describe("HelpPage", () => {
  it("covers the complete local research workflow and common safety questions", () => {
    render(<HelpPage />);

    expect(screen.getByRole("heading", { name: "帮助中心", level: 1 })).toBeTruthy();
    for (const name of [
      "第一次使用",
      "PDF 上传与论文解析",
      "论文搜索与入库",
      "PDF 阅读方式",
      "全文、摘要与元数据的区别",
      "图表解读",
      "证据状态怎么看",
      "选择模型供应商与视觉模型",
      "费用与预算",
      "API 密钥与隐私",
      "删除、备份与恢复",
      "连接诊断",
      "当前尚未实现的功能"
    ]) {
      expect(screen.getByRole("heading", { name, level: 2 })).toBeTruthy();
    }
    expect(screen.getByRole("heading", { name: "常见问题", level: 2 })).toBeTruthy();
    expect(screen.getByRole("link", { name: "上传第一篇论文" }).getAttribute("href")).toBe(
      "/upload"
    );
    expect(screen.getByText("系统会自动绕过付费墙吗？")).toBeTruthy();
  });
});

describe("Nav", () => {
  it("provides a highlighted Help entry", () => {
    render(<Nav />);

    const helpLink = screen.getByRole("link", { name: "帮助" });
    expect(helpLink.getAttribute("href")).toBe("/help");
    expect(helpLink.classList.contains("active")).toBe(true);
    expect(helpLink.getAttribute("aria-current")).toBe("page");
  });

  it("shows Viyao in the sidebar and restores the saved theme", async () => {
    localStorage.setItem("energy-copilot-theme", "dark");
    render(<Nav />);

    expect(screen.getByText("Viyao").classList.contains("app-sidebar-user-name")).toBe(true);
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
  });
});

describe("ConfirmDeleteButton", () => {
  it("requires the complete paper title before permanent deletion", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    apiMocks.deletePaper.mockResolvedValue({
      deleted: true,
      paper_id: 7,
      file_deleted: true,
      warning: null
    });
    render(
      <ConfirmDeleteButton
        paperId="7"
        paperTitle="P2 型层状氧化物研究"
        onDeleted={onDeleted}
      />
    );

    await user.click(screen.getByRole("button", { name: "删除论文" }));
    const confirmButton = screen.getByRole("button", { name: "永久删除" });
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);

    await user.type(
      screen.getByLabelText("输入完整论文标题以确认永久删除"),
      "P2 型层状氧化物研究"
    );
    expect((confirmButton as HTMLButtonElement).disabled).toBe(false);
    await user.click(confirmButton);

    await waitFor(() => {
      expect(apiMocks.deletePaper).toHaveBeenCalledWith(
        "7",
        "P2 型层状氧化物研究"
      );
      expect(onDeleted).toHaveBeenCalledWith({
        deleted: true,
        paper_id: 7,
        file_deleted: true,
        warning: null
      });
    });
  });

  it("locks both actions while deletion is pending and completes after resolution", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    const result = {
      deleted: true,
      paper_id: 7,
      file_deleted: true,
      warning: null
    };
    let resolveDelete!: (value: typeof result) => void;
    apiMocks.deletePaper.mockReturnValue(
      new Promise(resolve => {
        resolveDelete = resolve;
      })
    );
    render(
      <ConfirmDeleteButton
        paperId="7"
        paperTitle="请求中锁定按钮"
        onDeleted={onDeleted}
      />
    );

    await user.click(screen.getByRole("button", { name: "删除论文" }));
    await user.type(
      screen.getByLabelText("输入完整论文标题以确认永久删除"),
      "请求中锁定按钮"
    );
    await user.click(screen.getByRole("button", { name: "永久删除" }));

    await waitFor(() => {
      expect(apiMocks.deletePaper).toHaveBeenCalledWith(
        "7",
        "请求中锁定按钮"
      );
    });
    expect(
      (screen.getByRole("button", { name: "正在删除…" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "取消" }) as HTMLButtonElement).disabled
    ).toBe(true);

    await act(async () => {
      resolveDelete(result);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledWith(result);
      expect(
        (screen.getByRole("button", { name: "删除论文" }) as HTMLButtonElement)
          .disabled
      ).toBe(false);
    });
  });
});

describe("paper deletion pages", () => {
  it("removes a deleted paper from the library list", async () => {
    const user = userEvent.setup();
    apiMocks.papers.mockResolvedValue({
      items: [{ id: "7", title: "待删除论文" }],
      total: 1,
      page: 1,
      page_size: 20
    });
    apiMocks.deletePaper.mockResolvedValue({
      deleted: true,
      paper_id: 7,
      file_deleted: true,
      warning: null
    });

    render(<Library />);
    expect(await screen.findByRole("link", { name: "待删除论文" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "删除论文" }));
    await user.type(
      screen.getByLabelText("输入完整论文标题以确认永久删除"),
      "待删除论文"
    );
    await user.click(screen.getByRole("button", { name: "永久删除" }));

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "待删除论文" })).toBeNull();
    });
  });

  it("returns to the library after deleting from the paper detail page", async () => {
    const user = userEvent.setup();
    apiMocks.paper.mockResolvedValue({
      paper: { id: "7", title: "详情页论文", extracted_text: "text" },
      analysis: null,
      note: ""
    });
    apiMocks.deletePaper.mockResolvedValue({
      deleted: true,
      paper_id: 7,
      file_deleted: true,
      warning: null
    });

    render(<PaperDetail />);
    expect(
      await screen.findByRole("heading", { name: "详情页论文", level: 1 })
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "删除论文" }));
    await user.type(
      screen.getByLabelText("输入完整论文标题以确认永久删除"),
      "详情页论文"
    );
    await user.click(screen.getByRole("button", { name: "永久删除" }));

    await waitFor(() => {
      expect(navigationMocks.push).toHaveBeenCalledWith("/library");
    });
  });
});

describe("paper PDF workspace", () => {
  it("regenerates only the active independent understanding report", async () => {
    const user = userEvent.setup();
    apiMocks.paper.mockResolvedValue({
      paper: {
        id: "7",
        title: "Reviewer reading paper",
        file_hash: null,
        acquisition_status: "abstract",
        page_count: 0,
        extracted_text: ""
      },
      analysis: {
        quick_understanding: "快速内容",
        quick_prompt_version: "quick-understanding-v2",
        quick_schema_version: "quick-understanding-schema-v2",
        quick_evidence_status: "快速证据",
        layman_understanding: "通俗内容",
        layman_prompt_version: "layman-understanding-v2",
        layman_schema_version: "layman-understanding-schema-v2",
        layman_evidence_status: "教学证据",
        reviewer_analysis: "审稿内容",
        reviewer_prompt_version: "reviewer-analysis-v2",
        reviewer_schema_version: "reviewer-analysis-schema-v2",
        reviewer_evidence_status: "审稿证据"
      },
      note: ""
    });
    apiMocks.analyzeReport.mockResolvedValue({
      report_type: "reviewer_analysis",
      reviewer_analysis: "新版独立审稿报告，结尾完整。",
      prompt_version: "reviewer-analysis-v2",
      schema_version: "reviewer-analysis-schema-v2",
      evidence_status: "AI归纳（待原文证据核验）"
    });

    render(<PaperDetail />);
    await screen.findByRole("heading", { name: "Reviewer reading paper", level: 1 });

    for (const label of ["快速理解", "通俗理解", "审稿人速解", "证据核验"]) {
      expect(screen.getByRole("tab", { name: label })).toBeTruthy();
    }
    expect(screen.queryByRole("tab", { name: "三十秒总结" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "通俗讲解" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "深度分析" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "结论—证据" })).toBeNull();
    expect(screen.getByText("快速内容")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "通俗理解" }));
    expect(screen.getByText("通俗内容")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "审稿人速解" }));
    expect(screen.getByText("审稿内容")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "重新生成审稿人速解" }));
    await waitFor(() => expect(apiMocks.analyzeReport).toHaveBeenCalledWith("7", "reviewer_analysis"));
    expect(screen.getByText("新版独立审稿报告，结尾完整。")) .toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "快速理解" }));
    expect(screen.getByText("快速内容")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "通俗理解" }));
    expect(screen.getByText("通俗内容")).toBeTruthy();
  });

  it("uses a requested PDF page instead of the first visual page", async () => {
    navigationMocks.page = "4";
    apiMocks.paper.mockResolvedValue({
      paper: {
        id: "7",
        title: "Located evidence paper",
        file_hash: "abc123",
        acquisition_status: "fulltext",
        page_count: 8,
        extracted_text: "Figure 1"
      },
      analysis: null,
      note: ""
    });
    apiMocks.visuals.mockResolvedValue([
      {
        id: 11,
        paper_id: 7,
        page_number: 2,
        kind: "figure",
        label: "Figure 1",
        caption: "Figure 1. Crystal structure.",
        analysis_markdown: "",
        evidence_status: "",
        provider: "",
        model_name: ""
      }
    ]);
    apiMocks.paperFileUrl.mockReturnValue(
      "/backend-api/api/v1/papers/7/file"
    );
    apiMocks.pageImageUrl.mockReturnValue(
      "/backend-api/api/v1/papers/7/pages/2/image"
    );

    render(<PaperDetail />);

    const reader = await screen.findByTitle("PDF 阅读器");
    expect(await screen.findByText("第 4 / 8 页")).toBeTruthy();
    expect(reader.getAttribute("src")).toContain("#page=4");
  });

  it("shows the local PDF, visual navigation and selected page preview", async () => {
    const user = userEvent.setup();
    apiMocks.paper.mockResolvedValue({
      paper: {
        id: "7",
        title: "P2 layered oxide",
        file_hash: "abc123",
        acquisition_status: "fulltext",
        page_count: 2,
        extracted_text: "Figure 1 and Table 2"
      },
      analysis: null,
      note: ""
    });
    apiMocks.visuals.mockResolvedValue([
      {
        id: 11,
        paper_id: 7,
        page_number: 1,
        kind: "figure",
        label: "Figure 1",
        caption: "Figure 1. Crystal structure.",
        analysis_markdown: "",
        evidence_status: "",
        provider: "",
        model_name: ""
      },
      {
        id: 12,
        paper_id: 7,
        page_number: 2,
        kind: "table",
        label: "Table 2",
        caption: "Table 2. Test conditions.",
        analysis_markdown: "",
        evidence_status: "",
        provider: "",
        model_name: ""
      }
    ]);
    apiMocks.paperFileUrl.mockReturnValue(
      "/backend-api/api/v1/papers/7/file"
    );
    apiMocks.pageImageUrl.mockImplementation(
      (_id: string, page: number) =>
        `/backend-api/api/v1/papers/7/pages/${page}/image`
    );

    render(<PaperDetail />);

    const reader = await screen.findByTitle("PDF 阅读器");
    expect(reader.getAttribute("src")).toContain(
      "/backend-api/api/v1/papers/7/file#page=1"
    );
    expect(
      screen.getByRole("heading", { name: "图表导航", level: 2 })
    ).toBeTruthy();
    expect(await screen.findByRole("button", { name: /Figure 1/ })).toBeTruthy();
    const preview = screen.getByAltText("第 1 页预览");
    expect(preview.getAttribute("src")).toContain("/pages/1/image");

    await user.click(screen.getByRole("button", { name: /Table 2/ }));

    await waitFor(() => {
      const nextPreview = screen.getByAltText("第 2 页预览");
      expect(nextPreview.getAttribute("src")).toContain("/pages/2/image");
      expect(reader.getAttribute("src")).toContain("/file#page=2");
    });
  });

  it("explains the metadata-only fallback without showing an empty reader", async () => {
    apiMocks.paper.mockResolvedValue({
      paper: {
        id: "7",
        title: "Metadata-only paper",
        file_hash: null,
        acquisition_status: "metadata_only",
        extracted_text: "",
        abstract: "Only an abstract is available."
      },
      analysis: null,
      note: ""
    });

    render(<PaperDetail />);

    expect(
      await screen.findByText("当前仅有摘要或元数据")
    ).toBeTruthy();
    expect(screen.queryByTitle("PDF 阅读器")).toBeNull();
    expect(apiMocks.visuals).not.toHaveBeenCalled();
  });

  it("reanalyzes a saved visual page on demand and renders the new Markdown", async () => {
    const user = userEvent.setup();
    const visual = {
      id: 11,
      paper_id: 7,
      page_number: 1,
      kind: "figure",
      label: "Figure 1",
      caption: "Figure 1. Crystal structure.",
      analysis_markdown: "## 旧分析\n\n旧的英文结果。",
      evidence_status: "AI归纳（待核验）",
      provider: "ollama",
      model_name: "qwen2.5vl:3b"
    };
    apiMocks.paper.mockResolvedValue({
      paper: {
        id: "7",
        title: "Visual paper",
        file_hash: "abc123",
        acquisition_status: "fulltext",
        page_count: 1,
        extracted_text: "Figure 1"
      },
      analysis: null,
      note: ""
    });
    apiMocks.visuals.mockResolvedValue([visual]);
    apiMocks.paperFileUrl.mockReturnValue(
      "/backend-api/api/v1/papers/7/file"
    );
    apiMocks.pageImageUrl.mockReturnValue(
      "/backend-api/api/v1/papers/7/pages/1/image"
    );
    apiMocks.analyzeVisual.mockResolvedValue({
      ...visual,
      analysis_markdown: "## 图表结论\n\n**结构变化**需要结合原文核验。",
      evidence_status: "AI推断（Mock 图像演示）",
      provider: "mock",
      model_name: "mock-research-copilot"
    });

    render(<PaperDetail />);
    await screen.findByRole("button", { name: /Figure 1/ });
    await user.click(screen.getByRole("tab", { name: "图表解读" }));
    expect(
      screen.getByText(/只有点击下方按钮时/)
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "重新分析这一页" }));

    await waitFor(() => {
      expect(apiMocks.analyzeVisual).toHaveBeenCalledWith("7", 11);
      expect(
        screen.getByRole("heading", { name: "图表结论", level: 2 })
      ).toBeTruthy();
    });
    expect(screen.queryByText("## 图表结论")).toBeNull();
    expect(screen.getByText("AI推断（Mock 图像演示）")).toBeTruthy();
  });

  it("asks follow-up questions through the current paper endpoint", async () => {
    const user = userEvent.setup();
    apiMocks.paper.mockResolvedValue({
      paper: {
        id: "7",
        title: "Single paper",
        file_hash: "abc123",
        acquisition_status: "fulltext",
        page_count: 1,
        extracted_text: "Figure 1"
      },
      analysis: null,
      note: ""
    });
    apiMocks.visuals.mockResolvedValue([]);
    apiMocks.askPaperKnowledge.mockResolvedValue({
      question: "这篇论文的结论是什么？",
      answer_markdown: "仅基于本篇论文。[证据1]",
      citations: [],
      evidence_status: "AI推断（Mock 演示）",
      confidence: { level: "中", explanation: "本篇证据" },
      provider: "mock",
      model_name: "mock"
    });
    apiMocks.saveConversation.mockResolvedValue({ id: 3 });

    render(<PaperDetail />);
    await screen.findByRole("heading", { name: /Single\s*paper/, level: 1 });
    await user.type(
      screen.getByLabelText("基于本篇论文追问"),
      "这篇论文的结论是什么？"
    );
    await user.click(screen.getByRole("button", { name: "基于本篇追问" }));

    await waitFor(() => {
      expect(apiMocks.askPaperKnowledge).toHaveBeenCalledWith(
        "7",
        "这篇论文的结论是什么？",
        6,
        []
      );
    });
    expect(screen.getByText("仅基于本篇论文。[证据1]")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "保存本篇会话" }));
    expect(apiMocks.saveConversation).toHaveBeenCalledWith(
      [expect.objectContaining({ question: "这篇论文的结论是什么？" })],
      7
    );
  });

  it("loads saved glossary without generating and only explicitly regenerates", async () => {
    apiMocks.paper.mockResolvedValue({ paper: { id: "7", title: "Saved glossary", acquisition_status: "abstract" }, analysis: null, note: "" });
    apiMocks.paperGlossary.mockResolvedValueOnce({ terms: [{ term: "XRD", explanation: "Saved explanation" }], evidence_status: "saved", provider: "mock", model_name: "mock" });
    apiMocks.generatePaperGlossary.mockRejectedValueOnce(new Error("controlled failure"));
    const user = userEvent.setup();
    render(<PaperDetail />);
    await screen.findByRole("heading", { name: /Saved\s*glossary/, level: 1 });
    await user.click(screen.getByRole("tab", { name: "名词解释" }));
    expect(await screen.findByText("Saved explanation")).toBeTruthy();
    expect(apiMocks.generatePaperGlossary).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "重新生成术语" }));
    await waitFor(() => expect(apiMocks.generatePaperGlossary).toHaveBeenCalledWith("7", expect.any(AbortSignal), true));
    expect(screen.getByText("Saved explanation")).toBeTruthy();
  });

  it("generates glossary terms only on click and keeps a concise concept conversation across tabs", async () => {
    apiMocks.paper.mockResolvedValue({ paper: { id: "7", title: "Glossary paper", acquisition_status: "abstract", abstract: "Solid electrolyte" }, analysis: null, note: "" });
    apiMocks.generatePaperGlossary.mockResolvedValue({ terms: [{ term: "固态电解质", explanation: "在固态中传导离子的材料。" }], evidence_status: "摘要术语 · 通用知识解释", provider: "mock", model_name: "mock" });
    apiMocks.askPaperGlossary.mockResolvedValueOnce({ question: "它有什么作用？", answer: "帮助离子在电极之间迁移。", evidence_status: "通用知识", provider: "mock", model_name: "mock" }).mockResolvedValueOnce({ question: "再解释一下？", answer: "它是电池中的离子通道。", evidence_status: "通用知识", provider: "mock", model_name: "mock" });
    const user = userEvent.setup();
    render(<PaperDetail />);
    await screen.findByRole("heading", { name: /Glossary\s*paper/, level: 1 });
    await user.click(screen.getByRole("tab", { name: "名词解释" }));
    expect(apiMocks.generatePaperGlossary).not.toHaveBeenCalled();
    expect(apiMocks.askPaperGlossary).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "生成本篇重点术语" }));
    expect(await screen.findByText("在固态中传导离子的材料。")).toBeTruthy();
    const input = screen.getByLabelText("概念提问");
    await user.type(input, "它有什么作用？");
    await user.click(screen.getByRole("button", { name: "发送概念问题" }));
    expect(await screen.findByText("帮助离子在电极之间迁移。")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "快速理解" }));
    await user.click(screen.getByRole("tab", { name: "名词解释" }));
    expect(screen.getByText("在固态中传导离子的材料。")).toBeTruthy();
    await user.type(screen.getByLabelText("概念提问"), "再解释一下？");
    await user.click(screen.getByRole("button", { name: "发送概念问题" }));
    await waitFor(() => expect(apiMocks.askPaperGlossary).toHaveBeenLastCalledWith("7", "再解释一下？", [{ question: "它有什么作用？", answer: "帮助离子在电极之间迁移。" }], expect.any(AbortSignal)));
  });

  it("hides research challenge and external comparison only on the glossary tab", async () => {
    apiMocks.paper.mockResolvedValue({ paper: { id: "7", title: "Glossary tools", acquisition_status: "abstract", abstract: "Abstract" }, analysis: null, note: "" });
    const user = userEvent.setup();
    render(<PaperDetail />);
    await screen.findByRole("heading", { name: /Glossary\s*tools/, level: 1 });
    expect(screen.getByRole("heading", { name: "轻量研究挑战" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "外部来源比较问答" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "名词解释" }));
    expect(screen.queryByRole("heading", { name: "轻量研究挑战" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "外部来源比较问答" })).toBeNull();
    expect(screen.getByRole("heading", { name: "基于本篇论文追问" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "快速理解" }));
    expect(screen.getByRole("heading", { name: "轻量研究挑战" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "外部来源比较问答" })).toBeTruthy();
  });

  it("preserves a failed glossary draft and discards an answer after stop", async () => {
    apiMocks.paper.mockResolvedValue({ paper: { id: "7", title: "Glossary stop", acquisition_status: "abstract", abstract: "Abstract" }, analysis: null, note: "" });
    apiMocks.askPaperGlossary.mockRejectedValueOnce(new Error("模型暂不可用"));
    const user = userEvent.setup();
    render(<PaperDetail />);
    await screen.findByRole("heading", { name: /Glossary\s*stop/, level: 1 });
    await user.click(screen.getByRole("tab", { name: "名词解释" }));
    const input = screen.getByLabelText("概念提问") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "什么是固态电解质？" } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(apiMocks.askPaperGlossary).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", shiftKey: true });
    expect(apiMocks.askPaperGlossary).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect((await screen.findByRole("alert", { name: "名词解释错误" })).textContent).toContain("模型暂不可用");
    expect(input.value).toBe("什么是固态电解质？");
    let finishAsk!: (answer: unknown) => void;
    apiMocks.askPaperGlossary.mockReturnValueOnce(new Promise(resolve => { finishAsk = resolve; }));
    await user.click(screen.getByRole("button", { name: "发送概念问题" }));
    await user.click(screen.getByRole("button", { name: "停止等待" }));
    await act(async () => finishAsk({ question: "什么是固态电解质？", answer: "迟到回答", evidence_status: "通用知识", provider: "mock", model_name: "mock" }));
    expect(screen.queryByText("迟到回答")).toBeNull();
    expect(input.value).toBe("什么是固态电解质？");
  });

  it("paper prompt stays busy only for its request and saving does not restart ThoughtLine", async () => {
    let finishAsk!: (answer: unknown) => void;
    let finishSave!: (result: unknown) => void;
    apiMocks.paper.mockResolvedValue({ paper: { id: "7", title: "Paper prompt", acquisition_status: "fulltext", page_count: 1 }, analysis: null, note: "" });
    apiMocks.visuals.mockResolvedValue([]);
    apiMocks.askPaperKnowledge.mockReturnValue(new Promise(resolve => { finishAsk = resolve; }));
    apiMocks.saveConversation.mockReturnValue(new Promise(resolve => { finishSave = resolve; }));
    const user = userEvent.setup();
    render(<PaperDetail />);
    const input = await screen.findByLabelText("基于本篇论文追问");
    await user.type(input, "这篇论文的核心结论？");
    await user.click(screen.getByRole("button", { name: "基于本篇追问" }));
    expect(screen.getByRole("button", { name: "正在追问，请稍候" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("status", { name: "本篇追问状态" }).textContent).toContain("正在基于本篇论文");
    fireEvent.submit(input.closest("form")!);
    expect(apiMocks.askPaperKnowledge).toHaveBeenCalledTimes(1);
    await act(async () => finishAsk({ question: "这篇论文的核心结论？", answer_markdown: "本篇回答", citations: [], evidence_status: "全文证据", confidence: { level: "中" } }));
    expect(await screen.findByText("本篇回答")).toBeTruthy();
    expect(screen.getByRole("status", { name: "本篇追问状态" }).textContent).toContain("回答已生成");
    expect((input as HTMLTextAreaElement).value).toBe("");
    await user.click(screen.getByRole("button", { name: "保存本篇会话" }));
    expect(screen.getByRole("button", { name: "正在保存本篇会话…" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("status", { name: "本篇追问状态" }).textContent).not.toContain("正在基于本篇论文");
    await act(async () => finishSave({ id: 1 }));
  });

  it("paper prompt timer updates locally and hides live ticks from announcements", async () => {
    const clearIntervalSpy = vi.spyOn(window, "clearInterval");
    const startedAt = performance.now();
    const { rerender } = render(<PaperThoughtLine working startedAt={startedAt} elapsedMs={0} />);
    const timer = document.querySelector(".paper-thought-line__time");
    expect(timer?.getAttribute("aria-hidden")).toBe("true");
    await waitFor(() => expect(Number.parseFloat(timer?.textContent || "0")).toBeGreaterThanOrEqual(0.2), { timeout: 1200 });
    rerender(<PaperThoughtLine working={false} startedAt={startedAt} elapsedMs={370} />);
    expect(timer?.textContent).toBe("0.4 秒");
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it("paper prompt keeps the draft and shows an error without a completion line", async () => {
    apiMocks.paper.mockResolvedValue({ paper: { id: "7", title: "Paper error", acquisition_status: "fulltext", page_count: 1 }, analysis: null, note: "" });
    apiMocks.visuals.mockResolvedValue([]);
    apiMocks.askPaperKnowledge.mockRejectedValue(new Error("请求暂不可用"));
    const user = userEvent.setup();
    render(<PaperDetail />);
    const input = await screen.findByLabelText("基于本篇论文追问");
    fireEvent.change(input, { target: { value: "证据在哪里？" } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(apiMocks.askPaperKnowledge).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", shiftKey: true });
    expect(apiMocks.askPaperKnowledge).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect((await screen.findByRole("alert", { name: "本篇追问错误" })).textContent).toContain("请求暂不可用");
    expect((input as HTMLTextAreaElement).value).toBe("证据在哪里？");
    expect(screen.queryByText(/回答已生成/)).toBeNull();
  });

  it("opens a Q&A citation on the page image and draws its evidence box", async () => {
    const user = userEvent.setup();
    apiMocks.paper.mockResolvedValue({
      paper: { id: "7", title: "Located answer", file_hash: "abc", acquisition_status: "fulltext", page_count: 3, extracted_text: "evidence" },
      analysis: null,
      note: ""
    });
    apiMocks.visuals.mockResolvedValue([]);
    apiMocks.pageImageUrl.mockImplementation((_id: string, page: number) => `/pages/${page}/image`);
    apiMocks.askPaperKnowledge.mockResolvedValue({
      question: "证据在哪里？",
      answer_markdown: "见证据。[证据1]",
      citations: [{
        citation_id: 1, paper_id: 7, paper_title: "Located answer", page_number: 2,
        section: "Results", excerpt: "evidence", source_scope: "fulltext",
        parse_confidence: 1, similarity: 0.9,
        source_locations: [{ page_number: 2, element_id: "docling-2-1", bbox: { left: 60, top: 80, right: 300, bottom: 200 }, coord_origin: "TOPLEFT", page_width: 600, page_height: 800 }]
      }],
      evidence_status: "全文证据",
      confidence: { level: "高", explanation: "已定位" }, provider: "mock", model_name: "mock"
    });

    render(<PaperDetail />);
    await user.type(await screen.findByLabelText("基于本篇论文追问"), "证据在哪里？");
    await user.click(screen.getByRole("button", { name: "基于本篇追问" }));
    await user.click(await screen.findByRole("button", { name: "证据 1 · 第 2 页" }));

    expect(screen.getByAltText("第 2 页预览")).toBeTruthy();
    expect(screen.getByLabelText("证据区域")).toBeTruthy();
    expect(screen.getByText("已定位第 2 页证据区域。")).toBeTruthy();
  });

  it("requires comparison before showing the Docling activation action", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    apiMocks.paper.mockResolvedValue({
      paper: { id: "7", title: "Candidate UI", file_hash: "abc", acquisition_status: "fulltext", page_count: 1, extracted_text: "old" },
      analysis: null,
      note: ""
    });
    apiMocks.visuals.mockResolvedValue([]);
    apiMocks.documentParsersStatus.mockResolvedValue({ docling: { installed: true, artifacts_available: true, ready: true, version: "2.123.1", reason: "" } });
    const candidate = { id: 5, paper_id: 7, version_number: 1, mode: "candidate", status: "completed", engine: "docling", engine_version: "2.123.1", device: "local", progress: 1, quality_score: 1, warnings: [], error_message: "", pages: [] };
    apiMocks.createParseCandidate.mockResolvedValue(candidate);
    apiMocks.parseCandidateComparison.mockResolvedValue({ run_id: 5, active: { engine: "current", characters: 3, pages: 1, tables: 0, formulas: 0, figures: 0, warnings: [] }, candidate: { engine: "docling", characters: 8, pages: 1, tables: 0, formulas: 0, figures: 0, warnings: [] } });
    apiMocks.activateParseCandidate.mockResolvedValue(candidate);

    render(<PaperDetail />);
    await user.click(await screen.findByRole("button", { name: "运行实验解析" }));
    expect(screen.queryByRole("button", { name: "确认启用这个候选" })).toBeNull();
    await user.click(await screen.findByRole("button", { name: "查看对比" }));
    await user.click(await screen.findByRole("button", { name: "确认启用这个候选" }));

    expect(apiMocks.createParseCandidate).toHaveBeenCalledWith("7");
    expect(apiMocks.parseCandidateComparison).toHaveBeenCalledWith(5);
    expect(apiMocks.activateParseCandidate).toHaveBeenCalledWith(5);
  });

  it("compares the current paper with clearly labelled external abstracts", async () => {
    const user = userEvent.setup();
    apiMocks.paper.mockResolvedValue({
      paper: { id: "7", title: "Single paper", file_hash: "abc123", acquisition_status: "fulltext", page_count: 1, extracted_text: "Figure 1" },
      analysis: null,
      note: ""
    });
    apiMocks.visuals.mockResolvedValue([]);
    apiMocks.externalComparePaper.mockResolvedValue({
      question: "外部研究如何比较循环稳定性？",
      current_paper: { paper_id: 7, title: "Single paper", evidence_basis: "当前论文全文线索" },
      external_papers: [{ source: "openalex", external_id: "W1", title: "External paper", authors: ["A"], abstract: "External abstract", landing_url: "https://example.test", evidence_basis: "外部来源摘要/元数据，待原文核验" }],
      answer_markdown: "## 比较回答\n\n外部摘要仅供核验。",
      evidence_status: "AI推断（Mock 演示）",
      provider: "mock",
      model_name: "mock"
    });

    render(<PaperDetail />);
    await screen.findByRole("heading", { name: "Single paper", level: 1 });
    await user.type(screen.getByLabelText("外部来源比较问答"), "外部研究如何比较循环稳定性？");
    await user.click(screen.getByRole("button", { name: "查询外部来源并比较" }));

    await waitFor(() => {
      expect(apiMocks.externalComparePaper).toHaveBeenCalledWith("7", "外部研究如何比较循环稳定性？");
    });
    expect(screen.getByText("外部来源摘要/元数据，待原文核验")).toBeTruthy();
    expect(screen.getByText("外部摘要仅供核验。")).toBeTruthy();
  });

  it("transcribes a saved formula only on demand and appends without saving over notes", async () => {
    const user = userEvent.setup();
    apiMocks.paper.mockResolvedValue({ paper: { id: "7", title: "Formula paper", file_hash: "abc", acquisition_status: "fulltext", page_count: 1, extracted_text: "formula" }, analysis: null, note: "原有笔记" });
    apiMocks.visuals.mockResolvedValue([{ id: 11, paper_id: 7, page_number: 1, kind: "figure", label: "Figure 1", caption: "test" }]);
    apiMocks.paperCrops.mockResolvedValue([{ id: 21, paper_id: 7, visual_id: 11, page_number: 1, left: 0.1, top: 0.1, width: 0.3, height: 0.2 }]);
    apiMocks.transcribeFormula.mockResolvedValue({ crop_id: 21, paper_id: 7, page_number: 1, latex: String.raw`Q=\frac{It}{m}`, evidence_status: "AI转写（本地实验，未经人工核验）", model_name: "CodeFormulaV2" });
    render(<PaperDetail />);
    await user.click(await screen.findByRole("tab", { name: "我的笔记" }));
    fireEvent.change(screen.getByDisplayValue("原有笔记"), { target: { value: "未保存编辑" } });
    await user.click(screen.getByRole("tab", { name: "图表解读" }));
    expect(apiMocks.transcribeFormula).not.toHaveBeenCalled();
    await user.click(await screen.findByRole("button", { name: "本地公式转写（实验）" }));
    await user.click(await screen.findByRole("button", { name: "追加公式到笔记草稿" }));
    expect(apiMocks.transcribeFormula).toHaveBeenCalledWith(21);
    expect(screen.getByDisplayValue(/未保存编辑.*公式转写.*原文第 1 页/s)).toBeTruthy();
    expect(apiMocks.saveNote).not.toHaveBeenCalled();
  });

  it("saves a dragged crop before allowing on-demand crop analysis", async () => {
    const user = userEvent.setup();
    const visual = {
      id: 11, paper_id: 7, page_number: 1, kind: "figure" as const,
      label: "Figure 1", caption: "Figure 1. Cycling curves.",
      analysis_markdown: "", evidence_status: "", provider: "", model_name: ""
    };
    apiMocks.paper.mockResolvedValue({
      paper: { id: "7", title: "Crop paper", file_hash: "abc", acquisition_status: "fulltext", page_count: 1, extracted_text: "Figure 1" },
      analysis: null, note: ""
    });
    apiMocks.visuals.mockResolvedValue([visual]);
    apiMocks.paperCrops.mockResolvedValue([]);
    apiMocks.savePaperCrop.mockResolvedValue({
      id: 21, paper_id: 7, visual_id: 11, page_number: 1,
      left: 0.1, top: 0.1, width: 0.4, height: 0.3, label: "",
      analysis_markdown: "", evidence_status: "", provider: "", model_name: ""
    });
    apiMocks.cropImageUrl.mockReturnValue("/backend-api/api/v1/crops/21/image");
    apiMocks.analyzePaperCrop.mockResolvedValue({
      id: 21, paper_id: 7, visual_id: 11, page_number: 1,
      left: 0.1, top: 0.1, width: 0.4, height: 0.3, label: "",
      analysis_markdown: "## 裁切分析\n\n仅发送该区域。",
      evidence_status: "AI推断（Mock 图像演示）", provider: "mock", model_name: "mock"
    });
    apiMocks.extractPaperCropData.mockResolvedValue({
      id: 21, paper_id: 7, visual_id: 11, page_number: 1,
      left: 0.1, top: 0.1, width: 0.4, height: 0.3, label: "",
      analysis_markdown: "", structured_data: {
        chart_type: "line", x_axis: { label: "Cycle", unit: "" }, y_axis: { label: "Capacity", unit: "mAh g^-1" }, series: [], limitations: ["需要人工核对"]
      }, evidence_status: "AI推断（Mock 演示）", provider: "mock", model_name: "mock"
    });

    render(<PaperDetail />);
    await user.click(await screen.findByRole("tab", { name: "图表解读" }));
    const selector = screen.getByLabelText("图表裁切框选区");
    Object.defineProperty(selector, "getBoundingClientRect", {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 })
    });
    fireEvent.pointerDown(selector, { clientX: 10, clientY: 10 });
    fireEvent.pointerMove(selector, { clientX: 50, clientY: 40 });
    fireEvent.pointerUp(selector, { clientX: 50, clientY: 40 });
    await user.click(screen.getByRole("button", { name: "保存框选区域" }));

    await waitFor(() => {
      expect(apiMocks.savePaperCrop).toHaveBeenCalledWith(
        "7", 11, expect.objectContaining({ left: 0.1, top: 0.1, width: 0.4, height: 0.3 })
      );
    });
    await user.click(screen.getByRole("button", { name: "分析该裁切区域" }));
    expect(apiMocks.analyzePaperCrop).toHaveBeenCalledWith(21);

    await user.click(screen.getByRole("button", { name: "提取结构化数据" }));
    expect(apiMocks.extractPaperCropData).toHaveBeenCalledWith(21);
    expect(screen.getByText(/纵轴：Capacity/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "删除裁切区域" }));
    expect(apiMocks.deletePaperCrop).toHaveBeenCalledWith("7", 11, 21);
  });
});
