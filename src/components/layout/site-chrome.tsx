import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitch } from "./language-switch";
import { BottomNav, TopNav } from "./main-nav";

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight">
      <svg aria-hidden viewBox="0 0 32 32" className="size-8">
        <circle cx="16" cy="16" r="15" fill="var(--primary)" />
        <circle cx="16" cy="16" r="9.5" fill="var(--bg)" />
        <path d="M16 6.5a9.5 9.5 0 0 1 9.5 9.5H16z" fill="var(--accent)" />
      </svg>
      Protein Plate
    </span>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg">
      <div className="app-container flex h-16 items-center justify-between">
        <Link href="/" aria-label={t("home")} className="rounded-lg">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <TopNav />
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const t = useTranslations("footer");
  const locale = useLocale();
  return (
    <footer className="app-container pt-16 pb-28 text-sm text-muted md:pb-12">
      <div className="flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="font-display text-lg font-bold text-text">
            {t("tagline")}{" "}
            {locale === "pt" ? <span lang="en">Protein without the diet.</span> : null}
          </p>
          <p className="max-w-md">{t("source")}</p>
        </div>
        <ul className="flex gap-4">
          <li>
            <Link
              href="/privacidade"
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:no-underline"
            >
              {t("privacy")}
            </Link>
          </li>
          <li>
            <Link
              href="/termos"
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:no-underline"
            >
              {t("terms")}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export { BottomNav };
