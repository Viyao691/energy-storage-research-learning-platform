import React, { useEffect, useId, useRef, useState } from "react";
import type { ResearchRun } from "../../lib/api";
import "./visual-data.css";

const height = 220;
const left = 44;
const right = 18;
const top = 18;
const bottom = 42;
const statusLabel = (status: string) => status === "success" ? "成功" : status === "partial" ? "部分可用" : status === "no_new_results" ? "无新增结果" : status === "running" ? "运行中" : "失败";

function dateLabel(value: Date, withTime = false) {
  return new Intl.DateTimeFormat("zh-CN", withTime
    ? { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }
    : { month: "2-digit", day: "2-digit" }).format(value);
}

export function ResearchRunChart({ runs }: { runs: ResearchRun[] }) {
  const id = useId();
  const chartRef = useRef<HTMLElement>(null);
  const [chartWidth, setChartWidth] = useState(760);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  useEffect(() => {
    const node = chartRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width && Number.isFinite(width)) setChartWidth(Math.round(width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const valid = runs.map(run => ({ run, date: new Date(run.started_at) })).filter(item => Number.isFinite(item.date.getTime())).sort((a, b) => a.date.getTime() - b.date.getTime());
  const plotWidth = chartWidth - left - right;
  const plotHeight = height - top - bottom;
  const dataMax = Math.max(0, ...valid.flatMap(({ run }) => [run.discovered_count, run.recommended_count]));
  const scaleMax = Math.max(1, dataMax);
  const yTicks = [...new Set([0, 0.25, 0.5, 0.75, 1].map(fraction => Math.round(dataMax * fraction)))].sort((a, b) => a - b);
  const x = (index: number) => valid.length < 2 ? left + plotWidth / 2 : left + (index / (valid.length - 1)) * plotWidth;
  const y = (count: number) => top + plotHeight - (count / scaleMax) * plotHeight;
  const discovered = valid.map((item, index) => `${index ? "L" : "M"}${x(index)},${y(item.run.discovered_count)}`).join(" ");
  const recommended = valid.map((item, index) => `${index ? "L" : "M"}${x(index)},${y(item.run.recommended_count)}`).join(" ");
  const labelLimit = chartWidth < 420 ? 4 : 6;
  const visibleDateIndexes = valid.length <= labelLimit ? valid.map((_, index) => index) : Array.from({ length: labelLimit }, (_, index) => Math.round(index * (valid.length - 1) / (labelLimit - 1)));
  const activeRun = valid.find(({ run }) => run.id === activeRunId);
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  return <section ref={chartRef} className="research-run-chart" aria-labelledby={titleId}>
    <div className="research-run-chart-heading"><div><p className="research-run-chart-kicker">订阅运行数据</p><h2 id={titleId}>每次运行的检索结果</h2></div>
      <div className="research-run-chart-legend"><span><i className="research-run-key research-run-key-discovered" />发现</span><span><i className="research-run-key research-run-key-recommended" />推荐</span></div>
    </div>
    {valid.length ? <svg className="research-run-chart-svg" viewBox={`0 0 ${chartWidth} ${height}`} role="group" aria-labelledby={`${titleId} ${descId}`}>
      <desc id={descId}>订阅每次运行的发现与推荐数量，按开始时间排列。</desc>
      {yTicks.map(count => {
        const gy = y(count);
        return <g key={count}><line x1={left} x2={chartWidth - right} y1={gy} y2={gy} className="research-run-gridline" /><text x={left - 9} y={gy + 4} textAnchor="end" className="research-run-axis-label">{count}</text></g>;
      })}
      <path d={discovered} className="research-run-line research-run-line-discovered" />
      <path d={recommended} className="research-run-line research-run-line-recommended" />
      {valid.map(({ run, date }, index) => <g key={run.id}>
        {visibleDateIndexes.includes(index) && <text x={x(index)} y={height - 26} textAnchor="middle" className="research-run-date-label">{dateLabel(date)}</text>}
        <circle cx={x(index)} cy={y(run.discovered_count)} r="5" className="research-run-point research-run-point-discovered" tabIndex={0} aria-label={`${dateLabel(date, true)}，${statusLabel(run.status)}，发现 ${run.discovered_count} 篇`} onFocus={() => setActiveRunId(run.id)} onBlur={() => setActiveRunId(null)} onMouseEnter={() => setActiveRunId(run.id)} onMouseLeave={() => setActiveRunId(null)}><title>{`${dateLabel(date, true)} · ${statusLabel(run.status)} · 发现 ${run.discovered_count} 篇`}</title></circle>
        <circle cx={x(index)} cy={y(run.recommended_count)} r="5" className="research-run-point research-run-point-recommended" tabIndex={0} aria-label={`${dateLabel(date, true)}，${statusLabel(run.status)}，推荐 ${run.recommended_count} 篇`} onFocus={() => setActiveRunId(run.id)} onBlur={() => setActiveRunId(null)} onMouseEnter={() => setActiveRunId(run.id)} onMouseLeave={() => setActiveRunId(null)}><title>{`${dateLabel(date, true)} · ${statusLabel(run.status)} · 推荐 ${run.recommended_count} 篇`}</title></circle>
      </g>)}
    </svg> : <div className="research-run-chart-empty"><span aria-hidden="true">⌁</span><strong>还没有可展示的运行记录</strong><p>订阅开始运行后，这里会按实际时间显示发现与推荐数量。</p></div>}
    {activeRun && <div className="research-run-chart-tooltip" role="status" aria-live="polite"><strong>{dateLabel(activeRun.date, true)} · {statusLabel(activeRun.run.status)}</strong><span>发现 {activeRun.run.discovered_count} 篇</span><span>推荐 {activeRun.run.recommended_count} 篇</span></div>}
  </section>;
}
