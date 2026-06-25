import fs from "fs/promises"
import path from "path"
import { describe, expect, test } from "bun:test"
import { Npm } from "@opencode-ai/core/npm"
import { tmpdir } from "./fixture/tmpdir"

const writePackage = (dir: string, pkg: Record<string, unknown>) =>
  Bun.write(
    path.join(dir, "package.json"),
    JSON.stringify({
      version: "1.0.0",
      ...pkg,
    }),
  )

describe("Npm.sanitize", () => {
  test("uses one filesystem-safe path segment for package specs", () => {
    expect(Npm.sanitize("@opencode/acme")).toBe("%40opencode%2Facme")
    expect(Npm.sanitize("@opencode/acme@1.0.0")).toBe("%40opencode%2Facme%401.0.0")
    expect(Npm.sanitize("prettier")).toBe("prettier")
  })

  test("handles URL and git specs without Windows-reserved path characters", () => {
    expect(Npm.sanitize("https://cli.hwctools.site/opencode-maas.tgz")).toBe(
      "https%3A%2F%2Fcli.hwctools.site%2Fopencode-maas.tgz",
    )
    expect(Npm.sanitize("acme@git+https://github.com/opencode/acme.git")).toBe(
      "acme%40git%2Bhttps%3A%2F%2Fgithub.com%2Fopencode%2Facme.git",
    )
  })
})

describe("Npm.install", () => {
  test("respects omit from project .npmrc", async () => {
    await using tmp = await tmpdir()

    await writePackage(tmp.path, {
      name: "fixture",
      dependencies: {
        "prod-pkg": "file:./prod-pkg",
      },
      devDependencies: {
        "dev-pkg": "file:./dev-pkg",
      },
    })
    await Bun.write(path.join(tmp.path, ".npmrc"), "omit=dev\n")
    await fs.mkdir(path.join(tmp.path, "prod-pkg"))
    await fs.mkdir(path.join(tmp.path, "dev-pkg"))
    await writePackage(path.join(tmp.path, "prod-pkg"), { name: "prod-pkg" })
    await writePackage(path.join(tmp.path, "dev-pkg"), { name: "dev-pkg" })

    await Npm.install(tmp.path)

    await expect(fs.stat(path.join(tmp.path, "node_modules", "prod-pkg"))).resolves.toBeDefined()
    await expect(fs.stat(path.join(tmp.path, "node_modules", "dev-pkg"))).rejects.toThrow()
  })
})
