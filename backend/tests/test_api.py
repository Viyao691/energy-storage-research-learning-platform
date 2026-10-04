from __future__ import annotations

import base64
import io
import json
from pathlib import Path

import fitz
import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.delenv("MODEL_API_KEY", raising=False)
    from app.main import create_app

    with TestClient(create_app()) as api:
        yield api


def pdf_bytes(text: str = "Sodium ion cathode paper") -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    result = document.tobytes()
    document.close()
    return result


def test_health_reports_database_ready(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["database"] == "ok"


def test_settings_saves_key_only_to_runtime_secret_store_and_masks_response(client: TestClient, tmp_path: Path) -> None:
    response = client.post(
        "/api/v1/settings",
        json={"model_provider": "openai_compatible", "api_key": "secret-key-1234", "model_name": "demo"},
    )
    assert response.status_code == 200
    data = client.get("/api/v1/settings").json()
    assert data["api_key"]["configured"] is True
    assert data["api_key"]["last4"] == "1234"
    assert "secret-key-1234" not in response.text
    stored = (tmp_path / "runtime-secrets.json").read_text(encoding="utf-8")
    assert "secret-key-1234" not in stored
    assert json.loads(stored)["model_provider"] == "openai_compatible"
    from app.secrets import get_model_api_key

    assert get_model_api_key("openai_compatible") == "secret-key-1234"
    assert "secret-key-1234" not in (tmp_path / "test.db").read_bytes().decode("latin-1")


def test_campus_ai_budget_settings_keep_values_when_older_client_omits_them(client: TestClient) -> None:
    assert client.get("/api/v1/settings").json()["campus_ai_daily_limit"] == 20
    saved = client.post("/api/v1/settings", json={"campus_ai_daily_limit": 100, "campus_ai_max_tokens": 512})
    assert saved.status_code == 200
    assert saved.json()["campus_ai_max_tokens"] == 512
    assert client.post("/api/v1/settings", json={"model_provider": "mock"}).json()["campus_ai_daily_limit"] == 100
    assert client.get("/api/v1/settings").json()["campus_ai_max_tokens"] == 512
    assert client.post("/api/v1/settings", json={"campus_ai_daily_limit": 0}).json()["campus_ai_daily_limit"] == 0
    assert client.post("/api/v1/settings", json={"campus_ai_max_tokens": 127}).status_code == 422
    assert client.post("/api/v1/settings", json={"campus_ai_daily_limit": -1}).status_code == 422


def test_settings_persist_separate_ollama_vision_model_without_a_key(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "ollama",
            "model_name": "qwen2.5:7b",
            "vision_model": "qwen2.5vl:3b",
            "model_base_url": "http://host.docker.internal:11434",
            "timeout_seconds": 120,
            "backup_model": "qwen2.5:3b",
            "paper_budget": 0,
            "daily_budget": 0,
            "monthly_budget": 0,
        },
    )

    assert response.status_code == 200
    assert response.json()["vision_model"] == "qwen2.5vl:3b"
    assert response.json()["api_key"] == {"configured": False, "last4": None}
    saved = client.get("/api/v1/settings").json()
    assert saved["vision_model"] == "qwen2.5vl:3b"
    assert saved["model_name"] == "qwen2.5:7b"


def test_switching_provider_without_new_key_does_not_reuse_previous_provider_key(client: TestClient) -> None:
    configured = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "deepseek",
            "api_key": "deepseek-local-test-key-1234",
            "model_name": "deepseek-v4-flash",
            "model_base_url": "https://api.deepseek.com",
        },
    )
    assert configured.status_code == 200
    assert configured.json()["api_key"] == {"configured": True, "last4": "1234"}

    switched = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "openai",
            "model_name": "gpt-5.6-terra",
            "model_base_url": "https://api.openai.com/v1",
        },
    )

    assert switched.status_code == 200
    assert switched.json()["api_key"] == {"configured": False, "last4": None}
    assert client.get("/api/v1/settings").json()["api_key"] == {
        "configured": False,
        "last4": None,
    }
    model_test = client.post("/api/v1/settings/test-model")
    assert model_test.json()["provider"] == "unconfigured"
    assert "deepseek-local-test-key-1234" not in model_test.text


