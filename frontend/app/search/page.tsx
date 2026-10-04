"use client";

import LatticeLoader from "../../components/react-bits/LatticeLoader";
import GlideSelect from "../../components/react-bits/GlideSelect";

import Link from "next/link";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import {
  api,
  PaperSearchParams,
  PaperSource,
  SearchPaper,
  SourceStatus
} from "../../lib/api";
import {
  importResultStatus,
  legalFulltextHint,
  openAccessLabel,
  partialSearchWarning,
  safeExternalUrl,
  sourceLabel
} from "../../lib/presentation";
import { MarkdownContent } from "../../components/MarkdownContent";
import { PaperListMeta } from "../../components/PaperListMeta";
import { PaperStateButtons } from "../../components/PaperStateButtons";
import { WorkspaceHeader } from "../../components/WorkspacePrimitives";
import { TopicArtwork } from "../../components/workspace/TopicArtwork";
import "../../components/workspace/samples.css";
import "../../components/workspace/discovery-refinement.css";

const PAGE_SIZE = 10;
const FETCH_SIZE = 50;
const SOURCE_ORDER: PaperSource[] = ["openalex", "crossref", "arxiv", "semantic_scholar"];

type SearchFilters = Omit<PaperSearchParams, "page" | "page_size">;
type ImportState = { paperId?: number; message: string; warning: boolean; busy: boolean };
type ActiveSearch = { id: number; key: string; controller: AbortController };
type SortBy = "relevance" | "citations" | "date";
type SortDirection = "asc" | "desc";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

