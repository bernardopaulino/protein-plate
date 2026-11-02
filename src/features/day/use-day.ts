"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { GuestState } from "@/domain/contracts/guest-state";
import { buildExampleDay } from "@/domain/example-day";
import type { Intensity } from "@/domain/goal";
import { sortMeals, type Meal } from "@/domain/meals";
import { addItem, keepMeals, removeItem, setItemCount, type NewItem } from "@/domain/plan";
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

/** O dia exemplo para uma meta e refeições (determinístico pela seed). */
export function exampleItems(
  target: number,
  meals: readonly Meal[],
  post: Meal | null,
  seed: number,
) {
  return buildExampleDay({ target, meals, postWorkoutMeal: post, foods: CATALOG, seed });
}

export interface GoalInput {
  grams: number;
  intensity: Intensity;
  weightKg: number | null;
  manual: boolean;
  meals: Meal[];
  postWorkoutMeal: Meal | null;
}

/**
 * O dia guardado no browser (convidado, ou cópia local da conta que o AccountSync sincroniza).
 * Todas as mudanças passam por aqui.
 */
export function useDay() {
  const state = useSyncExternalStore(subscribeGuestState, getGuestSnapshot, getGuestServerSnapshot);
  const hydrated = useHydrated();

  const update = useCallback((fn: (s: GuestState) => GuestState) => {
    const current = getGuestSnapshot();
    if (current) saveGuestState(fn(current));
  }, []);

  /** Nova meta/refeições. Se o dia ainda é o exemplo (ou não existe), gera um exemplo novo. */
  const setGoal = useCallback((goal: GoalInput) => {
    const current = getGuestSnapshot();
    const meals = sortMeals(goal.meals);
    const keepPlan = current && !current.plan.isExample;
    const items = keepPlan
      ? keepMeals(current.plan.items, meals)
      : exampleItems(goal.grams, meals, goal.postWorkoutMeal, 0);
    saveGuestState({
      version: 1,
      target: {
        grams: goal.grams,
        intensity: goal.intensity,
        weightKg: goal.weightKg,
        manual: goal.manual,
      },
      meals,
      postWorkoutMeal: goal.postWorkoutMeal,
      plan: { items, seed: keepPlan ? current.plan.seed : 0, isExample: !keepPlan },
      updatedAt: Date.now(),
      owner: current?.owner ?? null,
    });
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

  /** "Outras opções": a seed seguinte do dia exemplo. */
  const otherOptions = useCallback(
    () =>
      update((s) => {
        const seed = (s.plan.isExample ? s.plan.seed + 1 : 0) % 1000;
        return {
          ...s,
          plan: {
            items: exampleItems(s.target.grams, s.meals, s.postWorkoutMeal, seed),
            seed,
            isExample: true,
          },
        };
      }),
    [update],
  );

  return {
    state,
    hydrated,
    setGoal,
    add,
    setCount,
    remove,
    otherOptions,
    replace: saveGuestState,
    clear: removeGuestState,
  };
}
