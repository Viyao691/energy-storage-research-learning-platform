// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { ResearchRun } from "../lib/api";
import { getResearchTopic, TopicArtwork } from "../components/workspace/TopicArtwork";
import { ResearchRunChart } from "../components/workspace/ResearchRunChart";

const run = (id: number, started_at: string, discovered_count = 0, recommended_count = 0): ResearchRun => ({
  id, subscription_id: 1, status: "success", started_at, completed_at: null,
  discovered_count, recommended_count, source_statuses: [], warnings: [], error: null,
});

describe("research topic artwork", () => {
  it("matches specific chemistry before broader storage words", () => {
    expect(getResearchTopic("NASICON sodium energy storage").key).toBe("nasicon");
    expect(getResearchTopic("钠离子储能").key).toBe("sodium");
    expect(getResearchTopic("solid electrolyte").key).toBe("solid");
    expect(getResearchTopic("hydrogen production").key).toBe("hydrogen");
    expect(getResearchTopic("battery recycling").key).toBe("recycling");
    expect(getResearchTopic("grid-scale storage").key).toBe("grid");
    expect(getResearchTopic("electrochemical impedance").key).toBe("general");
  });

  it("uses the neutral document symbol when the topic is not recognized", () => {
    const { container } = render(<TopicArtwork text="electrochemical impedance" />);
    expect(container.querySelector(".topic-artwork-general svg")).toBeTruthy();
    expect(screen.getByText("研究主题 · 主题示意")).toBeTruthy();
  });
});

describe("research run chart", () => {
  it("renders a designed empty state without invalid geometry", () => {
    const { container } = render(<ResearchRunChart runs={[]} />);
    expect(screen.getByText("还没有可展示的运行记录")).toBeTruthy();
    expect(container.querySelector(".research-run-chart-svg")).toBeNull();
  });

  it("keeps a single real record visible and ignores invalid timestamps", () => {
    const { container } = render(<ResearchRunChart runs={[run(1, "not-a-date", 8, 3), run(2, "2026-02-03T10:12:00Z", 5, 2)]} />);
    expect(container.querySelectorAll(".research-run-point")).toHaveLength(2);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    const point = container.querySelector(".research-run-point")!;
    fireEvent.focus(point);
    expect(container.querySelector(".research-run-chart-tooltip")?.textContent).toContain("发现 5 篇");
    expect(container.querySelectorAll(".research-run-axis-label").length).toBe(new Set(Array.from(container.querySelectorAll(".research-run-axis-label"), tick => tick.textContent)).size);
  });

  it("sorts valid runs chronologically and exposes counts and timestamps on focusable points", () => {
    const { container } = render(<ResearchRunChart runs={[run(2, "2026-02-03T10:12:00Z", 5, 2), run(1, "2026-01-01T09:00:00Z", 8, 3)]} />);
    const labels = Array.from(container.querySelectorAll("circle")).map(point => point.getAttribute("aria-label"));
    expect(labels[0]).toMatch(/01\/01/);
    expect(labels[2]).toMatch(/02\/03/);
    expect(container.querySelector("circle")?.getAttribute("tabindex")).toBe("0");
    expect(container.querySelector(".research-run-chart-note")).toBeNull();
  });

  it("keeps all points for twenty records while thinning date labels to six", () => {
    const runs = Array.from({ length: 20 }, (_, index) => run(index + 1, new Date(Date.UTC(2026, 0, index + 1, 9)).toISOString(), index, Math.floor(index / 2)));
    const { container } = render(<ResearchRunChart runs={runs} />);
    expect(container.querySelectorAll(".research-run-point")).toHaveLength(40);
    expect(container.querySelectorAll(".research-run-date-label")).toHaveLength(6);
    const xPositions = Array.from(container.querySelectorAll(".research-run-point-discovered"), point => point.getAttribute("cx"));
    expect(new Set(xPositions).size).toBe(20);
  });

  it("fits the viewBox to a narrow panel and shows at most four date labels", async () => {
    vi.stubGlobal("ResizeObserver", class {
      callback: ResizeObserverCallback;
      constructor(callback: ResizeObserverCallback) { this.callback = callback; }
      observe() { this.callback([{ contentRect: { width: 320 } } as ResizeObserverEntry], this as unknown as ResizeObserver); }
      disconnect() {}
    });
    const runs = Array.from({ length: 20 }, (_, index) => run(index + 1, new Date(Date.UTC(2026, 0, index + 1)).toISOString(), index, 2));
    const { container, unmount } = render(<ResearchRunChart runs={runs} />);
    await waitFor(() => expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 320 220"));
    expect(container.querySelectorAll(".research-run-point")).toHaveLength(40);
    expect(container.querySelectorAll(".research-run-date-label")).toHaveLength(4);
    expect(container.querySelector(".research-run-gridline")?.getAttribute("x2")).toBe(Array.from(container.querySelectorAll(".research-run-point-discovered")).at(-1)?.getAttribute("cx"));
    unmount();
    vi.unstubAllGlobals();
  });

  it("uses distinct accessible ids when multiple charts are rendered", () => {
    const { container } = render(<><ResearchRunChart runs={[]} /><ResearchRunChart runs={[]} /></>);
    const ids = Array.from(container.querySelectorAll("h2")).map(heading => heading.id);
    expect(new Set(ids).size).toBe(2);
  });
});
