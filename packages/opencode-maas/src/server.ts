import type { Config, Plugin } from "@opencode-ai/plugin"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

type ProviderConfig = NonNullable<Config["provider"]>[string]
type ModelConfig = Record<string, unknown> & {
  id: string
  limit: {
    context: number
    input?: number
    output: number
  }
  modalities: {
    input: ModelModality[]
    output: ModelModality[]
  }
}
type ProviderDefaults = Omit<typeof provider, "api" | "models"> & {
  api: string
  whitelist?: string[]
  models: Record<string, ModelConfig>
}
type CatalogPrice = {
  tokenPriceUsdPerMillion?: unknown
}
type CatalogModel = {
  id?: unknown
  name?: unknown
  pricing?: {
    input?: CatalogPrice[]
    output?: CatalogPrice[]
  }
  limits?: {
    contextWindowTokens?: unknown
    maxInputTokens?: unknown
    maxOutputTokens?: unknown
    maxReasoningTokens?: unknown
  }
  modalities?: {
    input?: unknown
    output?: unknown
  }
}
type CatalogResponse = {
  endpoints?: {
    openaiCompatible?: unknown
  }
  models?: unknown
}

const catalogUrl = "https://catalog.hwctools.site/models"
const modelModalities = ["text", "audio", "image", "video", "pdf"] as const
type ModelModality = (typeof modelModalities)[number]

function catalogCachePath() {
  if (process.env.OPENCODE_MAAS_CATALOG_CACHE) return process.env.OPENCODE_MAAS_CATALOG_CACHE
  return path.join(process.env.XDG_CACHE_HOME || path.join(process.env.HOME || os.tmpdir(), ".cache"), "opencode", "opencode-maas-catalog.json")
}

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

function isModelModality(value: unknown): value is ModelModality {
  return typeof value === "string" && modelModalities.includes(value as ModelModality)
}

function modalities(value: unknown): ModelModality[] {
  if (!Array.isArray(value)) return ["text"]
  const result = value.filter(isModelModality)
  if (result.length === 0) return ["text"]
  return result
}

function price(value?: CatalogPrice[]) {
  const first = value?.[0]?.tokenPriceUsdPerMillion
  if (typeof first !== "number") return 0
  return first
}

function number(value: unknown) {
  if (typeof value !== "number") return
  if (!Number.isFinite(value)) return
  return value
}

function family(id: string) {
  const base = id.toLowerCase().replace(/[_ ]+/g, "-")
  if (base.startsWith("deepseek-v4")) return "deepseek-v4"
  if (base.startsWith("deepseek-v3")) return "deepseek-v3"
  if (base.startsWith("deepseek-r1")) return "deepseek-r1"
  if (base.startsWith("glm-5")) return "glm-5"
  return base.split("-").slice(0, 2).join("-") || base
}

function catalogModel(input: CatalogModel): ModelConfig | undefined {
  if (typeof input.id !== "string" || typeof input.name !== "string") return
  const context = number(input.limits?.contextWindowTokens)
  const output = number(input.limits?.maxOutputTokens)
  if (!context || !output) return

  const reasoning = (number(input.limits?.maxReasoningTokens) ?? 0) > 0

  return {
    id: input.id,
    name: input.name,
    family: family(input.id),
    attachment: modalities(input.modalities?.input).some((item) => item !== "text"),
    reasoning,
    temperature: true,
    tool_call: true,
    ...(reasoning ? { interleaved: { field: "reasoning_content" as const } } : {}),
    cost: {
      input: price(input.pricing?.input),
      output: price(input.pricing?.output),
    },
    limit: {
      context,
      input: number(input.limits?.maxInputTokens),
      output,
    },
    modalities: {
      input: modalities(input.modalities?.input),
      output: modalities(input.modalities?.output),
    },
  }
}

function catalogProvider(input: CatalogResponse): ProviderDefaults | undefined {
  if (!Array.isArray(input.models)) return
  const models = Object.fromEntries(
    input.models
      .filter(isRecord)
      .map(catalogModel)
      .filter((model): model is ModelConfig & { id: string } => typeof model?.id === "string")
      .map((model) => [model.id, model]),
  )
  if (Object.keys(models).length === 0) return

  return {
    ...provider,
    api: typeof input.endpoints?.openaiCompatible === "string" ? input.endpoints.openaiCompatible : provider.api,
    whitelist: Object.keys(models),
    models,
  }
}

async function cachedCatalogProvider() {
  return catalogProvider((await Bun.file(catalogCachePath()).json()) as CatalogResponse)
}

async function writeCatalogCache(input: CatalogResponse) {
  await fs.mkdir(path.dirname(catalogCachePath()), { recursive: true })
  await Bun.write(catalogCachePath(), JSON.stringify(input, null, 2) + "\n")
}

async function catalogProviderOrFallback() {
  const fallback = () => cachedCatalogProvider().then((cached) => cached ?? provider).catch(() => provider)
  const response = await fetch(catalogUrl, { signal: AbortSignal.timeout(5_000) }).catch(() => undefined)
  if (!response?.ok) return fallback()

  const catalog = (await response.json().catch(() => undefined)) as CatalogResponse | undefined
  if (!catalog) return fallback()

  const parsed = catalogProvider(catalog)
  if (!parsed) return fallback()

  await writeCatalogCache(catalog).catch(() => undefined)
  return parsed
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
    const defaults = await catalogProviderOrFallback().catch(() => provider)
    input.provider[provider.id] = mergeDefaults(defaults as Record<string, unknown>, input.provider[provider.id]) as ProviderConfig
  },
})

export default server
