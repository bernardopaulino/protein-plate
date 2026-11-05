"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/**
 * Mudar de idioma: a mesma página na outra língua (o português sem prefixo, o inglês em /en). Um
 * link a sério (o Google e os leitores de ecrã veem o hreflang). Sem a pesquisa da página: o
 * useSearchParams obrigava as páginas estáticas a renderizar no cliente.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const t = useTranslations("lang");
  const locale = useLocale() as Locale;
  const other: Locale = locale === "pt" ? "en" : "pt";
  const pathname = usePathname();

  return (
    <Link
      href={pathname}
      locale={other}
      hrefLang={HTML_LANG[other]}
      lang={HTML_LANG[other]}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-semibold text-muted transition-colors duration-200 hover:border-primary/50 hover:text-text",
        className,
      )}
    >
      <Languages aria-hidden className="size-4" />
      {t("switch")}
    </Link>
  );
}
