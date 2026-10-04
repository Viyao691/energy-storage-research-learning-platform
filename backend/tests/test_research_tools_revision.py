from __future__ import annotations

import io
import json
import subprocess
import sys
import zipfile
from types import SimpleNamespace
from pathlib import Path

import pytest
import httpx

from app.scientific_analysis import get_recipe
from app.models import Paper
from sqlalchemy.orm import Session

from test_research_assistance_phase6b import client


def _dataset(client):
    imported = client.post("/api/v1/scientific-imports", files={"file": ("measure.csv", "material,value\nA,10\nB,\nC,12-14\nD,14\n".encode(), "text/csv")}).json()
    return imported


def test_import_requires_explicit_review_and_reports_quality(client):
    imported = _dataset(client)
    preview = client.get(f"/api/v1/scientific-imports/{imported['id']}")
    assert preview.status_code == 200
    assert preview.json()["missing_values"]["value"] == 1
    assert preview.json()["range_values"]["value"] == 1
    assert preview.json()["column_types"]["value"] == "mixed"
    pending = client.post(f"/api/v1/scientific-imports/{imported['id']}/confirm", json={"name": "measure", "domain": "generic", "dataset_type": "table", "units": {"value": "kJ"}, "parameters": {"row_column_complete": True, "unit_complete": True, "cells_complete": True}})
    assert pending.status_code == 201
    assert pending.json()["confirmation_status"] == "pending"
    assert pending.json()["quality"]["missing_values"]["value"] == 1
    assert pending.json()["quality"]["range_values"]["value"] == 1
    assert pending.json()["quality"]["reviewed"] is False
    malformed = client.patch(f"/api/v1/scientific-datasets/{pending.json()['id']}", json={"parameters": {"quality_review": {"reviewed": True, "handling_policy": None}}})
    assert malformed.status_code == 422
    assert client.get(f"/api/v1/scientific-datasets/{pending.json()['id']}").status_code == 200
    reviewed = client.patch(f"/api/v1/scientific-datasets/{pending.json()['id']}", json={"parameters": {"row_column_complete": True, "unit_complete": True, "quality_review": {"reviewed": True, "handling_policy": "exclude_missing_and_non_numeric"}}, "confirmed": True})
    assert reviewed.status_code == 200
    assert reviewed.json()["confirmation_status"] == "confirmed"


def test_table_statistics_reports_exclusions_and_original_rows():
    result = get_recipe("generic.table_statistics").run({"material": ["A", "B", "C", "D", "E"], "value": [10, None, "12-14", 14, True]}, {}, {})
    value = result["columns"]["value"]
    assert value["count"] == 2
    assert value["mean"] == 12
    assert value["missing_count"] == 1
    assert value["range_count"] == 1
    assert value["invalid_count"] == 1
    assert value["excluded_count"] == 3
    assert result["columns"]["material"]["status"] == "skipped"
    extra = get_recipe("generic.table_statistics").run({"x": [100, None, 100, 101, 100, 101, 102, 1000]}, {}, {})["columns"]["x"]
    assert 7 in extra["outlier_indices"]


def test_dataset_edits_export_and_rerun_compute_from_csv(client, tmp_path):
    imported = _dataset(client)
    saved = client.post(f"/api/v1/scientific-imports/{imported['id']}/confirm", json={"name": "measure", "domain": "generic", "dataset_type": "table", "units": {"value": "kJ"}, "parameters": {"row_column_complete": True, "unit_complete": True, "quality_review": {"reviewed": True, "handling_policy": "exclude_missing_and_non_numeric"}}}).json()
    dataset_id = saved["id"]
    assert client.get(f"/api/v1/scientific-datasets/{dataset_id}").json()["data"]["value"] == [10, None, "12-14", 14]
    analysis = client.post(f"/api/v1/scientific-datasets/{dataset_id}/analyses", json={"recipe": "generic.table_statistics"})
    assert analysis.status_code == 201
    analysis_id = analysis.json()["id"]
    assert any(item["id"] == analysis_id for item in client.get(f"/api/v1/scientific-datasets/{dataset_id}/analyses").json())
    exported = client.post("/api/v1/research-exports", json={"title": "研究证据", "dataset_ids": [dataset_id], "analysis_ids": [analysis_id]})
    assert exported.status_code == 201
    assert "12-14" in exported.json()["markdown"]
    assert "kJ" in exported.json()["markdown"]
    assert "有效 n=2/4" in exported.json()["markdown"]
    assert client.get(f"/api/v1/research-exports/{exported.json()['id']}/download").status_code == 200
    archive_response = client.get(f"/api/v1/scientific-analyses/{analysis_id}/export")
    assert archive_response.status_code == 200
    with zipfile.ZipFile(io.BytesIO(archive_response.content)) as archive:
        archive.extractall(tmp_path)
    data = (tmp_path / "data.csv").read_text(encoding="utf-8-sig").replace("D,14", "D,100")
    (tmp_path / "data.csv").write_text(data, encoding="utf-8-sig")
    subprocess.run([sys.executable, "rerun.py"], cwd=tmp_path, check=True, capture_output=True)
    recomputed = json.loads((tmp_path / "recomputed_results.json").read_text(encoding="utf-8"))
    assert recomputed["columns"]["value"]["mean"] == 55


