import { describe, expect, mock } from "bun:test"
import fs from "fs/promises"
import path from "path"
import { pathToFileURL } from "url"
import { Effect } from "effect"
import { tmpdir, provideInstance } from "../fixture/fixture"
import { testEffect } from "../lib/effect"
import { Provider } from "@/provider/provider"
import { ModelID, ProviderID } from "../../src/provider/schema"

const it = testEffect(Provider.defaultLayer)

const expectedModelIDs = [
  "deepseek-v4-pro",
  "glm-5.2",
  "deepseek-v3.2",
]

describe("plugin.opencode-maas", () => {
  it.live(
    "loads the real plugin and injects huawei-maas provider models",
    Effect.gen(function* () {
      const previousApiKey = process.env.HUAWEI_CLOUD_MAAS_API_KEY
      const previousFetch = globalThis.fetch
      delete process.env.HUAWEI_CLOUD_MAAS_API_KEY
      globalThis.fetch = mock(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
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
                },
                {
                  name: "DeepSeek-V3.2",
                  id: "deepseek-v3.2",
                  pricing: {
                    input: [{ tokenPriceUsdPerMillion: 0.27 }],
                    output: [{ tokenPriceUsdPerMillion: 0.404 }],
                  },
                  limits: {
                    contextWindowTokens: 160_000,
                    maxInputTokens: 128_000,
                    maxOutputTokens: 32_000,
                    maxReasoningTokens: 32_000,
                  },
                  modalities: { input: ["text"], output: ["text"] },
                },
              ],
            }),
          ),
        ),
      ) as unknown as typeof fetch
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          globalThis.fetch = previousFetch
          if (previousApiKey === undefined) {
            delete process.env.HUAWEI_CLOUD_MAAS_API_KEY
            return
          }
          process.env.HUAWEI_CLOUD_MAAS_API_KEY = previousApiKey
        }),
      )

      const tmp = yield* Effect.promise(() =>
        tmpdir({
          config: {
            provider: {
              "existing-provider": {
                name: "Existing Provider",
                npm: "@ai-sdk/openai-compatible",
                api: "https://example.com/v1",
                models: {
                  chat: {
                    name: "Existing Chat",
                    limit: { context: 8_000, output: 1_000 },
                  },
                },
              },
              "huawei-maas": {
                name: "Configured Huawei MaaS",
                options: { existing: "preserved" },
              },
            },
          },
          init: async (dir) => {
            const pluginDir = path.join(dir, ".opencode", "plugin")
            await fs.mkdir(pluginDir, { recursive: true })
            await Bun.write(
              path.join(pluginDir, "opencode-maas.ts"),
              `export { default, server } from ${JSON.stringify(pathToFileURL(path.join(import.meta.dir, "../../../opencode-maas/src/server.ts")).href)}\n`,
            )
          },
        }),
      )
      yield* Effect.addFinalizer(() => Effect.promise(() => tmp[Symbol.asyncDispose]()))

      const providers = yield* provideInstance(tmp.path)(
        Effect.gen(function* () {
          const provider = yield* Provider.Service
          return yield* provider.list()
        }),
      )

      const maas = providers[ProviderID.make("huawei-maas")]
      expect(maas).toBeDefined()
      expect(maas.name).toBe("Configured Huawei MaaS")
      expect(maas.key).toBeUndefined()
      expect(maas.options.existing).toBe("preserved")
      expect(Object.keys(maas.models).sort()).toEqual(expectedModelIDs.toSorted())
      for (const modelID of expectedModelIDs) {
        expect(maas.models[ModelID.make(modelID)]).toBeDefined()
      }
      expect(maas.models[ModelID.make("deepseek-v4-pro")]?.cost.input).toBe(1.617)
      expect(maas.models[ModelID.make("glm-5.2")]?.capabilities.input.image).toBe(true)

      const existing = providers[ProviderID.make("existing-provider")]
      expect(existing).toBeDefined()
      expect(existing.name).toBe("Existing Provider")
      expect(existing.models[ModelID.make("chat")]).toBeDefined()
    }),
    30000,
  )
})
