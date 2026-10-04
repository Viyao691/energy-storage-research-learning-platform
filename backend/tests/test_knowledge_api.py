from __future__ import annotations

import io
from pathlib import Path

import fitz
import pytest
from fastapi.testclient import TestClient
from app.paper_sources.base import SearchFilters, SourcePaper, SourceStatus


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'knowledge.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("EMBEDDING_PROVIDER", "mock")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)

    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def _two_page_pdf() -> bytes:
    document = fitz.open()
    try:
        first = document.new_page()
        first.insert_text(
            (72, 72),
            (
                "Introduction\n"
                "P2 sodium layered oxide cathodes show reversible sodium storage. "
                "Slab gliding can cause structural degradation during high-voltage cycling."
            ),
        )
        second = document.new_page()
        second.insert_text(
            (72, 72),
            (
                "Experimental\n"
                "The material was assembled in sodium half cells and tested by XRD."
            ),
        )
        return document.tobytes()
    finally:
        document.close()


def _upload(client: TestClient) -> dict[str, object]:
    response = client.post(
        "/api/v1/papers/upload",
        files={
            "file": (
                "P2 layered oxide.pdf",
                io.BytesIO(_two_page_pdf()),
                "application/pdf",
            )
        },
    )
    assert response.status_code == 201
    return response.json()


def test_reindex_and_mock_question_return_database_backed_page_citations(
    client: TestClient,
) -> None:
    uploaded = _upload(client)

    before = client.get("/api/v1/knowledge/status")
    indexed = client.post("/api/v1/knowledge/reindex")
    answer = client.post(
        "/api/v1/knowledge/ask",
        json={"question": "P2型钠层状氧化物为什么会发生结构衰减？", "max_citations": 4},
    )

    assert before.status_code == 200
    assert before.json()["total_papers"] == 1
    assert before.json()["indexed_papers"] == 0
    assert before.json()["stale_papers"] == 1

    assert indexed.status_code == 200
    assert indexed.json()["indexed_papers"] == 1
    assert indexed.json()["indexed_chunks"] >= 2
    assert indexed.json()["embedding_provider"] == "mock"

    assert answer.status_code == 200
    payload = answer.json()
    assert payload["evidence_status"] == "AI归纳（Mock 论文库问答演示）"
    assert "[证据1]" in payload["answer_markdown"]
    assert payload["citations"]
    citation = payload["citations"][0]
    assert citation["paper_id"] == uploaded["id"]
    assert citation["paper_title"] == "P2 layered oxide"
    assert citation["page_number"] == 1
    assert citation["source_scope"] == "fulltext"
    assert citation["parse_confidence"] == uploaded["parse_confidence"]
    assert "Slab gliding" in citation["excerpt"]
    assert citation["similarity"] >= 0
    assert payload["confidence"]["level"] in {"低", "中", "高"}
    assert "全文" in payload["confidence"]["explanation"]


def test_abstract_citation_never_invents_a_page_number(client: TestClient) -> None:
    from app.models import Paper

    with client.app.state.session_factory() as db:
        paper = Paper(
            title="Abstract-only Prussian blue paper",
            file_size=0,
            page_count=0,
            extracted_text="",
            abstract=(
                "Prussian blue analogues contain vacancies that influence water "
                "content and sodium-ion cycling stability."
            ),
            parse_confidence=0.0,
            fulltext_status="仅摘要",
            acquisition_status="abstract_only",
        )
        db.add(paper)
        db.commit()

    assert client.post("/api/v1/knowledge/reindex").status_code == 200
    response = client.post(
        "/api/v1/knowledge/ask",
        json={"question": "普鲁士蓝中的空位有什么影响？"},
    )

    assert response.status_code == 200
    citation = response.json()["citations"][0]
    assert citation["source_scope"] == "abstract"
    assert citation["page_number"] is None
    assert citation["section"] == "摘要"


