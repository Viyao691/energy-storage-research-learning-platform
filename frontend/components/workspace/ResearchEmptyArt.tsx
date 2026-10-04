"use client";

import React, { useEffect, useState } from "react";
import ParticleText from "../react-bits/ParticleText";
import "./research-text-art.css";

export default function ResearchEmptyArt() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const update = () => setDark(document.documentElement.dataset.theme === "dark");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  const accent = dark ? "#f0e9dc" : "#9ba4ae";
  return <div className="research-empty-art" aria-hidden="true">
    <ParticleText className="research-display" text="储能科研" color={dark ? "#dce5ef" : "#243c52"} highlightColor={accent} />
    <ParticleText className="research-display" text="洞见未来" color={dark ? "#dbb778" : "#947044"} highlightColor={accent} />
  </div>;
}
