import type { Config, Plugin } from "@opencode-ai/plugin"

type ProviderConfig = NonNullable<Config["provider"]>[string]

const provider = {
  id: "huawei-maas",
  name: "Huawei Cloud MaaS",
  env: ["HUAWEI_CLOUD_MAAS_API_KEY"],
  npm: "@ai-sdk/openai-compatible",
  api: "https://api-ap-southeast-1.modelarts-maas.com/openai/v1",
  models: {
    "deepseek-v3.2": {
      id: "deepseek-v3.2",
      name: "deepseek-v3.2",
      family: "deepseek-v3",
      release_date: "2026-04-23",
      attachment: false,
      reasoning: true,
      temperature: true,
      tool_call: true,
      interleaved: { field: "reasoning_content" },
      limit: { context: 160_000, input: 128_000, output: 32_000 },
      modalities: { input: ["text"], output: ["text"] },
    },
    "deepseek-v3.1-terminus": {
      id: "deepseek-v3.1-terminus",
      name: "deepseek-v3.1-terminus",
      family: "deepseek-v3",
      release_date: "2026-04-23",
      attachment: false,
      reasoning: true,
      temperature: true,
      tool_call: true,
      interleaved: { field: "reasoning_content" },
      limit: { context: 128_000, input: 96_000, output: 32_000 },
      modalities: { input: ["text"], output: ["text"] },
    },
    "DeepSeek-V3": {
      id: "DeepSeek-V3",
      name: "DeepSeek-V3",
      family: "deepseek-v3",
      release_date: "2026-04-23",
      attachment: false,
      reasoning: false,
      temperature: true,
      tool_call: true,
      limit: { context: 128_000, input: 128_000, output: 32_000 },
      modalities: { input: ["text"], output: ["text"] },
    },
    "glm-5": {
      id: "glm-5",
      name: "glm-5",
      family: "glm-5",
      release_date: "2026-04-23",
      attachment: false,
      reasoning: true,
      temperature: true,
      tool_call: true,
      interleaved: { field: "reasoning_content" },
      limit: { context: 198_000, input: 192_000, output: 64_000 },
      modalities: { input: ["text"], output: ["text"] },
    },
    "glm-5.1": {
      id: "glm-5.1",
      name: "glm-5.1",
      family: "glm-5",
      release_date: "2026-04-23",
      attachment: false,
      reasoning: true,
      temperature: true,
      tool_call: true,
      interleaved: { field: "reasoning_content" },
      limit: { context: 198_000, input: 192_000, output: 128_000 },
      modalities: { input: ["text"], output: ["text"] },
    },
    "deepseek-r1-250528": {
      id: "deepseek-r1-250528",
      name: "deepseek-r1-250528",
      family: "deepseek-r1",
      release_date: "2026-04-23",
      attachment: false,
      reasoning: true,
      temperature: true,
      tool_call: true,
      interleaved: { field: "reasoning_content" },
      limit: { context: 128_000, input: 96_000, output: 32_000 },
      modalities: { input: ["text"], output: ["text"] },
    },
  },
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function mergeDefaults<T extends Record<string, unknown>>(defaults: T, current?: Record<string, unknown>): T {
  if (!current) return structuredClone(defaults)
  const next: Record<string, unknown> = { ...current }

  for (const [key, value] of Object.entries(defaults)) {
    const existing = next[key]
    if (existing === undefined) {
      next[key] = structuredClone(value)
      continue
    }
    if (isRecord(value) && isRecord(existing)) {
      next[key] = mergeDefaults(value, existing)
    }
  }

  return next as T
}

export const server: Plugin = async () => ({
  config: async (input) => {
    input.provider ??= {}
    input.provider[provider.id] = mergeDefaults(provider as Record<string, unknown>, input.provider[provider.id]) as ProviderConfig
  },
})

export default server
