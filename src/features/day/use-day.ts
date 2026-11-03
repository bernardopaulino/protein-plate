"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildExampleDay } from "@/domain/example-day";
import type { Food } from "@/domain/food";
import type { Meal } from "@/domain/meals";
import { addItem, removeItem, setItemCount, type NewItem } from "@/domain/plan";
import type { PlanItem } from "@/domain/protein";
import { saveDayAction } from "@/server/actions/account";

/** O que o "Hoje" precisa do perfil (vem do servidor). */
export interface DayProfile {
  dailyTargetG: number;
  meals: Meal[];
  preWorkoutMeal: Meal | null;
  postWorkoutMeal: Meal | null;
}

/** Os alimentos que a pessoa pode comer e os de que gosta (para o dia exemplo). */
export interface PersonalFoods {
  foods: readonly Food[];
  preferred: ReadonlySet<string>;
}

export type SaveStatus = "saved" | "saving" | "error";

/** Espera curta: várias mudanças seguidas (o stepper) vão num só pedido. */
export const SAVE_DEBOUNCE_MS = 500;

export function newItemId(): string {
  return crypto.randomUUID().slice(0, 12);
}

/** O dia exemplo da pessoa (determinístico pela seed). */
export function exampleItems(
  profile: DayProfile,
  seed: number,
  personal: PersonalFoods,
): PlanItem[] {
  return buildExampleDay({
    target: profile.dailyTargetG,
    meals: profile.meals,
    postWorkoutMeal: profile.postWorkoutMeal,
    preWorkoutMeal: profile.preWorkoutMeal,
    foods: personal.foods,
    preferred: personal.preferred,
    seed,
  });
}

const sameDay = (a: readonly PlanItem[], b: readonly PlanItem[]) =>
  a.length === b.length &&
  a.every(
    (x, i) =>
      x.meal === b[i]!.meal &&
      x.foodId === b[i]!.foodId &&
      x.portionId === b[i]!.portionId &&
      x.count === b[i]!.count,
  );

/**
 * O dia vive na conta (D1). O ecrã muda logo e a gravação segue a seguir, com debounce; se um
 * pedido ainda estiver a meio, o seguinte leva sempre o dia mais recente.
 */
export function useDay({
  initialItems,
  profile,
  personal,
}: {
  initialItems: PlanItem[];
  profile: DayProfile;
  personal: PersonalFoods;
}) {
  const [items, setItems] = useState<PlanItem[]>(initialItems);
  const [example, setExample] = useState(() => ({
    seed: 0,
    active: sameDay(initialItems, exampleItems(profile, 0, personal)),
  }));
  const [status, setStatus] = useState<SaveStatus>("saved");

  const latest = useRef<PlanItem[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inFlight.current || latest.current === null) return;
    inFlight.current = true;
    setStatus("saving");
    let ok = true;
    // Enquanto houver mudanças novas, envia sempre a mais recente
    while (latest.current !== null) {
      const toSend: PlanItem[] = latest.current;
      latest.current = null;
      try {
        ok = (await saveDayAction({ items: toSend })).ok;
      } catch {
        ok = false;
      }
      if (!ok) {
        latest.current ??= toSend; // fica para "Tentar outra vez"
        break;
      }
    }
    inFlight.current = false;
    setStatus(ok ? "saved" : "error");
  }, []);

  const schedule = useCallback(
    (next: PlanItem[]) => {
      latest.current = next;
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  // Ao sair da página (ou esconder o separador), grava logo o que estiver pendente
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      void flush();
    };
  }, [flush]);

  const current = useRef<PlanItem[]>(initialItems);
  const change = useCallback(
    (fn: (items: PlanItem[]) => PlanItem[], keepExample = false) => {
      const next = fn(current.current);
      current.current = next;
      setItems(next);
      schedule(next);
      if (!keepExample) setExample((e) => ({ ...e, active: false }));
    },
    [schedule],
  );

  const add = useCallback(
    (item: NewItem) => change((list) => addItem(list, item, newItemId())),
    [change],
  );
  const setCount = useCallback(
    (id: string, count: number) => change((list) => setItemCount(list, id, count)),
    [change],
  );
  const remove = useCallback((id: string) => change((list) => removeItem(list, id)), [change]);

  /** "Outras opções": a seed seguinte do dia exemplo (com os alimentos da pessoa). */
  const otherOptions = useCallback(() => {
    const seed = example.active ? (example.seed + 1) % 1000 : 0;
    const next = exampleItems(profile, seed, personal);
    setExample({ seed, active: true });
    change(() => next, true);
  }, [change, example, personal, profile]);

  const retry = useCallback(() => void flush(), [flush]);

  return { items, isExample: example.active, status, add, setCount, remove, otherOptions, retry };
}
