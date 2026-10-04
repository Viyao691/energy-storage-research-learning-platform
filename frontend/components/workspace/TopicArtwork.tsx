import React from "react";
import { PaperArtwork } from "./PaperArtwork";
import "./visual-data.css";

export type ResearchTopicKey = "solid" | "sodium" | "nasicon" | "grid" | "hydrogen" | "recycling" | "general";
export type ArtworkMotif = "booklamp" | "rocket" | "router" | "scanner" | "splitprism" | "citationlens" | "archive" | "satellite" | "newspaper" | "neuralbrain" | "battery" | "atoms" | "lattice" | "gridbattery" | "hydrogen" | "recycling" | "learningtree" | "compass" | "trophy" | "blueprint" | "datacube" | "bulb" | "controls" | "shieldserver";

const topicInfo: Record<ResearchTopicKey, { label: string; color: string; cell: number }> = {
  solid: { label: "固态电池", color: "gold", cell: 0 },
  sodium: { label: "钠离子电池", color: "blue", cell: 1 },
  nasicon: { label: "NASICON", color: "purple", cell: 2 },
  grid: { label: "电网储能", color: "teal", cell: 3 },
  hydrogen: { label: "氢能", color: "cyan", cell: 4 },
  recycling: { label: "电池回收", color: "green", cell: 5 },
  general: { label: "研究主题", color: "neutral", cell: -1 },
};
const motifVariants: Record<ArtworkMotif, ArtworkMotif[]> = {
  booklamp: ["booklamp", "archive", "citationlens", "learningtree", "newspaper"],
  rocket: ["rocket", "satellite", "compass", "blueprint"],
  router: ["router", "controls", "shieldserver", "satellite"],
  scanner: ["scanner", "citationlens", "archive", "datacube"],
  splitprism: ["splitprism", "blueprint", "compass", "citationlens"],
  citationlens: ["citationlens", "booklamp", "archive", "neuralbrain"],
  archive: ["archive", "booklamp", "citationlens", "newspaper"],
  satellite: ["satellite", "rocket", "router", "compass"],
  newspaper: ["newspaper", "archive", "booklamp", "citationlens"],
  neuralbrain: ["neuralbrain", "learningtree", "compass", "citationlens"],
  battery: ["battery"], atoms: ["atoms"], lattice: ["lattice"], gridbattery: ["gridbattery"],
  hydrogen: ["hydrogen"], recycling: ["recycling"],
  learningtree: ["learningtree", "compass", "neuralbrain", "booklamp", "bulb"],
  compass: ["compass", "learningtree", "blueprint", "satellite"],
  trophy: ["trophy", "blueprint", "rocket", "compass"],
  blueprint: ["blueprint", "datacube", "splitprism", "controls"],
  datacube: ["datacube", "blueprint", "controls", "archive", "citationlens", "neuralbrain", "booklamp", "learningtree", "compass", "bulb", "shieldserver", "satellite"],
  bulb: ["bulb", "citationlens", "compass", "booklamp", "learningtree"],
  controls: ["controls", "shieldserver", "router", "splitprism"],
  shieldserver: ["shieldserver", "router", "controls", "archive"],
};
const genericMotifs: ArtworkMotif[] = ["archive", "citationlens", "neuralbrain", "booklamp", "learningtree", "compass", "blueprint", "datacube", "bulb", "controls", "shieldserver", "satellite"];
const topicMotifs: Partial<Record<ResearchTopicKey, ArtworkMotif>> = {
  solid: "battery", sodium: "atoms", nasicon: "lattice", grid: "gridbattery", hydrogen: "hydrogen", recycling: "recycling",
};

const motifCells: Record<ArtworkMotif, number> = {
  booklamp: 0, rocket: 1, router: 2, scanner: 3, splitprism: 4, citationlens: 5,
  archive: 6, satellite: 7, newspaper: 8, neuralbrain: 9, battery: 10, atoms: 11,
  lattice: 12, gridbattery: 13, hydrogen: 14, recycling: 15, learningtree: 16,
  compass: 17, trophy: 18, blueprint: 19, datacube: 20, bulb: 21, controls: 22,
  shieldserver: 23,
};
const motifLabels: Record<ArtworkMotif, string> = {
  booklamp: "书灯", rocket: "火箭", router: "网络路由器", scanner: "文档扫描仪", splitprism: "分光棱镜", citationlens: "引文放大镜",
  archive: "档案柜", satellite: "卫星天线", newspaper: "日报", neuralbrain: "神经网络", battery: "电池", atoms: "钠原子",
  lattice: "晶格", gridbattery: "电网电池", hydrogen: "氢能", recycling: "回收循环", learningtree: "学习树", compass: "指南针",
  trophy: "奖杯", blueprint: "蓝图", datacube: "数据方块", bulb: "灯泡", controls: "控制旋钮", shieldserver: "安全服务器",
};

export function getResearchTopic(text: string): { key: ResearchTopicKey; label: string; color: string } {
  const value = text.toLocaleLowerCase();
  const key: ResearchTopicKey = /nasicon/.test(value) ? "nasicon"
    : /sodium|钠/.test(value) ? "sodium"
      : /hydrogen|氢/.test(value) ? "hydrogen"
        : /recycl|回收/.test(value) ? "recycling"
          : /grid|电网|储能系统/.test(value) ? "grid"
            : /solid|固态/.test(value) ? "solid" : "general";
  const { label, color } = topicInfo[key];
  return { key, label, color };
}

export function TopicArtwork({ text, className = "", motif, variant = 0, helpIndex, paperId }: { text: string; className?: string; motif?: ArtworkMotif; variant?: number; helpIndex?: number; paperId?: string }) {
  if (paperId) return <PaperArtwork paperId={paperId} className={className} />;
  const topic = getResearchTopic(text);
  const info = topicInfo[topic.key];
  const topicMotif = topicMotifs[topic.key];
  const useTopicAtlas = helpIndex === undefined && !motif && info.cell >= 0 && Math.abs(variant) % 2 === 0;
  const selectedMotif = motif
    ? motifVariants[motif][Math.abs(variant) % motifVariants[motif].length]
    : topicMotif && !useTopicAtlas
      ? topicMotif
      : info.cell < 0
        ? genericMotifs[Math.abs(variant) % genericMotifs.length]
        : undefined;
  const cell = selectedMotif ? motifCells[selectedMotif] : info.cell;
  const style = helpIndex !== undefined
    ? { "--help-x": `${(helpIndex % 5) * 25}%`, "--help-y": `${Math.floor(helpIndex / 5) * 20}%` } as React.CSSProperties
    : selectedMotif
      ? { "--motif-x": `${(cell % 6) * 20}%`, "--motif-y": `${Math.floor(cell / 6) * (100 / 3)}%` } as React.CSSProperties
      : { "--topic-x": `${(cell % 3) * 50}%`, "--topic-y": `${Math.floor(cell / 3) * 100}%` } as React.CSSProperties;
  const atlas = helpIndex !== undefined ? "help" : selectedMotif ? "motif" : "topic";
  const artworkLabel = helpIndex !== undefined ? `帮助主题：${text}` : motif || selectedMotif ? `${motifLabels[selectedMotif ?? motif!]}插画示意` : `${topic.label}主题示意`;
  return <figure className={`topic-artwork topic-artwork-${topic.color} ${className}`.trim()} aria-label={artworkLabel}>
    <div className="topic-artwork-visual" data-artwork-atlas={atlas} style={style}>
      <span className="topic-artwork-caption">主题示意</span>
    </div>
  </figure>;
}
