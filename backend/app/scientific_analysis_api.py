from __future__ import annotations

import csv
import io
import json
import zipfile
from pathlib import Path
from datetime import datetime
from typing import Any

import fitz
from fastapi import Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field, StrictBool
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models import Paper, ScientificAnalysisRun, ScientificDataset
from app.schemas import (
    ScientificAnalysisResponse,
    ScientificDatasetListResponse,
    ScientificDatasetResponse,
    ScientificRecipeResponse,
)
from app.scientific_analysis import RECIPES, RecipeInputError, get_recipe, list_recipes
from app.research_helpers import quality


class DatasetCreate(BaseModel):
    parse_run_id: int | None = None
    visual_id: int | None = None
    crop_id: int | None = None
    source_type: str = Field(max_length=30)
    domain: str = Field(max_length=50)
    dataset_type: str = Field(max_length=80)
    data: dict[str, Any]
    units: dict[str, Any] = Field(default_factory=dict)
    parameters: dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(ge=0, le=1)


class DatasetPatch(BaseModel):
    data: dict[str, Any] | None = None
    units: dict[str, Any] | None = None
    parameters: dict[str, Any] | None = None
    confirmed: StrictBool | None = None


class AnalysisCreate(BaseModel):
    recipe: str = Field(max_length=100)
    parameters: dict[str, Any] = Field(default_factory=dict)


def _loads(value: str, fallback):
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return fallback


def _confirmation(source_type: str, dataset_type: str, confidence: float, parameters: dict[str, Any]) -> str:
    if source_type == "cloud_vision":
        return "pending"
    if dataset_type in {"table", "cycling"}:
        passed = all(parameters.get(key) is True for key in ("row_column_complete", "unit_complete", "cells_complete"))
        return "confirmed" if confidence >= 0.9 and passed else "pending"
    if dataset_type == "curve":
        passed = (
            parameters.get("axis_complete") is True
            and float(parameters.get("calibration_residual", 1)) <= 0.01
            and parameters.get("unobstructed") is True
            and parameters.get("series_matched") is True
        )
        return "confirmed" if confidence >= 0.9 and passed else "pending"
    return "pending"


def _dataset_payload(item: ScientificDataset) -> dict[str, object]:
    history = _loads(item.revision_history_json, [])
    data = _loads(item.data_json, {})
    parameters = _loads(item.parameters_json, {})
    return {
        "id": item.id,
        "paper_id": item.paper_id,
        "name": item.name,
        "import_id": item.import_id,
        "idea_id": item.idea_id,
        "contest_project_id": item.contest_project_id,
        "parse_run_id": item.parse_run_id,
        "visual_id": item.visual_id,
        "crop_id": item.crop_id,
        "source_type": item.source_type,
        "domain": item.domain,
        "dataset_type": item.dataset_type,
        "data": data,
        "units": _loads(item.units_json, {}),
        "parameters": parameters,
        "quality": quality(data, parameters),
        "confidence": item.confidence,
        "confirmation_status": item.confirmation_status,
        "is_stale": item.is_stale,
        "is_favorite": item.is_favorite,
        "is_read": item.is_read,
        "revision_count": len(history),
    }


def _analysis_payload(item: ScientificAnalysisRun) -> dict[str, object]:
    return {
        "id": item.id,
        "dataset_id": item.dataset_id,
        "recipe": item.recipe_key,
        "algorithm_version": item.algorithm_version,
        "parameters": _loads(item.parameters_json, {}),
        "results": _loads(item.results_json, {}),
        "diagnostics": _loads(item.diagnostics_json, {}),
        "report_markdown": item.report_markdown,
        "status": item.status,
        "is_stale": item.is_stale,
        "error_message": item.error_message,
    }


def _csv_bytes(data: dict[str, object]) -> bytes:
    columns = {key: value for key, value in data.items() if isinstance(value, list)}
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(columns.keys())
    for index in range(max((len(value) for value in columns.values()), default=0)):
        writer.writerow([value[index] if index < len(value) else "" for value in columns.values()])
    return output.getvalue().encode("utf-8-sig")


def _plot_files(data: dict[str, object]) -> tuple[bytes, bytes]:
    lists = [value for value in data.values() if isinstance(value, list) and value]
    values: list[float] = []
    if lists:
        try:
            values = [float(item) for item in lists[-1]]
        except (TypeError, ValueError):
            values = []
    width, height = 640, 360
    if values:
        low, high = min(values), max(values)
        span = high - low or 1
        points = " ".join(f"{40 + i * 560 / max(len(values)-1, 1):.1f},{320 - (value-low)*280/span:.1f}" for i, value in enumerate(values))
    else:
        points = "40,180 600,180"
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}"><rect width="100%" height="100%" fill="white"/><polyline points="{points}" fill="none" stroke="#12345b" stroke-width="3"/></svg>'.encode()
    try:
        with fitz.open(stream=svg, filetype="svg") as document:
            png = document[0].get_pixmap(alpha=False).tobytes("png")
    except Exception:
        png = __import__("base64").b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
    return svg, png


