<p align="center">
  <a href="https://github.com/j0taaa/hwcli">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="HWCLI logo">
    </picture>
  </a>
</p>
<p align="center">A Huawei-focused fork of the open source AI coding agent.</p>
<p align="center">
  <a href="https://opencode.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/opencode-ai"><img alt="npm" src="https://img.shields.io/npm/v/opencode-ai?style=flat-square" /></a>
  <a href="https://github.com/j0taaa/hwcli"><img alt="Repository" src="https://img.shields.io/badge/github-j0taaa%2Fhwcli-black?style=flat-square" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![HWCLI Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://github.com/j0taaa/hwcli)

---

### Installation

```bash
# Current local/dev install path
bun install
bun link --cwd packages/opencode

# Then run
hwcli

# Package install if you still use the upstream package name
npm i -g opencode-ai@latest        # or bun/pnpm/yarn

# Then run
hwcli
```

> [!TIP]
> This fork currently exposes the CLI command as `hwcli`.

### What Changed In This Fork

- CLI command renamed from `opencode` to `hwcli`
- TUI and terminal branding updated to `HWCLI`
- Default TUI theme set to `huawei`
- Huawei-style red accents and HWCLI logo
- Huawei Cloud MaaS added as a built-in provider in `/connect`
- Preloaded Huawei-specific skills:
  - `huawei-cloud`
  - `neo-calculator`

### Huawei Cloud MaaS

HWCLI includes a built-in `Huawei Cloud MaaS` provider in `/connect`.

- Provider id: `huawei-maas`
- Endpoint: `https://api-ap-southeast-1.modelarts-maas.com/openai/v1`
- Auth: API token via `HUAWEI_CLOUD_MAAS_API_KEY`

Available models:

- `deepseek-v3.2`
- `deepseek-v3.1-terminus`
- `DeepSeek-V3`
- `glm-5`
- `glm-5.1`
- `deepseek-r1-250528`

### Skills

This fork preloads extra skills in addition to the built-in ones.

- `huawei-cloud`
  Huawei Cloud account/API workflow guidance, signing guidance, API Explorer helpers, billing guidance, and request generation references.
- `neo-calculator`
  NeoCalculator API guidance for projects, lists, products, calculator sync, sharing, import, and transient price calculation.

### Desktop App (BETA)

OpenCode is also available as a desktop application. Download directly from the [releases page](https://github.com/anomalyco/opencode/releases) or [opencode.ai/download](https://opencode.ai/download).

| Platform              | Download                              |
| --------------------- | ------------------------------------- |
| macOS (Apple Silicon) | `opencode-desktop-darwin-aarch64.dmg` |
| macOS (Intel)         | `opencode-desktop-darwin-x64.dmg`     |
| Windows               | `opencode-desktop-windows-x64.exe`    |
| Linux                 | `.deb`, `.rpm`, or AppImage           |

```bash
# macOS (Homebrew)
brew install --cask opencode-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/opencode-desktop
```

#### Installation Directory

The install script respects the following priority order for the installation path:

1. `$OPENCODE_INSTALL_DIR` - Custom installation directory
2. `$XDG_BIN_DIR` - XDG Base Directory Specification compliant path
3. `$HOME/bin` - Standard user binary directory (if it exists or can be created)
4. `$HOME/.opencode/bin` - Default fallback

```bash
# Examples
OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://opencode.ai/install | bash
```

### Agents

HWCLI includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about the upstream agent system at [opencode.ai/docs/agents](https://opencode.ai/docs/agents).

### Documentation

For general upstream configuration concepts, see [opencode.ai/docs](https://opencode.ai/docs).

Fork-specific Huawei behavior currently lives in this repository and the preloaded skills.

### Contributing

If you're interested in contributing to HWCLI, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Building on HWCLI

If you are working on a project that's related to HWCLI, please add a note to your README to clarify whether it is an independent community project or part of this fork.

### FAQ

#### How is this different from Claude Code?

It's very similar to Claude Code in terms of capability. Here are the key differences:

- 100% open source
- Not coupled to any provider. This fork adds Huawei Cloud MaaS as a built-in provider while keeping the upstream provider-agnostic approach.
- Out-of-the-box LSP support
- A focus on TUI. HWCLI keeps the upstream terminal-first workflow with Huawei-focused branding and defaults.
- A client/server architecture. This fork keeps the same architectural model as upstream.

---

**Repository** [GitHub](https://github.com/j0taaa/hwcli)
