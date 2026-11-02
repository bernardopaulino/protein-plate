import type { Meal } from "./meals";
import { PORTION_COUNT, clamp, roundToHalf, type PlanItem } from "./protein";

export interface NewItem {
  meal: Meal;
  foodId: string;
  portionId: string;
  count: number;
}

const normalizeCount = (count: number) =>
  clamp(roundToHalf(count), PORTION_COUNT.min, PORTION_COUNT.max);

/**
 * Acrescenta um alimento a uma refeição. Se a mesma porção já estiver nessa refeição, soma as
 * porções (até 4) em vez de repetir o item.
 */
export function addItem(items: readonly PlanItem[], item: NewItem, id: string): PlanItem[] {
  const existing = items.find(
    (i) => i.meal === item.meal && i.foodId === item.foodId && i.portionId === item.portionId,
  );
  if (existing) {
    return items.map((i) =>
      i === existing ? { ...i, count: normalizeCount(i.count + item.count) } : i,
    );
  }
  return [...items, { id, ...item, count: normalizeCount(item.count) }];
}

/** Muda o número de porções (passos de 0,5, entre 0,5 e 4). */
export function setItemCount(items: readonly PlanItem[], id: string, count: number): PlanItem[] {
  return items.map((i) => (i.id === id ? { ...i, count: normalizeCount(count) } : i));
}

export function removeItem(items: readonly PlanItem[], id: string): PlanItem[] {
  return items.filter((i) => i.id !== id);
}

/** Tira os itens de refeições que já não fazem parte do dia (ao mudar as refeições). */
export function keepMeals(items: readonly PlanItem[], meals: readonly Meal[]): PlanItem[] {
  return items.filter((i) => meals.includes(i.meal));
}
