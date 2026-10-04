// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { ResearchResults } from "../components/workspace/ResearchResults";

it("opens notification run results with official news first and marks a paper read", async () => {
  const base = { subscription_id: 2, run_id: 3, source: "openalex", external_id: "x", identity_key: "x", relevance_score: 1, created_at: "2026-09-30", read_at: null };
  const paper = { ...base, id: 1, paper_snapshot: { title: "Battery paper", landing_url: "https://doi.org/10.1234/test" } };
  const news = { ...base, id: 2, paper_snapshot: { title: "MIT Energy", article_type: "news", landing_url: "https://news.mit.edu/2026/energy" } };
  const list = vi.spyOn(api, "listResearchRecommendations").mockResolvedValue({ items: [paper, news], total: 2, page: 1, page_size: 50 });
  const read = vi.spyOn(api, "markResearchRecommendationRead").mockResolvedValue({ ...paper, read_at: "2026-09-30" });
  const { container } = render(<ResearchResults subscriptionId={2} runId={3} />);
  await screen.findByText("MIT Energy ↗");
  expect(list).toHaveBeenCalledWith(2, 3);
  expect(container.querySelector("h3")?.textContent).toContain("MIT Energy");
  const link = screen.getByText("Battery paper ↗");
  expect(link.getAttribute("href")).toBe("https://doi.org/10.1234/test");
  fireEvent.click(link);
  await waitFor(() => expect(read).toHaveBeenCalledWith(1));
});
