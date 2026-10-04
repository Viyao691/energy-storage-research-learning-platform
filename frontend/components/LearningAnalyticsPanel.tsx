"use client";

import React from "react";
import { LearningAnalytics } from "../lib/api";
import "./learning/learning-analytics.css";

type Range = 7 | 30 | 90;
const masteryLabels = ["未学习", "学习中", "已掌握"] as const;
const series = [
  { key: "reviews", label: "复习", color: "#d9a441" },
  { key: "attempts", label: "自测作答", color: "#4b82bf" },
  { key: "completed_tasks", label: "完成任务", color: "#38a99a" },
] as const;

export function LearningAnalyticsPanel({ data, days, onDays, loading = false, error }: {
  data: LearningAnalytics | null;
  days: Range;
  onDays: (value: Range) => void;
  loading?: boolean;
  error?: string;
}) {
  return <section className="card learning-analytics learning-analytics-refined" aria-label="学习趋势统计">
    <div className="learning-section-toolbar la-toolbar">
      <div><p className="la-kicker">LEARNING RECORD</p><h2>学习趋势</h2></div>
      <div className="learning-range-switch la-ranges" aria-label="趋势范围">{([7, 30, 90] as const).map(value => <button type="button" aria-pressed={days === value} className={days === value ? "" : "secondary"} onClick={() => onDays(value)} key={value}>{value} 天</button>)}</div>
    </div>
    {loading ? <p className="la-state" role="status">正在读取学习趋势…</p> : error ? <p className="la-state la-error" role="alert">{error}</p> : !data ? <p className="la-state">暂无学习趋势数据。</p> : <>
      <div className="learning-trend-summary la-summary">
        <span><strong>{data.due_review_count}</strong> 到期复习</span>
        <span><strong>{data.correct_rate === null ? "—" : `${Math.round(data.correct_rate * 100)}%`}</strong> 累计自测正确率</span>
        <span><strong>{data.mastery_distribution["已掌握"] ?? 0}</strong> 已掌握卡片</span>
      </div>
      <div className="la-chart-grid">
        <ActivityChart data={data} days={days} />
        <MasteryChart distribution={data.mastery_distribution} />
      </div>
      <div className="learning-analytics-grid la-lower-grid">
        <section className="la-panel" aria-labelledby="la-ratings-title"><h3 id="la-ratings-title">复习评价分布</h3><RatingBars distribution={data.rating_distribution} /></section>
        <section className="la-panel" aria-labelledby="la-weakness-title"><h3 id="la-weakness-title">跨包薄弱项</h3>{data.weaknesses.map(item => <p className="la-weakness" key={item.concept}><span>{item.concept}</span><strong>{item.score.toFixed(1)}</strong></p>)}{!data.weaknesses.length && <p className="la-empty">暂无开放薄弱项。</p>}</section>
      </div>
    </>}
  </section>;
}

