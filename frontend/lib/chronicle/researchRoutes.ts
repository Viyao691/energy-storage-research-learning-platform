import { leadAcidResearch, zincResearch, metalAirResearch } from "./electrochemical";
import { supercapacitorResearch, smesResearch } from "./electromagnetic";
import { gasHydrogenResearch, liquidHydrogenResearch, solidHydrogenResearch, carrierHydrogenResearch } from "./hydrogen";
import { companies, market, materials, policy, timeline, type Exhibit, type TimelineNode } from "./data";
import { chapters, type Chapter } from "./chapters";
import { lithiumResearch, sodiumResearch } from "./lithium-sodium";
import { vanadiumResearch, ironChromiumResearch, zincBromineResearch, organicResearch } from "./flow";

import { pumpedHydroResearch, adiabaticCaesResearch, conventionalCaesResearch, liquidAirResearch, flywheelResearch, gravityResearch } from "./mechanical";

import { sensibleResearch, latentResearch, thermochemicalResearch } from "./thermal";

export type ChronicleResearch = { name: string; timeline: readonly TimelineNode[]; materials: readonly Exhibit[]; companies: readonly Exhibit[]; chapters: readonly Chapter[]; policy: Exhibit; market: Exhibit; historySubject: string; note: string; papers?: Exhibit; storage?: Exhibit; showMarketChart?: boolean };
export const solidResearch: ChronicleResearch = { name: "固态电池", timeline, materials, companies, chapters, policy, market, historySubject: "company:toyota", note: "15个研究节点与2026产业政策进展" };
export const researchRoutes: Record<string, ChronicleResearch> = { "固态电池": solidResearch, "锂离子": lithiumResearch, "钠离子": sodiumResearch, "全钒液流": vanadiumResearch, "铁铬液流": ironChromiumResearch, "锌溴液流": zincBromineResearch, "有机液流": organicResearch, "抽水蓄能": pumpedHydroResearch, "绝热压缩空气": adiabaticCaesResearch, "常规压缩空气": conventionalCaesResearch, "液态空气": liquidAirResearch, "飞轮": flywheelResearch, "重力储能": gravityResearch, "显热储能": sensibleResearch, "潜热储能": latentResearch, "热化学储能": thermochemicalResearch, "高压气态储氢": gasHydrogenResearch, "液氢储能": liquidHydrogenResearch, "固态储氢": solidHydrogenResearch, "化学载体储氢": carrierHydrogenResearch, "超级电容": supercapacitorResearch, "超导磁储能": smesResearch, "铅酸": leadAcidResearch, "锌基电池": zincResearch, "金属空气": metalAirResearch };
