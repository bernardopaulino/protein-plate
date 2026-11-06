"use client";

import { useCallback, useEffect, useRef } from "react";
import { CountUp } from "@/components/count-up";
import { Illustration } from "@/components/illustration";
import type { Meal } from "@/domain/meals";
import { cn } from "@/lib/cn";

export interface ExampleMeal {
  key: Meal;
  label: string;
  image: string | undefined;
  protein: number;
  items: { id: string; label: string; image: string; foodId: string; count: number }[];
}

/**
 * O dia exemplo da página inicial: as refeições entram uma a uma, a barra enche até à meta e o total
 * conta até lá. Só CSS e um IntersectionObserver, sem a biblioteca de motion (a página inicial
 * carrega menos JavaScript e o LCP chega mais cedo). Com prefers-reduced-motion aparece tudo logo
 * (as transições ficam a 0,01 ms no CSS global e o contador mostra o valor final). O `shown` vive
 * fora (ExampleDayHero), para o prato 3D encher ao mesmo tempo.
 */
export function ExampleDayCard({
  title,
  caption,
  totalLabel,
  meals,
  total,
  target,
  format,
  shown,
  onShow,
}: {
  title: string;
  caption: string;
  totalLabel: string;
  meals: ExampleMeal[];
  total: number;
  target: number;
  format: "pt-PT" | "en-GB";
  shown: boolean;
  onShow: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const show = useRef(onShow);
  useEffect(() => {
    show.current = onShow;
  }, [onShow]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show.current();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const number = new Intl.NumberFormat(format, { maximumFractionDigits: 0 });
  const formatNumber = useCallback(
    (n: number) => new Intl.NumberFormat(format, { maximumFractionDigits: 0 }).format(n),
    [format],
  );
  const percent = Math.min(100, (total / target) * 100);

  return (
    <figure
      ref={ref}
      data-shown={shown}
      className={cn(
        "relative rounded-[2rem] border border-border bg-surface p-5 shadow-[0_30px_80px_-40px_rgb(47_107_58/0.5)]",
        "transition-[opacity,translate,rotate] duration-700 ease-out",
        !shown && "translate-y-6 rotate-[1.5deg] opacity-0",
      )}
    >
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-lg font-bold">{title}</span>
        <span className="text-sm text-muted">{caption}</span>
      </figcaption>
      <ul className="mt-4 flex flex-col gap-2.5">
        {meals.map((meal, i) => (
          <li
            key={meal.key}
            style={{ transitionDelay: shown ? `${250 + i * 120}ms` : undefined }}
            className={cn(
              "flex items-center gap-3 rounded-2xl bg-bg p-3 transition-[opacity,translate] duration-350 ease-out",
              !shown && "translate-x-4 opacity-0",
            )}
          >
            <Illustration src={meal.image} size={36} />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{meal.label}</span>
                <span className="font-display font-bold tabular">
                  {number.format(meal.protein)} g
                </span>
              </p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {meal.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-1 rounded-full bg-surface py-0.5 pr-2 pl-0.5 text-xs text-muted"
                  >
                    <Illustration src={item.image} size={18} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-border pt-4">
        <p className="flex items-baseline justify-between">
          <span className="font-semibold">{totalLabel}</span>
          <span className="font-display text-[2rem] leading-none font-extrabold text-primary">
            <CountUp value={shown ? total : 0} format={formatNumber} />
            <span className="ml-0.5 text-lg"> g</span>
          </span>
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-track" aria-hidden>
          <div
            className="h-full rounded-full bg-primary transition-[width] delay-500 duration-1100 ease-out"
            style={{ width: shown ? `${percent}%` : "0%" }}
          />
        </div>
      </div>
    </figure>
  );
}
