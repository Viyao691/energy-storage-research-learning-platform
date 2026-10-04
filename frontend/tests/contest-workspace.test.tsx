// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ContestsPage from "../app/contests/page";
import HelpPage from "../app/help/page";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    listContests: vi.fn(),
    createContest: vi.fn(),
  },
}));

vi.mock("../lib/api", async original => ({
  ...(await original<typeof import("../lib/api")>()),
  api: apiMock,
}));

describe("Contest workspace", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.listContests.mockResolvedValue({ items: [] });
    apiMock.createContest.mockResolvedValue({
      id: 7,
      title: "钠离子电池创新项目",
      competition_name: "挑战杯",
      summary: "",
      research_question: "",
      innovation: "",
      method: "",
      evidence: "",
      feasibility: "",
      expected_outcomes: "",
      risks: "",
      resources: "",
      created_at: "2026-08-24T00:00:00",
      updated_at: "2026-08-24T00:00:00",
    });
  });

  it("creates a contest project and exposes the project workspace", async () => {
    render(<ContestsPage />);
    await userEvent.type(await screen.findByLabelText("项目名称"), "钠离子电池创新项目");
    await userEvent.type(screen.getByLabelText("竞赛名称"), "挑战杯");
    await userEvent.click(screen.getByRole("button", { name: "创建项目" }));
    expect(apiMock.createContest).toHaveBeenCalledWith({ title: "钠离子电池创新项目", competition_name: "挑战杯" });
    expect((await screen.findByRole("link", { name: /进入项目/ })).getAttribute("href")).toBe("/contests/7");
  });

  it("documents rule confirmation, deterministic timeline and defense boundaries", () => {
    render(<HelpPage />);
    expect(screen.getByRole("heading", { name: "科研创新竞赛工作区", level: 2 })).toBeTruthy();
    expect(screen.getByText(/人工确认后.*权威规则/)).toBeTruthy();
    expect(screen.getByText(/时间表只使用已确认日期和手动里程碑/)).toBeTruthy();
    expect(screen.getByText(/文字答辩.*录音答辩/)).toBeTruthy();
  });
});
