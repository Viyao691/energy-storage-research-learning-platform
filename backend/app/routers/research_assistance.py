"""Phase 6B independent data, ideas, experiment checks and research exports."""

from __future__ import annotations

import csv
import hashlib
import io
import json
import shutil
import subprocess
import zipfile
from pathlib import Path
from typing import Any, Literal
import httpx

from fastapi import Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import ExperimentDesign, Paper, ResearchExport, ResearchIdea, ScientificAnalysisRun, ScientificDataset, ScientificImport
from app.providers import ModelProviderError, make_provider
from app.schemas import ExperimentDesignResponse, ResearchExportResponse, ResearchIdeaResponse, ScientificDatasetListResponse, ScientificDatasetResponse, ScientificDatasetStateUpdate, ScientificImportResponse
from app.secrets import get_model_api_key
from app.scientific_analysis_api import _dataset_payload
from app.scientific_analysis import RecipeInputError, get_recipe
from app.research_helpers import bounded_evidence, dataset_evidence, paper_evidence, quality

from ._shared import _get_setting


class ScientificImportConfirm(BaseModel):
    name: str = Field(min_length=1, max_length=500)
    selected_sheet: str | None = Field(default=None, max_length=300)
    domain: str = Field(min_length=1, max_length=50)
    dataset_type: str = Field(min_length=1, max_length=80)
    units: dict[str, str] = Field(default_factory=dict)
    parameters: dict[str, Any] = Field(default_factory=dict)
    paper_id: int | None = None
    idea_id: int | None = None
    contest_project_id: int | None = None


class ResearchIdeaCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    hypothesis: str = Field(default="", max_length=20_000)
    evidence: str = Field(default="", max_length=20_000)
    novelty: str = Field(default="", max_length=20_000)
    falsification: str = Field(default="", max_length=20_000)
    feasibility: str = Field(default="", max_length=20_000)
    resources: str = Field(default="", max_length=20_000)
    evidence_gaps: str = Field(default="", max_length=20_000)
    paper_ids: list[int] = Field(default_factory=list, max_length=30)
    dataset_ids: list[int] = Field(default_factory=list, max_length=30)


class ResearchIdeaGenerate(BaseModel):
    paper_ids: list[int] = Field(default_factory=list, max_length=30)
    dataset_ids: list[int] = Field(default_factory=list, max_length=30)


class ResearchIdeaPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    hypothesis: str | None = Field(default=None, max_length=20_000)
    evidence: str | None = Field(default=None, max_length=20_000)
    novelty: str | None = Field(default=None, max_length=20_000)
    falsification: str | None = Field(default=None, max_length=20_000)
    feasibility: str | None = Field(default=None, max_length=20_000)
    resources: str | None = Field(default=None, max_length=20_000)
    evidence_gaps: str | None = Field(default=None, max_length=20_000)
    paper_ids: list[int] | None = Field(default=None, max_length=30)
    dataset_ids: list[int] | None = Field(default=None, max_length=30)


class ExperimentDesignPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    variables: str | None = Field(default=None, max_length=20_000)
    controls: str | None = Field(default=None, max_length=20_000)
    replication: str | None = Field(default=None, max_length=20_000)
    randomization: str | None = Field(default=None, max_length=20_000)
    measurement: str | None = Field(default=None, max_length=20_000)
    statistics: str | None = Field(default=None, max_length=20_000)
    stopping_criteria: str | None = Field(default=None, max_length=20_000)
    resources: str | None = Field(default=None, max_length=20_000)
    risks: str | None = Field(default=None, max_length=20_000)


class ExperimentDesignCreate(BaseModel):
    idea_id: int | None = None
    contest_project_id: int | None = None
    title: str = Field(min_length=1, max_length=500)
    variables: str = Field(default="", max_length=20_000)
    controls: str = Field(default="", max_length=20_000)
    replication: str = Field(default="", max_length=20_000)
    randomization: str = Field(default="", max_length=20_000)
    measurement: str = Field(default="", max_length=20_000)
    statistics: str = Field(default="", max_length=20_000)
    stopping_criteria: str = Field(default="", max_length=20_000)
    resources: str = Field(default="", max_length=20_000)
    risks: str = Field(default="", max_length=20_000)


class ResearchExportCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    export_type: Literal["markdown", "docx", "pptx"] = "markdown"
    paper_ids: list[int] = Field(default_factory=list, max_length=100)
    dataset_ids: list[int] = Field(default_factory=list, max_length=100)
    analysis_ids: list[int] = Field(default_factory=list, max_length=100)


def _loads(value: str, fallback):
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return fallback


def _provider(db: Session):
    setting = _get_setting(db)
    return make_provider(setting.model_provider, get_model_api_key(setting.model_provider, setting.model_base_url), setting.model_base_url, setting.model_name, setting.timeout_seconds, vision_model=setting.vision_model)


