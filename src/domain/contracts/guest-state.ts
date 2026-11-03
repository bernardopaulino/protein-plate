// zod/mini: este schema valida o localStorage no browser (ver common.ts). Com o login obrigatório,
// é a cópia local do dia da conta (o AccountSync sincroniza-a com a D1).
import { z } from "zod/mini";
import { WEIGHT_HARD_LIMITS } from "../goal";
import { dailyTargetSchema, intensitySchema, mealSchema, mealsSchema } from "./common";
import { planItemsSchema } from "./plan";

/** Versão atual do estado de convidado no localStorage. */
export const GUEST_STATE_VERSION = 2;

export const guestTargetSchema = z.object({
  grams: dailyTargetSchema,
  intensity: intensitySchema,
  /** Só no browser: nunca é enviado ao servidor. */
  weightKg: z.nullable(
    z.number().check(z.gte(WEIGHT_HARD_LIMITS.min), z.lte(WEIGHT_HARD_LIMITS.max)),
  ),
  /** Meta escrita à mão (em vez de peso × intensidade). */
  manual: z._default(z.boolean(), false),
});

export const guestStateSchema = z
  .object({
    version: z.literal(GUEST_STATE_VERSION),
    target: guestTargetSchema,
    meals: mealsSchema,
    postWorkoutMeal: z.nullable(mealSchema),
    /** Refeição antes do treino (versão 2). */
    preWorkoutMeal: z._default(z.nullable(mealSchema), null),
    plan: z.object({
      items: planItemsSchema,
      /** Seed do dia exemplo ("Outras opções"). */
      seed: z._default(z.int().check(z.gte(0), z.lte(1_000)), 0),
      /** true enquanto o dia é o exemplo gerado, sem mudanças da pessoa. */
      isExample: z._default(z.boolean(), false),
    }),
    updatedAt: z.int().check(z.nonnegative()),
    /**
     * Conta a que este dia pertence (null para convidados). Com conta, o browser guarda uma cópia
     * e sincroniza com a D1; o servidor usa sempre o utilizador da sessão, nunca este valor.
     */
    owner: z._default(z.nullable(z.string().check(z.minLength(1), z.maxLength(64))), null),
  })
  .check(
    z.refine((s) => s.postWorkoutMeal === null || s.meals.includes(s.postWorkoutMeal), {
      message: "a refeição pós-treino tem de ser uma das escolhidas",
      path: ["postWorkoutMeal"],
    }),
    z.refine(
      (s) =>
        s.preWorkoutMeal === null ||
        (s.meals.includes(s.preWorkoutMeal) && s.preWorkoutMeal !== s.postWorkoutMeal),
      {
        message: "a refeição pré-treino tem de ser uma das escolhidas e diferente da pós-treino",
        path: ["preWorkoutMeal"],
      },
    ),
  );

export type GuestState = z.infer<typeof guestStateSchema>;
export type GuestTarget = z.infer<typeof guestTargetSchema>;
