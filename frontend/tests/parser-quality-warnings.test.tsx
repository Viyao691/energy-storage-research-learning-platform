// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ParseCandidateControls } from "../components/papers/ParseCandidateControls";
import type { ParseCandidate } from "../lib/api";

afterEach(cleanup);

it("shows parser limitations rather than presenting completion as accuracy", () => {
  render(<ParseCandidateControls status={null} busy={false} comparison={null}
    candidates={[{
      id: 1, status: "completed", engine_version: "2.123.1", progress: 1,
      warnings: ["公式结构尚未核验"], error_message: ""
    } as ParseCandidate]}
    start={vi.fn()} compare={vi.fn()} activate={vi.fn()} cancel={vi.fn()} />);
  expect(screen.getByText("公式结构尚未核验")).toBeTruthy();
  expect(screen.getByText(/文本覆盖不等于解析准确率/)).toBeTruthy();
});
