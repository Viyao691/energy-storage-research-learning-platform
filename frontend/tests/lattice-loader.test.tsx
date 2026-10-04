// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LatticeLoader from "../components/react-bits/LatticeLoader";

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("LatticeLoader", () => {
  it("runs a stopwatch, freezes on completion, and resets for a retry", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const view = render(<LatticeLoader status="working" label="正在分析" doneLabel="分析完成" errorLabel="分析失败" />);
    act(() => vi.advanceTimersByTime(1250));
    expect(view.container.querySelector(".lattice-loader__timer")?.textContent).toBe("1.2s");
    view.rerender(<LatticeLoader status="done" label="正在分析" doneLabel="分析完成" errorLabel="分析失败" />);
    expect(view.container.querySelector('[role="status"]')?.getAttribute("aria-label")).toContain("分析完成");
    const frozen = view.container.querySelector(".lattice-loader__timer")?.textContent;
    act(() => vi.advanceTimersByTime(1500));
    expect(view.container.querySelector(".lattice-loader__timer")?.textContent).toBe(frozen);
    view.rerender(<LatticeLoader status="working" label="正在分析" doneLabel="分析完成" errorLabel="分析失败" />);
    expect(view.container.querySelector(".lattice-loader__timer")?.textContent).toBe("0.0s");
    act(() => vi.advanceTimersByTime(500));
    expect(view.container.querySelector(".lattice-loader__timer")?.textContent).toBe("0.5s");
  });

  it("stops on error, honors controlled elapsed, and cleans up its timer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const view = render(<LatticeLoader status="working" elapsed={2.5} />);
    expect(view.container.querySelector(".lattice-loader__timer")?.textContent).toBe("2.5s");
    expect(vi.getTimerCount()).toBe(0);
    view.rerender(<LatticeLoader status="error" elapsed={2.5} errorLabel="处理失败" />);
    expect(view.container.querySelector('[role="status"]')?.getAttribute("aria-label")).toContain("处理失败");
    view.rerender(<LatticeLoader status="working" />);
    expect(vi.getTimerCount()).toBe(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
