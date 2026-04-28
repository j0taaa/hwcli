import { afterEach, describe, expect, test } from "bun:test"
import type { Config } from "../../src/config"
import { resolveNetworkOptionsNoConfig } from "../../src/cli/network"

const originalArgv = process.argv.slice()

describe("network option defaults", () => {
  afterEach(() => {
    process.argv = originalArgv.slice()
  })

  test("uses command defaults before config when flags are not explicit", () => {
    process.argv = ["bun", "hwcli", "simple"]

    const result = resolveNetworkOptionsNoConfig(
      {
        port: 0,
        hostname: "127.0.0.1",
        mdns: false,
        "mdns-domain": "hwcli.local",
        cors: [],
      },
      {
        server: {
          cors: [],
          mdns: false,
          mdnsDomain: "hwcli.local",
          port: 3000,
          hostname: "127.0.0.9",
        },
      } as Config.Info,
      {
        port: 8888,
        hostname: "0.0.0.0",
      },
    )

    expect(result.port).toBe(8888)
    expect(result.hostname).toBe("0.0.0.0")
  })

  test("keeps explicit cli flags ahead of command defaults", () => {
    process.argv = ["bun", "hwcli", "simple", "--port", "9999", "--hostname", "127.0.0.1"]

    const result = resolveNetworkOptionsNoConfig(
      {
        port: 9999,
        hostname: "127.0.0.1",
        mdns: false,
        "mdns-domain": "hwcli.local",
        cors: [],
      },
      undefined,
      {
        port: 8888,
        hostname: "0.0.0.0",
      },
    )

    expect(result.port).toBe(9999)
    expect(result.hostname).toBe("127.0.0.1")
  })
})
