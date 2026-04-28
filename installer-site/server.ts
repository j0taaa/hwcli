import fs from "node:fs/promises"

const publicUrl = "https://cli.hwctools.site"
const windowsAssetUrl =
  process.env.WINDOWS_ASSET_URL ||
  "https://github.com/anomalyco/opencode/releases/latest/download/opencode-desktop-windows-x64.exe"
const windowsAssetPath = process.env.WINDOWS_ASSET_PATH
const cliReleaseRepo = process.env.CLI_RELEASE_REPO || "anomalyco/opencode"
const port = Number(process.env.PORT || 3000)

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
    <title>HWCLI Installer</title>
    <link rel="icon" type="image/svg+xml" href="/favicon-v3.svg" />
    <meta name="theme-color" content="#c7002b" />
    <meta name="theme-color" content="#170608" media="(prefers-color-scheme: dark)" />
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
          <pre><code>curl -fsSL ${publicUrl} | bash</code></pre>
          <div class="links">
            <a href="/install.sh">View install.sh</a>
          </div>
        </section>
        <section class="card">
          <div class="eyebrow">Windows Desktop</div>
          <h2>HWCLI Desktop for Windows</h2>
          <a class="cta" href="/download/windows-x64-nsis?v=hwcli-local-1">Download for Windows</a>
          <div class="meta">64-bit Windows installer (.exe)</div>
        </section>
      </div>
    </main>
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
          "cache-control": "no-store",
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
  headers.set("cache-control", "no-store")
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

async function installer() {
  return new Response(Bun.file(new URL("./install.sh", import.meta.url)), {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}

Bun.serve({
  port,
  fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === "/favicon-v3.svg") return favicon()
    if (url.pathname === "/install.sh") return installer()
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
