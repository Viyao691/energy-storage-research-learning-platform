// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LearningPage from "../app/learning/page";
import LearningPackPage from "../app/learning/[id]/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: {
  learningPaperCandidates: vi.fn(), learningOverview: vi.fn(), createLearningPack: vi.fn(), learningPack: vi.fn(),
  learningPacks: vi.fn(), learningAnalytics: vi.fn(), learningVersions: vi.fn(), createLearningVersion: vi.fn(), activateLearningPack: vi.fn(), archiveLearningPack: vi.fn(), compareLearningPacks: vi.fn(), learningExportUrl: vi.fn(),
  learningReviewQueue: vi.fn(), submitLearningReview: vi.fn(), updateLearningReviewState: vi.fn(),
  generateLearningCards: vi.fn(), generateLearningQuiz: vi.fn(), updateLearningCard: vi.fn(), updateLearningMastery: vi.fn(),
  submitLearningAttempt: vi.fn(), rateLearningAttempt: vi.fn(), saveLearningPlan: vi.fn(), updateLearningPlanTask: vi.fn(),
  orderLearningCards: vi.fn(), orderLearningQuestions: vi.fn(), orderLearningPlanTasks: vi.fn(), generateLearningFeedback: vi.fn(),
  createLearningWeakness: vi.fn(), setLearningWeaknessResolved: vi.fn(), deleteLearningPack: vi.fn(),
} }));
vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));
let searchTab = "";
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: (key: string) => key === "tab" ? searchTab : null }),
}));

const pack = { id: 1, title: "层状氧化物学习包", learning_goal: "理解结构机制", cards_status: "completed", quiz_status: "completed", cards_prompt_version: "learning-cards-v1", cards_schema_version: "learning-cards-schema-v1", quiz_prompt_version: "learning-quiz-v2", quiz_schema_version: "learning-quiz-schema-v2", provider: "mock", model_name: "mock", last_error: null, lineage_id: "lineage-1", version_number: 1, lifecycle_status: "active", archived_at: null, source_count: 1, card_count: 1, question_count: 1,
  sources: [{ paper_id: 2, paper_title: "Paper", available_reports: ["reviewer_analysis"], analysis_versions: {}, source_has_newer_analysis: false }],
  cards: [{ id: 10, concept: "层间滑移", generated_content: "原稿", content: "解释内容", importance: "连接结构与性能", common_mistake: "相关不等于因果", evidence: [{ evidence_id: "E1", paper_id: 2, paper_title: "Paper", page_number: 3, section: "Results", excerpt: "evidence", source_scope: "fulltext" }, { evidence_id: "E2", paper_id: 2, paper_title: "Paper", page_number: null, section: "Discussion", excerpt: "no page", source_scope: "fulltext" }], is_user_edited: false, mastery_status: "未学习", mastery_confirmed_at: null, position: 1, review_state: null }],
  questions: [{ id: 20, question_type: "short_answer", prompt: "证据链是什么？", options: [], related_card_ids: [10], evidence: [], position: 1, attempts: [] }], weaknesses: [], plan: null };

