from __future__ import annotations

import json as json_lib

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


def test_deepseek_paper_reports_keep_thinking_and_request_64000_tokens(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.paper_analysis import AnalysisReportType

    payloads: list[dict[str, object]] = []

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        payloads.append(json)
        task = next(item for item in AnalysisReportType if item.value in json["messages"][0]["content"])
        content = json_lib.dumps({task.value: "## 完整报告\n\n内容。"})
        return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": {"content": content}}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    for name in ("deepseek", "openai_compatible"):
        provider = make_provider(name, "test-key", "https://example.com/v1", "model", 30)
        for report_type in AnalysisReportType:
            provider.analyze_report("paper", "text", report_type)
    assert [item["max_tokens"] for item in payloads] == [64000] * 3 + [16000, 12000, 20000]
    assert all("thinking" not in item for item in payloads)


@pytest.mark.parametrize("content, expected", [
    ("", "暂未返回正文"),
    ("部分正文", "部分报告未保存"),
])
def test_deepseek_length_response_distinguishes_empty_and_partial(monkeypatch: pytest.MonkeyPatch, content: str, expected: str) -> None:
    from app.paper_analysis import AnalysisReportType
    from app.providers import ModelProviderError

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        return httpx.Response(200, json={"choices": [{"finish_reason": "length", "message": {"content": content}}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    provider = make_provider("deepseek", "test-key", "", "deepseek-flash", 30)
    with pytest.raises(ModelProviderError, match=expected):
        provider.analyze_report("paper", "text", AnalysisReportType.quick_understanding)


def test_deepseek_rejects_incomplete_diagram_with_specific_error(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.paper_analysis import AnalysisReportType
    from app.providers import ModelProviderError

    def fake_post(url: str, *, headers: dict[str, str], json: dict[str, object], timeout: int):
        content = json_lib.dumps({"quick_understanding": '## 方法流程图\n```mermaid\nflowchart TD\nA["起点"] --> B["'})
        return httpx.Response(200, json={"choices": [{"finish_reason": "stop", "message": {"content": content}}]}, request=httpx.Request("POST", url))

    monkeypatch.setattr("app.providers.httpx.post", fake_post)
    provider = make_provider("deepseek", "test-key", "", "deepseek-flash", 30)
    with pytest.raises(ModelProviderError, match="流程图不完整，原报告保持不变"):
        provider.analyze_report("paper", "text", AnalysisReportType.quick_understanding)
