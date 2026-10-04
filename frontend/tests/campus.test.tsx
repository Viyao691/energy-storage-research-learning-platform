// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CampusPage from "../app/campus/page";

const { apiMock } = vi.hoisted(() => ({ apiMock: {
  listCampusSources: vi.fn(), activateCampus: vi.fn(), updateCampusSource: vi.fn(),
  listCampusEvents: vi.fn(), updateCampusEvent: vi.fn(), listCampusNotices: vi.fn(), markCampusNoticeRead: vi.fn(),
  listCampusPublicLinks: vi.fn(),
} }));
vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));

describe("CampusPage", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.listCampusPublicLinks.mockResolvedValue({ items: [], total: 0, counts: { recent: 0, unknown: 0, archive: 0 }, days: 90 });
    apiMock.listCampusSources.mockResolvedValue({ items: [
      { id: 1, key: "future", name: "未来技术学院通知公告", group: "未来技术学院", url: "https://wljsxy.xjtu.edu.cn/", priority: 100, enabled: true, activation_state: "enabled", access_state: "login_required", coverage: "column", status: "blocked", detail: "跳转至统一身份认证", last_checked_at: "2026-09-25T01:00:00Z", last_success_at: "2026-09-25T01:00:00Z", next_check_at: "2026-09-25T13:00:00Z", robots_status: "missing" },
      { id: 2, key: "college", name: "数学与统计学院", group: "工科学院", url: "https://math.xjtu.edu.cn/", priority: 50, enabled: false, activation_state: "never_enabled", access_state: "unknown", coverage: "homepage", status: "pending", detail: "等待首次检查", last_checked_at: null, last_success_at: null, next_check_at: null, robots_status: "missing" },
      { id: 3, key: "future-teaching", name: "未来技术学院 · 教学教务", group: "未来技术学院", url: "https://wljsxy.xjtu.edu.cn/zspy/jxjw.htm", priority: 90, enabled: true, activation_state: "enabled", access_state: "public", coverage: "column", status: "ok", detail: "检查正常", last_checked_at: null, last_success_at: null, next_check_at: null, robots_status: "missing" },
    ] });
    apiMock.listCampusEvents.mockResolvedValue({ items: [{ id: 7, title: "西安交通大学《电信T.A杯》“AI+教育”创新应用技能大赛比赛方案", category: "竞赛创新", subtype: "AI与编程", category_basis: "rule", subtype_basis: "rule", summary: "面向陕西省高校学生的AI+教育创新应用赛事，方案列出四个赛道。", key_points: ["报名截止：2026年10月10日", "作品提交截止：2026年10月25日"], competition_type: "AI应用创新", competition_tracks: ["AI+高等教育", "AI For Science"], stage: "报名", audience: "陕西省各高校在校学生", action: "登录官方专题网报名", tags: ["校级", "AI"], analysis: { status: "ready", method: "rule", model: null, prompt_version: null, unknowns: ["具体团队资格以官方方案为准"], evidence: [{ field: "报名截止", quote: "报名截止：2026年10月10日", url: "https://wljsxy.xjtu.edu.cn/info/1/2.htm" }] }, feed_status: "recent", date_basis: "published", excerpt: "比赛方案公布。", dates: [{ kind: "报名", day: "2026-10-10", evidence: "报名截止：2026年10月10日" }], published_on: "2026-09-24", priority: 100, followed: false, conflict: false, archived: false, origins: [{ name: "未来技术学院通知公告", url: "https://wljsxy.xjtu.edu.cn/info/1/2.htm", source_id: 1, published_on: "2026-09-24" }], updated_at: "2026-09-25T01:00:00" }], total: 1, counts: { recent: 1, unknown: 2, archive: 3 }, days: 90 });
    apiMock.listCampusNotices.mockResolvedValue({ items: [{ id: 4, event_id: 7, title: "新资讯：智能制造创新竞赛报名通知", body: "发现一条新通知", kind: "new", url: "https://wljsxy.xjtu.edu.cn/info/1/2.htm", source_name: "未来技术学院通知公告", read_at: null, created_at: "2026-09-25T01:00:00" }] });
    apiMock.activateCampus.mockResolvedValue({});
    apiMock.updateCampusSource.mockResolvedValue({});
    apiMock.updateCampusEvent.mockResolvedValue({});
    apiMock.markCampusNoticeRead.mockResolvedValue({});
  });

  it("shows classified evidence, separates source access from activation, and switches date scopes", async () => {
    render(createElement(CampusPage));
    expect(await screen.findByRole("heading", { name: "校园机会与学术资讯" })).toBeTruthy();
    expect(await screen.findByText("西安交通大学《电信T.A杯》“AI+教育”创新应用技能大赛比赛方案")).toBeTruthy();
    expect(screen.getByText("竞赛创新")).toBeTruthy();
    expect(screen.getAllByText("主类别")).toHaveLength(2);
    expect(screen.getAllByText("细类")).toHaveLength(2);
    expect(screen.queryByText("标题规则 · 请核对原文")).toBeNull();
    expect(screen.queryByText(/查看原文依据/)).toBeNull();
    await userEvent.click(screen.getByRole("combobox", { name: "按主类别筛选" }));
    expect(screen.getByRole("option", { name: "竞赛创新" })).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    expect(screen.getByText("AI与编程")).toBeTruthy();
    expect(screen.getByText("AI应用创新")).toBeTruthy();
    expect(screen.getByText(/陕西省各高校在校学生/)).toBeTruthy();
    expect(screen.getByText("面向陕西省高校学生的AI+教育创新应用赛事，方案列出四个赛道。")).toBeTruthy();
    expect(screen.getByText(/具体团队资格以官方方案为准/)).toBeTruthy();
    expect(screen.getByText("报名：2026-10-10")).toBeTruthy();
    expect(screen.getByText(/最近检查：2026\/09\/25 09:00/)).toBeTruthy();
    expect(screen.getByText("需登录")).toBeTruthy();
    expect(screen.getByText("从未启用")).toBeTruthy();
    expect(screen.getByText("官网网站 · 3 个栏目")).toBeTruthy();
    expect(screen.getByText("公众号 · 公开外链索引")).toBeTruthy();
    expect(screen.getByText("群消息 · 未接入")).toBeTruthy();
    expect(screen.getByText("小程序 · 未接入")).toBeTruthy();
    expect(screen.getByText("未来技术学院 · 2 个栏目")).toBeTruthy();
    expect(screen.queryByText("工科学院 · 1 个栏目")).toBeNull();
    expect(screen.getByRole("link", { name: "教学教务" }).getAttribute("href")).toBe("https://wljsxy.xjtu.edu.cn/zspy/jxjw.htm");
    expect(screen.getAllByRole("tab", { name: /日期待核实/ })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "启用此来源" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getAllByRole("link", { name: "查看原文：未来技术学院通知公告" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "关注此资讯" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "关注此资讯" }));
    await waitFor(() => expect(apiMock.updateCampusEvent).toHaveBeenCalledWith(7, { followed: true }));
    fireEvent.click(screen.getByRole("button", { name: "标记为已读" }));
    await waitFor(() => expect(apiMock.markCampusNoticeRead).toHaveBeenCalledWith(4));
    fireEvent.click(screen.getAllByRole("button", { name: "暂停此来源" })[0]);
    await waitFor(() => expect(apiMock.updateCampusSource).toHaveBeenCalledWith(1, { enabled: false }));
    fireEvent.click(screen.getByText("数学与统计学院 · 1 个栏目"));
    fireEvent.click(screen.getByRole("button", { name: "启用此来源" }));
    await waitFor(() => expect(apiMock.updateCampusSource).toHaveBeenCalledWith(2, { enabled: true }));
    fireEvent.click(screen.getAllByRole("tab", { name: /日期待核实/ })[0]);
    await waitFor(() => expect(apiMock.listCampusEvents).toHaveBeenLastCalledWith({ offset: 0, limit: 20, scope: "unknown", days: 90, category: "", subtype: "", followed: false }));
  });

  it("marks an unsupported category and subtype as awaiting confirmation", async () => {
    const base = await apiMock.listCampusEvents();
    apiMock.listCampusEvents.mockResolvedValue({ ...base, items: [{ ...base.items[0], category: null, subtype: null, category_basis: "unverified", subtype_basis: "unverified", tags: [], analysis: { ...base.items[0].analysis, status: "pending", method: "rule" } }] });
    render(createElement(CampusPage));
    expect(await screen.findByText("西安交通大学《电信T.A杯》“AI+教育”创新应用技能大赛比赛方案")).toBeTruthy();
    expect(screen.getAllByText("待确认")).toHaveLength(2);
    expect(screen.queryByText("待人工确认")).toBeNull();
    expect(screen.queryByText(/正文待整理/)).toBeNull();
  });

  it("keeps the Mock disclosure and meaningful unknowns while omitting generic fallback copy", async () => {
    const base = await apiMock.listCampusEvents();
    apiMock.listCampusEvents.mockResolvedValue({ ...base, items: [{ ...base.items[0], dates: [], published_on: null, feed_status: "unknown", analysis: { ...base.items[0].analysis, method: "mock", model: "mock-model", unknowns: ["具体要求请核对原文", "日期未确认", "具体团队资格以官方方案为准"] } }] });
    const { container } = render(createElement(CampusPage));
    expect(await screen.findByText("AI推断（Mock演示）")).toBeTruthy();
    expect(screen.getByText("发布日期：日期待核实")).toBeTruthy();
    expect(screen.getByText(/具体团队资格以官方方案为准/)).toBeTruthy();
    expect(screen.queryByText("具体要求请核对原文")).toBeNull();
    expect(screen.queryByText("日期未确认")).toBeNull();
    expect(screen.queryByText(/mock-model/)).toBeNull();
    expect(container.querySelector(".campus-event-dates")).toBeNull();
  });

  it("keeps an expanded institution after refreshing sources", async () => {
    const { container } = render(createElement(CampusPage));
    expect(await screen.findByText("数学与统计学院 · 1 个栏目")).toBeTruthy();
    const group = Array.from(container.querySelectorAll(".campus-source-group")).find(node => node.querySelector("summary")?.textContent?.includes("数学与统计学院")) as HTMLDetailsElement;
    expect(group.open).toBe(false);
    fireEvent.click(group.querySelector("summary")!);
    expect(group.open).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "刷新列表" }));
    await waitFor(() => expect(apiMock.listCampusSources).toHaveBeenCalledTimes(2));
    expect(group.open).toBe(true);
  });

  it("shows link-only public articles with unknown dates and both source links", async () => {
    apiMock.listCampusPublicLinks.mockResolvedValue({ items: [{
      url: "https://mp.weixin.qq.com/s/article-id", title: "仲英书院公开讲座通知", published_on: null,
      first_seen_at: "2026-09-25T01:00:00Z", last_seen_at: "2026-09-25T01:00:00Z", evidence_level: "link_only",
      origins: [{ source_id: 9, name: "仲英书院新闻", url: "https://cy.xjtu.edu.cn/xwdt/xwdt.htm" }],
    }], total: 1, counts: { recent: 0, unknown: 1, archive: 0 }, days: 90 });
    const { container } = render(createElement(CampusPage));
    expect(await screen.findByRole("heading", { name: "校园机会与学术资讯" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "公众号公开索引" })).toBeTruthy();
    expect(await screen.findByText("仲英书院公开讲座通知")).toBeTruthy();
    expect(screen.getByText(/仅从校方公开网页发现文章标题与链接/)).toBeTruthy();
    expect(screen.getByText("发布日期：日期待核实")).toBeTruthy();
    expect(screen.getByText(/首次发现：2026\/09\/25/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "打开公众号原文" }).getAttribute("href")).toBe("https://mp.weixin.qq.com/s/article-id");
    expect(screen.getByRole("link", { name: "仲英书院新闻 · 校方列表页" }).getAttribute("href")).toBe("https://cy.xjtu.edu.cn/xwdt/xwdt.htm");
    expect(container.querySelector(".campus-event")).toBeTruthy();
  });

  it("ignores a stale unknown-scope response after switching to recent", async () => {
    let resolveUnknown!: (value: { items: never[]; total: number; counts: { recent: number; unknown: number; archive: number }; days: number }) => void;
    apiMock.listCampusPublicLinks
      .mockImplementationOnce(() => new Promise(resolve => { resolveUnknown = resolve; }))
      .mockResolvedValueOnce({ items: [{
        url: "https://mp.weixin.qq.com/s/recent", title: "近期公开文章", published_on: "2026-09-24",
        first_seen_at: "2026-09-25T01:00:00Z", last_seen_at: "2026-09-25T01:00:00Z", evidence_level: "link_only",
        origins: [{ source_id: 9, name: "新闻网", url: "https://news.xjtu.edu.cn/" }],
      }], total: 1, counts: { recent: 1, unknown: 0, archive: 0 }, days: 90 });

    render(createElement(CampusPage));
    await waitFor(() => expect(apiMock.listCampusPublicLinks).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getAllByRole("tab", { name: /近 90 天/ })[1]);
    expect(await screen.findByText("近期公开文章")).toBeTruthy();
    resolveUnknown({ items: [], total: 0, counts: { recent: 0, unknown: 0, archive: 0 }, days: 90 });
    await waitFor(() => expect(apiMock.listCampusPublicLinks).toHaveBeenCalledTimes(2));
    expect(screen.getByText("近期公开文章")).toBeTruthy();
  });
});
