from __future__ import annotations

import math
import re
import statistics
from dataclasses import dataclass
from typing import Callable


class RecipeInputError(ValueError):
    pass


def _numbers(data: dict[str, object], key: str) -> list[float]:
    value = data.get(key)
    if not isinstance(value, list) or not value:
        raise RecipeInputError(f"缺少必需数据列：{key}")
    try:
        return [float(item) for item in value]
    except (TypeError, ValueError) as exc:
        raise RecipeInputError(f"数据列 {key} 必须全部为数值。") from exc


def _parameter(parameters: dict[str, object], key: str) -> float:
    try:
        return float(parameters[key])
    except (KeyError, TypeError, ValueError) as exc:
        raise RecipeInputError(f"缺少或未确认必要参数：{key}") from exc


@dataclass(frozen=True)
class ScientificRecipe:
    key: str
    domain: str
    version: str
    required_inputs: tuple[str, ...]
    description: str
    _runner: Callable[[dict[str, object], dict[str, object], dict[str, object]], dict[str, object]]

    def run(self, data: dict[str, object], units: dict[str, object], parameters: dict[str, object]) -> dict[str, object]:
        return self._runner(data, units, parameters)


def _retention(data, _units, _parameters):
    capacity = _numbers(data, "capacity")
    if capacity[0] == 0:
        raise RecipeInputError("初始容量不能为 0。")
    return {"retention_percent": capacity[-1] / capacity[0] * 100, "initial_capacity": capacity[0], "final_capacity": capacity[-1]}


def _efficiency(data, _units, _parameters):
    charge = _numbers(data, "charge_capacity")
    discharge = _numbers(data, "discharge_capacity")
    if len(charge) != len(discharge) or any(value == 0 for value in charge):
        raise RecipeInputError("充放电容量数量必须一致且充电容量不能为 0。")
    values = [out / incoming * 100 for incoming, out in zip(charge, discharge)]
    return {"efficiency_percent": values, "mean_efficiency_percent": statistics.fmean(values)}


def _rate_recovery(data, _units, parameters):
    capacity = _numbers(data, "capacity")
    baseline = int(parameters.get("baseline_index", 0))
    recovery = int(parameters.get("recovery_index", len(capacity) - 1))
    try:
        result = capacity[recovery] / capacity[baseline] * 100
    except (IndexError, ZeroDivisionError) as exc:
        raise RecipeInputError("倍率恢复索引无效或基准容量为 0。") from exc
    return {"rate_recovery_percent": result, "baseline_index": baseline, "recovery_index": recovery}


def _gcd(data, units, parameters):
    time = _numbers(data, "time")
    voltage = _numbers(data, "voltage")
    current = _parameter(parameters, "current_a")
    mass = _parameter(parameters, "active_mass_g")
    if len(time) != len(voltage) or len(time) < 2 or mass <= 0:
        raise RecipeInputError("GCD 时间/电压序列或活性物质量无效。")
    capacity = abs(current) * abs(time[-1] - time[0]) / 3.6 / mass
    return {"specific_capacity_mAh_g": capacity, "voltage_plateau_v": statistics.median(voltage)}


def _local_peaks(values: list[float]) -> list[int]:
    return [index for index in range(1, len(values) - 1) if values[index] >= values[index - 1] and values[index] > values[index + 1]]


def _cv(data, _units, parameters):
    potential = _numbers(data, "potential")
    current = _numbers(data, "current")
    if len(potential) != len(current) or len(current) < 3:
        raise RecipeInputError("CV 电位和电流序列必须等长且至少 3 点。")
    oxidation = _local_peaks(current)
    reduction = _local_peaks([-value for value in current])
    result: dict[str, object] = {
        "oxidation_peak_v": [potential[index] for index in oxidation],
        "reduction_peak_v": [potential[index] for index in reduction],
    }
    scan_rates = parameters.get("scan_rates")
    peak_currents = parameters.get("peak_currents")
    if isinstance(scan_rates, list) and isinstance(peak_currents, list) and len(scan_rates) == len(peak_currents) >= 2:
        x = [math.log(float(item)) for item in scan_rates]
        y = [math.log(abs(float(item))) for item in peak_currents]
        xbar, ybar = statistics.fmean(x), statistics.fmean(y)
        denominator = sum((value - xbar) ** 2 for value in x)
        if denominator:
            result["log_i_log_v_slope"] = sum((a - xbar) * (b - ybar) for a, b in zip(x, y)) / denominator
    return result


def _gitt(data, _units, parameters):
    delta_es = _numbers(data, "delta_es")
    delta_et = _numbers(data, "delta_et")
    tau = _numbers(data, "tau_s")
    length_cm = _parameter(parameters, "diffusion_length_cm")
    if not (len(delta_es) == len(delta_et) == len(tau)) or any(value == 0 for value in delta_et + tau):
        raise RecipeInputError("GITT 电位差和脉冲时间必须等长且非零。")
    values = [(4 * length_cm**2 / (math.pi * t)) * (es / et) ** 2 for es, et, t in zip(delta_es, delta_et, tau)]
    return {"diffusion_coefficient_cm2_s": values}


