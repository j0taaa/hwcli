import { afterEach, expect, mock, test } from "bun:test"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import type { Config } from "@opencode-ai/plugin"

import { server } from "../src/server"

const pluginInput = {} as never
const originalFetch = globalThis.fetch
const originalCatalogCache = process.env.OPENCODE_MAAS_CATALOG_CACHE

const huaweiMaas = {
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

const catalog = {
  endpoints: {
    openaiCompatible: "https://api-ap-southeast-1.modelarts-maas.com/openai/v1",
  },
  models: [
    {
      name: "DeepSeek-V4-Pro",
      id: "deepseek-v4-pro",
      pricing: {
        input: [{ tokenPriceUsdPerMillion: 1.617 }],
        output: [{ tokenPriceUsdPerMillion: 3.235 }],
      },
      limits: {
        contextWindowTokens: 1_000_000,
        maxInputTokens: 1_000_000,
        maxOutputTokens: 128_000,
        maxReasoningTokens: 96_000,
      },
      modalities: { input: ["text"], output: ["text"] },
      cache: false,
    },
    {
      name: "GLM-5.2",
      id: "glm-5.2",
      pricing: {
        input: [{ tokenPriceUsdPerMillion: 1.4 }],
        output: [{ tokenPriceUsdPerMillion: 4.2 }],
      },
      limits: {
        contextWindowTokens: 198_000,
        maxInputTokens: 192_000,
        maxOutputTokens: 128_000,
        maxReasoningTokens: 128_000,
      },
      modalities: { input: ["text", "image"], output: ["text"] },
      cache: false,
    },
  ],
}

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalCatalogCache === undefined) {
    delete process.env.OPENCODE_MAAS_CATALOG_CACHE
    return
  }
  process.env.OPENCODE_MAAS_CATALOG_CACHE = originalCatalogCache
})

async function withCatalogCache() {
  process.env.OPENCODE_MAAS_CATALOG_CACHE = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "opencode-maas-test-")), "catalog.json")
}

function mockCatalog(value: unknown, init: ResponseInit = { status: 200 }) {
  globalThis.fetch = mock(() => Promise.resolve(new Response(JSON.stringify(value), init))) as typeof fetch
}

function makeConfig(overrides: NonNullable<Config["provider"]> = {}) {
  return {
    provider: overrides,
  } as Config
}

async function applyHook(config: Config) {
  const hooks = await server(pluginInput)
  await hooks.config?.(config)
}

test("injects catalog models into an empty config", async () => {
  mockCatalog(catalog)
  await withCatalogCache()
  const config = makeConfig()

  await applyHook(config)

  expect(config.provider?.["huawei-maas"]?.whitelist).toEqual(["deepseek-v4-pro", "glm-5.2"])
  expect(Object.keys(config.provider?.["huawei-maas"]?.models ?? {})).toEqual(["deepseek-v4-pro", "glm-5.2"])
  expect(config.provider?.["huawei-maas"]?.models?.["deepseek-v4-pro"]).toEqual({
    id: "deepseek-v4-pro",
    name: "DeepSeek-V4-Pro",
    family: "deepseek-v4",
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    interleaved: { field: "reasoning_content" },
    cost: { input: 1.617, output: 3.235 },
    limit: { context: 1_000_000, input: 1_000_000, output: 128_000 },
    modalities: { input: ["text"], output: ["text"] },
  })
  expect(config.provider?.["huawei-maas"]?.models?.["glm-5.2"]?.attachment).toBe(true)
  expect(config.provider?.["huawei-maas"]?.models?.["glm-5.2"]?.cost).toEqual({ input: 1.4, output: 4.2 })
})

test("writes successful catalog responses to the local fallback cache", async () => {
  mockCatalog(catalog)
  await withCatalogCache()
  const config = makeConfig()

  await applyHook(config)

  expect(await Bun.file(process.env.OPENCODE_MAAS_CATALOG_CACHE).json()).toEqual(catalog)
})

