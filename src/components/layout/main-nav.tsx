"use client";

import { BookOpen, CircleUserRound, Salad, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectorGlyph } from "@/components/wheel/sector-glyph";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/o-meu-dia", key: "today", Icon: Sun },
  { href: "/alimentos", key: "foods", Icon: Salad },
  { href: "/receitas", key: "recipes", Icon: BookOpen },
  { href: "/conta", key: "account", Icon: CircleUserRound },
] as const;

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegação: barra inferior no telemóvel, superior no desktop (secção 10). As quatro secções são
 * as quatro fatias de uma roda (como o logótipo): a ativa acende a sua.
 */
export function TopNav() {
  const t = useTranslations("nav");
  const isActive = useActive();
  return (
    <nav aria-label={t("label")} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {ITEMS.map(({ href, key }, index) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 font-semibold text-muted transition-colors duration-200 hover:text-text",
                  active && "text-text",
                )}
              >
                <SectorGlyph
                  parts={ITEMS.length}
                  filled={[index]}
                  className={cn(
                    "size-4 transition-opacity duration-300 ease-out",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Ecrãs com a sua própria barra de ações em baixo (o formulário inicial) ou sem app ainda. */
const WITHOUT_BOTTOM_NAV = ["/comecar", "/conta/preferencias", "/entrar"];

export function BottomNav() {
  const t = useTranslations("nav");
  const isActive = useActive();
  const pathname = usePathname();
  if (WITHOUT_BOTTOM_NAV.includes(pathname)) return null;
  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {ITEMS.map(({ href, key, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-muted",
                  active && "text-text",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn("size-6", active && "text-primary")}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
