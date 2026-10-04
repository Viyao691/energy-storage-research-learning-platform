from __future__ import annotations

import hashlib
from pathlib import Path

import fitz
import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'ocr.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def _mixed_pdf(path: Path) -> str:
    document = fitz.open()
    native = document.new_page()
    native.insert_textbox(
        fitz.Rect(50, 50, 540, 250),
        "A complete native scientific text layer. " * 12,
        fontsize=11,
    )
    document.new_page()
    document.save(path)
    document.close()
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _create_paper(client: TestClient, path: Path, digest: str):
    from app.models import Paper

    with client.app.state.session_factory() as db:
        paper = Paper(
            title="mixed",
            original_filename="mixed.pdf",
            file_path=str(path),
            file_hash=digest,
            file_size=path.stat().st_size,
            page_count=2,
            extracted_text="old active parse",
            parse_confidence=0.4,
            fulltext_status="已读取全文",
        )
        db.add(paper)
        db.commit()
        db.refresh(paper)
        return paper.id


def test_page_quality_routes_only_low_quality_pages_to_ocr() -> None:
    from app.document_ai import assess_native_page

    assert assess_native_page("Normal scientific paragraph. " * 10, []) ["needs_ocr"] is False
    assert assess_native_page("", [])["needs_ocr"] is True
    assert assess_native_page("����" * 20, [])["needs_ocr"] is True


def test_auto_ocr_preserves_original_and_atomically_activates_searchable_derivative(
    client: TestClient, tmp_path: Path
) -> None:
    pdf_path = tmp_path / "papers" / "mixed.pdf"
    pdf_path.parent.mkdir(exist_ok=True)
    original_hash = _mixed_pdf(pdf_path)
    paper_id = _create_paper(client, pdf_path, original_hash)
    calls: list[int] = []

    def fake_ocr(_png: bytes, page_number: int):
        calls.append(page_number)
        return {
            "text": "OCR recovered scan text with electrochemical values.",
            "confidence": 0.96,
            "blocks": [{"bbox": [50, 50, 500, 120], "text": "OCR recovered scan text"}],
            "tables": [],
            "formulas": [],
            "figures": [],
        }

    client.app.state.document_ai_manager.ocr_page = fake_ocr
    response = client.post(f"/api/v1/papers/{paper_id}/ocr-runs", json={"mode": "auto"})
    assert response.status_code == 202
    run = client.get(f"/api/v1/ocr-runs/{response.json()['id']}").json()
    assert run["status"] == "completed"
    assert calls == [2]
    assert hashlib.sha256(pdf_path.read_bytes()).hexdigest() == original_hash
    assert Path(run["derivative_file_path"]).exists()
    with fitz.open(run["derivative_file_path"]) as derived:
        assert "OCR recovered scan text" in derived[1].get_text()

    ocr_file = client.get(f"/api/v1/papers/{paper_id}/file?variant=ocr")
    assert ocr_file.status_code == 200
    assert ocr_file.headers["content-type"] == "application/pdf"


def test_cloud_enhancement_requires_consent_and_sends_only_one_page(client: TestClient, tmp_path: Path) -> None:
    pdf_path = tmp_path / "papers" / "cloud.pdf"
    pdf_path.parent.mkdir(exist_ok=True)
    digest = _mixed_pdf(pdf_path)
    paper_id = _create_paper(client, pdf_path, digest)
    calls: list[dict[str, object]] = []

    def fake_cloud(**payload):
        calls.append(payload)
        return {"text": "enhanced page", "confidence": 0.9, "layout": []}

    client.app.state.document_ai_manager.cloud_enhance = fake_cloud
    denied = client.post(
        f"/api/v1/papers/{paper_id}/pages/2/cloud-enhance",
        json={"confirmed": False},
    )
    assert denied.status_code == 422
    assert calls == []

    accepted = client.post(
        f"/api/v1/papers/{paper_id}/pages/2/cloud-enhance",
        json={"confirmed": True},
    )
    assert accepted.status_code == 200
    assert accepted.json()["confirmation_status"] == "pending"
    assert len(calls) == 1
    assert calls[0]["page_number"] == 2
    assert "document_bytes" not in calls[0]
