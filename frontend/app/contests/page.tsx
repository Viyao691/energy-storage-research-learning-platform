"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { EditorialEmptyState, StatusBadge, WorkspaceHeader } from "../../components/WorkspacePrimitives";
import { TopicArtwork } from "../../components/workspace/TopicArtwork";
import { api, ContestProject } from "../../lib/api";
import "../../components/workspace/tools-refinement.css";
import "../../components/workspace/contest-refinement.css";

export default function ContestsPage() {
  const [items, setItems] = useState<ContestProject[]>([]);
  const [title, setTitle] = useState("");
  const [competitionName, setCompetitionName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.listContests().then(result => setItems(result.items)).catch(error => setMessage(error.message)).finally(() => setLoading(false));
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (creating) return;
    setMessage("");
    setCreating(true);
    try {
      const item = await api.createContest({ title, competition_name: competitionName });
      setItems(current => [item, ...current]);
      setTitle("");
      setCompetitionName("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建项目失败");
    } finally { setCreating(false); }
  }

  return (
    <section className="workspace-page research-tools-refined contest-refined contest-workspace">
      <WorkspaceHeader eyebrow="RESEARCH TOOLS · CONTEST" title="科研创新竞赛" description="从竞赛通知到项目论证，逐步整理规则、证据与答辩准备。" artwork action={<StatusBadge tone="quiet">规则需人工确认</StatusBadge>} />
      <ol className="tools-workflow" aria-label="竞赛项目流程">
        <li><strong>01 · 建立项目</strong><span>为每项竞赛保存独立的研究主题。</span></li>
        <li><strong>02 · 核对规则</strong><span>上传通知后解析，并由你确认评分要求。</span></li>
        <li><strong>03 · 准备答辩</strong><span>填写论证、核查缺口，再进行文字或录音练习。</span></li>
      </ol>
      {message && <p className="error">{message}</p>}
      {loading && <LatticeLoader label="正在读取竞赛项目…" showTimer />}
      {creating && <LatticeLoader label="正在创建竞赛项目…" showTimer />}
      <section className="contest-list-section" aria-labelledby="contest-list-title">
        <div className="contest-section-heading"><div><p className="contest-kicker">YOUR PROJECTS</p><h2 id="contest-list-title">已有竞赛项目</h2></div><span>{items.length} 个项目</span></div>
        <div className="contest-project-list" aria-label="竞赛项目列表">
          {items.map(item => (
            <article className="card contest-project-card" key={item.id}>
              <TopicArtwork text={`${item.title} ${item.competition_name || ""}`} motif="trophy" className="contest-project-artwork" />
              <div className="contest-project-copy"><StatusBadge tone="neutral">{item.competition_name || "未填写竞赛"}</StatusBadge><h3>{item.title}</h3><p>{item.summary || "尚未填写项目摘要，从研究问题和创新点开始。"}</p></div>
              <Link className="button" href={`/contests/${item.id}`}>进入项目</Link>
            </article>
          ))}
          {!items.length && !loading && <EditorialEmptyState title="尚未建立竞赛项目" description="先创建项目，再添加竞赛通知并人工确认解析出的规则。" />}
        </div>
      </section>
      <section className="card contest-create-panel" aria-labelledby="contest-create-title">
        <h2 id="contest-create-title">新建竞赛项目</h2>
        <p>每个项目独立保存规则来源、九项内容、时间表与答辩记录。</p>
        <form className="contest-inline-form" onSubmit={create}>
          <label>项目名称<input aria-label="项目名称" value={title} onChange={event => setTitle(event.target.value)} required /></label>
          <label>竞赛名称<input aria-label="竞赛名称" value={competitionName} onChange={event => setCompetitionName(event.target.value)} /></label>
          <button disabled={creating}>创建项目</button>
        </form>
      </section>
    </section>
  );
}
