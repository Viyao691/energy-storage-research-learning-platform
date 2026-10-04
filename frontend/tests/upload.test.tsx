// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import UploadPage from "../app/upload/page";
import nextConfig from "../next.config";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    upload: vi.fn()
  }
}));

vi.mock("../lib/api", () => ({
  api: apiMock
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PDF upload limits", () => {
  it("rejects a PDF larger than 30MB before calling the upload API", async () => {
    const user = userEvent.setup();
    const oversizedPdf = new File(["%PDF-1.7"], "oversized.pdf", {
      type: "application/pdf"
    });
    Object.defineProperty(oversizedPdf, "size", {
      configurable: true,
      value: 30 * 1024 * 1024 + 1
    });

    render(<UploadPage />);
    await user.upload(screen.getByLabelText("选择 PDF"), oversizedPdf);

    expect(screen.getByRole("alert").textContent).toContain(
      "PDF 文件超过 30MB 限制"
    );
    expect(apiMock.upload).not.toHaveBeenCalled();
  });

  it("configures the Next.js proxy to accept a 30MB request body", () => {
    const config = nextConfig as {
      experimental?: { middlewareClientMaxBodySize?: number };
    };

    expect(config.experimental?.middlewareClientMaxBodySize).toBe(
      30 * 1024 * 1024
    );
  });

  it("validates a dropped file and shows the selected file size", () => {
    const invalid = new File(["plain text"], "notes.txt", { type: "text/plain" });
    const pdf = new File(["%PDF-1.7"], "research.pdf", { type: "application/pdf" });
    render(<UploadPage />);

    const dropzone = screen.getByTestId("pdf-dropzone");
    fireEvent.drop(dropzone, { dataTransfer: { files: [invalid] } });
    expect(screen.getByRole("alert").textContent).toContain("仅支持 PDF");
    fireEvent.drop(dropzone, { dataTransfer: { files: [pdf] } });
    expect(screen.getByText("research.pdf")).toBeTruthy();
    expect(screen.getByText(/8 B/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("locks selection during upload and allows resetting after success", async () => {
    let finishUpload!: (value: { id: number; title: string }) => void;
    apiMock.upload.mockImplementation(() => new Promise(resolve => { finishUpload = resolve; }));
    const user = userEvent.setup();
    const pdf = new File(["%PDF-1.7"], "research.pdf", { type: "application/pdf" });
    render(<UploadPage />);
    await user.upload(screen.getByLabelText("选择 PDF"), pdf);
    await user.click(screen.getByRole("button", { name: "上传并解析" }));

    expect(screen.getByLabelText("选择 PDF")).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "上传并解析" })).toHaveProperty("disabled", true);
    finishUpload({ id: 42, title: "Research result" });
    expect(await screen.findByRole("link", { name: "Research result" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "重新选择" }));
    expect(screen.queryByText("research.pdf")).toBeNull();
  });
});