describe("learning system pages", () => {
  afterEach(cleanup);
  beforeEach(() => { vi.clearAllMocks(); searchTab = ""; apiMock.learningPaperCandidates.mockResolvedValue({ items: [{ id: 2, title: "Paper", journal: "Nature", published_date: "2026", available_reports: ["reviewer_analysis"], eligible: true, is_read: true, fulltext_available: true, blocking_reasons: [] }, { id: 3, title: "Unread Paper", journal: "Science", published_date: "2025", available_reports: [], eligible: false, is_read: false, fulltext_available: true, blocking_reasons: ["尚未标记已读", "尚无当前版本解析"] }] }); apiMock.learningOverview.mockResolvedValue({ packs: [], today_tasks: [], open_weaknesses: [], due_reviews: [], due_review_count: 0 }); apiMock.learningPacks.mockResolvedValue({ items: [] }); apiMock.learningAnalytics.mockResolvedValue({ days: 30, from_date: "2026-07-22", to_date: "2026-08-20", history_start_date: "2026-08-20", daily: [{ date: "2026-08-20", reviews: 2, attempts: 1, completed_tasks: 1 }], rating_distribution: { "不会": 1, "模糊": 1, "基本掌握": 0, "已掌握": 0 }, correct_rate: 1, mastery_distribution: { "未学习": 0, "学习中": 1, "已掌握": 0 }, due_review_count: 1, weaknesses: [{ concept: "层间滑移", score: 2, pack_count: 1, occurrence_count: 2, recurrence_count: 0 }] }); apiMock.createLearningPack.mockResolvedValue(pack); apiMock.learningPack.mockResolvedValue(pack); apiMock.learningVersions.mockResolvedValue({ items: [pack] }); apiMock.learningExportUrl.mockImplementation((id: number, format: string) => `http://localhost/export/${id}.${format}`); apiMock.learningReviewQueue.mockResolvedValue({ today: "2026-08-20", items: [] }); apiMock.updateLearningMastery.mockResolvedValue({ ...pack.cards[0], mastery_status: "已掌握", mastery_confirmed_at: "2026-08-13" }); apiMock.submitLearningAttempt.mockResolvedValue({ id: 30, question_id: 20, answer: "回答", result: "pending_self_review", self_rating: null, explanation: "参考", reference_points: ["要点"], feedback_markdown: "", feedback_provider: "", feedback_model_name: "", feedback_prompt_version: "", feedback_evidence_status: "", feedback_generated_at: null }); apiMock.generateLearningFeedback.mockResolvedValue({ id: 30, question_id: 20, answer: "回答", result: "pending_self_review", self_rating: null, feedback_markdown: "请区分事实与推断", feedback_provider: "mock", feedback_model_name: "mock", feedback_prompt_version: "learning-short-feedback-v1", feedback_evidence_status: "基于学习包证据快照", feedback_generated_at: "2026-08-20" }); });

  it("creates a pack only from explicitly selected eligible papers", async () => {
    render(createElement(LearningPage));
    await userEvent.type(await screen.findByLabelText("学习包标题"), "新学习包");
    await userEvent.click(screen.getByRole("checkbox", { name: "选择 Paper" }));
    await userEvent.click(screen.getByRole("button", { name: "创建学习包" }));
    expect(apiMock.createLearningPack).toHaveBeenCalledWith(expect.objectContaining({ title: "新学习包", paper_ids: [2] }));
  });

  it("shows generation progress, prevents duplicate card requests, and permits retry after failure", async () => {
    let rejectCards!: (reason: Error) => void;
    apiMock.learningPack.mockResolvedValue({ ...pack, cards: [] });
    apiMock.generateLearningCards.mockReturnValueOnce(new Promise((_resolve, reject) => { rejectCards = reject; })).mockResolvedValueOnce({});
    render(createElement(LearningPackPage));
    const generate = await screen.findByRole("button", { name: "生成知识卡片" });
    await userEvent.click(generate);
    expect(screen.getByRole("status", { name: "正在生成知识卡片…" })).toBeTruthy();
    expect(generate.hasAttribute("disabled")).toBe(true);
    await userEvent.click(generate);
    expect(apiMock.generateLearningCards).toHaveBeenCalledTimes(1);
    rejectCards(new Error("生成失败"));
    await waitFor(() => expect(generate.hasAttribute("disabled")).toBe(false));
    await userEvent.click(generate);
    await waitFor(() => expect(apiMock.generateLearningCards).toHaveBeenCalledTimes(2));
  });

  it("shows progress while creating a pack and blocks duplicate submissions", async () => {
    let resolveCreate!: (value: unknown) => void;
    apiMock.createLearningPack.mockReturnValue(new Promise(resolve => { resolveCreate = resolve; }));
    render(createElement(LearningPage));
    await userEvent.type(await screen.findByLabelText("学习包标题"), "新学习包");
    await userEvent.click(screen.getByRole("checkbox", { name: "选择 Paper" }));
    const create = screen.getByRole("button", { name: "创建学习包" });
    await userEvent.click(create);
    expect(screen.getByRole("status", { name: "正在创建学习包…" })).toBeTruthy();
    expect(create.hasAttribute("disabled")).toBe(true);
    await userEvent.click(create);
    expect(apiMock.createLearningPack).toHaveBeenCalledTimes(1);
    resolveCreate(pack);
    await waitFor(() => expect(screen.queryByRole("status", { name: "正在创建学习包…" })).toBeNull());
  });

  it("shows review queue and save progress only while their requests are pending", async () => {
    searchTab = "review";
    let resolveQueue!: (value: unknown) => void;
    let rejectReview!: (reason: Error) => void;
    apiMock.learningReviewQueue.mockReturnValue(new Promise(resolve => { resolveQueue = resolve; }));
    apiMock.submitLearningReview.mockReturnValue(new Promise((_resolve, reject) => { rejectReview = reject; }));
    render(createElement(LearningPackPage));
    expect(await screen.findByRole("status", { name: "正在读取复习队列…" })).toBeTruthy();
    resolveQueue({ today: "2026-08-20", items: [] });
    const rating = await screen.findByRole("button", { name: "基本掌握" });
    await userEvent.click(rating);
    expect(screen.getByRole("status", { name: "正在保存复习评价…" })).toBeTruthy();
    expect(rating.hasAttribute("disabled")).toBe(true);
    rejectReview(new Error("保存失败"));
    await waitFor(() => expect(rating.hasAttribute("disabled")).toBe(false));
  });

  it("shows version list and comparison progress, then restores controls on failure", async () => {
    let resolveVersions!: (value: unknown) => void;
    let rejectCompare!: (reason: Error) => void;
    apiMock.learningVersions.mockReturnValue(new Promise(resolve => { resolveVersions = resolve; }));
    apiMock.compareLearningPacks.mockReturnValue(new Promise((_resolve, reject) => { rejectCompare = reject; }));
    render(createElement(LearningPackPage));
    await userEvent.click(await screen.findByRole("button", { name: "版本与导出" }));
    expect(screen.getByRole("status", { name: "正在读取版本列表…" })).toBeTruthy();
    resolveVersions({ items: [pack, { ...pack, id: 2, version_number: 2, lifecycle_status: "draft" }] });
    await userEvent.click(await screen.findByRole("combobox", { name: "比较版本" }));
    await userEvent.click(screen.getByRole("option", { name: /v2/ }));
    const compare = screen.getByRole("button", { name: "比较" });
    await userEvent.click(compare);
    expect(screen.getByRole("status", { name: "正在比较版本…" })).toBeTruthy();
    expect(compare.hasAttribute("disabled")).toBe(true);
    rejectCompare(new Error("比较失败"));
    await waitFor(() => expect(compare.hasAttribute("disabled")).toBe(false));
  });

  it("keeps overview numbers pending until the overview request resolves", async () => {
    let resolveOverview!: (value: unknown) => void;
    apiMock.learningOverview.mockReturnValue(new Promise(resolve => { resolveOverview = resolve; }));
    render(createElement(LearningPage));
    expect(screen.getByText("正在读取学习概览…")).toBeTruthy();
    expect(screen.queryByText("项待完成")).toBeNull();
    expect(screen.queryByText("当前筛选下没有学习包")).toBeNull();
    expect(screen.queryByText("论文库暂无论文。请先上传论文并完成解析。")).toBeNull();
    resolveOverview({ packs: [], today_tasks: [], open_weaknesses: [], due_reviews: [] });
    expect(await screen.findByText("项待完成")).toBeTruthy();
  });

  it("does not present zero overview totals when the overview request fails", async () => {
    apiMock.learningOverview.mockRejectedValue(new Error("概览读取失败"));
    render(createElement(LearningPage));
    expect(await screen.findByText("概览读取失败")).toBeTruthy();
    expect(screen.getByText("学习概览暂不可用。请稍后重试。")).toBeTruthy();
    expect(screen.queryByText("项待完成")).toBeNull();
    expect(screen.queryByText("当前筛选下没有学习包")).toBeNull();
    expect(screen.queryByText("论文库暂无论文。请先上传论文并完成解析。")).toBeNull();
  });

  it("does not let an older analytics range replace the selected range", async () => {
    let resolveSeven!: (value: unknown) => void;
    apiMock.learningAnalytics.mockImplementation((days: number) => days === 7
      ? new Promise(resolve => { resolveSeven = resolve; })
      : Promise.resolve({ days, from_date: "2026-07-22", to_date: "2026-08-20", history_start_date: "2026-08-20", daily: [{ date: "2026-08-20", reviews: 1, attempts: 0, completed_tasks: 0 }], rating_distribution: {}, correct_rate: null, mastery_distribution: { "未学习": 0, "学习中": 0, "已掌握": 0 }, due_review_count: 0, weaknesses: [] }));
    render(createElement(LearningPage));
    await userEvent.click(await screen.findByRole("button", { name: "7 天" }));
    await userEvent.click(screen.getByRole("button", { name: "90 天" }));
    await waitFor(() => expect(screen.getByRole("img", { name: /90 天学习活动/ })).toBeTruthy());
    resolveSeven({ days: 7, from_date: "2026-08-14", to_date: "2026-08-20", history_start_date: "2026-08-20", daily: [], rating_distribution: {}, correct_rate: null, mastery_distribution: { "未学习": 0, "学习中": 0, "已掌握": 0 }, due_review_count: 0, weaknesses: [] });
    expect(screen.getByRole("img", { name: /90 天学习活动/ })).toBeTruthy();
  });

  it("shows an analytics request failure without leaving the previous range visible", async () => {
    apiMock.learningAnalytics.mockImplementation((days: number) => days === 7 ? Promise.reject(new Error("趋势读取失败")) : Promise.resolve({ days: 30, from_date: "2026-07-22", to_date: "2026-08-20", history_start_date: "2026-08-20", daily: [{ date: "2026-08-20", reviews: 1, attempts: 0, completed_tasks: 0 }], rating_distribution: {}, correct_rate: null, mastery_distribution: { "未学习": 0, "学习中": 0, "已掌握": 0 }, due_review_count: 0, weaknesses: [] }));
    render(createElement(LearningPage));
    expect(await screen.findByRole("img", { name: /30 天学习活动/ })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "7 天" }));
    expect(await screen.findByText("趋势读取失败")).toBeTruthy();
    expect(screen.queryByRole("img", { name: /30 天学习活动/ })).toBeNull();
  });

  it("expands one overview card at a time and collapses it on a second click", async () => {
    apiMock.learningOverview.mockResolvedValue({
      packs: [{ ...pack, card_count: 1, question_count: 1 }],
      today_tasks: [{ id: 1, pack_id: 1, task_date: "2026-08-13", task_type: "card", title: "学习卡片：层间滑移", completed_at: null }],
      open_weaknesses: [{ id: 2, pack_id: 1, card_id: 10, concept: "层间滑移", description: "需要复习", source: "quiz", occurrence_count: 2, recurrence_count: 0, is_resolved: false, resolved_at: null }],
    });
    render(createElement(LearningPage));
    const tasks = await screen.findByRole("button", { name: /今日任务/ });
    await userEvent.click(tasks);
    expect(screen.getByText("学习卡片：层间滑移")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /开放薄弱项/ }));
    expect(screen.queryByText("学习卡片：层间滑移")).toBeNull();
    expect(screen.getByText("需要复习")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /开放薄弱项/ }));
    expect(screen.queryByText("需要复习")).toBeNull();
  });

  it("combines selected recommended goals with a personal goal", async () => {
    render(createElement(LearningPage));
    await userEvent.click(await screen.findByRole("checkbox", { name: "选择 Paper" }));
    await userEvent.type(screen.getByLabelText("学习包标题"), "机制学习包");
    await userEvent.click(screen.getByRole("checkbox", { name: "材料设计与作用机制" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Claim–Evidence 证据链" }));
    await userEvent.type(screen.getByLabelText("个人补充目标"), "准备组会汇报");
    await userEvent.click(screen.getByRole("button", { name: "创建学习包" }));
    expect(apiMock.createLearningPack).toHaveBeenCalledWith(expect.objectContaining({
      learning_goal: "材料设计与作用机制；Claim–Evidence 证据链；准备组会汇报",
    }));
  });

  it("shows ineligible papers with reasons and action links", async () => {
    render(createElement(LearningPage));
    expect(await screen.findByText("Unread Paper")).toBeTruthy();
    expect(screen.getByText("尚未标记已读")).toBeTruthy();
    expect(screen.getByText("尚无当前版本解析")).toBeTruthy();
    expect(screen.getByRole("link", { name: "去论文库标记已读" }).getAttribute("href")).toBe("/library");
    expect(screen.getByRole("link", { name: "去生成解析" }).getAttribute("href")).toBe("/papers/3");
  });

  it("shows six tabs and mastery changes only through the explicit mastery action", async () => {
    render(createElement(LearningPackPage));
    expect(await screen.findByRole("button", { name: "知识卡片" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "自测" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "学习计划" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "薄弱概念" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "复习" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "版本与导出" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "已掌握" }));
    await waitFor(() => expect(apiMock.updateLearningMastery).toHaveBeenCalledWith(10, "已掌握"));
  });

  it("formats plain card sentences and folds source evidence without losing it", async () => {
    apiMock.learningPack.mockResolvedValue({ ...pack, cards: [{ ...pack.cards[0], content: "核心机制。边界是条件一。易错点是忽略条件二。" }] });
    render(createElement(LearningPackPage));
    const heading = await screen.findByRole("heading", { name: "层间滑移" });
    const card = heading.closest("article")!;
    expect(card.querySelector(".learning-card-heading > span")?.textContent).toBe("1");
    expect(card.querySelectorAll(".learning-card-body p")).toHaveLength(3);
    expect(card.querySelector(".learning-card-body p strong")?.textContent).toBe("核心机制。");
    const sources = card.querySelector("details.learning-card-sources") as HTMLDetailsElement;
    expect(sources.open).toBe(false);
    expect(sources.textContent).toContain("[E1] Paper · 第 3 页 · Results");
    await userEvent.click(screen.getByText("展开来源"));
    expect(sources.open).toBe(true);
    await userEvent.click(screen.getByText("收起来源"));
    expect(sources.open).toBe(false);
  });

  it("keeps authored Markdown and math formatting in card bodies", async () => {
    apiMock.learningPack.mockResolvedValue({ ...pack, cards: [{ ...pack.cards[0], content: "**重点** $E=mc^2$\n\n- 保留列表" }] });
    render(createElement(LearningPackPage));
    const card = (await screen.findByRole("heading", { name: "层间滑移" })).closest("article")!;
    expect(card.querySelector(".learning-card-body strong")?.textContent).toBe("重点");
    expect(card.querySelector(".learning-card-body li")?.textContent).toBe("保留列表");
    expect(card.querySelector(".learning-card-body .katex")).toBeTruthy();
  });

  it("derives mastery counts from the loaded cards and updates after manual confirmation", async () => {
    render(createElement(LearningPackPage));
    expect((await screen.findByLabelText("卡片掌握分布")).textContent).toContain("1未学习");
    await userEvent.click(screen.getByRole("button", { name: "已掌握" }));
    await waitFor(() => expect(screen.getByLabelText("卡片掌握分布").textContent).toContain("1已掌握"));
  });

  it("shows 2D analytics and lifecycle filters on the learning page", async () => {
    apiMock.learningPacks.mockResolvedValue({ items: [pack, { ...pack, id: 2, title: "草稿包", lifecycle_status: "draft", version_number: 2 }] });
    render(createElement(LearningPage));
    expect(await screen.findByRole("heading", { name: "学习趋势" })).toBeTruthy();
    expect(screen.getByText("层间滑移")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "7 天" }));
    expect(apiMock.learningAnalytics).toHaveBeenCalledWith(7);
    await userEvent.click(screen.getByRole("combobox", { name: "学习包状态" }));
    await userEvent.click(screen.getByRole("option", { name: "草稿" }));
    expect(screen.getByText("草稿包")).toBeTruthy();
    expect(screen.queryByText("层状氧化物学习包")).toBeNull();
  });

  it("offers version exports and explicit short-answer feedback", async () => {
    render(createElement(LearningPackPage));
    await userEvent.click(await screen.findByRole("button", { name: "版本与导出" }));
    expect(await screen.findByRole("link", { name: "导出 Markdown" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "导出 JSON" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "自测" }));
    await userEvent.type(screen.getByLabelText("第1题回答"), "我的回答");
    await userEvent.click(screen.getByRole("button", { name: "提交答案" }));
    await userEvent.click(await screen.findByRole("button", { name: "生成模型反馈" }));
    expect(apiMock.generateLearningFeedback).toHaveBeenCalledWith(30, false);
    expect(await screen.findByText("请区分事实与推断")).toBeTruthy();
  });

  it("puts overdue reviews before plan tasks in today's overview", async () => {
    apiMock.learningOverview.mockResolvedValue({
      packs: [pack],
      due_reviews: [{ state: { id: 40, pack_id: 1, card_id: 10, last_rating: "模糊", next_review_date: "2026-08-18", review_count: 1, lapse_count: 0, is_paused: false, last_reviewed_at: "2026-08-15T00:00:00" }, pack_title: pack.title, overdue_days: 2, card: pack.cards[0] }],
      due_review_count: 1,
      today_tasks: [{ id: 1, pack_id: 1, task_date: "2026-08-20", task_type: "card", title: "学习卡片：层间滑移", completed_at: null }],
      open_weaknesses: [],
    });
    render(createElement(LearningPage));
    await userEvent.click(await screen.findByRole("button", { name: /今日任务/ }));
    const entries = screen.getAllByRole("article");
    expect(entries[0].textContent).toContain("复习：层间滑移");
    expect(entries[0].textContent).toContain("逾期 2 天");
    expect(screen.getByRole("link", { name: "开始复习" }).getAttribute("href")).toBe("/learning/1?tab=review");
  });

  it("opens review from the query, reveals evidence safely, submits ratings and keeps content after failure", async () => {
    searchTab = "review";
    apiMock.submitLearningReview
      .mockResolvedValueOnce({ state: { id: 40, pack_id: 1, card_id: 10, last_rating: "基本掌握", next_review_date: "2026-08-27", review_count: 1, lapse_count: 0, is_paused: false, last_reviewed_at: "2026-08-20T00:00:00" }, card: { ...pack.cards[0], mastery_status: "学习中" } })
      .mockRejectedValueOnce(new Error("保存失败"));
    render(createElement(LearningPackPage));
    expect(await screen.findByRole("heading", { name: "层间滑移" })).toBeTruthy();
    expect(screen.queryByText("解释内容")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "展开答案与证据" }));
    expect(screen.getByText("解释内容")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Paper.*第 3 页/ }).getAttribute("href")).toBe("/papers/2?page=3");
    expect(screen.getByText(/Paper.*页码无法确认/).closest("a")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "基本掌握" }));
    expect(apiMock.submitLearningReview).toHaveBeenCalledWith(10, "基本掌握");
    expect(await screen.findByText("下次复习：2026-08-27")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "不会" }));
    expect(await screen.findByText("保存失败")).toBeTruthy();
    expect(screen.getByText("解释内容")).toBeTruthy();
  });

  it("reschedules and pauses or resumes a review without dialogs", async () => {
    searchTab = "review";
    const state = { id: 40, pack_id: 1, card_id: 10, last_rating: "模糊", next_review_date: "2026-08-20", review_count: 1, lapse_count: 0, is_paused: false, last_reviewed_at: "2026-08-17T00:00:00" };
    apiMock.learningReviewQueue.mockResolvedValue({ today: "2026-08-20", items: [{ state, pack_title: pack.title, overdue_days: 0, card: { ...pack.cards[0], review_state: state } }] });
    apiMock.updateLearningReviewState.mockImplementation((_id: number, payload: Record<string, unknown>) => Promise.resolve({ ...state, ...payload }));
    render(createElement(LearningPackPage));
    const date = await screen.findByLabelText("下次复习日期");
    await userEvent.clear(date);
    await userEvent.type(date, "2026-08-25");
    await userEvent.click(screen.getByRole("button", { name: "保存日期" }));
    expect(apiMock.updateLearningReviewState).toHaveBeenCalledWith(40, { next_review_date: "2026-08-25" });
    await userEvent.click(screen.getByRole("button", { name: "暂停复习" }));
    expect(apiMock.updateLearningReviewState).toHaveBeenCalledWith(40, { is_paused: true });
    expect(await screen.findByRole("button", { name: "恢复复习" })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "恢复复习" }));
    expect(apiMock.updateLearningReviewState).toHaveBeenCalledWith(40, { is_paused: false });
  });

  it("uses two-step short answer self review", async () => {
    render(createElement(LearningPackPage));
    await userEvent.click(await screen.findByRole("button", { name: "自测" }));
    await userEvent.type(screen.getByLabelText("第1题回答"), "我的回答");
    await userEvent.click(screen.getByRole("button", { name: "提交答案" }));
    expect(await screen.findByRole("button", { name: "部分答对" })).toBeTruthy();
    expect(apiMock.submitLearningAttempt).toHaveBeenCalledWith(20, "我的回答");
  });

  it("renders quiz notation while submitting the selected option letter", async () => {
    apiMock.learningPack.mockResolvedValue({ ...pack, questions: [{ ...pack.questions[0], question_type: "multiple_choice", prompt: "速率常数 k0 与 10^-3：`k0` 和 $10^{-2}$ 保持原样", options: ["A. k0 = 10^-3", "B. k0 = 10^3", "C. 其他", "D. 无法判断"], attempts: [] }] });
    apiMock.submitLearningAttempt.mockResolvedValue({ id: 30, question_id: 20, answer: "B", result: "incorrect", self_rating: null, explanation: "**解析**：k0 对应 10^-3", reference_points: ["**要点**：10^-3"], feedback_markdown: "", feedback_provider: "", feedback_model_name: "", feedback_prompt_version: "", feedback_evidence_status: "", feedback_generated_at: null });
    render(createElement(LearningPackPage));
    await userEvent.click(await screen.findByRole("button", { name: "自测" }));
    const question = screen.getByText(/速率常数/).closest("article")!;
    expect(question.querySelector("h3 .katex msub")).toBeTruthy();
    expect(question.querySelector("h3 .katex msup")).toBeTruthy();
    expect(question.querySelector("h3 code")?.textContent).toBe("k0");
    expect(question.querySelectorAll(".learning-options label")).toHaveLength(4);
    expect(question.querySelector(".learning-options .katex msub")).toBeTruthy();
    await userEvent.click(question.querySelectorAll(".learning-options label")[1]);
    await userEvent.click(screen.getByRole("button", { name: "提交答案" }));
    expect(apiMock.submitLearningAttempt).toHaveBeenCalledWith(20, "B");
    expect(await screen.findByText("解析")).toBeTruthy();
    expect(question.querySelector(".learning-feedback .katex msup")).toBeTruthy();
    expect(question.querySelector(".learning-feedback li strong")?.textContent).toBe("要点");
  });
});
