import { ChevronRight, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ProteinNumber } from "./protein-number";

/**
 * Cartão de alimento: a proteína por porção em destaque, a porção por baixo. `href` torna o cartão
 * num link; `onAdd` mostra o botão de adicionar.
 */
export function FoodCard({
  name,
  portionLabel,
  protein,
  meta,
  badge,
  href,
  renderLink,
  onAdd,
  addLabel,
  className,
}: {
  name: string;
  portionLabel: string;
  protein: number;
  /** Linha secundária (ex.: categoria · facilidade) */
  meta?: string;
  badge?: ReactNode;
  href?: string;
  /** Link do router (o componente não conhece o next-intl) */
  renderLink?: (props: { href: string; className: string; children: ReactNode }) => ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
}) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        <p className="truncate text-sm text-muted">{portionLabel}</p>
        {meta ? <p className="mt-0.5 truncate text-xs text-muted">{meta}</p> : null}
        {badge ? <div className="mt-1">{badge}</div> : null}
      </div>
      <ProteinNumber value={protein} size="lg" className="shrink-0" />
    </>
  );

  const base =
    "flex min-h-16 items-center gap-3 rounded-card border border-border bg-surface p-3 pl-4 shadow-sm transition-colors duration-200";

  if (href && renderLink) {
    return renderLink({
      href,
      className: cn(base, "hover:border-primary/50 hover:bg-primary-soft/40", className),
      children: (
        <>
          {body}
          <ChevronRight aria-hidden className="size-5 shrink-0 text-muted" />
        </>
      ),
    });
  }

  return (
    <div className={cn(base, className)}>
      {body}
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95"
        >
          <Plus aria-hidden className="size-5" />
        </button>
      ) : null}
    </div>
  );
}
