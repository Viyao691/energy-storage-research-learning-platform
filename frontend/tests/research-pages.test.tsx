// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import ResearchDailyPage from "../app/research-daily/page";
import SubscriptionsPage from "../app/subscriptions/page";
import SubscriptionDetail from "../app/subscriptions/[id]/SubscriptionDetail";

vi.mock("../components/workspace/TitleMotion", () => ({ default: ({ text }: { text: string }) => <span>{text}</span> }));
vi.mock("../components/workspace/TopicArtwork", () => ({ TopicArtwork: () => <span />, getResearchTopic: () => ({ key: "general", label: "能源" }) }));
vi.mock("../components/react-bits/LatticeLoader", () => ({ default: ({ label }: { label: string }) => <span>{label}</span> }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const page = <T,>(items: T[]) => ({ items, total: items.length, page: 1, page_size: 20 });
const run = { id: 3, subscription_id: 2, status: "success", started_at: "2026-09-30T12:00:00", completed_at: "2026-09-30T12:00:00", discovered_count: 2, recommended_count: 1, source_statuses: [], warnings: [], error: null };
const notice = { id: 1, subscription_id: 2, run_id: 3, kind: "digest_ready", title: "研究订阅发现新论文", body: "发现相关论文", created_at: "2026-09-30T12:00:00", read_at: null };
const recommendation = { id: 8, subscription_id: 2, run_id: 3, source: "openalex", external_id: "x", identity_key: "x", relevance_score: 1, created_at: "2026-09-30", read_at: null, paper_snapshot: { title: "Subscribed sodium paper", landing_url: "https://doi.org/10.1234/sodium" } };

it("shows official daily news and sends notification and run links to the wide detail route", async () => {
  vi.spyOn(api, "listResearchRuns").mockResolvedValue(page([run]));
  vi.spyOn(api, "listResearchNotifications").mockResolvedValue(page([notice]));
  vi.spyOn(api, "latestResearchNews").mockResolvedValue({ items: [{ title: "Latest MIT AI", source: "MIT News", url: "https://news.mit.edu/ai", published_date: "2026-09-30", summary: "Official research news" }], warnings: [], fetched_at: "2026-09-30" });
  const results = vi.spyOn(api, "listResearchRecommendations").mockResolvedValue(page([recommendation]));
  const readNotice = vi.spyOn(api, "markResearchNotificationRead").mockResolvedValue({ ...notice, read_at: "2026-09-30" });
  render(<ResearchDailyPage />);
  const news = await screen.findByText("Latest MIT AI ↗");
  expect(news.getAttribute("href")).toBe("https://news.mit.edu/ai");
  const noticeLink = await screen.findByRole("link", { name: "查看内容 →" });
  expect(noticeLink.getAttribute("href")).toBe("/subscriptions/2?run=3");
  expect(screen.getByRole("link", { name: "查看本次新增内容 →" }).getAttribute("href")).toBe("/subscriptions/2?run=3");
  fireEvent.click(noticeLink);
  await waitFor(() => expect(readNotice).toHaveBeenCalledWith(1));
  expect(results).not.toHaveBeenCalled();
});

it("immediate subscription check gives completion feedback and refreshes the topic", async () => {
  const topic = { id: 2, name: "钠电池", query: "sodium", sources: [], year_from: null, year_to: null, open_access_only: false, interval_hours: 168, enabled: true, last_started_at: null, last_success_at: null, next_run_at: null, last_error: null, created_at: "2026-09-30", updated_at: "2026-09-30" };
  const subscriptions = vi.spyOn(api, "listResearchSubscriptions").mockResolvedValue(page([topic]));
  vi.spyOn(api, "listResearchRuns").mockResolvedValue(page([]));
  const check = vi.spyOn(api, "runResearchSubscription").mockResolvedValue(run);
  const results = vi.spyOn(api, "listResearchRecommendations").mockResolvedValue(page([recommendation]));
  render(<SubscriptionsPage />);
  fireEvent.click(await screen.findByRole("button", { name: "立即检查" }));
  await screen.findByText("检查完成：发现 2 条，新增 1 条");
  expect(check).toHaveBeenCalledWith(2);
  await waitFor(() => expect(subscriptions).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("link", { name: "查看订阅内容" }).getAttribute("href")).toBe("/subscriptions/2");
  expect(results).not.toHaveBeenCalled();
});


it("reads the individual subscription and displays the entire long title and summary on the detail page", async () => {
  const title = "Sodium-ion layered oxide cathode research ".repeat(12);
  const summary = "Complete research abstract paragraph. ".repeat(30) + "FINAL ABSTRACT SENTENCE";
  const topic = { id: 2, name: "钠电池", query: "sodium", sources: [], year_from: null, year_to: null, open_access_only: false, interval_hours: 168, enabled: true, last_started_at: null, last_success_at: null, next_run_at: null, last_error: null, created_at: "2026-09-30", updated_at: "2026-09-30" };
  const getTopic = vi.spyOn(api, "getResearchSubscription").mockResolvedValue(topic);
  const results = vi.spyOn(api, "listResearchRecommendations").mockResolvedValue(page([{ ...recommendation, paper_snapshot: { ...recommendation.paper_snapshot, title, abstract: summary, journal: "Energy Journal", published_date: "2026-09-30" } }]));
  const { container } = render(<SubscriptionDetail subscriptionId={2} runId={3} />);
  await screen.findByText(/FINAL ABSTRACT SENTENCE/);
  expect(getTopic).toHaveBeenCalledWith(2);
  expect(results).toHaveBeenCalledWith(2, 3);
  expect(container.querySelector(".subscription-detail-page .research-result p")?.textContent).toBe(summary);
  expect(container.querySelector(".research-result h3")?.textContent).toBe(title + " ↗");
  expect(container.querySelector(".research-result-meta")?.textContent).toContain("Energy Journal2026-09-30");
  expect(screen.getByRole("link", { name: "← 返回研究订阅" }).getAttribute("href")).toBe("/subscriptions");
  expect(screen.getByRole("link", { name: "查看该主题全部内容 →" }).getAttribute("href")).toBe("/subscriptions/2");
});
