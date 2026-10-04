"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PixelSnow } from "./PixelSnow";
import "./energy-header-backdrop.css";

export type EnergyHeaderKind = "library" | "digest" | "learning" | "system";

const selectors: Record<EnergyHeaderKind, string> = {
  library: ".library-page > .workspace-header",
  digest: ".research-daily-refined > .daily-hero",
  learning: ".learning-refined > .workspace-header",
  system: ".settings-page > .workspace-header",
};

export function EnergyHeaderBackdrop({ kind, theme }: { kind: EnergyHeaderKind; theme: "light" | "dark" }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const element = document.querySelector<HTMLElement>(selectors[kind]);
    element?.classList.add("energy-header-target", `energy-header-${kind}`);
    setTarget(element);
    return () => {
      element?.classList.remove("energy-header-target", `energy-header-${kind}`);
      setTarget(null);
    };
  }, [kind]);

  if (!target) return null;
  return createPortal(<>
    <div className="energy-header-material" aria-hidden="true" />
    <PixelSnow color={theme === "dark" ? "#eee2c6" : "#66858b"} density={kind === "learning" ? .06 : kind === "library" ? .15 : .1} speed={kind === "library" ? .55 : .35} />
  </>, target);
}
