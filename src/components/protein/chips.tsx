"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProteinNumber } from "./protein-number";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Chips de filtro (botões com aria-pressed). `multiple`: vários ativos; senão, um só (tocar no ativo
 * desliga-o). Fazem scroll horizontal no telemóvel.
 */
export function FilterChips<T extends string>({
  label,
  options,
  selected,
  onChange,
  multiple = false,
  className,
}: {
  label: string;
  options: readonly ChipOption<T>[];
  selected: readonly T[];
  onChange: (selected: T[]) => void;
  multiple?: boolean;
  className?: string;
}) {
  const toggle = (value: T) => {
    const isOn = selected.includes(value);
    if (multiple) onChange(isOn ? selected.filter((v) => v !== value) : [...selected, value]);
    else onChange(isOn ? [] : [value]);
  };
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("-mx-4 [scrollbar-width:none] overflow-x-auto px-4", className)}
    >
      <ul className="flex w-max gap-2 py-1">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <li key={o.value}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(o.value)}
                className={cn(
                  "min-h-11 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150",
                  on
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border bg-surface text-text hover:border-primary/60",
                )}
              >
                {o.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Sugestão de um toque ("Para fechar a meta"): +X g e o que é. */
export function SuggestionChip({
  protein,
  title,
  detail,
  onSelect,
  ariaLabel,
}: {
  protein: number;
  title: string;
  detail: string;
  onSelect: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      className="group flex min-h-16 w-full items-center gap-3 rounded-card border border-border bg-surface p-3 text-left shadow-sm transition-[border-color,transform] duration-200 ease-out hover:border-primary active:scale-[0.99]"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-on-primary">
        <Plus aria-hidden className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block truncate text-sm text-muted">{detail}</span>
      </span>
      <ProteinNumber
        value={protein}
        prefix="+"
        size="md"
        className="text-primary"
        unitClassName="text-primary/80"
      />
    </button>
  );
}
