"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatKcal } from "@/domain/calories";
import { formatProtein, roundForDisplay } from "@/domain/protein";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { ProteinNumber } from "./protein-number";

export interface ProgressSegment {
  key: string;
  value: number;
  /** A cor da fatia (ex.: "var(--meal-almoco)"). */
  color: string;
}

/**
 * Barra de progresso grossa até à meta: a roda desenrolada, com um segmento por refeição na cor da
 * sua fatia (sem segmentos, uma só cor). Abaixo da meta é "Faltam X g" (nunca vermelho); a mensagem
 * está numa região aria-live para os leitores de ecrã. Com `kcal`, uma linha discreta com as
 * calorias dos alimentos do dia (só informação, nunca uma meta).
 */
export function GoalProgress({
  total,
  target,
  kcal,
  segments,
  sticky = false,
  className,
}: {
  total: number;
  target: number;
  /** Calorias dos alimentos do dia (só com "Calorias" ligado) */
  kcal?: number;
  /** A proteína de cada refeição, pela ordem do dia. */
  segments?: readonly ProgressSegment[];
  sticky?: boolean;
  className?: string;
}) {
  const t = useTranslations("today");
  const locale = HTML_LANG[useLocale() as Locale];
  const ratio = target > 0 ? Math.min(1, total / target) : 0;
  const missing = Math.max(0, target - total);
  const reached = roundForDisplay(missing) === 0;
  const over = total - target;
  // Cada refeição ocupa a sua parte do que já há (escalado para caber na barra quando passa a meta)
  const scale = target > 0 ? Math.min(1, total / target) / Math.max(total, 1e-9) : 0;
  const parts =
    segments && segments.length > 0
      ? segments
          .filter((s) => s.value > 0)
          .map((s) => ({ key: s.key, color: s.color, width: s.value * scale * 100 }))
      : [{ key: "total", color: "var(--primary)", width: ratio * 100 }];

  const message = !reached
    ? t("missing", { grams: formatProtein(missing, locale) })
    : roundForDisplay(over) >= 1
      ? t("over", { grams: formatProtein(over, locale) })
      : t("reached");

  return (
    <section
      aria-label={t("progressLabel")}
      className={cn(
        "rounded-[1.75rem] border border-border bg-surface p-4 sm:p-5",
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
        className={cn(
          "mt-3 rounded-full p-[3px] transition-colors duration-300 ease-out",
          // Ao chegar à meta, o --accent só como fundo: uma moldura à volta da barra cheia
          reached ? "bg-accent" : "bg-track",
        )}
      >
        <div className="flex h-4 w-full overflow-hidden rounded-full">
          {parts.map((part) => (
            <span
              key={part.key}
              className="h-full shrink-0 border-r-[3px] border-surface transition-[width] duration-250 ease-out last:border-r-0"
              style={{ width: `${part.width}%`, backgroundColor: part.color }}
            />
          ))}
        </div>
      </div>
      {kcal !== undefined ? (
        <p className="mt-2 text-sm text-muted tabular">
          {t("kcalDay", { kcal: formatKcal(kcal, locale) })}
        </p>
      ) : null}
    </section>
  );
}
