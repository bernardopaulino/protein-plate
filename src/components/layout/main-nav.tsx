"use client";

import { BookOpen, CircleUserRound, Salad, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
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

/** Navegação: barra inferior no telemóvel, superior no desktop (secção 10). */
export function TopNav() {
  const t = useTranslations("nav");
  const isActive = useActive();
  return (
    <nav aria-label={t("label")} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {ITEMS.map(({ href, key }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 font-semibold text-muted transition-colors duration-200 hover:text-text",
                isActive(href) && "bg-primary-soft text-text",
              )}
            >
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BottomNav() {
  const t = useTranslations("nav");
  const isActive = useActive();
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
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-muted",
                  active && "text-primary",
                )}
              >
                <Icon aria-hidden className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
