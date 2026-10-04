import React from "react";
import type { Paper } from "../../lib/api";

function evidenceGroup(status: string | undefined) {
  if (status === "fulltext") return 0;
  if (status === "abstract" || status === "abstract_only") return 1;
  if (status === "metadata" || status === "metadata_only") return 2;
  return 3;
}

export function LibraryCollectionOverview({ papers, total }: { papers: Paper[]; total: number | null }) {
  const evidence = [0, 0, 0, 0];
  const years = new Map<string, number>();
  for (const paper of papers) {
    evidence[evidenceGroup(paper.acquisition_status)] += 1;
    const year = paper.published_date?.match(/^\d{4}/)?.[0];
    if (year) years.set(year, (years.get(year) ?? 0) + 1);
  }
  const yearRows = [...years].sort(([left], [right]) => right.localeCompare(left)).slice(0, 5);
  const yearMax = Math.max(1, ...yearRows.map(([, count]) => count));
  const names = ["全文", "摘要", "元数据", "未标明"];
  const colors = ["#b58a4d", "#4b8cac", "#8267ab", "#83929d"];
  let cumulative = 0;
  const stops = evidence.map((count, index) => {
    const start = cumulative;
    cumulative += papers.length ? count / papers.length * 100 : 0;
    return `${colors[index]} ${start}% ${cumulative}%`;
  });

  return <aside className="library-overview" aria-label="当前加载集合概览">
    <div className="library-overview-heading"><span className="library-overview-kicker">COLLECTION VIEW</span><h2>集合概览</h2></div>
    <div className="library-overview-count"><strong>{papers.length}</strong><span>篇已加载{total !== null ? ` / 库中共 ${total} 篇` : ""}</span></div>
    <section aria-label="证据范围">
      <h3>证据范围</h3>
      <div className="library-scope-chart">
        <div className="library-scope-donut" role="img" aria-label={names.map((name, index) => `${name} ${evidence[index]} 篇`).join("、")} style={{ background: papers.length ? `conic-gradient(${stops.join(", ")})` : "var(--v2-line)" }}><span>{papers.length}</span></div>
        <ul>{names.map((name, index) => <li key={name}><i style={{ backgroundColor: colors[index] }} /><span>{name}</span><strong>{evidence[index]}</strong></li>)}</ul>
      </div>
    </section>
    <section aria-label="发表年份分布">
      <h3>发表年份</h3>
      {yearRows.length ? <div className="library-year-bars">{yearRows.map(([year, count]) => <div className="library-year-row" key={year}><span>{year}</span><div className="library-year-track"><i style={{ width: `${count / yearMax * 100}%` }} /></div><strong>{count}</strong></div>)}</div> : <p className="library-overview-empty">已加载论文暂无可识别的发表年份。</p>}
    </section>
  </aside>;
}
