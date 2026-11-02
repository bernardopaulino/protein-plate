import { z } from "zod";
import { WEIGHT_HARD_LIMITS } from "../goal";
import { dailyTargetSchema, intensitySchema, mealSchema, mealsSchema } from "./common";
import { planItemsSchema } from "./plan";

/** Versão atual do estado de convidado no localStorage. */
export const GUEST_STATE_VERSION = 1;

export const guestTargetSchema = z.object({
  grams: dailyTargetSchema,
  intensity: intensitySchema,
  /** Só no browser: nunca é enviado ao servidor. */
  weightKg: z.number().min(WEIGHT_HARD_LIMITS.min).max(WEIGHT_HARD_LIMITS.max).nullable(),
  /** Meta escrita à mão (em vez de peso × intensidade). */
  manual: z.boolean().default(false),
});

export const guestStateSchema = z
  .object({
    version: z.literal(GUEST_STATE_VERSION),
    target: guestTargetSchema,
    meals: mealsSchema,
    postWorkoutMeal: mealSchema.nullable(),
    plan: z.object({
      items: planItemsSchema,
      /** Seed do dia exemplo ("Outras opções"). */
      seed: z.number().int().min(0).max(1_000).default(0),
      /** true enquanto o dia é o exemplo gerado, sem mudanças da pessoa. */
      isExample: z.boolean().default(false),
    }),
    updatedAt: z.number().int().nonnegative(),
    /**
     * Conta a que este dia pertence (null para convidados). Com conta, o browser guarda uma cópia
     * e sincroniza com a D1; o servidor usa sempre o utilizador da sessão, nunca este valor.
     */
    owner: z.string().min(1).max(64).nullable().default(null),
  })
  .refine((s) => s.postWorkoutMeal === null || s.meals.includes(s.postWorkoutMeal), {
    message: "a refeição pós-treino tem de ser uma das escolhidas",
    path: ["postWorkoutMeal"],
  });

export type GuestState = z.infer<typeof guestStateSchema>;
export type GuestTarget = z.infer<typeof guestTargetSchema>;
