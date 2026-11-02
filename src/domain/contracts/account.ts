import { z } from "zod";
import {
  dailyTargetSchema,
  intensitySchema,
  localeSchema,
  mealSchema,
  mealsSchema,
} from "./common";
import { planItemsSchema } from "./plan";

/**
 * Meta e refeições guardadas na conta. `strict`: um campo a mais (como o peso) é recusado — o
 * peso nunca sai do browser.
 */
export const profileInputSchema = z
  .object({
    dailyTargetG: dailyTargetSchema,
    intensity: intensitySchema,
    meals: mealsSchema,
    postWorkoutMeal: mealSchema.nullable(),
    locale: localeSchema.default("pt"),
  })
  .strict()
  .refine((p) => p.postWorkoutMeal === null || p.meals.includes(p.postWorkoutMeal), {
    message: "a refeição pós-treino tem de ser uma das escolhidas",
    path: ["postWorkoutMeal"],
  });

export type ProfileInput = z.infer<typeof profileInputSchema>;

/** Meta de uma conta nova sem estado de convidado (muda em /comecar). */
export const DEFAULT_PROFILE: ProfileInput = {
  dailyTargetG: 140,
  intensity: "alta",
  meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
  postWorkoutMeal: null,
  locale: "pt",
};

export const savePlanInputSchema = z.object({ items: planItemsSchema }).strict();

/** Importação do estado de convidado (idempotente pelo importId). Sem peso. */
export const importGuestDataSchema = z
  .object({
    importId: z.uuid(),
    profile: profileInputSchema,
    items: planItemsSchema,
    /** Se já há um dia na conta: qual fica. */
    keep: z.enum(["guest", "account"]).optional(),
  })
  .strict();

export type ImportGuestDataInput = z.infer<typeof importGuestDataSchema>;

/** Versão dos termos e da política de privacidade aceites ao criar conta. */
export const CONSENT_VERSION = 1;
