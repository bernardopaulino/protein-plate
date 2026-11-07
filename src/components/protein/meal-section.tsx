import { Zap } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ProteinNumber } from "./protein-number";

/**
 * Uma refeição do dia: título, etiqueta pós-treino, proteína da refeição e o alvo (e, com
 * "Calorias" ligado, as calorias da refeição por baixo).
 */
export function MealSection({
  id,
  title,
  postWorkoutLabel,
  total,
  targetLabel,
  kcalLabel,
  children,
  footer,
  glyph,
  className,
}: {
  id?: string;
  title: string;
  /** Texto da etiqueta, só na refeição pós-treino */
  postWorkoutLabel?: string;
  total: number;
  targetLabel: string;
  /** "≈ 450 kcal" (só com "Calorias" ligado) */
  kcalLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** A fatia da refeição no dia (MealGlyph). */
  glyph?: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-titulo` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("border-t-2 border-text pt-4", className)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {glyph}
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 id={headingId} className="text-xl leading-tight font-bold">
              {title}
            </h2>
            {postWorkoutLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-[#1f1b16]">
                <Zap aria-hidden className="size-3.5" />
                {postWorkoutLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <p className="flex items-baseline gap-1.5 text-right">
            <ProteinNumber value={total} size="md" />
            <span className="text-sm whitespace-nowrap text-muted tabular">{targetLabel}</span>
          </p>
          {kcalLabel ? (
            <p className="text-sm whitespace-nowrap text-muted tabular">{kcalLabel}</p>
          ) : null}
        </div>
      </header>
      <div className="mt-3">{children}</div>
      {footer ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">{footer}</div>
      ) : null}
    </section>
  );
}
