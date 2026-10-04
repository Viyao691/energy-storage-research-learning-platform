"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { ConfirmDeleteButton } from "../../components/ConfirmDeleteButton";
import { PaperListMeta } from "../../components/PaperListMeta";
import { PaperStateButtons } from "../../components/PaperStateButtons";
import { WorkspaceHeader } from "../../components/WorkspacePrimitives";
import { WorkspaceDrawer } from "../../components/workspace/WorkspaceDrawer";
import { MarkdownContent } from "../../components/MarkdownContent";
import { LibraryCollectionOverview } from "../../components/workspace/LibraryCollectionOverview";
import { TopicArtwork } from "../../components/workspace/TopicArtwork";
import GlassIcons, { type GlassIconsItem } from "../../components/react-bits/GlassIcons";
import { api, type Paper } from "../../lib/api";
import { paperItems } from "../../lib/presentation";
import { normalizeChemicalText } from "../../lib/scientificMarkdown";
import "../../components/workspace/samples.css";
import "../../components/workspace/refinement.css";
import "./library-refinement.css";

function scopeLabel(status: string | undefined) {
  if (status === "fulltext") return "全文证据";
  if (status === "abstract" || status === "abstract_only") return "摘要证据";
  if (status === "metadata" || status === "metadata_only") return "仅元数据";
  return "来源状态未标明";
}

function PaperCover({ paper }: { paper: Paper }) {
  const [failed, setFailed] = useState(false);
  const hasLocalPdf = Boolean(paper.acquisition_status === "fulltext" && paper.file_hash && paper.page_count > 0);
  if (hasLocalPdf && !failed) {
    return <img className="library-pdf-cover" src={api.figureThumbnailUrl(paper.id)} alt={`${paper.title} 的 PDF 内插图`} title="选自该论文 PDF 的插图" loading="lazy" onError={() => setFailed(true)} />;
  }
  return <div className="library-paper-artwork-fallback" title="AI 生成的材料主题插画，非论文原图"><TopicArtwork text={`${paper.title} ${paper.keywords?.join(" ") ?? ""}`} paperId={String(paper.id)} className="library-paper-artwork" /></div>;
}

