import { Global } from "../global"
import { Log } from "../util"
import path from "path"
import z from "zod"
import { Installation } from "../installation"
import { Flag } from "../flag/flag"
import { lazy } from "@/util/lazy"
import { Filesystem } from "../util"
import { Flock } from "@opencode-ai/shared/util/flock"
import { Hash } from "@opencode-ai/shared/util/hash"

// Try to import bundled snapshot (generated at build time)
// Falls back to undefined in dev mode when snapshot doesn't exist
/* @ts-ignore */

const log = Log.create({ service: "models.dev" })
const source = url()
const filepath = path.join(
  Global.Path.cache,
  source === "https://models.dev" ? "models.json" : `models-${Hash.fast(source)}.json`,
)
const ttl = 5 * 60 * 1000

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[]

const JsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(JsonValue), z.record(z.string(), JsonValue)]),
)

const Cost = z.object({
  input: z.number(),
  output: z.number(),
  cache_read: z.number().optional(),
  cache_write: z.number().optional(),
  context_over_200k: z
    .object({
      input: z.number(),
      output: z.number(),
      cache_read: z.number().optional(),
      cache_write: z.number().optional(),
    })
    .optional(),
})

export const Model = z.object({
  id: z.string(),
  name: z.string(),
  family: z.string().optional(),
  release_date: z.string(),
  attachment: z.boolean(),
  reasoning: z.boolean(),
  temperature: z.boolean(),
  tool_call: z.boolean(),
  interleaved: z
    .union([
      z.literal(true),
      z
        .object({
          field: z.enum(["reasoning_content", "reasoning_details"]),
        })
        .strict(),
    ])
    .optional(),
  cost: Cost.optional(),
  limit: z.object({
    context: z.number(),
    input: z.number().optional(),
    output: z.number(),
  }),
  modalities: z
    .object({
      input: z.array(z.enum(["text", "audio", "image", "video", "pdf"])),
      output: z.array(z.enum(["text", "audio", "image", "video", "pdf"])),
    })
    .optional(),
  experimental: z
    .object({
      modes: z
        .record(
          z.string(),
          z.object({
            cost: Cost.optional(),
            provider: z
              .object({
                body: z.record(z.string(), JsonValue).optional(),
                headers: z.record(z.string(), z.string()).optional(),
              })
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  status: z.enum(["alpha", "beta", "deprecated"]).optional(),
  provider: z.object({ npm: z.string().optional(), api: z.string().optional() }).optional(),
})
export type Model = z.infer<typeof Model>

export const Provider = z.object({
  api: z.string().optional(),
  name: z.string(),
  env: z.array(z.string()),
  id: z.string(),
  npm: z.string().optional(),
  models: z.record(z.string(), Model),
})

export type Provider = z.infer<typeof Provider>

const BUILTIN_PROVIDERS: Record<string, Provider> = {
  "huawei-maas": {
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
  },
}

function url() {
  return Flag.OPENCODE_MODELS_URL || "https://models.dev"
}

function fresh() {
  return Date.now() - Number(Filesystem.stat(filepath)?.mtimeMs ?? 0) < ttl
}

function skip(force: boolean) {
  return !force && fresh()
}

const fetchApi = async () => {
  const result = await fetch(`${url()}/api.json`, {
    headers: { "User-Agent": Installation.USER_AGENT },
    signal: AbortSignal.timeout(10000),
  })
  return { ok: result.ok, text: await result.text() }
}

export const Data = lazy(async () => {
  const result = await Filesystem.readJson(Flag.OPENCODE_MODELS_PATH ?? filepath).catch(() => {})
  if (result) return result
  // @ts-ignore
  const snapshot = await import("./models-snapshot.js")
    .then((m) => m.snapshot as Record<string, unknown>)
    .catch(() => undefined)
  if (snapshot) return snapshot
  if (Flag.OPENCODE_DISABLE_MODELS_FETCH) return {}
  return Flock.withLock(`models-dev:${filepath}`, async () => {
    const result = await Filesystem.readJson(Flag.OPENCODE_MODELS_PATH ?? filepath).catch(() => {})
    if (result) return result
    const result2 = await fetchApi()
    if (result2.ok) {
      await Filesystem.write(filepath, result2.text).catch((e) => {
        log.error("Failed to write models cache", { error: e })
      })
    }
    return JSON.parse(result2.text)
  })
})

export async function get() {
  const result = await Data()
  return {
    ...(result as Record<string, Provider>),
    ...BUILTIN_PROVIDERS,
  }
}

export async function refresh(force = false) {
  if (skip(force)) return Data.reset()
  await Flock.withLock(`models-dev:${filepath}`, async () => {
    if (skip(force)) return Data.reset()
    const result = await fetchApi()
    if (!result.ok) return
    await Filesystem.write(filepath, result.text)
    Data.reset()
  }).catch((e) => {
    log.error("Failed to fetch models.dev", {
      error: e,
    })
  })
}

if (!Flag.OPENCODE_DISABLE_MODELS_FETCH && !process.argv.includes("--get-yargs-completions")) {
  void refresh()
  setInterval(
    async () => {
      await refresh()
    },
    60 * 1000 * 60,
  ).unref()
}
