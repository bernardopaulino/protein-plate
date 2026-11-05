import { z } from "zod";
import { localeSchema, mealSchema, slugSchema } from "./common";

import { EQUIPMENT } from "../preferences";
import { RECIPE_MAX_CHOSEN } from "../recipe-base";
import { MAX_MINUTES_OPTIONS, RECIPE_ERROR_CODES, RECIPE_TARGET } from "../recipe-options";

export {
  MAX_MINUTES_OPTIONS,
  RECIPE_ERROR_CODES,
  RECIPE_TARGET,
  type MaxMinutes,
  type RecipeErrorCode,
} from "../recipe-options";

export const RECIPE_VARIANTS = [1, 2, 3] as const;

const maxMinutesSchema = z.union(
  MAX_MINUTES_OPTIONS.map((m) => z.literal(m)) as [
    z.ZodLiteral<10>,
    z.ZodLiteral<20>,
    z.ZodLiteral<30>,
    z.ZodLiteral<45>,
  ],
);

/**
 * Equipamento para esta receita (em vez do do perfil). Vazio = "Sem cozinhar": só se monta, com
 * alimentos que se comem sem preparação.
 */
const equipmentSchema = z
  .array(z.enum(EQUIPMENT))
  .max(EQUIPMENT.length)
  .refine((list) => new Set(list).size === list.length, "equipamento repetido");

/** Pedido de receita: só campos fechados, sem texto livre; exige login (secção 6). */
export const recipeRequestSchema = z
  .object({
    /** Opcional: o que a pessoa quer usar (a app completa com o que ela gosta). */
    foodIds: z
      .array(slugSchema)
      .max(RECIPE_MAX_CHOSEN)
      .refine((ids) => new Set(ids).size === ids.length, "alimentos repetidos"),
    /** Uma das refeições da pessoa; a meta da refeição e o treino vêm do perfil. */
    meal: mealSchema,
    maxMinutes: maxMinutesSchema,
    servings: z.number().int().min(1).max(4),
    locale: localeSchema,
    /** "Gerar outra": 1 a 3 (cada variante tem a sua entrada na cache). */
    variant: z.number().int().min(1).max(3).default(1),
    /** Opcional: proteína por dose à escolha (senão, a meta da refeição do perfil). */
    targetProteinG: z.number().int().min(RECIPE_TARGET.min).max(RECIPE_TARGET.max).optional(),
    /** Opcional: equipamento para esta receita (senão, o do perfil). */
    equipment: equipmentSchema.optional(),
  })
  .strict();

export type RecipeRequest = z.infer<typeof recipeRequestSchema>;

export const recipeResponseSchema = z.union([
  z.object({ ok: z.literal(true), id: z.string(), cached: z.boolean() }),
  z.object({ ok: z.literal(false), code: z.enum(RECIPE_ERROR_CODES) }),
]);
export type RecipeResponse = z.infer<typeof recipeResponseSchema>;

/**
 * Dia completo (`POST /api/recipes/day`): uma receita por refeição da pessoa, cada uma com a meta
 * dessa refeição. As refeições, as metas e o treino vêm do perfil; o pedido só escolhe o tempo, as
 * doses e (opcional) o equipamento.
 */
export const recipeDayRequestSchema = z
  .object({
    maxMinutes: maxMinutesSchema,
    servings: z.number().int().min(1).max(4),
    locale: localeSchema,
    equipment: equipmentSchema.optional(),
  })
  .strict();

export type RecipeDayRequest = z.infer<typeof recipeDayRequestSchema>;

/** Cada refeição traz a receita ou o erro dela (o resto do dia continua a valer). */
export const recipeDayResponseSchema = z.union([
  z.object({
    ok: z.literal(true),
    recipes: z.array(
      z.union([
        z.object({ meal: mealSchema, ok: z.literal(true), id: z.string() }),
        z.object({ meal: mealSchema, ok: z.literal(false), code: z.enum(RECIPE_ERROR_CODES) }),
      ]),
    ),
  }),
  z.object({
    ok: z.literal(false),
    code: z.enum(RECIPE_ERROR_CODES),
    /** Com quota_exceeded: quantas receitas novas ainda dá para gerar hoje. */
    remaining: z.number().int().min(0).optional(),
  }),
]);
export type RecipeDayResponse = z.infer<typeof recipeDayResponseSchema>;

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
