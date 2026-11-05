import { Zap } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ProteinNumber } from "./protein-number";

/** Uma refeição do dia: título, etiqueta pós-treino, proteína da refeição e o alvo. */
export function MealSection({
  id,
  title,
  postWorkoutLabel,
  total,
  targetLabel,
  children,
  footer,
  className,
}: {
  id?: string;
  title: string;
  /** Texto da etiqueta, só na refeição pós-treino */
  postWorkoutLabel?: string;
  total: number;
  targetLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-titulo` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("rounded-card border border-border bg-surface p-4 shadow-sm", className)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={headingId} className="text-lg font-bold">
            {title}
          </h2>
          {postWorkoutLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-[#1f1b16]">
              <Zap aria-hidden className="size-3.5" />
              {postWorkoutLabel}
            </span>
          ) : null}
        </div>
        <p className="flex shrink-0 items-baseline gap-1.5 text-right">
          <ProteinNumber value={total} size="md" />
          <span className="text-sm whitespace-nowrap text-muted tabular">{targetLabel}</span>
        </p>
      </header>
      <div className="mt-3">{children}</div>
      {footer ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">{footer}</div>
      ) : null}
    </section>
  );
}