type CollectionCounts = { all: number; favorites: number; read: number; unread: number };
type Collection = keyof CollectionCounts;
const pageSize = 20;
const collections: { id: Collection; label: string; color: GlassIconsItem["color"]; icon: React.ReactNode }[] = [
  { id: "all", label: "全部", color: "blue", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
  { id: "favorites", label: "我的收藏", color: "red", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" /></svg> },
  { id: "read", label: "已读", color: "green", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 12 3 3 7-7" /></svg> },
  { id: "unread", label: "未读", color: "purple", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 13h7" /></svg> },
];

function inCollection(paper: Paper, collection: Collection) {
  return collection === "all" || (collection === "favorites" && paper.is_favorite)
    || (collection === "read" && paper.is_read) || (collection === "unread" && !paper.is_read);
}

export default function Library() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [preview, setPreview] = useState<Paper | null>(null);
  const [collection, setCollection] = useState<Collection>("all");
  const [counts, setCounts] = useState<CollectionCounts | null>(null);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const activeCollection = useRef<Collection>("all");
  const queryVersion = useRef(0);

  useEffect(() => {
    const version = ++queryVersion.current;
    api
      .papers({ page: 1, page_size: pageSize, collection })
      .then(response => {
        if (version !== queryVersion.current) return;
        setPapers(paperItems(response)); setTotal(response.total);
        setCounts(response.collection_counts ?? null); setPage(1);
      })
      .catch(caught => { if (version === queryVersion.current) setError(caught instanceof Error ? caught.message : "论文库读取失败"); })
      .finally(() => { if (version === queryVersion.current) setLoading(false); });
  }, [collection]);

  function selectCollection(next: string) {
    if (!collections.some(item => item.id === next) || next === collection) return;
    activeCollection.current = next as Collection;
    setCollection(next as Collection);
    setPapers([]); setTotal(null); setPage(0); setError(""); setLoading(true);
  }

  function refreshCollection() {
    const selected = activeCollection.current;
    const version = ++queryVersion.current;
    void api.papers({ page: 1, page_size: pageSize, collection: selected }).then(response => {
      if (version !== queryVersion.current || selected !== activeCollection.current) return;
      setPapers(paperItems(response)); setTotal(response.total);
      setCounts(response.collection_counts ?? null); setPage(1);
    }).catch(() => { if (version === queryVersion.current) setError("列表更新失败，请切换分栏重试。"); });
  }

  function updatePaper(paper: Paper, state: { is_favorite: boolean; is_read: boolean }) {
    const updated = { ...paper, ...state };
    setPapers(current => current.map(item => item.id === paper.id ? updated : item).filter(item => inCollection(item, collection)));
    setCounts(current => current && ({
      ...current,
      favorites: current.favorites + Number(state.is_favorite) - Number(paper.is_favorite),
      read: current.read + Number(state.is_read) - Number(paper.is_read),
      unread: current.unread + Number(paper.is_read) - Number(state.is_read),
    }));
    if (inCollection(paper, collection) && !inCollection(updated, collection)) setTotal(current => current === null ? null : current - 1);
    refreshCollection();
  }

  function loadMore() {
    if (loadingMore || loading || page < 1 || total === null || papers.length >= total) return;
    const selected = collection;
    const version = queryVersion.current;
    setLoadingMore(true);
    void api.papers({ page: page + 1, page_size: pageSize, collection: selected }).then(response => {
      if (version !== queryVersion.current || selected !== activeCollection.current) return;
      setPapers(current => {
        const known = new Set(current.map(item => item.id));
        return [...current, ...paperItems(response).filter(item => !known.has(item.id))];
      });
      setTotal(response.total); setCounts(response.collection_counts ?? null); setPage(response.page);
    }).catch(caught => { if (version === queryVersion.current) setError(caught instanceof Error ? caught.message : "更多论文读取失败"); })
      .finally(() => setLoadingMore(false));
  }

  return (
    <section className="editorial-page library-page refinement-page">
      <WorkspaceHeader eyebrow="LOCAL RESEARCH LIBRARY" title="我的论文库"  artwork action={<Link className="button" href="/upload">上传 PDF</Link>} />
      {error && <p className="error">{error}</p>}
      {notice && <p className="success">{notice}</p>}
      <GlassIcons items={collections.map(item => ({ ...item, count: counts?.[item.id] ?? null }))} value={collection} onChange={selectCollection} label="论文库分栏" panelId="library-papers" className="library-collections" />
      {!loading && !error && total !== null && <p className="library-count">当前分栏已加载 {papers.length} / {total} 篇{counts ? ` · 全库共 ${counts.all} 篇` : ""}</p>}
      {loading && <LatticeLoader label="正在读取论文库…" showTimer />}
      <div className="library-content-layout"><div className="library-paper-grid" id="library-papers" role="tabpanel" aria-label={`${collections.find(item => item.id === collection)?.label}论文`}>
        {papers.map(paper => (
          <article className="card paper library-paper-card" key={paper.id}>
            <div className="library-paper-visual"><PaperCover paper={paper} /></div>
            <div className="library-paper-content"><div className="library-paper-top"><span className="status">{scopeLabel(paper.acquisition_status)}</span></div>
            <h2>
              <Link href={`/papers/${paper.id}`}>{normalizeChemicalText(paper.title)}</Link>
            </h2>
            <PaperListMeta journal={paper.journal} publishedDate={paper.published_date} articleType={paper.article_type} />
            <div className="library-keywords">
              <span>关键词</span>
              {paper.keywords?.length ? (
                <span className="paper-light-tags">
                  {paper.keywords.map((keyword, index) => <em key={`${keyword}-${index}`}>{normalizeChemicalText(keyword)}</em>)}
                </span>
              ) : <small>关键词未提供</small>}
            </div>
            <div className="library-card-actions">
              <button type="button" className="secondary" aria-label={`预览 ${paper.title}`} onClick={() => setPreview(paper)}>预览</button>
              <PaperStateButtons paperId={paper.id} isFavorite={Boolean(paper.is_favorite)} isRead={Boolean(paper.is_read)} onChange={state => updatePaper(paper, state)} />
              <ConfirmDeleteButton
                paperId={paper.id}
                paperTitle={paper.title}
                onDeleted={result => {
                  setPapers(current => current.filter(item => item.id !== paper.id));
                  setTotal(current => current === null ? null : Math.max(0, current - 1));
                  setCounts(current => current && ({
                    all: current.all - 1,
                    favorites: current.favorites - Number(paper.is_favorite),
                    read: current.read - Number(paper.is_read),
                    unread: current.unread - Number(!paper.is_read),
                  }));
                  setNotice(result.warning || "论文已永久删除。");
                  refreshCollection();
                }}
              />
            </div>
            </div>
          </article>
        ))}
        {!papers.length && !error && !loading && (
          <p className="muted">{collection === "all" ? "尚无论文，先上传一篇 PDF 开始吧。" : "这个分栏暂无论文。"}</p>
        )}
      </div><LibraryCollectionOverview papers={papers} total={counts?.all ?? total} /></div>
      {!loading && !error && total !== null && papers.length < total && <button className="secondary library-load-more" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "正在加载…" : "加载更多论文"}</button>}
      <WorkspaceDrawer open={preview !== null} title="论文预览" onClose={() => setPreview(null)}>
        {preview && <div className="library-preview">
          <span className="status">{scopeLabel(preview.acquisition_status)}</span>
          <h3>{normalizeChemicalText(preview.title)}</h3>
          <PaperListMeta journal={preview.journal} publishedDate={preview.published_date} articleType={preview.article_type} />
          <h4>摘要</h4>
          {preview.abstract ? <MarkdownContent content={preview.abstract} /> : <p>该论文暂无摘要。</p>}
          <Link className="button" href={`/papers/${preview.id}`}>打开论文详情</Link>
        </div>}
      </WorkspaceDrawer>
    </section>
  );
}