def test_question_filters_model_generated_out_of_range_citation(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import KnowledgeAnswerResult
    import app.routers.knowledge as main_module

    _upload(client)
    assert client.post("/api/v1/knowledge/reindex").status_code == 200

    class UnsafeCitationProvider:
        name = "test"

        def answer_question(self, question: str, contexts: list[object]):
            return KnowledgeAnswerResult(
                "模型声称存在结论 [证据99]，同时引用了有效来源 [证据1]。",
                "AI归纳（待原文证据核验）",
                "unsafe-test-model",
            )

    monkeypatch.setattr(
        main_module,
        "make_provider",
        lambda *_args, **_kwargs: UnsafeCitationProvider(),
    )

    response = client.post(
        "/api/v1/knowledge/ask",
        json={"question": "结构稳定性的证据是什么？"},
    )

    assert response.status_code == 200
    assert "[证据99]" not in response.json()["answer_markdown"]
    assert "[无法核验的引用]" in response.json()["answer_markdown"]


def test_external_compare_uses_public_abstracts_without_importing_them(
    client: TestClient,
) -> None:
    uploaded = _upload(client)

    class ExternalSource:
        name = "openalex"

        async def search(self, query: str, filters: SearchFilters) -> list[SourcePaper]:
            assert "P2 layered oxide" in query
            assert filters.limit == 3
            return [
                SourcePaper(
                    source="openalex",
                    external_id="W-external",
                    title="External layered oxide study",
                    normalized_title="external layered oxide study",
                    authors=("External Author",),
                    first_author="External Author",
                    abstract="The external abstract reports improved cycling stability.",
                    doi="10.1000/external",
                    arxiv_id=None,
                    journal="External Journal",
                    published_date="2026-01-01",
                    year=2026,
                    keywords=("layered oxide",),
                    landing_url="https://example.test/external",
                    pdf_url=None,
                    is_open_access=False,
                    oa_status="unknown",
                    license=None,
                )
            ]

        async def get_by_id(self, _external_id: str) -> SourcePaper:
            raise AssertionError("external comparison must not import a paper")

        async def healthcheck(self) -> SourceStatus:
            return SourceStatus(enabled=True, ok=True, message="ok")

    client.app.state.paper_source_builder = lambda _settings, _http: [ExternalSource()]
    response = client.post(
        f"/api/v1/papers/{uploaded['id']}/external-compare",
        json={"question": "外部研究如何比较循环稳定性？"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["current_paper"]["paper_id"] == uploaded["id"]
    assert payload["external_papers"][0]["title"] == "External layered oxide study"
    assert payload["external_papers"][0]["evidence_basis"] == "外部来源摘要/元数据，待原文核验"
    assert payload["evidence_status"] == "AI推断（Mock 演示）"
    assert "[证据1]" in response.json()["answer_markdown"]


def test_question_requires_an_index_and_rejects_oversized_input(
    client: TestClient,
) -> None:
    _upload(client)

    missing = client.post(
        "/api/v1/knowledge/ask",
        json={"question": "尚未建立索引时会怎样？"},
    )
    oversized = client.post(
        "/api/v1/knowledge/ask",
        json={"question": "问" * 501},
    )

    assert missing.status_code == 409
    assert "建立或更新索引" in missing.json()["detail"]
    assert oversized.status_code == 422


def test_question_rejects_more_than_four_history_turns(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/knowledge/ask",
        json={
            "question": "继续解释这个结论。",
            "history": [
                {
                    "question": f"问题{i}",
                    "answer_markdown": f"回答{i}",
                }
                for i in range(5)
            ],
        },
    )

    assert response.status_code == 422


def test_follow_up_retrieves_current_question_and_sends_history_to_model(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import app.routers.knowledge as main_module
    from app.providers import KnowledgeAnswerResult

    _upload(client)
    assert client.post("/api/v1/knowledge/reindex").status_code == 200
    original_retrieve = main_module.retrieve_chunks
    observed: dict[str, str] = {}

    def capture_retrieve(db, question, provider, limit):
        observed["retrieval_question"] = question
        return original_retrieve(db, question, provider, limit=limit)

    class CapturingProvider:
        name = "capture"

        def answer_question(self, question: str, contexts: list[object]):
            observed["model_question"] = question
            return KnowledgeAnswerResult(
                "追问回答 [证据1]",
                "AI归纳（待原文证据核验）",
                "capture-model",
            )

    monkeypatch.setattr(main_module, "retrieve_chunks", capture_retrieve)
    monkeypatch.setattr(
        main_module,
        "make_provider",
        lambda *_args, **_kwargs: CapturingProvider(),
    )

    response = client.post(
        "/api/v1/knowledge/ask",
        json={
            "question": "为什么这能支持上一轮结论？",
            "history": [
                {
                    "question": "层间滑移有什么影响？",
                    "answer_markdown": "上一轮认为会导致结构衰减。[证据1]",
                }
            ],
        },
    )

    assert response.status_code == 200
    assert observed["retrieval_question"] == "为什么这能支持上一轮结论？"
    assert "层间滑移有什么影响？" in observed["model_question"]
    assert "上一轮认为会导致结构衰减" in observed["model_question"]
    assert "为什么这能支持上一轮结论？" in observed["model_question"]
    assert response.json()["question"] == "为什么这能支持上一轮结论？"


def test_note_is_searchable_but_never_labeled_as_paper_evidence(
    client: TestClient,
) -> None:
    uploaded = _upload(client)
    paper_id = uploaded["id"]
    saved = client.put(
        f"/api/v1/papers/{paper_id}/note",
        json={"content": "我的假设：钠空位可能改善循环稳定性，尚未由论文证明。"},
    )
    assert saved.status_code == 200
    assert "需要更新" in saved.json()["message"]
    assert client.post("/api/v1/knowledge/reindex").status_code == 200

    response = client.post(
        "/api/v1/knowledge/ask",
        json={"question": "我的假设是什么？", "max_citations": 8},
    )
    assert response.status_code == 200
    notes = [
        item for item in response.json()["citations"]
        if item["source_scope"] == "note"
    ]
    assert notes
    assert notes[0]["page_number"] is None
    assert notes[0]["section"] == "我的笔记"


def test_claim_evidence_mapping_and_multi_paper_comparison(
    client: TestClient,
) -> None:
    first = _upload(client)

    from app.models import Analysis, Paper

    with client.app.state.session_factory() as db:
        db.add(
            Analysis(
                paper_id=first["id"],
                summary="层间滑移会导致结构衰减。",
                plain_explanation="",
                deep_analysis="XRD 结果支持高电压循环中的结构变化。",
                evidence_status="AI归纳（Mock 演示）",
                provider="mock",
                model_name="mock",
            )
        )
        second = Paper(
            title="Full cell comparison paper",
            file_size=0,
            page_count=0,
            extracted_text="",
            abstract=(
                "A sodium full cell was tested from 2.0-4.0 V at 25 C. "
                "The result should not be directly compared with sodium half cells."
            ),
            parse_confidence=0.0,
            fulltext_status="仅摘要",
            acquisition_status="abstract_only",
        )
        db.add(second)
        db.commit()
        second_id = second.id

    assert client.post("/api/v1/knowledge/reindex").status_code == 200
    rebuilt = client.post(f"/api/v1/papers/{first['id']}/claims/rebuild")
    assert rebuilt.status_code == 200
    claims = rebuilt.json()["items"]
    assert claims
    assert claims[0]["claim_type"] == "AI归纳"
    assert claims[0]["evidence"]
    assert all(item["page_number"] is not None for item in claims[0]["evidence"])

    compared = client.post(
        "/api/v1/knowledge/compare",
        json={
            "paper_ids": [first["id"], second_id],
            "question": "比较电池类型、实验条件和结构稳定性。",
        },
    )
    assert compared.status_code == 200
    payload = compared.json()
    assert len({item["paper_id"] for item in payload["citations"]}) == 2
    assert "## 对比矩阵" in payload["comparison_markdown"]
    assert "## 争议分析" in payload["comparison_markdown"]
    assert payload["fairness_warnings"]


def test_user_can_save_read_and_delete_a_complete_library_conversation(
    client: TestClient,
) -> None:
    save_payload = {
        "scope": "library",
        "title": "结构稳定性追问",
        "turns": [
            {
                "turn_index": 1,
                "question": "为什么会发生结构衰减？",
                "answer_markdown": "层间滑移可能导致结构衰减。[证据1]",
                "citations": [],
                "evidence_status": "AI归纳（Mock 论文库问答演示）",
                "confidence": {"level": "中", "explanation": "证据充分。"},
                "provider": "mock",
                "model_name": "mock-research-copilot",
            }
        ],
    }

    created = client.post("/api/v1/knowledge/conversations", json=save_payload)

    assert created.status_code == 201
    conversation_id = created.json()["id"]
    listed = client.get("/api/v1/knowledge/conversations")
    detail = client.get(f"/api/v1/knowledge/conversations/{conversation_id}")
    deleted = client.delete(f"/api/v1/knowledge/conversations/{conversation_id}")

    assert listed.status_code == 200
    assert listed.json()["items"][0]["title"] == "结构稳定性追问"
    assert detail.status_code == 200
    assert detail.json()["turns"] == save_payload["turns"]
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/knowledge/conversations/{conversation_id}").status_code == 404


def test_user_can_save_read_and_delete_a_comparison_snapshot(
    client: TestClient,
) -> None:
    comparison = {
        "question": "比较两篇论文的测试条件。",
        "comparison_markdown": "## 对比矩阵\n\n条件不同，不能直接横比。[证据1]",
        "papers": [
            {
                "paper_id": 11,
                "title": "Half-cell study",
                "evidence_basis": "全文",
                "research_focus": "半电池循环",
                "citation_count": 1,
            },
            {
                "paper_id": 12,
                "title": "Full-cell study",
                "evidence_basis": "摘要",
                "research_focus": "全电池循环",
                "citation_count": 0,
            },
        ],
        "citations": [
            {
                "citation_id": 1,
                "paper_id": 11,
                "paper_title": "Half-cell study",
                "page_number": 2,
                "section": "Experimental",
                "excerpt": "The half cell was tested at 25 C.",
                "source_scope": "fulltext",
                "parse_confidence": 0.9,
                "similarity": 0.8,
            }
        ],
        "fairness_warnings": ["半电池和全电池不能直接横比。"],
        "evidence_status": "AI推断（Mock 演示）",
        "confidence": {"level": "中", "explanation": "含一条全文证据。"},
        "provider": "mock",
        "model_name": "mock-research-copilot",
    }

    created = client.post("/api/v1/comparisons/saved", json=comparison)

    assert created.status_code == 201
    comparison_id = created.json()["id"]
    listed = client.get("/api/v1/comparisons/saved")
    detail = client.get(f"/api/v1/comparisons/saved/{comparison_id}")
    deleted = client.delete(f"/api/v1/comparisons/saved/{comparison_id}")

    assert listed.status_code == 200
    assert listed.json()["items"][0]["paper_count"] == 2
    assert detail.status_code == 200
    assert detail.json()["comparison_markdown"] == comparison["comparison_markdown"]
    assert detail.json()["papers"] == comparison["papers"]
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/comparisons/saved/{comparison_id}").status_code == 404


def test_paper_question_only_returns_evidence_from_the_requested_paper(
    client: TestClient,
) -> None:
    uploaded = _upload(client)
    from app.models import Paper

    with client.app.state.session_factory() as db:
        other = Paper(
            title="Other abstract paper",
            file_size=0,
            page_count=0,
            extracted_text="",
            abstract="A different paper discusses irreversible phase transitions.",
            parse_confidence=0.0,
            fulltext_status="仅摘要",
            acquisition_status="abstract_only",
        )
        db.add(other)
        db.commit()

    assert client.post("/api/v1/knowledge/reindex").status_code == 200
    response = client.post(
        f"/api/v1/papers/{uploaded['id']}/knowledge/ask",
        json={"question": "这篇论文的结构衰减原因是什么？"},
    )

    assert response.status_code == 200
    assert response.json()["citations"]
    assert {item["paper_id"] for item in response.json()["citations"]} == {uploaded["id"]}
