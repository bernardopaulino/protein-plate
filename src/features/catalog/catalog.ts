import { FOODS } from "@/content/foods.generated";
import { defaultPortion, indexFoods, type Food, type Portion } from "@/domain/food";
import { portionProtein } from "@/domain/protein";
import type { Locale } from "@/i18n/routing";
import { normalizeSearch } from "./search";

export { normalizeSearch };

/** O catálogo tipado (gerado de content/foods no build) e o índice por id. */
export const CATALOG: readonly Food[] = FOODS;
export const FOOD_INDEX = indexFoods(FOODS);

export function foodName(food: Food, locale: Locale): string {
  return food.name[locale];
}

export function portionLabel(portion: Portion, locale: Locale): string {
  return portion.label[locale];
}

/** Proteína da porção por defeito (o número em destaque nos cartões). */
export function defaultPortionProtein(food: Food): number {
  return portionProtein(food, defaultPortion(food).id, 1);
}

/** Alimentos que aparecem no catálogo e no "Adicionar" (a despensa só entra nas receitas). */
export const LISTED_FOODS: readonly Food[] = FOODS.filter((f) => f.role !== "pantry");

export function matchesSearch(food: Food, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  return normalizeSearch(`${food.name.pt} ${food.name.en}`).includes(q);
}
