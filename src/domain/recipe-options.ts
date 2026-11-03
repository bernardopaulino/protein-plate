/**
 * Constantes das receitas sem dependências (o formulário do cliente usa-as sem trazer o Zod).
 * Os schemas estão em contracts/recipe.ts.
 */

export const MAX_MINUTES_OPTIONS = [10, 20, 30, 45] as const;
export type MaxMinutes = (typeof MAX_MINUTES_OPTIONS)[number];

export const RECIPE_ERROR_CODES = [
  "invalid_request",
  "unknown_food",
  "turnstile_failed",
  "rate_limited",
  "quota_exceeded",
  "generation_failed",
  "service_unavailable",
] as const;
export type RecipeErrorCode = (typeof RECIPE_ERROR_CODES)[number];
