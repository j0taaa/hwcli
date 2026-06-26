import fs from "node:fs/promises"

const publicUrl = "https://cli.hwctools.site"
const windowsAssetUrl =
  process.env.WINDOWS_ASSET_URL ||
  "https://github.com/anomalyco/opencode/releases/latest/download/opencode-desktop-windows-x64.exe"
const windowsAssetPath = process.env.WINDOWS_ASSET_PATH
const cliReleaseRepo = process.env.CLI_RELEASE_REPO || "anomalyco/opencode"
const port = Number(process.env.PORT || 3000)
const maasPluginTarball = "hwcli-opencode-maas-1.14.28.tgz"
const maasCatalogUrl = "https://catalog.hwctools.site/models"
const maasAnthropicUrl = "https://api-ap-southeast-1.modelarts-maas.com/anthropic"
const claudeModelPrefix = "claude-huawei-maas-"

type MaasCatalog = {
  models?: {
    id?: unknown
    name?: unknown
    limits?: {
      contextWindowTokens?: unknown
    }
  }[]
}

const cliAssets = new Set([
  "opencode-linux-arm64-musl.tar.gz",
  "opencode-linux-arm64.tar.gz",
  "opencode-linux-x64-baseline-musl.tar.gz",
  "opencode-linux-x64-baseline.tar.gz",
  "opencode-linux-x64-musl.tar.gz",
  "opencode-linux-x64.tar.gz",
  "opencode-darwin-arm64.zip",
  "opencode-darwin-x64-baseline.zip",
  "opencode-darwin-x64.zip",
])

function isCliRequest(request: Request) {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() || ""
  if (userAgent.includes("curl") || userAgent.includes("wget") || userAgent.includes("httpie")) return true

  const accept = request.headers.get("accept")?.toLowerCase() || ""
  return !accept.includes("text/html")
}

