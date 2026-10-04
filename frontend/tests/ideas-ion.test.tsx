// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import IdeasPage from "../app/ideas/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: {
  researchIdeas: vi.fn(), allScientificDatasets: vi.fn(), papers: vi.fn(), experimentDesigns: vi.fn(), scientificDatasetAnalyses: vi.fn(), generateResearchIdea: vi.fn(),
} }));
vi.mock("../lib/api", () => ({ api: apiMock }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("links the ion path cue to an explicitly selected dataset and preserves generation scope", async () => {
  apiMock.researchIdeas.mockResolvedValue([]);
  apiMock.allScientificDatasets.mockResolvedValue({ items: [{ id: 7, name: "测试数据集" }] });
  apiMock.papers.mockResolvedValue({ items: [] });
  apiMock.experimentDesigns.mockResolvedValue([]);
  apiMock.scientificDatasetAnalyses.mockResolvedValue([]);
  apiMock.generateResearchIdea.mockResolvedValue({
    id: 3, title: "候选想法", hypothesis: "", evidence: "", evidence_gaps: "",
    source_mode: "selected", selected_paper_ids: [], selected_dataset_ids: [7],
  });
  render(<IdeasPage />);
  const select = await screen.findByLabelText("选择数据集");
  const scene = screen.getByTestId("ideas-ion-scene");
  expect(scene.getAttribute("data-selected-dataset")).toBe("");

  await userEvent.click(select);
  await userEvent.click(screen.getByRole("option", { name: "测试数据集" }));
  expect(scene.getAttribute("data-selected-dataset")).toBe("7");
  fireEvent.click(screen.getByRole("button", { name: "生成候选选题" }));
  await waitFor(() => expect(apiMock.generateResearchIdea).toHaveBeenCalledWith([], [7]));
});
