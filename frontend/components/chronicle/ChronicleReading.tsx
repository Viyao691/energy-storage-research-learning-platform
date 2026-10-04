import React from "react";
import { MarkdownContent } from "../MarkdownContent";
import type { ChapterId } from "../../lib/chronicle/chapters";
import type { ChronicleResearch } from "../../lib/chronicle/researchRoutes";
import type { TimelineNode } from "../../lib/chronicle/data";
import type { ChronicleAsset } from "../../lib/chronicle/assets";
import type { CompanyProfile } from "../../lib/chronicle/companyProfiles";
import styles from "./chronicle.module.css";

function readingText(content: string, clearIntroduction = true) {
  const references: string[] = [];
  const blocks = content.split(/\n\s*\n/);
  let reachedSection = false;
  const paragraphs = blocks.filter(paragraph => {
    const text = paragraph.trim();
    if (/^#{3,4}\s/.test(text)) reachedSection = true;
    if (/^(原始来源|来源状态|来源：)/.test(text)) { references.push(paragraph); return false; }
    if (clearIntroduction && !reachedSection && !/^(\||[-*]\s|\d+\.\s)/.test(text)) {
      const links = text.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g);
      if (links) references.push(links.join(" · "));
      return false;
    }
    return true;
  });
  return { content: paragraphs.join("\n\n"), references };
}
export function ChronicleReading({ research, chapterId, node, asset, profile, onBack }: { research: ChronicleResearch; chapterId: ChapterId; node: TimelineNode; asset?: ChronicleAsset; profile?: CompanyProfile; onBack: () => void }) {
  const chapter = research.chapters.find(item => item.id === chapterId)!;
  const main = readingText(chapter.content), extended = readingText(chapter.details, false);
  return <section className={styles.reading} aria-label="研究详解" style={asset?.src ? { backgroundImage: `linear-gradient(var(--reading-wash),var(--reading-wash)), url("${asset.src}")` } : undefined}>

    <div className={styles.readingTop}><button type="button" onClick={onBack}>← 返回现场</button></div>
    <article key={chapterId} className={styles.article}>
      {chapterId === "history" && <div className={styles.selectedRecord}><h3>{node.year} · {node.label}</h3>{node.detail.split("。").filter(Boolean).map((text, i) => <p key={i}>{text}。</p>)}</div>}
      <h2>{chapter.title}</h2>{profile && <section className={styles.companyProfile}><h3>公司概况</h3><p>{profile.summary}</p>{profile.listing && <p>{profile.listing}</p>}{profile.scale && <p>{profile.scale} {profile.asOf && <small>（{profile.asOf}）</small>}</p>}{profile.marketCap && <p><strong>{profile.marketCap.display}</strong><br /><small>市值快照 · {profile.marketCap.date} · {profile.marketCap.issuer} · {profile.marketCap.currency}</small></p>}</section>}
      <MarkdownContent content={main.content} />
      {chapter.details && <details><summary>{chapter.detailLabel}</summary><MarkdownContent content={extended.content} /></details>}
      <details className={styles.references}><summary>参考资料</summary>{chapterId === "history" && <p><a href={node.source} target="_blank" rel="noreferrer">{node.year} · {node.label}</a></p>}<MarkdownContent content={[...main.references, ...extended.references].join("\n\n")} />{profile?.sources.map(source => <p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></p>)}{profile?.marketCap && <p><a href={profile.marketCap.source} target="_blank" rel="noreferrer">市值来源 · {profile.marketCap.issuer} · {profile.marketCap.date}</a></p>}{asset?.sourceUrl && <p><a href={asset.sourceUrl} target="_blank" rel="noreferrer">图片来源 · {asset.kind === "ai-illustration" ? "示意图" : asset.credit}</a></p>}</details>
    </article>
  </section>;
}
