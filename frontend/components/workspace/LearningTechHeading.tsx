"use client";

import React, { useEffect, useState } from "react";
import TechText from "../react-bits/TechText";
import "./research-text-art.css";

export default function LearningTechHeading() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const update = () => setDark(document.documentElement.dataset.theme === "dark");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return <TechText text="学习中心" fontSize={50} color={dark ? "#e3edf0" : "#19384b"} accentColor={dark ? "#9fcbd0" : "#477985"} sweep={false} className="learning-tech-heading" />;
}
