import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * "Calorias" nas páginas públicas (detalhe do alimento e receita): fechado até a pessoa o abrir.
 * <details> nativo, sem JavaScript, para as páginas continuarem estáticas e com cache pública
 * (a preferência da conta só vale no "Hoje" e no dia de receitas).
 */
export function KcalDetails({
  title,
  note,
  children,
  className,
}: {
  title: string;
  /** "Valores aproximados…" */
  note: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("group rounded-card border border-border bg-surface", className)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-card px-4 py-2 font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-border px-4 py-3">
        {children}
        <p className="mt-2 text-sm text-muted">{note}</p>
      </div>
    </details>
  );
}
