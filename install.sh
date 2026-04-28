#!/usr/bin/env bash

set -euo pipefail

REPO="j0taaa/hwcli"
INSTALL_URL="https://cli.hwctools.site"

log() {
  printf '%s\n' "$*"
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

append_path_line() {
  profile_file="$1"
  path_line="$2"

  if [ ! -f "$profile_file" ]; then
    printf '%s\n' "$path_line" > "$profile_file"
    return
  fi

  grep -Fqx "$path_line" "$profile_file" && return
  printf '\n%s\n' "$path_line" >> "$profile_file"
}

download() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1" -o "$2"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO "$2" "$1"
    return
  fi

  fail "curl or wget is required"
}

ensure_bun() {
  if command -v bun >/dev/null 2>&1; then
    return
  fi

  BUN_INSTALL_DIR="${BUN_INSTALL:-$HOME/.bun}"
  BUN_INSTALL_SCRIPT="$TMP_DIR/bun-install.sh"

  log "Bun not found, installing Bun to $BUN_INSTALL_DIR"
  download "https://bun.sh/install" "$BUN_INSTALL_SCRIPT"
  env BUN_INSTALL="$BUN_INSTALL_DIR" bash "$BUN_INSTALL_SCRIPT"
  export PATH="$BUN_INSTALL_DIR/bin:$PATH"

  command -v bun >/dev/null 2>&1 || fail "bun install failed"
}

write_wrapper() {
  cat > "$1" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec bun run --cwd "$SOURCE_DIR/packages/opencode" --conditions=browser ./src/index.ts "\$@"
EOF
  chmod 755 "$1"
}

