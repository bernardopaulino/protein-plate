import { z } from "zod";
import { MAX_MINUTES_OPTIONS, RECIPE_LIMITS, type MaxMinutes } from "@/domain/contracts/recipe";
import { defaultPortion, type FoodIndex } from "@/domain/food";
import { proteinForGrams } from "@/domain/protein";

/**
 * Schema da resposta do modelo, IGUAL em todos os pedidos (secção 6). A API compila uma gramática
 * por schema e guarda-a 24 h: um schema por pedido (ids ou tempo máximo dentro do schema) pagava
 * essa compilação em cada receita. Os ids permitidos e o tempo máximo verificam-se depois, em
 * `recipeProblem`.
 */
export const recipeOutputSchema = z.object({
  title: z.string().min(3).max(RECIPE_LIMITS.title),
  summary: z.string().min(3).max(RECIPE_LIMITS.summary),
  prepMinutes: z
    .number()
    .int()
    .min(1)
    .max(Math.max(...MAX_MINUTES_OPTIONS)),
  ingredients: z
    .array(
      z.object({
        foodId: z.string().min(1).max(64),
        grams: z.number().positive().max(5000),
      }),
    )
    .min(RECIPE_LIMITS.ingredientsMin)
    .max(RECIPE_LIMITS.ingredientsMax),
  steps: z
    .array(z.string().min(3).max(RECIPE_LIMITS.step))
    .min(RECIPE_LIMITS.stepsMin)
    .max(RECIPE_LIMITS.stepsMax),
});

export type RecipeOutput = z.infer<typeof recipeOutputSchema>;

/**
 * Junta os ingredientes repetidos (soma as gramas, mantém a ordem da primeira vez). É um erro que a
 * app corrige sem custo, em vez de gastar uma segunda chamada ao modelo.
 */
export function mergeDuplicateIngredients(output: RecipeOutput): RecipeOutput {
  const merged = new Map<string, number>();
  for (const { foodId, grams } of output.ingredients) {
    merged.set(foodId, (merged.get(foodId) ?? 0) + grams);
  }
  if (merged.size === output.ingredients.length) return output;
  return {
    ...output,
    ingredients: [...merged].map(([foodId, grams]) => ({ foodId, grams })),
  };
}

/** Proteína por dose, calculada pela app a partir da TCA (nunca pela IA). */
export function proteinPerServing(
  ingredients: readonly { foodId: string; grams: number }[],
  servings: number,
  foods: FoodIndex,
): number {
  const total = ingredients.reduce((sum, i) => {
    const food = foods.get(i.foodId);
    return sum + (food ? proteinForGrams(i.grams, food.proteinPer100g) : 0);
  }, 0);
  return total / servings;
}

/**
 * Validação depois do modelo (secção 6): só ingredientes da lista enviada, tempo dentro do pedido,
 * todas as fontes de proteína escolhidas presentes, sem ingredientes repetidos, gramas por dose
 * ≤ 3 × porção default, proteína por dose entre 1 e 120 g. Devolve a descrição do problema (para a
 * segunda tentativa) ou null.
 */
export function recipeProblem(
  output: RecipeOutput,
  context: {
    /** Os ids enviados ao modelo (base + despensa permitida). */
    allowedIds: ReadonlySet<string>;
    maxMinutes: MaxMinutes;
    proteinIds: readonly string[];
    servings: number;
    foods: FoodIndex;
  },
): string | null {
  const ids = output.ingredients.map((i) => i.foodId);
  const outside = ids.filter((id) => !context.allowedIds.has(id));
  if (outside.length > 0) {
    return `os ingredientes ${outside.join(", ")} não estão na lista; usa só os ids da lista`;
  }
  if (output.prepMinutes > context.maxMinutes) {
    return `prepMinutes (${output.prepMinutes}) passa o tempo máximo de ${context.maxMinutes} minutos`;
  }
  if (new Set(ids).size !== ids.length) return "há ingredientes repetidos; junta as quantidades";
  const missing = context.proteinIds.filter((id) => !ids.includes(id));
  if (missing.length > 0) return `faltam as fontes de proteína ${missing.join(", ")}`;
  for (const ingredient of output.ingredients) {
    const food = context.foods.get(ingredient.foodId);
    if (!food) return `ingrediente desconhecido ${ingredient.foodId}`;
    const perServing = ingredient.grams / context.servings;
    const max = RECIPE_LIMITS.portionMultiplier * defaultPortion(food).grams;
    if (perServing > max) {
      return `${ingredient.foodId} tem ${Math.round(perServing)} g por dose (máximo ${max} g)`;
    }
  }
  const protein = proteinPerServing(output.ingredients, context.servings, context.foods);
  const { min, max } = RECIPE_LIMITS.proteinPerServing;
  if (protein < min || protein > max) {
    return `a proteína por dose (${Math.round(protein)} g) tem de ficar entre ${min} e ${max} g`;
  }
  return null;
}

/** cache_key = SHA-256 de tudo o que muda a receita (secção 6). */
export async function recipeCacheKey(parts: {
  foodIds: readonly string[];
  meal: string;
  postWorkout: boolean;
  preWorkout: boolean;
  mealTargetG: number;
  /** Despensa permitida (muda com as restrições da pessoa) e equipamento. */
  pantryIds: readonly string[];
  equipment: readonly string[];
  maxMinutes: number;
  servings: number;
  locale: string;
  promptVersion: number;
  model: string;
  foodDataVersion: number;
  variant: number;
}): Promise<string> {
  const canonical = JSON.stringify([
    [...parts.foodIds].sort(),
    parts.meal,
    parts.postWorkout,
    parts.preWorkout,
    Math.round(parts.mealTargetG / 5) * 5,
    [...parts.pantryIds].sort(),
    [...parts.equipment].sort(),
    parts.maxMinutes,
    parts.servings,
    parts.locale,
    parts.promptVersion,
    parts.model,
    parts.foodDataVersion,
    parts.variant,
  ]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const ALPHABET = "0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

/** Id curto e público da receita (10 caracteres, ~58 bits). */
export function shortId(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}
