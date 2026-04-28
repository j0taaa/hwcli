import { createMemo } from "solid-js"
import { config } from "~/config"
import { useLanguage } from "~/context/language"
import { useI18n } from "~/context/i18n"

export function Footer() {
  const language = useLanguage()
  const i18n = useI18n()
  const community = createMemo(() => {
    const locale = language.locale()
    return locale === "zh" || locale === "zht"
      ? ({ key: "footer.feishu", link: language.route("/feishu") } as const)
      : ({ key: "footer.discord", link: language.route("/discord") } as const)
  })
  return (
    <footer data-component="footer">
      <div data-slot="cell">
        <a href={language.route("/docs")}>{i18n.t("footer.docs")}</a>
      </div>
      <div data-slot="cell">
        <a href={language.route("/changelog")}>{i18n.t("footer.changelog")}</a>
      </div>
      <div data-slot="cell">
        <a href={community().link}>{i18n.t(community().key)}</a>
      </div>
      <div data-slot="cell">
        <a href={config.social.twitter}>{i18n.t("footer.x")}</a>
      </div>
    </footer>
  )
}