function page() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="HWCLI installer page for terminal installation, Huawei Cloud MaaS plugin setup, and Windows desktop downloads." />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${publicUrl}/" />
    <meta property="og:title" content="HWCLI Installer" />
    <meta property="og:description" content="Install HWCLI from the terminal, add the Huawei Cloud MaaS plugin, or download the Windows desktop app." />
    <meta property="og:url" content="${publicUrl}/" />
    <meta property="og:site_name" content="HWCLI Installer" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="HWCLI Installer" />
    <meta name="twitter:description" content="Install HWCLI from the terminal, add the Huawei Cloud MaaS plugin, or download the Windows desktop app." />
    <title>HWCLI Installer</title>
    <link rel="icon" type="image/svg+xml" href="/favicon-v3.svg" />
    <meta name="theme-color" content="#c7002b" />
    <meta name="theme-color" content="#170608" media="(prefers-color-scheme: dark)" />
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"SoftwareApplication","name":"HWCLI","applicationCategory":"DeveloperApplication","operatingSystem":"Linux, macOS, Windows","url":"${publicUrl}/","description":"Install HWCLI from the terminal, add the Huawei Cloud MaaS plugin, or download the Windows desktop app."}
    </script>
    <style>
      :root {
        color-scheme: dark;
        --bg: #120507;
        --panel: #1b090d;
        --panel-strong: #250b10;
        --border: #5f1824;
        --text: #fff2f4;
        --muted: #d49aa3;
        --accent: #cf0a2c;
        --accent-strong: #f04a69;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        background: radial-gradient(circle at top, #2b0b12, var(--bg) 60%);
        color: var(--text);
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      main {
        width: min(760px, 100%);
        padding: 40px 32px;
      }
      @media (max-width: 40rem) {
        main {
          padding: 28px 20px;
        }
      }
      h1 {
        margin: 0;
        font-size: clamp(2.25rem, 6vw, 4rem);
        letter-spacing: 0.16em;
      }
      h2 {
        margin: 0;
        font-size: 1rem;
        letter-spacing: 0.1em;
        color: var(--text);
      }
      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      .lede {
        margin-top: 14px;
        max-width: 42rem;
        font-size: 0.98rem;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
        color: #ff9fb0;
        font-size: 12px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }
      .badge::before {
        content: "";
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--accent);
        box-shadow: 0 0 0 4px rgba(207, 10, 44, 0.18);
      }
      pre {
        margin: 14px 0 0;
        padding: 16px 18px;
        overflow: auto;
        border-radius: 12px;
        background: #0c0304;
        border: 1px solid #3f1018;
        color: #ffdbe1;
        font-size: 15px;
      }
      code { font-family: "SFMono-Regular", Consolas, monospace; }
      .links {
        margin-top: 14px;
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }
      .sections {
        display: grid;
        gap: 14px;
        margin-top: 28px;
      }
      .card {
        background: color-mix(in srgb, var(--panel) 90%, transparent);
        border: 1px solid rgba(207, 10, 44, 0.18);
        border-radius: 14px;
        padding: 18px;
      }
      .eyebrow {
        color: #ffb7c3;
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        margin-bottom: 10px;
      }
      .cta {
        margin-top: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 16px;
        border-radius: 10px;
        background: var(--accent);
        color: white;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .cta:hover {
        background: var(--accent-strong);
        text-decoration: none;
      }
      .meta {
        margin-top: 8px;
        color: #f3b9c4;
        font-size: 13px;
      }
      .command {
        position: relative;
      }
      .copy {
        position: absolute;
        top: 8px;
        right: 8px;
        min-height: 32px;
        padding: 0 10px;
        border: 1px solid #5f1824;
        border-radius: 8px;
        background: #1b090d;
        color: #ffdbe1;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
      }
      .copy:hover {
        border-color: var(--accent-strong);
        color: #ffffff;
      }
      a {
        color: #ff7a90;
        text-decoration: none;
      }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <main>
      <div>
        <div class="badge">HWCLI INSTALLER</div>
        <h1>HWCLI</h1>
        <p class="lede">Install from the terminal or download the Windows desktop app.</p>
      </div>
      <div class="sections">
        <section class="card">
          <div class="eyebrow">Terminal Install</div>
          <h2>Install from the terminal</h2>
          <div class="command">
            <pre><code>curl -fsSL ${publicUrl} | bash</code></pre>
            <button class="copy" type="button" data-copy="curl -fsSL ${publicUrl} | bash">Copy</button>
          </div>
          <div class="links">
            <a href="/install.sh">View install.sh</a>
          </div>
        </section>
        <section class="card">
          <div class="eyebrow">Standard OpenCode Plugin</div>
          <h2>Add Huawei Cloud MaaS to normal opencode</h2>
          <p>Already using upstream opencode? Install only the Huawei Cloud MaaS models plugin.</p>
          <div class="command">
            <pre><code>opencode plugin ${publicUrl}/opencode-maas.tgz</code></pre>
            <button class="copy" type="button" data-copy="opencode plugin ${publicUrl}/opencode-maas.tgz">Copy</button>
          </div>
          <p class="meta">Then run <code>/connect</code> in opencode and select Huawei Cloud MaaS to paste your API key.</p>
        </section>
        <section class="card">
          <div class="eyebrow">Claude Code</div>
          <h2>Use Huawei Cloud MaaS with Claude Code</h2>
          <p>Use the HWCLI MaaS gateway so Claude Code can discover every Huawei Cloud MaaS model in <code>/model</code>.</p>
          <p class="meta">macOS, Linux, WSL, Git Bash</p>
          <div class="command">
            <pre><code>curl -fsSL ${publicUrl}/claude-maas.sh | HUAWEI_CLOUD_MAAS_API_KEY="YOUR_HUAWEI_MAAS_API_KEY" bash</code></pre>
            <button class="copy" type="button">Copy</button>
          </div>
          <p class="meta">Windows PowerShell</p>
          <div class="command">
            <pre><code>$env:HUAWEI_CLOUD_MAAS_API_KEY="YOUR_HUAWEI_MAAS_API_KEY"; irm ${publicUrl}/claude-maas.ps1 | iex</code></pre>
            <button class="copy" type="button">Copy</button>
          </div>
          <p class="meta">Uses <code>apiKeyHelper</code> so plain <code>claude</code> starts on MaaS without the custom API key approval prompt.</p>
        </section>
        <section class="card">
          <div class="eyebrow">Codex</div>
          <h2>Use Huawei Cloud MaaS with Codex</h2>
          <p>Run Codex with Huawei Cloud MaaS through the OpenAI-compatible chat completions endpoint.</p>
          <div class="command">
            <pre><code>HUAWEI_CLOUD_MAAS_API_KEY="YOUR_HUAWEI_MAAS_API_KEY" npx -y @openai/codex@0.80.0 exec --skip-git-repo-check -c 'model="glm-5.2"' -c 'model_provider="huawei-maas"' -c 'model_providers.huawei-maas.name="Huawei Cloud MaaS"' -c 'model_providers.huawei-maas.base_url="https://api-ap-southeast-1.modelarts-maas.com/openai/v1"' -c 'model_providers.huawei-maas.env_key="HUAWEI_CLOUD_MAAS_API_KEY"' -c 'model_providers.huawei-maas.wire_api="chat"' "Reply exactly OK and nothing else."</code></pre>
            <button class="copy" type="button">Copy</button>
          </div>
          <p class="meta">Pinned to Codex <code>0.80.0</code>, the latest stable version tested working with Huawei Cloud MaaS chat completions. Current Codex builds can load the MaaS model list from <code>${publicUrl}/codex-maas-models.json</code>, but require a Responses-compatible endpoint to run.</p>
        </section>
        <section class="card">
          <div class="eyebrow">Pi</div>
          <h2>Use Huawei Cloud MaaS with Pi</h2>
          <p>Add Huawei Cloud MaaS as an OpenAI-compatible provider in Pi.</p>
          <div class="command">
            <pre><code>mkdir -p ~/.pi/agent && printf '%s\\n' '{"providers":{"huawei-maas":{"name":"Huawei Cloud MaaS","baseUrl":"https://api-ap-southeast-1.modelarts-maas.com/openai/v1","api":"openai-completions","apiKey":"YOUR_HUAWEI_MAAS_API_KEY","compat":{"supportsDeveloperRole":false,"supportsReasoningEffort":false,"supportsUsageInStreaming":true},"models":[{"id":"glm-5.2","name":"glm-5.2","reasoning":true,"input":["text"]}]}}}' > ~/.pi/agent/models.json && pi --provider huawei-maas --model glm-5.2</code></pre>
            <button class="copy" type="button">Copy</button>
          </div>
          <p class="meta">Creates a minimal Pi models config, then starts Pi with the Huawei Cloud MaaS provider.</p>
        </section>
        <section class="card">
          <div class="eyebrow">Cursor CLI</div>
          <h2>Cursor Agent status</h2>
          <p>Cursor Agent installs as <code>agent</code>, but this CLI does not currently expose an OpenAI-compatible endpoint override.</p>
          <div class="command">
            <pre><code>curl https://cursor.com/install -fsS | bash && agent login</code></pre>
            <button class="copy" type="button">Copy</button>
          </div>
          <p class="meta">Use this to install and authenticate Cursor Agent. Huawei Cloud MaaS is not listed here until Cursor exposes a custom base URL option.</p>
        </section>
        <section class="card">
          <div class="eyebrow">Windows Desktop</div>
          <h2>HWCLI Desktop for Windows</h2>
          <a class="cta" href="/download/windows-x64-nsis">Download for Windows</a>
          <div class="meta">64-bit Windows installer (.exe)</div>
        </section>
      </div>
    </main>
    <script>
      document.querySelectorAll("[data-copy]").forEach((button) => {
        button.addEventListener("click", async () => {
          const text = button.getAttribute("data-copy") || ""
          await navigator.clipboard.writeText(text)
          button.textContent = "Copied"
          setTimeout(() => {
            button.textContent = "Copy"
          }, 1600)
        })
      })
      document.querySelectorAll(".command .copy:not([data-copy])").forEach((button) => {
        button.addEventListener("click", async () => {
          const text = button.closest(".command")?.querySelector("code")?.textContent || ""
          await navigator.clipboard.writeText(text)
          button.textContent = "Copied"
          setTimeout(() => {
            button.textContent = "Copy"
          }, 1600)
        })
      })
    </script>
  </body>
</html>`
}

async function desktopWindows() {
  if (windowsAssetPath) {
    const exists = await fs
      .access(windowsAssetPath)
      .then(() => true)
      .catch(() => false)
    if (exists) {
      return new Response(Bun.file(windowsAssetPath), {
        headers: {
          "content-type": "application/octet-stream",
          "content-disposition": 'attachment; filename="HWCLI Desktop Installer.exe"',
          "cache-control": "no-store, no-cache, must-revalidate",
        },
      })
    }
  }

  const response = await fetch(windowsAssetUrl, {
    headers: {
      "user-agent": "hwcli-installer-site",
      accept: "application/octet-stream",
    },
  })

  if (!response.ok) {
    return new Response("Failed to fetch Windows installer\n", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    })
  }

  const headers = new Headers(response.headers)
  headers.set("content-disposition", 'attachment; filename="HWCLI Desktop Installer.exe"')
  headers.set("cache-control", "no-store, no-cache, must-revalidate")
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function cliAsset(url: URL) {
  const assetName = url.pathname.slice("/download/cli/".length)
  if (!cliAssets.has(assetName)) {
    return new Response("Not found\n", { status: 404 })
  }

  const version = url.searchParams.get("version")
  const releasePath = version ? `download/${version}/${assetName}` : `latest/download/${assetName}`
  const response = await fetch(`https://github.com/${cliReleaseRepo}/releases/${releasePath}`, {
    headers: {
      "user-agent": "hwcli-installer-site",
      accept: "application/octet-stream",
    },
  })

  if (!response.ok) {
    return new Response("Failed to fetch CLI asset\n", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    })
  }

  const headers = new Headers(response.headers)
  headers.set("cache-control", "no-store")
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function favicon() {
  return new Response(Bun.file(new URL("./favicon-v3.svg", import.meta.url)), {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=3600",
    },
  })
}