def _research_model_error(exc: ModelProviderError) -> HTTPException:
    cause = exc.__cause__
    if isinstance(cause, httpx.HTTPStatusError):
        status = cause.response.status_code
        if status == 400:
            return HTTPException(502, "科研模型请求格式被拒绝（上游 HTTP 400）；请核对 JSON 模式与输出字段")
        if status in (401, 403):
            return HTTPException(502, f"科研模型鉴权失败（上游 HTTP {status}）")
        return HTTPException(502, f"科研模型服务返回 HTTP {status}")
    if isinstance(cause, httpx.TimeoutException):
        return HTTPException(504, "科研模型响应超时")
    if "输出达到上限" in str(exc):
        return HTTPException(502, "科研模型输出超过本次预算，结果未保存；请减少所选证据后重试")
    return HTTPException(502, str(exc))


def _coerce(value: object) -> object:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float, bool)):
        return value
    text = str(value).strip()
    try:
        return float(text) if any(char in text for char in ".eE") else int(text)
    except ValueError:
        return text


def _table_metadata(rows: list[list[object]]) -> tuple[int, int, dict[str, str], dict[str, int], list[list[object | None]]]:
    if not rows:
        raise HTTPException(status_code=400, detail="数据文件没有可读取内容")
    width = max(len(row) for row in rows)
    if width > 5_000 or len(rows) > 100_001:
        raise HTTPException(status_code=400, detail="数据维度超过 100000 行或 5000 列限制")
    header = [str(value).strip() or f"column_{index}" for index, value in enumerate(rows[0], 1)]
    if len(set(header)) != len(header):
        raise HTTPException(status_code=400, detail="数据列名必须唯一")
    body = [[_coerce(value) for value in [*row, *([None] * (width - len(row)))]] for row in rows[1:]]
    profile = quality({name: [row[index] for row in body] for index, name in enumerate(header)}, {})
    types = profile["column_types"]
    missing = profile["missing_values"]
    return len(body), width, types, missing, [header, *body[:20]]


def _csv_rows(data: bytes) -> list[list[object]]:
    decoded = None
    for encoding in ("utf-8-sig", "gb18030"):
        try:
            decoded = data.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    if decoded is None or "\x00" in decoded:
        raise HTTPException(status_code=400, detail="CSV 必须使用 UTF-8 或 GB18030 编码")
    return [list(row) for row in csv.reader(io.StringIO(decoded))]


def _xlsx_rows(path: Path, selected_sheet: str | None = None) -> tuple[list[str], str, list[list[object]]]:
    try:
        with zipfile.ZipFile(path) as archive:
            files = archive.infolist()
            expanded = sum(item.file_size for item in files)
            compressed = max(sum(item.compress_size for item in files), 1)
            if expanded > 200 * 1024 * 1024 or expanded / compressed > 100:
                raise HTTPException(status_code=400, detail="XLSX 解压体积或压缩比异常")
            if any(item.filename.startswith("xl/vbaProject") for item in files):
                raise HTTPException(status_code=400, detail="不支持含宏的工作簿")
            for item in files:
                if item.filename.startswith("xl/worksheets/") and b"<f" in archive.read(item):
                    raise HTTPException(status_code=400, detail="工作簿包含公式；系统不会执行公式")
    except HTTPException:
        raise
    except (zipfile.BadZipFile, OSError) as exc:
        raise HTTPException(status_code=400, detail="XLSX 结构无法安全读取") from exc
    try:
        from python_calamine import CalamineWorkbook
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="python-calamine 尚未安装，CSV 导入仍可使用") from exc
    try:
        workbook = CalamineWorkbook.from_path(str(path))
        sheets = list(workbook.sheet_names)
        if not sheets:
            raise ValueError("no sheets")
        sheet = selected_sheet or sheets[0]
        if sheet not in sheets:
            raise HTTPException(status_code=422, detail="选择的工作表不存在")
        rows = workbook.get_sheet_by_name(sheet).to_python(skip_empty_area=False)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="XLSX 工作表无法读取") from exc
    return sheets, sheet, [list(row) for row in rows]


def _import_response(item: ScientificImport, profile: dict | None = None) -> ScientificImportResponse:
    return ScientificImportResponse(
        id=item.id, original_filename=item.original_filename, sha256=item.sha256, file_format=item.file_format,
        available_sheets=_loads(item.available_sheets_json, []), selected_sheet=item.selected_sheet,
        row_count=item.row_count, column_count=item.column_count, column_types=_loads(item.column_types_json, {}),
        missing_values=_loads(item.missing_values_json, {}), preview=_loads(item.preview_json, []), status=item.status,
        range_values=(profile or {}).get("range_values", {}), invalid_values=(profile or {}).get("invalid_values", {}),
        created_at=item.created_at,
    )


