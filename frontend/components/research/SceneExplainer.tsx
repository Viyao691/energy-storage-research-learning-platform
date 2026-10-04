import React from "react";
import EnergySceneIllustration from "./EnergySceneIllustration";
import SceneMechanismSketch from "./SceneMechanismSketch";
import type { CityMode, CityScene, DiagramNode } from "./storageCityScenes";
import styles from "./StorageCityApplications.module.css";

const hydroDischarge: [DiagramNode, DiagramNode, DiagramNode] = [
  { label: "上水库放水", icon: "hydroUpper" },
  { label: "水轮机发电", icon: "turbine" },
  { label: "送入电网", icon: "grid" },
];

function RowIcon({ kind }: { kind: "location" | "purpose" | "operation" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {kind === "location" && <><path d="M12 21s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></>}
    {kind === "purpose" && <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>}
    {kind === "operation" && <><path d="M4 19V12h3v7M10 19V7h3v12M16 19V4h3v15M3 19h18" /></>}
  </svg>;
}

export default function SceneExplainer({ scene, index, mode, paused }: { scene: CityScene; index: number; mode: CityMode; paused: boolean }) {
  const hydroGenerating = scene.id === "hydro" && mode === "discharge";
  const nodes = hydroGenerating ? hydroDischarge : scene.diagram;
  const firstArrow = mode === "charge" || hydroGenerating;
  const secondArrow = mode === "discharge" || (mode === "emergency" && Boolean(scene.emergency));
  const operation = mode === "charge" ? scene.charge : mode === "discharge" ? scene.discharge : scene.emergency ?? "当前场景不展示应急供电。需具备隔离、切换和备用供电配置。";

  return <aside className={styles.infoCard} aria-live="polite">
    <div className={styles.infoHeading}>
      <span className={styles.infoBadge}>{String(index + 1).padStart(2, "0")}</span>
      <div><p>SCENE {String(index + 1).padStart(2, "0")} / 08</p><h2>{scene.title}</h2></div>
    </div>
    <p className={styles.infoTagline}>{scene.tagline}</p>

    <div className={styles.diagram} data-testid="scene-diagram" data-mode={mode} data-paused={paused} aria-label={`${scene.title}能量流向图`}>
      {nodes.map((node, nodeIndex) => <React.Fragment key={`${node.label}-${nodeIndex}`}>
        {nodeIndex > 0 && <span className={nodeIndex === 1 ? (firstArrow ? styles.diagramArrowActive : styles.diagramArrow) : (secondArrow ? styles.diagramArrowActive : styles.diagramArrow)} data-moving-arrow={(nodeIndex === 1 ? firstArrow : secondArrow) ? "" : undefined} aria-hidden="true">→</span>}
        <div className={styles.diagramNode}><EnergySceneIllustration kind={node.icon} className={styles.diagramIcon} /><strong>{node.label}</strong></div>
      </React.Fragment>)}
    </div>

    <div className={styles.factRows}>
      <div className={styles.factRow}><RowIcon kind="location" /><strong>位置</strong><span>{scene.location}</span></div>
      <div className={styles.factRow}><RowIcon kind="purpose" /><strong>作用</strong><span>{scene.purpose}</span></div>
      <div className={styles.factRow}><RowIcon kind="operation" /><strong>运行</strong><span>{operation}</span></div>
    </div>

    <details className={styles.details} key={`${scene.id}-principle`}>
      <summary>展开应用原理<span aria-hidden="true">⌄</span></summary>
      <div className={styles.detailBody}>
        <div className={styles.detailVisualHeading}><EnergySceneIllustration kind={scene.diagram[0].icon} className={styles.detailIcon} /><strong>运行机制示意</strong></div>
        <SceneMechanismSketch sceneId={scene.id} className={styles.mechanismSketch} />
        <ol className={styles.detailSteps}>{scene.principleSteps.map((step, stepIndex) => <li key={step.title}><span className={styles.detailNumber}>{String(stepIndex + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></li>)}</ol>
      </div>
    </details>
    <details className={styles.details} key={`${scene.id}-conditions`}>
      <summary>适用条件与技术<span aria-hidden="true">⌄</span></summary>
      <div className={styles.detailBody}>
        <div className={styles.detailVisualHeading}><EnergySceneIllustration kind={scene.diagram[2].icon} className={styles.detailIcon} /><strong>工程核对要点</strong></div>
        <ol className={styles.detailSteps}>{scene.conditionSteps.map((step, stepIndex) => <li key={step.title}><span className={styles.detailNumber}>{String(stepIndex + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></li>)}</ol>
      </div>
    </details>
    {scene.id === "thermal" && <p className={styles.technicalNote}>火储联合调频按 AGC 指令快速双向响应，图中日夜状态只示意充放电方向。</p>}
  </aside>;
}
