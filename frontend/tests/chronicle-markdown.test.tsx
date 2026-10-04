// @vitest-environment jsdom
import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ChronicleReading } from "../components/chronicle/ChronicleReading";
import { solidResearch } from "../lib/chronicle/researchRoutes";
import type { ChapterId } from "../lib/chronicle/chapters";
afterEach(cleanup);
function expandedDetail(chapterId: ChapterId) {
 render(<ChronicleReading research={solidResearch} chapterId={chapterId} node={solidResearch.timeline[0]} onBack={()=>{}}/>);
 const summary=screen.getByText(solidResearch.chapters.find(c=>c.id===chapterId)!.detailLabel);
 fireEvent.click(summary);
 return summary.closest("details")!;
}
it("storage detail renders six bold labels and dollar units as ordinary text",()=>{
 const detail=expandedDetail("storage");
 const labels=["明确任务","统一系统边界","记录完整寿命","按实际交付比较经济性","验证量产一致性","先补运行数据"];
 expect.soft([...detail.querySelectorAll("strong")].map(el=>el.textContent)).toEqual(expect.arrayContaining(labels));
 expect.soft(detail.textContent).not.toContain("**");
 expect.soft(detail.textContent).toContain("美元/kWh投资成本与美元/kW功率成本");
 expect.soft(detail.querySelector(".katex")).toBeNull();
});
it("papers detail renders six bold reading labels without literal asterisks",()=>{
 const detail=expandedDetail("papers");
 const labels=["单位与分母","载量与厚度","锂库存","压力边界","电池结构","可重复制造"];
 expect.soft([...detail.querySelectorAll("strong")].map(el=>el.textContent)).toEqual(expect.arrayContaining(labels));
 expect.soft(detail.textContent).not.toContain("**");
});