_EIS_ALLOWLIST = {"R0-p(R1,C1)", "R0-p(R1,CPE1)-W", "R0-p(R1,CPE1)-p(R2,CPE2)-W"}


def _eis(data, _units, parameters):
    real = _numbers(data, "z_real_ohm")
    imag = _numbers(data, "z_imag_ohm")
    circuit = str(parameters.get("equivalent_circuit", ""))
    if circuit not in _EIS_ALLOWLIST:
        raise RecipeInputError("必须从固定白名单确认等效电路。")
    if len(real) != len(imag) or len(real) < 3:
        raise RecipeInputError("EIS 实部和虚部必须等长且至少 3 点。")
    r0 = min(real)
    rct = max(real) - r0
    return {"equivalent_circuit": circuit, "r0_ohm": r0, "rct_ohm_estimate": rct, "fit_diagnostic": "初值估计；正式拟合前请复核频率范围和电路。"}


def _xrd(data, _units, parameters):
    angles = _numbers(data, "two_theta_deg")
    wavelength = _parameter(parameters, "wavelength_nm")
    d_values = [wavelength / (2 * math.sin(math.radians(value / 2))) for value in angles]
    result: dict[str, object] = {"d_spacing_nm": d_values}
    if "fwhm_deg" in data:
        fwhm = _numbers(data, "fwhm_deg")
        broadening = _parameter(parameters, "instrument_broadening_deg")
        shape = float(parameters.get("scherrer_k", 0.9))
        if len(fwhm) != len(angles):
            raise RecipeInputError("FWHM 与峰位数量必须一致。")
        sizes = []
        for angle, width in zip(angles, fwhm):
            corrected = math.sqrt(max(width**2 - broadening**2, 0))
            if corrected <= 0:
                raise RecipeInputError("仪器展宽不小于观测峰宽，不能计算晶粒尺寸。")
            sizes.append(shape * wavelength / (math.radians(corrected) * math.cos(math.radians(angle / 2))))
        result["scherrer_size_nm"] = sizes
    return result


def _constrained_peaks(data, _units, parameters):
    x = _numbers(data, "x")
    y = _numbers(data, "y")
    ranges = parameters.get("peak_ranges")
    if len(x) != len(y) or not isinstance(ranges, list) or not ranges:
        raise RecipeInputError("必须提供等长谱线及人工确认的峰位约束范围。")
    peaks = []
    for pair in ranges:
        if not isinstance(pair, list) or len(pair) != 2:
            raise RecipeInputError("峰位约束范围格式错误。")
        candidates = [(yv, xv) for xv, yv in zip(x, y) if float(pair[0]) <= xv <= float(pair[1])]
        if not candidates:
            raise RecipeInputError("约束范围内没有数据点。")
        peaks.append(max(candidates)[1])
    return {"constrained_peak_positions": peaks, "interpretation": "仅报告约束峰位，不自动判定物相或价态。"}


def _spectral(data, _units, parameters):
    result = _constrained_peaks(data, _units, parameters)
    y = _numbers(data, "y")
    if len(result["constrained_peak_positions"]) >= 2 and max(y) != 0:
        result["intensity_ratio_note"] = "强度比需基线校正后人工确认。"
    return result


def _microscopy(data, _units, parameters):
    pixels = _numbers(data, "diameter_px")
    scale = _parameter(parameters, "scale_nm_per_px")
    if scale <= 0:
        raise RecipeInputError("比例尺必须大于 0。")
    sizes = [value * scale for value in pixels]
    return {"diameter_nm": sizes, "mean_diameter_nm": statistics.fmean(sizes), "count": len(sizes)}


