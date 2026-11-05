import type { LanguageModel } from "ai";
import { eq } from "drizzle-orm";
import type { RecipeErrorCode, RecipeRequest } from "@/domain/contracts/recipe";
import type { Food, FoodIndex } from "@/domain/food";
import { mealTarget } from "@/domain/meals";
import { RECIPE_SLOW_MS, once, recipeOutcomeMetric, type OpsCounts } from "@/domain/ops-metrics";
import { allowedFoods, isAllowed } from "@/domain/preferences";
import { recipeBase } from "@/domain/recipe-base";
import type { AppEnv } from "@/lib/env";
import { languageModel, mockModel } from "../ai/model";
import { PROMPT_VERSION } from "../ai/prompts/recipe.v3";
import type { Db } from "../db/client-core";
import { recipeIngredients, recipes } from "../db/schema";
import { restrictionsOf, type Profile } from "../services/account";
import { GLOBAL_KEY, countUsage, quotaKey, usageCount } from "../services/quota";
import { mockRecipe } from "./mock-recipe";
import { callRecipeModel } from "./model-call";
import { proteinPerServing, recipeCacheKey, shortId } from "./recipe-rules";

/** Quem pede: sempre uma conta com o formulário de boas-vindas concluído. */
export interface Actor {
  userId: string;
  profile: Pick<
    Profile,
    | "dailyTargetG"
    | "meals"
    | "preWorkoutMeal"
    | "postWorkoutMeal"
    | "diet"
    | "allergies"
    | "equipment"
    | "likedFoods"
  >;
}

export type GenerateResult =
  { ok: true; id: string; cached: boolean } | { ok: false; code: RecipeErrorCode; status: number };

export interface GenerateDeps {
  db: Db;
  env: AppEnv;
  foods: readonly Food[];
  foodIndex: FoodIndex;
  foodDataVersion: number;
  /** Rate limiting por chave (binding RECIPE_LIMITER) */
  rateLimit: (key: string) => Promise<boolean>;
  /** Modelo a usar (os testes injetam um simulado) */
  model?: (prompt: { chosen: readonly Food[]; pantry: readonly Food[] }) => LanguageModel;
  now?: () => number;
  /** Para variar a base quando a pessoa não escolhe alimentos (os testes fixam-na). */
  random?: () => number;
  log?: (event: Record<string, unknown>) => void;
  /** Contadores do funcionamento (resultado, novas tentativas, lentas); por defeito, nenhum. */
  count?: (metrics: OpsCounts) => void;
}

const fail = (code: RecipeErrorCode, status: number): GenerateResult => ({
  ok: false,
  code,
  status,
});

/**
 * Pipeline das receitas (secção 6): validação (refeição da pessoa, alimentos permitidos) → base
 * completada pela app (o que a pessoa escolheu, ou nada, mais uma proteína e acompanhamentos de que
 * gosta) → rate limiting → cache → quotas → modelo (uma nova tentativa com o erro descrito) →
 * proteína calculada pela app → D1. Conta o resultado de cada pedido (`recipes.ok.*` ou
 * `recipes.error.<código>`).
 */
export async function generateRecipe(
  input: RecipeRequest,
  actor: Actor,
  deps: GenerateDeps,
): Promise<GenerateResult> {
  const count = deps.count ?? (() => {});
  const result = await pipeline(input, actor, deps, count);
  count(once(recipeOutcomeMetric(result)));
  return result;
}

