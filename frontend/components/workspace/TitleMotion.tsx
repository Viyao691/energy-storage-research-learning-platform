"use client";

import React, { useEffect, useState } from "react";
import TechText from "../react-bits/TechText";
import TrueFocus from "../react-bits/TrueFocus";
import WarpText from "../react-bits/WarpText";
import "./title-motion.css";

export type TitleVariant = "warp" | "tech" | "focus";
type Props = { text: string; variant?: TitleVariant; variantKey?: string; warpLineHeight?: string };

const headerVariants: Record<string, TitleVariant> = {
  "ACADEMIC DISCOVERY": "warp",
  "KNOWLEDGE WORKSPACE": "focus",
  "LOCAL RESEARCH LIBRARY": "tech",
  "COMPARISON DESK": "warp",
  "RESEARCH TOOLS · CONTEST": "tech",
  "LOCAL RESEARCH ROUTINE": "warp",
  "RESEARCH TOOLS · DATA": "focus",
  "SYSTEM · CONFIGURATION": "warp",
  "SYSTEM · HEALTH": "focus",
  "SYSTEM · MAINTENANCE": "tech",
  "CONTEST PROJECT": "focus",
};

export default function TitleMotion({ text, variant, variantKey, warpLineHeight }: Props) {
  const effect = variant ?? (variantKey?.startsWith("LEARNING PACK") ? "focus" : headerVariants[variantKey ?? ""] ?? "focus");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const update = () => setDark(document.documentElement.dataset.theme === "dark");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  const color = dark ? "#e9f0f1" : "#1d3c4d";
  if (effect === "warp") return <WarpText text={text} color={color} fontSize="1em" fontWeight={650} lineHeight={warpLineHeight ?? 0.9} warpStrength={0.05} pointerStrength={0.28} refraction={0.012} className="title-motion-warp" />;
  if (effect === "tech" && Array.from(text).length <= 7) return <span className="title-motion-tech" style={{ "--title-chars": Array.from(text).length } as React.CSSProperties}><TechText text={text} color={color} accentColor={dark ? "#9fcbd0" : "#477985"} fontSize={42} sweep={false} /></span>;
  return <TrueFocus text={text} className="title-motion-focus" />;
}
