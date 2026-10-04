// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import SubscriptionDetail from "../app/subscriptions/[id]/SubscriptionDetail";

vi.mock("../components/workspace/TitleMotion", () => ({ default: ({ text, variant }: { text: string; variant: string }) => <span data-variant={variant}>{text}</span> }));
vi.mock("../components/react-bits/LatticeLoader", () => ({ default: ({ label }: { label: string }) => <p>{label}</p> }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const abstract = "Original complete abstract: " + "experimental details retained. ".repeat(80);
function fixtures() {
  vi.spyOn(api, "getResearchSubscription").mockResolvedValue({ id: 2, name: "储能研究", query: "battery energy", enabled: true, interval_hours: 168 } as Awaited<ReturnType<typeof api.getResearchSubscription>>);
  vi.spyOn(api, "listResearchRecommendations").mockResolvedValue({ items: Array.from({ length: 6 }, (_, i) => ({ id: i + 1, subscription_id: 2, run_id: 3, source: "openalex", external_id: String(i), identity_key: String(i), relevance_score: 1, created_at: "2026-09-30", read_at: null, paper_snapshot: { title: `Original paper ${i + 1}`, abstract, published_date: `2026-09-${20 - i}`, landing_url: `https://example.org/paper/${i + 1}` } })), total: 6, page: 1, page_size: 50 });
  vi.spyOn(api, "latestResearchNews").mockResolvedValue({ items: [{ title: "Official MIT news", summary: "Full official summary", url: "https://news.mit.edu/energy", source: "MIT News", published_date: "2026-09-30" }], warnings: [], fetched_at: "2026-09-30" });
  return vi.spyOn(api, "researchReadingHighlights").mockImplementation(async payload => ({ items: [...(payload.recommendation_ids ?? []).map(id => ({ key: `paper:${id}`, title_zh: `论文中文 ${id}`, points: ["研究问题", "方法与条件", "核心发现"] })), ...(payload.news_urls ?? []).map(url => ({ key: `news:${url}`, title_zh: "能源资讯中文", points: ["新闻重点一", "新闻重点二", "新闻重点三"] }))] }));
}
it("keeps general AI news out of a subscription and shows related papers first", async () => {
  const highlights = fixtures();
  const { container } = render(<SubscriptionDetail subscriptionId={2} runId={3} />);
  await screen.findByText("论文中文 1");
  expect(api.latestResearchNews).not.toHaveBeenCalled();
  expect(screen.queryByText("Official MIT news")).toBeNull();
  expect(highlights.mock.calls[0][0]).toEqual({ recommendation_ids: [1, 2, 3, 4, 5], news_urls: [] });
  expect(container.querySelectorAll(".subscription-reading-points li")).toHaveLength(15);
  expect(screen.getByRole("region", { name: "相关论文" }).querySelector(".subscription-original p")?.textContent).toBe(abstract);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("储能研究");
  expect(container.querySelector("h1 [data-variant]")?.getAttribute("data-variant")).toBe("tech");
  expect(container.querySelector(".subscription-detail-query")?.textContent).toContain("battery energy");
  expect(screen.getByRole("link", { name: "← 返回研究订阅" }).className).toBe("subscription-detail-back");
  expect(screen.getByRole("button", { name: "全部 6" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "资讯 0" }));
  expect(screen.getByText("暂无本主题资讯。")).toBeTruthy();
});
it("keeps source content visible when Chinese highlights fail and supports retry", async () => {
  const highlights = fixtures(); highlights.mockRejectedValueOnce(new Error("中文整理暂不可用"));
  render(<SubscriptionDetail subscriptionId={2} />);
  await screen.findByText("中文整理暂不可用");
  expect(screen.getByRole("heading", { level: 3, name: "Original paper 1" })).toBeTruthy();
  expect(screen.getAllByText("查看原文摘要")).toHaveLength(6);
  fireEvent.click(screen.getByRole("button", { name: "重试中文重点" }));
  await screen.findByText("论文中文 1");
  expect(highlights).toHaveBeenCalledTimes(2);
});

it("shows topic news after related papers without adding the general feed", async () => {
  fixtures();
  vi.spyOn(api, "listResearchRecommendations").mockResolvedValue({ items: [
    { id: 1, subscription_id: 2, run_id: 3, source: "openalex", external_id: "paper-1", identity_key: "paper-1", relevance_score: 1, created_at: "2026-09-30", read_at: null, paper_snapshot: { title: "Thermal storage paper", abstract: "Paper abstract", published_date: "2026-09-20", landing_url: "https://example.org/paper" } },
    { id: 7, subscription_id: 2, run_id: 3, source: "mit-energy", external_id: "news-7", identity_key: "news-7", relevance_score: 1, created_at: "2026-09-30", read_at: null, paper_snapshot: { article_type: "news", title: "Thermal storage news", abstract: "Topic news", published_date: "2026-09-30", landing_url: "https://news.mit.edu/thermal" } },
  ], total: 2, page: 1, page_size: 50 });
  const { container } = render(<SubscriptionDetail subscriptionId={2} />);
  const papers = await screen.findByRole("region", { name: "相关论文" });
  const news = screen.getByRole("region", { name: "本主题资讯" });
  expect(papers.compareDocumentPosition(news) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole("button", { name: "资讯 1" })).toBeTruthy();
  expect(container.textContent).not.toContain("Official MIT news");
  expect(api.latestResearchNews).not.toHaveBeenCalled();
});