def test_idea_and_design_patch_restore_and_clear_review(client):
    idea = client.post("/api/v1/research-ideas", json={"title": "old", "hypothesis": "old"}).json()
    edited = client.patch(f"/api/v1/research-ideas/{idea['id']}", json={"title": "new", "hypothesis": "changed", "evidence_gaps": "需要重复实验"})
    assert edited.status_code == 200
    design = client.post("/api/v1/experiment-designs", json={"idea_id": idea["id"], "title": "design"}).json()
    review = client.post(f"/api/v1/experiment-designs/{design['id']}/review")
    assert review.status_code == 200
    changed = client.patch(f"/api/v1/experiment-designs/{design['id']}", json={"replication": "三次独立重复"})
    assert changed.status_code == 200
    assert changed.json()["ai_review"] == ""
    assert client.get(f"/api/v1/experiment-designs/{design['id']}").json()["replication"] == "三次独立重复"
    assert any(item["id"] == design["id"] for item in client.get(f"/api/v1/experiment-designs?idea_id={idea['id']}").json())
    assert client.patch(f"/api/v1/experiment-designs/{design['id']}", json={"controls": None}).status_code == 422
    assert client.patch(f"/api/v1/research-ideas/{idea['id']}", json={"title": None}).status_code == 422
    assert client.patch(f"/api/v1/research-ideas/{idea['id']}", json={"paper_ids": None}).status_code == 422


def test_model_prompts_include_only_selected_grounded_evidence(client, monkeypatch):
    from app.routers import research_assistance
    prompts = []
    class FakeProvider:
        def generate_structured_task(self, prompt, task_type, *, max_tokens=None):
            prompts.append((prompt, task_type, max_tokens))
            if task_type == "research_idea":
                return SimpleNamespace(data={"title": "candidate", "hypothesis": "testable", "evidence": "data", "novelty": "boundary", "falsification": "measure", "feasibility": "possible", "resources": "lab", "evidence_gaps": "repeat"})
            return SimpleNamespace(data={"review": "需增加重复"})
    monkeypatch.setattr(research_assistance, "_provider", lambda db: FakeProvider())
    with Session(client.app.state.engine) as db:
        paper = Paper(title="Selected paper", file_size=0, abstract="Observed thermal behavior", doi="10.example/test")
        other = Paper(title="Excluded paper", file_size=0, abstract="Do not include")
        db.add_all([paper, other]); db.commit()
        paper_id = paper.id
    imported = _dataset(client)
    dataset = client.post(f"/api/v1/scientific-imports/{imported['id']}/confirm", json={"name": "Selected data", "domain": "generic", "dataset_type": "table", "units": {"value": "kJ"}, "parameters": {"source_reference": "10.example/table", "data_origin": "literature_summary", "row_column_complete": True, "unit_complete": True, "quality_review": {"reviewed": True, "handling_policy": "exclude_missing_and_non_numeric"}}}).json()
    candidate = client.post("/api/v1/research-ideas/generate", json={"paper_ids": [paper_id], "dataset_ids": [dataset["id"]]})
    assert candidate.status_code == 201
    prompt = prompts[-1][0]
    assert "JSON" in prompt and "evidence_gaps" in prompt
    assert prompts[-1][2] == 3200
    assert f"[D{dataset['id']}:r3,cvalue]" in prompt
    assert "12-14" in prompt and "10.example/table" in prompt and "kJ" in prompt
    assert "[P" in prompt and "Observed thermal behavior" in prompt
    assert "Do not include" not in prompt
    design = client.post("/api/v1/experiment-designs", json={"idea_id": candidate.json()["id"], "title": "Test design", "controls": "same conditions"}).json()
    assert client.post(f"/api/v1/experiment-designs/{design['id']}/review").status_code == 200
    assert prompts[-1][2] == 1600
    assert "same conditions" in prompts[-1][0] and "testable" in prompts[-1][0] and "12-14" in prompts[-1][0]
    assert client.patch(f"/api/v1/experiment-designs/{design['id']}", json={"controls": "same conditions"}).json()["ai_review"] == "需增加重复"
    assert client.patch(f"/api/v1/research-ideas/{candidate.json()['id']}", json={"hypothesis": "changed"}).status_code == 200
    assert client.get(f"/api/v1/experiment-designs/{design['id']}").json()["ai_review"] == ""


