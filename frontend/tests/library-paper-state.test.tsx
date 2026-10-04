// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Library from "../app/library/page";

const { apiMock } = vi.hoisted(() => ({
  apiMock: { papers: vi.fn(), updatePaperState: vi.fn(), deletePaper: vi.fn(), figureThumbnailUrl: vi.fn() }
}));

vi.mock("../lib/api", async original => ({ ...(await original<typeof import("../lib/api")>()), api: apiMock }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

describe("Library paper state", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.papers.mockResolvedValue({
      items: [{ id: "5", title: "Stored paper", journal: "Energy", published_date: "2023-04-02", keywords: ["储能", "钠离子电池"], article_type: "journal-article", abstract: "This abstract should not appear in the library.", is_favorite: false, is_read: false }],
      total: 1, page: 1, page_size: 20, collection_counts: { all: 1, favorites: 0, read: 0, unread: 1 }
    });
    apiMock.updatePaperState.mockResolvedValue({ is_favorite: true, is_read: false });
    apiMock.figureThumbnailUrl.mockImplementation((id: string) => `/backend-api/api/v1/papers/${id}/figure-thumbnail`);
  });

  it("renders metadata and persists a manual favorite click", async () => {
    const user = userEvent.setup();
    render(createElement(Library));

    expect(await screen.findByText("Energy · 2023")).toBeTruthy();
    expect(screen.getByText("研究论文")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "收藏" }));

    expect(apiMock.updatePaperState).toHaveBeenCalledWith("5", { is_favorite: true, is_read: false });
    expect(await screen.findByRole("button", { name: "取消收藏" })).toBeTruthy();
  });

  it("replaces the abstract with a dedicated keyword row", async () => {
    render(createElement(Library));

    expect(await screen.findByText("关键词")).toBeTruthy();
    expect(screen.getByText("储能")).toBeTruthy();
    expect(screen.getByText("钠离子电池")).toBeTruthy();
    expect(screen.queryByText("This abstract should not appear in the library.")).toBeNull();
  });

  it("formats title and keyword formulas on cards and previews without editing source metadata", async () => {
    const title = "A Ni(OH)2 slurry for CO2 capture in P2/P3";
    apiMock.papers.mockResolvedValue({ items: [{ id: "5", title, keywords: ["CO2捕集"] }], total: 1, page: 1, page_size: 20 });
    render(createElement(Library));
    expect(await screen.findByRole("heading", { name: "A Ni(OH)₂ slurry for CO₂ capture in P2/P3", level: 2 })).toBeTruthy();
    expect(screen.getByText("CO₂捕集")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `预览 ${title}` }));
    expect(screen.getByRole("heading", { name: "A Ni(OH)₂ slurry for CO₂ capture in P2/P3", level: 3 })).toBeTruthy();
  });

  it("shows a restrained fallback when keywords are missing", async () => {
    apiMock.papers.mockResolvedValue({
      items: [{ id: "6", title: "Paper without keywords", keywords: [], is_favorite: false, is_read: false }],
      total: 1, page: 1, page_size: 20
    });

    render(createElement(Library));

    expect(await screen.findByText("关键词未提供")).toBeTruthy();
  });

  it("shows loading before the page arrives and distinguishes loaded from total", async () => {
    let resolve!: (value: unknown) => void;
    apiMock.papers.mockReturnValue(new Promise(done => { resolve = done; }));
    render(createElement(Library));
    expect(screen.getByText("正在读取论文库…")).toBeTruthy();
    expect(screen.queryByText(/尚无论文/)).toBeNull();
    resolve({ items: [{ id: "5", title: "Stored paper", keywords: [] }], total: 30, page: 1, page_size: 20 });
    expect(await screen.findByText("当前分栏已加载 1 / 30 篇")).toBeTruthy();
  });

  it("counts evidence scope and years from loaded papers only", async () => {
    apiMock.papers.mockResolvedValue({ items: [
      { id: "1", title: "Solid state", acquisition_status: "fulltext", published_date: "2023-01-01", keywords: [] },
      { id: "2", title: "Sodium study", acquisition_status: "abstract_only", published_date: "2024-01-01", keywords: [] },
      { id: "3", title: "Grid note", acquisition_status: "metadata_only", published_date: "2024-06-01", keywords: [] },
    ], total: 90, page: 1, page_size: 20 });
    render(createElement(Library));
    expect(await screen.findByText("当前分栏已加载 3 / 90 篇")).toBeTruthy();
    const overview = screen.getByRole("complementary", { name: "当前加载集合概览" });
    expect(overview.textContent).toContain("全文1");
    expect(overview.textContent).toContain("摘要1");
    expect(overview.textContent).toContain("元数据1");
    expect(overview.textContent).toContain("2024");
    expect(overview.textContent).toContain("2023");
  });

  it("previews the real scope and abstract without expanding every card", async () => {
    apiMock.papers.mockResolvedValue({ items: [{ id: "5", title: "Stored paper", abstract: "Real source abstract.", acquisition_status: "abstract_only", keywords: [] }], total: 1, page: 1, page_size: 20 });
    const user = userEvent.setup();
    render(createElement(Library));
    expect(await screen.findByText("摘要证据")).toBeTruthy();
    expect(screen.queryByText("Real source abstract.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "预览 Stored paper" }));
    expect(screen.getByRole("dialog", { name: "论文预览" })).toBeTruthy();
    expect(screen.getByText("Real source abstract.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "打开论文详情" }).getAttribute("href")).toBe("/papers/5");
  });

  it("shows a local PDF figure and falls back once when its image fails", async () => {
    apiMock.papers.mockResolvedValue({
      items: [{ id: "5", title: "Stored paper", file_hash: "sha256", page_count: 4, acquisition_status: "fulltext", keywords: [] }],
      total: 1, page: 1, page_size: 20
    });
    const { container } = render(createElement(Library));
    const cover = await screen.findByRole("img", { name: "Stored paper 的 PDF 内插图" });
    expect(cover.getAttribute("src")).toBe("/backend-api/api/v1/papers/5/figure-thumbnail");
    expect(screen.queryByText("AI 材料示意 · 非论文原图")).toBeNull();
    fireEvent.error(cover);
    expect(container.querySelector(".library-paper-artwork")).toBeTruthy();
    expect(apiMock.figureThumbnailUrl).toHaveBeenCalledTimes(1);
  });

  it("does not request a PDF cover for metadata-only papers", async () => {
    apiMock.papers.mockResolvedValue({
      items: [{ id: "6", title: "Metadata paper", file_hash: "historical-hash", page_count: 2, acquisition_status: "metadata_only", keywords: [] }],
      total: 1, page: 1, page_size: 20
    });
    const { container } = render(createElement(Library));
    expect(await screen.findByText("Metadata paper")).toBeTruthy();
    expect(container.querySelector(".library-paper-artwork")).toBeTruthy();
    expect(apiMock.figureThumbnailUrl).not.toHaveBeenCalled();
  });

  it("uses server collection counts and pages instead of filtering the first page as the full library", async () => {
    apiMock.papers.mockImplementation(({ page = 1, collection = "all" }) => Promise.resolve(collection === "favorites"
      ? { items: page === 1 ? [{ id: "7", title: "Favorite paper", is_favorite: true, is_read: false, keywords: [] }] : [{ id: "8", title: "Older favorite", is_favorite: true, is_read: true, keywords: [] }], total: 2, page, page_size: 20, collection_counts: { all: 35, favorites: 2, read: 10, unread: 25 } }
      : { items: [{ id: "5", title: "Stored paper", is_favorite: false, is_read: false, keywords: [] }], total: 35, page, page_size: 20, collection_counts: { all: 35, favorites: 2, read: 10, unread: 25 } }));
    const user = userEvent.setup();
    render(createElement(Library));
    expect(await screen.findByRole("tab", { name: "我的收藏2" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "我的收藏2" }));
    expect(await screen.findByText("Favorite paper")).toBeTruthy();
    expect(screen.queryByText("Stored paper")).toBeNull();
    expect(apiMock.papers).toHaveBeenCalledWith({ page: 1, page_size: 20, collection: "favorites" });
    await user.click(screen.getByRole("button", { name: "加载更多论文" }));
    expect(await screen.findByText("Older favorite")).toBeTruthy();
    expect(apiMock.papers).toHaveBeenCalledWith({ page: 2, page_size: 20, collection: "favorites" });
  });

  it("removes a paper immediately when it leaves the selected state collection", async () => {
    let favorite = true;
    apiMock.papers.mockImplementation(({ collection = "all" }) => Promise.resolve({
      items: collection === "favorites" && !favorite ? [] : [{ id: "5", title: "Favorite paper", is_favorite: favorite, is_read: false, keywords: [] }],
      total: collection === "favorites" ? Number(favorite) : 1, page: 1, page_size: 20,
      collection_counts: { all: 1, favorites: Number(favorite), read: 0, unread: 1 }
    }));
    apiMock.updatePaperState.mockImplementation(async (_id: string, state: { is_favorite: boolean; is_read: boolean }) => { favorite = state.is_favorite; return state; });
    const user = userEvent.setup();
    render(createElement(Library));
    await user.click(await screen.findByRole("tab", { name: "我的收藏1" }));
    expect(await screen.findByText("Favorite paper")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "取消收藏" }));
    expect(await screen.findByText("这个分栏暂无论文。")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "我的收藏0" })).toBeTruthy();
  });

  it("removes a newly read paper from unread and updates both counts", async () => {
    let isRead = false;
    apiMock.papers.mockImplementation(({ collection = "all" }) => Promise.resolve({
      items: collection === "unread" && isRead ? [] : [{ id: "5", title: "Unread paper", is_favorite: false, is_read: isRead, keywords: [] }],
      total: collection === "unread" ? Number(!isRead) : 1, page: 1, page_size: 20,
      collection_counts: { all: 1, favorites: 0, read: Number(isRead), unread: Number(!isRead) }
    }));
    apiMock.updatePaperState.mockImplementation(async (_id: string, state: { is_favorite: boolean; is_read: boolean }) => { isRead = state.is_read; return state; });
    const user = userEvent.setup();
    render(createElement(Library));
    await user.click(await screen.findByRole("tab", { name: "未读1" }));
    expect(await screen.findByText("Unread paper")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "标记为已读" }));
    expect(await screen.findByText("这个分栏暂无论文。")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "已读1" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "未读0" })).toBeTruthy();
  });
});
