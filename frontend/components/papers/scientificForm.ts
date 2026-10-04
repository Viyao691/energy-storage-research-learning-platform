export type ScientificColumn = { key: string; label: string; unit?: string; example?: string; optional?: boolean };
export type ScientificParameter = { key: string; label: string; example?: string; optional?: boolean; row?: boolean };
type ScientificForm = { title: string; purpose: string; columns: ScientificColumn[]; parameters?: ScientificParameter[]; minRows?: number };
const capacity: ScientificColumn = { key: "capacity", label: "容量", example: "150" };
const spectrum: ScientificColumn[] = [{ key: "x", label: "横轴位置", example: "532" }, { key: "y", label: "信号强度", example: "1200" }];

export const SCIENTIFIC_FORMS: Record<string, ScientificForm> = {
  "electrochem.cycle_retention": { title: "循环容量保持率", purpose: "按循环顺序填写容量，计算最后一行 ÷ 第一行 × 100%。容量须采用同一单位。", columns: [capacity], minRows: 2 },
  "electrochem.coulombic_efficiency": { title: "库仑效率", purpose: "每行对应同一次循环，计算放电容量 ÷ 充电容量 × 100%，并报告均值。两列须采用同一单位。", columns: [{ key: "charge_capacity", label: "充电容量", example: "150" }, { key: "discharge_capacity", label: "放电容量", example: "145" }] },
  "electrochem.rate_recovery": { title: "倍率恢复", purpose: "按倍率测试顺序填写容量，指定基准与恢复数据行，计算恢复容量 ÷ 基准容量 × 100%。", columns: [capacity], minRows: 2, parameters: [{ key: "baseline_index", label: "基准数据行（从1开始）", row: true, example: "1" }, { key: "recovery_index", label: "恢复数据行（从1开始）", row: true, example: "6" }] },
  "electrochem.gcd": { title: "GCD容量与电压中位数", purpose: "填写单次完整放电段的时间/电压序列、电流和活性物质量。由时间跨度计算比容量（mAh/g），电压中位数作为平台参考；请先换算成下列单位。", columns: [{ key: "time", label: "时间", unit: "s", example: "0" }, { key: "voltage", label: "电压", unit: "V", example: "3.2" }], minRows: 2, parameters: [{ key: "current_a", label: "电流（A）", example: "0.001" }, { key: "active_mass_g", label: "活性物质量（g）", example: "0.002" }] },
  "electrochem.cv": { title: "CV峰位与多扫速率斜率", purpose: "按采样顺序填写电位/电流，查找局部氧化与还原峰。可另填至少两组正扫描速率与非零峰电流，计算 log(i)–log(v) 斜率。", columns: [{ key: "potential", label: "电位", unit: "V", example: "0.2" }, { key: "current", label: "电流", example: "0.001" }], minRows: 3 },
  "electrochem.gitt": { title: "GITT扩散系数", purpose: "每行填一个脉冲的稳态电位差 ΔEs、瞬态电位差 ΔEt 与脉冲时间。结合论文方法中的扩散长度，按固定公式估算扩散系数（cm²/s）。", columns: [{ key: "delta_es", label: "稳态电位差 ΔEs", unit: "V", example: "0.01" }, { key: "delta_et", label: "瞬态电位差 ΔEt", unit: "V", example: "0.05" }, { key: "tau_s", label: "脉冲时间", unit: "s", example: "600" }], parameters: [{ key: "diffusion_length_cm", label: "扩散长度（cm）", example: "0.001" }] },
  "electrochem.eis": { title: "EIS电阻初值估计", purpose: "填写阻抗实部与虚部，并人工选择等效电路。当前仅以实部最小值估计 R0、跨度估计 Rct，不进行正式电路拟合。虚部填写原始带符号值。", columns: [{ key: "z_real_ohm", label: "阻抗实部 Z′", unit: "Ω", example: "5" }, { key: "z_imag_ohm", label: "阻抗虚部 Z″", unit: "Ω", example: "-2" }], minRows: 3 },
  "materials.xrd_bragg": { title: "XRD晶面间距与Scherrer尺寸", purpose: "每行填写一个衍射峰的 2θ，结合 X 射线波长计算晶面间距。可选填峰宽 FWHM、仪器展宽与形状因子 K，计算 Scherrer 尺寸；不自动识别物相。", columns: [{ key: "two_theta_deg", label: "衍射角 2θ", unit: "°", example: "30" }, { key: "fwhm_deg", label: "峰宽 FWHM", unit: "°", example: "0.2", optional: true }], parameters: [{ key: "wavelength_nm", label: "X射线波长（nm）", example: "0.15406" }, { key: "instrument_broadening_deg", label: "仪器展宽（°）", example: "0.05", optional: true }, { key: "scherrer_k", label: "形状因子 K（留空使用0.9）", example: "0.9", optional: true }] },
  "materials.xps_constrained": { title: "XPS约束区间峰位", purpose: "填写结合能/信号强度和人工划定的峰位区间。报告每个区间内强度最高的数据点，不执行分峰拟合或价态判定。", columns: [{ ...spectrum[0], label: "结合能", unit: "eV" }, spectrum[1]] },
  "materials.raman_ftir": { title: "Raman/FTIR约束区间峰位", purpose: "填写谱线横轴/信号强度及峰位区间。报告各区间内强度最高的点，不自动进行基线校正或强度比定量；区间单位与横轴一致。", columns: spectrum },
  "materials.microscopy_size": { title: "显微粒径统计", purpose: "从显微图片手工测量每个颗粒直径（像素），用原图比例尺换算 nm/px，计算直径与均值。不自动分割颗粒。", columns: [{ key: "diameter_px", label: "颗粒直径", unit: "px", example: "20" }], parameters: [{ key: "scale_nm_per_px", label: "比例尺（nm/px）", example: "2.5" }] },
  "generic.table_statistics": { title: "数值表格统计", purpose: "每列填写一种测量值，可按名称添加数值列。计算数量、均值、样本标准差，并按四分位距提示异常值。", columns: [] },
  "generic.group_compare": { title: "组均值比较", purpose: "每列代表一个实验组，各组可有不同数量的数值。报告组均值与最大均值差；差异不代表因果关系。", columns: [] },
  "generic.curve_digitize": { title: "已有曲线点校验", purpose: "填写已手工数字化的 x/y 坐标及轴校准残差（无量纲，0.01表示1%）。此方法仅校验并返回已有点，不从图中自动生成坐标。", columns: [{ key: "x", label: "横轴坐标", example: "1" }, { key: "y", label: "纵轴坐标", example: "150" }], parameters: [{ key: "calibration_residual", label: "轴校准残差（须≤0.01）", example: "0.005" }] },
  "generic.unit_check": { title: "数据列单位完整性检查", purpose: "检查每个数值列是否填写单位。不进行量纲分析或单位换算。无量纲数据请填写“1”。", columns: [] },
};

