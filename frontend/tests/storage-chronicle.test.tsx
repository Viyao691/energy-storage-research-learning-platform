// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Nav } from "../components/Nav";
import { ChronicleExhibition } from "../components/chronicle/ChronicleExhibition";
import { assetIdFor, getAsset } from "../lib/chronicle/assets";

vi.mock("next/navigation", () => ({ usePathname: () => "/research/chronicle" }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => React.createElement("a", props, children) }));
beforeEach(() => { localStorage.clear(); document.documentElement.dataset.theme = "light"; });
afterEach(cleanup);
function openChronicle() { return render(React.createElement(ChronicleExhibition)); }

describe("储能编年史", () => {
  it("科研导航提供独立入口及当前页状态", () => {
    render(React.createElement(Nav));
    expect(screen.getByText("科研")).toBeTruthy();
    const link = screen.getByRole("link", { name: "储能编年史" });
    expect(link.getAttribute("href")).toBe("/research/chronicle");
    expect(link.getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "论文" }));
    expect(screen.getByRole("link", { name: "论文库" }).getAttribute("href")).toBe("/library");
  });
  it("年份切换保留2024试验条件及2025制造和运行区别", async () => {
    await openChronicle();
    expect(screen.getByText("6000次")).toBeTruthy();
    expect(screen.getByText(/至约80%容量 · 55°C \/ 25MPa/)).toBeTruthy();
    expect(screen.getByText(/5C充电 \/ 5C放电/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^2011，/ }));
    expect(screen.getByText("12mS/cm")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^2025，/ }));
    expect(screen.getByText("无运行外压")).toBeTruthy();
    expect(screen.getByText("600MPa")).toBeTruthy();
    expect(screen.getByText("制造冷压，非运行压力")).toBeTruthy();
    expect(screen.getByText("183次")).toBeTruthy();
  });
  it("单章阅读切换和返回保留年份及全部资料入口", async () => {
    await openChronicle();
    fireEvent.click(screen.getByRole("button", { name: /^2025，/ }));
    fireEvent.click(screen.getByRole("button", { name: /进入详解/ }));
    expect(screen.getByText(/1000次54.9%/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "论文" }));
    expect(screen.getByRole("heading", { name: "把“高性能”拆成可以核对的证据" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "同叫固态，材料问题并不相同" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /返回现场/ }));
    expect(screen.getByRole("button", { name: "论文" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /进入详解/ })).toBe(document.activeElement);
    fireEvent.click(screen.getByRole("button", { name: "历史" }));
    expect(screen.getByRole("button", { name: /^2025，/ }).getAttribute("aria-pressed")).toBe("true");
  });
  it("铅酸已研究路线使用独立年份与证据", async () => {
    await openChronicle();
    fireEvent.change(screen.getByRole("combobox", { name: "路线" }), { target: { value: "铅酸" } });
    expect(screen.getByRole("navigation", { name: "历史年份" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^1859，/ })).toBeTruthy();
    expect(screen.queryByText("6000次")).toBeNull();
    expect(screen.getByRole("button", { name: "进入详解" })).toBeTruthy();
  });
  it("沿用工作区主题，不额外提供主题按钮或改写存储", async () => {
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("energy-copilot-theme", "dark");
    await openChronicle();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.queryByRole("button", { name: "浅色" })).toBeNull();
    expect(screen.queryByRole("button", { name: "深色" })).toBeNull();
    expect(localStorage.getItem("energy-copilot-theme")).toBe("dark");
  });
  it("材料和产业逐项展示，市场口径为全部技术", async () => {
    await openChronicle();
    fireEvent.click(screen.getByRole("button", { name: "材料" }));
    const material = screen.getByRole("combobox", { name: "材料路线" });
    expect(within(material).getAllByRole("option")).toHaveLength(5);
    fireEvent.change(material, { target: { value: "halide" } });
    expect(screen.getByText("1.49×10⁻³S/cm")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "企业" }));
    expect(within(screen.getByRole("combobox", { name: "企业" })).getAllByRole("option")).toHaveLength(11);
    fireEvent.click(screen.getByRole("button", { name: "政策市场" }));
    expect(screen.getByText("中国新型储能（全部技术）")).toBeTruthy();
    expect(screen.getByText(/这里统计中国全部新型储能/)).toBeTruthy();
    expect(screen.queryByText(/固态储能装机136/)).toBeNull();
  });
  it("历史只用固态原型，企业缺图不借用电站或另一企业图片", async () => {
    await openChronicle();
    const prototype = screen.getByRole("img");
    expect(prototype.getAttribute("src")).toBe("/chronicle/toyota-solid-state-battery.jpg");
    fireEvent.click(screen.getByRole("button", { name: "企业" }));
    expect(screen.queryByRole("img")?.getAttribute("src") ?? "").not.toMatch(/toyota|blythe|reid-gardner|wellesley/);
    fireEvent.change(screen.getByRole("combobox", { name: "企业" }), { target: { value: "bmw" } });
    expect(screen.getByRole("img").getAttribute("src")).toBe("/chronicle/bmw-i7-solid-power.jpg");
  });
  it("锂钠分别拥有真实年份、材料、企业和独立研究正文", async () => {
    await openChronicle();
    fireEvent.change(screen.getByRole("combobox", { name: "路线" }), { target: { value: "锂离子" } });
    expect(screen.queryByRole("button", { name: /^1973，/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^1991，/ }));
    expect(screen.getByRole("heading", { name: "Sony 商业化" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "材料" }));
    expect(within(screen.getByRole("combobox", { name: "材料路线" })).getAllByRole("option")).toHaveLength(3);
    expect(screen.queryByText("6000次")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "企业" }));
    expect(within(screen.getByRole("combobox", { name: "企业" })).getAllByRole("option")).toHaveLength(4);
    fireEvent.change(screen.getByRole("combobox", { name: "路线" }), { target: { value: "钠离子" } });
    fireEvent.click(screen.getByRole("button", { name: "历史" }));
    expect(screen.queryByRole("button", { name: /^1991，/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^2024，/ }));
    expect(screen.getByText("50MW / 100MWh")).toBeTruthy();
    expect(screen.getByText("100MW / 200MWh")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /进入详解/ }));
    fireEvent.click(screen.getByRole("button", { name: "材料" }));
    expect(screen.getByRole("heading", { name: "层状、开放框架与硬碳分别验证" })).toBeTruthy();
    expect(screen.getByText(/190mAh\/g可逆容量/)).toBeTruthy();
    expect(screen.queryByText(/LiCoO₂提高正极/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /返回现场/ }));
    fireEvent.click(screen.getByRole("button", { name: "历史" }));
    expect(screen.getByRole("button", { name: /^2024，/ }).getAttribute("aria-pressed")).toBe("true");
  });
  it("各材料遵循真实或AI图的kind/context，政策读取对应官方截图", async () => {
    await openChronicle();
    fireEvent.click(screen.getByRole("button", { name: "材料" }));
    for (const id of ["sulfide", "oxide", "halide", "polymer", "composite"]) {
      fireEvent.change(screen.getByRole("combobox", { name: "材料路线" }), { target: { value: id } });
      const asset = getAsset(assetIdFor(`material:${id}`));
      expect(["real-photo", "ai-illustration"]).toContain(asset?.kind);
      expect(screen.getByRole("img").getAttribute("src")).toBe(asset?.src);
      expect(screen.getByRole("img").getAttribute("data-kind")).toBe(asset?.kind);
      if (asset?.kind === "ai-illustration") expect(screen.getAllByText("示意图")).toHaveLength(1);
      if (asset?.context && asset.kind !== "ai-illustration") expect(screen.getByText(asset.context)).toBeTruthy();
    }
    fireEvent.click(screen.getByRole("button", { name: "企业" }));
    fireEvent.click(screen.getByRole("button", { name: "政策市场" }));
    const documentAsset = getAsset(assetIdFor("scene:solid-policy", "document"));
    expect(documentAsset?.kind).toBe("document");
    expect(screen.getByRole("region", { name: "技术展厅" }).querySelector("img")?.getAttribute("src")).toBe(documentAsset?.src);
    if (documentAsset?.context) expect(screen.getByText(documentAsset.context)).toBeTruthy();
    for (const [route, prefix, ids] of [["锂离子", "lithium", ["layered", "lfp", "graphite"]], ["钠离子", "sodium", ["layered", "prussian", "hard-carbon"]]] as const) {
      fireEvent.change(screen.getByRole("combobox", { name: "路线" }), { target: { value: route } });
      const policyAsset = getAsset(assetIdFor(`scene:${prefix}-policy`, "document"));
      expect(screen.getByRole("region", { name: "技术展厅" }).querySelector("img")?.getAttribute("src")).toBe(policyAsset?.src);
      fireEvent.click(screen.getByRole("button", { name: "材料" }));
      for (const suffix of ids) {
        fireEvent.change(screen.getByRole("combobox", { name: "材料路线" }), { target: { value: `${prefix}-${suffix}` } });
        const materialAsset = getAsset(assetIdFor(`material:${prefix}-${suffix}`));
        expect(materialAsset?.kind).toBe(suffix === "lfp" ? "real-photo" : "ai-illustration");
        expect(screen.getByRole("img").getAttribute("src")).toBe(materialAsset?.src);
      }
      fireEvent.click(screen.getByRole("button", { name: "政策市场" }));
    }
  });
});