def _idea_response(item: ResearchIdea) -> ResearchIdeaResponse:
    return ResearchIdeaResponse(
        id=item.id, title=item.title, source_mode=item.source_mode,
        selected_paper_ids=_loads(item.selected_paper_ids_json, []), selected_dataset_ids=_loads(item.selected_dataset_ids_json, []),
        hypothesis=item.hypothesis, evidence=item.evidence, novelty=item.novelty, falsification=item.falsification,
        feasibility=item.feasibility, resources=item.resources, evidence_gaps=item.evidence_gaps, ai_review=item.ai_review,
        created_at=item.created_at, updated_at=item.updated_at,
    )


_EXPERIMENT_FIELDS = ("variables", "controls", "replication", "randomization", "measurement", "statistics", "stopping_criteria", "resources", "risks")


def _experiment_response(item: ExperimentDesign) -> ExperimentDesignResponse:
    return ExperimentDesignResponse(
        id=item.id, idea_id=item.idea_id, contest_project_id=item.contest_project_id, title=item.title,
        **{field: getattr(item, field) for field in _EXPERIMENT_FIELDS},
        deterministic_findings=_loads(item.deterministic_findings_json, []), ai_review=item.ai_review,
        created_at=item.created_at, updated_at=item.updated_at,
    )


def _export_response(item: ResearchExport) -> ResearchExportResponse:
    return ResearchExportResponse(
        id=item.id, title=item.title, export_type=item.export_type,
        selected_paper_ids=_loads(item.selected_paper_ids_json, []), selected_dataset_ids=_loads(item.selected_dataset_ids_json, []),
        selected_analysis_ids=_loads(item.selected_analysis_ids_json, []), markdown=item.markdown, status=item.status,
        download_available=bool(item.file_path and Path(item.file_path).is_file()), created_at=item.created_at,
    )


