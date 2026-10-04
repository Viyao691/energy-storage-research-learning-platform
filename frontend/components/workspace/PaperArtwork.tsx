"use client";

import React, { useEffect, useState } from "react";
import { paperArtworkFallback, reservePaperArtwork } from "../../lib/paperArtwork";
import "./paper-artwork.css";

export function PaperArtwork({ paperId, className = "" }: { paperId: string; className?: string }) {
  const [slot, setSlot] = useState(() => paperArtworkFallback(paperId));

  useEffect(() => {
    setSlot(reservePaperArtwork(paperId));
  }, [paperId]);

  const src = `/workspace/paper-art/paper-${String(slot + 1).padStart(2, "0")}.webp`;
  return <figure className={`topic-artwork paper-artwork paper-artwork-slot-${slot + 1} ${className}`.trim()} aria-label="AI 生成的科研材料装饰插画，非论文原图">
    <img src={src} alt="" loading="lazy" />
    <span className="topic-artwork-caption">材料示意</span>
  </figure>;
}
