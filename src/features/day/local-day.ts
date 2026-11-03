"use client";

import type { GuestState } from "@/domain/contracts/guest-state";
import { GUEST_STATE_VERSION } from "@/domain/contracts/guest-state";
import { getGuestSnapshot, saveGuestState } from "@/lib/guest-store";

/** O que o servidor devolve do dia (loadDay), só com o que a cópia local precisa. */
export interface ServerDay {
  profile: {
    dailyTargetG: number;
    intensity: GuestState["target"]["intensity"];
    weightKg: number | null;
    manualTarget: boolean;
    meals: GuestState["meals"];
    preWorkoutMeal: GuestState["preWorkoutMeal"];
    postWorkoutMeal: GuestState["postWorkoutMeal"];
    onboardedAt: number | null;
  } | null;
  items: GuestState["plan"]["items"];
  updatedAt: number;
}

/** A cópia local passa a ser a da conta (o que está na D1 manda). */
export function mirrorFromServer(day: ServerDay, userId: string): boolean {
  if (!day.profile) return false;
  const p = day.profile;
  return saveGuestState({
    version: GUEST_STATE_VERSION,
    target: {
      grams: p.dailyTargetG,
      intensity: p.intensity,
      weightKg: p.weightKg,
      manual: p.manualTarget,
    },
    meals: p.meals,
    postWorkoutMeal: p.postWorkoutMeal,
    preWorkoutMeal: p.preWorkoutMeal,
    plan: { items: day.items, seed: 0, isExample: false },
    updatedAt: Date.now(),
    owner: userId,
  });
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Ao abrir uma página da app: a cópia local só fica se for desta conta e mais recente do que a da
 * D1; se a meta ou as refeições mudaram noutro aparelho, atualiza-as e mantém o dia.
 */
export function reconcileLocalDay(day: ServerDay, userId: string): void {
  const local = getGuestSnapshot();
  if (!day.profile) return;
  if (!local || local.owner !== userId || day.updatedAt > local.updatedAt) {
    mirrorFromServer(day, userId);
    return;
  }
  const p = day.profile;
  const changed =
    local.target.grams !== p.dailyTargetG ||
    !sameList(local.meals, p.meals) ||
    local.postWorkoutMeal !== p.postWorkoutMeal ||
    local.preWorkoutMeal !== p.preWorkoutMeal;
  if (changed) {
    saveGuestState({
      ...local,
      target: { ...local.target, grams: p.dailyTargetG, intensity: p.intensity },
      meals: p.meals,
      postWorkoutMeal: p.postWorkoutMeal,
      preWorkoutMeal: p.preWorkoutMeal,
      plan: { ...local.plan, items: local.plan.items.filter((i) => p.meals.includes(i.meal)) },
    });
  }
}