def register_research_assistance_routes(app, get_db) -> None:
    @app.post("/api/v1/scientific-imports", response_model=ScientificImportResponse, status_code=201)
    async def create_import(file: UploadFile = File(...), db: Session = Depends(get_db)) -> ScientificImportResponse:
        filename = Path(file.filename or "").name
        suffix = Path(filename).suffix.lower()
        if suffix in {".xls", ".xlsm", ".xltm", ".xlsb"}:
            raise HTTPException(status_code=400, detail="仅支持无宏 XLSX；不支持 XLS、XLSM 或 XLSB")
        if suffix not in {".csv", ".xlsx"}:
            raise HTTPException(status_code=400, detail="科研数据仅支持 CSV 或 XLSX")
        max_size = min(get_settings().max_upload_size_mb, 50) * 1024 * 1024
        data = bytearray()
        try:
            while chunk := await file.read(1024 * 1024):
                data.extend(chunk)
                if len(data) > max_size:
                    raise HTTPException(status_code=400, detail="科研数据文件超过 50MB 或系统上传限制")
        finally:
            await file.close()
        raw = bytes(data)
        if not raw:
            raise HTTPException(status_code=400, detail="科研数据文件为空")
        digest = hashlib.sha256(raw).hexdigest()
        if db.scalar(select(ScientificImport).where(ScientificImport.sha256 == digest)):
            raise HTTPException(status_code=409, detail="该科研数据文件已导入")
        directory = get_settings().paper_storage_dir / "scientific-imports"
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / f"{digest}{suffix}"
        path.write_bytes(raw)
        try:
            if suffix == ".csv":
                sheets, selected_sheet, rows = [], None, _csv_rows(raw)
            else:
                sheets, selected_sheet, rows = _xlsx_rows(path)
            row_count, column_count, column_types, missing_values, preview = _table_metadata(rows)
        except Exception:
            path.unlink(missing_ok=True)
            raise
        item = ScientificImport(
            original_filename=filename, file_path=str(path), sha256=digest, file_format=suffix.removeprefix("."),
            available_sheets_json=json.dumps(sheets, ensure_ascii=False), selected_sheet=selected_sheet,
            row_count=row_count, column_count=column_count, column_types_json=json.dumps(column_types, ensure_ascii=False),
            missing_values_json=json.dumps(missing_values, ensure_ascii=False), preview_json=json.dumps(preview, ensure_ascii=False), status="preview",
        )
        db.add(item)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback(); path.unlink(missing_ok=True)
            raise HTTPException(status_code=409, detail="该科研数据文件已导入") from exc
        db.refresh(item)
        data = {str(name): [_coerce(row[index] if index < len(row) else None) for row in rows[1:]] for index, name in enumerate(rows[0])}
        return _import_response(item, quality(data, {}))

    @app.get("/api/v1/scientific-imports", response_model=list[ScientificImportResponse])
    def list_imports(db: Session = Depends(get_db)) -> list[ScientificImportResponse]:
        return [_import_response(item) for item in db.scalars(select(ScientificImport).order_by(ScientificImport.created_at.desc()))]

    @app.get("/api/v1/scientific-imports/{import_id}", response_model=ScientificImportResponse)
    def get_import(import_id: int, selected_sheet: str | None = None, db: Session = Depends(get_db)) -> ScientificImportResponse:
        imported = db.get(ScientificImport, import_id)
        if imported is None:
            raise HTTPException(status_code=404, detail="科研数据导入不存在")
        if imported.file_format == "csv":
            if selected_sheet is not None:
                raise HTTPException(status_code=422, detail="CSV 文件没有工作表")
            sheets, sheet, rows = [], None, _csv_rows(Path(imported.file_path).read_bytes())
        else:
            sheets, sheet, rows = _xlsx_rows(Path(imported.file_path), selected_sheet or imported.selected_sheet)
        row_count, column_count, column_types, missing_values, preview = _table_metadata(rows)
        data = {str(name): [_coerce(row[index] if index < len(row) else None) for row in rows[1:]] for index, name in enumerate(rows[0])}
        profile = quality(data, {})
        return ScientificImportResponse(id=imported.id, original_filename=imported.original_filename,
            sha256=imported.sha256, file_format=imported.file_format, available_sheets=sheets,
            selected_sheet=sheet, row_count=row_count, column_count=column_count,
            column_types=column_types, missing_values=missing_values, range_values=profile["range_values"], invalid_values=profile["invalid_values"], preview=preview,
            status=imported.status, created_at=imported.created_at)

    @app.post("/api/v1/scientific-imports/{import_id}/confirm", response_model=ScientificDatasetResponse, status_code=201)
    def confirm_import(import_id: int, payload: ScientificImportConfirm, db: Session = Depends(get_db)) -> ScientificDatasetResponse:
        imported = db.get(ScientificImport, import_id)
        if imported is None:
            raise HTTPException(status_code=404, detail="科研数据导入不存在")
        if payload.paper_id is not None and db.get(Paper, payload.paper_id) is None:
            raise HTTPException(status_code=422, detail="关联论文不存在")
        if "quality_review" in payload.parameters:
            review = payload.parameters["quality_review"]
            if not isinstance(review, dict) or ("handling_policy" in review and not isinstance(review["handling_policy"], str)):
                raise HTTPException(status_code=422, detail="质量复核必须是对象，处理策略必须是文本")
        path = Path(imported.file_path)
        if imported.file_format == "csv":
            rows = _csv_rows(path.read_bytes())
            selected_sheet = None
        else:
            sheets, selected_sheet, rows = _xlsx_rows(path, payload.selected_sheet)
            imported.available_sheets_json = json.dumps(sheets, ensure_ascii=False)
        row_count, column_count, column_types, missing_values, preview = _table_metadata(rows)
        header = [str(value) for value in rows[0]]
        body = rows[1:]
        data = {name: [_coerce(row[index] if index < len(row) else None) for row in body] for index, name in enumerate(header)}
        profile = quality(data, payload.parameters)
        review = payload.parameters.get("quality_review", {})
        required = (all(payload.parameters.get(key) is True for key in ("row_column_complete", "unit_complete"))
            and review.get("reviewed") is True and review.get("handling_policy") == "exclude_missing_and_non_numeric")
        parameters = {**payload.parameters, "cells_complete": not any(
            count for field in ("missing_values", "range_values", "invalid_values") for count in profile[field].values())}
        dataset = ScientificDataset(
            paper_id=payload.paper_id, name=payload.name.strip(), import_id=import_id, idea_id=payload.idea_id,
            contest_project_id=payload.contest_project_id, source_type="user_import", domain=payload.domain,
            dataset_type=payload.dataset_type, data_json=json.dumps(data, ensure_ascii=False), units_json=json.dumps(payload.units, ensure_ascii=False),
            parameters_json=json.dumps(parameters, ensure_ascii=False), confidence=1.0, confirmation_status="confirmed" if required else "pending",
        )
        imported.selected_sheet = selected_sheet
        imported.row_count, imported.column_count = row_count, column_count
        imported.column_types_json, imported.missing_values_json = json.dumps(column_types, ensure_ascii=False), json.dumps(missing_values, ensure_ascii=False)
        imported.preview_json, imported.status = json.dumps(preview, ensure_ascii=False), "confirmed"
        db.add(dataset); db.commit(); db.refresh(dataset)
        return ScientificDatasetResponse(**_dataset_payload(dataset))

    @app.get("/api/v1/scientific-datasets", response_model=ScientificDatasetListResponse)
    def list_all_datasets(db: Session = Depends(get_db)) -> ScientificDatasetListResponse:
        items = list(db.scalars(select(ScientificDataset).order_by(ScientificDataset.created_at.desc())))
        return ScientificDatasetListResponse(items=[ScientificDatasetResponse(**_dataset_payload(item)) for item in items])

    @app.patch("/api/v1/scientific-datasets/{dataset_id}/state", response_model=ScientificDatasetResponse)
    def update_dataset_state(
        dataset_id: int,
        payload: ScientificDatasetStateUpdate,
        db: Session = Depends(get_db),
    ) -> ScientificDatasetResponse:
        item = db.get(ScientificDataset, dataset_id)
        if item is None:
            raise HTTPException(404, "科研数据集不存在")
        item.is_favorite = payload.is_favorite
        item.is_read = payload.is_read
        db.commit()
        db.refresh(item)
        return ScientificDatasetResponse(**_dataset_payload(item))

    @app.post("/api/v1/research-ideas", response_model=ResearchIdeaResponse, status_code=201)
    def create_idea(payload: ResearchIdeaCreate, db: Session = Depends(get_db)) -> ResearchIdeaResponse:
        if any(db.get(Paper, record_id) is None for record_id in payload.paper_ids) or any(db.get(ScientificDataset, record_id) is None for record_id in payload.dataset_ids):
            raise HTTPException(422, "选择的论文或数据集不存在")
        values = payload.model_dump(exclude={"paper_ids", "dataset_ids"})
        item = ResearchIdea(source_mode="user", selected_paper_ids_json=json.dumps(payload.paper_ids),
            selected_dataset_ids_json=json.dumps(payload.dataset_ids), **values)
        db.add(item); db.commit(); db.refresh(item)
        return _idea_response(item)

    @app.get("/api/v1/research-ideas", response_model=list[ResearchIdeaResponse])
    def list_ideas(db: Session = Depends(get_db)) -> list[ResearchIdeaResponse]:
        return [_idea_response(item) for item in db.scalars(select(ResearchIdea).order_by(ResearchIdea.updated_at.desc()))]

    @app.patch("/api/v1/research-ideas/{idea_id}", response_model=ResearchIdeaResponse)
    def patch_idea(idea_id: int, payload: ResearchIdeaPatch, db: Session = Depends(get_db)) -> ResearchIdeaResponse:
        item = db.get(ResearchIdea, idea_id)
        if item is None:
            raise HTTPException(404, "科研想法不存在")
        changes = payload.model_dump(exclude_unset=True)
        if any(value is None for value in changes.values()):
            raise HTTPException(status_code=422, detail="编辑字段不能为 null；可用空文本清除可选内容")
        if "title" in changes and not changes["title"].strip():
            raise HTTPException(status_code=422, detail="科研想法标题不能为空")
        content_changed = any(getattr(item, key) != value for key, value in changes.items() if key not in ("paper_ids", "dataset_ids"))
        for field, ids, model in (("paper_ids", changes.get("paper_ids"), Paper), ("dataset_ids", changes.get("dataset_ids"), ScientificDataset)):
            if ids is not None:
                if any(db.get(model, record_id) is None for record_id in ids):
                    raise HTTPException(422, "选择的论文或数据集不存在")
                content_changed = content_changed or _loads(getattr(item, f"selected_{field}_json"), []) != ids
                setattr(item, f"selected_{field}_json", json.dumps(ids))
                changes.pop(field)
        for field, value in changes.items():
            setattr(item, field, value)
        if content_changed:
            item.ai_review = ""
            db.execute(update(ExperimentDesign).where(ExperimentDesign.idea_id == idea_id).values(ai_review=""))
        db.commit(); db.refresh(item)
        return _idea_response(item)

    @app.post("/api/v1/research-ideas/generate", response_model=ResearchIdeaResponse, status_code=201)
    def generate_idea(payload: ResearchIdeaGenerate, db: Session = Depends(get_db)) -> ResearchIdeaResponse:
        if not payload.paper_ids and not payload.dataset_ids:
            raise HTTPException(status_code=422, detail="请明确选择至少一篇论文或一个数据集")
        papers = [db.get(Paper, item_id) for item_id in payload.paper_ids]
        datasets = [db.get(ScientificDataset, item_id) for item_id in payload.dataset_ids]
        if any(item is None for item in [*papers, *datasets]):
            raise HTTPException(status_code=422, detail="选择的论文或数据集不存在")
        try:
            evidence = bounded_evidence(papers, datasets, db)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        prompt = ("仅依据以下明确选择的证据生成科研想法。请返回一个 JSON 对象，字段 title, hypothesis, evidence, novelty, "
            "falsification, feasibility, resources, evidence_gaps 全部为字符串。每个事实与数值使用给定 [D:id:r,c] 或 [P:id:p] 引用；"
            "标题不超过60字，其余每字段不超过180字，每字段一至两句；不要写长篇论证。"
            "不得补充外部事实、不得将模拟或文献汇总说成实测。\n" + evidence)
        try:
            result = _provider(db).generate_structured_task(prompt, "research_idea", max_tokens=3200)
        except ModelProviderError as exc:
            raise _research_model_error(exc) from exc
        fields = ("title", "hypothesis", "evidence", "novelty", "falsification", "feasibility", "resources", "evidence_gaps")
        if any(not isinstance(result.data.get(key), str) for key in fields):
            raise HTTPException(status_code=422, detail="模型返回的候选选题字段不是完整字符串结构")
        values = {key: result.data[key][:20_000] for key in fields}
        if not values["title"].strip() or not values["hypothesis"].strip():
            raise HTTPException(status_code=422, detail="模型返回的候选选题结构不完整")
        item = ResearchIdea(source_mode="selected_evidence", selected_paper_ids_json=json.dumps(payload.paper_ids), selected_dataset_ids_json=json.dumps(payload.dataset_ids), **values)
        db.add(item); db.commit(); db.refresh(item)
        return _idea_response(item)

    @app.post("/api/v1/experiment-designs", response_model=ExperimentDesignResponse, status_code=201)
    def create_experiment(payload: ExperimentDesignCreate, db: Session = Depends(get_db)) -> ExperimentDesignResponse:
        if payload.idea_id is not None and db.get(ResearchIdea, payload.idea_id) is None:
            raise HTTPException(status_code=422, detail="关联科研想法不存在")
        findings = [{"field": field, "status": "present" if getattr(payload, field).strip() else "missing", "message": "已填写" if getattr(payload, field).strip() else "请补充该设计要素"} for field in _EXPERIMENT_FIELDS]
        item = ExperimentDesign(**payload.model_dump(), deterministic_findings_json=json.dumps(findings, ensure_ascii=False))
        db.add(item); db.commit(); db.refresh(item)
        return _experiment_response(item)

    @app.get("/api/v1/experiment-designs", response_model=list[ExperimentDesignResponse])
    def list_experiments(idea_id: int | None = None, db: Session = Depends(get_db)) -> list[ExperimentDesignResponse]:
        statement = select(ExperimentDesign)
        if idea_id is not None:
            statement = statement.where(ExperimentDesign.idea_id == idea_id)
        return [_experiment_response(item) for item in db.scalars(statement.order_by(ExperimentDesign.updated_at.desc()))]

    @app.get("/api/v1/experiment-designs/{design_id}", response_model=ExperimentDesignResponse)
    def get_experiment(design_id: int, db: Session = Depends(get_db)) -> ExperimentDesignResponse:
        item = db.get(ExperimentDesign, design_id)
        if item is None:
            raise HTTPException(404, "实验设计不存在")
        return _experiment_response(item)

    @app.patch("/api/v1/experiment-designs/{design_id}", response_model=ExperimentDesignResponse)
    def patch_experiment(design_id: int, payload: ExperimentDesignPatch, db: Session = Depends(get_db)) -> ExperimentDesignResponse:
        item = db.get(ExperimentDesign, design_id)
        if item is None:
            raise HTTPException(404, "实验设计不存在")
        changes = payload.model_dump(exclude_unset=True)
        if any(value is None for value in changes.values()):
            raise HTTPException(status_code=422, detail="设计字段不能为 null；可用空文本清除可选内容")
        if "title" in changes and not changes["title"].strip():
            raise HTTPException(status_code=422, detail="实验设计标题不能为空")
        content_changed = any(getattr(item, field) != value for field, value in changes.items())
        for field, value in changes.items():
            setattr(item, field, value)
        if content_changed:
            item.deterministic_findings_json = json.dumps([{"field": field, "status": "present" if getattr(item, field).strip() else "missing", "message": "已填写" if getattr(item, field).strip() else "请补充该设计要素"} for field in _EXPERIMENT_FIELDS], ensure_ascii=False)
            item.ai_review = ""
        db.commit(); db.refresh(item)
        return _experiment_response(item)

    @app.post("/api/v1/experiment-designs/{design_id}/review", response_model=ExperimentDesignResponse)
    def review_experiment(design_id: int, db: Session = Depends(get_db)) -> ExperimentDesignResponse:
        item = db.get(ExperimentDesign, design_id)
        if item is None:
            raise HTTPException(status_code=404, detail="实验设计不存在")
        idea = db.get(ResearchIdea, item.idea_id) if item.idea_id else None
        papers = [db.get(Paper, record_id) for record_id in _loads(idea.selected_paper_ids_json, [])] if idea else []
        datasets = [db.get(ScientificDataset, record_id) for record_id in _loads(idea.selected_dataset_ids_json, [])] if idea else []
        if any(entry is None for entry in [*papers, *datasets]):
            raise HTTPException(422, "科研想法关联的证据已不存在；请先更新选择")
        try:
            evidence = bounded_evidence(papers, datasets, db)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        idea_text = "\n".join(f"{field}: {getattr(idea, field)}" for field in ("title", "hypothesis", "evidence", "novelty", "falsification", "feasibility", "resources", "evidence_gaps")) if idea else "未关联科研想法"
        prompt = ("请返回 JSON 对象，字段 review 为字符串。只根据下列科研想法、九项实验设计和明确所选证据审查证据边界与完整性，"
            "指出具体缺项和可证伪性；review 不超过500字，不得生成高风险可执行参数。\n科研想法：\n" + idea_text + "\n实验设计：\n"
            + "\n".join(f"{field}: {getattr(item, field)}" for field in _EXPERIMENT_FIELDS) + "\n证据：\n" + evidence)
        try:
            result = _provider(db).generate_structured_task(prompt, "experiment_review", max_tokens=1600)
        except ModelProviderError as exc:
            raise _research_model_error(exc) from exc
        if not isinstance(result.data.get("review"), str):
            raise HTTPException(status_code=422, detail="模型未返回字符串格式的实验设计审查")
        item.ai_review = result.data["review"][:20_000]
        if not item.ai_review:
            raise HTTPException(status_code=422, detail="模型未返回实验设计审查")
        db.commit(); db.refresh(item)
        return _experiment_response(item)

    @app.post("/api/v1/research-exports", response_model=ResearchExportResponse, status_code=201)
    def create_export(payload: ResearchExportCreate, db: Session = Depends(get_db)) -> ResearchExportResponse:
        if not payload.paper_ids and not payload.dataset_ids and not payload.analysis_ids:
            raise HTTPException(status_code=422, detail="请明确选择至少一项论文、数据或分析证据")
        papers = [db.get(Paper, item_id) for item_id in payload.paper_ids]
        datasets = [db.get(ScientificDataset, item_id) for item_id in payload.dataset_ids]
        analyses = [db.get(ScientificAnalysisRun, item_id) for item_id in payload.analysis_ids]
        if any(item is None for item in [*papers, *datasets, *analyses]):
            raise HTTPException(status_code=422, detail="选择的证据包包含不存在的记录")
        allowed_dataset_ids = set(payload.dataset_ids)
        if any(item and item.dataset_id not in allowed_dataset_ids for item in analyses):
            raise HTTPException(status_code=422, detail="分析结果必须同时选择其来源数据集")
        if any(item and item.is_stale for item in analyses):
            raise HTTPException(status_code=409, detail="所选分析已过期，请重新计算后导出")
        if any(item and item.status != "completed" for item in analyses):
            raise HTTPException(status_code=409, detail="所选分析尚未完成，不能用于导出")
        lines = [f"# {payload.title}", "", "> 仅整理用户明确选择的本地证据；数值描述不代表因果结论。", "", "## 来源与证据"]
        slides = [f"# {payload.title}", "", "## 证据概览", f"论文 {len(papers)} 篇；数据集 {len(datasets)} 个；已选分析 {len(analyses)} 项。", "完整原始行、全部结果和引用详见 Markdown/Word 证据包。"]
        summaries: list[str] = []
        for item in papers:
            if item:
                lines.extend(["", paper_evidence(db, item, limit=6000)])
                slides.extend(["", f"## 论文 {item.id}", paper_evidence(db, item, limit=500)])
        for item in datasets:
            if item:
                lines.extend(["", f"### [数据集{item.id}] {item.name}",
                    f"确认状态：{item.confirmation_status}；来源类型：{item.source_type}。",
                    dataset_evidence(item, limit=20_000, max_rows=200, max_columns=50)])
                profile = quality(_loads(item.data_json, {}), _loads(item.parameters_json, {}))
                provenance = _loads(item.parameters_json, {})
                slides.extend(["", f"## 数据集 {item.id}：{item.name}",
                    f"[D{item.id}] {profile['row_count']} 行 × {profile['column_count']} 列；核对状态：{item.confirmation_status}。",
                    f"来源：{provenance.get('source_reference') or provenance.get('source_url') or '仅本地记录，未标外部来源'}；数据性质：{provenance.get('data_origin') or '未标注'}。"])
                try:
                    stats = get_recipe("generic.table_statistics").run(_loads(item.data_json, {}), _loads(item.units_json, {}), {})["columns"]
                except RecipeInputError:
                    lines.append("描述性统计：没有有效数值列，不能计算均值或样本标准差。")
                    slides.append("没有可统计的数值列；不能计算均值或样本标准差。")
                else:
                    lines.append("描述性统计（按当前数据即时重算，非已保存分析）：")
                    shown = 0
                    for name, entry in stats.items():
                        if entry["status"] == "included":
                            unit = _loads(item.units_json, {}).get(name, "未记录单位")
                            lines.append(f"- [D{item.id}:c{name}] 有效 n={entry['count']}/{entry['total_count']}，均值={entry['mean']} {unit}，样本标准差={entry['standard_deviation']}；缺失{entry['missing_count']}、区间{entry['range_count']}、无效{entry['invalid_count']}，排除{entry['excluded_count']}。")
                            summaries.append(f"[D{item.id}:c{name}] 的{entry['total_count']}行中{entry['count']}个数值进入计算，均值{entry['mean']} {unit}；排除{entry['excluded_count']}项")
                            if shown < 4:
                                slides.append(f"- [D{item.id}:c{name}] n={entry['count']}/{entry['total_count']}；均值 {entry['mean']} {unit}；样本标准差 {entry['standard_deviation']}；缺失 {entry['missing_count']}、区间 {entry['range_count']}、无效 {entry['invalid_count']}。")
                                shown += 1
                        else:
                            lines.append(f"- [D{item.id}:c{name}] 跳过：{entry['reason']}；总行数{entry['total_count']}。")
                    if sum(entry["status"] == "included" for entry in stats.values()) > shown:
                        slides.append("其余数值列和逐行证据见 Markdown/Word 证据包。")
        lines.extend(["", "## 已选分析"])
        for item in analyses:
            if item:
                lines.extend([f"### [A{item.id}] {item.recipe_key} / v{item.algorithm_version}",
                    f"来源：[数据集{item.dataset_id}]；状态：{item.status}；参数：{item.parameters_json}",
                    "```json", json.dumps(_loads(item.results_json, {}), ensure_ascii=False, indent=2), "```"])
                slides.extend(["", f"## 分析 {item.id}", f"[A{item.id}] {item.recipe_key} / v{item.algorithm_version}；来源 [D{item.dataset_id}]。"])
                results = _loads(item.results_json, {})
                if isinstance(results.get("columns"), dict):
                    for name, entry in list(results["columns"].items())[:4]:
                        slides.append(f"- {name}：n={entry.get('count')}，均值={entry.get('mean')}，排除={entry.get('excluded_count', '旧算法未记录')}。")
                    if len(results["columns"]) > 4:
                        slides.append("其余列见 Markdown/Word 证据包。")
                else:
                    for name, value in list(results.items())[:4]:
                        if isinstance(value, (list, dict)):
                            slides.append(f"- {name}：结构化结果 {len(value)} 项；完整数值见 Markdown/Word 证据包。")
                        elif isinstance(value, str) and len(value) > 90:
                            slides.append(f"- {name}：长文本结果；完整内容见 Markdown/Word 证据包。")
                        else:
                            slides.append(f"- {name}：{value}")
        lines.extend(["", "## 综合与限制", "",
            "所选数据的直接描述为：" + "；".join(summaries) + "。" if summaries else "所选材料没有可统计的数值列；只能按论文或元数据的实际范围阅读。",
            "以上为所选原始记录和确定性算法结果的汇编，并非新生成的学术综述。缺失值、区间和非数值项按质量概况披露；若来源混合文献汇总、模拟与实验，不应合并解释为同一实验样本。均值和异常提示不证明机理、显著性或因果关系。", "", "## 引用索引"])
        slides.extend(["", "## 证据边界与引用", "均值、标准差和异常提示仅描述所选数据；文献汇总、模拟工况与实验不可混称，不能据此推断因果或材料优劣。"])
        slides.extend([f"- [P{item.id}] DOI: {item.doi or '未记录'}" for item in papers if item] + [f"- [D{item.id}] {item.name}" for item in datasets if item] + [f"- [A{item.id}] 来源 [D{item.dataset_id}]" for item in analyses if item])
        lines.extend([f"- [论文{item.id}] {item.title}; DOI: {item.doi or '未记录'}; URL: {item.landing_url or '未记录'}" for item in papers if item] + [f"- [数据集{item.id}] {item.name}; 本地数据集ID {item.id}" for item in datasets if item] + [f"- [A{item.id}] {item.recipe_key}; 来源数据集 {item.dataset_id}" for item in analyses if item])
        markdown = "\n".join(lines)
        export = ResearchExport(title=payload.title, export_type=payload.export_type, selected_paper_ids_json=json.dumps(payload.paper_ids), selected_dataset_ids_json=json.dumps(payload.dataset_ids), selected_analysis_ids_json=json.dumps(payload.analysis_ids), markdown=markdown, status="completed")
        db.add(export); db.flush()
        directory = get_settings().paper_storage_dir / "research-exports"
        directory.mkdir(parents=True, exist_ok=True)
        source = directory / f"{export.id}.md"
        source.write_text("\n".join(slides) if payload.export_type == "pptx" else markdown, encoding="utf-8")
        export.file_path = str(source)
        if payload.export_type != "markdown":
            executable = shutil.which("pandoc")
            if executable is None:
                db.rollback()
                raise HTTPException(status_code=503, detail="Pandoc 尚未安装；Markdown 导出仍可使用")
            destination = directory / f"{export.id}.{payload.export_type}"
            try:
                command = [executable, str(source), "-o", str(destination)]
                if payload.export_type == "pptx":
                    command.append("--slide-level=2")
                subprocess.run(command, check=True, timeout=120, capture_output=True)
            except (subprocess.SubprocessError, OSError) as exc:
                source.unlink(missing_ok=True); destination.unlink(missing_ok=True); db.rollback()
                raise HTTPException(status_code=502, detail="Pandoc 导出失败") from exc
            source.unlink(missing_ok=True)
            export.file_path = str(destination)
        db.commit(); db.refresh(export)
        return _export_response(export)

    @app.get("/api/v1/research-exports/{export_id}/download")
    def download_export(export_id: int, db: Session = Depends(get_db)):
        item = db.get(ResearchExport, export_id)
        if item is None or not item.file_path or not Path(item.file_path).is_file():
            raise HTTPException(status_code=404, detail="可下载的研究导出不存在")
        return FileResponse(item.file_path, filename=f"research-export-{item.id}.{item.export_type}")
