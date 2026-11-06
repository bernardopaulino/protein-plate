import { findPortion, type Food, type FoodIndex } from "./food";
import type { Meal } from "./meals";
import type { PlanItem } from "./protein";
import type { Ingredient } from "./recipe-fit";

/*
 * Calorias (secção 3, "Calorias"): só informação, para a pessoa ter uma noção. Nunca há meta,
 * limite nem mínimo. Calculadas pela app a partir de content/foods, como a proteína (nunca pela
 * IA), com valores exatos; arredondadas só na apresentação, porque são estimativas.
 */

type ItemRef = Pick<PlanItem, "foodId" | "portionId" | "count">;

/** kcal = gramas × kcal_por_100g / 100 (exato). */
export function kcalForGrams(grams: number, kcalPer100g: number): number {
  return (grams * kcalPer100g) / 100;
}

/** Calorias de `count` porções de um alimento (exato). */
export function portionKcal(food: Food, portionId: string, count = 1): number {
  const portion = findPortion(food, portionId);
  if (!portion) throw new Error(`Porção desconhecida: ${portionId}`);
  return kcalForGrams(portion.grams * count, food.kcalPer100g);
}

/** Calorias de um item do dia (0 se o alimento ou a porção já não existirem no catálogo). */
export function itemKcal(item: ItemRef, foods: FoodIndex): number {
  const food = foods.get(item.foodId);
  if (!food || !findPortion(food, item.portionId)) return 0;
  return portionKcal(food, item.portionId, item.count);
}

/** Total exato do dia (ou de uma lista de itens). */
export function totalKcal(items: readonly ItemRef[], foods: FoodIndex): number {
  return items.reduce((sum, item) => sum + itemKcal(item, foods), 0);
}

export function mealKcal(items: readonly PlanItem[], meal: Meal, foods: FoodIndex): number {
  return totalKcal(
    items.filter((i) => i.meal === meal),
    foods,
  );
}

/** Calorias por dose de uma receita (os gramas dos ingredientes são para todas as doses). */
export function kcalPerServingOf(
  ingredients: readonly Ingredient[],
  servings: number,
  foods: FoodIndex,
): number {
  const total = ingredients.reduce((sum, i) => {
    const food = foods.get(i.foodId);
    return sum + (food ? kcalForGrams(i.grams, food.kcalPer100g) : 0);
  }, 0);
  return total / servings;
}

/**
 * Gramas de proteína por 100 kcal: quanto da energia de um alimento vem com proteína. Ajuda quem
 * quer saber das calorias a escolher, sem proibir nada. null se o alimento não tiver calorias.
 */
export function proteinPer100Kcal(
  food: Pick<Food, "proteinPer100g" | "kcalPer100g">,
): number | null {
  if (!(food.kcalPer100g > 0)) return null;
  return (food.proteinPer100g / food.kcalPer100g) * 100;
}

/** Arredondamento de apresentação: de 5 em 5 abaixo de 100 kcal, de 10 em 10 a partir daí. */
export function roundKcal(kcal: number): number {
  const step = kcal < 97.5 ? 5 : 10;
  return Math.round(kcal / step) * step;
}

const formatters = new Map<string, Intl.NumberFormat>();

/** "1850" (pt-PT) ou "1,850" (en-US), já arredondado, sem unidade. */
export function formatKcal(kcal: number, locale = "pt-PT"): string {
  let f = formatters.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    formatters.set(locale, f);
  }
  return f.format(roundKcal(kcal));
}
