"use client";

import { useEffect, useMemo, useState } from "react";
import type { Meal } from "@/domain/meals";
import type { PlateItem } from "@/domain/plate-layout";
import { LazyPlate3D } from "./lazy-plate";
import { canUse3D, useReducedMotion, whenIdleAfterLcp } from "./support";

export interface HeroPlateMeal {
  key: Meal;
  protein: number;
  items: { id: string; foodId: string; count: number }[];
}

/** Os mesmos tempos do ExampleDayCard: cada refeição entra 250 ms + 120 ms × posição depois. */
const MEAL_DELAY_MS = 250;
const MEAL_STEP_MS = 120;
const DESKTOP = "(min-width: 768px)";
/** Câmara mais baixa do que no "O meu dia": o prato espreita por baixo do cartão e vê-se de lado. */
const HERO_ELEVATION = 0.62;

/**
 * O prato 3D por trás do dia exemplo da página inicial. Só a partir de md, depois do LCP e com o
 * browser livre; no telemóvel não pede nada (nem o chunk do three, nem modelos). Enche à medida que
 * as refeições do cartão entram (o mesmo `shown`).
 */
export function HeroPlate({
  shown,
  meals,
  target,
  className,
}: {
  shown: boolean;
  meals: HeroPlateMeal[];
  target: number;
  className?: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [entered, setEntered] = useState(0);
  const reducedMotion = useReducedMotion();
  // Com prefers-reduced-motion, as refeições aparecem todas de uma vez
  const visible = reducedMotion && shown ? meals.length : entered;

  useEffect(() => {
    if (!window.matchMedia(DESKTOP).matches) return;
    return whenIdleAfterLcp(() => {
      if (canUse3D()) setEnabled(true);
    });
  }, []);

  useEffect(() => {
    if (!enabled || !shown || reducedMotion) return;
    const timers = meals.map((_, i) =>
      setTimeout(() => setEntered((v) => Math.max(v, i + 1)), MEAL_DELAY_MS + i * MEAL_STEP_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [enabled, shown, meals, reducedMotion]);

  const plate = useMemo(() => {
    const revealed = meals.slice(0, visible);
    const items: PlateItem[] = revealed.flatMap((m) =>
      m.items.map((i) => ({ id: i.id, meal: m.key, foodId: i.foodId, count: i.count })),
    );
    return {
      items,
      meals: meals.map((m) => m.key),
      total: revealed.reduce((sum, m) => sum + m.protein, 0),
    };
  }, [meals, visible]);

  if (!enabled || unavailable) return null;
  return (
    <LazyPlate3D
      items={plate.items}
      meals={plate.meals}
      total={plate.total}
      target={target}
      dropInitial
      elevation={HERO_ELEVATION}
      className={className}
      onUnavailable={() => setUnavailable(true)}
    />
  );
}
