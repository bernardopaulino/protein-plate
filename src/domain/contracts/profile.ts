import { z } from "zod";
import { ALLERGENS } from "../food";
import { WEIGHT_HARD_LIMITS } from "../goal";
import { DIETS, EQUIPMENT } from "../preferences";
import { MAX_MINUTES_OPTIONS } from "../recipe-options";
import { dailyTargetSchema, intensitySchema, mealSchema, mealsSchema, slugSchema } from "./common";

const unique = <T>(items: readonly T[]) => new Set(items).size === items.length;

/**
 * Formulário de boas-vindas (e "As minhas preferências" na conta). A meta calcula-se no servidor a
 * partir do peso, exceto se a pessoa a escrever à mão (`manualTargetG`).
 */
export const preferencesInputSchema = z
  .object({
    weightKg: z.number().min(WEIGHT_HARD_LIMITS.min).max(WEIGHT_HARD_LIMITS.max).nullable(),
    intensity: intensitySchema,
    manualTargetG: z.nullable(dailyTargetSchema),
    meals: mealsSchema,
    preWorkoutMeal: z.nullable(mealSchema),
    postWorkoutMeal: z.nullable(mealSchema),
    diet: z.enum(DIETS),
    allergies: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length).refine(unique, "repetidos"),
    likedFoods: z.array(slugSchema).max(200).refine(unique, "repetidos"),
    equipment: z.array(z.enum(EQUIPMENT)).min(1).max(EQUIPMENT.length).refine(unique, "repetidos"),
    cookMinutes: z.union(
      MAX_MINUTES_OPTIONS.map((m) => z.literal(m)) as [
        z.ZodLiteral<10>,
        z.ZodLiteral<20>,
        z.ZodLiteral<30>,
        z.ZodLiteral<45>,
      ],
    ),
    /** Consentimento explícito para guardar o peso e as alergias (dados de saúde). */
    healthConsent: z.boolean(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.weightKg === null && p.manualTargetG === null) {
      ctx.addIssue({ code: "custom", path: ["weightKg"], message: "falta o peso ou a meta" });
    }
    for (const key of ["preWorkoutMeal", "postWorkoutMeal"] as const) {
      const meal = p[key];
      if (meal !== null && !p.meals.includes(meal)) {
        ctx.addIssue({ code: "custom", path: [key], message: "tem de ser uma das refeições" });
      }
    }
    if (p.preWorkoutMeal !== null && p.preWorkoutMeal === p.postWorkoutMeal) {
      ctx.addIssue({
        code: "custom",
        path: ["preWorkoutMeal"],
        message: "a refeição pré-treino e a pós-treino são diferentes",
      });
    }
    const healthData = p.weightKg !== null || p.allergies.length > 0;
    if (healthData && !p.healthConsent) {
      ctx.addIssue({
        code: "custom",
        path: ["healthConsent"],
        message: "o peso e as alergias só se guardam com consentimento",
      });
    }
  });

export type PreferencesInput = z.infer<typeof preferencesInputSchema>;

/**
 * Versão dos termos e da política de privacidade aceites ao criar conta. A 2 (login obrigatório,
 * preferências, peso e alergias com consentimento) substitui a 1.
 */
export const CONSENT_VERSION = 2;
