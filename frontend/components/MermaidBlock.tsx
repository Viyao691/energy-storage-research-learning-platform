"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import "./mermaid-block.css";
import { normalizeMermaidChemicalLabels, stripMermaidPageReferences } from "../lib/scientificMarkdown";

type MermaidBlockProps = {
  code: string;
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

function quoteFlowchartPipeLabels(source: string): string {
  if (!/^\s*(?:flowchart|graph)\s/m.test(source)) return source;
  return source.replace(/(\b[A-Za-z_][\w-]*\[)([^\[\]"\n]*\|[^\[\]"\n]*)(\])/g, (_match, start: string, label: string, end: string) => `${start}"${label}"${end}`);
}

/**
 * Renders a ```mermaid fenced code block into an SVG diagram on the client.
 * Offers zoom controls for small mindmaps / dense flowcharts and falls back
 * to showing the source code when rendering fails (e.g. invalid diagram
 * syntax), so reports never crash on a bad Mermaid snippet.
 */
export function MermaidBlock({ code }: MermaidBlockProps) {
  code = quoteFlowchartPipeLabels(stripMermaidPageReferences(normalizeMermaidChemicalLabels(code)));
  const scalerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(1);
  const [dark, setDark] = useState(false);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  useEffect(() => {
    const updateTheme = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError("");
    setReady(false);
    setScale(1);
    if (scalerRef.current) scalerRef.current.innerHTML = "";
    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          themeVariables: {
            fontSize: "16px",
            primaryColor: dark ? "#173b50" : "#eaf7fa",
            primaryTextColor: dark ? "#f0f8fb" : "#163c50",
            primaryBorderColor: dark ? "#74b9ca" : "#73b4c4",
            lineColor: dark ? "#92d2e0" : "#34788c",
            secondaryColor: dark ? "#194459" : "#eff8fc",
            tertiaryColor: dark ? "#123247" : "#f8fcfd",
            edgeLabelBackground: dark ? "#123247" : "#ffffff",
            clusterBkg: dark ? "#102c3e" : "#f4fafb",
            clusterBorder: dark ? "#5b9bad" : "#a7cbd4",
          },
          fontFamily: '"Microsoft YaHei", Arial, sans-serif',
          flowchart: {
            nodeSpacing: 32,
            rankSpacing: 40,
            wrappingWidth: 320,
            curve: "linear",
            useMaxWidth: false,
            padding: 12,
          },
          mindmap: {
            padding: 16,
          },
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, code);
        if (cancelled || !scalerRef.current) return;
        scalerRef.current.innerHTML = svg;
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code, dark, id]);

  return (
    <div className="mermaid-block-wrap">
      {error && <div className="mermaid-block mermaid-error" role="note">
        <p className="muted">图表渲染失败（保留源码）：</p>
        <pre><code>{code}</code></pre>
      </div>}
      {ready && (
        <div className="mermaid-block-toolbar" aria-label="图表缩放">
          <button
            type="button"
            className="secondary"
            aria-label="放大图表"
            onClick={() => setScale(value => Math.min(MAX_SCALE, +(value + SCALE_STEP).toFixed(2)))}
          >
            ＋
          </button>
          <button
            type="button"
            className="secondary"
            aria-label="缩小图表"
            onClick={() => setScale(value => Math.max(MIN_SCALE, +(value - SCALE_STEP).toFixed(2)))}
          >
            －
          </button>
          <button
            type="button"
            className="secondary"
            aria-label="重置图表缩放"
            onClick={() => setScale(1)}
          >
            重置
          </button>
          <span className="mermaid-block-scale" aria-live="polite">{Math.round(scale * 100)}%</span>
        </div>
      )}
      <div
        className="mermaid-block"
        hidden={Boolean(error)}
        aria-label="流程图 / 思维导图"
        data-mermaid-ready={ready ? "true" : "false"}
        data-mermaid-scale={scale}
      >
        <div
          ref={scalerRef}
          className="mermaid-block-scaler"
          style={{ zoom: scale }}
        />
      </div>
    </div>
  );
}