def register_scientific_analysis_routes(app, get_db) -> None:
    @app.get("/api/v1/scientific-recipes", response_model=list[ScientificRecipeResponse])
    def recipes() -> list[ScientificRecipeResponse]:
        return [ScientificRecipeResponse(**item) for item in list_recipes()]

    @app.post("/api/v1/papers/{paper_id}/scientific-datasets", status_code=201, response_model=ScientificDatasetResponse)
    def create_dataset(paper_id: int, payload: DatasetCreate, db: Session = Depends(get_db)) -> ScientificDatasetResponse:
        if db.get(Paper, paper_id) is None:
            raise HTTPException(status_code=404, detail="论文不存在。")
        item = ScientificDataset(
            paper_id=paper_id,
            parse_run_id=payload.parse_run_id,
            visual_id=payload.visual_id,
            crop_id=payload.crop_id,
            source_type=payload.source_type,
            domain=payload.domain,
            dataset_type=payload.dataset_type,
            data_json=json.dumps(payload.data, ensure_ascii=False),
            units_json=json.dumps(payload.units, ensure_ascii=False),
            parameters_json=json.dumps(payload.parameters, ensure_ascii=False),
            confidence=payload.confidence,
            confirmation_status=_confirmation(payload.source_type, payload.dataset_type, payload.confidence, payload.parameters),
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return ScientificDatasetResponse(**{**_dataset_payload(item), "confirmation_status": item.confirmation_status})

    @app.get("/api/v1/papers/{paper_id}/scientific-datasets", response_model=ScientificDatasetListResponse)
    def list_datasets(paper_id: int, db: Session = Depends(get_db)) -> ScientificDatasetListResponse:
        if db.get(Paper, paper_id) is None:
            raise HTTPException(status_code=404, detail="论文不存在。")
        items = list(db.scalars(select(ScientificDataset).where(ScientificDataset.paper_id == paper_id).order_by(ScientificDataset.created_at.desc())))
        return ScientificDatasetListResponse(items=[ScientificDatasetResponse(**{**_dataset_payload(item), "confirmation_status": item.confirmation_status}) for item in items])

    @app.get("/api/v1/scientific-datasets/{dataset_id}", response_model=ScientificDatasetResponse)
    def get_dataset(dataset_id: int, db: Session = Depends(get_db)) -> ScientificDatasetResponse:
        item = db.get(ScientificDataset, dataset_id)
        if item is None:
            raise HTTPException(status_code=404, detail="科研数据集不存在。")
        return ScientificDatasetResponse(**_dataset_payload(item))

    @app.get("/api/v1/scientific-datasets/{dataset_id}/analyses", response_model=list[ScientificAnalysisResponse])
    def list_dataset_analyses(dataset_id: int, db: Session = Depends(get_db)) -> list[ScientificAnalysisResponse]:
        if db.get(ScientificDataset, dataset_id) is None:
            raise HTTPException(status_code=404, detail="科研数据集不存在。")
        return [ScientificAnalysisResponse(**_analysis_payload(item)) for item in db.scalars(
            select(ScientificAnalysisRun).where(ScientificAnalysisRun.dataset_id == dataset_id).order_by(ScientificAnalysisRun.created_at.desc()))]

    @app.patch("/api/v1/scientific-datasets/{dataset_id}", response_model=ScientificDatasetResponse)
    def patch_dataset(dataset_id: int, payload: DatasetPatch, db: Session = Depends(get_db)) -> ScientificDatasetResponse:
        item = db.get(ScientificDataset, dataset_id)
        if item is None:
            raise HTTPException(status_code=404, detail="科研数据集不存在。")
        if payload.data is None and payload.units is None and payload.parameters is None and payload.confirmed is None:
            raise HTTPException(status_code=422, detail="至少提交一项修改。")
        if payload.parameters is not None and "quality_review" in payload.parameters:
            review = payload.parameters["quality_review"]
            if not isinstance(review, dict) or ("handling_policy" in review and not isinstance(review["handling_policy"], str)):
                raise HTTPException(status_code=422, detail="质量复核必须是对象，处理策略必须是文本")
        history = _loads(item.revision_history_json, [])
        history.append({
            "data": _loads(item.data_json, {}), "units": _loads(item.units_json, {}),
            "parameters": _loads(item.parameters_json, {}), "confirmation_status": item.confirmation_status,
            "changed_at": datetime.utcnow().isoformat(),
        })
        if payload.data is not None:
            item.data_json = json.dumps(payload.data, ensure_ascii=False)
        if payload.units is not None:
            item.units_json = json.dumps(payload.units, ensure_ascii=False)
        if payload.parameters is not None:
            item.parameters_json = json.dumps(payload.parameters, ensure_ascii=False)
            if item.source_type == "user_import" and payload.confirmed is not True:
                params = _loads(item.parameters_json, {})
                if params.get("quality_review", {}).get("reviewed") is not True or not all(params.get(key) is True for key in ("row_column_complete", "unit_complete")):
                    item.confirmation_status = "pending"
        if item.source_type == "user_import" and (payload.data is not None or payload.units is not None):
            item.confirmation_status = "pending"
            if payload.confirmed is not True:
                parameters = _loads(item.parameters_json, {})
                parameters["quality_review"] = {"reviewed": False, "handling_policy": parameters.get("quality_review", {}).get("handling_policy", "")}
                item.parameters_json = json.dumps(parameters, ensure_ascii=False)
        if payload.confirmed is not None:
            if payload.confirmed and item.source_type == "user_import":
                parameters = _loads(item.parameters_json, {})
                profile = quality(_loads(item.data_json, {}), parameters)
                reviewed = profile["reviewed"]
                if not reviewed or parameters.get("quality_review", {}).get("handling_policy") != "exclude_missing_and_non_numeric" or not all(parameters.get(key) is True for key in ("row_column_complete", "unit_complete")):
                    raise HTTPException(status_code=422, detail="请明确核对行列、单位和缺失/非数值处理策略")
                parameters["cells_complete"] = not any(count for key in ("missing_values", "range_values", "invalid_values") for count in profile[key].values())
                item.parameters_json = json.dumps(parameters, ensure_ascii=False)
            item.confirmation_status = "confirmed" if payload.confirmed else "pending"
        item.revision_history_json = json.dumps(history, ensure_ascii=False)
        db.execute(update(ScientificAnalysisRun).where(ScientificAnalysisRun.dataset_id == dataset_id).values(is_stale=True))
        db.commit()
        db.refresh(item)
        return ScientificDatasetResponse(**{**_dataset_payload(item), "confirmation_status": item.confirmation_status})

    @app.post("/api/v1/scientific-datasets/{dataset_id}/analyses", status_code=201, response_model=ScientificAnalysisResponse)
    def create_analysis(dataset_id: int, payload: AnalysisCreate, db: Session = Depends(get_db)) -> ScientificAnalysisResponse:
        dataset = db.get(ScientificDataset, dataset_id)
        if dataset is None:
            raise HTTPException(status_code=404, detail="科研数据集不存在。")
        if dataset.confirmation_status != "confirmed":
            raise HTTPException(status_code=409, detail="低置信度或云端数据必须人工确认后才能计算。")
        if dataset.source_type == "user_import":
            stored = _loads(dataset.parameters_json, {})
            if (stored.get("quality_review", {}).get("reviewed") is not True
                or stored.get("quality_review", {}).get("handling_policy") != "exclude_missing_and_non_numeric"
                or not all(stored.get(key) is True for key in ("row_column_complete", "unit_complete"))):
                raise HTTPException(status_code=409, detail="科研导入数据尚未按当前质量概况完成人工核对")
        try:
            recipe = get_recipe(payload.recipe)
        except KeyError as exc:
            raise HTTPException(status_code=422, detail="仅允许运行注册表中的固定科研配方。") from exc
        merged_parameters = {**_loads(dataset.parameters_json, {}), **payload.parameters}
        try:
            results = recipe.run(_loads(dataset.data_json, {}), _loads(dataset.units_json, {}), merged_parameters)
        except RecipeInputError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        report = f"# 科研数据分析\n\n- 配方：{recipe.description}\n- 算法版本：{recipe.version}\n- 证据：人工确认的结构化数据\n\n结果：\n\n```json\n{json.dumps(results, ensure_ascii=False, indent=2)}\n```\n\n> 计算结果不自动构成物相、价态、反应机理或因果判断。"
        item = ScientificAnalysisRun(
            dataset_id=dataset_id,
            recipe_key=recipe.key,
            parameters_json=json.dumps(merged_parameters, ensure_ascii=False),
            algorithm_version=recipe.version,
            results_json=json.dumps(results, ensure_ascii=False),
            diagnostics_json=json.dumps({"input_confirmed": True, "fixed_algorithm": True}, ensure_ascii=False),
            report_markdown=report,
            artifacts_json=json.dumps(["data.csv", "method.json", "plot.png", "plot.svg", "report.md", "rerun.py"]),
            status="completed",
            completed_at=datetime.utcnow(),
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return ScientificAnalysisResponse(**{**_analysis_payload(item), "status": item.status})

    @app.get("/api/v1/scientific-analyses/{analysis_id}", response_model=ScientificAnalysisResponse)
    def get_analysis(analysis_id: int, db: Session = Depends(get_db)) -> ScientificAnalysisResponse:
        item = db.get(ScientificAnalysisRun, analysis_id)
        if item is None:
            raise HTTPException(status_code=404, detail="科研分析不存在。")
        return ScientificAnalysisResponse(**{**_analysis_payload(item), "status": item.status})

    @app.get("/api/v1/scientific-analyses/{analysis_id}/export")
    def export_analysis(analysis_id: int, db: Session = Depends(get_db)) -> Response:
        item = db.get(ScientificAnalysisRun, analysis_id)
        if item is None or item.status != "completed":
            raise HTTPException(status_code=404, detail="可导出的科研分析不存在。")
        if item.is_stale:
            raise HTTPException(status_code=409, detail="分析结果已过期，请基于当前数据重新计算")
        dataset = db.get(ScientificDataset, item.dataset_id)
        if dataset is None:
            raise HTTPException(status_code=404, detail="来源数据集不存在。")
        data = _loads(dataset.data_json, {})
        method = {
            "recipe": item.recipe_key,
            "algorithm_version": item.algorithm_version,
            "parameters": _loads(item.parameters_json, {}),
            "units": _loads(dataset.units_json, {}),
            "results": _loads(item.results_json, {}),
            "runtime_algorithm_version": get_recipe(item.recipe_key).version,
            "column_lengths": {key: len(value) for key, value in data.items() if isinstance(value, list)},
            "csv_row_count": max((len(value) for value in data.values() if isinstance(value, list)), default=0),
            "source": {"paper_id": dataset.paper_id, "parse_run_id": dataset.parse_run_id, "dataset_id": dataset.id},
        }
        svg, png = _plot_files(data)
        script = """# Recompute from editable data.csv using the bundled deterministic recipe.\nimport csv, json\nfrom pathlib import Path\nfrom scientific_analysis import get_recipe\nmethod=json.loads(Path('method.json').read_text(encoding='utf-8'))\nrows=list(csv.DictReader(Path('data.csv').open(encoding='utf-8-sig', newline='')))\ndata={key: [] for key in (rows[0] if rows else {})}\nfor row in rows:\n    for key, value in row.items():\n        if value == '': parsed = None\n        else:\n            try: parsed = float(value)\n            except ValueError: parsed = value\n        data[key].append(parsed)\ndata.update(json.loads(Path('data.json').read_text(encoding='utf-8')))\nresult=get_recipe(method['recipe']).run(data, method['units'], method['parameters'])\nPath('recomputed_results.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')\nprint(json.dumps(result, ensure_ascii=False, indent=2))\n"""
        script = script.replace("data.update(json.loads", "for key, values in data.items():\n    original = method['column_lengths'].get(key, len(values))\n    data[key] = values[:original] + values[method['csv_row_count']:]\ndata.update(json.loads")
        output = io.BytesIO()
        with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("data.csv", _csv_bytes(data))
            archive.writestr("data.json", json.dumps({key: value for key, value in data.items() if not isinstance(value, list)}, ensure_ascii=False))
            archive.writestr("method.json", json.dumps(method, ensure_ascii=False, indent=2))
            archive.writestr("plot.svg", svg)
            archive.writestr("plot.png", png)
            archive.writestr("report.md", item.report_markdown)
            archive.writestr("rerun.py", script)
            archive.writestr("scientific_analysis.py", Path(__file__).with_name("scientific_analysis.py").read_text(encoding="utf-8"))
            archive.writestr("README.txt", "Run python rerun.py in this extracted directory with Python 3.12 or newer. Edit data.csv to change table cells; non-list inputs such as groups are in data.json. Existing padded cells are ignored using original column lengths; newly appended rows are included. rerun.py writes recomputed_results.json from the bundled algorithm, not method.results. method.algorithm_version is the saved record version; method.runtime_algorithm_version is the bundled rerun version and can differ for old analyses.\n")
        return Response(
            content=output.getvalue(),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="scientific-analysis-{item.id}.zip"'},
        )