def test_legacy_confirmed_import_without_review_cannot_analyze(client):
    from app.models import ScientificDataset
    imported = _dataset(client)
    dataset = client.post(f"/api/v1/scientific-imports/{imported['id']}/confirm", json={"name": "legacy", "domain": "generic", "dataset_type": "table", "units": {}, "parameters": {"row_column_complete": True, "unit_complete": True, "cells_complete": True}}).json()
    with Session(client.app.state.engine) as db:
        item = db.get(ScientificDataset, dataset["id"])
        item.confirmation_status = "confirmed"
        db.commit()
    response = client.post(f"/api/v1/scientific-datasets/{dataset['id']}/analyses", json={"recipe": "generic.table_statistics", "parameters": {"quality_review": {"reviewed": True, "handling_policy": "exclude_missing_and_non_numeric"}}})
    assert response.status_code == 409


def test_research_model_error_identifies_upstream_json_400():
    from app.providers import ModelProviderError
    from app.routers.research_assistance import _research_model_error
    request = httpx.Request("POST", "https://example.invalid/chat")
    response = httpx.Response(400, request=request)
    try:
        raise ModelProviderError("学习内容生成失败") from httpx.HTTPStatusError("bad request", request=request, response=response)
    except ModelProviderError as exc:
        error = _research_model_error(exc)
    assert error.status_code == 502
    assert "HTTP 400" in error.detail and "JSON" in error.detail


def test_deepseek_research_task_uses_small_non_thinking_json_budget(monkeypatch):
    from app.providers import DeepSeekProvider
    requests = []
    def fake_post(url, *, json, **kwargs):
        requests.append(json)
        request = httpx.Request("POST", url)
        return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": {"content": '{"title":"x"}'}}]}, request=request)
    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    provider = DeepSeekProvider("test-key", "", "deepseek-flash", 30)
    provider.generate_structured_task("Return JSON", "research_idea", max_tokens=3200)
    assert requests[0]["response_format"] == {"type": "json_object"}
    assert requests[0]["thinking"] == {"type": "disabled"}
    assert requests[0]["max_tokens"] == 3200


def test_pptx_uses_sectioned_compact_source_without_changing_markdown(client, monkeypatch):
    from app.routers import research_assistance
    calls = []
    monkeypatch.setattr(research_assistance.shutil, "which", lambda name: "pandoc")
    def fake_run(args, **kwargs):
        calls.append((args, Path(args[1]).read_text(encoding="utf-8")))
        Path(args[args.index("-o") + 1]).write_bytes(b"pptx-fixture")
        return SimpleNamespace(returncode=0)
    monkeypatch.setattr(research_assistance.subprocess, "run", fake_run)
    imported = _dataset(client)
    dataset = client.post(f"/api/v1/scientific-imports/{imported['id']}/confirm", json={"name": "thermal data", "domain": "generic", "dataset_type": "table", "units": {"value": "kJ"}, "parameters": {"source_reference": "Table 2 DOI 10.example", "row_column_complete": True, "unit_complete": True, "quality_review": {"reviewed": True, "handling_policy": "exclude_missing_and_non_numeric"}}}).json()
    analysis = client.post(f"/api/v1/scientific-datasets/{dataset['id']}/analyses", json={"recipe": "generic.unit_check"}).json()
    response = client.post("/api/v1/research-exports", json={"title": "Thermal brief", "export_type": "pptx", "dataset_ids": [dataset["id"]], "analysis_ids": [analysis["id"]]})
    assert response.status_code == 201
    args, slides = calls[0]
    assert "--slide-level=2" in args
    assert slides.count("\n## ") >= 4
    assert "DOI 10.example" in slides and "n=2/4" in slides
    assert f"[D{dataset['id']}:r1,cvalue]" not in slides
    assert "```json" not in slides
    assert "结构化结果 1 项；完整数值见" in slides
    assert f"[D{dataset['id']}:r1,cvalue]" in response.json()["markdown"]
