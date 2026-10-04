from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'candidates.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("DOCUMENT_AI_MODEL_PATH", str(tmp_path / "models"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("EMBEDDING_PROVIDER", "mock")
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def _paper(client: TestClient, tmp_path: Path) -> int:
    from app.models import Paper

    path = tmp_path / "papers" / "paper.pdf"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"%PDF-1.4\n% candidate fixture")
    with client.app.state.session_factory() as db:
        paper = Paper(
            title="Candidate paper",
            original_filename="paper.pdf",
            file_path=str(path),
            file_hash="a" * 64,
            file_size=path.stat().st_size,
            page_count=1,
            extracted_text="old active text",
            parse_confidence=0.5,
            fulltext_status="已读取全文",
        )
        db.add(paper)
        db.commit()
        db.refresh(paper)
        return paper.id


def _fake_parser():
    from app.document_parsers import (
        FakeDocumentParser,
        ParsedDocument,
        ParsedElement,
        ParsedPage,
    )

    return FakeDocumentParser(
        ParsedDocument(
            pages=(
                ParsedPage(
                    page_number=1,
                    width=600,
                    height=800,
                    text="new candidate evidence",
                    elements=(
                        ParsedElement(
                            element_id="docling-1-1",
                            page_number=1,
                            text="new candidate evidence",
                            label="text",
                            left=10,
                            top=20,
                            right=300,
                            bottom=60,
                        ),
                        ParsedElement(
                            element_id="docling-1-2",
                            page_number=1,
                            text="capacity table",
                            label="table",
                            left=10,
                            top=80,
                            right=300,
                            bottom=180,
                        ),
                        ParsedElement(
                            element_id="docling-1-3",
                            page_number=1,
                            text="E = mc2",
                            label="formula",
                            left=10,
                            top=200,
                            right=300,
                            bottom=240,
                        ),
                        ParsedElement(
                            element_id="docling-1-4",
                            page_number=1,
                            text="Figure 1",
                            label="picture",
                            left=10,
                            top=260,
                            right=300,
                            bottom=420,
                        ),
                    ),
                ),
            ),
            full_text="new candidate evidence",
        )
    )


def test_candidate_requires_confirmation_and_never_activates_implicitly(
    client: TestClient, tmp_path: Path
) -> None:
    from app.models import Paper

    paper_id = _paper(client, tmp_path)
    parser = _fake_parser()
    client.app.state.document_ai_manager.set_candidate_parser(parser, version="2.123.1")

    denied = client.post(
        f"/api/v1/papers/{paper_id}/parse-candidates",
        json={"confirmed": False},
    )
    assert denied.status_code == 422
    assert parser.calls == []

    accepted = client.post(
        f"/api/v1/papers/{paper_id}/parse-candidates",
        json={"confirmed": True},
    )
    assert accepted.status_code == 202
    run_id = accepted.json()["id"]
    run = client.get(f"/api/v1/parse-candidates/{run_id}")
    assert run.status_code == 200
    assert run.json()["status"] == "completed"
    assert run.json()["engine"] == "docling"
    assert run.json()["engine_version"] == "2.123.1"
    assert run.json()["pages"][0]["page_width"] == 600

    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        assert paper is not None
        assert paper.active_parse_run_id is None
        assert paper.extracted_text == "old active text"


def test_candidate_status_list_and_comparison_are_neutral(
    client: TestClient, tmp_path: Path
) -> None:
    paper_id = _paper(client, tmp_path)
    client.app.state.document_ai_manager.set_candidate_parser(
        _fake_parser(), version="2.123.1"
    )

    status = client.get("/api/v1/document-parsers/status")
    assert status.status_code == 200
    assert status.json()["docling"]["ready"] is True

    created = client.post(
        f"/api/v1/papers/{paper_id}/parse-candidates",
        json={"confirmed": True},
    ).json()
    items = client.get(f"/api/v1/papers/{paper_id}/parse-candidates").json()["items"]
    assert [item["id"] for item in items] == [created["id"]]

    comparison = client.get(
        f"/api/v1/parse-candidates/{created['id']}/comparison"
    )
    assert comparison.status_code == 200
    payload = comparison.json()
    assert payload["candidate"]["characters"] == len("new candidate evidence")
    assert payload["active"]["characters"] == len("old active text")
    assert payload["candidate"]["tables"] == 1
    assert payload["candidate"]["formulas"] == 1
    assert payload["candidate"]["figures"] == 1
    assert payload["candidate"]["duration_seconds"] is not None
    assert payload["active"]["duration_seconds"] is None
    assert "better" not in comparison.text.lower()
    assert "更好" not in comparison.text