install_from_source() {
  need bash
  ensure_bun

  SOURCE_DIR="${HWCLI_SOURCE_DIR:-$HOME/.hwcli/source}"
  SOURCE_ARCHIVE="$TMP_DIR/source.tar.gz"
  EXTRACT_DIR="$TMP_DIR/source"
  rm -rf "$SOURCE_DIR"
  mkdir -p "$(dirname "$SOURCE_DIR")"
  mkdir -p "$EXTRACT_DIR"

  log "Release asset unavailable, installing from source archive"
  if [ "$VERSION_INPUT" = "latest" ]; then
    SOURCE_URLS="https://codeload.github.com/$REPO/tar.gz/refs/heads/dev"
  else
    SOURCE_URLS="https://codeload.github.com/$REPO/tar.gz/refs/tags/v$VERSION_TAG https://codeload.github.com/$REPO/tar.gz/refs/tags/$VERSION_TAG https://codeload.github.com/$REPO/tar.gz/refs/heads/dev"
  fi

  DOWNLOADED_SOURCE_URL=""
  for source_url in $SOURCE_URLS; do
    if download "$source_url" "$SOURCE_ARCHIVE" 2>/dev/null; then
      DOWNLOADED_SOURCE_URL="$source_url"
      break
    fi
  done

  [ -n "$DOWNLOADED_SOURCE_URL" ] || fail "failed to download source archive"

  tar -xzf "$SOURCE_ARCHIVE" -C "$EXTRACT_DIR"
  SOURCE_ROOT=""
  for source_root in "$EXTRACT_DIR"/*; do
    if [ -d "$source_root" ]; then
      SOURCE_ROOT="$source_root"
      break
    fi
  done
  [ -n "$SOURCE_ROOT" ] || fail "source archive did not contain the expected directory"

  if ! mv "$SOURCE_ROOT" "$SOURCE_DIR"; then
    rm -rf "$SOURCE_DIR"
    mv "$SOURCE_ROOT" "$SOURCE_DIR"
  fi

  bun install --cwd "$SOURCE_DIR" --ignore-scripts
  write_wrapper "$INSTALL_DIR/hwcli"
  write_wrapper "$INSTALL_DIR/opencode"
  log "Installed source checkout to $SOURCE_DIR"
}

supports_avx2() {
  if [ "$ARCH" != "x64" ]; then
    return 1
  fi

  if [ "$OS" = "linux" ] && [ -r /proc/cpuinfo ]; then
    grep -qi 'avx2' /proc/cpuinfo
    return
  fi

  if [ "$OS" = "darwin" ] && command -v sysctl >/dev/null 2>&1; then
    [ "$(sysctl -n hw.optional.avx2_0 2>/dev/null || true)" = "1" ]
    return
  fi

  return 1
}

detect_libc() {
  if [ "$OS" != "linux" ]; then
    return
  fi

  if [ -f /etc/alpine-release ]; then
    printf 'musl'
    return
  fi

  if command -v ldd >/dev/null 2>&1 && ldd --version 2>&1 | grep -qi 'musl'; then
    printf 'musl'
    return
  fi

  printf 'glibc'
}

pick_install_dir() {
  if [ -n "${OPENCODE_INSTALL_DIR:-}" ]; then
    printf '%s' "$OPENCODE_INSTALL_DIR"
    return
  fi

  if [ -n "${XDG_BIN_DIR:-}" ]; then
    printf '%s' "$XDG_BIN_DIR"
    return
  fi

  if printf ':%s:' "${PATH:-}" | grep -q ":$HOME/.local/bin:"; then
    printf '%s' "$HOME/.local/bin"
    return
  fi

  printf '%s' "$HOME/.opencode/bin"
}

ensure_install_dir_on_path() {
  if printf ':%s:' "${PATH:-}" | grep -q ":$INSTALL_DIR:"; then
    return
  fi

  PATH_LINE="export PATH=\"$INSTALL_DIR:\$PATH\""
  [ -n "${HOME:-}" ] || return

  append_path_line "$HOME/.bashrc" "$PATH_LINE"

  if [ -n "${ZSH_VERSION:-}" ] || [ -f "$HOME/.zshrc" ]; then
    append_path_line "$HOME/.zshrc" "$PATH_LINE"
  fi
}

OS_RAW="$(uname -s)"
ARCH_RAW="$(uname -m)"

case "$OS_RAW" in
  Linux) OS="linux" ;;
  Darwin) OS="darwin" ;;
  *) fail "unsupported platform: $OS_RAW" ;;
esac

case "$ARCH_RAW" in
  x86_64|amd64) ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) fail "unsupported architecture: $ARCH_RAW" ;;
esac

LIBC="$(detect_libc)"
BASELINE=""
if ! supports_avx2; then
  BASELINE="-baseline"
fi

if [ "$OS" = "linux" ]; then
  if [ "$ARCH" = "arm64" ] && [ "$LIBC" = "musl" ]; then
    ASSET="opencode-linux-arm64-musl.tar.gz"
  elif [ "$ARCH" = "x64" ] && [ "$LIBC" = "musl" ]; then
    ASSET="opencode-linux-x64${BASELINE}-musl.tar.gz"
  else
    ASSET="opencode-linux-${ARCH}${BASELINE}.tar.gz"
  fi
else
  ASSET="opencode-darwin-${ARCH}${BASELINE}.zip"
fi

VERSION_INPUT="${VERSION:-latest}"
if [ "$VERSION_INPUT" = "latest" ]; then
  ASSET_URL="https://github.com/$REPO/releases/latest/download/$ASSET"
else
  VERSION_TAG="${VERSION_INPUT#v}"
  ASSET_URL="https://github.com/$REPO/releases/download/v$VERSION_TAG/$ASSET"
fi

INSTALL_DIR="$(pick_install_dir)"
TMP_DIR="$(mktemp -d)"
ARCHIVE_PATH="$TMP_DIR/$ASSET"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

need mkdir
need chmod
need install
need rm
need tar

if [ "$OS" != "linux" ]; then
  need unzip
fi

mkdir -p "$INSTALL_DIR"
ensure_install_dir_on_path

log "Installing HWCLI from $ASSET_URL"
if download "$ASSET_URL" "$ARCHIVE_PATH"; then
  if [ "$OS" = "linux" ]; then
    tar -xzf "$ARCHIVE_PATH" -C "$TMP_DIR"
  else
    unzip -oq "$ARCHIVE_PATH" -d "$TMP_DIR"
  fi

  [ -f "$TMP_DIR/opencode" ] || fail "archive did not contain the expected binary"

  install -m 755 "$TMP_DIR/opencode" "$INSTALL_DIR/hwcli"
  install -m 755 "$TMP_DIR/opencode" "$INSTALL_DIR/opencode"
else
  install_from_source
fi

log "Installed to $INSTALL_DIR/hwcli"
if ! printf ':%s:' "${PATH:-}" | grep -q ":$INSTALL_DIR:"; then
  log "Add $INSTALL_DIR to PATH to run hwcli directly"
  log "Open a new shell or run: export PATH=\"$INSTALL_DIR:\$PATH\""
fi
log "Run: hwcli"
log "Re-run this installer to refresh your install"
log "Installer URL: $INSTALL_URL"
