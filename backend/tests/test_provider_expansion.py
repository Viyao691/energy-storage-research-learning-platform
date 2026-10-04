from __future__ import annotations

import httpx
import pytest

from app.document_ai import DocumentAIManager
from app.providers import make_provider


@pytest.mark.parametrize(
    ("provider_id", "base_url"),
    [
        ("qwen", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
        ("gemini", "https://generativelanguage.googleapis.com/v1beta/openai"),
        ("volcengine", "https://ark.cn-beijing.volces.com/api/v3"),
        ("qianfan", "https://qianfan.baidubce.com/v2"),
        ("anthropic", "https://api.anthropic.com/v1"),
        ("moonshot", "https://api.moonshot.cn/v1"),
        ("minimax", "https://api.minimax.cn/v1"),
        ("hunyuan", "https://tokenhub.tencentmaas.com/v1"),
        ("siliconflow", "https://api.siliconflow.cn/v1"),
        ("openrouter", "https://openrouter.ai/api/v1"),
        ("xai", "https://api.x.ai/v1"),
        ("mistral", "https://api.mistral.ai/v1"),
    ],
)
def test_named_provider_uses_its_own_endpoint(provider_id: str, base_url: str) -> None:
    provider = make_provider(provider_id, "test-key", "", "test-model", 30)
    assert provider.name == provider_id
    assert provider.base_url == base_url
    assert provider.model_name == "test-model"


def test_anthropic_text_uses_native_messages_protocol(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, dict[str, str], dict[str, object]]] = []

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        calls.append((url, headers, json))
        return httpx.Response(200, json={"content": [{"type": "text", "text": '{"ok": true}'}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    provider = make_provider("anthropic", "test-key", "", "claude-test", 30)
    result = provider.generate_structured_task("Return JSON", "test-task")

    assert result.data == {"ok": True}
    url, headers, payload = calls[0]
    assert url == "https://api.anthropic.com/v1/messages"
    assert headers["x-api-key"] == "test-key"
    assert "Authorization" not in headers
    assert payload["max_tokens"] > 0
    assert payload["messages"] == [{"role": "user", "content": "Return JSON"}]


def test_anthropic_always_thinking_model_reserves_response_tokens(monkeypatch: pytest.MonkeyPatch) -> None:
    payloads: list[dict[str, object]] = []

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        payloads.append(json)
        return httpx.Response(200, json={"content": [{"type": "text", "text": '{"ok": true}'}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    make_provider("anthropic", "test-key", "", "claude-opus-5-5", 30).generate_structured_task("Return JSON", "campus-notice-v1")
    assert payloads[0]["max_tokens"] == 8192
    assert "temperature" not in payloads[0]


def test_anthropic_explicit_campus_cap_never_silently_increases(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.providers import ModelProviderError
    monkeypatch.setattr("app.providers.httpx.post", lambda *args, **kwargs: pytest.fail("over-budget request sent"))
    provider = make_provider("anthropic", "test-key", "", "claude-opus-5-5", 30)
    with pytest.raises(ModelProviderError, match="最低输出预算"):
        provider.generate_structured_task("Return JSON", "campus-notice-v1", max_tokens=512)


def test_anthropic_figure_analysis_uses_native_image_message(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[dict[str, object]] = []

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        calls.append(json)
        return httpx.Response(200, json={"content": [{"type": "text", "text": "## 1. 上下文绑定\n无法确认"}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    provider = make_provider("anthropic", "test-key", "", "claude-test", 30)
    result = provider.analyze_visual("paper", "caption", "page", b"png")
    assert "上下文绑定" in result.analysis_markdown
    assert calls[0]["messages"][0]["content"][1]["source"]["media_type"] == "image/png"
    assert "temperature" not in calls[0]


def test_openai_text_uses_responses_without_sampling_parameters(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, dict[str, object]]] = []

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        calls.append((url, json))
        return httpx.Response(200, json={"output_text": '{"ok": true}'}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    result = make_provider("openai", "test-key", "", "gpt-6-sol", 30).generate_structured_task("Return JSON", "test-task")
    assert result.data == {"ok": True}
    url, payload = calls[0]
    assert url == "https://api.openai.com/v1/responses"
    assert payload["store"] is False
    assert "temperature" not in payload
    assert "max_output_tokens" in payload


def test_structured_output_cap_reaches_openai_and_ollama_requests(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = []
    def fake_post(url, **kwargs):
        calls.append((url, kwargs["json"]))
        body = {"message": {"content": '{"ok":true}'}} if url.endswith("/api/chat") else {"output_text": '{"ok":true}'}
        return httpx.Response(200, json=body, request=httpx.Request("POST", url))
    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    make_provider("openai", "test-key", "", "gpt-6-sol", 30).generate_structured_task("json", "campus-notice-v1", max_tokens=384)
    make_provider("ollama", "", "http://localhost:11434", "qwen", 30).generate_structured_task("json", "campus-notice-v1", max_tokens=384)
    assert calls[0][1]["max_output_tokens"] == 384
    assert calls[1][1]["options"]["num_predict"] == 384


def test_document_vision_uses_selected_compatible_provider_default_url(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, dict[str, object]]] = []

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int, follow_redirects: bool):
        calls.append((url, json))
        return httpx.Response(200, json={"choices": [{"message": {"content": "页面文字"}}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.document_ai.httpx.post", fake_post)
    manager = DocumentAIManager.__new__(DocumentAIManager)
    result = manager.cloud_enhance(
        page_png=b"png", page_number=1, local_text="", caption_context="",
        provider="qwen", model="qwen-vl-test", api_key="test-key",
    )
    assert result["text"] == "页面文字"
    assert calls[0][0] == "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"


def test_document_vision_anthropic_uses_native_image_block(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, dict[str, str], dict[str, object]]] = []

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int, follow_redirects: bool):
        calls.append((url, headers, json))
        return httpx.Response(200, json={"content": [{"type": "text", "text": "页面文字"}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.document_ai.httpx.post", fake_post)
    manager = DocumentAIManager.__new__(DocumentAIManager)
    result = manager.cloud_enhance(
        page_png=b"png", page_number=1, local_text="", caption_context="",
        provider="anthropic", model="claude-test", api_key="test-key",
    )
    assert result["text"] == "页面文字"
    url, headers, payload = calls[0]
    assert url == "https://api.anthropic.com/v1/messages"
    assert headers["x-api-key"] == "test-key"
    content = payload["messages"][0]["content"]
    assert content[1]["type"] == "image"
    assert content[1]["source"]["media_type"] == "image/png"


def test_named_provider_uses_explicit_vision_model_for_figure(monkeypatch: pytest.MonkeyPatch) -> None:
    payloads: list[dict[str, object]] = []

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        payloads.append(json)
        return httpx.Response(200, json={"choices": [{"message": {"content": "## 1. 上下文绑定\n无法确认"}}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    provider = make_provider("qwen", "test-key", "", "qwen-text", 30, vision_model="qwen-vision")
    assert provider.supports_vision is True
    result = provider.analyze_visual("paper", "caption", "page", b"png")
    assert result.model_name == "qwen-vision"
    assert payloads[0]["model"] == "qwen-vision"
    assert make_provider("qwen", "test-key", "", "qwen-text", 30).supports_vision is False


def test_zhipu_visual_capability_is_model_specific() -> None:
    assert make_provider("zhipu", "test-key", "", "glm-5.3", 30).supports_vision is False
    assert make_provider("zhipu", "test-key", "", "glm-5.3", 30, vision_model="glm-5.3-flash").supports_vision is True


def test_glm_47_disables_thinking_only_for_structured_requests(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.paper_analysis import AnalysisReportType

    payloads: list[dict[str, object]] = []

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        payloads.append(json)
        content = '{"quick_understanding": "report"}' if "本任务是快速理解" in json["messages"][0]["content"] else '{"ok": true}'
        return httpx.Response(200, json={"choices": [{"message": {"content": content}}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    glm = make_provider("zhipu", "test-key", "", "glm-4.7", 30)
    glm.analyze_report("paper", "text", AnalysisReportType.quick_understanding)
    glm.generate_structured_task("Return JSON", "test-task")
    glm._chat_content("Plain response")
    make_provider("zhipu", "test-key", "", "glm-5.3", 30).generate_structured_task("Return JSON", "test-task")

    assert payloads[0]["response_format"] == {"type": "json_object"}
    assert payloads[0]["thinking"] == {"type": "disabled"}
    assert payloads[1]["thinking"] == {"type": "disabled"}
    assert "thinking" not in payloads[2]
    assert "thinking" not in payloads[3]