export function readScientificObject(value: string): Record<string, unknown> {
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; }
}
export function numericCell(value: string): number | string {
  // Keep decimal and exponent drafts intact while the user types (e.g. 0.00 or 1e-).
  return value.trim() !== "" && !/[.eE]/.test(value) && value !== "-0" && Number.isFinite(Number(value)) ? Number(value) : value;
}
export function validateScientificForm(recipe: string, data: Record<string, unknown>, units: Record<string, unknown>, parameters: Record<string, unknown>, columns: ScientificColumn[]): string | null {
  const form = SCIENTIFIC_FORMS[recipe];
  if (!form) return "请选择支持的计算方法。";
  const groups = recipe === "generic.group_compare";
  const values = groups ? (data.groups ?? {}) as Record<string, unknown> : data;
  let rowCount = 0;
  for (const column of columns) {
    const list = values[column.key];
    if (column.optional && !Array.isArray(list)) continue;
    if (!Array.isArray(list) || list.length < (form.minRows ?? 1)) return `${column.label}至少需要${form.minRows ?? 1}行数据。`;
    if (list.some(value => String(value).trim() === "" || !Number.isFinite(Number(value)))) return `${column.label}有空白或非数值，请填写完整。`;
    if (!groups && rowCount && list.length !== rowCount) return "各数据列的行数必须一致。";
    rowCount = list.length;
    if (!String(units[column.key] ?? "").trim()) return `请填写${column.label}单位，无量纲填写1。`;
    if (column.unit && units[column.key] !== column.unit) return `${column.label}须先换算为${column.unit}；系统不会自动换算。`;
  }
  if (groups && columns.length < 2) return "组间比较至少需要两个数值组。";
  for (const field of form.parameters ?? []) {
    const value = parameters[field.key];
    const required = !field.optional || (field.key === "instrument_broadening_deg" && Array.isArray(data.fwhm_deg));
    if (!required && (value === undefined || String(value).trim() === "")) continue;
    if (value === undefined || String(value).trim() === "" || !Number.isFinite(Number(value))) return `请填写${field.label}。`;
    if (field.row && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) >= rowCount)) return `${field.label}须在1至${rowCount}之间。`;
    if (["active_mass_g", "diffusion_length_cm", "wavelength_nm", "scherrer_k", "scale_nm_per_px"].includes(field.key) && Number(value) <= 0) return `${field.label}须大于0。`;
    if (field.key === "instrument_broadening_deg" && Number(value) < 0) return "仪器展宽不能为负数。";
  }
  if (recipe === "electrochem.cycle_retention" && Number((data.capacity as number[])[0]) === 0) return "初始容量不能为0。";
  if (recipe === "electrochem.coulombic_efficiency") {
    if ((data.charge_capacity as number[]).some(value => Number(value) === 0)) return "充电容量不能为0。";
    if (units.charge_capacity !== units.discharge_capacity) return "充电容量与放电容量须采用同一单位。";
  }
  if (recipe === "electrochem.rate_recovery" && Number((data.capacity as number[])[Number(parameters.baseline_index)]) === 0) return "基准容量不能为0。";
  if (recipe === "electrochem.gcd" && Number(parameters.current_a) === 0) return "电流不能为0。";
  if (recipe === "electrochem.gitt" && ((data.delta_et as number[]).some(value => Number(value) === 0) || (data.tau_s as number[]).some(value => value <= 0))) return "瞬态电位差不能为0，脉冲时间须大于0。";
  if (recipe === "electrochem.eis" && !["R0-p(R1,C1)", "R0-p(R1,CPE1)-W", "R0-p(R1,CPE1)-p(R2,CPE2)-W"].includes(String(parameters.equivalent_circuit))) return "请人工选择等效电路。";
  if (recipe === "materials.xrd_bragg") {
    if ((data.two_theta_deg as number[]).some(value => value <= 0 || value >= 180)) return "衍射角2θ须大于0且小于180°。";
    if (Array.isArray(data.fwhm_deg) && data.fwhm_deg.some(value => Number(value) <= Number(parameters.instrument_broadening_deg))) return "峰宽FWHM须大于仪器展宽。";
  }
  if (recipe === "materials.microscopy_size" && (data.diameter_px as number[]).some(value => value <= 0)) return "颗粒直径须大于0。";
  if (recipe === "generic.curve_digitize" && (Number(parameters.calibration_residual) < 0 || Number(parameters.calibration_residual) > 0.01)) return "轴校准残差须在0至0.01之间。";
  if (recipe === "materials.xps_constrained" || recipe === "materials.raman_ftir") {
    const ranges = parameters.peak_ranges;
    if (!Array.isArray(ranges) || !ranges.length) return "请填写至少一个人工确认的峰位区间。";
    for (const pair of ranges) {
      if (!Array.isArray(pair) || pair.length !== 2 || pair.some(value => String(value).trim() === "" || !Number.isFinite(Number(value))) || Number(pair[0]) > Number(pair[1])) return "峰位区间须填写数值下限和上限，且下限不大于上限。";
      if (!(data.x as number[]).some(value => value >= Number(pair[0]) && value <= Number(pair[1]))) return "峰位区间内没有谱线数据点。";
    }
  }
  if (recipe === "electrochem.cv" && (parameters.scan_rates !== undefined || parameters.peak_currents !== undefined)) {
    const rates = parameters.scan_rates, peaks = parameters.peak_currents;
    if (!Array.isArray(rates) || !Array.isArray(peaks) || rates.length !== peaks.length || rates.length < 2 || rates.some(value => String(value).trim() === "" || !Number.isFinite(Number(value)) || Number(value) <= 0) || peaks.some(value => String(value).trim() === "" || !Number.isFinite(Number(value)) || Number(value) === 0)) return "多扫速率至少需要两对正扫描速率与非零峰电流。";
  }
  return null;
}
