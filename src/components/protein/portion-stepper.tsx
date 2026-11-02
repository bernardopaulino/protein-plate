"use client";

import { Minus, Plus } from "lucide-react";
import { useLocale } from "next-intl";
import { PORTION_COUNT, formatCount } from "@/domain/protein";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/** Stepper de meia porção (0,5 a 4). Com 0,5 porções, o "−" tira o alimento (se onRemove existir). */
export function PortionStepper({
  count,
  onChange,
  onRemove,
  decreaseLabel,
  increaseLabel,
  removeLabel,
  className,
}: {
  count: number;
  onChange: (count: number) => void;
  onRemove?: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  removeLabel?: string;
  className?: string;
}) {
  const locale = HTML_LANG[useLocale() as Locale];
  const atMin = count <= PORTION_COUNT.min;
  const atMax = count >= PORTION_COUNT.max;
  const button =
    "grid size-11 place-items-center rounded-full text-text transition-colors duration-150 hover:bg-primary-soft disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface",
        className,
      )}
    >
      <button
        type="button"
        className={button}
        aria-label={atMin && onRemove ? removeLabel : decreaseLabel}
        disabled={atMin && !onRemove}
        onClick={() => (atMin ? onRemove?.() : onChange(count - PORTION_COUNT.step))}
      >
        <Minus aria-hidden className="size-4" />
      </button>
      <output aria-live="polite" className="min-w-8 text-center font-display font-semibold tabular">
        {formatCount(count, locale)}
      </output>
      <button
        type="button"
        className={button}
        aria-label={increaseLabel}
        disabled={atMax}
        onClick={() => onChange(count + PORTION_COUNT.step)}
      >
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}
