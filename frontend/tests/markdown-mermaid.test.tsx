// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownContent } from "../components/MarkdownContent";
import { MermaidBlock } from "../components/MermaidBlock";
import { normalizeMermaidChemicalLabels, normalizeScientificMarkdown, stripMermaidPageReferences, stripPaperEvidenceAnnotations } from "../lib/scientificMarkdown";

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: mermaidMock.initialize,
    render: mermaidMock.render,
  },
}));

afterEach(() => {
  cleanup();
  mermaidMock.initialize.mockClear();
  mermaidMock.render.mockClear();
});

describe("MarkdownContent mermaid diagrams", () => {
  it("normalizes chemical labels while preserving phases, node IDs, units and mathematics", () => {
    const source = 'flowchart LR\nNa2O["P2-O2 / P3 / O3; Na2/3TMO2; P2-Na0.67MnO2; LiFePO4; Fe3+; Na+; O2; 180 mAh/g; E^2; x_2"] -->|Na+| LiFePO4[Na_{x}MO_{2}]';
    expect(normalizeMermaidChemicalLabels(source)).toBe('flowchart LR\nNa2O["P2-O2 / P3 / O3; Na₂/₃TMO₂; P2-Na₀.₆₇MnO₂; LiFePO₄; Fe³⁺; Na⁺; O2; 180 mAh/g; E^2; x_2"] -->|Na⁺| LiFePO4[NaₓMO₂]');
  });

  it("renders explicit chemical scripts as Unicode with strict Mermaid security", async () => {
    mermaidMock.render.mockResolvedValue({ svg: '<svg id="chemical-diagram" />' });
    render(<MermaidBlock code={'flowchart LR\nA["Na<sub>x</sub>MO<sub>2</sub>（第3页）"] --> B["Fe^{3+}; Na<sup>+</sup>; O_2"]'} />);
    await waitFor(() => expect(mermaidMock.render).toHaveBeenCalledWith(expect.any(String), 'flowchart LR\nA["NaₓMO₂"] --> B["Fe³⁺; Na⁺; O₂"]'));
    expect(mermaidMock.initialize).toHaveBeenCalledWith(expect.objectContaining({ securityLevel: "strict" }));
  });

  it("preserves fractional and decimal chemical subscripts from explicit notation", () => {
    expect(normalizeMermaidChemicalLabels('flowchart LR\nA[Na_{2/3}MO_{2}] --> B["Na_{0.67}MnO_{2}; Na<sub>2/3</sub>MO<sub>2</sub>; O2"]'))
      .toBe('flowchart LR\nA[Na₂/₃MO₂] --> B["Na₀.₆₇MnO₂; Na₂/₃MO₂; O2"]');
  });

  it("hides only explicit paper evidence annotations when requested", () => {
    const source = "[AI质疑, 第9页] [AI归纳, 第8-9页] [作者结论, 第6页] 【作者事实】 [原始数据， 第8、9页] [AI推断，第3–5页] [AI假设] [尚不确定] （原始数据，第2页） (作者结论, 第1页) （AI归纳，第23-24页） [AI归纳](https://example.com) [Na+] [1]";
    expect(stripPaperEvidenceAnnotations(source)).toBe("           [AI归纳](https://example.com) [Na+] [1]");
    const { container, rerender } = render(<MarkdownContent content={"[AI质疑, 第9页] [Na+] [1]"} />);
    expect(container.textContent).toContain("[AI质疑, 第9页]");
    rerender(<MarkdownContent content={"[AI质疑, 第9页] [Na+] [1]"} hideEvidenceAnnotations />);
    expect(container.textContent).toBe("[Na+] [1]");
  });

  it("removes saved diagram page labels while preserving prose citations and data", async () => {
    mermaidMock.render.mockResolvedValue({ svg: '<svg id="page-free-diagram" />' });
    const source = 'flowchart TD\nA["结果（第 3–5 页）<br/>容量 180 mAh/g"] -->|支持 p. 7| B["比较<br/>pp. 8-9"]';
    expect(stripMermaidPageReferences(source)).toBe('flowchart TD\nA["结果<br/>容量 180 mAh/g"] -->|支持 | B["比较"]');
    const { container } = render(<MarkdownContent content={`正文引用第 3 页。\n\n\`\`\`mermaid\n${source}\n\`\`\``} />);
    await waitFor(() => expect(mermaidMock.render).toHaveBeenCalled());
    expect(mermaidMock.render.mock.calls[0][1]).not.toMatch(/第 3|p\. 7|pp\. 8/);
    expect(container.textContent).toContain("正文引用第 3 页。");
  });

  it("renders a mermaid fenced block into a diagram container", async () => {
    mermaidMock.render.mockResolvedValue({
      svg: '<svg id="mock-diagram" xmlns="http://www.w3.org/2000/svg"><text>研究路线</text></svg>',
    });

    const markdown = [
      "## 研究路线",
      "",
      "```mermaid",
      "flowchart TD",
      "    A[问题] --> B[方案]",
      "```"
    ].join("\n");

    const { container } = render(<MarkdownContent content={markdown} />);

    await waitFor(() => {
      expect(container.querySelector(".mermaid-block")).toBeTruthy();
    });
    await waitFor(() => {
      expect(container.querySelector("svg#mock-diagram")).toBeTruthy();
    });

    expect(mermaidMock.initialize).toHaveBeenCalled();
    expect(mermaidMock.initialize).toHaveBeenCalledWith(expect.objectContaining({
      securityLevel: "strict",
      theme: "base",
      themeVariables: expect.objectContaining({ fontSize: "16px" }),
      flowchart: expect.objectContaining({ useMaxWidth: false, rankSpacing: 40, wrappingWidth: 320 }),
    }));
    expect(mermaidMock.render).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "研究路线" })).toBeTruthy();
    // the fenced code must not leak its source text as a visible code block
    expect(container.textContent).not.toContain("flowchart TD");
  });

  it("repairs an unfenced GLM Mermaid flowchart in a report paragraph", async () => {
    mermaidMock.render.mockResolvedValue({ svg: '<svg id="repaired-diagram" />' });
    const markdown = [
      "### 方法流程图",
      "",
      "mermaid",
      "flowchart TD",
      "  A[文献检索与筛选<br/>近5-10年高质量源] -->|分类| B[储能技术路线梳理<br/>电磁/热/化学/机械]",
      "  B -->|聚焦| C[蓝色经济专项评估<br/>海洋能与海洋基储能]",
      "  C -->|交叉| D[可持续性与正义分析<br/>LCA缺失与替代方案]",
      "  D -->|产出| E[综合框架与缺口表<br/>技术/政策/教育维度]",
      "",
      "- 阅读主线与证据边界：本图呈现综述从文献筛选到技术分类的方法路径。",
    ].join("\n");

    const { container } = render(<MarkdownContent content={markdown} />);

    await waitFor(() => expect(container.querySelector("svg#repaired-diagram")).toBeTruthy());
    expect(mermaidMock.render).toHaveBeenCalledWith(
      expect.any(String),
      "flowchart TD\n  A[文献检索与筛选<br/>近5-10年高质量源] -->|分类| B[储能技术路线梳理<br/>电磁/热/化学/机械]\n  B -->|聚焦| C[蓝色经济专项评估<br/>海洋能与海洋基储能]\n  C -->|交叉| D[可持续性与正义分析<br/>LCA缺失与替代方案]\n  D -->|产出| E[综合框架与缺口表<br/>技术/政策/教育维度]",
    );
    expect(container.textContent).not.toContain("mermaid flowchart TD");
    expect(container.textContent).toContain("阅读主线与证据边界：本图呈现综述从文献筛选到技术分类的方法路径。");
  });

  it("falls back to showing the source code when the diagram fails to render", async () => {
    mermaidMock.render.mockRejectedValue(new Error("syntax error"));

    const markdown = [
      "```mermaid",
      "mindmap",
      "  root((储能))",
      "    电池",
      "    超级电容",
      "```"
    ].join("\n");

    const { container } = render(<MarkdownContent content={markdown} />);

    await waitFor(() => {
      expect(container.querySelector(".mermaid-error")).toBeTruthy();
    });
    expect(container.textContent).toContain("mindmap");
    expect(container.textContent).toContain("超级电容");
    expect(container.textContent).toContain("图表渲染失败");
  });

  it("recovers from a failed diagram when its code changes and resets zoom", async () => {
    mermaidMock.render.mockResolvedValueOnce({ svg: '<svg id="first-diagram" />' })
      .mockRejectedValueOnce(new Error("syntax error"))
      .mockResolvedValueOnce({ svg: '<svg id="recovered-diagram" />' });
    const { container, rerender } = render(<MermaidBlock code="flowchart TD\nA --> B" />);
    await waitFor(() => expect(container.querySelector("svg#first-diagram")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "放大图表" }));
    expect(container.querySelector("[data-mermaid-scale]")?.getAttribute("data-mermaid-scale")).toBe("1.25");
    rerender(<MermaidBlock code="not valid" />);
    await waitFor(() => expect(container.querySelector(".mermaid-error")).toBeTruthy());
    rerender(<MermaidBlock code="flowchart TD\nC --> D" />);
    await waitFor(() => expect(container.querySelector("svg#recovered-diagram")).toBeTruthy());
    expect(container.querySelector(".mermaid-error")).toBeNull();
    expect(container.querySelector("[data-mermaid-scale]")?.getAttribute("data-mermaid-scale")).toBe("1");
  });

  it("leaves ordinary fenced code blocks untouched", () => {
    const markdown = [
      "```",
      "const x = 1;",
      "```"
    ].join("\n");

    const { container } = render(<MarkdownContent content={markdown} />);

    expect(container.querySelector(".mermaid-block")).toBeNull();
    expect(container.querySelector("code")).toBeTruthy();
    expect(container.textContent).toContain("const x = 1;");
  });

  it("offers zoom controls that scale the rendered diagram", async () => {
    mermaidMock.render.mockResolvedValue({
      svg: '<svg id="zoom-diagram" xmlns="http://www.w3.org/2000/svg"><text>缩放</text></svg>',
    });

    const markdown = [
      "```mermaid",
      "mindmap",
      "  root((储能))",
      "    电池",
      "```"
    ].join("\n");

    const { container } = render(<MarkdownContent content={markdown} />);

    await waitFor(() => {
      expect(container.querySelector(".mermaid-block[data-mermaid-ready='true']")).toBeTruthy();
    });

    const zoomIn = screen.getByRole("button", { name: "放大图表" });
    const zoomOut = screen.getByRole("button", { name: "缩小图表" });
    const reset = screen.getByRole("button", { name: "重置图表缩放" });
    const block = container.querySelector<HTMLElement>(".mermaid-block");
    const scaler = container.querySelector<HTMLElement>(".mermaid-block-scaler");

    expect(block?.getAttribute("data-mermaid-scale")).toBe("1");
    expect(scaler?.style.zoom).toBe("1");

    fireEvent.click(zoomIn);
    expect(block?.getAttribute("data-mermaid-scale")).toBe("1.25");
    expect(scaler?.style.zoom).toBe("1.25");

    fireEvent.click(zoomIn);
    fireEvent.click(zoomIn);
    expect(block?.getAttribute("data-mermaid-scale")).toBe("1.75");

    fireEvent.click(zoomOut);
    expect(block?.getAttribute("data-mermaid-scale")).toBe("1.5");

    fireEvent.click(reset);
    expect(block?.getAttribute("data-mermaid-scale")).toBe("1");
  });

  it("protects mermaid fenced blocks from scientific-token normalization", () => {
    const markdown = [
      "```mermaid",
      "flowchart LR",
      "    A[Na_xTMO_2] --> B[容量衰减]",
      "```"
    ].join("\n");

    const normalized = normalizeScientificMarkdown(markdown);
    expect(normalized).toContain("```mermaid");
    expect(normalized).toContain("A[Na_xTMO_2] --> B[容量衰减]");
    expect(normalized).not.toContain("$Na_x");
  });
});
