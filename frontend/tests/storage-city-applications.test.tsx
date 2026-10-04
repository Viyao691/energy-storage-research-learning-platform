// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import StorageCityApplications from "../components/research/StorageCityApplications";

afterEach(cleanup);

describe("storage city applications", () => {
  it("shows eight linked scenarios and updates the explanation on selection", () => {
    render(createElement(StorageCityApplications));
    expect(screen.getAllByRole("button", { name: /^选择场景：/ })).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "选择场景：火力发电站" }));
    expect(screen.getByRole("heading", { name: "火力发电站" })).toBeTruthy();
    expect(screen.getByText("火储联合跟踪 AGC，以储能补足机组响应速度。")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "场景 8：抽水蓄能电站" }));
    expect(screen.getByRole("heading", { name: "抽水蓄能电站" })).toBeTruthy();
  });

  it("switches charge, discharge and emergency demonstration without a universal emergency flow", () => {
    render(createElement(StorageCityApplications));
    fireEvent.click(screen.getByRole("button", { name: "晚高峰放电" }));
    expect(screen.getByTestId("city-map").getAttribute("data-mode")).toBe("discharge");
    fireEvent.click(screen.getByRole("button", { name: "应急供电" }));
    expect(screen.getByTestId("city-map").getAttribute("data-mode")).toBe("emergency");
    expect(screen.getByText(/当前场景不展示应急供电/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "选择场景：医院与数据中心" }));
    expect(screen.getByText(/UPS 电池先承接过渡/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "日间充电" }));
    expect(screen.getByTestId("city-map").getAttribute("data-mode")).toBe("charge");
  });

  it("pauses animation and expands the selected scenario principles", () => {
    render(createElement(StorageCityApplications));
    fireEvent.click(screen.getByRole("button", { name: "暂停动效" }));
    expect(screen.getByTestId("city-map").getAttribute("data-paused")).toBe("true");
    expect(screen.getByTestId("scene-diagram").getAttribute("data-paused")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "继续动效" }));
    expect(screen.getByTestId("city-map").getAttribute("data-paused")).toBe("false");
    expect(screen.getByTestId("scene-diagram").getAttribute("data-paused")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "选择场景：居民社区" }));
    fireEvent.click(screen.getByText("展开应用原理"));
    expect(screen.getByText(/配置双向变流器/)).toBeTruthy();
    fireEvent.click(screen.getByText("适用条件与技术"));
    expect(screen.getByText(/孤岛保护/)).toBeTruthy();
  });

  it("connects all eight sites through the grid with visible animated network paths", () => {
    render(createElement(StorageCityApplications));
    const map = screen.getByTestId("city-map");
    const links = Array.from(map.querySelectorAll<SVGPathElement>("[data-network-link]"));
    expect(links).toHaveLength(7);
    expect(links.every(link => [link.dataset.from, link.dataset.to].includes("grid"))).toBe(true);
    expect(new Set(links.flatMap(link => [link.dataset.from, link.dataset.to]))).toEqual(new Set(["renewable", "grid", "industrial", "community", "charging", "hospital", "thermal", "hydro"]));
    expect(map.querySelectorAll("[data-network-pulse]")).toHaveLength(7);
  });

  it("illustrates source, storage and load with mode-specific moving arrows", () => {
    render(createElement(StorageCityApplications));
    fireEvent.click(screen.getByRole("button", { name: "选择场景：抽水蓄能电站" }));
    const diagram = screen.getByTestId("scene-diagram");
    expect(diagram.getAttribute("data-mode")).toBe("charge");
    expect(screen.getByText("下水库抽水")).toBeTruthy();
    expect(screen.getByText("上水库蓄能")).toBeTruthy();
    expect(diagram.querySelectorAll("[data-moving-arrow]")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "晚高峰放电" }));
    expect(diagram.getAttribute("data-mode")).toBe("discharge");
    expect(screen.getByText("上水库放水")).toBeTruthy();
    expect(screen.getByText("水轮机发电")).toBeTruthy();
    expect(diagram.querySelectorAll("[data-moving-arrow]")).toHaveLength(2);
  });

  it("keeps emergency animation local to configured backup sites", () => {
    render(createElement(StorageCityApplications));
    fireEvent.click(screen.getByRole("button", { name: "应急供电" }));
    expect(screen.getByTestId("city-map").querySelectorAll("[data-network-pulse]")).toHaveLength(0);
    expect(screen.getByTestId("scene-diagram").querySelectorAll("[data-moving-arrow]")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "选择场景：医院与数据中心" }));
    expect(screen.getByTestId("scene-diagram").querySelectorAll("[data-moving-arrow]")).toHaveLength(1);
    expect(screen.getByTestId("city-map").querySelectorAll("[data-local-backup]")).toHaveLength(1);
  });

  it("gives critical-load backup and industrial peak shaving distinct illustrated explanations", () => {
    render(createElement(StorageCityApplications));
    fireEvent.click(screen.getByRole("button", { name: "选择场景：医院与数据中心" }));
    fireEvent.click(screen.getByText("展开应用原理"));
    expect(screen.getByRole("img", { name: /UPS 电池承接/ })).toBeTruthy();
    expect(screen.getByText("UPS 立即承接")).toBeTruthy();
    expect(screen.getByText(/普通 BESS 不应默认等于无缝 UPS/)).toBeTruthy();
    fireEvent.click(screen.getByText("适用条件与技术"));
    expect(screen.getByText("维护演练")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "选择场景：工商业园区" }));
    fireEvent.click(screen.getByText("展开应用原理"));
    expect(screen.getByRole("img", { name: /园区储能削减用电尖峰/ })).toBeTruthy();
    expect(screen.getByText("削减尖峰")).toBeTruthy();
    expect(screen.queryByText("UPS 立即承接")).toBeNull();
  });
});
