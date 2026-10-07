from __future__ import annotations

from pathlib import Path
import io
import zipfile
import shutil

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'research.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def test_0021_creates_research_assistance_tables_and_nullable_paper(client: TestClient) -> None:
    inspector = inspect(client.app.state.engine)
    assert {"scientific_imports", "research_ideas", "experiment_designs", "research_exports"}.issubset(inspector.get_table_names())
    paper_id = next(column for column in inspector.get_columns("scientific_datasets") if column["name"] == "paper_id")
    assert paper_id["nullable"] is True


def test_csv_preview_confirmation_and_independent_dataset(client: TestClient) -> None:
    imported = client.post(
        "/api/v1/scientific-imports",
        files={"file": ("cycling.csv", "cycle,capacity\n1,120.5\n2,118.0\n".encode("gb18030"), "text/csv")},
    )
    assert imported.status_code == 201
    body = imported.json()
    assert body["row_count"] == 2
    assert body["column_count"] == 2
    assert body["preview"][0] == ["cycle", "capacity"]

    confirmed = client.post(
        f"/api/v1/scientific-imports/{body['id']}/confirm",
        json={"name": "循环性能", "domain": "electrochemistry", "dataset_type": "cycling", "units": {"capacity": "mAh g-1"}, "parameters": {"row_column_complete": True, "unit_complete": True, "quality_review": {"reviewed": True, "handling_policy": "exclude_missing_and_non_numeric"}}},
    )
    assert confirmed.status_code == 201
    assert confirmed.json()["paper_id"] is None
    assert confirmed.json()["confirmation_status"] == "confirmed"
    assert client.get("/api/v1/scientific-datasets").json()["items"][0]["name"] == "循环性能"

    rejected = client.post("/api/v1/scientific-imports", files={"file": ("legacy.xls", b"legacy", "application/vnd.ms-excel")})
    assert rejected.status_code == 400
    macro = client.post("/api/v1/scientific-imports", files={"file": ("macro.xlsm", b"macro", "application/vnd.ms-excel.sheet.macroEnabled.12")})
    assert macro.status_code == 400


def test_user_and_selected_evidence_ideas_and_experiment_checks(client: TestClient) -> None:
    imported = client.post("/api/v1/scientific-imports", files={"file": ("data.csv", b"x,y\n1,2\n", "text/csv")}).json()
    dataset = client.post(f"/api/v1/scientific-imports/{imported['id']}/confirm", json={"name": "data", "domain": "general", "dataset_type": "table", "units": {}, "parameters": {"row_column_complete": True, "unit_complete": True, "cells_complete": True}}).json()
    user_idea = client.post("/api/v1/research-ideas", json={"title": "低温界面假设", "hypothesis": "界面阻抗决定低温倍率。"})
    assert user_idea.status_code == 201
    generated = client.post("/api/v1/research-ideas/generate", json={"paper_ids": [], "dataset_ids": [dataset["id"]]})
    assert generated.status_code == 201
    assert generated.json()["source_mode"] == "selected_evidence"
    assert generated.json()["evidence_gaps"]

    design = client.post("/api/v1/experiment-designs", json={"idea_id": user_idea.json()["id"], "title": "低温对照实验", "variables": "温度与容量", "measurement": "测量容量"})
    assert design.status_code == 201
    missing = {item["field"] for item in design.json()["deterministic_findings"] if item["status"] == "missing"}
    assert {"controls", "replication", "randomization", "statistics", "stopping_criteria", "risks"}.issubset(missing)
    reviewed = client.post(f"/api/v1/experiment-designs/{design.json()['id']}/review")
    assert reviewed.status_code == 200
    assert "Mock" in reviewed.json()["ai_review"]


def test_delete_idea_removes_its_designs_but_preserves_other_records(client: TestClient) -> None:
    idea_id = client.post("/api/v1/research-ideas", json={"title": "待删除想法"}).json()["id"]
    other_idea_id = client.post("/api/v1/research-ideas", json={"title": "保留想法"}).json()["id"]
    design_ids = [client.post("/api/v1/experiment-designs", json={"idea_id": idea_id, "title": f"设计 {index}"}).json()["id"] for index in (1, 2)]
    other_design_id = client.post("/api/v1/experiment-designs", json={"idea_id": other_idea_id, "title": "保留设计"}).json()["id"]
    imported = client.post("/api/v1/scientific-imports", files={"file": ("source.csv", b"x,y\n1,2\n", "text/csv")}).json()
    dataset = client.post(f"/api/v1/scientific-imports/{imported['id']}/confirm", json={
        "name": "保留数据", "domain": "general", "dataset_type": "table", "idea_id": idea_id,
        "parameters": {"row_column_complete": True, "unit_complete": True},
    }).json()

    deleted = client.delete(f"/api/v1/research-ideas/{idea_id}")
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert [item["id"] for item in client.get("/api/v1/research-ideas").json()] == [other_idea_id]
    assert {item["id"] for item in client.get("/api/v1/experiment-designs").json()} == {other_design_id}
    assert all(client.get(f"/api/v1/experiment-designs/{design_id}").status_code == 404 for design_id in design_ids)
    preserved = client.get("/api/v1/scientific-datasets").json()["items"]
    assert preserved[0]["id"] == dataset["id"]
    assert preserved[0]["idea_id"] is None
    assert client.delete(f"/api/v1/research-ideas/{idea_id}").status_code == 404


