import { Global } from "@opencode-ai/core/global"
import * as Log from "@opencode-ai/core/util/log"
import path from "path"
import { Schema } from "effect"
import { Installation } from "../installation"
import { Flag } from "@opencode-ai/core/flag/flag"
import { lazy } from "@/util/lazy"
import { Filesystem } from "@/util/filesystem"
import { Flock } from "@opencode-ai/core/util/flock"
import { Hash } from "@opencode-ai/core/util/hash"

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

const Cost = Schema.Struct({
  input: Schema.Number,
  output: Schema.Number,
  cache_read: Schema.optional(Schema.Number),
  cache_write: Schema.optional(Schema.Number),
  context_over_200k: Schema.optional(
    Schema.Struct({
      input: Schema.Number,
      output: Schema.Number,
      cache_read: Schema.optional(Schema.Number),
      cache_write: Schema.optional(Schema.Number),
    }),
  ),
})

export const Model = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  family: Schema.optional(Schema.String),
  release_date: Schema.String,
  attachment: Schema.Boolean,
  reasoning: Schema.Boolean,
  temperature: Schema.Boolean,
  tool_call: Schema.Boolean,
  interleaved: Schema.optional(
    Schema.Union([
      Schema.Literal(true),
      Schema.Struct({
        field: Schema.Literals(["reasoning_content", "reasoning_details"]),
      }),
    ]),
  ),
  cost: Schema.optional(Cost),
  limit: Schema.Struct({
    context: Schema.Number,
    input: Schema.optional(Schema.Number),
    output: Schema.Number,
  }),
  modalities: Schema.optional(
    Schema.Struct({
      input: Schema.Array(Schema.Literals(["text", "audio", "image", "video", "pdf"])),
      output: Schema.Array(Schema.Literals(["text", "audio", "image", "video", "pdf"])),
    }),
  ),
  experimental: Schema.optional(
    Schema.Struct({
      modes: Schema.optional(
        Schema.Record(
          Schema.String,
          Schema.Struct({
            cost: Schema.optional(Cost),
            provider: Schema.optional(
              Schema.Struct({
                body: Schema.optional(Schema.Record(Schema.String, Schema.MutableJson)),
                headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
              }),
            ),
          }),
        ),
      ),
    }),
  ),
  status: Schema.optional(Schema.Literals(["alpha", "beta", "deprecated"])),
  provider: Schema.optional(
    Schema.Struct({ npm: Schema.optional(Schema.String), api: Schema.optional(Schema.String) }),
  ),
})
export type Model = Schema.Schema.Type<typeof Model>

export const Provider = Schema.Struct({
  api: Schema.optional(Schema.String),
  name: Schema.String,
  env: Schema.Array(Schema.String),
  id: Schema.String,
  npm: Schema.optional(Schema.String),
  models: Schema.Record(Schema.String, Model),
})

export type Provider = Schema.Schema.Type<typeof Provider>

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

export * as ModelsDev from "./models"
