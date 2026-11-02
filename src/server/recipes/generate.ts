import { Output, generateText, type LanguageModel } from "ai";
import { eq } from "drizzle-orm";
import type { RecipeErrorCode, RecipeRequest } from "@/domain/contracts/recipe";
import type { Food, FoodIndex } from "@/domain/food";
import type { AppEnv } from "@/lib/env";
import { AI_TIMEOUT_MS, languageModel, mockModel } from "../ai/model";
import { PROMPT_VERSION, buildRecipePrompt } from "../ai/prompts/recipe.v1";
import type { Db } from "../db/client-core";
import { recipeIngredients, recipes } from "../db/schema";
import { GLOBAL_KEY, countUsage, quotaKey, usageCount } from "../services/quota";
import { mockRecipe } from "./mock-recipe";
import {
  proteinPerServing,
  recipeCacheKey,
  recipeOutputSchema,
  recipeProblem,
  shortId,
  type RecipeOutput,
} from "./recipe-rules";

export type Actor = { kind: "user"; userId: string } | { kind: "guest"; ip: string | null };

export type GenerateResult =
  { ok: true; id: string; cached: boolean } | { ok: false; code: RecipeErrorCode; status: number };

export interface GenerateDeps {
  db: Db;
  env: AppEnv;
  foods: readonly Food[];
  foodIndex: FoodIndex;
  foodDataVersion: number;
  /** Verificação do Turnstile (convidados) */
  verifyTurnstile: (token: string | undefined, ip: string | null) => Promise<boolean>;
  /** Rate limiting por chave (binding RECIPE_LIMITER) */
  rateLimit: (key: string) => Promise<boolean>;
  /** Modelo a usar (os testes injetam um simulado) */
  model?: (prompt: { chosen: readonly Food[]; pantry: readonly Food[] }) => LanguageModel;
  now?: () => number;
  log?: (event: Record<string, unknown>) => void;
}

const fail = (code: RecipeErrorCode, status: number): GenerateResult => ({
  ok: false,
  code,
  status,
});

/**
 * Pipeline das receitas (secção 6): validação → Turnstile (convidados) → rate limiting → cache →
 * quotas → modelo (uma nova tentativa com o erro descrito) → proteína calculada pela app → D1.
 */
export async function generateRecipe(
  request: RecipeRequest,
  actor: Actor,
  deps: GenerateDeps,
): Promise<GenerateResult> {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? (() => {});
  const { db, env } = deps;

  // Alimentos: todos têm de existir; a despensa entra sempre como opcional
  const chosen = request.foodIds.map((id) => deps.foodIndex.get(id));
  if (chosen.some((f) => !f || f.role === "pantry")) return fail("unknown_food", 400);
  const chosenFoods = chosen as Food[];
  const pantry = deps.foods.filter((f) => f.role === "pantry" && !request.foodIds.includes(f.id));

  if (actor.kind === "guest" && !(await deps.verifyTurnstile(request.turnstileToken, actor.ip))) {
    return fail("turnstile_failed", 403);
  }

  const subject = actor.kind === "user" ? `user:${actor.userId}` : `ip:${actor.ip ?? "unknown"}`;
  const personKey = await quotaKey(env.IP_HASH_SECRET, subject, now());
  if (!(await deps.rateLimit(personKey))) return fail("rate_limited", 429);

  const modelId = env.AI_MODE === "mock" ? "mock" : env.AI_MODEL;
  const cacheKey = await recipeCacheKey({
    ...request,
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
  const limit = actor.kind === "user" ? env.QUOTA_USER : env.QUOTA_GUEST;
  const [used, usedGlobal] = await Promise.all([
    usageCount(db, personKey, now()),
    usageCount(db, GLOBAL_KEY, now()),
  ]);
  if (usedGlobal >= env.AI_DAILY_LIMIT) return fail("service_unavailable", 503);
  if (used >= limit) return fail("quota_exceeded", 429);

  const allowedIds = [...chosenFoods, ...pantry].map((f) => f.id) as [string, ...string[]];
  const schema = recipeOutputSchema(allowedIds, request.maxMinutes);
  const proteinIds = chosenFoods.filter((f) => f.role === "protein").map((f) => f.id);
  const model =
    deps.model?.({ chosen: chosenFoods, pantry }) ??
    languageModel(env, () =>
      mockModel(() => JSON.stringify(mockRecipe(request, chosenFoods, pantry)), "mock"),
    );

  let output: RecipeOutput | null = null;
  let previousError: string | undefined;
  let inputTokens = 0;
  let outputTokens = 0;
  const started = now();
  for (let attempt = 1; attempt <= 2 && !output; attempt++) {
    const { system, prompt } = buildRecipePrompt({
      request,
      chosen: chosenFoods,
      pantry,
      previousError,
    });
    try {
      const result = await generateText({
        model,
        system,
        prompt,
        output: Output.object({ schema }),
        maxRetries: 0,
        timeout: AI_TIMEOUT_MS,
      });
      inputTokens += result.usage.inputTokens ?? 0;
      outputTokens += result.usage.outputTokens ?? 0;
      const problem = recipeProblem(result.output, {
        proteinIds,
        servings: request.servings,
        foods: deps.foodIndex,
      });
      if (problem) previousError = problem;
      else output = result.output;
    } catch (err) {
      previousError = "a resposta não seguiu o formato pedido";
      log({
        msg: "recipe_attempt_error",
        attempt,
        name: err instanceof Error ? err.name : "unknown",
      });
    }
    log({
      msg: "recipe_attempt",
      attempt,
      valid: output !== null,
      problem: output ? null : previousError,
    });
  }
  const latencyMs = now() - started;

  // Segunda falha: erro amigável, não conta para a quota
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
        postWorkout: request.postWorkout,
        servings: request.servings,
        variant: request.variant,
        prepMinutes: output.prepMinutes,
        steps: output.steps.map((s) => s.trim()),
        proteinPerServingG: perServing,
        mealTargetG: request.mealTargetG,
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
