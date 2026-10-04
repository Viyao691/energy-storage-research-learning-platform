import React from "react";
import { articleTypeLabel, publicationYear } from "../lib/presentation";

type Props = {
  journal?: string | null;
  publishedDate?: string | null;
  year?: number | null;
  keywords?: string[] | null;
  articleType?: string | null;
  className?: string;
};

export function PaperListMeta({ journal, publishedDate, year, keywords, articleType, className = "" }: Props) {
  const tags = [...(keywords ?? []).filter(Boolean).slice(0, 2), articleTypeLabel(articleType)].slice(0, 3);
  return (
    <span className={`paper-list-meta ${className}`.trim()}>
      <small>{journal?.trim() || "期刊未提供"} · {publicationYear(publishedDate, year)}</small>
      <span className="paper-light-tags">
        {tags.map((tag, index) => <em key={`${tag}-${index}`}>{tag}</em>)}
      </span>
    </span>
  );
}
