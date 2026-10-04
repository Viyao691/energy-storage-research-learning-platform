// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DiagnosticsPage from "../app/diagnostics/page";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    health: vi.fn(),
    diagnostics: vi.fn()
  }
}));

vi.mock("../lib/api", async importOriginal => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, api: apiMock };
});

const diagnosticPayload = {
  frontend: { status: "unknown", message: "前端由 localhost:3000 提供" },
  backend: { status: "ok", message: "服务正常" },
  database: { status: "ok", message: "数据库正常" },
  model_api: { status: "not_configured", message: "尚未配置模型 API 密钥" },
  academic_search: {
    status: "degraded",
    message: "1/2 个已启用学术来源连接正常",
    sources: [
      { source: "openalex", enabled: true, ok: true, message: "连接正常" },
      { source: "crossref", enabled: true, ok: false, message: "来源暂不可用" },
      { source: "arxiv", enabled: false, ok: false, message: "未启用" },
      {
        source: "semantic_scholar",
        enabled: false,
        ok: false,
        message: "未启用",
        key_configured: false
      }
    ]
  },
  pdf_storage: { status: "ok", message: "存储可写" },
  scheduler: { status: "not_configured", message: "Phase 4 配置" },
  email: { status: "not_configured", message: "尚未配置邮件服务" },
  redis: { status: "ok", message: "未配置时使用本地能力" },
  worker: { status: "ok", message: "本地同步能力" },
  storage: { status: "ok", message: "本地存储可写" },
  backups: { status: "ok", message: "可用备份 1 份" }
};

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.health.mockResolvedValue({ status: "ok", database: "ok" });
  apiMock.diagnostics.mockResolvedValue(diagnosticPayload);
});

afterEach(() => {
  cleanup();
});

describe("DiagnosticsPage", () => {
  it("shows the aggregate and every academic source in Chinese", async () => {
    render(createElement(DiagnosticsPage));

    expect(await screen.findByText("1/2 个已启用学术来源连接正常")).toBeTruthy();
    expect(screen.getByText("部分可用")).toBeTruthy();
    expect(screen.getByText("OpenAlex")).toBeTruthy();
    expect(screen.getByText("Crossref")).toBeTruthy();
    expect(screen.getByText("arXiv")).toBeTruthy();
    expect(screen.getByText("Semantic Scholar")).toBeTruthy();
    expect(screen.getByText("未启用 · 密钥未配置")).toBeTruthy();
  });

  it("passes abort signals and aborts both checks on unmount", async () => {
    let healthSignal: AbortSignal | undefined;
    let diagnosticsSignal: AbortSignal | undefined;
    apiMock.health.mockImplementation((signal?: AbortSignal) => {
      healthSignal = signal;
      return new Promise(() => undefined);
    });
    apiMock.diagnostics.mockImplementation((signal?: AbortSignal) => {
      diagnosticsSignal = signal;
      return new Promise(() => undefined);
    });

    const view = render(createElement(DiagnosticsPage));
    expect(await screen.findByText("正在执行连接检查…")).toBeTruthy();
    view.unmount();

    expect(healthSignal?.aborted).toBe(true);
    expect(diagnosticsSignal?.aborted).toBe(true);
  });
});
