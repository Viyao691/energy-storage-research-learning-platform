from __future__ import annotations

from types import SimpleNamespace

import pytest


@pytest.mark.parametrize("field", ["quick_understanding", "reviewer_analysis", "layman_understanding"])
def test_claim_candidates_use_current_report_prose_without_markdown_artifacts(field):
    from app.claim_evidence import extract_claim_candidates
    from app.models import Analysis

    report = (
        "## 一句话抓住论文核心\n"
        "**表面包覆**改善了高电压循环稳定性。\n"
        "```mermaid\nflowchart LR\nA[研究问题] --> B[核心发现]\n```\n"
        "| 指标 | 容量变化 |\n| --- | --- |\n"
        "- 原位衍射显示包覆减轻了不可逆相变。"
    )
    analysis = Analysis(summary="旧报告已经被新版本替代。", deep_analysis="", **{field: report})
    assert extract_claim_candidates(analysis) == [
        "表面包覆改善了高电压循环稳定性。",
        "原位衍射显示包覆减轻了不可逆相变。",
    ]


@pytest.fixture()
def claims_client(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import create_app

    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'claims.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("EMBEDDING_PROVIDER", "mock")
    with TestClient(create_app()) as client:
        yield client


def _seed_claim_papers(client):
    from app.models import Analysis, Paper

    with client.app.state.session_factory() as db:
        paper = Paper(title="Claim paper", file_size=0, abstract="Surface coating improves cycling stability.")
        other = Paper(title="Other paper", file_size=0, abstract="Other paper must not be indexed.")
        db.add_all([paper, other])
        db.flush()
        db.add(Analysis(paper_id=paper.id, summary="", plain_explanation="", deep_analysis="",
            quick_understanding="表面包覆改善了高电压循环稳定性。", evidence_status="AI归纳", provider="mock", model_name="mock"))
        db.commit()
        return paper.id, other.id


@pytest.mark.parametrize("index_state", ["missing", "stale", "different_model", "ready"])
def test_claim_rebuild_prepares_or_reuses_only_this_paper_index(claims_client, monkeypatch, index_state):
    from sqlalchemy import select
    from app.knowledge import MockEmbeddingProvider, index_paper
    from app.models import Paper, PaperChunk
    import app.routers.papers as paper_routes

    paper_id, other_id = _seed_claim_papers(claims_client)
    with claims_client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        if index_state != "missing":
            index_paper(db, paper, MockEmbeddingProvider(), page_texts=None)
            paper.knowledge_index_stale = index_state == "stale"
            if index_state == "different_model":
                db.scalar(select(PaperChunk).where(PaperChunk.paper_id == paper_id)).embedding_model = "old-model"
            db.commit()
    prepared = []
    def track_index(db, paper, provider, **kwargs):
        prepared.append(paper.id)
        return index_paper(db, paper, provider, **kwargs)
    monkeypatch.setattr(paper_routes, "index_paper", track_index, raising=False)
    response = claims_client.post(f"/api/v1/papers/{paper_id}/claims/rebuild")
    assert response.status_code == 200, response.text
    assert prepared == ([] if index_state == "ready" else [paper_id])
    assert response.json()["items"][0]["evidence"][0]["source_scope"] == "abstract"
    with claims_client.app.state.session_factory() as db:
        assert not list(db.scalars(select(PaperChunk).where(PaperChunk.paper_id == other_id)))
        assert db.get(Paper, paper_id).knowledge_index_stale is False


def test_claim_rebuild_failure_keeps_prior_mapping_and_index(claims_client, monkeypatch):
    from sqlalchemy import select
    from app.knowledge import EmbeddingProviderError, MockEmbeddingProvider, index_paper
    from app.models import ClaimEvidence, Paper, PaperChunk, PaperClaim
    import app.routers.papers as paper_routes

    paper_id, _ = _seed_claim_papers(claims_client)
    with claims_client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        index_paper(db, paper, MockEmbeddingProvider(), page_texts=None)
        paper.knowledge_index_stale = True
        claim = PaperClaim(paper_id=paper_id, claim_text="原有映射应该保留。", claim_type="AI归纳", evidence_status="待核验", confidence=0)
        db.add(claim)
        db.flush()
        old_chunk_id = db.scalar(select(PaperChunk).where(PaperChunk.paper_id == paper_id)).id
        db.add(ClaimEvidence(claim_id=claim.id, chunk_id=old_chunk_id, rank=1, similarity=0.5, locator=""))
        db.commit()
    class FailingQueryProvider(MockEmbeddingProvider):
        calls = 0
        def embed(self, texts):
            self.calls += 1
            if self.calls == 2:
                raise EmbeddingProviderError("无法连接 Ollama 嵌入服务，请确认 Ollama 已启动")
            return super().embed(texts)
    monkeypatch.setattr(paper_routes, "make_embedding_provider", lambda *args: FailingQueryProvider())
    response = claims_client.post(f"/api/v1/papers/{paper_id}/claims/rebuild")
    assert response.status_code == 503
    assert "Ollama" in response.json()["detail"]
    old_claim = claims_client.get(f"/api/v1/papers/{paper_id}/claims").json()["items"][0]
    assert old_claim["claim_text"] == "原有映射应该保留。"
    assert old_claim["evidence"][0]["chunk_id"] == old_chunk_id
    with claims_client.app.state.session_factory() as db:
        assert db.scalar(select(PaperChunk).where(PaperChunk.paper_id == paper_id)).id == old_chunk_id
        assert db.get(Paper, paper_id).knowledge_index_stale is True


def test_claim_rebuild_uses_active_parse_pages_with_source_locations(claims_client, monkeypatch):
    import json
    from sqlalchemy import select
    from app.models import Paper, PaperChunk, PaperPageExtraction, PaperParseRun
    import app.routers.papers as paper_routes

    paper_id, _ = _seed_claim_papers(claims_client)
    source_text = "Surface coating improves cycling stability."
    with claims_client.app.state.session_factory() as db:
        paper = db.get(Paper, paper_id)
        run = PaperParseRun(paper_id=paper_id, version_number=1, status="completed")
        db.add(run)
        db.flush()
        paper.active_parse_run_id = run.id
        paper.parse_confidence = 0.9
        paper.file_path = "must-not-reopen-native-pdf.pdf"
        db.add(PaperPageExtraction(paper_id=paper_id, parse_run_id=run.id, page_number=2,
            source_type="docling", text=source_text, page_width=600, page_height=800,
            layout_json=json.dumps([{"element_id": "docling-2-1", "text": source_text,
                "bbox": {"left": 10, "top": 20, "right": 300, "bottom": 50}}])))
        db.commit()
        run_id = run.id
    monkeypatch.setattr(paper_routes, "extract_page_texts", lambda *_: pytest.fail("active extraction must be reused"))
    response = claims_client.post(f"/api/v1/papers/{paper_id}/claims/rebuild")
    assert response.status_code == 200, response.text
    evidence = response.json()["items"][0]["evidence"][0]
    assert evidence["page_number"] == 2
    assert evidence["source_scope"] == "fulltext"
    assert evidence["source_locations"][0]["element_id"] == "docling-2-1"
    with claims_client.app.state.session_factory() as db:
        assert db.scalar(select(PaperChunk).where(PaperChunk.paper_id == paper_id)).parse_run_id == run_id


def test_empty_current_report_does_not_erase_prior_mapping(claims_client):
    from sqlalchemy import select
    from app.models import Analysis, PaperClaim

    paper_id, _ = _seed_claim_papers(claims_client)
    with claims_client.app.state.session_factory() as db:
        db.scalar(select(Analysis).where(Analysis.paper_id == paper_id)).quick_understanding = "## 报告标题仅供参考\n```mermaid\nflowchart LR\n```"
        db.add(PaperClaim(paper_id=paper_id, claim_text="原有映射应该保留。", claim_type="AI归纳", evidence_status="待核验", confidence=0))
        db.commit()
    response = claims_client.post(f"/api/v1/papers/{paper_id}/claims/rebuild")
    assert response.status_code == 409
    assert "结论" in response.json()["detail"]
    assert len(claims_client.get(f"/api/v1/papers/{paper_id}/claims").json()["items"]) == 1


def test_claim_candidates_are_deduplicated_and_bounded() -> None:
    from app.claim_evidence import extract_claim_candidates
    from app.models import Analysis

    analysis = Analysis(
        paper_id=1,
        summary="层间滑移会导致结构衰减。层间滑移会导致结构衰减。",
        plain_explanation="",
        deep_analysis=(
            "## 机理\n高电压循环中出现不可逆相变，Figure 2 提供了结构变化线索。"
        ),
        evidence_status="AI归纳",
        provider="mock",
        model_name="mock",
    )
    claims = extract_claim_candidates(analysis)
    assert claims == [
        "层间滑移会导致结构衰减。",
        "高电压循环中出现不可逆相变，Figure 2 提供了结构变化线索。",
    ]


def test_claim_response_exposes_valid_chunk_source_locations() -> None:
    import json
    from app.routers._shared import _paper_claim_response

    chunk = SimpleNamespace(
        id=9,
        page_number=2,
        section="Results",
        content="evidence",
        source_scope="fulltext",
        parse_confidence=0.9,
        source_locations_json=json.dumps(
            [
                {
                    "page_number": 2,
                    "element_id": "docling-2-4",
                    "bbox": {"left": 10, "top": 20, "right": 100, "bottom": 50},
                    "coord_origin": "TOPLEFT",
                    "page_width": 600,
                    "page_height": 800,
                }
            ]
        ),
    )
    claim = SimpleNamespace(
        id=1,
        paper_id=3,
        claim_text="claim",
        claim_type="AI归纳",
        evidence_status="已定位",
        confidence=0.8,
        evidence_links=[SimpleNamespace(chunk=chunk, similarity=0.7, locator="")],
    )

    response = _paper_claim_response(claim)

    assert response.evidence[0].source_locations[0].element_id == "docling-2-4"
