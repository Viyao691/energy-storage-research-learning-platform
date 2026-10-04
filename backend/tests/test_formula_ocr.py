import subprocess
import pytest
from test_knowledge_api import client, _upload


def test_missing_models_do_not_start_worker(tmp_path, monkeypatch):
    from app.formula_ocr import transcribe_formula, FormulaOcrError
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: pytest.fail("must not start"))
    with pytest.raises(FormulaOcrError, match="模型"):
        transcribe_formula(b"png", tmp_path)


def test_timeout_is_bounded_and_offline(tmp_path, monkeypatch):
    from app.formula_ocr import transcribe_formula, FormulaOcrError, MODEL_FOLDER
    model = tmp_path / MODEL_FOLDER
    model.mkdir()
    for name in ("model.safetensors", "config.json", "tokenizer.json", "preprocessor_config.json", "tokenizer_config.json"):
        (model / name).write_text("fixture")
    def timeout(*args, **kwargs):
        assert kwargs["timeout"] == 180
        assert kwargs["env"]["HF_HUB_OFFLINE"] == "1"
        raise subprocess.TimeoutExpired("worker", 180)
    monkeypatch.setattr(subprocess, "run", timeout)
    with pytest.raises(FormulaOcrError, match="超时"):
        transcribe_formula(b"png", tmp_path)


def test_formula_api_returns_authoritative_source_without_overwriting_crop(client, monkeypatch):
    from app.models import PaperVisual, PaperVisualCrop
    from app.routers import papers
    paper = _upload(client)
    with client.app.state.session_factory() as db:
        visual = PaperVisual(paper_id=paper["id"], page_number=1, kind="figure", label="Fig 1", caption="test")
        db.add(visual)
        db.flush()
        crop = PaperVisualCrop(paper_id=paper["id"], visual_id=visual.id,
                              left=0.1, top=0.1, width=0.3, height=0.2,
                              analysis_markdown="keep original")
        db.add(crop)
        db.commit()
        crop_id = crop.id
    monkeypatch.setattr(papers, "transcribe_formula", lambda png, path: r"Q=\frac{It}{m}")
    response = client.post(f"/api/v1/crops/{crop_id}/transcribe-formula")
    assert response.status_code == 200
    assert response.json()["paper_id"] == paper["id"]
    assert response.json()["page_number"] == 1
    assert "未经人工核验" in response.json()["evidence_status"]
    with client.app.state.session_factory() as db:
        assert db.get(PaperVisualCrop, crop_id).analysis_markdown == "keep original"
    assert client.get(f"/api/v1/papers/{paper['id']}").json()["note"] == ""
    assert client.post("/api/v1/crops/99999/transcribe-formula").status_code == 404
    def unavailable(*args):
        raise papers.FormulaOcrError("本地公式模型尚未准备")
    monkeypatch.setattr(papers, "transcribe_formula", unavailable)
    assert client.post(f"/api/v1/crops/{crop_id}/transcribe-formula").status_code == 409


def test_worker_success_cleans_temporary_files(tmp_path, monkeypatch):
    from pathlib import Path
    from app.formula_ocr import transcribe_formula, MODEL_FOLDER, _gate, FormulaOcrError
    model = tmp_path / MODEL_FOLDER
    model.mkdir()
    for name in ("model.safetensors", "config.json", "tokenizer.json", "preprocessor_config.json", "tokenizer_config.json"):
        (model / name).write_text("fixture")
    inputs = []
    def succeed(command, **kwargs):
        inputs.append(Path(command[3]))
        Path(command[4]).write_text(r"Q=\frac{It}{m}", encoding="utf-8")
    monkeypatch.setattr(subprocess, "run", succeed)
    assert transcribe_formula(b"png", tmp_path) == r"Q=\frac{It}{m}"
    assert not inputs[0].exists()
    _gate.acquire()
    try:
        with pytest.raises(FormulaOcrError, match="已有公式"):
            transcribe_formula(b"png", tmp_path)
    finally:
        _gate.release()