def test_candidate_cancel_and_failure_leave_active_paper_unchanged(
    client: TestClient, tmp_path: Path
) -> None:
    from app.models import Paper, PaperParseRun

    paper_id = _paper(client, tmp_path)
    with client.app.state.session_factory() as db:
        run = PaperParseRun(
            paper_id=paper_id,
            version_number=1,
            mode="candidate",
            status="queued",
            engine="docling",
            engine_version="2.123.1",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        run_id = run.id

    cancelled = client.post(f"/api/v1/parse-candidates/{run_id}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        run = db.get(PaperParseRun, run_id)
        assert paper is not None and run is not None
        assert paper.extracted_text == "old active text"
        assert paper.active_parse_run_id is None
        assert run.status == "cancelled"


def test_candidate_activation_requires_confirmation_and_switches_atomically(
    client: TestClient, tmp_path: Path
) -> None:
    from app.models import (
        Analysis,
        Note,
        Paper,
        PaperChunk,
        PaperParseRun,
        ScientificDataset,
    )

    paper_id = _paper(client, tmp_path)
    client.app.state.document_ai_manager.set_candidate_parser(
        _fake_parser(), version="2.123.1"
    )
    run_id = client.post(
        f"/api/v1/papers/{paper_id}/parse-candidates",
        json={"confirmed": True},
    ).json()["id"]
    with client.app.state.session_factory() as db:
        db.add(
            PaperChunk(
                paper_id=paper_id,
                page_number=1,
                chunk_index=0,
                section="old",
                content="old active text",
                content_hash="b" * 64,
                source_scope="fulltext",
                parse_confidence=0.5,
                embedding_json="[1.0]",
                embedding_model="old-model",
            )
        )
        db.add(
            Analysis(
                paper_id=paper_id,
                summary="summary",
                plain_explanation="plain",
                deep_analysis="deep",
                evidence_status="全文证据",
                provider="mock",
                model_name="mock",
            )
        )
        db.add(
            ScientificDataset(
                paper_id=paper_id,
                source_type="paper",
                domain="electrochemistry",
                dataset_type="table",
            )
        )
        db.add(Note(paper_id=paper_id, content="user note evidence"))
        db.commit()

    denied = client.post(
        f"/api/v1/parse-candidates/{run_id}/activate",
        json={"confirmed": False},
    )
    assert denied.status_code == 422

    bypassed = client.post(
        f"/api/v1/parse-candidates/{run_id}/activate",
        json={"confirmed": True},
    )
    assert bypassed.status_code == 409
    assert "查看解析对比" in bypassed.json()["detail"]

    compared = client.get(f"/api/v1/parse-candidates/{run_id}/comparison")
    assert compared.status_code == 200

    with client.app.state.session_factory() as db:
        active_run = PaperParseRun(
            paper_id=paper_id,
            version_number=2,
            mode="auto",
            status="completed",
            engine="pymupdf+pp-structurev3",
        )
        db.add(active_run)
        db.flush()
        paper = db.get(Paper, paper_id)
        assert paper is not None
        paper.active_parse_run_id = active_run.id
        db.commit()

    stale_comparison = client.post(
        f"/api/v1/parse-candidates/{run_id}/activate",
        json={"confirmed": True},
    )
    assert stale_comparison.status_code == 409
    assert "当前解析版本已变化" in stale_comparison.json()["detail"]

    compared_again = client.get(f"/api/v1/parse-candidates/{run_id}/comparison")
    assert compared_again.status_code == 200

    activated = client.post(
        f"/api/v1/parse-candidates/{run_id}/activate",
        json={"confirmed": True},
    )
    assert activated.status_code == 200

    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        chunks = list(db.query(PaperChunk).filter_by(paper_id=paper_id))
        analysis = db.query(Analysis).filter_by(paper_id=paper_id).one()
        dataset = db.query(ScientificDataset).filter_by(paper_id=paper_id).one()
        assert paper is not None
        assert paper.active_parse_run_id == run_id
        assert paper.extracted_text == "new candidate evidence"
        assert chunks
        fulltext_chunks = [chunk for chunk in chunks if chunk.source_scope == "fulltext"]
        note_chunks = [chunk for chunk in chunks if chunk.source_scope == "note"]
        assert fulltext_chunks and all(chunk.parse_run_id == run_id for chunk in fulltext_chunks)
        assert [chunk.content for chunk in note_chunks] == ["user note evidence"]
        assert all(chunk.parse_run_id is None for chunk in note_chunks)
        assert all(chunk.source_locations_json == "[]" for chunk in note_chunks)
        assert all(
            chunk.source_locations_json != "[]"
            for chunk in chunks
            if chunk.source_scope == "fulltext"
        )
        assert analysis.is_stale is True
        assert dataset.is_stale is True

    answer = client.post(
        f"/api/v1/papers/{paper_id}/knowledge/ask",
        json={"question": "What capacity was measured?", "max_citations": 4},
    )
    assert answer.status_code == 200
    assert answer.json()["citations"][0]["source_locations"][0][
        "element_id"
    ] == "docling-1-1"


def test_candidate_activation_rolls_back_when_embedding_fails(
    client: TestClient, tmp_path: Path
) -> None:
    from app.knowledge import EmbeddingProviderError
    from app.models import Paper, PaperChunk

    paper_id = _paper(client, tmp_path)
    client.app.state.document_ai_manager.set_candidate_parser(
        _fake_parser(), version="2.123.1"
    )
    run_id = client.post(
        f"/api/v1/papers/{paper_id}/parse-candidates",
        json={"confirmed": True},
    ).json()["id"]
    with client.app.state.session_factory() as db:
        db.add(
            PaperChunk(
                paper_id=paper_id,
                page_number=1,
                chunk_index=0,
                section="old",
                content="old active text",
                content_hash="c" * 64,
                source_scope="fulltext",
                parse_confidence=0.5,
                embedding_json="[1.0]",
                embedding_model="old-model",
            )
        )
        db.commit()

    class FailingEmbeddingProvider:
        name = "fake"
        model_name = "fake"

        def test_connection(self):
            return True, "ready"

        def embed(self, _texts):
            raise EmbeddingProviderError("injected embedding failure")

    client.app.state.embedding_provider_factory = (
        lambda *_args: FailingEmbeddingProvider()
    )
    comparison = client.get(f"/api/v1/parse-candidates/{run_id}/comparison")
    assert comparison.status_code == 200
    response = client.post(
        f"/api/v1/parse-candidates/{run_id}/activate",
        json={"confirmed": True},
    )
    assert response.status_code == 503

    with client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        chunks = list(db.query(PaperChunk).filter_by(paper_id=paper_id))
        assert paper is not None
        assert paper.active_parse_run_id is None
        assert paper.extracted_text == "old active text"
        assert [chunk.content for chunk in chunks] == ["old active text"]
