"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatProtein, roundForDisplay } from "@/domain/protein";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { ProteinNumber } from "./protein-number";

/**
 * Barra de progresso grossa até à meta. Abaixo da meta é "Faltam X g" (nunca vermelho); a mensagem
 * está numa região aria-live para os leitores de ecrã.
 */
export function GoalProgress({
  total,
  target,
  sticky = false,
  className,
}: {
  total: number;
  target: number;
  sticky?: boolean;
  className?: string;
}) {
  const t = useTranslations("today");
  const locale = HTML_LANG[useLocale() as Locale];
  const ratio = target > 0 ? Math.min(1, total / target) : 0;
  const missing = Math.max(0, target - total);
  const reached = roundForDisplay(missing) === 0;
  const over = total - target;

  const message = !reached
    ? t("missing", { grams: formatProtein(missing, locale) })
    : roundForDisplay(over) >= 1
      ? t("over", { grams: formatProtein(over, locale) })
      : t("reached");

  return (
    <section
      aria-label={t("progressLabel")}
      className={cn(
        "rounded-card border border-border bg-surface p-4 shadow-sm",
        sticky && "sticky top-[4.5rem] z-30",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <p className="flex shrink-0 items-baseline gap-2">
          <ProteinNumber value={total} size="xl" />
          <span className="whitespace-nowrap text-muted tabular">
            {t("ofTarget", { target: formatProtein(target, locale) })}
          </span>
        </p>
        <p
          aria-live="polite"
          aria-atomic="true"
          className={cn("ml-auto text-right font-semibold", reached && "text-primary")}
        >
          {message}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={t("progressLabel")}
        aria-valuemin={0}
        aria-valuemax={Math.round(target)}
        aria-valuenow={Math.round(Math.min(total, target))}
        aria-valuetext={`${formatProtein(total, locale)} g ${t("ofTarget", { target: formatProtein(target, locale) })}`}
        className="mt-3 h-4 overflow-hidden rounded-full bg-track"
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-[width] duration-250 ease-out",
            reached && "bg-[linear-gradient(90deg,var(--primary)_80%,var(--accent))]",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </section>
  );
}
