import type { RecipeDayRequest, RecipeErrorCode } from "@/domain/contracts/recipe";
import { mealTargets, type Meal } from "@/domain/meals";
import { allowedFoods } from "@/domain/preferences";
import { dayRecipeBases } from "@/domain/recipe-day";
import { restrictionsOf } from "../services/account";
import { GLOBAL_KEY, quotaKey, usageCount } from "../services/quota";
import { generateRecipe, type Actor, type GenerateDeps } from "./generate";

export type DayRecipeResult =
  | { meal: Meal; ok: true; id: string; cached: boolean }
  | { meal: Meal; ok: false; code: RecipeErrorCode };

export type GenerateDayResult =
  | { ok: true; recipes: DayRecipeResult[] }
  | { ok: false; code: RecipeErrorCode; status: number; remaining?: number };

/**
 * Dia completo (secção 6): uma receita por refeição da pessoa, cada uma com a meta dessa refeição e
 * uma base diferente (sem repetir alimentos entre refeições enquanto houver alternativas). Um só
 * pedido conta uma vez no rate limiting; a quota tem de chegar para o dia inteiro (cada receita nova
 * conta uma). As receitas geram-se em paralelo, com o pipeline normal (validação, cache, ajuste da
 * proteína, D1); se uma falhar, as outras ficam.
 */
export async function generateRecipeDay(
  input: RecipeDayRequest,
  actor: Actor,
  deps: GenerateDeps,
): Promise<GenerateDayResult> {
  const now = deps.now ?? Date.now;
  const { profile } = actor;
  const { db, env } = deps;
  const meals = profile.meals;
  if (meals.length === 0) return { ok: false, code: "invalid_request", status: 400 };

  const restrictions = restrictionsOf(profile);
  const equipment = input.equipment ?? profile.equipment;
  const bases = dayRecipeBases({
    meals,
    foods: allowedFoods(deps.foods, restrictions).filter((f) => f.role !== "pantry"),
    preferred: new Set(profile.likedFoods),
    preWorkoutMeal: profile.preWorkoutMeal,
    noCooking: equipment.length === 0,
    canBoil: equipment.includes("stove") || equipment.includes("microwave"),
    targets: mealTargets(profile.dailyTargetG, meals, profile.postWorkoutMeal),
    seed: Math.floor((deps.random ?? Math.random)() * 1_000_000),
  });

  const personKey = await quotaKey(env.IP_HASH_SECRET, `user:${actor.userId}`, now());
  if (!(await deps.rateLimit(personKey))) return { ok: false, code: "rate_limited", status: 429 };

  // A quota tem de chegar para o dia todo (as receitas que vierem da cache não contam)
  const [used, usedGlobal] = await Promise.all([
    usageCount(db, personKey, now()),
    usageCount(db, GLOBAL_KEY, now()),
  ]);
  if (usedGlobal + meals.length > env.AI_DAILY_LIMIT) {
    return { ok: false, code: "service_unavailable", status: 503 };
  }
  if (used + meals.length > env.QUOTA_USER) {
    return {
      ok: false,
      code: "quota_exceeded",
      status: 429,
      remaining: Math.max(0, env.QUOTA_USER - used),
    };
  }

  const recipes = await Promise.all(
    meals.map(async (meal): Promise<DayRecipeResult> => {
      const result = await generateRecipe(
        {
          foodIds: (bases.get(meal) ?? []).map((f) => f.id),
          meal,
          maxMinutes: input.maxMinutes,
          servings: input.servings,
          locale: input.locale,
          variant: 1,
          equipment: input.equipment,
        },
        actor,
        // O rate limiting já contou este pedido uma vez
        { ...deps, rateLimit: async () => true },
      );
      return result.ok
        ? { meal, ok: true, id: result.id, cached: result.cached }
        : { meal, ok: false, code: result.code };
    }),
  );
  return { ok: true, recipes };
}
