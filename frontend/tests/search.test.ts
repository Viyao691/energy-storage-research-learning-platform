// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquisitionLabel,
  importResultStatus,
  legalFulltextHint,
  openAccessLabel,
  partialSearchWarning,
  safeExternalUrl,
  sourceLabel
} from "../lib/presentation";
import { buildPaperSearchQuery } from "../lib/api";
import SearchPage from "../app/search/page";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    sourceStatuses: vi.fn(),
    searchPapers: vi.fn(),
    importPaper: vi.fn(),
    updatePaperState: vi.fn()
  }
}));

vi.mock("../lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, api: apiMock };
});

const enabledSources = [
  { source: "openalex" as const, enabled: true, ok: true, message: "连接正常" },
  { source: "crossref" as const, enabled: false, ok: false, message: "raw upstream error" },
  { source: "arxiv" as const, enabled: false, ok: false, message: "未启用" },
  { source: "semantic_scholar" as const, enabled: false, ok: false, message: "未启用" }
];

function searchResponse(items: ReturnType<typeof searchPaper>[], total = items.length) {
  return {
    items,
    total_before_pagination: total,
    page: 1,
    page_size: 10,
    warnings: [],
    source_statuses: [enabledSources[0]]
  };
}

function searchPaper(overrides: Record<string, unknown> = {}) {
  return {
    source: "openalex" as const,
    external_id: "W1",
    title: "Safe energy paper",
    authors: ["Ada Chen"],
    first_author: "Ada Chen",
    abstract: "A useful abstract.",
    doi: "10.1000/test",
    arxiv_id: null,
    journal: "Energy Journal",
    published_date: "2025-01-01",
    year: 2025,
    keywords: ["battery"],
    landing_url: "https://example.test/paper",
    pdf_url: null,
    is_open_access: false,
    oa_status: "closed",
    license: null,
    sources: ["openalex" as const],
    candidates: [{ source: "openalex" as const, external_id: "W1" }],
    relevance_score: 60,
    relevance_reasons: ["标题命中"],
    import_source: "openalex" as const,
    import_external_id: "W1",
    already_imported: false,
    paper_id: null,
    article_type: "review",
    citation_count: 0,
    is_favorite: false,
    is_read: false,
    ...overrides
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function readySearchPage() {
  apiMock.sourceStatuses.mockResolvedValue(enabledSources);
  render(createElement(SearchPage));
  await screen.findByRole("checkbox", { name: /OpenAlex/ });
  return screen.getByRole("textbox", { name: "搜索词" });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("buildPaperSearchQuery", () => {
  it("uses repeated sources and omits empty optional filters", () => {
    const query = buildPaperSearchQuery({
      q: " sodium battery ",
      year_from: undefined,
      year_to: "",
      open_access_only: false,
      page: 2,
      page_size: 20,
      sources: ["openalex", "arxiv"]
    });

    expect(query).toBe(
      "q=sodium+battery&open_access_only=false&page=2&page_size=20&sources=openalex&sources=arxiv"
    );
    expect(query).not.toContain("year_from");
    expect(query).not.toContain("year_to");
    expect(query).not.toContain("source=");
  });

  it("forwards AbortSignal to the underlying fetch request", async () => {
    const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => enabledSources
    } as Response);
    const controller = new AbortController();

    await actual.api.sourceStatuses(controller.signal);

    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
    fetchMock.mockRestore();
  });
});

describe("search presentation labels", () => {
  it("renders stable Chinese source, OA, and acquisition labels", () => {
    expect(sourceLabel("semantic_scholar")).toBe("Semantic Scholar");
    expect(sourceLabel("openalex")).toBe("OpenAlex");
    expect(openAccessLabel(true, "gold")).toBe("开放获取 · 金色 OA");
    expect(openAccessLabel(false, "closed")).toBe("非开放获取");
    expect(acquisitionLabel("fulltext")).toBe("已获取合法全文");
    expect(acquisitionLabel("abstract_only")).toBe("仅摘要");
    expect(acquisitionLabel("metadata_only")).toBe("仅元数据");
    expect(acquisitionLabel("download_failed")).toBe("开放全文下载失败（已保留元数据）");
  });
});

describe("partialSearchWarning", () => {
  it("reports failed sources without exposing their raw messages", () => {
    expect(partialSearchWarning(
      [{ source: "crossref", enabled: true, ok: false, message: "token=secret" }],
      ["upstream detail"]
    )).toBe("部分来源暂不可用，结果可能不完整：Crossref");
  });

  it("returns no warning when all selected sources succeeded", () => {
    expect(partialSearchWarning(
      [{ source: "openalex", enabled: true, ok: true, message: "搜索成功" }],
      []
    )).toBeNull();
  });
});

describe("importResultStatus", () => {
  it("distinguishes a new import with a failed optional PDF download", () => {
    expect(importResultStatus({
      created: true,
      paper: { id: 42, acquisition_status: "abstract_only" },
      duplicate_reason: null,
      download_attempted: true,
      download_succeeded: false,
      warning: "开放 PDF 下载失败"
    })).toEqual({
      paperId: 42,
      message: "已入库；开放 PDF 下载失败，已保留论文元数据。",
      warning: true
    });
  });

  it("describes an existing imported paper without claiming a new import", () => {
    expect(importResultStatus({
      created: false,
      paper: { id: 9, acquisition_status: "metadata_only" },
      duplicate_reason: { kind: "source_record", paper_id: 9 },
      download_attempted: false,
      download_succeeded: false,
      warning: null
    })).toEqual({
      paperId: 9,
      message: "该论文已在论文库中。",
      warning: false
    });
  });
});

describe("legalFulltextHint", () => {
  it("offers the publisher landing page without telling the browser to submit a PDF URL", () => {
    expect(legalFulltextHint({
      is_open_access: true,
      pdf_url: "https://files.example.test/paper.pdf",
      landing_url: "https://publisher.example.test/paper"
    })).toBe("检测到开放全文。入库时可由后端尝试合法下载，也可前往来源页面查看。");
  });

  it("does not imply fulltext availability from a landing page alone", () => {
    expect(legalFulltextHint({
      is_open_access: false,
      pdf_url: null,
      landing_url: "https://publisher.example.test/paper"
    })).toBe("当前仅提供论文来源页面，不代表可合法获取全文。");
  });
});

describe("safeExternalUrl", () => {
  it("allows only absolute HTTP(S) links", () => {
    expect(safeExternalUrl("https://publisher.example.test/paper")).toBe("https://publisher.example.test/paper");
    expect(safeExternalUrl("http://publisher.example.test/paper")).toBe("http://publisher.example.test/paper");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,unsafe")).toBeNull();
    expect(safeExternalUrl("file:///tmp/paper.pdf")).toBeNull();
    expect(safeExternalUrl("/relative/paper")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
  });
});

describe("SearchPage interactions", () => {
  it("sorts one fetched result set without another API request", async () => {
    apiMock.searchPapers.mockResolvedValue(searchResponse([
      searchPaper({ title: "Newer paper", external_id: "W2", import_external_id: "W2", citation_count: 4, year: 2025 }),
      searchPaper({ title: "Older cited", external_id: "W1", citation_count: 90, year: 2020 })
    ]));
    const input = await readySearchPage();
    const user = userEvent.setup();

    await user.type(input, "battery");
    await user.click(screen.getByRole("button", { name: "搜索论文" }));
    await screen.findByRole("heading", { name: "Older cited" });
    await user.click(screen.getByRole("combobox", { name: "排序依据" }));
    await user.click(screen.getByRole("option", { name: "引用量" }));
    await user.click(screen.getByRole("combobox", { name: "排序方向" }));
    await user.click(screen.getByRole("option", { name: "降序" }));

    const headings = Array.from(document.querySelectorAll(".search-result h2")).map(node => node.textContent);
    expect(headings).toEqual(["Older cited", "Newer paper"]);
    expect(apiMock.searchPapers).toHaveBeenCalledTimes(1);
  });

  it("shows metadata tags and state buttons only for imported papers", async () => {
    apiMock.searchPapers.mockResolvedValue(searchResponse([
      searchPaper({
        title: "Imported review",
        already_imported: true,
        paper_id: 7,
        keywords: ["钠离子电池", "层状氧化物"],
        is_favorite: true
      }),
      searchPaper({ title: "External paper", external_id: "W2", import_external_id: "W2" })
    ]));
    apiMock.updatePaperState.mockResolvedValue({ is_favorite: false, is_read: false });
    const input = await readySearchPage();
    const user = userEvent.setup();

    await user.type(input, "battery");
    await user.click(screen.getByRole("button", { name: "搜索论文" }));

    expect((await screen.findAllByText("综述")).length).toBeGreaterThan(0);
    expect(screen.getByText("钠离子电池")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "取消收藏" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "标记为已读" })).toHaveLength(1);
  });

  it("renders scientific formulas in result titles and abstracts", async () => {
    apiMock.searchPapers.mockResolvedValue(searchResponse([
      searchPaper({
        title: "Na$_x$TMO$_2$ cathode",
        abstract: "Reaction: $H_2O + CO_2 \\rightarrow H_2CO_3$."
      })
    ]));
    const input = await readySearchPage();
    const user = userEvent.setup();

    await user.type(input, "cathode");
    await user.click(screen.getByRole("button", { name: "搜索论文" }));

    const heading = await waitFor(() => {
      const element = document.querySelector(".search-result h2");
      expect(element).toBeTruthy();
      return element as HTMLElement;
    });
    expect(heading.tagName).toBe("H2");
    expect(heading.querySelector(".katex")).toBeTruthy();
    const abstract = document.querySelector(".result-abstract");
    expect(abstract?.querySelector(".katex")).toBeTruthy();
  });

  it("shows loading then results with accessible controls and only safe external links", async () => {
    const response = deferred<ReturnType<typeof searchResponse>>();
    apiMock.searchPapers.mockReturnValue(response.promise);
    const input = await readySearchPage();
    const user = userEvent.setup();

    await user.type(input, "battery");
    await user.click(screen.getByRole("button", { name: "搜索论文" }));
    expect(screen.getByText("正在从所选来源检索论文…")).toBeTruthy();

    await act(async () => {
      response.resolve(searchResponse([
        searchPaper({ title: "Unsafe paper", landing_url: "javascript:alert(1)" }),
        searchPaper({
          title: "Safe paper",
          external_id: "W2",
          import_external_id: "W2",
          landing_url: "https://publisher.example.test/paper"
        })
      ]));
      await response.promise;
    });

    expect(await screen.findByRole("heading", { name: "Safe paper" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Unsafe paper" })).toBeTruthy();
    const sourceLinks = screen.getAllByRole("link", { name: "前往论文来源页面" });
    expect(sourceLinks).toHaveLength(1);
    expect(sourceLinks[0].getAttribute("href")).toBe("https://publisher.example.test/paper");
    expect(sourceLinks[0].getAttribute("target")).toBe("_blank");
    expect(sourceLinks[0].getAttribute("rel")).toContain("noreferrer");
    expect(screen.getByRole("checkbox", { name: /OpenAlex/ })).toBeTruthy();
  });

  it("renders an empty state after a successful empty search", async () => {
    apiMock.searchPapers.mockResolvedValue(searchResponse([]));
    const input = await readySearchPage();
    const user = userEvent.setup();

    await user.type(input, "battery");
    await user.click(screen.getByRole("button", { name: "搜索论文" }));

    expect(await screen.findByRole("heading", { name: "未找到匹配论文" })).toBeTruthy();
  });

  it("renders a request error but ignores AbortError", async () => {
    apiMock.searchPapers
      .mockRejectedValueOnce(new Error("搜索服务失败"))
      .mockRejectedValueOnce(new DOMException("aborted", "AbortError"));
    const input = await readySearchPage();
    const form = input.closest("form");
    if (!form) throw new Error("search form not found");

    fireEvent.change(input, { target: { value: "first" } });
    fireEvent.submit(form);
    expect((await screen.findByRole("alert")).textContent).toContain("搜索服务失败");

    fireEvent.change(input, { target: { value: "second" } });
    fireEvent.submit(form);
    await waitFor(() => expect(apiMock.searchPapers).toHaveBeenCalledTimes(2));
    await act(async () => {});
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps only the latest overlapping search and the old finally cannot clear loading", async () => {
    const oldRequest = deferred<ReturnType<typeof searchResponse>>();
    const newRequest = deferred<ReturnType<typeof searchResponse>>();
    apiMock.searchPapers
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);
    const input = await readySearchPage();
    const form = input.closest("form");
    if (!form) throw new Error("search form not found");

    fireEvent.change(input, { target: { value: "old query" } });
    fireEvent.submit(form);
    fireEvent.change(input, { target: { value: "new query" } });
    fireEvent.submit(form);
    expect(apiMock.searchPapers).toHaveBeenCalledTimes(2);

    const oldSignal = apiMock.searchPapers.mock.calls[0][1] as AbortSignal;
    expect(oldSignal).toBeInstanceOf(AbortSignal);
    expect(oldSignal.aborted).toBe(true);

    await act(async () => {
      oldRequest.resolve(searchResponse([searchPaper({ title: "Old result" })]));
      await oldRequest.promise;
    });
    expect(screen.queryByRole("heading", { name: "Old result" })).toBeNull();
    expect(screen.getByText("正在从所选来源检索论文…")).toBeTruthy();

    await act(async () => {
      newRequest.resolve(searchResponse([searchPaper({ title: "New result" })]));
      await newRequest.promise;
    });
    expect(await screen.findByRole("heading", { name: "New result" })).toBeTruthy();
  });

  it("aborts source status and active search requests when unmounted", async () => {
    const statusRequest = deferred<typeof enabledSources>();
    apiMock.sourceStatuses.mockReturnValue(statusRequest.promise);
    const statusView = render(createElement(SearchPage));
    await waitFor(() => expect(apiMock.sourceStatuses).toHaveBeenCalledTimes(1));
    const statusSignal = apiMock.sourceStatuses.mock.calls[0][0] as AbortSignal;
    statusView.unmount();
    expect(statusSignal).toBeInstanceOf(AbortSignal);
    expect(statusSignal.aborted).toBe(true);

    apiMock.sourceStatuses.mockResolvedValue(enabledSources);
    const searchRequest = deferred<ReturnType<typeof searchResponse>>();
    apiMock.searchPapers.mockReturnValue(searchRequest.promise);
    const input = await readySearchPage();
    const searchView = screen.getByRole("heading", { name: "论文搜索" }).closest("section");
    if (!searchView) throw new Error("search page not found");
    fireEvent.change(input, { target: { value: "battery" } });
    fireEvent.submit(input.closest("form")!);
    const searchSignal = apiMock.searchPapers.mock.calls[0][1] as AbortSignal;
    cleanup();
    expect(searchSignal).toBeInstanceOf(AbortSignal);
    expect(searchSignal.aborted).toBe(true);
  });

  it("prevents two synchronous imports for the same paper", async () => {
    apiMock.searchPapers.mockResolvedValue(searchResponse([searchPaper()]));
    const importRequest = deferred<unknown>();
    apiMock.importPaper.mockReturnValue(importRequest.promise);
    const input = await readySearchPage();

    fireEvent.change(input, { target: { value: "battery" } });
    fireEvent.submit(input.closest("form")!);
    const button = await screen.findByRole("button", { name: "保存元数据到论文库" });
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(apiMock.importPaper).toHaveBeenCalledTimes(1);
    const importSignal = apiMock.importPaper.mock.calls[0][1] as AbortSignal;
    expect(importSignal).toBeInstanceOf(AbortSignal);
  });
});
