import { describe, expect, it } from "vitest";
import { applyDocumentVisionPreset, applyProviderPreset, credentialForSelectedProvider, describeCredential, modelConfigurationSaved, nextOnboardingPath, paperItems, providerNeedsApiKey, toSettingsPayload } from "../lib/presentation";
import { MODEL_PROVIDERS, modelChoices } from "../lib/modelCatalog";
import { errorDetail } from "../lib/api";

describe("describeCredential", () => {
  it("only exposes configured state and final four characters", () => {
    expect(describeCredential({ configured: true, last4: "a9Z2" })).toBe("已配置（末尾 a9Z2）");
  });

  it("never renders a value when no key is configured", () => {
    expect(describeCredential({ configured: false, last4: "secret" })).toBe("未配置");
  });
});

describe("nextOnboardingPath", () => {
  it("routes incomplete profiles to setup", () => {
    expect(nextOnboardingPath(false)).toBe("/onboarding");
  });

  it("keeps initialized profiles on the dashboard", () => {
    expect(nextOnboardingPath(true)).toBe("/dashboard");
  });
});

describe("toSettingsPayload", () => {
  it("uses the backend contract and includes a newly entered key only once", () => {
    expect(toSettingsPayload({
      model_provider: "openai_compatible", model_name: "gpt-test", vision_model: "", model_base_url: "https://example.test/v1",
      api_key: "one-time-secret", timeout_seconds: "45", backup_model: "fallback", paper_budget: "1.2", daily_budget: "3", monthly_budget: "20"
    })).toEqual({
      model_provider: "openai_compatible", model_name: "gpt-test", vision_model: "", model_base_url: "https://example.test/v1",
      api_key: "one-time-secret", timeout_seconds: 45, backup_model: "fallback", paper_budget: 1.2, daily_budget: 3, monthly_budget: 20
    });
  });

  it("omits an empty key instead of overwriting backend configuration", () => {
    const payload = toSettingsPayload({ model_provider: "mock", model_name: "", vision_model: "", model_base_url: "", api_key: "", timeout_seconds: "60", backup_model: "", paper_budget: "0", daily_budget: "0", monthly_budget: "0" });
    expect(payload).not.toHaveProperty("api_key");
  });
});

describe("applyProviderPreset", () => {
  const form = {
    model_provider: "openai_compatible", model_name: "custom-model", vision_model: "custom-vision", model_base_url: "https://example.test/v1",
    api_key: "pending-secret", timeout_seconds: "60", backup_model: "custom-backup", paper_budget: "0", daily_budget: "0", monthly_budget: "0"
  };

  it("fills the official DeepSeek endpoint and current model names", () => {
    expect(applyProviderPreset(form, "deepseek")).toMatchObject({
      model_provider: "deepseek",
      model_name: "deepseek-flash",
      vision_model: "",
      model_base_url: "https://api.deepseek.com",
      backup_model: "deepseek-v4-pro"
    });
  });

  it("fills the official Zhipu GLM endpoint and current model names", () => {
    expect(applyProviderPreset(form, "zhipu")).toMatchObject({
      model_provider: "zhipu",
      model_name: "glm-5.3",
      vision_model: "",
      model_base_url: "https://open.bigmodel.cn/api/paas/v4",
      backup_model: "glm-5.3-flash"
    });
  });

  it("fills the official OpenAI endpoint and current model names", () => {
    expect(applyProviderPreset(form, "openai")).toMatchObject({
      model_provider: "openai",
      model_name: "gpt-6-sol",
      vision_model: "",
      model_base_url: "https://api.openai.com/v1",
      backup_model: "gpt-6-luna"
    });
  });

  it("resets model fields when selecting the local Mock provider", () => {
    expect(applyProviderPreset(form, "mock")).toMatchObject({
      model_provider: "mock",
      model_name: "mock-research-copilot",
      vision_model: "",
      model_base_url: "",
      backup_model: ""
    });
  });

  it("fills the Windows Docker Ollama endpoint and recommended local models", () => {
    expect(applyProviderPreset(form, "ollama")).toMatchObject({
      model_provider: "ollama",
      model_name: "qwen2.5:7b",
      vision_model: "qwen2.5vl:3b",
      model_base_url: "http://host.docker.internal:11434",
      backup_model: "qwen2.5:3b"
    });
  });

  it("keeps custom fields when selecting the generic compatible provider", () => {
    const deepseekForm = { ...form, model_provider: "deepseek" as const };

    expect(applyProviderPreset(deepseekForm, "openai_compatible")).toEqual({
      ...deepseekForm,
      model_provider: "openai_compatible",
      api_key: ""
    });
  });

  it("clears a pending key when switching to another cloud supplier", () => {
    expect(applyProviderPreset(form, "qwen")).toMatchObject({
      model_provider: "qwen", model_name: "qwen3.8-flash", api_key: ""
    });
  });
});

