import { Clock } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ProteinNumber } from "./protein-number";

/** Cartão de receita: título, proteína por dose e tempo. */
export function RecipeCard({
  title,
  summary,
  proteinPerServing,
  perServingLabel,
  minutesLabel,
  href,
  renderLink,
  className,
}: {
  title: string;
  summary?: string;
  proteinPerServing: number;
  perServingLabel: string;
  minutesLabel: string;
  href: string;
  renderLink: (props: { href: string; className: string; children: ReactNode }) => ReactNode;
  className?: string;
}) {
  return renderLink({
    href,
    className: cn(
      "flex flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-sm transition-colors duration-200 hover:border-primary/50",
      className,
    ),
    children: (
      <>
        <span className="font-display text-lg font-bold">{title}</span>
        {summary ? <span className="line-clamp-2 text-sm text-muted">{summary}</span> : null}
        <span className="mt-auto flex items-center justify-between gap-3">
          <span className="flex items-baseline gap-1.5">
            <ProteinNumber value={proteinPerServing} size="lg" />
            <span className="text-sm text-muted">{perServingLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <Clock aria-hidden className="size-4" />
            {minutesLabel}
          </span>
        </span>
      </>
    ),
  });
}
