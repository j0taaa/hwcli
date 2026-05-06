import { describe, expect, test } from "bun:test"
import { sortDialogProviders } from "@/cli/cmd/tui/component/dialog-provider"

describe("dialog provider ordering", () => {
  test("shows Huawei Cloud MaaS before built-in popular providers", () => {
    const providers = sortDialogProviders([
      { id: "anthropic" },
      { id: "custom-provider" },
      { id: "opencode" },
      { id: "huawei-maas" },
      { id: "openai" },
    ])

    expect(providers.map((provider) => provider.id)).toEqual([
      "huawei-maas",
      "opencode",
      "openai",
      "anthropic",
      "custom-provider",
    ])
  })
})
