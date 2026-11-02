import type { Meal } from "./meals";

/** Categorias do catálogo (ordem de apresentação nos filtros). */
export const CATEGORIES = [
  "carne",
  "peixe",
  "marisco",
  "conservas",
  "ovos",
  "laticinios",
  "suplementos",
  "soja",
  "leguminosas",
  "cereais",
  "tuberculos",
  "frutos-secos",
  "sementes",
  "fruta",
  "legumes",
  "despensa",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Papel do alimento num prato: `carb` inclui a fruta. */
export const ROLES = ["protein", "carb", "fat", "vegetable", "pantry"] as const;
export type Role = (typeof ROLES)[number];

/** Forma em que se pesa: cru (o que se cozinha), cozinhado ou como se compra. */
export const WEIGHT_BASES = ["raw", "cooked", "as_sold"] as const;
export type WeightBasis = (typeof WEIGHT_BASES)[number];

export const PROCESSING_LEVELS = ["natural", "culinary", "processed", "ultra"] as const;
export type Processing = (typeof PROCESSING_LEVELS)[number];

/** Os únicos ultraprocessados aceites no catálogo (assinalados na UI). */
export const PROCESSING_EXCEPTIONS: readonly string[] = ["whey-sem-sabor"];

/** 1 = sem preparação, 2 = rápido, 3 = cozinhar. */
export const EASE_LEVELS = [1, 2, 3] as const;
export type Ease = (typeof EASE_LEVELS)[number];

export interface Localized<T = string> {
  pt: T;
  en: T;
}

export interface Portion {
  /** `<foodId>:<slug>` (estável: o estado do convidado e a D1 guardam-no). */
  id: string;
  label: Localized;
  grams: number;
  default?: boolean;
}

export interface Food {
  id: string;
  name: Localized;
  category: Category;
  role: Role;
  proteinPer100g: number;
  kcalPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  weightBasis: WeightBasis;
  processing: Processing;
  portions: Portion[];
  moments: Meal[];
  ease: Ease;
  exampleRank: number;
  tcaCode: string;
  ideas: Localized<string[]>;
}

/** A porção por defeito (o content:check garante que há exatamente uma). */
export function defaultPortion(food: Food): Portion {
  const portion = food.portions.find((p) => p.default) ?? food.portions[0];
  if (!portion) throw new Error(`Alimento sem porções: ${food.id}`);
  return portion;
}

export function findPortion(food: Food, portionId: string): Portion | undefined {
  return food.portions.find((p) => p.id === portionId);
}

export type FoodIndex = ReadonlyMap<string, Food>;

export function indexFoods(foods: readonly Food[]): FoodIndex {
  return new Map(foods.map((f) => [f.id, f]));
}
