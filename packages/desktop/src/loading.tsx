import { render } from "solid-js/web"
import { MetaProvider } from "@solidjs/meta"
import "@opencode-ai/app/index.css"
import { Font } from "@opencode-ai/ui/font"
import { Mark } from "@opencode-ai/ui/logo"
import { Progress } from "@opencode-ai/ui/progress"
import "./styles.css"
import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js"
import { commands, events, InitStep } from "./bindings"
import { Channel } from "@tauri-apps/api/core"
import { initI18n, t } from "./i18n"

const root = document.getElementById("root")!
const lines = [
  t("desktop.loading.status.initial"),
  t("desktop.loading.status.migrating"),
  t("desktop.loading.status.waiting"),
]
const delays = [3000, 9000]

void initI18n()

render(() => {
  const [step, setStep] = createSignal<InitStep | null>(null)
  const [line, setLine] = createSignal(0)
  const [percent, setPercent] = createSignal(0)

  const phase = createMemo(() => step()?.phase)

  const value = createMemo(() => {
    if (phase() === "done") return 100
    return Math.max(25, Math.min(100, percent()))
  })

  const channel = new Channel<InitStep>()
  channel.onmessage = (next) => setStep(next)
  commands.awaitInitialization(channel as any).catch(() => undefined)

  onMount(() => {
    setLine(0)
    setPercent(0)

    const timers = delays.map((ms, i) => setTimeout(() => setLine(i + 1), ms))

    const listener = events.sqliteMigrationProgress.listen((e) => {
      if (e.payload.type === "InProgress") setPercent(Math.max(0, Math.min(100, e.payload.value)))
      if (e.payload.type === "Done") setPercent(100)
    })

    onCleanup(() => {
      void listener.then((cb) => cb())
      timers.forEach(clearTimeout)
    })
  })

  createEffect(() => {
    if (phase() !== "done") return

    const timer = setTimeout(() => events.loadingWindowComplete.emit(null), 1000)
    onCleanup(() => clearTimeout(timer))
  })

  const status = createMemo(() => {
    if (phase() === "done") return t("desktop.loading.status.done")
    if (phase() === "sqlite_waiting") return lines[line()]
    return t("desktop.loading.status.initial")
  })

  return (
    <MetaProvider>
      <div class="w-screen h-screen bg-background-base flex items-center justify-center">
        <Font />
        <div class="flex flex-col items-center gap-8">
          <div class="flex flex-col items-center gap-4 text-center">
            <div class="inline-flex items-center gap-3 rounded-full border border-border-interactive-base bg-surface-critical-base px-4 py-2 text-12-regular text-text-diff-delete-strong">
              <Mark class="h-5 w-4" />
              <span style={{ "letter-spacing": "0.22em" }}>HWCLI</span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div
                class="text-text-strong"
                style={{
                  "font-size": "clamp(2.75rem, 8vw, 4.75rem)",
                  "font-weight": "700",
                  "letter-spacing": "0.22em",
                  "padding-left": "0.22em",
                  "line-height": "0.95",
                }}
              >
                HWCLI
              </div>
              <div class="text-12-regular text-text-weak" style={{ "letter-spacing": "0.16em" }}>
                CODING AGENT FOR HUAWEI CLOUD
              </div>
            </div>
          </div>
          <div class="w-72 flex flex-col items-center gap-4" aria-live="polite">
            <span class="w-full overflow-hidden text-center text-ellipsis whitespace-nowrap text-text-strong text-14-normal">
              {status()}
            </span>
            <Progress
              value={value()}
              class="w-24 [&_[data-slot='progress-track']]:h-1 [&_[data-slot='progress-track']]:border-0 [&_[data-slot='progress-track']]:rounded-none [&_[data-slot='progress-track']]:bg-surface-weak [&_[data-slot='progress-fill']]:rounded-none [&_[data-slot='progress-fill']]:bg-icon-strong-base"
              aria-label={t("desktop.loading.progressAria")}
              getValueLabel={({ value }) => `${Math.round(value)}%`}
            />
          </div>
        </div>
      </div>
    </MetaProvider>
  )
}, root)
