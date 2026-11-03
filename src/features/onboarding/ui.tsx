"use client";

import { Check } from "lucide-react";
import { animate, m, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Ilustração (Fluent Emoji 3D, WebP 160 px). Decorativa: o texto ao lado diz o que é. */
export function Illustration({
  src,
  size = 48,
  className,
}: {
  src: string | undefined;
  size?: number;
  className?: string;
}) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

/** Marca de "escolhido" que aparece com uma pequena mola. */
export function CheckBadge({ on, className }: { on: boolean; className?: string }) {
  return (
    <m.span
      aria-hidden
      initial={false}
      animate={on ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={cn(
        "flex size-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm",
        className,
      )}
    >
      <Check className="size-4" strokeWidth={3} />
    </m.span>
  );
}

/**
 * Cartão de escolha grande (dieta, intensidade, refeições, equipamento). `role`: radio (uma
 * escolha) ou checkbox (várias); o grupo à volta dá o nome.
 */
export function OptionCard({
  selected,
  onSelect,
  image,
  title,
  detail,
  role = "radio",
  compact = false,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  image?: string;
  title: string;
  detail?: ReactNode;
  role?: "radio" | "checkbox";
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <m.button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-card border-2 bg-surface text-left transition-[border-color,background-color,box-shadow] duration-200 ease-out",
        compact ? "min-h-14 px-3 py-2" : "min-h-20 px-4 py-3",
        selected
          ? "border-primary bg-primary-soft shadow-[0_6px_20px_-12px_var(--primary)]"
          : "border-border hover:border-primary/50",
      )}
    >
      <Illustration src={image} size={compact ? 36 : 48} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="leading-tight font-semibold">{title}</span>
        {detail ? <span className="text-sm text-muted">{detail}</span> : null}
        {children}
      </span>
      <CheckBadge on={selected} className="shrink-0" />
    </m.button>
  );
}

/** Número que conta até ao valor novo (sem animação com prefers-reduced-motion). */
export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const from = previous.current;
    previous.current = value;
    if (reduced || from === value) {
      node.textContent = format(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.6,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (n) => {
        node.textContent = format(n);
      },
    });
    return () => controls.stop();
  }, [value, format, reduced]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {format(value)}
    </span>
  );
}

/** Seletor segmentado (número de refeições, tempo): botões com aria-pressed e um fundo que desliza. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  render = (v) => String(v),
  layoutId,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  render?: (value: T) => ReactNode;
  layoutId: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex w-full rounded-full border border-border bg-surface p-1"
    >
      {options.map((option) => {
        const on = option === value;
        return (
          <button
            key={String(option)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option)}
            className={cn(
              "relative min-h-11 flex-1 rounded-full px-2 text-base font-semibold transition-colors duration-200",
              on ? "text-on-primary" : "text-muted hover:text-text",
            )}
          >
            {on ? (
              <m.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            ) : null}
            <span className="relative tabular">{render(option)}</span>
          </button>
        );
      })}
    </div>
  );
}
