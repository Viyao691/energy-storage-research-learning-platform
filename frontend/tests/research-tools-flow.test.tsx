// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ResearchDataPage from "../app/research-data/page";
import IdeasPage from "../app/ideas/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: {
  scientificImports: vi.fn(), scientificImport: vi.fn(), allScientificDatasets: vi.fn(), uploadScientificImport: vi.fn(), confirmScientificImport: vi.fn(),
  scientificDataset: vi.fn(), updateScientificDataset: vi.fn(), scientificDatasetAnalyses: vi.fn(), runScientificAnalysis: vi.fn(), updateScientificDatasetState: vi.fn(),
  researchIdeas: vi.fn(), papers: vi.fn(), createResearchIdea: vi.fn(), updateResearchIdea: vi.fn(), generateResearchIdea: vi.fn(),
  experimentDesigns: vi.fn(), experimentDesign: vi.fn(), createExperimentDesign: vi.fn(), updateExperimentDesign: vi.fn(), reviewExperimentDesign: vi.fn(),
  createResearchExport: vi.fn(), researchExportUrl: vi.fn(), scientificExportUrl: vi.fn(),
} }));
vi.mock("../lib/api", () => ({ api: apiMock }));

const imported = { id: 4, original_filename: "two.xlsx", file_format: "xlsx", available_sheets: ["材料", "效率"], selected_sheet: "材料", row_count: 2, column_count: 2, column_types: { x: "number", y: "mixed" }, missing_values: { y: 1 }, range_values: { y: 1 }, invalid_values: {}, preview: [["x", "y"], [1, null], [2, "10-20"]], status: "preview" };
const dataset = { id: 8, name: "数据甲", dataset_type: "table", paper_id: null, confirmation_status: "confirmed", is_favorite: false, is_read: false, data: { x: [1, 2], y: [null, "10-20"] }, units: { x: "kJ" }, parameters: {}, quality: { row_count: 2, column_count: 2, column_types: { x: "number", y: "mixed" }, missing_values: { y: 1 }, range_values: { y: 1 }, invalid_values: {}, reviewed: false, handling_policy: "" } };

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  apiMock.scientificImports.mockResolvedValue([imported]);
  apiMock.scientificImport.mockResolvedValue({ ...imported, selected_sheet: "效率", preview: [["效率"], [95]], row_count: 1, column_count: 1 });
  apiMock.allScientificDatasets.mockResolvedValue({ items: [dataset] });
  apiMock.scientificDataset.mockResolvedValue(dataset);
  apiMock.scientificDatasetAnalyses.mockResolvedValue([]);
  apiMock.researchIdeas.mockResolvedValue([]);
  apiMock.papers.mockResolvedValue({ items: [] });
  apiMock.experimentDesigns.mockResolvedValue([]);
});

it("switches a historical XLSX sheet and requires explicit review before confirming", async () => {
  render(<ResearchDataPage />);
  await userEvent.click(await screen.findByRole("button", { name: /预览 two.xlsx/ }));
  await userEvent.selectOptions(screen.getByLabelText("工作表"), "效率");
  await waitFor(() => expect(apiMock.scientificImport).toHaveBeenCalledWith(4, "效率"));
  expect(screen.getByRole("button", { name: "确认列、单位与参数" }).hasAttribute("disabled")).toBe(true);
  await userEvent.click(screen.getByLabelText("已核对行列结构"));
  await userEvent.click(screen.getByLabelText("已核对单位映射"));
  await userEvent.click(screen.getByLabelText("接受缺失和非数值样本排除策略"));
  expect(screen.getByRole("button", { name: "确认列、单位与参数" }).hasAttribute("disabled")).toBe(false);
});

it("shows all dataset rows, explicit quality review, and per-column analysis outcomes", async () => {
  const analysis = { id: 3, dataset_id: 8, recipe: "generic.table_statistics", status: "completed", is_stale: false, results: { columns: { x: { count: 2, total_count: 2, missing_count: 0, invalid_count: 0, range_count: 0, excluded_count: 0, mean: 1.5, sd: 0.7, outlier_indices: [], status: "included", reason: "" }, y: { count: 0, total_count: 2, missing_count: 1, invalid_count: 0, range_count: 1, excluded_count: 2, mean: null, sd: null, outlier_indices: [], status: "skipped", reason: "无有效数值" } } } };
  apiMock.updateScientificDataset.mockResolvedValue({ ...dataset, quality: { ...dataset.quality, reviewed: true, handling_policy: "exclude_missing_and_non_numeric" } });
  apiMock.runScientificAnalysis.mockResolvedValue(analysis);
  render(<ResearchDataPage />);
  await userEvent.click(await screen.findByRole("button", { name: "查看 数据甲" }));
  expect(await screen.findByText("10-20")).toBeTruthy();
  expect(screen.getByText(/缺失 1/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "运行基础统计" }).hasAttribute("disabled")).toBe(true);
  fireEvent.change(screen.getByLabelText("现有数据单位映射"), { target: { value: '{"x":"kWh"}' } });
  await userEvent.click(screen.getByLabelText("已核对现有数据的行列和单位"));
  await userEvent.click(screen.getByLabelText("接受有效数值统计策略"));
  await userEvent.click(screen.getByRole("button", { name: "保存复核" }));
  expect(apiMock.updateScientificDataset).toHaveBeenCalledWith(8, expect.objectContaining({ units: { x: "kWh" } }));
  await userEvent.click(screen.getByRole("button", { name: "运行基础统计" }));
  await waitFor(() => expect(apiMock.runScientificAnalysis).toHaveBeenCalledWith(8, "generic.table_statistics", {}));
  expect(await screen.findByText(/无有效数值/)).toBeTruthy();
});