test("falls back to the last cached catalog when the catalog request fails", async () => {
  await withCatalogCache()
  await Bun.write(process.env.OPENCODE_MAAS_CATALOG_CACHE, JSON.stringify(catalog))
  globalThis.fetch = mock(() => Promise.reject(new Error("offline"))) as unknown as typeof fetch
  const config = makeConfig()

  await applyHook(config)

  expect(config.provider?.["huawei-maas"]?.whitelist).toEqual(["deepseek-v4-pro", "glm-5.2"])
  expect(Object.keys(config.provider?.["huawei-maas"]?.models ?? {})).toEqual(["deepseek-v4-pro", "glm-5.2"])
})

test("falls back to bundled models when the catalog request fails", async () => {
  await withCatalogCache()
  globalThis.fetch = mock(() => Promise.reject(new Error("offline"))) as unknown as typeof fetch
  const config = makeConfig()

  await applyHook(config)

  expect(config.provider?.["huawei-maas"]).toEqual(huaweiMaas)
  expect(Object.keys(config.provider?.["huawei-maas"]?.models ?? {})).toEqual([
    "deepseek-v3.2",
    "deepseek-v3.1-terminus",
    "DeepSeek-V3",
    "glm-5",
    "glm-5.1",
    "deepseek-r1-250528",
  ])
})

test("preserves unrelated providers unchanged", async () => {
  mockCatalog(catalog)
  const config = makeConfig({
    anthropic: {
      name: "Anthropic",
      env: ["ANTHROPIC_API_KEY"],
      options: { apiKey: "existing-key" },
    },
  })
  const snapshot = structuredClone(config.provider?.anthropic)

  await applyHook(config)

  expect(config.provider?.anthropic).toEqual(snapshot)
})

test("preserves existing huawei-maas fields while filling missing defaults", async () => {
  mockCatalog(catalog)
  const config = makeConfig({
    "huawei-maas": {
      name: "Custom Huawei",
      env: ["CUSTOM_ENV"],
      whitelist: ["glm-5.2"],
      options: { apiKey: "custom-key" },
      models: {
        "glm-5.2": {
          name: "Custom GLM",
          limit: { output: 1 },
        },
      },
    },
  })

  await applyHook(config)

  expect(config.provider?.["huawei-maas"]?.name).toBe("Custom Huawei")
  expect(config.provider?.["huawei-maas"]?.env).toEqual(["CUSTOM_ENV"])
  expect(config.provider?.["huawei-maas"]?.whitelist).toEqual(["glm-5.2"])
  expect(config.provider?.["huawei-maas"]?.options).toEqual({ apiKey: "custom-key" })
  expect(config.provider?.["huawei-maas"]?.models?.["glm-5.2"]?.name).toBe("Custom GLM")
  expect(config.provider?.["huawei-maas"]?.models?.["glm-5.2"]?.limit).toEqual({
    context: 198_000,
    input: 192_000,
    output: 1,
  })
  expect(config.provider?.["huawei-maas"]?.models?.["glm-5.2"]?.family).toBe("glm-5")
})

test("injects the provider without needing HUAWEI_CLOUD_MAAS_API_KEY", async () => {
  mockCatalog(catalog)
  const config = makeConfig()

  await applyHook(config)

  expect(config.provider?.["huawei-maas"]?.env).toEqual(["HUAWEI_CLOUD_MAAS_API_KEY"])
  expect(config.provider?.["huawei-maas"]?.models?.["deepseek-v4-pro"]?.reasoning).toBe(true)
})

test("package engines require opencode >= 1.14.28", async () => {
  const packageJson = (await Bun.file(new URL("../package.json", import.meta.url)).json()) as {
    engines?: { opencode?: string }
  }

  expect(packageJson.engines?.opencode).toBe(">=1.14.28")
})
