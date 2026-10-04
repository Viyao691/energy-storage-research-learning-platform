// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ChronicleExhibition } from "../components/chronicle/ChronicleExhibition";
import { researchRoutes } from "../lib/chronicle/researchRoutes";
import { assetIdFor, getAsset } from "../lib/chronicle/assets";
import { companyProfiles } from "../lib/chronicle/companyProfiles";
const routes=["抽水蓄能","绝热压缩空气","常规压缩空气","液态空气","飞轮","重力储能"];
afterEach(cleanup);
function selectRoute(name:string){fireEvent.change(screen.getByRole("combobox",{name:"家族"}),{target:{value:"机械储能"}});fireEvent.change(screen.getByRole("combobox",{name:"路线"}),{target:{value:name}});}
it("six mechanical routes own history, component topics, evidence and storage chapters",()=>{
 for(const name of routes){const research=researchRoutes[name];expect(research?.name).toBe(name);expect(research.timeline.length).toBeGreaterThanOrEqual(5);expect(research.materials.length).toBeGreaterThanOrEqual(3);expect(research.chapters.map(c=>c.id)).toEqual(["history","materials","papers","industry","market","storage"]);expect(research.papers).toBeTruthy();expect(research.storage).toBeTruthy();for(const node of research.timeline){expect(node.source).toMatch(/^https:\/\//);expect(node.facts.length).toBeGreaterThan(0);}}
});
it("pumped hydro shows independent GW statistics and no new-storage chart",()=>{
 render(<ChronicleExhibition/>);selectRoute("抽水蓄能");fireEvent.click(screen.getByRole("button",{name:"政策市场"}));expect(screen.getByText("65.94GW")).toBeTruthy();expect(screen.getByText("7.48GW")).toBeTruthy();expect(screen.queryByText("中国新型储能（全部技术）")).toBeNull();expect(screen.getByRole("region",{name:"技术展厅"}).querySelector("svg")).toBeNull();
});
it("each route opens its own papers reader and retains its section on return",()=>{
 render(<ChronicleExhibition/>);for(const name of routes){selectRoute(name);fireEvent.click(screen.getByRole("button",{name:"论文"}));fireEvent.click(screen.getByRole("button",{name:"进入详解"}));expect(screen.getByRole("heading",{name:researchRoutes[name].chapters.find(c=>c.id==="papers")!.title})).toBeTruthy();expect(screen.queryByText("6000次")).toBeNull();fireEvent.click(screen.getByRole("button",{name:/返回现场/}));expect(screen.getByRole("button",{name:"论文"}).getAttribute("aria-pressed")).toBe("true");}
});

it("CAES keeps thermal tests, fuel input and commercial engineering boundaries",()=>{
 const heat=researchRoutes["绝热压缩空气"].timeline.find(n=>n.yearNumber===2018)!;
 expect(heat.facts[0][0]).toBe("11.6MWhₜₕ");expect(heat.facts[1][0]).toBe("171.5kWhₜₕ");
 const full=researchRoutes["绝热压缩空气"].timeline.find(n=>n.yearNumber===2025)!;expect(full.facts[0][0]).toBe("300MW / 1500MWh");expect(full.facts[1][1]).toContain("工程披露");
 expect(researchRoutes["常规压缩空气"].storage!.copy).toContain("燃料");expect(researchRoutes["常规压缩空气"].timeline.find(n=>n.yearNumber===2011)!.detail).toContain("终止");
});
it("liquid-air data retains construction status and model waste-heat conditions",()=>{
 const r=researchRoutes["液态空气"];expect(r.timeline.find(n=>n.yearNumber===2013)!.facts[0][1]).toContain("300K");expect(r.timeline.find(n=>n.yearNumber===2025)!.detail).toContain("破土");expect(r.timeline.find(n=>n.yearNumber===2026)!.detail).toContain("在建");expect(r.storage!.facts[1][1]).toContain("在建");
});
it("flywheel distinguishes measured speed, design speed and frequency-response duration",()=>{
 const r=researchRoutes["飞轮"];expect(r.timeline.find(n=>n.yearNumber===2004)!.facts[0][0]).toBe("41000rpm");expect(r.timeline.find(n=>n.yearNumber===2006)!.facts[0][1]).toContain("设计");expect(r.timeline.find(n=>n.yearNumber===2011)!.facts[0][1]).toContain("15min");expect(r.timeline.find(n=>n.yearNumber===2024)!.facts[0][0]).toBe("30MW");
});
it("gravity preserves first-unit testing and planned/modelled capacities",()=>{
 const r=researchRoutes["重力储能"];expect(r.timeline.find(n=>n.yearNumber===2024)!.facts[0][1]).toContain("首组");expect(r.timeline.find(n=>n.yearNumber===2025)!.facts[0][1]).toContain("模型");expect(r.timeline.find(n=>n.yearNumber===2026)!.facts[1][1]).toContain("合作意向");
});
it("component and history images match mechanical subjects and company profiles stay scoped",()=>{
 for(const name of routes){const r=researchRoutes[name];expect(getAsset(assetIdFor(r.historySubject))?.subjects).toContain(r.historySubject);for(const m of r.materials)expect(getAsset(assetIdFor(m.subject))?.subjects).toContain(m.subject);for(const c of r.companies){expect(companyProfiles[c.id]?.summary).toBeTruthy();expect(c.subject).toBe("company:"+c.id);}}
 expect(getAsset(assetIdFor(researchRoutes["抽水蓄能"].policy.subject,"document"))?.sourceUrl).toContain("20260212");
});
it("history selection reaches the matching record and survives return",()=>{
 render(<ChronicleExhibition/>);for(const name of routes){selectRoute(name);fireEvent.click(screen.getByRole("button",{name:"历史"}));const first=researchRoutes[name].timeline[0];const button=screen.getByRole("button",{name:first.year+"，"+first.label});fireEvent.click(button);fireEvent.click(screen.getByRole("button",{name:"进入详解"}));expect(screen.getByRole("heading",{name:first.year+" · "+first.label})).toBeTruthy();fireEvent.click(screen.getByRole("button",{name:/返回现场/}));expect(screen.getByRole("button",{name:first.year+"，"+first.label}).getAttribute("aria-pressed")).toBe("true");}
});
