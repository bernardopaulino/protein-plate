import type { Food, FoodIndex } from "./food";
import type { Meal } from "./meals";
import type { NewItem } from "./plan";
import { PORTION_COUNT, clamp, roundToHalf } from "./protein";

export interface RecipeIngredient {
  foodId: string;
  /** Gramas para a receita toda (todas as doses). */
  grams: number;
}

/** A porção que melhor representa as gramas (em meias porções, entre 0,5 e 4). */
export function closestPortion(food: Food, grams: number): { portionId: string; count: number } {
  let best: { portionId: string; count: number; error: number; isDefault: boolean } | null = null;
  for (const portion of food.portions) {
    const count = clamp(roundToHalf(grams / portion.grams), PORTION_COUNT.min, PORTION_COUNT.max);
    const error = Math.abs(count * portion.grams - grams);
    const isDefault = portion.default === true;
    if (
      !best ||
      error < best.error - 1e-9 ||
      (Math.abs(error - best.error) < 1e-9 && isDefault && !best.isDefault)
    ) {
      best = { portionId: portion.id, count, error, isDefault };
    }
  }
  return { portionId: best!.portionId, count: best!.count };
}

/**
 * "Usar no meu almoço": os ingredientes de uma dose da receita como itens do dia. A despensa
 * (azeite, especiarias) fica de fora; ingredientes repetidos somam-se; alimentos que a pessoa não
 * pode comer (`allowed`) ou que já não existem ficam de fora.
 */
export function recipeToItems(
  ingredients: readonly RecipeIngredient[],
  servings: number,
  meal: Meal,
  foods: FoodIndex,
  allowed: (food: Food) => boolean = () => true,
): NewItem[] {
  const perFood = new Map<string, number>();
  for (const i of ingredients) {
    const food = foods.get(i.foodId);
    if (!food || food.role === "pantry" || !allowed(food)) continue;
    perFood.set(food.id, (perFood.get(food.id) ?? 0) + i.grams / Math.max(1, servings));
  }
  return [...perFood].map(([foodId, grams]) => ({
    meal,
    foodId,
    ...closestPortion(foods.get(foodId)!, grams),
  }));
}
