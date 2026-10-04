export type ModelChoice = { value: string; label: string };
export type ProviderChoice = {
  value: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  backupModel?: string;
  models: ModelChoice[];
  visionModels: ModelChoice[];
};

const choices = (...names: string[]): ModelChoice[] => names.map(value => ({ value, label: value }));

// IDs and image-input support are taken from each provider's API model documentation.
// Accounts, regions and endpoints can differ; the model and URL fields remain editable.
export const MODEL_PROVIDERS: ProviderChoice[] = [
  { value: "mock", label: "Mock（无密钥演示）", baseUrl: "", defaultModel: "mock-research-copilot", models: choices("mock-research-copilot"), visionModels: [] },
  { value: "ollama", label: "Ollama（本地）", baseUrl: "http://host.docker.internal:11434", defaultModel: "qwen2.5:7b", backupModel: "qwen2.5:3b", models: choices("qwen2.5:7b", "qwen2.5:3b"), visionModels: choices("qwen2.5vl:3b") },
  { value: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com", defaultModel: "deepseek-flash", backupModel: "deepseek-v4-pro", models: [{ value: "deepseek-flash", label: "DeepSeek Flash（V4.1）" }, { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro" }], visionModels: [{ value: "deepseek-flash", label: "DeepSeek Flash（V4.1）" }] },
  { value: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-6-sol", backupModel: "gpt-6-luna", models: choices("gpt-6-astra", "gpt-6-sol", "gpt-6-luna", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna", "gpt-4.1"), visionModels: choices("gpt-6-astra", "gpt-6-sol", "gpt-6-luna", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna", "gpt-4.1") },
  { value: "anthropic", label: "Anthropic Claude", baseUrl: "https://api.anthropic.com/v1", defaultModel: "claude-sonnet-5", models: choices("claude-fable-5-1", "claude-opus-5-5", "claude-sonnet-5", "claude-haiku-4-5-20251001"), visionModels: choices("claude-fable-5-1", "claude-opus-5-5", "claude-sonnet-5", "claude-haiku-4-5-20251001") },
  { value: "gemini", label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", defaultModel: "gemini-3.8-flash", models: choices("gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-pro-preview"), visionModels: choices("gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-pro-preview") },
  { value: "qwen", label: "阿里百炼 · 千问", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", defaultModel: "qwen3.8-flash", models: choices("qwen3.8-max", "qwen3.8-flash", "qwen3.7-plus", "qwen3.7-flash"), visionModels: choices("qwen3.8-max", "qwen3.8-flash", "qwen3.7-plus", "qwen3.7-flash") },
  { value: "zhipu", label: "智谱 GLM", baseUrl: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-5.3", backupModel: "glm-5.3-flash", models: choices("glm-5.3", "glm-5.3-flash", "glm-5.3-flashx", "glm-5.2"), visionModels: choices("glm-5.3-flash", "glm-5.3-flashx") },
  { value: "moonshot", label: "Kimi · Moonshot", baseUrl: "https://api.moonshot.cn/v1", defaultModel: "kimi-k3", models: choices("kimi-k3", "kimi-k2.6"), visionModels: choices("kimi-k3", "kimi-k2.6") },
  { value: "volcengine", label: "火山方舟 · 豆包", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", defaultModel: "doubao-seed-2-1-lite-260915", models: choices("doubao-seed-2-1-pro-260915", "doubao-seed-2-1-lite-260915", "doubao-seed-2-1-turbo-260628"), visionModels: choices("doubao-seed-2-1-pro-260915", "doubao-seed-2-1-lite-260915", "doubao-seed-2-1-turbo-260628") },
  { value: "minimax", label: "MiniMax", baseUrl: "https://api.minimax.cn/v1", defaultModel: "MiniMax-M3", models: choices("MiniMax-M3", "MiniMax-M2.7", "MiniMax-M2.7-highspeed"), visionModels: choices("MiniMax-M3") },
  { value: "hunyuan", label: "腾讯 TokenHub · 混元", baseUrl: "https://tokenhub.tencentmaas.com/v1", defaultModel: "hy4-preview", models: choices("hy4-preview", "hy3"), visionModels: choices("hy-vision-2.0-instruct") },
  { value: "qianfan", label: "百度千帆", baseUrl: "https://qianfan.baidubce.com/v2", defaultModel: "ernie-5.0", models: choices("ernie-5.0"), visionModels: choices("ernie-5.0") },
  { value: "siliconflow", label: "硅基流动 SiliconFlow", baseUrl: "https://api.siliconflow.cn/v1", defaultModel: "", models: [], visionModels: [] },
  { value: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", defaultModel: "~openai/gpt-sol-latest", models: choices("~openai/gpt-sol-latest", "~anthropic/claude-sonnet-latest"), visionModels: [] },
  { value: "xai", label: "xAI", baseUrl: "https://api.x.ai/v1", defaultModel: "grok-4.7", models: choices("grok-4.7"), visionModels: choices("grok-4.7") },
  { value: "mistral", label: "Mistral AI", baseUrl: "https://api.mistral.ai/v1", defaultModel: "mistral-medium-3-5", models: choices("mistral-medium-3-5", "mistral-small-2603", "mistral-large-2512", "ministral-14b-2512"), visionModels: choices("mistral-medium-3-5", "mistral-large-2512", "ministral-14b-2512") },
  { value: "openai_compatible", label: "自定义 OpenAI 兼容接口", baseUrl: "", defaultModel: "", models: [], visionModels: [] }
];

export function providerChoice(provider: string): ProviderChoice | undefined {
  return MODEL_PROVIDERS.find(item => item.value === provider);
}

export function modelChoices(provider: string, vision = false, discovered: string[] = []): ModelChoice[] {
  const catalog = providerChoice(provider);
  const listed = vision ? catalog?.visionModels ?? [] : catalog?.models ?? [];
  const seen = new Set(listed.map(item => item.value));
  return [...listed, ...discovered.filter(value => !seen.has(value)).map(value => ({ value, label: value }))];
}
