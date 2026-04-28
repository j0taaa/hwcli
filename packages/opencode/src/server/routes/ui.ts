import { Flag } from "@/flag/flag"
import { Hono } from "hono"
import { proxy } from "hono/proxy"
import { getMimeType } from "hono/utils/mime"
import { createHash } from "node:crypto"
import fs from "node:fs/promises"

const LOCAL_UI_ASSETS = new URL("../../../../ui/src/assets/favicon/", import.meta.url)
const LOCAL_UI_FILES: Record<string, string> = {
  "/apple-touch-icon-v3.png": "apple-touch-icon-v3.png",
  "/apple-touch-icon.png": "apple-touch-icon.png",
  "/favicon-96x96-v3.png": "favicon-96x96-v3.png",
  "/favicon-96x96.png": "favicon-96x96.png",
  "/favicon-v3.ico": "favicon-v3.ico",
  "/favicon-v3.svg": "favicon-v3.svg",
  "/favicon.ico": "favicon.ico",
  "/favicon.svg": "favicon.svg",
  "/site.webmanifest": "site.webmanifest",
  "/web-app-manifest-192x192.png": "web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png": "web-app-manifest-512x512.png",
}

const embeddedUIPromise = Flag.OPENCODE_DISABLE_EMBEDDED_WEB_UI
  ? Promise.resolve(null)
  : // @ts-expect-error - generated file at build time
    import("opencode-web-ui.gen.ts").then((module) => module.default as Record<string, string>).catch(() => null)

