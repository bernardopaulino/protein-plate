"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const DURATION_MS = 900;

/** Mesma curva da app (--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1)), aproximada por um ease-out cúbico. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Número que conta até ao valor novo com requestAnimationFrame, sem a biblioteca de motion (fica
 * fora do JavaScript das páginas públicas). Com prefers-reduced-motion mostra logo o valor.
 */
export function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const from = previous.current;
    previous.current = value;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || from === value) {
      node.textContent = format(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      node.textContent = format(from + (value - from) * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, format]);

  return (
    <span ref={ref} className={cn("tabular", className)}>
      {format(value)}
    </span>
  );
}