function publicationTime(item: SearchPaper): number {
  const parsed = item.published_date ? Date.parse(item.published_date) : Number.NaN;
  if (Number.isFinite(parsed)) return parsed;
  return item.year ? Date.UTC(item.year, 0, 1) : 0;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);
  const [selectedSources, setSelectedSources] = useState<PaperSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState("");
  const [items, setItems] = useState<SearchPaper[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchStatuses, setSearchStatuses] = useState<SourceStatus[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<SearchFilters | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imports, setImports] = useState<Record<string, ImportState>>({});
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const searchSequence = useRef(0);
  const activeSearch = useRef<ActiveSearch | null>(null);
  const importControllers = useRef(new Map<string, AbortController>());

  useEffect(() => {
    const controller = new AbortController();
    api.sourceStatuses(controller.signal)
      .then(statuses => {
        if (controller.signal.aborted) return;
        setSourceStatuses(statuses);
        setSelectedSources(statuses.filter(status => status.enabled).map(status => status.source));
      })
      .catch(requestError => {
        if (!isAbortError(requestError) && !controller.signal.aborted) {
          setSourcesError("暂时无法读取论文来源状态，请稍后刷新页面重试。");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSourcesLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => () => {
    activeSearch.current?.controller.abort();
    activeSearch.current = null;
    importControllers.current.forEach(controller => controller.abort());
    importControllers.current.clear();
  }, []);

  function toggleSource(source: PaperSource) {
    setSelectedSources(current => current.includes(source)
      ? current.filter(item => item !== source)
      : [...current, source]);
  }

  async function runSearch(filters: SearchFilters, nextPage: number) {
    const params: PaperSearchParams = { ...filters, page: 1, page_size: FETCH_SIZE };
    const requestKey = JSON.stringify(params);
    if (activeSearch.current?.key === requestKey) return;
    activeSearch.current?.controller.abort();
    const controller = new AbortController();
    const requestId = ++searchSequence.current;
    activeSearch.current = { id: requestId, key: requestKey, controller };
    setLoading(true);
    setError("");
    setImports({});
    try {
      const response = await api.searchPapers(params, controller.signal);
      if (controller.signal.aborted || activeSearch.current?.id !== requestId) return;
      setItems(response.items);
      setTotal(response.items.length);
      setPage(nextPage);
      setWarnings(response.warnings);
      setSearchStatuses(response.source_statuses);
      setHasSearched(true);
      setActiveFilters(filters);
    } catch (requestError) {
      if (controller.signal.aborted || activeSearch.current?.id !== requestId || isAbortError(requestError)) return;
      setError(requestError instanceof Error ? requestError.message : "搜索失败，请稍后重试。");
    } finally {
      if (activeSearch.current?.id === requestId) {
        activeSearch.current = null;
        setLoading(false);
      }
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    if (normalizedQuery.length < 2) {
      setError("请输入至少 2 个字符的搜索词。");
      return;
    }
    if (yearFrom && yearTo && Number(yearFrom) > Number(yearTo)) {
      setError("起始年份不能晚于结束年份。");
      return;
    }
    if (!selectedSources.length) {
      setError("请至少选择一个已启用的论文来源。");
      return;
    }
    void runSearch({
      q: normalizedQuery,
      year_from: yearFrom,
      year_to: yearTo,
      open_access_only: openAccessOnly,
      sources: selectedSources
    }, 1);
  }

  async function importPaper(item: SearchPaper) {
    const key = `${item.import_source}:${item.import_external_id}`;
    if (importControllers.current.has(key)) return;
    const controller = new AbortController();
    importControllers.current.set(key, controller);
    setImports(current => ({
      ...current,
      [key]: { message: "", warning: false, busy: true }
    }));
    try {
      const result = await api.importPaper({
        source: item.import_source,
        external_id: item.import_external_id,
        download_open_pdf: item.is_open_access && Boolean(item.pdf_url)
      }, controller.signal);
      if (controller.signal.aborted) return;
      const status = importResultStatus(result);
      setImports(current => ({
        ...current,
        [key]: { ...status, busy: false }
      }));
      setItems(current => current.map(paper => (
        paper.import_source === item.import_source &&
        paper.import_external_id === item.import_external_id
          ? { ...paper, already_imported: true, paper_id: status.paperId, is_favorite: result.paper.is_favorite, is_read: result.paper.is_read, article_type: result.paper.article_type || paper.article_type }
          : paper
      )));
    } catch (requestError) {
      if (controller.signal.aborted || isAbortError(requestError)) return;
      setImports(current => ({
        ...current,
        [key]: {
          message: requestError instanceof Error ? requestError.message : "入库失败，请稍后重试。",
          warning: true,
          busy: false
        }
      }));
    } finally {
      if (importControllers.current.get(key) === controller) {
        importControllers.current.delete(key);
      }
    }
  }

  const sortedItems = [...items].sort((left, right) => {
    const leftValue = sortBy === "relevance"
      ? left.relevance_score
      : sortBy === "citations"
        ? left.citation_count
        : publicationTime(left);
    const rightValue = sortBy === "relevance"
      ? right.relevance_score
      : sortBy === "citations"
        ? right.citation_count
        : publicationTime(right);
    const difference = leftValue - rightValue;
    if (difference !== 0) return sortDirection === "asc" ? difference : -difference;
    return left.title.localeCompare(right.title, "zh-CN");
  });
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const visibleItems = sortedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const partialWarning = partialSearchWarning(searchStatuses, warnings);

  return (
    <section className="search-page editorial-page">
      <WorkspaceHeader eyebrow="ACADEMIC DISCOVERY" title="论文搜索" description="跨学术来源检索论文，核对开放状态，并按证据范围保存到本地。" artwork action={<Link className="button secondary" href="/library">查看论文库</Link>} />

      <form className="card search-form" onSubmit={submitSearch}>
        <div className="search-query">
          <label htmlFor="search-q">搜索词</label>
          <input
            id="search-q"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="例如：sodium ion battery"
            maxLength={300}
            required
          />
        </div>
        <div className="search-filter-grid">
          <div>
            <label htmlFor="year-from">起始年份</label>
            <input
              id="year-from"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={yearFrom}
              onChange={event => setYearFrom(event.target.value)}
              placeholder="不限"
            />
          </div>
          <div>
            <label htmlFor="year-to">结束年份</label>
            <input
              id="year-to"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={yearTo}
              onChange={event => setYearTo(event.target.value)}
              placeholder="不限"
            />
          </div>
          <label className="check-option oa-filter">
            <input
              type="checkbox"
              checked={openAccessOnly}
              onChange={event => setOpenAccessOnly(event.target.checked)}
            />
            仅显示开放获取
          </label>
        </div>

        <fieldset className="source-options">
          <legend>论文来源</legend>
          {sourcesLoading && <LatticeLoader label="正在读取来源状态…" showTimer />}
          {sourcesError && <p className="error">{sourcesError}</p>}
          {!sourcesLoading && SOURCE_ORDER.map(source => {
            const status = sourceStatuses.find(item => item.source === source);
            const enabled = status?.enabled === true;
            return (
              <label className={`source-option ${enabled ? "" : "disabled"}`} key={source}>
                <input
                  type="checkbox"
                  checked={enabled && selectedSources.includes(source)}
                  disabled={!enabled}
                  onChange={() => toggleSource(source)}
                />
                <span>{sourceLabel(source)}</span>
                <small className={enabled && status?.ok ? "source-ok" : "source-unavailable"}>
                  {!enabled ? "未启用" : status?.ok ? "连接正常" : "暂不可用"}
                </small>
              </label>
            );
          })}
        </fieldset>

        <div className="row">
          <button disabled={loading || sourcesLoading} type="submit">
            {loading ? "正在搜索…" : "搜索论文"}
          </button>
          <span className="muted">搜索相关性仅用于排序，不代表论文质量。</span>
        </div>
      </form>

      {error && <p className="error search-message" role="alert">{error}</p>}
      {partialWarning && <p className="alert search-message" role="status">{partialWarning}</p>}
      {loading && <LatticeLoader label="正在从所选来源检索论文…" showTimer className="search-message" />}

      {!loading && hasSearched && !error && (
        <div className="search-summary">
          <p>共找到 <strong>{total}</strong> 条合并结果</p>
          <div className="search-sort-controls">
            <label>排序依据<GlideSelect ariaLabel="排序依据" value={sortBy} onChange={value => { setSortBy(value as SortBy); setPage(1); }} options={[{ value: "relevance", label: "相关性" }, { value: "citations", label: "引用量" }, { value: "date", label: "年份/发布日期" }]} /></label>
            <label>排序方向<GlideSelect ariaLabel="排序方向" value={sortDirection} onChange={value => { setSortDirection(value as SortDirection); setPage(1); }} options={[{ value: "desc", label: "降序" }, { value: "asc", label: "升序" }]} /></label>
            <span className="muted">第 {page} / {totalPages} 页</span>
          </div>
        </div>
      )}

      {!loading && hasSearched && !error && items.length === 0 && (
        <div className="card empty-state">
          <h2>未找到匹配论文</h2>
          <p className="muted">可以尝试缩短搜索词、放宽年份，或增加论文来源。</p>
        </div>
      )}

      <div className="search-results">
        {visibleItems.map((item, index) => {
          const importKey = `${item.import_source}:${item.import_external_id}`;
          const importState = imports[importKey];
          const paperId = importState?.paperId ?? item.paper_id;
          const landingUrl = safeExternalUrl(item.landing_url);
          return (
            <article className="card search-result search-result-refined" key={importKey}>
              <TopicArtwork text={`${item.title} ${item.keywords?.join(" ") ?? ""}`} paperId={paperId ? String(paperId) : undefined} variant={index} className="search-result-artwork" />
              <div className="search-result-content">
                <div className="result-topline">
                  <div className="result-badges">
                    {item.sources.map(source => (
                      <span className="status" key={source}>{sourceLabel(source)}</span>
                    ))}
                    <span className={item.is_open_access ? "status oa" : "status neutral"}>
                      {openAccessLabel(item.is_open_access, item.oa_status)}
                    </span>
                  </div>
                  <div className="result-side-controls">
                    {item.already_imported && paperId && <PaperStateButtons paperId={paperId} isFavorite={item.is_favorite} isRead={item.is_read} onChange={state => setItems(current => current.map(paper => paper.paper_id === paperId ? { ...paper, ...state } : paper))} />}
                    <div className="relevance">
                      <strong>规则相关性 {Math.round(item.relevance_score)} 分</strong>
                      <span>引用 {item.citation_count} · 仅用于排序</span>
                    </div>
                  </div>
                </div>

                <h2><MarkdownContent content={item.title} inline /></h2>
                <p className="result-meta">
                  {item.authors.length ? item.authors.join("、") : "作者未知"}
                </p>
                <PaperListMeta journal={item.journal} publishedDate={item.published_date} year={item.year} keywords={item.keywords} articleType={item.article_type} />
                {item.relevance_reasons.length > 0 && (
                  <p className="relevance-reasons">排序依据：{item.relevance_reasons.join("、")}</p>
                )}
                <div className="result-abstract">
                  <MarkdownContent content={item.abstract || "该来源暂未提供摘要。"} />
                </div>

                <dl className="result-facts">
                  <div>
                    <dt>DOI</dt>
                    <dd>{item.doi
                      ? <a href={`https://doi.org/${encodeURIComponent(item.doi)}`} target="_blank" rel="noreferrer">{item.doi}</a>
                      : "未提供"}</dd>
                  </div>
                  <div>
                    <dt>开放状态</dt>
                    <dd>{openAccessLabel(item.is_open_access, item.oa_status)}{item.license ? ` · ${item.license}` : ""}</dd>
                  </div>
                </dl>

                <p className="legal-hint">{legalFulltextHint({ ...item, landing_url: landingUrl ?? "" })}</p>
                <div className="result-actions">
                  {landingUrl && (
                    <a className="button secondary" href={landingUrl} target="_blank" rel="noreferrer">
                      前往论文来源页面
                    </a>
                  )}
                  {item.already_imported && paperId
                    ? <Link className="button" href={`/papers/${paperId}`}>查看已入库论文</Link>
                    : (
                      <button
                        type="button"
                        disabled={importState?.busy}
                        onClick={() => void importPaper(item)}
                      >
                        {importState?.busy
                          ? "正在入库…"
                          : item.is_open_access && item.pdf_url
                            ? "入库并尝试获取开放全文"
                            : "保存元数据到论文库"}
                      </button>
                    )}
                </div>
                {importState?.message && (
                  <p className={importState.warning ? "alert import-message" : "success import-message"} role="status">
                    {importState.message}
                    {importState.paperId && <> <Link href={`/papers/${importState.paperId}`}>查看论文</Link></>}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!loading && activeFilters && totalPages > 1 && (
        <div className="pagination" aria-label="搜索结果分页">
          <button
            className="secondary"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(current => Math.max(1, current - 1))}
          >
            上一页
          </button>
          <span>第 {page} / {totalPages} 页</span>
          <button
            className="secondary"
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(current => Math.min(totalPages, current + 1))}
          >
            下一页
          </button>
        </div>
      )}
    </section>
  );
}
