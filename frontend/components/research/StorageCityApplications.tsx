"use client";

import React, { useState } from "react";
import SceneExplainer from "./SceneExplainer";
import { cityScenes, type CityMode } from "./storageCityScenes";
import styles from "./StorageCityApplications.module.css";

const modes: { value: CityMode; label: string }[] = [
  { value: "charge", label: "日间充电" },
  { value: "discharge", label: "晚高峰放电" },
  { value: "emergency", label: "应急供电" },
];

const networkLinks = [
  { from: "renewable", to: "grid", path: "M20 19 C34 17 44 26 57 27 S72 29 79 27" },
  { from: "thermal", to: "grid", path: "M58 17 C65 18 68 27 79 27" },
  { from: "hydro", to: "grid", path: "M87 7 C89 13 93 17 91 22 C88 25 84 26 79 27", charge: "M79 27 C84 26 88 25 91 22 C93 17 89 13 87 7" },
  { from: "grid", to: "industrial", path: "M79 27 C69 31 57 39 45 43 S36 47 32 48" },
  { from: "grid", to: "community", path: "M79 27 C84 34 83 42 81 50" },
  { from: "grid", to: "charging", path: "M79 27 C68 38 54 44 45 54 S35 63 30 68" },
  { from: "grid", to: "hospital", path: "M79 27 C85 39 89 51 88 61 S89 70 89 74" },
] as const;

const backupPaths: Record<string, string> = {
  community: "M81 50 C84 54 87 57 90 59",
  hospital: "M89 74 C91 78 93 82 94 86",
};

export default function StorageCityApplications() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<CityMode>("charge");
  const [paused, setPaused] = useState(false);
  const scene = cityScenes[selectedIndex];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>ENERGY IN THE CITY <span>·</span> 科研图解 01</p>
          <h1>储能，如何融入一座城市</h1>
        </div>
        <div className={styles.headerMark} aria-hidden="true"><span>08</span><small>APPLICATIONS<br />EXPLORED</small></div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.modeControl} role="group" aria-label="演示状态">
          {modes.map(item => <button className={mode === item.value ? styles.modeActive : styles.modeButton} key={item.value} type="button" data-specular="off" aria-pressed={mode === item.value} onClick={() => setMode(item.value)}>{item.label}</button>)}
        </div>
        <button className={styles.pauseButton} type="button" aria-label={paused ? "继续动效" : "暂停动效"} onClick={() => setPaused(value => !value)}>{paused ? "▶ 继续动效" : "Ⅱ 暂停动效"}</button>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.visualCard} aria-label="城市应用示意图">
          <div className={styles.mapHeading}><span className={styles.mapNumber}>{String(selectedIndex + 1).padStart(2, "0")} / 08</span><span>城市能源应用鸟瞰</span><span className={styles.mapTag}>交互示意</span></div>
          <div className={styles.map} data-testid="city-map" data-mode={mode} data-paused={paused}>
            <div className={styles.mapImage} role="img" aria-label="包含发电、输电、工业、社区与关键负荷的城市鸟瞰插画" />
            <svg className={styles.routeLayer} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs><marker id="cityArrowhead" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 6 3 0 6Z" fill="#fbe3a0" /></marker></defs>
              {networkLinks.map(link => {
                const selected = scene.id === "grid" || link.from === scene.id || link.to === scene.id;
                const path = mode === "charge" && "charge" in link ? link.charge : link.path;
                return <React.Fragment key={`${link.from}-${link.to}`}>
                  <path data-network-link="" data-from={link.from} data-to={link.to} className={styles.networkTrack} d={path} />
                  {mode !== "emergency" && <path data-network-pulse="" className={`${styles.networkPulse} ${selected ? styles.networkPulseSelected : ""}`} d={path} markerEnd="url(#cityArrowhead)" />}
                </React.Fragment>;
              })}
              {mode === "emergency" && backupPaths[scene.id] && <><path className={styles.activeRouteGlow} d={backupPaths[scene.id]} /><path data-local-backup="" className={styles.activeRoute} d={backupPaths[scene.id]} markerEnd="url(#cityArrowhead)" /></>}
            </svg>
            {cityScenes.map((item, index) => (
              <button
                className={`${styles.hotspot} ${index === selectedIndex ? styles.hotspotActive : ""} ${item.x > 60 ? styles.hotspotFlip : ""}`}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                key={item.title}
                type="button"
                data-specular="off"
                aria-label={`场景 ${index + 1}：${item.title}`}
                aria-pressed={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
              ><span className={styles.hotspotNumber}>{String(index + 1).padStart(2, "0")}</span><span className={styles.hotspotLabel}>{item.title}</span></button>
            ))}
            <div className={styles.mapCorner} aria-hidden="true"><span>ENERGY FLOW</span><strong>{String(selectedIndex + 1).padStart(2, "0")}</strong></div>
          </div>
          <div className={styles.legend}><span><i className={styles.legendPulse} />运行流向</span><span><i className={styles.legendDot} />可选场景</span><small>示意图仅解释典型应用，不代表实时运行数据</small></div>
        </section>

        <SceneExplainer scene={scene} index={selectedIndex} mode={mode} paused={paused} />
      </div>

      <section className={styles.sceneSection} aria-label="选择应用场景">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>EXPLORE THE SYSTEM</p><h2>选择应用场景</h2></div><span>从能源生产到终端用电</span></div>
        <div className={styles.sceneGrid}>{cityScenes.map((item, index) => <button className={`${styles.sceneButton} ${index === selectedIndex ? styles.sceneButtonActive : ""}`} key={item.title} type="button" aria-label={`选择场景：${item.title}`} aria-pressed={index === selectedIndex} onClick={() => setSelectedIndex(index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><em aria-hidden="true">↗</em></button>)}</div>
      </section>

      <footer className={styles.note}><p>图解依据公开资料整理，运行路径为教学示意。火储调频实际响应 AGC 指令，不按固定日夜时段切换；抽蓄的抽水与发电是不同工况。</p><div><a href="https://www.eia.gov/energyexplained/electricity/energy-storage-for-electricity-generation.php" target="_blank" rel="noreferrer">EIA 储能应用 ↗</a><a href="https://www.energy.gov/cmei/systems/solar-integration-solar-energy-and-storage-basics" target="_blank" rel="noreferrer">DOE 光伏与储能 ↗</a><a href="https://www.energy.gov/cmei/water/pumped-storage-hydropower" target="_blank" rel="noreferrer">DOE 抽水蓄能 ↗</a><a href="https://blog.se.com/datacenter/2020/07/20/design-considerations-deployment-ups-systems-in-data-centers/" target="_blank" rel="noreferrer">UPS 连续供电 ↗</a><a href="https://epjournal.csee.org.cn/rc-pub/front/front-article/download/146757771/lowqualitypdf/Co-control%20Strategy%20for%20Hybrid%20Storage-assisted%20Thermal%20Power%20Unit%20Frequency%20Regulation%20Based%20on%20ICEEMDAN%20Decomposition.pdf" target="_blank" rel="noreferrer">火储联合调频研究 ↗</a></div></footer>
    </div>
  );
}
