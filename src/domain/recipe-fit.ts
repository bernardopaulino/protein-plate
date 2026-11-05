import { defaultPortion, type FoodIndex } from "./food";
import { proteinForGrams } from "./protein";
import { RECIPE_TARGET_TOLERANCE } from "./recipe-options";

export interface Ingredient {
  foodId: string;
  /** Gramas para a receita completa (todas as doses). */
  grams: number;
}

/** No máximo 3 porções habituais por dose (a mesma regra da validação da receita). */
const MAX_PORTIONS_PER_SERVING = 3;
/** Nunca menos do que isto por dose numa fonte de proteína (uma receita com 4 g de frango não é). */
const MIN_GRAMS_PER_SERVING = 20;
/** Quanto a app pode mudar as fontes de proteína (multiplicador) sem desfigurar a receita. */
const FACTOR = { min: 0.4, max: 2.5 } as const;

/** Proteína por dose, calculada pela app a partir da TCA (nunca pela IA). */
export function proteinPerServingOf(
  ingredients: readonly Ingredient[],
  servings: number,
  foods: FoodIndex,
): number {
  const total = ingredients.reduce((sum, i) => {
    const food = foods.get(i.foodId);
    return sum + (food ? proteinForGrams(i.grams, food.proteinPer100g) : 0);
  }, 0);
  return total / servings;
}

/** Gramas "de cozinha": múltiplos de 5 a partir de 20 g; os ovos em ovos inteiros por dose. */
function tidyGrams(foodId: string, grams: number, servings: number, foods: FoodIndex): number {
  const food = foods.get(foodId);
  if (food?.category === "ovos") {
    const unit = defaultPortion(food).grams;
    return Math.max(1, Math.round(grams / servings / unit)) * unit * servings;
  }
  return grams >= 20 ? Math.round(grams / 5) * 5 : Math.round(grams);
}

/**
 * Ajusta as quantidades das fontes de proteína para a proteína por dose chegar perto de `targetG`
 * (dentro de `RECIPE_TARGET_TOLERANCE`, não mexe). Os acompanhamentos e a despensa ficam como a IA
 * os escreveu; cada fonte fica entre 20 g e 3 porções habituais por dose. Devolve a receita (igual
 * ou ajustada) e se mudou; quem chama decide se o resultado está perto o suficiente.
 */
export function fitProtein(
  ingredients: readonly Ingredient[],
  servings: number,
  targetG: number,
  foods: FoodIndex,
): { ingredients: Ingredient[]; adjusted: boolean } {
  const current = proteinPerServingOf(ingredients, servings, foods);
  if (targetG <= 0 || Math.abs(current - targetG) <= targetG * RECIPE_TARGET_TOLERANCE) {
    return { ingredients: [...ingredients], adjusted: false };
  }
  const isSource = (i: Ingredient) => foods.get(i.foodId)?.role === "protein";
  const fromSources = proteinPerServingOf(ingredients.filter(isSource), servings, foods);
  if (fromSources <= 0) return { ingredients: [...ingredients], adjusted: false };
  const rest = current - fromSources;
  const factor = Math.min(FACTOR.max, Math.max(FACTOR.min, (targetG - rest) / fromSources));

  const next = ingredients.map((i) => {
    const food = foods.get(i.foodId);
    if (!food || !isSource(i)) return { ...i };
    const max = MAX_PORTIONS_PER_SERVING * defaultPortion(food).grams * servings;
    const min = Math.min(MIN_GRAMS_PER_SERVING * servings, i.grams);
    const grams = Math.min(max, Math.max(min, i.grams * factor));
    return { foodId: i.foodId, grams: Math.min(max, tidyGrams(i.foodId, grams, servings, foods)) };
  });
  const adjusted = next.some((i, index) => i.grams !== ingredients[index]!.grams);
  return { ingredients: next, adjusted };
}
