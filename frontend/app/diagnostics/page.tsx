"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";

import React, { useEffect, useRef, useState } from "react";
import {
  api,
  Diagnostics as DiagnosticsResponse,
  SourceStatus
} from "../../lib/api";
import { sourceLabel } from "../../lib/presentation";
import { WorkspaceHeader } from "../../components/WorkspacePrimitives";
import "../../components/workspace/system-refinement.css";

type DiagnosticKey = keyof DiagnosticsResponse;
type Check = {
  key: DiagnosticKey;
  name: string;
  status?: string;
  message?: string;
  sources?: SourceStatus[];
};

const labels: Record<DiagnosticKey, string> = {
  frontend: "前端状态",
  backend: "后端状态",
  database: "数据库状态",
  model_api: "模型 API 状态",
  academic_search: "学术搜索接口状态",
  pdf_storage: "PDF 存储状态",
  scheduler: "定时任务状态",
  email: "邮件服务状态",
  redis: "Redis 队列状态",
  worker: "后台任务状态",
  storage: "受管存储状态",
  backups: "备份状态"
};

const statusLabels: Record<string, string> = {
  ok: "正常",
  degraded: "部分可用",
  error: "异常",
  not_configured: "未配置",
  unknown: "未知"
};

function statusLabel(status?: string): string {
  return statusLabels[status || "unknown"] || status || "未知";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function sourceMessage(source: SourceStatus): string {
  if (source.source !== "semantic_scholar") return source.message;
  const credential = source.key_configured ? "密钥已配置" : "密钥未配置";
  return `${source.message} · ${credential}`;
}

export default function DiagnosticsPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const activeRequest = useRef<AbortController | null>(null);

  async function load() {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setError("");
    setLoading(true);
    setChecks([]);
    try {
      const [health, diagnostic] = await Promise.all([
        api.health(controller.signal),
        api.diagnostics(controller.signal)
      ]);
      if (controller.signal.aborted) return;
      const rows = (Object.keys(labels) as DiagnosticKey[]).map(key => ({
        key,
        name: labels[key],
        status: diagnostic[key].status,
        message: diagnostic[key].message,
        sources: key === "academic_search"
          ? diagnostic.academic_search.sources
          : undefined
      }));
      rows[0] = {
        ...rows[0],
        status: "ok",
        message: "页面已正常加载"
      };
      rows[1] = {
        ...rows[1],
        status: health.status || rows[1].status || "unknown",
        message: health.status === "ok"
          ? "后端健康检查可访问"
          : rows[1].message
      };
      setChecks(rows);
    } catch (requestError) {
      if (controller.signal.aborted || isAbortError(requestError)) return;
      setChecks([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "无法连接后端"
      );
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void load();
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, []);

  const statusCounts = {
    ok: checks.filter(check => check.status === "ok").length,
    degraded: checks.filter(check => check.status === "degraded").length,
    error: checks.filter(check => check.status === "error").length,
    not_configured: checks.filter(check => check.status === "not_configured").length,
    unknown: checks.filter(check => !check.status || !["ok", "degraded", "error", "not_configured"].includes(check.status)).length
  };

  return (
    <section className="editorial-page diagnostics-page system-refined">
      <WorkspaceHeader eyebrow="SYSTEM · HEALTH" title="连接诊断"  artwork action={<button onClick={() => void load()} disabled={loading}>{loading ? "检查中…" : "重新检查"}</button>} />
      {error && <p className="error" role="alert">{error}</p>}
      <section className="system-status-overview" aria-label="检查状态分布" aria-live="polite">
        {([
          ["ok", "正常"], ["degraded", "部分可用"], ["error", "异常"],
          ["not_configured", "未配置"], ["unknown", "未知"]
        ] as const).map(([status, label]) => <div className={`system-status-count status-${status}`} key={status}><strong>{loading || error ? "—" : statusCounts[status]}</strong><span>{label}</span></div>)}
      </section>
      <div className="card system-diagnostic-panel" aria-live="polite">
        <div className="system-panel-heading"><span className="system-panel-glyph" aria-hidden="true">⌁</span><div><small>LIVE CHECKS</small><h2>服务状态矩阵</h2></div></div>
        {loading && <LatticeLoader label="正在执行连接检查…" showTimer />}
        {error && <p className="muted">本次检查未完成，暂无可展示的服务状态。</p>}
        <div className="system-diagnostic-grid">
        {checks.map(check => (
          <article className={`paper system-check status-${check.status || "unknown"}`} key={check.key}>
            <div className="row">
              <strong>{check.name}</strong>
              <span className="status"><span className="system-status-dot" aria-hidden="true" />{statusLabel(check.status)}</span>
            </div>
            <p className="muted">{check.message || "无额外信息"}</p>
            {check.sources && (
              <div className="diagnostic-sources">
                {check.sources.map(source => (
                  <div className="diagnostic-source" key={source.source}>
                    <strong>{sourceLabel(source.source)}</strong>
                    <span className={source.ok ? "source-ok" : "muted"}>
                      {sourceMessage(source)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
        </div>
      </div>
    </section>
  );
}
