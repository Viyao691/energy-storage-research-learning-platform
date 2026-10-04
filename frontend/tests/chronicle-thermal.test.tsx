// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ChronicleExhibition } from "../components/chronicle/ChronicleExhibition";
import { assetIdFor, getAsset } from "../lib/chronicle/assets";
import { companyProfiles } from "../lib/chronicle/companyProfiles";
import { researchRoutes } from "../lib/chronicle/researchRoutes";
const routes=["显热储能","潜热储能","热化学储能"];
afterEach(cleanup);
function selectRoute(name:string){fireEvent.change(screen.getByRole("combobox",{name:"家族"}),{target:{value:"热储能"}});fireEvent.change(screen.getByRole("combobox",{name:"路线"}),{target:{value:name}});}
it("thermal routes have independent chronology, media, chapters and energy boundaries",()=>{
 for(const name of routes){const r=researchRoutes[name];expect(r?.name).toBe(name);expect(r.timeline.length).toBeGreaterThanOrEqual(6);expect(r.materials.length).toBeGreaterThanOrEqual(3);expect(r.chapters.map(c=>c.id)).toEqual(["history","materials","papers","industry","market","storage"]);expect(r.showMarketChart).toBe(false);expect(r.papers).toBeTruthy();expect(r.storage).toBeTruthy();}
});
it("thermal market never displays the national electric-storage capacity graph",()=>{
 render(<ChronicleExhibition/>);for(const name of routes){selectRoute(name);fireEvent.click(screen.getByRole("button",{name:"政策市场"}));expect(screen.queryByText("中国新型储能（全部技术）")).toBeNull();expect(screen.getByRole("region",{name:"技术展厅"}).querySelector("svg")).toBeNull();expect(screen.queryByText("阅读固态完整样板")).toBeNull();}
});
it("thermal papers open their own reading chapter and retain selection on return",()=>{
 render(<ChronicleExhibition/>);for(const name of routes){selectRoute(name);fireEvent.click(screen.getByRole("button",{name:"论文"}));fireEvent.click(screen.getByRole("button",{name:"进入详解"}));expect(screen.getByRole("heading",{name:researchRoutes[name].chapters.find(c=>c.id==="papers")!.title})).toBeTruthy();expect(screen.queryByText("6000次")).toBeNull();fireEvent.click(screen.getByRole("button",{name:/返回现场/}));expect(screen.getByRole("button",{name:"论文"}).getAttribute("aria-pressed")).toBe("true");}
});

it("sensible heat separates heat capacity, electric power and emissions",()=>{
 const r=researchRoutes["显热储能"];expect(r.timeline.find(n=>n.yearNumber===2008)!.facts[0]).toEqual(["50MW_e / 1010MWh_th","Andasol1汽轮机/热储容量，7.5h配置"]);expect(r.timeline.find(n=>n.yearNumber===2025)!.facts[0][0]).toBe("1MW_th / 100MWh_th");expect(r.timeline.find(n=>n.yearNumber===2026)!.facts[0][1]).toContain("排放");expect(r.timeline.find(n=>n.yearNumber===2026)!.copy).toContain("非转换效率");
});
it("latent results retain sample and encapsulation boundaries",()=>{
 const r=researchRoutes["潜热储能"];expect(r.timeline.find(n=>n.yearNumber===2011)!.facts[0][0]).toBe("约680kWh_th / 14t");expect(r.timeline.find(n=>n.yearNumber===2026)!.facts[0][1]).toContain("潜热保留率");expect(r.companies.find(c=>c.id==="thermal-latent-mga")!.facts[1][0]).toBe("0.5MW_e / 0.5MW_th");expect(r.companies.find(c=>c.id==="thermal-latent-sunamp")!.year).toBe("产品");
});
it("thermochemical keeps steam, dry-mass denominator and bed-normalized power",()=>{
 const r=researchRoutes["热化学储能"];expect(r.timeline.find(n=>n.yearNumber===2015)!.facts[2][0]).toContain("60°C");expect(r.timeline.find(n=>n.yearNumber===2022)!.facts[0][0]).toContain("干材料");expect(r.timeline.find(n=>n.yearNumber===2024)!.facts[0][1]).toContain("归一化");expect(r.companies.find(c=>c.id==="thermal-thermochemical-tempo")!.copy).toContain("目标");expect(r.chapters.find(c=>c.id==="materials")!.content).toContain("CaCO₃");expect(r.chapters.find(c=>c.id==="materials")!.content).toContain("Ca(OH)₂");
});
it("thermal images and profiles use their own route and component subjects",()=>{
 for(const name of routes){const r=researchRoutes[name];expect(getAsset(assetIdFor(r.historySubject))?.kind).toBe("real-photo");for(const material of r.materials){const asset=getAsset(assetIdFor(material.subject));expect(asset?.kind).toBe("ai-illustration");expect(asset?.subjects).toContain(material.subject);}for(const company of r.companies)expect(companyProfiles[company.id]?.summary).toBeTruthy();expect(getAsset(assetIdFor(r.policy.subject,"document"))?.id).toBe("thermal-policy-14th-plan-page6");}
});
it("thermal history opens selected actual event and restores that year",()=>{
 render(<ChronicleExhibition/>);for(const name of routes){selectRoute(name);fireEvent.click(screen.getByRole("button",{name:"历史"}));const node=researchRoutes[name].timeline[0];const label=node.year+"，"+node.label;fireEvent.click(screen.getByRole("button",{name:label}));fireEvent.click(screen.getByRole("button",{name:"进入详解"}));expect(screen.getByRole("heading",{name:node.year+" · "+node.label})).toBeTruthy();fireEvent.click(screen.getByRole("button",{name:/返回现场/}));expect(screen.getByRole("button",{name:label}).getAttribute("aria-pressed")).toBe("true");}
});