def _table_stats(data, _units, _parameters):
    output: dict[str, object] = {}
    for key, value in data.items():
        if not isinstance(value, list):
            continue
        numbers: list[float] = []
        indices: list[int] = []
        missing = invalid = ranges = 0
        for index, item in enumerate(value):
            if item is None or item == "":
                missing += 1
                continue
            if isinstance(item, str) and re.fullmatch(r"\s*[+-]?\d+(?:\.\d+)?\s*[-–~～]\s*[+-]?\d+(?:\.\d+)?\s*", item):
                ranges += 1
                continue
            try:
                if isinstance(item, bool):
                    raise ValueError
                number = float(item)
                if not math.isfinite(number):
                    raise ValueError
            except (TypeError, ValueError):
                invalid += 1
                continue
            numbers.append(number)
            indices.append(index)
        common = {"total_count": len(value), "missing_count": missing, "invalid_count": invalid,
                  "range_count": ranges, "excluded_count": len(value) - len(numbers)}
        if not numbers:
            if invalid and not ranges and all(isinstance(item, str) for item in value if item is not None):
                common["invalid_count"] = 0
            output[key] = {**common, "count": 0, "mean": None, "standard_deviation": None,
                           "outlier_indices": [], "status": "skipped", "reason": "无有效数值；可能为文本标识列"}
            continue
        ordered = sorted(numbers)
        q1, q3 = ordered[len(ordered) // 4], ordered[(len(ordered) * 3) // 4]
        iqr = q3 - q1
        output[key] = {
            "count": len(numbers),
            "mean": statistics.fmean(numbers),
            "standard_deviation": statistics.stdev(numbers) if len(numbers) > 1 else None,
            "outlier_indices": [indices[i] for i, item in enumerate(numbers) if item < q1 - 1.5 * iqr or item > q3 + 1.5 * iqr],
            **common, "status": "included", "reason": ("仅1个有效值，样本标准差不可计算" if len(numbers) == 1 else
                "排除缺失、区间和非数值" if common["excluded_count"] else "全部数值有效"),
        }
    if not any(item["status"] == "included" for item in output.values()):
        raise RecipeInputError("没有可统计的数值列。")
    return {"columns": output}


def _group_compare(data, _units, _parameters):
    groups = data.get("groups")
    if not isinstance(groups, dict) or len(groups) < 2:
        raise RecipeInputError("组间比较至少需要两个数值组。")
    means = {str(key): statistics.fmean(float(item) for item in value) for key, value in groups.items() if isinstance(value, list) and value}
    if len(means) < 2:
        raise RecipeInputError("组数据不完整。")
    return {"group_means": means, "max_mean_difference": max(means.values()) - min(means.values()), "causal_warning": "组间差异不代表因果关系。"}


def _curve(data, _units, parameters):
    x, y = _numbers(data, "x"), _numbers(data, "y")
    if len(x) != len(y) or float(parameters.get("calibration_residual", 1)) > 0.01:
        raise RecipeInputError("曲线轴校准残差超过 1% 或坐标不完整。")
    return {"x": x, "y": y, "point_count": len(x), "calibration_residual": float(parameters.get("calibration_residual", 0))}


def _unit_check(data, units, _parameters):
    missing = [key for key, value in data.items() if isinstance(value, list) and key not in units]
    return {"consistent": not missing, "missing_unit_columns": missing}


def _recipe(key, domain, inputs, description, runner):
    return ScientificRecipe(key, domain, "1.0.0", inputs, description, runner)


RECIPES = {
    recipe.key: recipe
    for recipe in (
        _recipe("electrochem.cycle_retention", "electrochemistry", ("capacity",), "循环容量保持率", _retention),
        _recipe("electrochem.coulombic_efficiency", "electrochemistry", ("charge_capacity", "discharge_capacity"), "库仑效率", _efficiency),
        _recipe("electrochem.rate_recovery", "electrochemistry", ("capacity",), "倍率恢复", _rate_recovery),
        _recipe("electrochem.gcd", "electrochemistry", ("time", "voltage"), "GCD平台与容量", _gcd),
        _recipe("electrochem.cv", "electrochemistry", ("potential", "current"), "CV峰位与多扫速率", _cv),
        _recipe("electrochem.gitt", "electrochemistry", ("delta_es", "delta_et", "tau_s"), "GITT扩散系数", _gitt),
        _recipe("electrochem.eis", "electrochemistry", ("z_real_ohm", "z_imag_ohm"), "EIS白名单电路", _eis),
        _recipe("materials.xrd_bragg", "materials", ("two_theta_deg",), "XRD晶面间距/Scherrer", _xrd),
        _recipe("materials.xps_constrained", "materials", ("x", "y"), "XPS受约束峰拟合", _constrained_peaks),
        _recipe("materials.raman_ftir", "materials", ("x", "y"), "Raman/FTIR峰位", _spectral),
        _recipe("materials.microscopy_size", "materials", ("diameter_px",), "显微粒径统计", _microscopy),
        ScientificRecipe("generic.table_statistics", "generic", "1.1.0", (), "表格统计和异常值提示", _table_stats),
        _recipe("generic.group_compare", "generic", ("groups",), "组间比较", _group_compare),
        _recipe("generic.curve_digitize", "generic", ("x", "y"), "曲线数字化校验", _curve),
        _recipe("generic.unit_check", "generic", (), "单位一致性检查", _unit_check),
    )
}


def get_recipe(key: str) -> ScientificRecipe:
    return RECIPES[key]


def list_recipes() -> list[dict[str, object]]:
    return [
        {
            "key": recipe.key,
            "domain": recipe.domain,
            "algorithm_version": recipe.version,
            "required_inputs": list(recipe.required_inputs),
            "description": recipe.description,
        }
        for recipe in RECIPES.values()
    ]

