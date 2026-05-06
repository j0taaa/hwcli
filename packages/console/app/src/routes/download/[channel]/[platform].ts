import type { APIEvent } from "@solidjs/start"
import type { DownloadPlatform } from "../types"

const prodAssetNames: Record<string, string> = {
  "darwin-aarch64-dmg": "opencode-desktop-darwin-aarch64.dmg",
  "darwin-x64-dmg": "opencode-desktop-darwin-x64.dmg",
  "windows-x64-nsis": "opencode-desktop-windows-x64.exe",
  "linux-x64-deb": "opencode-desktop-linux-amd64.deb",
  "linux-x64-appimage": "opencode-desktop-linux-amd64.AppImage",
  "linux-x64-rpm": "opencode-desktop-linux-x86_64.rpm",
} satisfies Record<DownloadPlatform, string>

const betaAssetNames: Record<string, string> = {
  "darwin-aarch64-dmg": "opencode-electron-mac-arm64.dmg",
  "darwin-x64-dmg": "opencode-electron-mac-x64.dmg",
  "windows-x64-nsis": "opencode-electron-win-x64.exe",
  "linux-x64-deb": "opencode-electron-linux-amd64.deb",
  "linux-x64-appimage": "opencode-electron-linux-x86_64.AppImage",
  "linux-x64-rpm": "opencode-electron-linux-x86_64.rpm",
} satisfies Record<DownloadPlatform, string>

// Doing this on the server lets us preserve the original name for platforms we don't care to rename for
const downloadNames: Record<string, string> = {
  "darwin-aarch64-dmg": "HWCLI Desktop.dmg",
  "darwin-x64-dmg": "HWCLI Desktop.dmg",
  "windows-x64-nsis": "HWCLI Desktop Installer.exe",
} satisfies { [K in DownloadPlatform]?: string }

export async function GET({ params: { platform, channel } }: APIEvent) {
  const assetName = channel === "stable" ? prodAssetNames[platform] : betaAssetNames[platform]
  if (!assetName) return new Response(null, { status: 404 })
  const isStableWindows = channel === "stable" && platform === "windows-x64-nsis"

  const assetUrl = isStableWindows
    ? "https://cli.hwctools.site/download/windows-x64-nsis"
    : `https://github.com/anomalyco/${channel === "stable" ? "opencode" : "opencode-beta"}/releases/latest/download/${assetName}`

  const resp = await fetch(assetUrl)

  const downloadName = downloadNames[platform]

  const headers = new Headers(resp.headers)
  if (downloadName) headers.set("content-disposition", `attachment; filename="${downloadName}"`)
  headers.set("cache-control", "no-store, no-cache, must-revalidate")

  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers })
}
