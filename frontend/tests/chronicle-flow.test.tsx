// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ChronicleExhibition } from "../components/chronicle/ChronicleExhibition";
import { researchRoutes } from "../lib/chronicle/researchRoutes";
import { companyProfiles } from "../lib/chronicle/companyProfiles";
import { assetIdFor, getAsset } from "../lib/chronicle/assets";
const routes=["全钒液流","铁铬液流","锌溴液流","有机液流"];
afterEach(cleanup);
const chapterIds=["history","materials","papers","industry","market","storage"];
it("four routes own sourced history, materials and all six research chapters",()=>{
 for(const name of routes){const research=researchRoutes[name];expect(research.name).toBe(name);expect(research.timeline.length).toBeGreaterThanOrEqual(7);expect(research.materials.length).toBeGreaterThanOrEqual(3);expect(research.chapters.map(c=>c.id)).toEqual(chapterIds);for(const node of research.timeline)expect(node.source).toMatch(/^https:\/\//);for(const chapter of research.chapters)expect(chapter.content.length).toBeGreaterThan(100);expect(research.papers).toBeTruthy();expect(research.storage).toBeTruthy();}
});
it("vanadium prototype efficiency and separate grid project configurations remain distinct",()=>{
 const research=researchRoutes["全钒液流"];const prototype=research.timeline.find(n=>n.yearNumber===2013)!;expect(research.timeline.find(n=>n.yearNumber===1985)!.source).toBe("https://doi.org/10.1016/0378-7753%2885%2980071-9");expect(research.timeline.find(n=>n.yearNumber===1991)!.source).toBe("https://doi.org/10.1016/0378-7753%2891%2980058-6");expect(prototype.facts.map(f=>f.join(" ")).join(" ")).toMatch(/82%.*80mA\/cm².*15–85%SOC/);expect(research.timeline.find(n=>n.yearNumber===2015)!.facts[0][0]).toBe("15MW / 60MWh");expect(research.timeline.find(n=>n.yearNumber===2022)!.facts[0][0]).toBe("17MW / 51MWh");expect(research.timeline.find(n=>n.yearNumber===2025)!.detail).toContain("开工");
});
it("iron chromium keeps NASA conditions and the two bismuth findings",()=>{
 const research=researchRoutes["铁铬液流"];const trial=research.timeline.find(n=>n.yearNumber===1985)!;expect(trial.facts.map(f=>f.join(" ")).join(" ")).toContain("65°C / 80mA/cm²");expect(trial.detail).toContain("75%");expect(trial.detail).toContain("81%");const catalyst=research.timeline.find(n=>n.yearNumber===2024)!;expect(catalyst.detail).toContain("促进氢气");expect(catalyst.detail).toContain("85.8%");expect(research.timeline.find(n=>n.yearNumber===2023)!.detail).toContain("4600");
});
it("zinc bromine separates three 2026 sample conditions and static versus flow results",()=>{
 const research=researchRoutes["锌溴液流"];const trial=research.timeline.find(n=>n.yearNumber===2026)!;expect(trial.facts).toEqual([[">2300次","室温 · 40mA/cm² / 40mAh/cm²"],[">3300h","室温 · 充200 / 放80mA/cm²"],[">1600次","−20°C · 40mA/cm²独立试验组"]]);expect(research.timeline.find(n=>n.yearNumber===1991)!.detail).toContain("静态");expect(research.materials[0].copy).toContain("沉积");
});
it("organic research distinguishes organic chemistry and SolidFlow architecture",()=>{
 const research=researchRoutes["有机液流"];const text=research.chapters.map(c=>c.content+" "+c.details).join(" ");expect(text).toMatch(/醌/);expect(text).toMatch(/SolidFlow/);expect(text).toMatch(/混合|有机.*无机/);expect(text).not.toContain("6000次循环至80%");
});
it("route navigation opens each own papers chapter and retains its section on return",()=>{
 render(<ChronicleExhibition/>);for(const name of routes){fireEvent.change(screen.getByRole("combobox",{name:"路线"}),{target:{value:name}});fireEvent.click(screen.getByRole("button",{name:"论文"}));expect(screen.queryByText("6000次")).toBeNull();fireEvent.click(screen.getByRole("button",{name:/进入详解/}));expect(screen.getByRole("heading",{name:researchRoutes[name].chapters.find(c=>c.id==="papers")!.title})).toBeTruthy();fireEvent.click(screen.getByRole("button",{name:/返回现场/}));expect(screen.getByRole("button",{name:"论文"}).getAttribute("aria-pressed")).toBe("true");}
});
it("policy images use each route subject, and background statistics identify all technologies",()=>{
 render(<ChronicleExhibition/>);fireEvent.click(screen.getByRole("button",{name:"政策市场"}));for(const name of routes){fireEvent.change(screen.getByRole("combobox",{name:"路线"}),{target:{value:name}});const asset=getAsset(assetIdFor(researchRoutes[name].policy.subject,"document"));expect(screen.getByRole("region",{name:"技术展厅"}).querySelector("img")?.getAttribute("src")).toBe(asset?.src);expect(screen.getByText("中国新型储能（全部技术）")).toBeTruthy();expect(researchRoutes[name].policy.subject).not.toContain("sodium");}
});
it("researched companies have matching profile and scoped original assets",()=>{
 for(const name of routes){for(const material of researchRoutes[name].materials){const asset=getAsset(assetIdFor(material.subject));expect(asset?.kind).toBe("ai-illustration");expect(asset?.subjects).toContain(material.subject);}for(const company of researchRoutes[name].companies){expect(companyProfiles[company.id]?.summary).toBeTruthy();expect(company.subject).toBe("company:"+company.id);const asset=getAsset(assetIdFor(company.subject));if(asset)expect(asset.subjects).toContain(company.subject);}}expect(companyProfiles["vanadium-sumitomo"].marketCap?.date).toBe("2026-10-02");expect(companyProfiles["vanadium-invinity"].marketCap?.value).toBe(123870000);
});
it("an unresearched route remains isolated after visiting a new flow route",()=>{
 render(<ChronicleExhibition/>);fireEvent.change(screen.getByRole("combobox",{name:"路线"}),{target:{value:"全钒液流"}});fireEvent.click(screen.getByRole("button",{name:"企业"}));fireEvent.change(screen.getByRole("combobox",{name:"路线"}),{target:{value:"铅酸"}});expect(screen.getByRole("heading",{name:/铅酸 · 史料正在整理/})).toBeTruthy();expect(screen.queryByText(/市值快照/)).toBeNull();expect(screen.queryByRole("combobox",{name:"企业"})).toBeNull();
});