def test_changing_provider_endpoint_does_not_send_saved_key_to_new_host(client: TestClient) -> None:
    configured = client.post(
        "/api/v1/settings",
        json={"model_provider": "qwen", "model_name": "qwen3.8-flash", "api_key": "qwen-test-key-1234"},
    )
    assert configured.json()["api_key"] == {"configured": True, "last4": "1234"}

    changed = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "qwen", "model_name": "qwen3.8-flash",
            "model_base_url": "https://different.example/v1",
        },
    )
    assert changed.json()["api_key"] == {"configured": False, "last4": None}
    assert client.post("/api/v1/settings/test-model").json()["provider"] == "unconfigured"

    restored = client.post(
        "/api/v1/settings",
        json={"model_provider": "qwen", "model_name": "qwen3.8-flash"},
    )
    assert restored.json()["api_key"] == {"configured": True, "last4": "1234"}


def test_changing_document_vision_endpoint_requires_its_own_key(client: TestClient) -> None:
    configured = client.post(
        "/api/v1/settings",
        json={
            "document_vision_provider": "anthropic", "document_vision_model": "claude-sonnet-5",
            "document_vision_api_key": "vision-test-key-5678",
        },
    )
    assert configured.json()["document_vision_api_key"] == {"configured": True, "last4": "5678"}

    changed = client.post(
        "/api/v1/settings",
        json={
            "document_vision_provider": "anthropic", "document_vision_model": "claude-sonnet-5",
            "document_vision_base_url": "https://different.example/v1",
        },
    )
    assert changed.json()["document_vision_api_key"] == {"configured": False, "last4": None}

    restored = client.post(
        "/api/v1/settings",
        json={"document_vision_provider": "anthropic", "document_vision_model": "claude-sonnet-5"},
    )
    assert restored.json()["document_vision_api_key"] == {"configured": True, "last4": "5678"}


def test_legacy_document_vision_identity_survives_underscore_normalization(client: TestClient) -> None:
    first = client.post(
        "/api/v1/settings",
        json={
            "document_vision_provider": "openai-compatible",
            "document_vision_model": "vision-test",
            "document_vision_base_url": "https://vision.example/v1",
            "document_vision_api_key": "vision-test-key-5678",
        },
    )
    assert first.json()["document_vision_api_key"]["configured"] is True
    normalized = client.post(
        "/api/v1/settings",
        json={
            "document_vision_provider": "openai_compatible",
            "document_vision_model": "vision-test",
            "document_vision_base_url": "https://vision.example/v1",
        },
    )
    assert normalized.json()["document_vision_api_key"] == {"configured": True, "last4": "5678"}


def test_legacy_unbound_key_is_bound_to_old_endpoint_before_change(client: TestClient, tmp_path: Path) -> None:
    client.post(
        "/api/v1/settings",
        json={
            "model_provider": "qwen", "model_name": "qwen3.8-flash",
            "model_base_url": "https://first.example/v1", "api_key": "qwen-test-key-1234",
        },
    )
    secret_path = tmp_path / "runtime-secrets.json"
    secret = json.loads(secret_path.read_text(encoding="utf-8"))
    secret.pop("model_base_url")
    secret_path.write_text(json.dumps(secret), encoding="utf-8")

    changed = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "qwen", "model_name": "qwen3.8-flash",
            "model_base_url": "https://second.example/v1",
        },
    )
    assert changed.json()["api_key"]["configured"] is False
    assert json.loads(secret_path.read_text(encoding="utf-8"))["model_base_url"] == "https://first.example/v1"
    restored = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "qwen", "model_name": "qwen3.8-flash",
            "model_base_url": "https://first.example/v1",
        },
    )
    assert restored.json()["api_key"] == {"configured": True, "last4": "1234"}


def test_corrupt_secret_store_returns_safe_chinese_configuration_error(client: TestClient, tmp_path: Path) -> None:
    (tmp_path / "runtime-secrets.json").write_text(
        '{"model_provider":"mock","model_api_key_ciphertext":"bad"}',
        encoding="utf-8",
    )
    response = client.get("/api/v1/settings")
    assert response.status_code == 503
    assert "无法解密" in response.json()["detail"]
    assert "bad" not in response.text


def test_legacy_unscoped_secret_is_safely_treated_as_unconfigured(
    client: TestClient,
    tmp_path: Path,
) -> None:
    (tmp_path / "runtime-secrets.json").write_text(
        '{"model_api_key_ciphertext":"legacy-ciphertext"}',
        encoding="utf-8",
    )

    response = client.get("/api/v1/settings")

    assert response.status_code == 200
    assert response.json()["api_key"] == {"configured": False, "last4": None}