function robots() {
  return new Response(`User-agent: *
Allow: /
Disallow: /download/

Sitemap: ${publicUrl}/sitemap.xml
`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  })
}

function sitemap() {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${publicUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  })
}

function json(input: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  headers.set("content-type", "application/json; charset=utf-8")
  return new Response(JSON.stringify(input, null, 2) + "\n", { ...init, headers })
}

async function maasCatalog() {
  return (await fetch(maasCatalogUrl, {
    headers: {
      "user-agent": "hwcli-installer-site",
      accept: "application/json",
    },
  }).then((response) => response.json())) as MaasCatalog
}

function maasModelId(input: string) {
  if (!input.startsWith(claudeModelPrefix)) return input
  return input.slice(claudeModelPrefix.length)
}

async function claudeGatewayModels() {
  const models = (await maasCatalog()).models ?? []
  return json(
    {
      data: models
        .filter((model) => typeof model.id === "string" && typeof model.name === "string")
        .map((model) => ({
          id: `${claudeModelPrefix}${model.id}`,
          display_name: `Huawei MaaS ${model.name}`,
        })),
    },
    { headers: { "cache-control": "public, max-age=300" } },
  )
}

async function codexMaasCatalog() {
  const models = (await maasCatalog()).models ?? []
  return json(
    {
      models: models
        .filter((model) => typeof model.id === "string" && typeof model.name === "string")
        .map((model, index) => ({
          slug: model.id,
          display_name: model.name,
          description: "Huawei Cloud MaaS model",
          default_reasoning_level: "none",
          supported_reasoning_levels: [],
          shell_type: "default",
          visibility: "list",
          supported_in_api: true,
          priority: models.length - index,
          additional_speed_tiers: [],
          service_tiers: [],
          default_service_tier: null,
          availability_nux: null,
          upgrade: null,
          base_instructions: "You are a helpful coding assistant.",
          model_messages: null,
          supports_reasoning_summaries: false,
          default_reasoning_summary: "none",
          support_verbosity: false,
          default_verbosity: null,
          apply_patch_tool_type: null,
          web_search_tool_type: "text",
          truncation_policy: {
            mode: "tokens",
            limit: typeof model.limits?.contextWindowTokens === "number" ? model.limits.contextWindowTokens : 128000,
          },
          supports_parallel_tool_calls: true,
          supports_image_detail_original: false,
          context_window: typeof model.limits?.contextWindowTokens === "number" ? model.limits.contextWindowTokens : null,
          max_context_window: typeof model.limits?.contextWindowTokens === "number" ? model.limits.contextWindowTokens : null,
          auto_compact_token_limit: null,
          comp_hash: null,
          effective_context_window_percent: 95,
          experimental_supported_tools: [],
          input_modalities: ["text"],
          supports_search_tool: false,
          use_responses_lite: false,
          auto_review_model_override: null,
          tool_mode: null,
          multi_agent_version: null,
        })),
    },
    { headers: { "cache-control": "public, max-age=300" } },
  )
}