function ActivityChart({ data, days }: { data: LearningAnalytics; days: Range }) {
  const daily = data.daily;
  const peak = Math.max(0, ...daily.flatMap(item => series.map(entry => item[entry.key])));
  const axisTop = Math.max(1, Math.ceil(peak / 4) * 4);
  const chart = { left: 52, right: 16, top: 18, bottom: 46, width: 900, height: 240 };
  const plotW = chart.width - chart.left - chart.right;
  const plotH = chart.height - chart.top - chart.bottom;
  const slot = daily.length ? plotW / daily.length : plotW;
  const barW = Math.max(1, Math.min(15, slot * 0.2));
  const labelEvery = Math.max(1, Math.ceil(daily.length / 6));
  return <section className="la-panel la-activity" aria-labelledby="la-activity-title">
    <div className="la-panel-heading"><div><h3 id="la-activity-title">每日学习活动</h3><p>{data.from_date} 至 {data.to_date} · {days} 天范围</p></div></div>
    <div className="la-legend">{series.map(item => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}</div>
    {!daily.length ? <p className="la-empty">此范围暂无已记录活动。</p> : <>
      <p className="la-scroll-hint">图表较窄时可左右滑动查看日期</p>
      <div className="la-activity-scroll"><svg className="la-activity-svg" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={`${days} 天学习活动柱状图，纵轴为每日事件数；显示复习、自测作答和完成任务`}>
        <title>{days} 天学习活动</title><desc>每日活动按日期分组，三种颜色分别表示复习、自测作答和完成任务。仅显示接口返回日期。</desc>
        {[0, 1, 2, 3, 4].map(index => { const value = axisTop * (4 - index) / 4; const y = chart.top + plotH * index / 4; return <g key={index}><line x1={chart.left} x2={chart.width - chart.right} y1={y} y2={y} className="la-grid-line" /><text x={chart.left - 8} y={y + 4} textAnchor="end" className="la-axis-label">{value}</text></g>; })}
        {daily.map((item, index) => {
          const center = chart.left + slot * (index + 0.5);
          return <g key={item.date}>
            {series.map((entry, seriesIndex) => {
              const value = item[entry.key];
              const height = peak ? value / axisTop * plotH : 0;
              return value > 0 ? <rect key={entry.key} x={center + (seriesIndex - 1) * barW - barW / 2} y={chart.top + plotH - height} width={barW} height={height} rx="2" fill={entry.color}><title>{item.date}：{entry.label} {value}</title></rect> : null;
            })}
            {(index % labelEvery === 0 || index === daily.length - 1) && <text x={center} y={chart.height - 10} textAnchor="middle" className="la-axis-label">{item.date.slice(5)}</text>}
          </g>;
        })}
        <text x="12" y={chart.top + plotH / 2} transform={`rotate(-90 12 ${chart.top + plotH / 2})`} textAnchor="middle" className="la-axis-title">事件数</text>
      </svg></div>
      <details className="la-activity-details"><summary>查看每日活动明细（{daily.length} 天）</summary><div className="la-table-scroll"><table><caption>{days} 天每日学习活动明细</caption><thead><tr><th scope="col">日期</th>{series.map(entry => <th scope="col" key={entry.key}>{entry.label}</th>)}</tr></thead><tbody>{daily.map(item => <tr key={item.date}><th scope="row">{item.date}</th>{series.map(entry => <td key={entry.key}>{item[entry.key]}</td>)}</tr>)}</tbody></table></div></details>
    </>}
  </section>;
}

function MasteryChart({ distribution }: { distribution: Record<string, number> }) {
  const values = masteryLabels.map(label => Math.max(0, distribution[label] ?? 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  const colors = ["#8996a8", "#8271bd", "#38a99a"];
  let accumulated = 0;
  const gradient = values.map((value, index) => {
    const start = accumulated;
    accumulated += total ? value / total * 100 : 0;
    return `${colors[index]} ${start}% ${accumulated}%`;
  }).join(", ");
  return <section className="la-panel la-mastery" aria-labelledby="la-mastery-title">
    <div className="la-panel-heading"><div><h3 id="la-mastery-title">知识掌握分布</h3><p>当前激活学习包中的卡片状态</p></div></div>
    <div className="la-mastery-content"><div className={`la-donut${total ? "" : " is-empty"}`} role="img" aria-label={total ? `知识掌握分布，共 ${total} 张卡片` : "知识掌握分布暂无卡片"} style={total ? { background: `conic-gradient(${gradient})` } : undefined}><span>{total || 0}<small>张卡片</small></span></div>
      <ul className="la-mastery-legend">{masteryLabels.map((label, index) => <li key={label}><i style={{ background: colors[index] }} /><span>{label}</span><strong>{values[index]}</strong></li>)}</ul>
    </div>
  </section>;
}

function RatingBars({ distribution }: { distribution: Record<string, number> }) {
  const entries = Object.entries(distribution);
  const maximum = Math.max(0, ...entries.map(([, count]) => count));
  if (!entries.length) return <p className="la-empty">暂无自测评价记录。</p>;
  return <ul className="la-rating-list">{entries.map(([rating, count], index) => <li key={rating}><span>{rating}</span><span className="la-rating-track"><i style={{ width: `${maximum ? count / maximum * 100 : 0}%` }} data-tone={index % 4} /></span><strong>{count}</strong></li>)}</ul>;
}
