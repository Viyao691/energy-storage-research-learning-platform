// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FormulaResult } from "../components/papers/FormulaResult";
afterEach(cleanup);
it("requires an explicit append and labels local transcription as unverified", () => {
  const append = vi.fn();
  render(<FormulaResult latex={String.raw`Q=\frac{It}{m}`} append={append} />);
  expect(append).not.toHaveBeenCalled();
  expect(screen.getByText(/未经人工核验/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", {name: "追加公式到笔记草稿"}));
  expect(append).toHaveBeenCalledOnce();
});
