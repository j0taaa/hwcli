import { describe, expect } from "bun:test"
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
  "deepseek-v3.2",
  "deepseek-v3.1-terminus",
  "DeepSeek-V3",
  "glm-5",
  "glm-5.1",
  "deepseek-r1-250528",
]

describe("plugin.opencode-maas", () => {
  it.live(
    "loads the real plugin and injects huawei-maas provider models",
    Effect.gen(function* () {
      const previousApiKey = process.env.HUAWEI_CLOUD_MAAS_API_KEY
      delete process.env.HUAWEI_CLOUD_MAAS_API_KEY
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
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
      expect(Object.keys(maas.models)).toEqual(expectedModelIDs)
      for (const modelID of expectedModelIDs) {
        expect(maas.models[ModelID.make(modelID)]).toBeDefined()
      }

      const existing = providers[ProviderID.make("existing-provider")]
      expect(existing).toBeDefined()
      expect(existing.name).toBe("Existing Provider")
      expect(existing.models[ModelID.make("chat")]).toBeDefined()
    }),
    30000,
  )
})
