// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ClaimsPanel } from "../components/papers/ClaimsPanel";
import { usePaperDetail } from "../components/papers/usePaperDetail";

const mocks = vi.hoisted(() => ({
  paper: vi.fn().mockResolvedValue({ paper: { id: "7", title: "Research", acquisition_status: "abstract" }, analysis: null, note: "" }),
  claims: vi.fn().mockResolvedValue({ items: [] }),
  rebuildClaims: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }), useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock("../lib/api", () => ({ api: mocks }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function ClaimsHarness() {
  const detail = usePaperDetail();
  return <ClaimsPanel claims={detail.claims} claimsBusy={detail.claimsBusy}
    claimsFeedback={detail.claimsFeedback} claimsError={detail.claimsError}
    rebuildClaims={detail.rebuildClaims} selectEvidence={detail.selectEvidence} />;
}

it("shows mapping progress and embedding errors inside the evidence panel", async () => {
  let rejectRequest!: (error: Error) => void;
  mocks.rebuildClaims.mockReturnValue(new Promise((_, reject) => { rejectRequest = reject; }));
  render(<ClaimsHarness />);
  await waitFor(() => expect(mocks.claims).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: "建立或更新映射" }));
  expect(screen.getByRole("button", { name: /正在准备本篇索引/ }).hasAttribute("disabled")).toBe(true);
  await act(async () => rejectRequest(new Error("无法连接 Ollama 嵌入服务，请确认 Ollama 已启动")));
  expect(screen.getByRole("alert").textContent).toContain("Ollama");
  expect(screen.getByRole("button", { name: "建立或更新映射" }).hasAttribute("disabled")).toBe(false);
  mocks.rebuildClaims.mockResolvedValue({ items: [] });
  fireEvent.click(screen.getByRole("button", { name: "建立或更新映射" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("未找到"));
  expect(screen.queryByRole("alert")).toBeNull();
});
