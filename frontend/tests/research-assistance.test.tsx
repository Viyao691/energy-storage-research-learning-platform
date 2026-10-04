// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ResearchDataPage from "../app/research-data/page";
import IdeasPage from "../app/ideas/page";
import HelpPage from "../app/help/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: {
  scientificImports: vi.fn(), allScientificDatasets: vi.fn(), uploadScientificImport: vi.fn(), confirmScientificImport: vi.fn(),
  researchIdeas: vi.fn(), createResearchIdea: vi.fn(), generateResearchIdea: vi.fn(), createExperimentDesign: vi.fn(), reviewExperimentDesign: vi.fn(), createResearchExport: vi.fn(),
} }));
vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));

describe("Research assistance pages", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.scientificImports.mockResolvedValue([]);
    apiMock.allScientificDatasets.mockResolvedValue({ items: [] });
    apiMock.researchIdeas.mockResolvedValue([]);
    apiMock.uploadScientificImport.mockResolvedValue({ id: 1, original_filename: "data.csv", file_format: "csv", selected_sheet: null, row_count: 2, column_count: 2, column_types: { x: "number", y: "number" }, missing_values: { x: 0, y: 0 }, preview: [["x", "y"], [1, 2]], status: "preview", available_sheets: [], sha256: "abc", created_at: "2026-08-24T00:00:00" });
    apiMock.createResearchIdea.mockResolvedValue({ id: 2, title: "低温界面假设", source_mode: "user", hypothesis: "界面阻抗决定低温倍率", evidence: "", novelty: "", falsification: "", feasibility: "", resources: "", evidence_gaps: "", ai_review: "", selected_paper_ids: [], selected_dataset_ids: [], created_at: "", updated_at: "" });
  });

  it("previews a scientific data file before confirmation", async () => {
    render(<ResearchDataPage />);
    const file = new File(["x,y\n1,2\n"], "data.csv", { type: "text/csv" });
    await userEvent.upload(await screen.findByLabelText("选择 CSV 或 XLSX"), file);
    await userEvent.click(screen.getByRole("button", { name: "读取预览" }));
    expect(apiMock.uploadScientificImport).toHaveBeenCalled();
    expect(await screen.findByText(/2 行 · 2 列/)).toBeTruthy();
  });

  it("creates a user-originated research idea", async () => {
    render(<IdeasPage />);
    await userEvent.type(await screen.findByLabelText("选题名称"), "低温界面假设");
    await userEvent.type(screen.getByLabelText("可检验假设"), "界面阻抗决定低温倍率");
    await userEvent.click(screen.getByRole("button", { name: "保存科研想法" }));
    expect(apiMock.createResearchIdea).toHaveBeenCalled();
    expect(await screen.findByText("低温界面假设")).toBeTruthy();
  });

  it("documents data confirmation, safe experiment review and export boundaries", () => {
    render(<HelpPage />);
    expect(screen.getByText("独立科研数据导入")).toBeTruthy();
    expect(screen.getByText(/CSV 或 XLSX 表格/)).toBeTruthy();
    expect(screen.getByText("科研想法与实验设计")).toBeTruthy();
    expect(screen.getByText(/不要把候选建议当成已验证结论/)).toBeTruthy();
    expect(screen.getByText(/生成并查看 Markdown/)).toBeTruthy();
  });
});
