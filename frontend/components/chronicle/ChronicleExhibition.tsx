"use client";
import React, { useEffect, useRef, useState } from "react";
import { families, marketSeries, type Exhibit } from "../../lib/chronicle/data";
import { researchRoutes, solidResearch } from "../../lib/chronicle/researchRoutes";
import { assetForExhibit } from "../../lib/chronicle/assets";
import { companyProfiles } from "../../lib/chronicle/companyProfiles";
import type { ChapterId } from "../../lib/chronicle/chapters";
import { ChronicleReading } from "./ChronicleReading";
import styles from "./chronicle.module.css";
import GlideSelect from "../react-bits/GlideSelect";
const sections = [["history", "历史"], ["materials", "材料"], ["papers", "论文"], ["industry", "企业"], ["market", "政策市场"], ["storage", "储能适配"]] as const;

function MarketBackground() {
  return <svg className={styles.marketVisual} viewBox="0 0 800 440" role="img" aria-label="中国新型储能全部技术累计容量：2021年8、2022年18.05、2023年66.87、2024年168.2、2025年351GWh">
    {marketSeries.map((item, index) => <g key={item.year}><rect x={60 + index * 145} y={370 - item.gwh * .85} width="86" height={item.gwh * .85} rx="3" /><text x={103 + index * 145} y={355 - item.gwh * .85} textAnchor="middle">{item.gwh}</text><text x={103 + index * 145} y="402" textAnchor="middle">{item.year}</text></g>)}
    <text x="40" y="34">中国新型储能（全部技术）· 容量 / GWh</text>
  </svg>;
}

