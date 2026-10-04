"use client";

import React from "react";
import type { EvidenceLocation } from "../../lib/api";
import { api } from "../../lib/api";
import { evidenceBoxPercent } from "../../lib/evidenceBbox";

type Props = {
  id: string;
  pageNumber: number;
  location: EvidenceLocation | null;
  message: string;
};

export function EvidencePagePreview({ id, pageNumber, location, message }: Props) {
  const box = location?.page_number === pageNumber ? evidenceBoxPercent(location) : null;
  const aspectRatio = box && location ? location.page_width / location.page_height : null;
  return (
    <figure className="page-preview evidence-page-preview">
      <div
        className="evidence-page-canvas"
        style={aspectRatio ? {
          aspectRatio: String(aspectRatio),
          width: `min(100%, calc(var(--page-preview-max-height) * ${aspectRatio}))`
        } : undefined}
      >
        <img src={api.pageImageUrl(id, pageNumber)} alt={`第 ${pageNumber} 页预览`} />
        {box && (
          <span
            aria-label="证据区域"
            style={{
              position: "absolute",
              left: `${box.left}%`,
              top: `${box.top}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
              border: "2px solid #ff8a34",
              background: "rgba(255, 138, 52, 0.16)",
              pointerEvents: "none",
              boxSizing: "border-box"
            }}
          />
        )}
      </div>
      <figcaption>
        {message || `本地生成的第 ${pageNumber} 页预览，不会发送给模型。`}
      </figcaption>
    </figure>
  );
}
