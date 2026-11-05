/**
 * Constantes das receitas sem dependências (o formulário do cliente usa-as sem trazer o Zod).
 * Os schemas estão em contracts/recipe.ts.
 */

export const MAX_MINUTES_OPTIONS = [10, 20, 30, 45] as const;
export type MaxMinutes = (typeof MAX_MINUTES_OPTIONS)[number];

/**
 * Proteína por dose escolhida pela pessoa (em vez da meta da refeição), em gramas. Acima de 100 g
 * as quantidades deixam de ser realistas (3 porções habituais por ingrediente).
 */
export const RECIPE_TARGET = { min: 10, max: 100, step: 5 } as const;

/**
 * A app ajusta as quantidades da receita para a proteína por dose ficar dentro desta margem do
 * pedido (a IA não acerta números; a proteína é sempre calculada pela app).
 */
export const RECIPE_TARGET_TOLERANCE = 0.1;

/**
 * Com a proteína escolhida pela pessoa, a receita só é aceite se, depois do ajuste, ficar dentro
 * desta margem (senão, nova tentativa com o erro descrito).
 */
export const RECIPE_TARGET_ACCEPT = 0.2;

export const RECIPE_ERROR_CODES = [
  "invalid_request",
  "unknown_food",
  "restricted_food",
  /** "Sem cozinhar" com alimentos que precisam de lume (ease 3). */
  "needs_cooking",
  "unauthorized",
  "onboarding_required",
  "rate_limited",
  "quota_exceeded",
  "generation_failed",
  "service_unavailable",
] as const;
export type RecipeErrorCode = (typeof RECIPE_ERROR_CODES)[number];
