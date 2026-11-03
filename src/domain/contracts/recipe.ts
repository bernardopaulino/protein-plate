import { z } from "zod";
import { localeSchema, mealSchema, slugSchema } from "./common";

import { MAX_MINUTES_OPTIONS, RECIPE_ERROR_CODES } from "../recipe-options";

export {
  MAX_MINUTES_OPTIONS,
  RECIPE_ERROR_CODES,
  type MaxMinutes,
  type RecipeErrorCode,
} from "../recipe-options";

export const RECIPE_VARIANTS = [1, 2, 3] as const;

/** Pedido de receita: só campos fechados, sem texto livre; exige login (secção 6). */
export const recipeRequestSchema = z
  .object({
    foodIds: z
      .array(slugSchema)
      .min(2)
      .max(6)
      .refine((ids) => new Set(ids).size === ids.length, "alimentos repetidos"),
    /** Uma das refeições da pessoa; a meta da refeição e o treino vêm do perfil. */
    meal: mealSchema,
    maxMinutes: z.union(
      MAX_MINUTES_OPTIONS.map((m) => z.literal(m)) as [
        z.ZodLiteral<10>,
        z.ZodLiteral<20>,
        z.ZodLiteral<30>,
        z.ZodLiteral<45>,
      ],
    ),
    servings: z.number().int().min(1).max(4),
    locale: localeSchema,
    /** "Gerar outra": 1 a 3 (cada variante tem a sua entrada na cache). */
    variant: z.number().int().min(1).max(3).default(1),
  })
  .strict();

export type RecipeRequest = z.infer<typeof recipeRequestSchema>;

export const recipeResponseSchema = z.union([
  z.object({ ok: z.literal(true), id: z.string(), cached: z.boolean() }),
  z.object({ ok: z.literal(false), code: z.enum(RECIPE_ERROR_CODES) }),
]);
export type RecipeResponse = z.infer<typeof recipeResponseSchema>;

/** Limites do texto da receita (o schema do modelo usa os mesmos). */
export const RECIPE_LIMITS = {
  title: 60,
  summary: 140,
  ingredientsMin: 2,
  ingredientsMax: 10,
  stepsMin: 2,
  stepsMax: 8,
  step: 240,
  /** Gramas por dose de cada ingrediente: no máximo 3 × a porção por defeito. */
  portionMultiplier: 3,
  proteinPerServing: { min: 1, max: 120 },
} as const;
