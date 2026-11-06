import type { RecipeDayRequest, RecipeErrorCode } from "@/domain/contracts/recipe";
import { mealTargets, type Meal } from "@/domain/meals";
import { once, recipeOutcomeMetric } from "@/domain/ops-metrics";
import { allowedFoods } from "@/domain/preferences";
import { dayRecipeBases } from "@/domain/recipe-day";
import { restrictionsOf } from "../services/account";
import { GLOBAL_KEY, usageCount } from "../services/quota";
import {
  fromCacheOrLibrary,
  fromModel,
  personQuotaKey,
  prepareRecipe,
  type Actor,
  type GenerateDeps,
  type GenerateResult,
  type PreparedRecipe,
} from "./generate";

export type DayRecipeResult =
  | { meal: Meal; ok: true; id: string; cached: boolean }
  | { meal: Meal; ok: false; code: RecipeErrorCode };

export type GenerateDayResult =
  | { ok: true; recipes: DayRecipeResult[] }
  | { ok: false; code: RecipeErrorCode; status: number; remaining?: number };

/**
 * Dia completo (secção 6): uma receita por refeição da pessoa, cada uma com a meta dessa refeição e
 * uma base diferente (sem repetir alimentos entre refeições enquanto houver alternativas). Um só
 * pedido conta uma vez no rate limiting. Primeiro, sem custo, a cache e a biblioteca (por ordem do
 * dia, sem repetir a proteína das refeições anteriores); a quota só tem de chegar para as que faltam,
 * que se geram em paralelo com o pipeline normal. Se uma falhar, as outras ficam.
 */
export async function generateRecipeDay(
  input: RecipeDayRequest,
  actor: Actor,
  deps: GenerateDeps,
): Promise<GenerateDayResult> {
  const now = deps.now ?? Date.now;
  const count = deps.count ?? (() => {});
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

  const personKey = await personQuotaKey(actor, env, now());
  if (!(await deps.rateLimit(personKey))) return { ok: false, code: "rate_limited", status: 429 };

  const results = new Map<Meal, GenerateResult>();
  const pending: { meal: Meal; prepared: PreparedRecipe }[] = [];
  // Proteínas já usadas no dia: as da biblioteca e as das bases das outras refeições (que podem ir
  // ao modelo); a biblioteca nunca as repete
  const picked = new Set<string>();
  const baseProteins = (meal: Meal) =>
    (bases.get(meal) ?? []).filter((f) => f.role === "protein").map((f) => f.id);
  for (const meal of meals) {
    const avoid = new Set([...picked, ...meals.filter((m) => m !== meal).flatMap(baseProteins)]);
    const prepared = await prepareRecipe(
      {
        foodIds: [],
        meal,
        maxMinutes: input.maxMinutes,
        servings: input.servings,
        locale: input.locale,
        variant: 1,
        equipment: input.equipment,
      },
      actor,
      deps,
      bases.get(meal),
    );
    if (!prepared.ok) {
      results.set(meal, prepared);
      continue;
    }
    const ready = await fromCacheOrLibrary(prepared.value, actor, deps, avoid);
    if (ready) {
      for (const id of ready.proteinIds ?? []) picked.add(id);
      results.set(meal, ready);
    } else {
      pending.push({ meal, prepared: prepared.value });
    }
  }

  // A quota tem de chegar para as que faltam (as da cache e da biblioteca não contam)
  if (pending.length > 0) {
    const [used, usedGlobal] = await Promise.all([
      usageCount(db, personKey, now()),
      usageCount(db, GLOBAL_KEY, now()),
    ]);
    const blocked: { code: RecipeErrorCode; status: number; remaining?: number } | null =
      usedGlobal + pending.length > env.AI_DAILY_LIMIT
        ? { code: "service_unavailable", status: 503 }
        : used + pending.length > env.QUOTA_USER
          ? {
              code: "quota_exceeded",
              status: 429,
              remaining: Math.max(0, env.QUOTA_USER - used),
            }
          : null;
    if (blocked) {
      // Nada saiu sem custo: o dia inteiro fica para depois (como antes da biblioteca)
      if (results.size === 0 || [...results.values()].every((r) => !r.ok)) {
        return { ok: false, ...blocked };
      }
      for (const { meal } of pending) {
        results.set(meal, { ok: false, code: blocked.code, status: blocked.status });
      }
    } else {
      await Promise.all(
        pending.map(async ({ meal, prepared }) => {
          results.set(meal, await fromModel(prepared, personKey, deps, count));
        }),
      );
    }
  }

  const recipes = meals.map((meal): DayRecipeResult => {
    const result = results.get(meal)!;
    count(once(recipeOutcomeMetric(result)));
    return result.ok
      ? { meal, ok: true, id: result.id, cached: result.cached }
      : { meal, ok: false, code: result.code };
  });
  return { ok: true, recipes };
}
