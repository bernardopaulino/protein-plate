"use client";

import { LazyMotion, MotionConfig, domAnimation, m, useInView } from "motion/react";
import { useRef } from "react";
import { AnimatedNumber, Illustration } from "@/features/onboarding/ui";

export interface ExampleMeal {
  key: string;
  label: string;
  image: string | undefined;
  protein: number;
  items: { id: string; label: string; image: string }[];
}

/**
 * O dia exemplo da página inicial: as refeições entram uma a uma, a barra enche até à meta e o total
 * conta até lá (tudo parado com prefers-reduced-motion).
 */
export function ExampleDayCard({
  title,
  caption,
  totalLabel,
  meals,
  total,
  target,
  format,
}: {
  title: string;
  caption: string;
  totalLabel: string;
  meals: ExampleMeal[];
  total: number;
  target: number;
  format: "pt-PT" | "en-GB";
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const number = new Intl.NumberFormat(format, { maximumFractionDigits: 0 });
  const percent = Math.min(100, (total / target) * 100);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <m.figure
          ref={ref}
          initial={{ opacity: 0, y: 24, rotate: 1.5 }}
          animate={inView ? { opacity: 1, y: 0, rotate: 0 } : undefined}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="relative rounded-[2rem] border border-border bg-surface p-5 shadow-[0_30px_80px_-40px_rgb(47_107_58/0.5)]"
        >
          <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-display text-lg font-bold">{title}</span>
            <span className="text-sm text-muted">{caption}</span>
          </figcaption>
          <ul className="mt-4 flex flex-col gap-2.5">
            {meals.map((meal, i) => (
              <m.li
                key={meal.key}
                initial={{ opacity: 0, x: 16 }}
                animate={inView ? { opacity: 1, x: 0 } : undefined}
                transition={{ delay: 0.25 + i * 0.12, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex items-center gap-3 rounded-2xl bg-bg p-3"
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
              </m.li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-4">
            <p className="flex items-baseline justify-between">
              <span className="font-semibold">{totalLabel}</span>
              <span className="font-display text-[2rem] leading-none font-extrabold text-primary">
                <AnimatedNumber value={inView ? total : 0} format={(n) => number.format(n)} />
                <span className="ml-0.5 text-lg"> g</span>
              </span>
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-track" aria-hidden>
              <m.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "0%" }}
                animate={inView ? { width: `${percent}%` } : undefined}
                transition={{ delay: 0.5, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </div>
          </div>
        </m.figure>
      </MotionConfig>
    </LazyMotion>
  );
}
