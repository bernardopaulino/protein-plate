import { findPortion, type Food, type FoodIndex } from "./food";
import type { Meal } from "./meals";

/** Um alimento no dia: porção escolhida × número de porções (passos de 0,5). */
export interface PlanItem {
  id: string;
  meal: Meal;
  foodId: string;
  portionId: string;
  count: number;
}

/** Limites de porções por item (0,5 a 4, passos de 0,5). */
export const PORTION_COUNT = { min: 0.5, max: 4, step: 0.5 } as const;

export function isValidPortionCount(count: number): boolean {
  return (
    Number.isFinite(count) &&
    count >= PORTION_COUNT.min &&
    count <= PORTION_COUNT.max &&
    Number.isInteger(count / PORTION_COUNT.step)
  );
}

/** proteina_g = gramas × proteina_por_100g / 100 (exato). */
export function proteinForGrams(grams: number, proteinPer100g: number): number {
  return (grams * proteinPer100g) / 100;
}

/** Proteína de `count` porções de um alimento (exato). */
export function portionProtein(food: Food, portionId: string, count = 1): number {
  const portion = findPortion(food, portionId);
  if (!portion) throw new Error(`Porção desconhecida: ${portionId}`);
  return proteinForGrams(portion.grams * count, food.proteinPer100g);
}

/** Proteína de um item do dia (0 se o alimento ou a porção já não existirem no catálogo). */
export function itemProtein(
  item: Pick<PlanItem, "foodId" | "portionId" | "count">,
  foods: FoodIndex,
): number {
  const food = foods.get(item.foodId);
  if (!food || !findPortion(food, item.portionId)) return 0;
  return portionProtein(food, item.portionId, item.count);
}

/** Total exato (a soma das parcelas arredondadas pode diferir 1 g; ver o teste). */
export function totalProtein(
  items: readonly Pick<PlanItem, "foodId" | "portionId" | "count">[],
  foods: FoodIndex,
): number {
  return items.reduce((sum, item) => sum + itemProtein(item, foods), 0);
}

export function mealProtein(items: readonly PlanItem[], meal: Meal, foods: FoodIndex): number {
  return totalProtein(
    items.filter((i) => i.meal === meal),
    foods,
  );
}

/** Arredondamento de apresentação: inteiros a partir de 10 g, uma casa decimal abaixo. */
export function roundForDisplay(grams: number): number {
  const oneDecimal = Math.round(grams * 10) / 10;
  return oneDecimal >= 10 ? Math.round(grams) : oneDecimal;
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale: string, decimals: 0 | 1): Intl.NumberFormat {
  const key = `${locale}:${decimals}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
    formatters.set(key, f);
  }
  return f;
}

/** "23" ou "7,5" (sem unidade), com Intl.NumberFormat('pt-PT'). */
export function formatProtein(grams: number, locale = "pt-PT"): string {
  const value = roundForDisplay(grams);
  return formatter(locale, value >= 10 ? 0 : 1).format(value);
}

/** Número de porções para apresentação: "1", "1,5". */
export function formatCount(count: number, locale = "pt-PT"): string {
  return formatter(locale, 1).format(count);
}

/** Arredonda a passos de meia porção (0,5). */
export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Arredonda para cima a passos de meia porção. */
export function ceilToHalf(value: number): number {
  return Math.ceil(value * 2 - 1e-9) / 2;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
