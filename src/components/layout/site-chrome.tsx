import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/90 backdrop-blur">
      <div className="app-container flex h-16 items-center justify-between">
        <Link href="/" aria-label={t("home")} className="rounded-lg">
          <Logo />
        </Link>
        <TopNav />
      </div>
    </header>
  );
}

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="app-container pt-12 pb-28 text-sm text-muted md:pb-12">
      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-text">Protein Plate.</span> {t("tagline")}{" "}
          {t("source")}
        </p>
        <ul className="flex gap-4">
          <li>
            <Link href="/privacidade" className="underline underline-offset-4 hover:no-underline">
              {t("privacy")}
            </Link>
          </li>
          <li>
            <Link href="/termos" className="underline underline-offset-4 hover:no-underline">
              {t("terms")}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export { BottomNav };
