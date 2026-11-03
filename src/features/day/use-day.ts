"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { GuestState } from "@/domain/contracts/guest-state";
import { buildExampleDay } from "@/domain/example-day";
import type { Food } from "@/domain/food";
import { addItem, removeItem, setItemCount, type NewItem } from "@/domain/plan";
import { CATALOG } from "@/features/catalog/catalog";
import {
  getGuestServerSnapshot,
  getGuestSnapshot,
  removeGuestState,
  saveGuestState,
  subscribeGuestState,
} from "@/lib/guest-store";

const noopSubscribe = () => () => {};

/** true depois da hidratação (o localStorage só existe no browser). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function newItemId(): string {
  return crypto.randomUUID().slice(0, 12);
}

/** Os alimentos que a pessoa pode comer e os que escolheu (para o dia exemplo). */
export interface PersonalFoods {
  foods: readonly Food[];
  preferred: ReadonlySet<string>;
}

/** O dia exemplo para uma meta e refeições (determinístico pela seed). */
export function exampleItems(
  state: Pick<GuestState, "meals" | "postWorkoutMeal" | "preWorkoutMeal"> & {
    target: { grams: number };
  },
  seed: number,
  personal?: PersonalFoods,
) {
  return buildExampleDay({
    target: state.target.grams,
    meals: state.meals,
    postWorkoutMeal: state.postWorkoutMeal,
    preWorkoutMeal: state.preWorkoutMeal,
    foods: personal?.foods ?? CATALOG,
    preferred: personal?.preferred,
    seed,
  });
}

/**
 * O dia guardado no browser: a cópia local da conta, que o AccountSync sincroniza com a D1.
 * Todas as mudanças passam por aqui.
 */
export function useDay() {
  const state = useSyncExternalStore(subscribeGuestState, getGuestSnapshot, getGuestServerSnapshot);
  const hydrated = useHydrated();

  const update = useCallback((fn: (s: GuestState) => GuestState) => {
    const current = getGuestSnapshot();
    if (current) saveGuestState(fn(current));
  }, []);

  const add = useCallback(
    (item: NewItem) =>
      update((s) => ({
        ...s,
        plan: { ...s.plan, items: addItem(s.plan.items, item, newItemId()), isExample: false },
      })),
    [update],
  );

  const setCount = useCallback(
    (id: string, count: number) =>
      update((s) => ({
        ...s,
        plan: { ...s.plan, items: setItemCount(s.plan.items, id, count), isExample: false },
      })),
    [update],
  );

  const remove = useCallback(
    (id: string) =>
      update((s) => ({
        ...s,
        plan: { ...s.plan, items: removeItem(s.plan.items, id), isExample: false },
      })),
    [update],
  );

  /** "Outras opções": a seed seguinte do dia exemplo (com os alimentos da pessoa). */
  const otherOptions = useCallback(
    (personal?: PersonalFoods) =>
      update((s) => {
        const seed = (s.plan.isExample ? s.plan.seed + 1 : 0) % 1000;
        return {
          ...s,
          plan: { items: exampleItems(s, seed, personal), seed, isExample: true },
        };
      }),
    [update],
  );

  return {
    state,
    hydrated,
    add,
    setCount,
    remove,
    otherOptions,
    replace: saveGuestState,
    clear: removeGuestState,
  };
}
