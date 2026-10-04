// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Paper } from "../lib/api";
import { PdfWorkspace } from "../components/papers/PdfWorkspace";
import PaperDetail from "../app/papers/[id]/page";

const detailMock = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));

const apiMocks = vi.hoisted(() => ({
  paperFileUrl: vi.fn((_id: string, _variant: string) => "/papers/7/file"),
  pageImageUrl: vi.fn((_id: string, page: number) => `/pages/${page}/image`),
}));

vi.mock("../lib/api", () => ({ api: apiMocks }));
vi.mock("../components/papers/usePaperDetail", () => ({ usePaperDetail: () => detailMock.current }));
vi.mock("../components/ConfirmDeleteButton", () => ({ ConfirmDeleteButton: () => <button type="button">删除论文</button> }));
vi.mock("../components/papers/PaperFollowUp", () => ({ PaperFollowUp: () => <section aria-label="论文追问">论文追问</section> }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function Reader({ pageCount, initialPage = 1 }: { pageCount: number; initialPage?: number }) {
  const [page, setPage] = React.useState(initialPage);
  return <PdfWorkspace
    id="7"
    paper={{ id: "7", title: "Test paper", page_count: pageCount, ocr_available: false } as Paper}
    hasLocalPdf
    pdfVariant="original"
    setPdfVariant={vi.fn()}
    currentPage={page}
    boundedCurrentPage={page}
    setCurrentPage={setPage}
    ocrRuns={[]}
    ocrBusy={false}
    startOcr={vi.fn()}
    enhanceCurrentPage={vi.fn()}
    visuals={[]}
    visualMessage=""
    selectedVisualId={null}
    setSelectedVisualId={vi.fn()}
    parserStatus={null}
    parseCandidates={[]}
    parseComparison={null}
    parseCandidateBusy={false}
    startParseCandidate={vi.fn()}
    compareParseCandidate={vi.fn()}
    activateParseCandidate={vi.fn()}
    cancelParseCandidate={vi.fn()}
    selectedEvidence={null}
    evidenceMessage=""
  />;
}

describe("refined PDF reader", () => {
  it("shows at most five real nearby page images and changes the selected PDF page", () => {
    render(<Reader pageCount={12} initialPage={6} />);
    const rail = screen.getByRole("navigation", { name: "PDF 页面缩略图" });
    expect(rail.querySelectorAll("img")).toHaveLength(5);
    expect(Array.from(rail.querySelectorAll("img"), image => image.getAttribute("src"))).toEqual([
      "/pages/4/image", "/pages/5/image", "/pages/6/image", "/pages/7/image", "/pages/8/image"
    ]);
    fireEvent.click(screen.getByRole("button", { name: "跳转到第 8 页" }));
    expect(screen.getByTitle("PDF 阅读器").getAttribute("src")).toContain("#page=8");
    expect(screen.getByRole("button", { name: "跳转到第 8 页" }).getAttribute("aria-current")).toBe("page");
  });

  it("keeps page thumbnails inside document boundaries and shows a page number on image failure", () => {
    render(<Reader pageCount={2} />);
    const rail = screen.getByRole("navigation", { name: "PDF 页面缩略图" });
    expect(rail.querySelectorAll("img")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "跳转到第 3 页" })).toBeNull();
    fireEvent.error(screen.getByAltText("第 1 页缩略图"));
    expect(screen.getByText("第 1 页图像不可用")).toBeTruthy();
    expect(screen.getByRole("button", { name: "跳转到第 1 页" })).toBeTruthy();
  });

  it("keeps PDF tools collapsed until requested", () => {
    render(<Reader pageCount={1} />);
    const tools = screen.getByText("PDF 版本与解析工具").closest("details");
    expect(tools?.hasAttribute("open")).toBe(false);
    expect(tools?.querySelector("button")?.textContent).toContain("原件");
  });

  it("places the report before follow-up in the reading panel", () => {
    detailMock.current = {
      id: "7", router: { push: vi.fn() },
      paper: { id: "7", title: "Test paper", acquisition_status: "metadata_only", abstract: "Abstract" },
      note: "", setNote: vi.fn(), claims: [], claimsBusy: false, currentPage: 1,
      setCurrentPage: vi.fn(), message: "", busy: false, activeTab: "summary", hasLocalPdf: false,
      authors: "Author", boundedCurrentPage: 1, selectedVisual: null,
      pdfVariant: "original", setPdfVariant: vi.fn(), ocrRuns: [], ocrBusy: false,
      visuals: [], visualMessage: "", selectedVisualId: null, setSelectedVisualId: vi.fn(),
      parserStatus: null, parseCandidates: [], parseComparison: null, parseCandidateBusy: false,
      selectedEvidence: null, evidenceMessage: "", analysis: null, setActiveTab: vi.fn(),
    };
    render(<PaperDetail />);
    const report = screen.getByRole("heading", { name: "研读报告" });
    const followUp = screen.getByRole("region", { name: "论文追问" });
    expect(report.compareDocumentPosition(followUp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByTitle("PDF 阅读器")).toBeNull();
  });
});
