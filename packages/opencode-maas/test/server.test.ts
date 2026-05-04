import { expect, test } from "bun:test"

import type { Config } from "@opencode-ai/plugin"

import { server } from "../src/server"

const pluginInput = {} as never

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

function makeConfig(overrides: NonNullable<Config["provider"]> = {}) {
  return {
    provider: overrides,
  } as Config
}

async function applyHook(config: Config) {
  const hooks = await server(pluginInput)
  await hooks.config?.(config)
}

test("injects the full huawei-maas provider into an empty config", async () => {
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
  const config = makeConfig({
    "huawei-maas": {
      name: "Custom Huawei",
      env: ["CUSTOM_ENV"],
      options: { apiKey: "custom-key" },
      models: {
        "glm-5": {
          name: "Custom GLM",
          limit: { output: 1 },
        },
      },
    },
  })

  await applyHook(config)

  expect(config.provider?.["huawei-maas"]?.name).toBe("Custom Huawei")
  expect(config.provider?.["huawei-maas"]?.env).toEqual(["CUSTOM_ENV"])
  expect(config.provider?.["huawei-maas"]?.options).toEqual({ apiKey: "custom-key" })
  expect(config.provider?.["huawei-maas"]?.models?.["glm-5"]?.name).toBe("Custom GLM")
  expect(config.provider?.["huawei-maas"]?.models?.["glm-5"]?.limit).toEqual({
    context: 198_000,
    input: 192_000,
    output: 1,
  })
  expect(config.provider?.["huawei-maas"]?.models?.["glm-5"]?.family).toBe("glm-5")
})

test("injects the provider without needing HUAWEI_CLOUD_MAAS_API_KEY", async () => {
  const config = makeConfig()

  await applyHook(config)

  expect(config.provider?.["huawei-maas"]?.env).toEqual(["HUAWEI_CLOUD_MAAS_API_KEY"])
  expect(config.provider?.["huawei-maas"]?.models?.["deepseek-r1-250528"]?.reasoning).toBe(true)
})

test("package engines require opencode >= 1.14.28", async () => {
  const packageJson = (await Bun.file(new URL("../package.json", import.meta.url)).json()) as {
    engines?: { opencode?: string }
  }

  expect(packageJson.engines?.opencode).toBe(">=1.14.28")
})
