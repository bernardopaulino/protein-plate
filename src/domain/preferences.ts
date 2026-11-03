import type { Allergen, Category, Food, FoodIndex } from "./food";
import { MAX_MINUTES_OPTIONS, type MaxMinutes } from "./recipe-options";

export { ALLERGENS, type Allergen } from "./food";

/** Tipo de alimentação (secção 3, "Preferências"). */
export const DIETS = ["omnivore", "pescatarian", "vegetarian", "vegan"] as const;
export type Diet = (typeof DIETS)[number];
export const DEFAULT_DIET: Diet = "omnivore";

/** Equipamento de cozinha que a pessoa tem (entra no prompt das receitas). */
export const EQUIPMENT = ["stove", "oven", "microwave", "airfryer", "blender"] as const;
export type Equipment = (typeof EQUIPMENT)[number];
export const DEFAULT_EQUIPMENT: readonly Equipment[] = ["stove", "microwave"];

/** Tempo que costuma ter para cozinhar (pré-seleciona o tempo das receitas). */
export const COOK_MINUTES_OPTIONS = MAX_MINUTES_OPTIONS;
export const DEFAULT_COOK_MINUTES: MaxMinutes = 20;

/** Mínimo de fontes de proteína escolhidas (o dia exemplo precisa de variedade). */
export const MIN_LIKED_PROTEINS = 3;

/** Origem de um alimento, para as dietas. */
export type Origin = "meat" | "seafood" | "egg" | "dairy" | "honey" | "plant";

const ORIGIN_BY_CATEGORY: Partial<Record<Category, Origin>> = {
  carne: "meat",
  peixe: "seafood",
  marisco: "seafood",
  conservas: "seafood",
  ovos: "egg",
  laticinios: "dairy",
  suplementos: "dairy",
};

/** Exceções dentro de categorias vegetais (a despensa tem manteiga e mel). */
const ORIGIN_BY_ID: Readonly<Record<string, Origin>> = { manteiga: "dairy", mel: "honey" };

export function foodOrigin(food: Pick<Food, "id" | "category">): Origin {
  return ORIGIN_BY_ID[food.id] ?? ORIGIN_BY_CATEGORY[food.category] ?? "plant";
}

const DIET_ALLOWS: Record<Diet, ReadonlySet<Origin>> = {
  omnivore: new Set(["meat", "seafood", "egg", "dairy", "honey", "plant"]),
  pescatarian: new Set(["seafood", "egg", "dairy", "honey", "plant"]),
  vegetarian: new Set(["egg", "dairy", "honey", "plant"]),
  vegan: new Set(["plant"]),
};

export interface Restrictions {
  diet: Diet;
  allergies: readonly Allergen[];
}

export const NO_RESTRICTIONS: Restrictions = { diet: DEFAULT_DIET, allergies: [] };

/** Porque é que um alimento fica de fora (null = pode entrar). */
export function exclusionReason(
  food: Pick<Food, "id" | "category" | "allergens">,
  restrictions: Restrictions,
): "diet" | Allergen | null {
  if (!DIET_ALLOWS[restrictions.diet].has(foodOrigin(food))) return "diet";
  return food.allergens.find((a) => restrictions.allergies.includes(a)) ?? null;
}

/** As restrições são absolutas: um alimento excluído nunca entra em dias nem receitas. */
export function isAllowed(
  food: Pick<Food, "id" | "category" | "allergens">,
  restrictions: Restrictions,
): boolean {
  return exclusionReason(food, restrictions) === null;
}

export function allowedFoods<T extends Pick<Food, "id" | "category" | "allergens">>(
  foods: readonly T[],
  restrictions: Restrictions,
): T[] {
  return foods.filter((f) => isAllowed(f, restrictions));
}

/** Os alimentos de que a pessoa gosta, sem repetidos, sem desconhecidos e sem excluídos. */
export function cleanLikedFoods(
  liked: readonly string[],
  foods: FoodIndex,
  restrictions: Restrictions,
): string[] {
  const seen = new Set<string>();
  return liked.filter((id) => {
    const food = foods.get(id);
    if (!food || food.role === "pantry" || seen.has(id)) return false;
    seen.add(id);
    return isAllowed(food, restrictions);
  });
}

export function proteinCount(liked: readonly string[], foods: FoodIndex): number {
  return liked.filter((id) => foods.get(id)?.role === "protein").length;
}

/**
 * Sugestões para o passo "Do que gostas": as fontes de proteína mais fáceis e comuns que a pessoa
 * pode comer (pré-selecionadas quando ainda não escolheu nada).
 */
export function suggestedLikedFoods(
  foods: readonly Food[],
  restrictions: Restrictions,
  count = 6,
): string[] {
  return allowedFoods(foods, restrictions)
    .filter((f) => f.role === "protein" && f.processing !== "ultra")
    .sort((a, b) => b.exampleRank - a.exampleRank || a.id.localeCompare(b.id))
    .slice(0, count)
    .map((f) => f.id);
}