it("keeps chosen papers and datasets scoped and reopens saved design for editing", async () => {
  const idea = { id: 5, title: "问题", source_mode: "user", selected_paper_ids: [], selected_dataset_ids: [], hypothesis: "旧假设", evidence: "", novelty: "", falsification: "", feasibility: "", resources: "", evidence_gaps: "" };
  const design = { id: 9, idea_id: 5, title: "方案", variables: "", controls: "", replication: "", randomization: "", measurement: "", statistics: "", stopping_criteria: "", resources: "", risks: "", deterministic_findings: [], ai_review: "" };
  apiMock.researchIdeas.mockResolvedValue([idea]);
  apiMock.papers.mockResolvedValue({ items: [{ id: "12", title: "论文甲", fulltext_status: "abstract_only" }] });
  apiMock.experimentDesigns.mockResolvedValue([design]);
  apiMock.experimentDesign.mockResolvedValue(design);
  apiMock.updateExperimentDesign.mockResolvedValue({ ...design, variables: "温度" });
  apiMock.generateResearchIdea.mockResolvedValue({ ...idea, id: 6 });
  render(<IdeasPage />);
  await userEvent.click(await screen.findByLabelText("选择数据集"));
  await userEvent.click(screen.getByRole("option", { name: "数据甲" }));
  await userEvent.click(screen.getByLabelText(/论文甲/));
  await userEvent.click(screen.getByRole("button", { name: "生成候选选题" }));
  await waitFor(() => expect(apiMock.generateResearchIdea).toHaveBeenCalledWith([12], [8]));
  await userEvent.click(screen.getByRole("button", { name: "打开方案" }));
  expect(apiMock.experimentDesign).toHaveBeenCalledWith(9);
  await userEvent.type(screen.getByLabelText("变量"), "温度");
  await userEvent.click(screen.getByRole("button", { name: "保存实验设计" }));
  await waitFor(() => expect(apiMock.updateExperimentDesign).toHaveBeenCalledWith(9, expect.objectContaining({ variables: "温度" })));
});

it("exports only explicitly checked current analyses in all three formats", async () => {
  apiMock.scientificDatasetAnalyses.mockResolvedValue([{ id: 11, dataset_id: 8, recipe: "generic.table_statistics", status: "completed", is_stale: false }]);
  apiMock.createResearchExport.mockImplementation(async payload => ({ id: 17, export_type: payload.export_type, selected_paper_ids: payload.paper_ids, selected_dataset_ids: payload.dataset_ids, selected_analysis_ids: payload.analysis_ids, markdown: "# 证据\n\n有效数值 2 行。" }));
  apiMock.researchExportUrl.mockReturnValue("/research-exports/17/download");
  render(<IdeasPage />);
  await userEvent.click(await screen.findByLabelText("选择数据集"));
  await userEvent.click(screen.getByRole("option", { name: "数据甲" }));
  await userEvent.click(await screen.findByLabelText(/分析 #11/));
  for (const [label, format] of [["生成 Markdown", "markdown"], ["生成 Word", "docx"], ["生成 PPT", "pptx"]]) {
    await userEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(apiMock.createResearchExport).toHaveBeenLastCalledWith({ title: "所选证据与分析综述", export_type: format, paper_ids: [], dataset_ids: [8], analysis_ids: [11] }));
  }
  expect((await screen.findByRole("link", { name: "下载 PPTX" })).getAttribute("href")).toBe("/research-exports/17/download");
  expect(screen.getByText("有效数值 2 行。")).toBeTruthy();
});

it("pages through a full table instead of hiding rows after the preview", async () => {
  apiMock.scientificDataset.mockResolvedValue({ ...dataset, data: { x: Array.from({ length: 51 }, (_, index) => index + 1) }, quality: { ...dataset.quality, row_count: 51 } });
  render(<ResearchDataPage />);
  await userEvent.click(await screen.findByRole("button", { name: "查看 数据甲" }));
  const detail = await screen.findByRole("region", { name: "数据集详情" });
  expect(within(detail).getByText("1–50 / 51")).toBeTruthy();
  await userEvent.click(within(detail).getByRole("button", { name: "下一页" }));
  expect(within(detail).getByText("51–51 / 51")).toBeTruthy();
  expect(within(detail).getAllByText("51").length).toBeGreaterThan(0);
});

it("counts a legacy confirmed import as pending review and does not invent old analysis diagnostics", async () => {
  apiMock.allScientificDatasets.mockResolvedValue({ items: [{ ...dataset, source_type: "user_import" }] });
  apiMock.scientificDataset.mockResolvedValue({ ...dataset, source_type: "user_import" });
  apiMock.scientificDatasetAnalyses.mockResolvedValue([{ id: 6, dataset_id: 8, recipe: "generic.table_statistics", algorithm_version: "1.0.0", status: "completed", is_stale: false, results: { columns: { x: { count: 11, mean: 95.3, standard_deviation: 2.3, outlier_indices: [] } } } }]);
  render(<ResearchDataPage />);
  expect(await screen.findByRole("img", { name: "用户已核对 0 个，待复核 1 个" })).toBeTruthy();
  const grid = screen.getByRole("tabpanel", { name: "数据集筛选结果" });
  expect(within(grid).getByText("待复核")).toBeTruthy();
  expect(within(grid).queryByText("已确认")).toBeNull();
  await userEvent.click(within(grid).getByRole("button", { name: "查看 数据甲" }));
  const detail = await screen.findByRole("region", { name: "数据集详情" });
  expect(within(detail).getByText(/算法版本：1\.0\.0/)).toBeTruthy();
  expect(within(detail).getByText("11 / 未记录")).toBeTruthy();
  expect(within(detail).getByText(/旧版分析未记录样本排除诊断/)).toBeTruthy();
});