const HWCLI_THEME = `<style id="hwcli-theme">:root[data-color-scheme="light"]{--background-base:#fff5f5;--background-stronger:#ffe6e6;--surface-base:#fff8f8;--surface-base-hover:#fff0f0;--surface-raised-base:#fff1f1;--surface-raised-base-hover:#ffe4e4;--surface-interactive-weak:#fff0f1;--surface-critical-base:#ffe4e6;--text-strong:#2f0b11;--text-base:#7a4149;--text-weak:#a15f68;--text-interactive-base:#cf0a2c;--text-diff-delete-base:#cf0a2c;--text-diff-delete-strong:#7d1023;--button-primary-base:#cf0a2c;--border-base:rgba(154,21,45,.24);--border-weak-base:#f1c8cf;--border-weaker-base:#f8dadd;--border-interactive-base:#f28a9b;--border-interactive-hover:#e95a72;--border-interactive-active:#cf0a2c;--border-interactive-selected:#cf0a2c;--icon-base:#b44457;--icon-hover:#92273a;--icon-active:#7d1023;--icon-strong-base:#cf0a2c;--icon-weak-base:#efc2c8;--icon-interactive-base:#cf0a2c;--syntax-keyword:#cf0a2c;--syntax-primitive:#de1b43;--syntax-property:#a32039;--syntax-critical:#cf0a2c}:root[data-color-scheme="dark"]{--background-base:#170608;--background-stronger:#24090d;--surface-base:#21080c;--surface-base-hover:#2b0d12;--surface-raised-base:#280d11;--surface-raised-base-hover:#321116;--surface-interactive-weak:#340a12;--surface-critical-base:#3d1018;--text-strong:#fff1f2;--text-base:#f2b9c0;--text-weak:#d68a95;--text-interactive-base:#ff4d6d;--text-diff-delete-base:#ff6b86;--text-diff-delete-strong:#ffd8de;--button-primary-base:#cf0a2c;--border-base:rgba(255,101,130,.28);--border-weak-base:#4c1820;--border-weaker-base:#361015;--border-interactive-base:#8b2435;--border-interactive-hover:#bc3147;--border-interactive-active:#ff4d6d;--border-interactive-selected:#ff4d6d;--icon-base:#d6808d;--icon-hover:#ff9aaa;--icon-active:#ffe0e5;--icon-strong-base:#ff6b86;--icon-weak-base:#4f1a23;--icon-interactive-base:#ff4d6d;--syntax-keyword:#ff6b86;--syntax-primitive:#ff8ca2;--syntax-property:#ff4d6d;--syntax-critical:#ff6b86}</style>`
const HWCLI_BRANDING_SCRIPT = `;(function(){document.title="HWCLI";var lightMeta=document.querySelector('meta[name="theme-color"]:not([media])');if(lightMeta)lightMeta.setAttribute("content","#cf0a2c");var darkMeta=document.querySelector('meta[name="theme-color"][media]');if(darkMeta)darkMeta.setAttribute("content","#170608");var patchSVG=function(svg){if(!(svg instanceof SVGElement)||svg.dataset.hwcliPatched)return false;var viewBox=svg.getAttribute('viewBox');if(viewBox==='0 0 16 20'){svg.innerHTML='<path data-slot="logo-logo-mark-shadow" d="M12 16H10V10H6V16H4V8H6V6H10V8H12V16Z" fill="var(--icon-weak-base)"></path><path data-slot="logo-logo-mark-h" d="M4 4V16H6V10H10V16H12V4H10V8H6V4H4ZM16 20H0V0H16V20Z" fill="var(--icon-strong-base)"></path>';svg.dataset.hwcliPatched='1';return true}if(viewBox==='0 0 80 100'){svg.innerHTML='<path d="M60 80H50V50H30V80H20V40H30V30H50V40H60V80Z" fill="var(--icon-base)"></path><path d="M20 20V80H30V50H50V80H60V20H50V40H30V20H20ZM80 100H0V0H80V100Z" fill="var(--icon-strong-base)"></path>';svg.dataset.hwcliPatched='1';return true}if(viewBox==='0 0 234 42'){svg.innerHTML='<g><path d="M18 30H15V18H9V30H6V12H9V9H15V12H18V30Z" fill="var(--icon-weak-base)"></path><path d="M6 6V30H9V18H15V30H18V6H15V12H9V6H6ZM24 36H0V0H24V36Z" fill="var(--icon-base)"></path><path d="M48 30H36V18H48V30Z" fill="var(--icon-weak-base)"></path><path d="M36 30H48V12H36V30ZM54 36H36V42H30V6H54V36Z" fill="var(--icon-base)"></path><path d="M84 24V30H66V24H84Z" fill="var(--icon-weak-base)"></path><path d="M84 24H66V30H84V36H60V6H84V24ZM66 18H78V12H66V18Z" fill="var(--icon-base)"></path><path d="M108 36H96V18H108V36Z" fill="var(--icon-weak-base)"></path><path d="M108 12H96V36H90V6H108V12ZM114 36H108V12H114V36Z" fill="var(--icon-base)"></path><path d="M144 30H126V18H144V30Z" fill="var(--icon-weak-base)"></path><path d="M144 12H126V30H144V36H120V6H144V12Z" fill="var(--icon-strong-base)"></path><path d="M168 30H156V18H168V30Z" fill="var(--icon-weak-base)"></path><path d="M168 12H156V30H168V12ZM174 36H150V6H174V36Z" fill="var(--icon-strong-base)"></path><path d="M198 30H186V18H198V30Z" fill="var(--icon-weak-base)"></path><path d="M198 12H186V30H198V12ZM204 36H180V6H198V0H204V36Z" fill="var(--icon-strong-base)"></path><path d="M234 24V30H216V24H234Z" fill="var(--icon-weak-base)"></path><path d="M216 12V18H228V12H216ZM234 24H216V30H234V36H210V6H234V24Z" fill="var(--icon-strong-base)"></path></g>';svg.dataset.hwcliPatched='1';return true}return false};var rewrite=function(){document.querySelectorAll('svg').forEach(patchSVG)};var tries=0;var apply=function(){rewrite();if(document.querySelector('[data-hwcli-wordmark]'))return true;var logo=document.querySelector('#root svg[viewBox="0 0 234 42"]');if(!logo||!logo.parentElement)return false;logo.setAttribute('style','display:none');var block=document.createElement('div');block.setAttribute('data-hwcli-wordmark','');block.innerHTML='<div style="margin-inline:auto;display:flex;max-width:42rem;flex-direction:column;align-items:center;text-align:center"><div style="font-size:clamp(3rem,9vw,5.5rem);font-weight:700;letter-spacing:.28em;padding-left:.28em;line-height:.95;color:var(--text-strong)">HWCLI</div><div style="margin-top:.9rem;font-size:12px;letter-spacing:.18em;color:var(--text-weak)">CODING AGENT FOR HUAWEI CLOUD</div></div>';logo.parentElement.insertBefore(block,logo);return true};var tick=function(){rewrite();if(apply()||tries++>80)return;setTimeout(tick,125)};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",tick,{once:true});else tick()})()`
const PRELOAD_SCRIPT = /<script\b(?![^>]*\bsrc\s*=)[^>]*\bid=(['"])oc-theme-preload-script\1[^>]*>([\s\S]*?)<\/script>/i

const DEFAULT_CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' data:; connect-src 'self' data:"

const csp = (hash = "") =>
  `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'${hash ? ` 'sha256-${hash}'` : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' data:; connect-src 'self' data:`

async function localAsset(path: string) {
  const file = LOCAL_UI_FILES[path]
  if (!file) return
  const target = new URL(file, LOCAL_UI_ASSETS)
  if (!(await fs.exists(target))) return
  return target
}

function brandHtml(input: string) {
  const withTheme = input.replace("</head>", `${HWCLI_THEME}</head>`)
  const withTitle = withTheme
    .replace(/<title>.*?<\/title>/i, "<title>HWCLI</title>")
    .replace(/<meta name="theme-color" content="[^"]*"\s*\/>/i, '<meta name="theme-color" content="#cf0a2c" />')
    .replace(
      /<meta name="theme-color" content="[^"]*" media="\(prefers-color-scheme: dark\)"\s*\/>/i,
      '<meta name="theme-color" content="#170608" media="(prefers-color-scheme: dark)" />',
    )
  return withTitle.replace(PRELOAD_SCRIPT, (_match, quote, script) => {
    return `<script id=${quote}oc-theme-preload-script${quote}>${script}\n${HWCLI_BRANDING_SCRIPT}</script>`
  })
}

function proxyHeaders(headers: Headers) {
  const next = new Headers(headers)
  next.delete("content-length")
  return next
}

export const UIRoutes = (): Hono =>
  new Hono().all("/*", async (c) => {
    const embeddedWebUI = await embeddedUIPromise
    const path = c.req.path
    const asset = await localAsset(path)

    if (asset) {
      const mime = getMimeType(asset.pathname) ?? "application/octet-stream"
      c.header("Content-Type", mime)
      return c.body(new Uint8Array(await fs.readFile(asset)))
    }

    if (embeddedWebUI) {
      const match = embeddedWebUI[path.replace(/^\//, "")] ?? embeddedWebUI["index.html"] ?? null
      if (!match) return c.json({ error: "Not Found" }, 404)

      if (await fs.exists(match)) {
        const mime = getMimeType(match) ?? "text/plain"
        c.header("Content-Type", mime)
        if (mime.startsWith("text/html")) {
          c.header("Content-Security-Policy", DEFAULT_CSP)
        }
        return c.body(new Uint8Array(await fs.readFile(match)))
      } else {
        return c.json({ error: "Not Found" }, 404)
      }
    } else {
      const response = await proxy(`https://app.opencode.ai${path}`, {
        raw: c.req.raw,
        headers: {
          ...Object.fromEntries(c.req.raw.headers.entries()),
          host: "app.opencode.ai",
        },
      })
      if (!response.headers.get("content-type")?.includes("text/html")) {
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: proxyHeaders(response.headers),
        })
      }
      const html = brandHtml(await response.text())
      const match = html.match(PRELOAD_SCRIPT)
      const hash = match ? createHash("sha256").update(match[2]).digest("base64") : ""
      const headers = proxyHeaders(response.headers)
      headers.set("Content-Security-Policy", csp(hash))
      headers.set("Content-Type", "text/html; charset=utf-8")
      return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    }
  })
