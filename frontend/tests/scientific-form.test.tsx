// @vitest-environment jsdom
import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { ScientificPanel } from "../components/papers/ScientificPanel";
import type { ScientificDataset } from "../lib/api";
import { SCIENTIFIC_FORMS, validateScientificForm } from "../components/papers/scientificForm";

vi.mock("../components/react-bits/GlideSelect", () => ({ default: (props: { id: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) => <select id={props.id} value={props.value} onChange={event => props.onChange(event.target.value)}>{props.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> }));
vi.mock("../components/MarkdownContent", () => ({ MarkdownContent: () => null }));
const recipes = [
  { key: "electrochem.cycle_retention", description: "循环容量保持率" },
  { key: "electrochem.gcd", description: "GCD平台与容量" },
  { key: "electrochem.rate_recovery", description: "倍率恢复" },
].map(recipe => ({ ...recipe, domain: "electrochemistry", required_inputs: [], algorithm_version: "1.0.0" }));
const create = vi.fn();
const save = vi.fn();
const run = vi.fn();
function Workbench({ initialRecipe = recipes[0].key }: { initialRecipe?: string }) {
  const [data, setData] = useState("{}");
  const [units, setUnits] = useState("{}");
  const [parameters, setParameters] = useState("{}");
  const [recipe, setRecipe] = useState(initialRecipe);
  const [dataset, setDataset] = useState<number | null>(null);
  const [datasets, setDatasets] = useState<ScientificDataset[]>([]);
  function persist(confirm = false) {
    const savedParameters = { ...JSON.parse(parameters), recipe_key: recipe };
    setParameters(JSON.stringify(savedParameters));
    setDatasets([{ id: 7, data: JSON.parse(data), units: JSON.parse(units), parameters: savedParameters, confirmation_status: confirm ? "confirmed" : "pending" } as ScientificDataset]);
    setDataset(7);
  }
  return <><ScientificPanel id="1" selectedVisual={undefined} scientificDatasets={datasets} scientificRecipes={recipes} selectedDatasetId={dataset} setSelectedDatasetId={setDataset} scientificData={data} setScientificData={setData} scientificUnits={units} setScientificUnits={setUnits} scientificParameters={parameters} setScientificParameters={setParameters} scientificRecipe={recipe} setScientificRecipe={setRecipe} scientificResult={null} scientificBusy={false} createScientificDraft={() => { create(); persist(); }} saveScientificDataset={confirm => { save(confirm); persist(confirm); }} runScientificRecipe={run} /><output data-testid="data">{data}</output><output data-testid="parameters">{parameters}</output></>;
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("scientific form workflow", () => {
  it("rejects empty cells and units before saving, without turning blanks into zero", () => {
    render(<Workbench />);
    fireEvent.click(screen.getByRole("button", { name: "建立数据草稿" }));
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("容量");
    fireEvent.change(screen.getByLabelText("第1行 容量"), { target: { value: "150" } });
    fireEvent.change(screen.getByLabelText("第2行 容量"), { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: "建立数据草稿" }));
    expect(create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("容量单位"), { target: { value: "mAh/g" } });
    fireEvent.click(screen.getByRole("button", { name: "建立数据草稿" }));
    expect(create).toHaveBeenCalledOnce();
    expect(JSON.parse(screen.getByTestId("data").textContent!)).toEqual({ capacity: [150, 120] });
  });
  it("shows GCD source units and necessary parameters while retaining the previous algorithm draft", () => {
    render(<Workbench />);
    fireEvent.change(screen.getByLabelText("第1行 容量"), { target: { value: "180" } });
    fireEvent.change(screen.getByLabelText("计算方法"), { target: { value: "electrochem.gcd" } });
    expect(screen.getByLabelText("电流（A）")).toBeTruthy();
    expect(screen.getByLabelText("活性物质量（g）")).toBeTruthy();
    expect(screen.getByLabelText("第1行 时间")).toBeTruthy();
    expect(screen.getByText(/不会自动从图片提取/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("计算方法"), { target: { value: "electrochem.cycle_retention" } });
    expect((screen.getByLabelText("第1行 容量") as HTMLInputElement).value).toBe("180");
  });
  it("translates human row numbers to backend indexes and rejects a missing parameter", () => {
    render(<Workbench initialRecipe="electrochem.rate_recovery" />);
    fireEvent.change(screen.getByLabelText("第1行 容量"), { target: { value: "150" } });
    fireEvent.change(screen.getByLabelText("第2行 容量"), { target: { value: "140" } });
    fireEvent.change(screen.getByLabelText("容量单位"), { target: { value: "mAh/g" } });
    fireEvent.change(screen.getByLabelText("基准数据行（从1开始）"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "建立数据草稿" }));
    expect(create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("恢复数据行（从1开始）"), { target: { value: "2" } });
    expect(JSON.parse(screen.getByTestId("parameters").textContent!)).toMatchObject({ baseline_index: 0, recovery_index: 1 });
    fireEvent.click(screen.getByRole("button", { name: "建立数据草稿" }));
    expect(create).toHaveBeenCalledOnce();
  });
  it("requires explicit confirmation and disables calculation after editing saved data", () => {
    render(<Workbench />);
    fireEvent.change(screen.getByLabelText("第1行 容量"), { target: { value: "150" } });
    fireEvent.change(screen.getByLabelText("第2行 容量"), { target: { value: "120" } });
    fireEvent.change(screen.getByLabelText("容量单位"), { target: { value: "mAh/g" } });
    fireEvent.click(screen.getByRole("button", { name: "建立数据草稿" }));
    expect((screen.getByRole("button", { name: "运行固定算法" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "人工确认数据" }));
    expect(save).not.toHaveBeenCalled();
    for (const checkbox of screen.getAllByRole("checkbox")) fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "人工确认数据" }));
    expect(save).toHaveBeenCalledWith(true);
    expect((screen.getByRole("button", { name: "运行固定算法" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "运行固定算法" }));
    expect(run).toHaveBeenCalledOnce();
    fireEvent.change(screen.getByLabelText("第2行 容量"), { target: { value: "110" } });
    expect((screen.getByRole("button", { name: "运行固定算法" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getAllByRole("checkbox").every(checkbox => !(checkbox as HTMLInputElement).checked)).toBe(true);
  });
  it("lets users type a small decimal current and a negative potential normally", async () => {
    render(<Workbench initialRecipe="electrochem.gcd" />);
    await userEvent.type(screen.getByLabelText("电流（A）"), "0.001");
    await userEvent.type(screen.getByLabelText("第1行 电压"), "-0.05");
    expect((screen.getByLabelText("电流（A）") as HTMLInputElement).value).toBe("0.001");
    expect((screen.getByLabelText("第1行 电压") as HTMLInputElement).value).toBe("-0.05");
  });
  it("offers XRD peak widths only when Scherrer calculation is selected", () => {
    render(<Workbench initialRecipe="materials.xrd_bragg" />);
    expect(screen.queryByLabelText("第1行 峰宽 FWHM")).toBeNull();
    expect(screen.queryByLabelText("仪器展宽（°）")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: /同时计算Scherrer尺寸/ }));
    expect(screen.getByLabelText("第1行 峰宽 FWHM")).toBeTruthy();
    expect(screen.getByLabelText("仪器展宽（°）")).toBeTruthy();
  });
  it("writes constrained peak ranges as paired numeric limits without JSON input", () => {
    render(<Workbench initialRecipe="materials.xps_constrained" />);
    fireEvent.change(screen.getByLabelText("第1组 区间下限"), { target: { value: "530" } });
    fireEvent.change(screen.getByLabelText("第1组 区间上限"), { target: { value: "535" } });
    expect(JSON.parse(screen.getByTestId("parameters").textContent!)).toMatchObject({ peak_ranges: [[530, 535]] });
  });
  it("adds a named numeric column and allows groups with unequal sample counts", () => {
    const view = render(<Workbench initialRecipe="generic.table_statistics" />);
    fireEvent.change(screen.getByLabelText("新数值列名"), { target: { value: "比容量" } });
    fireEvent.click(screen.getByRole("button", { name: "添加数值列" }));
    expect(screen.getByLabelText("第1行 比容量")).toBeTruthy();
    expect(screen.queryByLabelText("第1行 数值")).toBeNull();
    view.unmount();
    render(<Workbench initialRecipe="generic.group_compare" />);
    fireEvent.change(screen.getByLabelText("第1行 组1"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("第1行 组2"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "添加数据行" }));
    fireEvent.change(screen.getByLabelText("第2行 组2"), { target: { value: "30" } });
    expect(JSON.parse(screen.getByTestId("data").textContent!)).toEqual({ groups: { 组1: [10], 组2: [20, 30] } });
  });
});

describe("fixed algorithm input contracts", () => {
  const samples: [string, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>][] = [
    ["electrochem.cycle_retention", { capacity: [150, 120] }, { capacity: "mAh/g" }, {}],
    ["electrochem.coulombic_efficiency", { charge_capacity: [150], discharge_capacity: [145] }, { charge_capacity: "mAh/g", discharge_capacity: "mAh/g" }, {}],
    ["electrochem.rate_recovery", { capacity: [150, 120] }, { capacity: "mAh/g" }, { baseline_index: 0, recovery_index: 1 }],
    ["electrochem.gcd", { time: [0, 30], voltage: [3, 2] }, { time: "s", voltage: "V" }, { current_a: "0.001", active_mass_g: "0.002" }],
    ["electrochem.cv", { potential: [0, 1, 2], current: [1, 3, 1] }, { potential: "V", current: "A" }, { scan_rates: [0.1, 0.2], peak_currents: [1, 2] }],
    ["electrochem.gitt", { delta_es: [0.01], delta_et: [-0.05], tau_s: [600] }, { delta_es: "V", delta_et: "V", tau_s: "s" }, { diffusion_length_cm: 0.001 }],
    ["electrochem.eis", { z_real_ohm: [1, 2, 3], z_imag_ohm: [-1, -2, -1] }, { z_real_ohm: "Ω", z_imag_ohm: "Ω" }, { equivalent_circuit: "R0-p(R1,C1)" }],
    ["materials.xrd_bragg", { two_theta_deg: [30], fwhm_deg: [0.2] }, { two_theta_deg: "°", fwhm_deg: "°" }, { wavelength_nm: 0.15406, instrument_broadening_deg: 0.05 }],
    ["materials.xps_constrained", { x: [530, 531], y: [10, 20] }, { x: "eV", y: "a.u." }, { peak_ranges: [[530, 532]] }],
    ["materials.raman_ftir", { x: [1300, 1350], y: [10, 20] }, { x: "cm⁻¹", y: "a.u." }, { peak_ranges: [[1300, 1400]] }],
    ["materials.microscopy_size", { diameter_px: [10, 20] }, { diameter_px: "px" }, { scale_nm_per_px: 2.5 }],
    ["generic.table_statistics", { 容量: [10, 20] }, { 容量: "mAh/g" }, {}],
    ["generic.group_compare", { groups: { A: [1], B: [2, 3] } }, { A: "1", B: "1" }, {}],
    ["generic.curve_digitize", { x: [1, 2], y: [150, 120] }, { x: "1", y: "mAh/g" }, { calibration_residual: 0.005 }],
    ["generic.unit_check", { 温度: [20, 30] }, { 温度: "°C" }, {}],
  ];
  it.each(samples)("accepts the actual backend inputs for %s", (recipe, data, units, parameters) => {
    const form = SCIENTIFIC_FORMS[recipe];
    const values = recipe === "generic.group_compare" ? data.groups as Record<string, unknown> : data;
    const columns = form.columns.length ? form.columns : Object.keys(values).map(key => ({ key, label: key }));
    expect(validateScientificForm(recipe, data, units, parameters, columns)).toBeNull();
  });
  it("rejects incompatible units, incomplete CV pairs and unconfirmed EIS circuits", () => {
    expect(validateScientificForm("electrochem.gcd", { time: [0, 10], voltage: [3, 2] }, { time: "ms", voltage: "V" }, { current_a: 1, active_mass_g: 1 }, SCIENTIFIC_FORMS["electrochem.gcd"].columns)).toContain("s");
    expect(validateScientificForm("electrochem.cv", { potential: [0, 1, 2], current: [1, 2, 1] }, { potential: "V", current: "A" }, { scan_rates: [0.1, ""], peak_currents: [1, 2] }, SCIENTIFIC_FORMS["electrochem.cv"].columns)).toContain("多扫速率");
    expect(validateScientificForm("electrochem.eis", { z_real_ohm: [1, 2, 3], z_imag_ohm: [1, 2, 1] }, { z_real_ohm: "Ω", z_imag_ohm: "Ω" }, {}, SCIENTIFIC_FORMS["electrochem.eis"].columns)).toContain("等效电路");
  });
});