def test_environment_key_takes_precedence_over_runtime_secret(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PAPER_STORAGE_PATH", str(tmp_path / "papers"))
    monkeypatch.setenv("MODEL_PROVIDER", "deepseek")
    monkeypatch.setenv("MODEL_API_KEY", "environment-key-9999")
    from app.config import reset_settings_cache
    from app.secrets import get_model_api_key, save_model_api_key

    reset_settings_cache()
    save_model_api_key("deepseek", "local-key-1234")
    assert get_model_api_key("deepseek") == "environment-key-9999"
    assert get_model_api_key("openai") == ""


def test_environment_can_set_default_visual_model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MODEL_VISION_MODEL", "qwen2.5vl:7b")
    from app.config import AppSettings

    settings = AppSettings(_env_file=None)

    assert settings.model_vision_model == "qwen2.5vl:7b"


def test_deepseek_provider_uses_official_defaults_when_optional_fields_are_empty() -> None:
    from app.providers import make_provider

    provider = make_provider("deepseek", "deepseek-test-key", "  ", "  ", 45)

    assert provider.name == "deepseek"
    assert provider.base_url == "https://api.deepseek.com"
    assert provider.model_name == "deepseek-flash"
    assert provider.supports_vision is True


def test_deepseek_vision_model_name_enables_figure_analysis() -> None:
    from app.providers import DeepSeekProvider, make_provider

    provider = make_provider("deepseek", "deepseek-test-key", "", "deepseek-v4-flash-vision-exp", 45)

    assert isinstance(provider, DeepSeekProvider)
    assert provider.supports_vision is True
    assert provider.model_name == "deepseek-v4-flash-vision-exp"


def test_zhipu_provider_uses_official_defaults_when_optional_fields_are_empty() -> None:
    from app.providers import make_provider

    provider = make_provider("zhipu", "zhipu-test-key", "  ", "  ", 45)

    assert provider.name == "zhipu"
    assert provider.base_url == "https://open.bigmodel.cn/api/paas/v4"
    assert provider.model_name == "glm-5.3"
    assert provider.supports_vision is False


def test_zhipu_provider_without_key_remains_safely_unconfigured() -> None:
    from app.providers import make_provider

    provider = make_provider("zhipu", "", "", "", 45)

    assert provider.name == "unconfigured"
    assert provider.test_connection() == (False, "尚未配置模型 API 密钥")


def test_deepseek_provider_without_key_remains_safely_unconfigured() -> None:
    from app.providers import make_provider

    provider = make_provider("deepseek", "", "", "", 45)

    assert provider.name == "unconfigured"
    assert provider.test_connection() == (False, "尚未配置模型 API 密钥")


def test_openai_provider_uses_official_defaults_when_optional_fields_are_empty() -> None:
    from app.providers import make_provider

    provider = make_provider("openai", "openai-test-key", "  ", "  ", 45)

    assert provider.name == "openai"
    assert provider.base_url == "https://api.openai.com/v1"
    assert provider.model_name == "gpt-6-sol"


def test_openai_provider_without_key_remains_safely_unconfigured() -> None:
    from app.providers import make_provider

    provider = make_provider("openai", "", "", "", 45)

    assert provider.name == "unconfigured"
    assert provider.test_connection() == (False, "尚未配置模型 API 密钥")


def test_ollama_provider_uses_local_defaults_without_api_key() -> None:
    from app.providers import make_provider

    provider = make_provider("ollama", "", "  ", "  ", 60)

    assert provider.name == "ollama"
    assert provider.base_url == "http://host.docker.internal:11434"
    assert provider.model_name == "qwen2.5:7b"
    assert provider.supports_vision is False


def test_ollama_provider_uses_a_separate_vision_model_with_native_images(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import OllamaProvider
    import app.providers as provider_module

    captured: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {
                "message": {
                    "role": "assistant",
                    "content": "## 图表结论\n\n可见容量随循环逐渐下降，具体数值需人工核验。",
                }
            }

    def fake_post(url: str, **kwargs: object) -> FakeResponse:
        captured["url"] = url
        captured.update(kwargs)
        return FakeResponse()

    monkeypatch.setattr(provider_module.httpx, "post", fake_post)
    provider = OllamaProvider(
        "http://ollama.test",
        "qwen2.5:7b",
        60,
        vision_model="qwen2.5vl:3b",
    )
    png = b"\x89PNG\r\n\x1a\nvisual-page"

    result = provider.analyze_visual(
        "P2 cathode",
        "Figure 2. Cycling curves.",
        "Page text",
        png,
    )

    assert provider.supports_vision is True
    assert captured["url"] == "http://ollama.test/api/chat"
    body = captured["json"]
    assert isinstance(body, dict)
    assert body["model"] == "qwen2.5vl:3b"
    assert body["stream"] is False
    assert body["options"]["num_predict"] >= 3000
    message = body["messages"][0]  # type: ignore[index]
    assert message["images"] == [base64.b64encode(png).decode("ascii")]
    assert "Figure 2. Cycling curves." in message["content"]
    assert "不得猜测" in message["content"]
    assert "所有 Markdown 标题和解释正文必须使用简体中文" in message["content"]
    assert result.model_name == "qwen2.5vl:3b"
    assert result.evidence_status == "AI归纳（Ollama 本地图像分析，待原文与图表人工核验）"


def test_visual_analysis_prompt_requires_reviewer_evidence_chain_and_professional_checks() -> None:
    from app.providers import _visual_analysis_prompt

    prompt = _visual_analysis_prompt(
        "Layered oxide cathode",
        "Figure 2. Operando and electrochemical characterization.",
        "图表上下文绑定\n图号：Figure 2\nPDF 页码：4",
    )

    for required in (
        "上下文绑定",
        "正文引用段落",
        "直接证据、间接证据或辅助证据",
        "单凭这张图不能证明什么",
        "联合证据",
        "审稿人",
        "无法确认",
        "## 1. 图中内容与读图方法",
        "## 2. 关键结果",
        "## 3. 深层解析／机制",
        "## 4. 在论文中的论证作用",
        "## 5. 局限与下一步",
        "Markdown 分点短段（-）",
        "**加粗**",
        "不堆砌一般建议",
        "相名 O2、氧分子 O₂ 与氧离子 O²⁻",
        "不输出代码、JSON 或代码围栏",
        "XRD",
        "XPS",
        "XAS",
        "TEM",
        "SEM",
        "CV",
        "GITT",
        "EIS",
    ):
        assert required in prompt

    assert "禁止使用“可能是”猜测坐标" in prompt


def test_decoupling_figure_one_prompt_and_mock_are_explicitly_subfigure_scoped() -> None:
    from app.providers import MockModelProvider, _visual_analysis_prompt

    context = (
        "图表上下文绑定\n图号：Figure 1\nPDF 页码：3\n子图：a, b, c, d\n"
        "正文引用段落：PDF 第 2 页：Figure 1 defines the structural pathway."
    )
    prompt = _visual_analysis_prompt(
        "Decoupling slab gliding and lattice contraction in Na layered oxides",
        "Figure 1. (a) structure; (b) diffraction; (c) lattice; (d) mechanism.",
        context,
    )
    for label in ("### 子图 a", "### 子图 b", "### 子图 c", "### 子图 d"):
        assert label in prompt
    assert "禁止为 Figure 1 整体编造或共用一套横纵坐标" in prompt
    assert "能产生相同观察结果、但机制归因不同的竞争性解释" in prompt
    assert "## 4. 在论文中的论证作用" in prompt

    result = MockModelProvider().analyze_visual(
        "Decoupling slab gliding",
        "Figure 1. (a) structure; (b) diffraction; (c) lattice; (d) mechanism.",
        context,
        b"png",
    )
    for label in ("### 子图 a", "### 子图 b", "### 子图 c", "### 子图 d"):
        assert label in result.analysis_markdown
    assert "Figure 整体论证作用" in result.analysis_markdown


def test_ollama_visual_analysis_retries_once_when_answer_is_english(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import OllamaProvider
    import app.providers as provider_module

    answers = [
        (
            "## Substitution Design and Preparation\n\n"
            "This figure presents the substitution guidelines for sodium layered "
            "oxides, including electronic structure, ionic radius, valence state, "
            "charge, thermodynamic factors, and preparation methodologies. The "
            "caption is repeated in English instead of being explained in Chinese."
        ),
        "## 图表展示对象\n\n该图概括了钠层状氧化物的取代设计原则与制备方法。",
    ]
    requests: list[dict[str, object]] = []

    class FakeResponse:
        def __init__(self, content: str) -> None:
            self.content = content

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {"message": {"content": self.content}}

    def fake_post(_url: str, **kwargs: object) -> FakeResponse:
        requests.append(kwargs)
        return FakeResponse(answers[len(requests) - 1])

    monkeypatch.setattr(provider_module.httpx, "post", fake_post)
    provider = OllamaProvider(
        "http://ollama.test",
        "qwen2.5:7b",
        60,
        vision_model="qwen2.5vl:3b",
    )

    result = provider.analyze_visual(
        "Substitution in sodium layered oxides",
        "Figure 2. Substitution design and preparation.",
        "English page text.",
        b"\x89PNG\r\n\x1a\n",
    )

    assert len(requests) == 2
    retry_body = requests[1]["json"]
    assert isinstance(retry_body, dict)
    assert "上一次回答使用了过多英文" in retry_body["messages"][0]["content"]  # type: ignore[index]
    assert result.analysis_markdown.startswith("## 图表展示对象")


def test_ollama_connection_reports_missing_visual_model_with_pull_command(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import ModelListResult, OllamaProvider

    provider = OllamaProvider(
        "http://ollama.test",
        "qwen2.5:7b",
        60,
        vision_model="qwen2.5vl:3b",
    )
    monkeypatch.setattr(
        provider,
        "list_models",
        lambda: ModelListResult(
            True,
            ["qwen2.5:7b"],
            "已发现 1 个本地模型",
        ),
    )

    ok, message = provider.test_connection()

    assert ok is False
    assert "视觉模型 qwen2.5vl:3b" in message
    assert "ollama pull qwen2.5vl:3b" in message


def test_ollama_visual_analysis_returns_safe_timeout_and_empty_response_errors(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import ModelProviderError, OllamaProvider
    import app.providers as provider_module

    provider = OllamaProvider(
        "http://ollama.test",
        "qwen2.5:7b",
        60,
        vision_model="qwen2.5vl:3b",
    )

    def timeout(*args: object, **kwargs: object) -> None:
        raise provider_module.httpx.ReadTimeout("private upstream detail")

    monkeypatch.setattr(provider_module.httpx, "post", timeout)
    with pytest.raises(ModelProviderError, match="增加调用超时"):
        provider.analyze_visual("paper", "Figure 1", "text", b"png")

    class EmptyResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {"message": {"content": "   "}}

    monkeypatch.setattr(
        provider_module.httpx,
        "post",
        lambda *args, **kwargs: EmptyResponse(),
    )
    with pytest.raises(ModelProviderError, match="未返回可用分析"):
        provider.analyze_visual("paper", "Figure 1", "text", b"png")


def test_ollama_provider_lists_models_and_analyzes_with_native_api(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import ModelListResult, OllamaProvider
    import app.providers as provider_module

    captured: dict[str, object] = {}

    class FakeResponse:
        def __init__(self, payload: dict[str, object]) -> None:
            self.payload = payload
            self.is_success = True
            self.status_code = 200

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return self.payload

    def fake_get(url: str, **kwargs: object) -> FakeResponse:
        captured["get_url"] = url
        captured["get_kwargs"] = kwargs
        return FakeResponse(
            {
                "models": [
                    {"name": "qwen2.5:7b"},
                    {"model": "qwen2.5:3b"},
                ]
            }
        )

    def fake_post(url: str, **kwargs: object) -> FakeResponse:
        captured["post_url"] = url
        captured["post_kwargs"] = kwargs
        prompt = kwargs["json"]["messages"][0]["content"]  # type: ignore[index]
        report_type = "quick_understanding" if "1200–2000" in prompt else "layman_understanding" if "前置知识 → 科学问题" in prompt else "reviewer_analysis"
        report = "三十秒总结" if report_type == "quick_understanding" else "本科生解释" if report_type == "layman_understanding" else "深入分析"
        return FakeResponse(
            {
                "message": {
                    "role": "assistant",
                    "content": json.dumps(
                        {report_type: report},
                        ensure_ascii=False,
                    ),
                }
            }
        )

    monkeypatch.setattr(provider_module.httpx, "get", fake_get)
    monkeypatch.setattr(provider_module.httpx, "post", fake_post)
    provider = OllamaProvider(
        "http://ollama.test/",
        "qwen2.5:7b",
        60,
    )

    models = provider.list_models()
    result = provider.analyze("P2 cathode", "paper text")

    assert models.ok is True
    assert models.models == ["qwen2.5:7b", "qwen2.5:3b"]
    assert captured["get_url"] == "http://ollama.test/api/tags"
    assert captured["post_url"] == "http://ollama.test/api/chat"
    request_body = captured["post_kwargs"]["json"]  # type: ignore[index]
    assert request_body["model"] == "qwen2.5:7b"
    assert request_body["stream"] is False
    assert request_body["format"] == "json"
    assert request_body["options"]["num_predict"] == 11000
    assert request_body["options"]["num_ctx"] == 32768
    assert "3–8 条核心 Claim–Evidence" in request_body["messages"][0]["content"]
    assert "Authorization" not in captured["post_kwargs"].get("headers", {})  # type: ignore[union-attr]
    assert result.summary == "三十秒总结"
    assert result.plain_explanation == "本科生解释"
    assert result.deep_analysis == "深入分析"
    assert result.evidence_status == "AI归纳（Ollama 本地模型，待原文证据核验）"


def test_ollama_connection_reports_missing_selected_model(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import ModelListResult, OllamaProvider

    provider = OllamaProvider(
        "http://ollama.test",
        "qwen2.5:7b",
        60,
    )
    monkeypatch.setattr(
        provider,
        "list_models",
        lambda: ModelListResult(
            True,
            ["qwen2.5:3b"],
            "已发现 1 个本地模型",
        ),
    )

    assert provider.test_connection() == (
        False,
        "已连接 Ollama，但未安装模型 qwen2.5:7b",
    )


def test_ollama_unreachable_service_returns_safe_messages(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import OllamaProvider
    import app.providers as provider_module

    def fail_request(*args: object, **kwargs: object) -> None:
        raise provider_module.httpx.ConnectError("secret internal address")

    monkeypatch.setattr(provider_module.httpx, "get", fail_request)
    monkeypatch.setattr(provider_module.httpx, "post", fail_request)
    provider = OllamaProvider(
        "http://ollama.test",
        "qwen2.5:7b",
        60,
    )

    models = provider.list_models()
    analysis = provider.analyze("paper", "text")

    assert models.ok is False
    assert models.models == []
    assert models.message == "无法连接 Ollama，请确认 Ollama 已启动并检查基础地址"
    assert "secret internal address" not in models.message
    assert analysis.summary.startswith("Ollama 分析失败")
    assert analysis.evidence_status == "尚不确定"


def test_ollama_model_discovery_and_diagnostics_do_not_require_api_key(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import ModelListResult
    import app.routers.settings as main_module

    class FakeOllamaProvider:
        name = "ollama"
        supports_vision = False

        def list_models(self) -> ModelListResult:
            return ModelListResult(
                True,
                ["qwen2.5:7b", "qwen2.5:3b"],
                "已发现 2 个本地模型",
            )

        def test_connection(self) -> tuple[bool, str]:
            return True, "Ollama 已连接，模型 qwen2.5:7b 可用"

    monkeypatch.setattr(
        main_module,
        "make_provider",
        lambda *args, **kwargs: FakeOllamaProvider(),
    )
    saved = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "ollama",
            "model_name": "qwen2.5:7b",
            "model_base_url": "http://host.docker.internal:11434",
        },
    )

    models = client.get("/api/v1/settings/models")
    diagnostics = client.get("/api/v1/diagnostics")

    assert saved.status_code == 200
    assert saved.json()["api_key"] == {"configured": False, "last4": None}
    assert models.status_code == 200
    assert models.json() == {
        "provider": "ollama",
        "ok": True,
        "models": ["qwen2.5:7b", "qwen2.5:3b"],
        "message": "已发现 2 个本地模型",
    }
    assert diagnostics.status_code == 200
    assert diagnostics.json()["model_api"]["status"] == "ok"


def test_model_provider_visual_capabilities_are_explicit() -> None:
    from app.providers import DeepSeekProvider, MockModelProvider

    mock = MockModelProvider()
    assert mock.supports_vision is True
    result = mock.analyze_visual(
        "Paper",
        "Figure 1",
        "page text",
        b"\x89PNG\r\n\x1a\n",
    )
    assert result.evidence_status == "AI推断（Mock 图像演示）"
    assert "上下文绑定" in result.analysis_markdown
    assert "Claim–Evidence" in result.analysis_markdown
    assert "单凭这张图不能证明" in result.analysis_markdown

    deepseek = DeepSeekProvider("test-key", "", "", 45)
    assert deepseek.supports_vision is True


def test_openai_visual_analysis_uses_responses_api_data_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import OpenAIProvider
    import app.providers as provider_module

    captured: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {
                "output": [
                    {
                        "type": "message",
                        "content": [
                            {
                                "type": "output_text",
                                "text": "## 图表结论\n\n未读取无法确认的数据。",
                            }
                        ],
                    }
                ]
            }

    def fake_post(url: str, **kwargs: object) -> FakeResponse:
        captured["url"] = url
        captured.update(kwargs)
        return FakeResponse()

    monkeypatch.setattr(provider_module.httpx, "post", fake_post)
    provider = OpenAIProvider(
        "openai-secret-test-key",
        "",
        "gpt-5.6-terra",
        45,
    )

    result = provider.analyze_visual(
        "Sodium paper",
        "Figure 2",
        "XRD patterns",
        b"\x89PNG\r\n\x1a\n",
    )

    assert captured["url"] == "https://api.openai.com/v1/responses"
    body = captured["json"]
    assert isinstance(body, dict)
    image = body["input"][0]["content"][1]  # type: ignore[index]
    assert image["type"] == "input_image"
    assert image["image_url"].startswith("data:image/png;base64,")
    assert body["store"] is False
    assert "openai-secret-test-key" not in result.analysis_markdown
    assert result.evidence_status.startswith("AI归纳")


def test_openai_visual_analysis_retries_once_when_answer_is_english(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.providers import OpenAIProvider
    import app.providers as provider_module

    answers = [
        (
            "## Cycling Performance\n\nThe figure compares cycling performance "
            "under several test conditions. Capacity retention changes throughout "
            "the experiment, but the exact values should be checked manually."
        ),
        "## 循环性能\n\n该图比较了不同测试条件下的循环性能，具体数值仍需人工核对。",
    ]
    requests: list[dict[str, object]] = []

    class FakeResponse:
        def __init__(self, content: str) -> None:
            self.content = content

        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {"output_text": self.content}

    def fake_post(_url: str, **kwargs: object) -> FakeResponse:
        requests.append(kwargs)
        return FakeResponse(answers[len(requests) - 1])

    monkeypatch.setattr(provider_module.httpx, "post", fake_post)
    provider = OpenAIProvider("test-key", "", "vision-model", 45)

    result = provider.analyze_visual(
        "Cycling paper",
        "Figure 3. Cycling performance.",
        "English page text.",
        b"\x89PNG\r\n\x1a\n",
    )

    assert len(requests) == 2
    retry_body = requests[1]["json"]
    assert isinstance(retry_body, dict)
    retry_text = retry_body["input"][0]["content"][0]["text"]  # type: ignore[index]
    assert "上一次回答使用了过多英文" in retry_text
    assert result.analysis_markdown.startswith("## 循环性能")


def test_pdf_upload_extracts_and_deduplicates(client: TestClient) -> None:
    payload = pdf_bytes("P2 layered oxide sodium ion battery")
    first = client.post("/api/v1/papers/upload", files={"file": ("paper.pdf", io.BytesIO(payload), "application/pdf")})
    assert first.status_code == 201
    paper = first.json()
    assert paper["page_count"] == 1
    assert "P2 layered oxide" in paper["extracted_text"]
    assert paper["parse_confidence"] > 0

    duplicate = client.post("/api/v1/papers/upload", files={"file": ("paper.pdf", io.BytesIO(payload), "application/pdf")})
    assert duplicate.status_code == 409
    assert "重复" in duplicate.json()["detail"]["message"]
    assert duplicate.json()["detail"]["paper_id"] == paper["id"]


def test_uploaded_pdf_figure_thumbnail_returns_original_crop_or_404(client: TestClient, tmp_path: Path) -> None:
    document = fitz.open()
    page = document.new_page(width=612, height=792)
    page.insert_text((72, 72), "Embedded research figure")
    figure = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 500, 300), 0)
    figure.clear_with(0x2288AA)
    page.insert_image(fitz.Rect(55, 160, 555, 460), pixmap=figure)
    payload = document.tobytes()
    document.close()
    uploaded = client.post("/api/v1/papers/upload", files={"file": ("figure.pdf", io.BytesIO(payload), "application/pdf")})
    assert uploaded.status_code == 201
    paper_id = uploaded.json()["id"]

    response = client.get(f"/api/v1/papers/{paper_id}/figure-thumbnail")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content.startswith(b"\x89PNG\r\n\x1a\n")
    cache_dir = tmp_path / "papers" / "cache" / "paper-thumbnails"
    assert list(cache_dir.glob("*.png"))

    blank = client.post("/api/v1/papers/upload", files={"file": ("blank.pdf", io.BytesIO(pdf_bytes("No embedded figure")), "application/pdf")})
    assert blank.status_code == 201
    assert client.get(f"/api/v1/papers/{blank.json()['id']}/figure-thumbnail").status_code == 404
    deleted = client.request("DELETE", f"/api/v1/papers/{paper_id}", json={"confirmation_title": "figure"})
    assert deleted.status_code == 200
    assert not list(cache_dir.glob("*.png"))


def test_pdf_upload_populates_local_list_metadata(client: TestClient) -> None:
    payload = pdf_bytes(
        """Comprehensive Review of Power System Flexibility
This article has been accepted for publication in IEEE Access.
Published online: May 22, 2024
DOI 10.1109/ACCESS.2024.1234567
INDEX TERMS Power system flexibility, Energy storage"""
    )

    response = client.post(
        "/api/v1/papers/upload",
        files={"file": ("review.pdf", io.BytesIO(payload), "application/pdf")},
    )

    assert response.status_code == 201
    paper = response.json()
    assert paper["doi"] == "10.1109/access.2024.1234567"
    assert paper["journal"] == "IEEE Access"
    assert paper["published_date"] == "2024"
    assert paper["keywords"] == ["电力系统灵活性", "储能"]
    assert paper["article_type"] == "综述"


def test_papers_are_paginated_in_deterministic_order(client: TestClient) -> None:
    first = client.post("/api/v1/papers/upload", files={"file": ("first.pdf", io.BytesIO(pdf_bytes("first")), "application/pdf")}).json()
    second = client.post("/api/v1/papers/upload", files={"file": ("second.pdf", io.BytesIO(pdf_bytes("second")), "application/pdf")}).json()
    response = client.get("/api/v1/papers?page=1&page_size=1")
    assert response.status_code == 200
    assert response.json()["total"] == 2
    assert response.json()["items"][0]["id"] == second["id"]
    assert first["id"] != second["id"]


def test_paper_manual_state_persists_in_list_and_detail(client: TestClient) -> None:
    uploaded = client.post(
        "/api/v1/papers/upload",
        files={"file": ("state.pdf", io.BytesIO(pdf_bytes("state")), "application/pdf")},
    ).json()

    assert uploaded["is_favorite"] is False
    assert uploaded["is_read"] is False

    updated = client.patch(
        f"/api/v1/papers/{uploaded['id']}/state",
        json={"is_favorite": True, "is_read": True},
    )

    assert updated.status_code == 200
    assert updated.json()["is_favorite"] is True
    assert updated.json()["is_read"] is True
    listed = client.get("/api/v1/papers").json()["items"][0]
    detail = client.get(f"/api/v1/papers/{uploaded['id']}").json()["paper"]
    assert (listed["is_favorite"], listed["is_read"]) == (True, True)
    assert (detail["is_favorite"], detail["is_read"]) == (True, True)


def test_request_validation_error_uses_clear_chinese_detail(client: TestClient) -> None:
    response = client.get("/api/v1/papers?page=0")
    assert response.status_code == 422
    assert "请求参数不合法" in response.json()["detail"]


def test_scanned_or_empty_pdf_is_not_marked_fulltext(client: TestClient) -> None:
    uploaded = client.post("/api/v1/papers/upload", files={"file": ("scan.pdf", io.BytesIO(pdf_bytes("")), "application/pdf")})
    assert uploaded.status_code == 201
    assert uploaded.json()["fulltext_status"] == "仅元数据或摘要"


def test_invalid_upload_has_chinese_error(client: TestClient) -> None:
    response = client.post("/api/v1/papers/upload", files={"file": ("bad.pdf", io.BytesIO(b"not a pdf"), "application/pdf")})
    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]


def test_mock_analysis_is_labelled_as_inference(client: TestClient) -> None:
    uploaded = client.post("/api/v1/papers/upload", files={"file": ("paper.pdf", io.BytesIO(pdf_bytes()), "application/pdf")}).json()
    response = client.post(f"/api/v1/papers/{uploaded['id']}/analysis/quick_understanding")
    assert response.status_code == 200
    assert response.json()["evidence_status"] == "AI推断（Mock 演示）"
    detail = client.get(f"/api/v1/papers/{uploaded['id']}").json()
    assert detail["analysis"]["quick_understanding"]


def test_note_onboarding_and_diagnostics(client: TestClient) -> None:
    uploaded = client.post("/api/v1/papers/upload", files={"file": ("paper.pdf", io.BytesIO(pdf_bytes()), "application/pdf")}).json()
    assert client.put(f"/api/v1/papers/{uploaded['id']}/note", json={"content": "重点阅读图 2"}).status_code == 200
    assert client.post("/api/v1/onboarding/complete", json={"study_mode": "科研助手", "research_topics": ["钠离子电池"], "keywords": ["P2"]}).status_code == 200
    diagnostics = client.get("/api/v1/diagnostics")
    assert diagnostics.status_code == 200
    assert diagnostics.json()["database"]["status"] == "ok"


def test_diagnostics_marks_configured_but_unreachable_model_as_error(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FailedProvider:
        def test_connection(self) -> tuple[bool, str]:
            return False, "无法连接模型服务，请检查基础地址、密钥和网络"

    import app.routers.settings as main_module

    monkeypatch.setattr(
        main_module,
        "make_provider",
        lambda *_args, **_kwargs: FailedProvider(),
    )
    saved = client.post(
        "/api/v1/settings",
        json={
            "model_provider": "deepseek",
            "model_name": "deepseek-test",
            "model_base_url": "https://api.deepseek.com",
            "api_key": "configured-secret-1234",
        },
    )
    assert saved.status_code == 200

    response = client.get("/api/v1/diagnostics")

    assert response.status_code == 200
    assert response.json()["model_api"]["status"] == "error"
    assert "configured-secret-1234" not in response.text
