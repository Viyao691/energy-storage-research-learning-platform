from __future__ import annotations

import math

import pytest


def test_chunk_pages_preserves_page_numbers_and_bounds_chunk_size() -> None:
    from app.knowledge import chunk_pages

    page_one = (
        "Introduction\n"
        "Sodium layered oxide cathodes can deliver high energy density. "
        "Their structural transitions still limit long-term cycling. "
        "This paragraph belongs only to the first page."
    )
    page_two = (
        "Experimental\n"
        "The precursor was calcined and assembled into sodium half cells. "
        "Electrochemical tests were conducted in a fixed voltage window."
    )

    chunks = chunk_pages([page_one, page_two], max_chars=90, overlap=15)

    assert chunks
    assert {chunk.page_number for chunk in chunks} == {1, 2}
    assert all(len(chunk.content) <= 90 for chunk in chunks)
    assert all(chunk.source_scope == "fulltext" for chunk in chunks)
    assert chunks[0].section == "Introduction"
    assert next(chunk for chunk in chunks if chunk.page_number == 2).section == "Experimental"
    assert not any(
        "first page" in chunk.content and "precursor" in chunk.content
        for chunk in chunks
    )


def test_mock_embeddings_rank_relevant_multilingual_text_first() -> None:
    from app.knowledge import MockEmbeddingProvider, cosine_similarity

    provider = MockEmbeddingProvider()
    vectors = provider.embed(
        [
            "钠离子电池 P2 层状氧化物 sodium ion battery layered oxide",
            "lithium metal anode dendrite growth",
        ]
    )
    query = provider.embed(["P2型钠离子正极"])[0]

    assert provider.model_name == "mock-multilingual-embedding"
    assert math.isclose(sum(value * value for value in query), 1.0, rel_tol=1e-6)
    assert cosine_similarity(query, vectors[0]) > cosine_similarity(query, vectors[1])