async function claudeGateway(request: Request, url: URL) {
  const gatewayPath = url.pathname.slice("/huawei-maas/anthropic".length)
  if (request.method === "HEAD" && gatewayPath === "/") return new Response(null, { status: 204 })
  if (request.method === "GET" && gatewayPath === "/v1/models") return claudeGatewayModels()
  if (request.method !== "POST" || (gatewayPath !== "/v1/messages" && gatewayPath !== "/v1/messages/count_tokens")) {
    return new Response("Not found\n", { status: 404 })
  }

  const body = (await request.json()) as Record<string, unknown>
  if (typeof body.model === "string") body.model = maasModelId(body.model)

  const headers = new Headers()
  for (const name of ["authorization", "x-api-key", "anthropic-version", "anthropic-beta", "content-type"] as const) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  if (!headers.has("content-type")) headers.set("content-type", "application/json")

  const response = await fetch(`${maasAnthropicUrl}${gatewayPath}${url.search}`, {
    method: request.method,
    headers,
    body: JSON.stringify(body),
  })
  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete("content-encoding")
  responseHeaders.delete("content-length")
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

async function installer() {
  return new Response(Bun.file(new URL("./install.sh", import.meta.url)), {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

function claudeMaasSh() {
  return new Response(`#!/usr/bin/env bash
set -euo pipefail

if [ -z "\${HUAWEI_CLOUD_MAAS_API_KEY:-}" ]; then
  printf '%s\n' 'Set HUAWEI_CLOUD_MAAS_API_KEY before running this installer.' >&2
  exit 1
fi

mkdir -p "$HOME/.claude"
cat > "$HOME/.claude/huawei-maas-api-key" <<EOF
#!/usr/bin/env sh
printf '%s\\n' '$HUAWEI_CLOUD_MAAS_API_KEY'
EOF
chmod 700 "$HOME/.claude/huawei-maas-api-key"

node <<'NODE'
const fs = require("fs")
const os = require("os")
const path = require("path")
const file = path.join(os.homedir(), ".claude", "settings.json")
const settings = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {}
settings.model = "claude-huawei-maas-glm-5.2"
settings.apiKeyHelper = path.join(os.homedir(), ".claude", "huawei-maas-api-key")
settings.env = {
  ...(settings.env || {}),
  ANTHROPIC_BASE_URL: "${publicUrl}/huawei-maas/anthropic",
  CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY: "1",
}
delete settings.env.ANTHROPIC_API_KEY
fs.writeFileSync(file, JSON.stringify(settings, null, 2) + "\\n")
NODE

printf '%s\n' 'Claude Code is configured for Huawei Cloud MaaS. Run: claude'
`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

function claudeMaasPs1() {
  return new Response(`$ErrorActionPreference = "Stop"

if (-not $env:HUAWEI_CLOUD_MAAS_API_KEY) {
  Write-Error "Set HUAWEI_CLOUD_MAAS_API_KEY before running this installer."
}

New-Item -ItemType Directory -Force "$HOME/.claude" | Out-Null
Set-Content -Path "$HOME/.claude/huawei-maas-api-key.cmd" -Value "@echo off", "echo $env:HUAWEI_CLOUD_MAAS_API_KEY"

node -e "const fs=require('fs'),os=require('os'),path=require('path');const file=path.join(os.homedir(),'.claude','settings.json');const settings=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};settings.model='claude-huawei-maas-glm-5.2';settings.apiKeyHelper=path.join(os.homedir(),'.claude','huawei-maas-api-key.cmd');settings.env={...(settings.env||{}),ANTHROPIC_BASE_URL:'${publicUrl}/huawei-maas/anthropic',CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY:'1'};delete settings.env.ANTHROPIC_API_KEY;fs.writeFileSync(file,JSON.stringify(settings,null,2)+'\\n')"

Write-Host "Claude Code is configured for Huawei Cloud MaaS. Run: claude"
`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

async function maasPlugin() {
  return new Response(Bun.file(new URL(`./${maasPluginTarball}`, import.meta.url)), {
    status: 200,
    headers: {
      "content-type": "application/gzip",
      "content-disposition": `attachment; filename="${maasPluginTarball}"`,
      "cache-control": "no-store",
    },
  })
}

Bun.serve({
  port,
  fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === "/favicon-v3.svg") return favicon()
    if (url.pathname === "/robots.txt") return robots()
    if (url.pathname === "/sitemap.xml") return sitemap()
    if (url.pathname === "/install.sh") return installer()
    if (url.pathname === "/claude-maas.sh") return claudeMaasSh()
    if (url.pathname === "/claude-maas.ps1") return claudeMaasPs1()
    if (url.pathname === "/opencode-maas.tgz") return maasPlugin()
    if (url.pathname === "/codex-maas-models.json") return codexMaasCatalog()
    if (url.pathname.startsWith("/huawei-maas/anthropic")) return claudeGateway(request, url)
    if (url.pathname.startsWith("/download/cli/")) return cliAsset(url)
    if (url.pathname === "/download/windows-x64-nsis") return desktopWindows()
    if (url.pathname !== "/") return new Response("Not found\n", { status: 404 })
    if (isCliRequest(request)) return installer()
    return new Response(page(), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    })
  },
})

console.log(`installer-site listening on ${port}`)