describe("document vision provider", () => {
  it("selects only catalogued image-input models and clears a pending key", () => {
    const current = { document_vision_provider: "openai_compatible", document_vision_model: "custom", document_vision_base_url: "https://example.test/v1", document_vision_timeout_seconds: "90", document_vision_api_key: "pending-secret" };
    expect(applyDocumentVisionPreset(current, "minimax")).toMatchObject({ document_vision_model: "MiniMax-M3", document_vision_api_key: "" });
    expect(modelChoices("minimax", true).map(item => item.value)).toEqual(["MiniMax-M3"]);
    expect(modelChoices("openrouter", true)).toEqual([]);
  });

  it("retains custom endpoint and model when returning to the compatible provider", () => {
    const current = { document_vision_provider: "qwen", document_vision_model: "my-vision", document_vision_base_url: "https://example.test/v1", document_vision_timeout_seconds: "90", document_vision_api_key: "pending-secret" };
    expect(applyDocumentVisionPreset(current, "openai_compatible")).toMatchObject({ document_vision_model: "my-vision", document_vision_base_url: "https://example.test/v1", document_vision_api_key: "" });
  });

  it("offers each backend supplier and a custom provider", () => {
    expect(MODEL_PROVIDERS.map(item => item.value)).toContain("siliconflow");
    expect(MODEL_PROVIDERS.map(item => item.value)).toContain("openai_compatible");
  });
});

describe("providerNeedsApiKey", () => {
  it("treats Mock and Ollama as keyless providers", () => {
    expect(providerNeedsApiKey("mock")).toBe(false);
    expect(providerNeedsApiKey("ollama")).toBe(false);
    expect(providerNeedsApiKey("deepseek")).toBe(true);
    expect(providerNeedsApiKey("openai")).toBe(true);
  });
});

describe("credentialForSelectedProvider", () => {
  it("does not show the saved provider key after switching providers", () => {
    const saved = { configured: true, last4: "9577" };

    expect(credentialForSelectedProvider("openai", "openai", saved)).toEqual(saved);
    expect(credentialForSelectedProvider("openai", "deepseek", saved)).toEqual({
      configured: false,
      last4: null
    });
  });
});

describe("saved model indicator", () => {
  const form = { model_provider: "deepseek", model_name: "deepseek-v4-pro", model_base_url: "https://api.deepseek.com", api_key: "", vision_model: "", timeout_seconds: "60", backup_model: "", paper_budget: "0", daily_budget: "0", monthly_budget: "0" };

  it("lights only for the saved cloud provider, endpoint and model with a configured key", () => {
    const saved = { model_provider: "deepseek", model_name: "deepseek-v4-pro", model_base_url: "https://api.deepseek.com", api_key: { configured: true, last4: "1234" } };
    expect(modelConfigurationSaved(saved, form)).toBe(true);
    expect(modelConfigurationSaved(saved, { ...form, model_name: "deepseek-flash" })).toBe(false);
    expect(modelConfigurationSaved(saved, { ...form, model_base_url: "https://other.example/v1" })).toBe(false);
    expect(modelConfigurationSaved(saved, { ...form, api_key: "new-key" })).toBe(false);
    expect(modelConfigurationSaved({ ...saved, api_key: { configured: false } }, form)).toBe(false);
  });

  it("treats loaded Mock and Ollama settings as saved without a key", () => {
    expect(modelConfigurationSaved(undefined, { ...form, model_provider: "mock" })).toBe(false);
    expect(modelConfigurationSaved({ model_provider: "mock", model_name: "mock-research-copilot", model_base_url: "" }, { ...form, model_provider: "mock", model_name: "mock-research-copilot", model_base_url: "" })).toBe(true);
    expect(modelConfigurationSaved({ model_provider: "ollama", model_name: "qwen2.5:7b", model_base_url: "http://host.docker.internal:11434" }, { ...form, model_provider: "ollama", model_name: "qwen2.5:7b", model_base_url: "http://host.docker.internal:11434" })).toBe(true);
  });
});

describe("paperItems", () => {
  it("uses the paginated items field instead of assuming a bare array", () => {
    expect(paperItems({ items: [{ id: "p1", title: "Paper" }] })).toEqual([{ id: "p1", title: "Paper" }]);
  });
});

describe("errorDetail", () => {
  it("shows an object-form duplicate message supplied by the backend", () => {
    expect(errorDetail({ detail: { message: "该论文已存在", paper_id: "p-1" } }, 409)).toBe("该论文已存在");
  });

  it("continues to show a string-form backend detail", () => {
    expect(errorDetail({ detail: "PDF 文件无效" }, 422)).toBe("PDF 文件无效");
  });
});