export function ChronicleExhibition() {
  const [act, setAct] = useState<ChapterId>("history");
  const [route, setRoute] = useState("固态电池");
  const [year, setYear] = useState(2024);
  const [materialId, setMaterialId] = useState("sulfide");
  const [companyId, setCompanyId] = useState("quantumscape");
  const [reading, setReading] = useState(false);
  const [motion, setMotion] = useState(true);
  const [replay, setReplay] = useState(0);
  const entry = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => { if (!reading && restoreFocus.current) { entry.current?.focus(); restoreFocus.current = false; } }, [reading]);
  const research = researchRoutes[route];
  const solid = !!research;
  const available = research ?? solidResearch;
  const { timeline, materials, companies, policy, market } = available;
  const family = families.find(([, names]) => names.includes(route))!;
  const node = timeline.find(item => item.yearNumber === year) ?? timeline.find(item => item.yearNumber === 2024) ?? timeline[timeline.length - 1];
  const chapter = available.chapters.find(section => section.id === act)!;
  const overview: Exhibit = { id: act, label: chapter.label, title: chapter.title, year: act === "papers" ? "证据" : "应用", copy: route === "固态电池" ? act === "papers" ? "循环、比能和电导率回答不同问题。对照原论文的材料层级、温度和压力，再判断结果适用范围。" : "固定储能关心系统寿命、安全和交付成本。材料与车用电芯成果，需要继续核对电站运行条件。" : act === "papers" ? "从原始论文与产品披露中拆分材料、电芯和系统指标。测试条件随数据一起阅读。" : "从电芯进入储能系统，关注名义配置、实际运行和维护成本。项目规模与长期表现分别观察。", facts: act === "papers" ? node.facts : market.facts, subject: act === "papers" ? available.historySubject : "scene:market" };
  const item: Exhibit = act === "history" ? node : act === "materials" ? materials.find(item => item.id === materialId) ?? materials[0] : act === "industry" ? companies.find(item => item.id === companyId) ?? companies[0] : act === "market" ? policy : act === "papers" ? available.papers ?? overview : available.storage ?? overview;
  const profile = solid && act === "industry" ? companyProfiles[item.id] : undefined;
  const standardNode = route === "固态电池" && act === "history" && node.yearNumber === 2026;
  const policySubject = route === "固态电池" ? "scene:solid-policy" : route === "锂离子" ? "scene:lithium-policy" : route === "钠离子" ? "scene:sodium-policy" : available.policy.subject;
  const asset = solid ? assetForExhibit(available.historySubject, act, item, standardNode ? "scene:solid-standard" : act === "market" ? policySubject : undefined) : undefined;
  const photoContext = asset?.kind === "ai-illustration" ? "示意图" : asset?.context ?? "对应主题资料";
  const copy = solid ? item.copy : "这条路线将按起源、材料、企业与应用条件组织独立研究。固态电池的完整样板已开放阅读。";
  const stop = copy.indexOf("。");
  const lines = stop >= 0 && stop < copy.length - 1 ? [copy.slice(0, stop + 1), copy.slice(stop + 1)] : copy.split("；");
  function enter() { if (!solid) chooseRoute("固态电池"); setReading(true); }
  function chooseRoute(value: string) { const next = researchRoutes[value]; setRoute(value); if (!next) setReading(false); if (next) { setYear(next.timeline.find(item => item.yearNumber === 2024)?.yearNumber ?? next.timeline[next.timeline.length - 1].yearNumber); setMaterialId(next.materials[0].id); setCompanyId(next.companies[0].id); } }
  return <div className={`${styles.root} ${motion ? "" : styles.paused}`}>
    <div className={styles.header}><p className={styles.eyebrow}>技术发展与原始证据 / {solid ? route + "专题" : "独立史料整理"}</p><div className={styles.controls}><button type="button" onClick={() => setMotion(!motion)}>{motion ? "暂停动效" : "播放动效"}</button><button type="button" onClick={() => setReplay(replay + 1)}>重播入场</button></div></div>
    <div className={styles.toolbar}><nav aria-label="编年史栏目">{sections.map(([id, label]) => <button key={id} type="button" aria-pressed={act === id} onClick={() => setAct(id)}>{label}</button>)}</nav><div className={styles.selectors}><label>家族<GlideSelect ariaLabel="家族" animateLabel menuClassName={styles.chronicleGlideMenu} value={family[0]} onChange={value => chooseRoute(value === "电化学储能" ? "固态电池" : families.find(([name]) => name === value)![1][0])} options={families.map(([name]) => ({value:name,label:name}))} /></label><label>路线<GlideSelect ariaLabel="路线" animateLabel menuClassName={styles.chronicleGlideMenu} value={route} onChange={chooseRoute} options={family[1].map(name => ({value:name,label:name}))} /></label></div></div>
    {solid && act === "materials" && <div className={styles.subjects}><label>材料路线<GlideSelect ariaLabel="材料路线" animateLabel menuClassName={styles.chronicleGlideMenu} value={materialId} onChange={setMaterialId} options={materials.map(item => ({value:item.id,label:item.label}))} /></label></div>}
    {solid && act === "industry" && <div className={styles.subjects}><label>企业<GlideSelect ariaLabel="企业" animateLabel menuClassName={styles.chronicleGlideMenu} value={companyId} onChange={setCompanyId} options={companies.map(item => ({value:item.id,label:item.label}))} /></label></div>}
    {reading ? <ChronicleReading research={available} chapterId={act} node={node} asset={asset} profile={profile} onBack={() => { restoreFocus.current = true; setReading(false); }} /> : <>
      <section key={`${act}-${item.id}-${route}-${replay}`} className={styles.stage} aria-label="技术展厅">
        <div className={styles.visual}>{asset && <img src={asset.src} alt={asset.alt} data-kind={asset.kind ?? "real-photo"} className={styles.photo} />}{solid && act === "market" && available.showMarketChart !== false && <MarketBackground />}<div className={styles.wash} /><div className={styles.beam} /></div>
        <div className={`${styles.year} ${act === "materials" || !solid ? styles.word : ""}`}>{solid ? item.year : "待整理"}</div>
        <div className={styles.stageContent}><p className={styles.eyebrow}>{route} / {sections.find(([id]) => id === act)![1]}</p>{solid && (act === "market" || act === "storage") && <p className={styles.scope}>{market.label}</p>}<h2>{solid ? `${act === "industry" ? item.label + " · " : ""}${item.title}` : route + " · 史料正在整理"}</h2>{profile && <div className={styles.companyProfile}><p>{profile.summary}</p>{profile.listing && <p><small>{profile.listing}</small></p>}{profile.scale && <p><small>{profile.scale}<br />{profile.asOf}</small></p>}{profile.marketCap && <p><strong>{profile.marketCap.display}</strong><br /><small>市值快照 · {profile.marketCap.date} · {profile.marketCap.issuer} · {profile.marketCap.currency}</small></p>}</div>}<div className={styles.intro}>{lines.filter(Boolean).map((line, i) => <p key={i}>{line}{i === 0 && lines.length > 1 && !line.endsWith("。") ? "；" : ""}</p>)}</div><div className={styles.facts}>{(solid ? item.facts : [["资料待整理", "保留路线入口，不生成虚构数据"]]).map(([value, condition]) => <span key={value}><strong>{value}</strong><small>{condition}</small></span>)}</div>{solid && act === "market" && <p className={styles.intro}>{market.copy}</p>}<button ref={entry} type="button" className={styles.enter} onClick={enter}>{solid ? "进入详解" : "阅读固态完整样板"}</button></div>
        <div className={styles.credit}>{asset ? <><span>{photoContext}</span>{asset.kind !== "ai-illustration" && <small>{asset.credit}</small>}{asset.sourceUrl && <a href={asset.sourceUrl} target="_blank" rel="noreferrer" title={asset.license}>图片来源与说明 ↗</a>}</> : <span>{solid && act === "market" ? "国家能源局原始统计 · 来源与口径见详解" : "本主题对应素材整理中"}</span>}</div>
      </section>
      {solid && act === "history" && <nav className={styles.timeline} aria-label="历史年份">{timeline.map(item => <button key={item.year} type="button" aria-label={`${item.year}，${item.label}`} aria-pressed={node.yearNumber === item.yearNumber} onClick={() => setYear(item.yearNumber)}>{item.year}</button>)}</nav>}
      
    </>}
  </div>;
}