def test_ollama_embedding_provider_uses_batch_embed_api(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.knowledge import OllamaEmbeddingProvider
    import app.knowledge as knowledge_module

    captured: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {"embeddings": [[1.0, 0.0], [0.0, 1.0]]}

    def fake_post(url: str, **kwargs: object) -> FakeResponse:
        captured["url"] = url
        captured.update(kwargs)
        return FakeResponse()

    monkeypatch.setattr(knowledge_module.httpx, "post", fake_post)
    provider = OllamaEmbeddingProvider(
        "http://ollama.test/",
        "bge-m3",
        timeout_seconds=120,
    )

    vectors = provider.embed(["第一个片段", "second chunk"])

    assert vectors == [[1.0, 0.0], [0.0, 1.0]]
    assert captured["url"] == "http://ollama.test/api/embed"
    assert captured["json"] == {
        "model": "bge-m3",
        "input": ["第一个片段", "second chunk"],
        "truncate": True,
    }
    assert captured["timeout"] == 120


def test_ollama_embedding_provider_hides_upstream_error_details(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.knowledge import EmbeddingProviderError, OllamaEmbeddingProvider
    import app.knowledge as knowledge_module

    def fail(*_args: object, **_kwargs: object) -> None:
        raise knowledge_module.httpx.ConnectError("private local path")

    monkeypatch.setattr(knowledge_module.httpx, "post", fail)
    provider = OllamaEmbeddingProvider("http://ollama.test", "bge-m3", 30)

    with pytest.raises(EmbeddingProviderError, match="无法连接 Ollama 嵌入服务"):
        provider.embed(["text"])


def test_ollama_embedding_connection_accepts_implicit_latest_tag(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.knowledge import OllamaEmbeddingProvider
    import app.knowledge as knowledge_module

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {"models": [{"name": "bge-m3:latest"}]}

    monkeypatch.setattr(
        knowledge_module.httpx,
        "get",
        lambda *_args, **_kwargs: FakeResponse(),
    )

    ready, message = OllamaEmbeddingProvider(
        "http://ollama.test",
        "bge-m3",
        30,
    ).test_connection()

    assert ready is True
    assert "已就绪" in message


def test_paper_chunk_model_keeps_provenance_and_cascades_with_paper() -> None:
    from app.models import Paper, PaperChunk

    columns = PaperChunk.__table__.columns

    assert {
        "paper_id",
        "page_number",
        "chunk_index",
        "section",
        "content",
        "content_hash",
        "source_scope",
        "parse_confidence",
        "parse_run_id",
        "source_locations_json",
        "embedding_json",
        "embedding_model",
    }.issubset(columns.keys())
    assert Paper.chunks.property.cascade.delete_orphan is True
    foreign_key = next(iter(columns["paper_id"].foreign_keys))
    assert foreign_key.ondelete == "CASCADE"
    parse_run_foreign_key = next(iter(columns["parse_run_id"].foreign_keys))
    assert parse_run_foreign_key.ondelete == "SET NULL"


def test_chunk_source_locations_include_only_matching_valid_elements() -> None:
    import json
    from app.knowledge import match_source_locations

    layout = json.dumps(
        [
            {
                "element_id": "docling-1-1",
                "text": "Measured capacity is 150 mAh g-1.",
                "bbox": {"left": 10, "top": 20, "right": 300, "bottom": 60},
                "coord_origin": "TOPLEFT",
            },
            {
                "element_id": "docling-1-2",
                "text": "Unrelated paragraph.",
                "bbox": {"left": 10, "top": 80, "right": 300, "bottom": 120},
                "coord_origin": "TOPLEFT",
            },
        ]
    )

    locations = match_source_locations(
        "Measured capacity is 150 mAh g-1.",
        page_number=1,
        layout_json=layout,
        page_width=600,
        page_height=800,
    )

    assert [item["element_id"] for item in locations] == ["docling-1-1"]
    assert locations[0]["bbox"] == {
        "left": 10.0,
        "top": 20.0,
        "right": 300.0,
        "bottom": 60.0,
    }
    assert locations[0]["page_width"] == 600.0


@pytest.mark.parametrize("layout_json", ["not-json", "{}", "[]"])
def test_chunk_source_locations_degrade_to_empty(layout_json: str) -> None:
    from app.knowledge import match_source_locations

    assert match_source_locations(
        "evidence",
        page_number=1,
        layout_json=layout_json,
        page_width=600,
        page_height=800,
    ) == []


def test_ollama_question_uses_only_numbered_knowledge_context(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import KnowledgeContext, OllamaProvider
    import app.providers as provider_module

    captured: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {
                "message": {
                    "content": "层间滑移可能降低结构稳定性。[证据1]"
                }
            }

    def fake_post(url: str, **kwargs: object) -> FakeResponse:
        captured["url"] = url
        captured.update(kwargs)
        return FakeResponse()

    monkeypatch.setattr(provider_module.httpx, "post", fake_post)
    provider = OllamaProvider("http://ollama.test", "qwen2.5:7b", 60)
    result = provider.answer_question(
        "为什么会衰减？",
        [
            KnowledgeContext(
                1,
                "Paper",
                4,
                "Results",
                "fulltext",
                "Slab gliding reduces stability.",
            )
        ],
    )

    body = captured["json"]
    assert isinstance(body, dict)
    prompt = body["messages"][0]["content"]  # type: ignore[index]
    assert captured["url"] == "http://ollama.test/api/chat"
    assert "[证据1]" in prompt
    assert "第 4 页" in prompt
    assert "不得生成证据中没有的作者、DOI、页码" in prompt
    assert result.answer_markdown.endswith("[证据1]")
    assert result.model_name == "qwen2.5:7b"


def test_openai_compatible_question_keeps_api_key_out_of_result(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import KnowledgeContext, OpenAICompatibleProvider
    import app.providers as provider_module

    captured: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {
                "choices": [
                    {
                        "message": {
                            "content": "该结论只有摘要支持，不能视为全文证据。[证据1]"
                        }
                    }
                ]
            }

    def fake_post(url: str, **kwargs: object) -> FakeResponse:
        captured["url"] = url
        captured.update(kwargs)
        return FakeResponse()

    monkeypatch.setattr(provider_module.httpx, "post", fake_post)
    provider = OpenAICompatibleProvider(
        "private-key-1234",
        "https://model.test/v1",
        "text-model",
        45,
    )
    result = provider.answer_question(
        "摘要说明了什么？",
        [
            KnowledgeContext(
                1,
                "Abstract paper",
                None,
                "摘要",
                "abstract",
                "Abstract evidence.",
            )
        ],
    )

    assert captured["url"] == "https://model.test/v1/chat/completions"
    assert captured["headers"] == {"Authorization": "Bearer private-key-1234"}
    assert "摘要（无全文页码）" in captured["json"]["messages"][0]["content"]  # type: ignore[index]
    assert "private-key-1234" not in result.answer_markdown