async function pipeline(
  input: RecipeRequest,
  actor: Actor,
  deps: GenerateDeps,
  count: (metrics: OpsCounts) => void,
): Promise<GenerateResult> {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? (() => {});
  const { db, env } = deps;

  const { profile } = actor;
  if (!profile.meals.includes(input.meal)) return fail("invalid_request", 400);

  // Alimentos: todos têm de existir e caber nas restrições; a despensa entra sempre como opcional
  const restrictions = restrictionsOf(profile);
  const picked = input.foodIds.map((id) => deps.foodIndex.get(id));
  if (picked.some((f) => !f || f.role === "pantry")) return fail("unknown_food", 400);
  if ((picked as Food[]).some((f) => !isAllowed(f, restrictions)))
    return fail("restricted_food", 400);
  // Equipamento: o escolhido para esta receita ou o do perfil; vazio = "Sem cozinhar" (só alimentos
  // que se comem sem preparação)
  const equipment = input.equipment ?? profile.equipment;
  const noCooking = equipment.length === 0;
  if (noCooking && (picked as Food[]).some((f) => f.ease === 3)) return fail("needs_cooking", 400);
  // Proteína por dose: a escolhida pela pessoa ou a meta da refeição (do perfil)
  const customTarget = input.targetProteinG !== undefined;
  const targetG =
    input.targetProteinG ??
    mealTarget(profile.dailyTargetG, profile.meals, input.meal, profile.postWorkoutMeal);
  const chosenFoods = recipeBase({
    meal: input.meal,
    chosen: picked as Food[],
    foods: allowedFoods(deps.foods, restrictions).filter((f) => f.role !== "pantry"),
    preferred: new Set(profile.likedFoods),
    preWorkout: input.meal === profile.preWorkoutMeal,
    // Com alimentos escolhidos, a base é estável (a cache funciona) e muda com a variante; sem
    // nada escolhido, cada pedido traz uma combinação nova
    seed:
      input.foodIds.length > 0
        ? input.variant - 1
        : Math.floor((deps.random ?? Math.random)() * 1_000_000),
    noCooking,
    targetG,
  });
  if (!chosenFoods.some((f) => f.role === "protein")) return fail("invalid_request", 400);
  const request: RecipeRequest = { ...input, foodIds: chosenFoods.map((f) => f.id) };
  const pantry = deps.foods.filter(
    (f) => f.role === "pantry" && !request.foodIds.includes(f.id) && isAllowed(f, restrictions),
  );
  const context = {
    mealTargetG: targetG,
    customTarget,
    postWorkout: request.meal === profile.postWorkoutMeal,
    preWorkout: request.meal === profile.preWorkoutMeal,
    equipment,
    equipmentChosen: input.equipment !== undefined,
    diet: profile.diet,
  };

  const personKey = await quotaKey(env.IP_HASH_SECRET, `user:${actor.userId}`, now());
  if (!(await deps.rateLimit(personKey))) return fail("rate_limited", 429);

  const modelId = env.AI_MODE === "mock" ? "mock" : env.AI_MODEL;
  const cacheKey = await recipeCacheKey({
    ...request,
    ...context,
    pantryIds: pantry.map((f) => f.id),
    promptVersion: PROMPT_VERSION,
    model: modelId,
    foodDataVersion: deps.foodDataVersion,
  });
  const [cached] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.cacheKey, cacheKey));
  if (cached) {
    log({ msg: "recipe_cache_hit" });
    return { ok: true, id: cached.id, cached: true };
  }

  // Quotas: por pessoa e global (acima do global, só cache)
  const limit = env.QUOTA_USER;
  const [used, usedGlobal] = await Promise.all([
    usageCount(db, personKey, now()),
    usageCount(db, GLOBAL_KEY, now()),
  ]);
  if (usedGlobal >= env.AI_DAILY_LIMIT) return fail("service_unavailable", 503);
  if (used >= limit) return fail("quota_exceeded", 429);

  const model =
    deps.model?.({ chosen: chosenFoods, pantry }) ??
    languageModel(env, () =>
      mockModel(() => JSON.stringify(mockRecipe(request, chosenFoods, pantry)), "mock"),
    );

  const { output, attempts, retrySkipped, inputTokens, outputTokens, latencyMs } =
    await callRecipeModel({
      model,
      prompt: { request, context, chosen: chosenFoods, pantry },
      foods: deps.foodIndex,
      now,
      log,
    });
  const modelOps: OpsCounts = {};
  if (attempts > 1) modelOps["recipes.retry"] = 1;
  if (retrySkipped) modelOps["recipes.retry_skipped"] = 1;
  if (output && latencyMs > RECIPE_SLOW_MS) modelOps["recipes.slow"] = 1;
  count(modelOps);

  // Falhou dentro do prazo: erro amigável, não conta para a quota
  if (!output) {
    log({ msg: "recipe_failed", model: modelId, latencyMs, inputTokens, outputTokens });
    return fail("generation_failed", 422);
  }

  const id = shortId();
  const perServing = proteinPerServing(output.ingredients, request.servings, deps.foodIndex);
  try {
    await db.batch([
      db.insert(recipes).values({
        id,
        cacheKey,
        locale: request.locale,
        title: output.title.trim(),
        summary: output.summary.trim(),
        meal: request.meal,
        postWorkout: context.postWorkout,
        servings: request.servings,
        variant: request.variant,
        prepMinutes: output.prepMinutes,
        steps: output.steps.map((s) => s.trim()),
        proteinPerServingG: perServing,
        mealTargetG: context.mealTargetG,
        customTarget,
        equipment: [...equipment],
        model: modelId,
        promptVersion: PROMPT_VERSION,
        foodDataVersion: deps.foodDataVersion,
        inputTokens,
        outputTokens,
        createdAt: now(),
      }),
      ...output.ingredients.map((ingredient, position) =>
        db.insert(recipeIngredients).values({
          recipeId: id,
          position,
          foodId: ingredient.foodId,
          grams: ingredient.grams,
        }),
      ),
    ]);
  } catch (err) {
    // Dois pedidos iguais em simultâneo: o segundo usa a receita do primeiro
    const [existing] = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.cacheKey, cacheKey));
    if (existing) return { ok: true, id: existing.id, cached: true };
    throw err;
  }
  await countUsage(db, [personKey, GLOBAL_KEY], now());
  log({ msg: "recipe_generated", model: modelId, latencyMs, inputTokens, outputTokens });
  return { ok: true, id, cached: false };
}