def test_delete_experiment_design_only_removes_itself(client: TestClient) -> None:
    idea_id = client.post("/api/v1/research-ideas", json={"title": "保留想法"}).json()["id"]
    design_id = client.post("/api/v1/experiment-designs", json={"idea_id": idea_id, "title": "待删除设计"}).json()["id"]
    other_design_id = client.post("/api/v1/experiment-designs", json={"idea_id": idea_id, "title": "保留设计"}).json()["id"]

    deleted = client.delete(f"/api/v1/experiment-designs/{design_id}")
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert client.get(f"/api/v1/experiment-designs/{design_id}").status_code == 404
    assert client.get(f"/api/v1/experiment-designs/{other_design_id}").status_code == 200
    assert [item["id"] for item in client.get("/api/v1/research-ideas").json()] == [idea_id]
    assert client.delete(f"/api/v1/experiment-designs/{design_id}").status_code == 404
    assert client.delete("/api/v1/experiment-designs/999999").status_code == 404
    assert client.delete("/api/v1/research-ideas/999999").status_code == 404


def test_markdown_export_uses_only_selected_evidence(client: TestClient) -> None:
    imported = client.post("/api/v1/scientific-imports", files={"file": ("data.csv", b"x,y\n1,2\n", "text/csv")}).json()
    dataset = client.post(f"/api/v1/scientific-imports/{imported['id']}/confirm", json={"name": "证据数据", "domain": "general", "dataset_type": "table", "units": {}, "parameters": {"row_column_complete": True, "unit_complete": True, "cells_complete": True}}).json()
    exported = client.post("/api/v1/research-exports", json={"title": "证据综述", "export_type": "markdown", "paper_ids": [], "dataset_ids": [dataset["id"]], "analysis_ids": []})
    assert exported.status_code == 201
    assert "证据数据" in exported.json()["markdown"]
    assert f"[数据集{dataset['id']}]" in exported.json()["markdown"]
    invalid = client.post("/api/v1/research-exports", json={"title": "伪引用", "export_type": "markdown", "paper_ids": [999999], "dataset_ids": [], "analysis_ids": []})
    assert invalid.status_code == 422


def _xlsx_bytes(*, formula: bool = False) -> bytes:
    output = io.BytesIO()
    cell = '<c r="A1" t="inlineStr"><is><t>x</t></is></c><c r="B1" t="inlineStr"><is><t>y</t></is></c><c r="A2"><v>1</v></c>'
    cell += '<c r="B2"><f>SUM(A2)</f><v>2</v></c>' if formula else '<c r="B2"><v>2</v></c>'
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as book:
        book.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
        book.writestr("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        book.writestr("xl/workbook.xml", '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>')
        book.writestr("xl/_rels/workbook.xml.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
        book.writestr("xl/worksheets/sheet1.xml", f'<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">{cell[:cell.find("<c r=\"A2\"")]}</row><row r="2">{cell[cell.find("<c r=\"A2\""):]}</row></sheetData></worksheet>')
    return output.getvalue()


def test_xlsx_read_only_preview_and_formula_rejection(client: TestClient) -> None:
    preview = client.post("/api/v1/scientific-imports", files={"file": ("data.xlsx", _xlsx_bytes(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert preview.status_code == 201
    assert preview.json()["available_sheets"] == ["Sheet1"]
    assert preview.json()["preview"][:2] == [["x", "y"], [1, 2]]
    formula = client.post("/api/v1/scientific-imports", files={"file": ("formula.xlsx", _xlsx_bytes(formula=True), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert formula.status_code == 400
    assert "公式" in formula.json()["detail"]


@pytest.mark.skipif(shutil.which("pandoc") is None, reason="Pandoc not installed in local environment")
@pytest.mark.parametrize("export_type,required_member", [("docx", "word/document.xml"), ("pptx", "ppt/presentation.xml")])
def test_pandoc_exports_are_openable(client: TestClient, export_type: str, required_member: str) -> None:
    imported = client.post("/api/v1/scientific-imports", files={"file": (f"{export_type}.csv", b"x,y\n1,2\n", "text/csv")}).json()
    dataset = client.post(f"/api/v1/scientific-imports/{imported['id']}/confirm", json={"name": f"{export_type} evidence", "domain": "general", "dataset_type": "table", "units": {}, "parameters": {"row_column_complete": True, "unit_complete": True, "cells_complete": True}}).json()
    exported = client.post("/api/v1/research-exports", json={"title": "Research evidence", "export_type": export_type, "paper_ids": [], "dataset_ids": [dataset["id"]], "analysis_ids": []})
    assert exported.status_code == 201
    downloaded = client.get(f"/api/v1/research-exports/{exported.json()['id']}/download")
    assert downloaded.status_code == 200
    with zipfile.ZipFile(io.BytesIO(downloaded.content)) as archive:
        assert required_member in archive.namelist()
