import type { LanguageModel } from "ai";
import { eq } from "drizzle-orm";
import type { RecipeErrorCode, RecipeRequest } from "@/domain/contracts/recipe";
import type { Food, FoodIndex } from "@/domain/food";
import { mealTarget } from "@/domain/meals";
import { RECIPE_SLOW_MS, once, recipeOutcomeMetric, type OpsCounts } from "@/domain/ops-metrics";
import { allowedFoods, isAllowed, type Equipment, type Restrictions } from "@/domain/preferences";
import { recipeBase } from "@/domain/recipe-base";
import { pickLibraryRecipe } from "@/domain/recipe-library";
import type { AppEnv } from "@/lib/env";
import { languageModel, mockModel } from "../ai/model";
import { PROMPT_VERSION, type RecipePromptInput } from "../ai/prompts/recipe.v5";
import type { Db } from "../db/client-core";
import { recipeIngredients, recipes } from "../db/schema";
import { restrictionsOf, type Profile } from "../services/account";
import { GLOBAL_KEY, countUsage, quotaKey, usageCount } from "../services/quota";
import { libraryCandidates, seenLibraryIds, storeLibraryCopy } from "./library";
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

/** De onde veio a receita: o modelo, a cache (o mesmo pedido) ou a biblioteca (outra, reajustada). */
export type RecipeSource = "model" | "cache" | "library";

export type GenerateFailure = { ok: false; code: RecipeErrorCode; status: number };
export type GenerateResult =
  { ok: true; id: string; cached: boolean; source: RecipeSource } | GenerateFailure;

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
  /** Procurar na biblioteca antes do modelo (por defeito, sim; os testes do modelo desligam-na). */
  library?: boolean;
  now?: () => number;
  /** Para variar a base quando a pessoa não escolhe alimentos (os testes fixam-na). */
  random?: () => number;
  log?: (event: Record<string, unknown>) => void;
  /** Contadores do funcionamento (resultado, novas tentativas, lentas); por defeito, nenhum. */
  count?: (metrics: OpsCounts) => void;
}

/** Um pedido validado e resolvido: a base, a despensa permitida, o contexto do prompt. */
export interface PreparedRecipe {
  /** O pedido com a base completa (o que vai para o modelo e para a cache). */
  request: RecipeRequest;
  context: RecipePromptInput["context"];
  chosen: Food[];
  pantry: Food[];
  /** Só o que a pessoa escolheu (a biblioteca tem de o ter todo). */
  pickedIds: string[];
  restrictions: Restrictions;
  equipment: readonly Equipment[];
  cacheKey: string;
}

const fail = (code: RecipeErrorCode, status: number): GenerateFailure => ({
  ok: false,
  code,
  status,
});

/**
 * Pipeline das receitas (secção 6): validação (refeição da pessoa, alimentos permitidos) → base
 * completada pela app → rate limiting → cache → biblioteca → quotas → modelo (uma nova tentativa
 * com o erro descrito) → proteína calculada pela app → D1. Conta o resultado de cada pedido
 * (`recipes.ok.*` ou `recipes.error.<código>`).
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
  const prepared = await prepareRecipe(input, actor, deps);
  if (!prepared.ok) return prepared;

  const personKey = await personQuotaKey(actor, deps.env, now());
  if (!(await deps.rateLimit(personKey))) return fail("rate_limited", 429);

  const ready = await fromCacheOrLibrary(prepared.value, actor, deps);
  if (ready) return ready;

  // Quotas: por pessoa e global (acima do global, só cache e biblioteca)
  const [used, usedGlobal] = await Promise.all([
    usageCount(deps.db, personKey, now()),
    usageCount(deps.db, GLOBAL_KEY, now()),
  ]);
  if (usedGlobal >= deps.env.AI_DAILY_LIMIT) return fail("service_unavailable", 503);
  if (used >= deps.env.QUOTA_USER) return fail("quota_exceeded", 429);

  return fromModel(prepared.value, personKey, deps, count);
}

export function personQuotaKey(actor: Actor, env: AppEnv, now: number): Promise<string> {
  return quotaKey(env.IP_HASH_SECRET, `user:${actor.userId}`, now);
}

/**
 * Valida o pedido e resolve a base (secção 6). `base`: a base já escolhida pelo dia completo (a
 * pessoa não escolheu nada; a biblioteca não a exige, o modelo usa-a).
 */
export async function prepareRecipe(
  input: RecipeRequest,
  actor: Actor,
  deps: GenerateDeps,
  base?: readonly Food[],
): Promise<{ ok: true; value: PreparedRecipe } | GenerateFailure> {
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
  const chosen =
    base && base.length > 0
      ? [...base]
      : recipeBase({
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
          canBoil: equipment.includes("stove") || equipment.includes("microwave"),
          targetG,
        });
  if (!chosen.some((f) => f.role === "protein")) return fail("invalid_request", 400);
  const request: RecipeRequest = { ...input, foodIds: chosen.map((f) => f.id) };
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
  const cacheKey = await recipeCacheKey({
    ...request,
    ...context,
    pantryIds: pantry.map((f) => f.id),
    promptVersion: PROMPT_VERSION,
    model: modelIdOf(deps.env),
    foodDataVersion: deps.foodDataVersion,
  });
  return {
    ok: true,
    value: {
      request,
      context,
      chosen,
      pantry,
      pickedIds: input.foodIds,
      restrictions,
      equipment,
      cacheKey,
    },
  };
}

const modelIdOf = (env: AppEnv) => (env.AI_MODE === "mock" ? "mock" : env.AI_MODEL);

/**
 * Sem custo: o mesmo pedido já gerado (cache) ou uma receita da biblioteca que sirva a pessoa,
 * reajustada às doses e à proteína dela. `avoid`: fontes de proteína a evitar (dia completo).
 */
export async function fromCacheOrLibrary(
  prepared: PreparedRecipe,
  actor: Actor,
  deps: GenerateDeps,
  avoid?: ReadonlySet<string>,
): Promise<(GenerateResult & { ok: true; proteinIds?: string[] }) | null> {
  const log = deps.log ?? (() => {});
  const { db } = deps;
  const [cached] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.cacheKey, prepared.cacheKey));
  if (cached) {
    log({ msg: "recipe_cache_hit" });
    return { ok: true, id: cached.id, cached: true, source: "cache" };
  }
  if (deps.library === false) return null;

  const { request, context } = prepared;
  const [candidates, seen] = await Promise.all([
    libraryCandidates(db, {
      locale: request.locale,
      meal: request.meal,
      foodDataVersion: deps.foodDataVersion,
      preWorkout: context.preWorkout,
      postWorkout: context.postWorkout,
      maxMinutes: request.maxMinutes,
    }),
    seenLibraryIds(db, actor.userId),
  ]);
  const pick = pickLibraryRecipe(
    candidates,
    {
      meal: request.meal,
      locale: request.locale,
      preWorkout: context.preWorkout,
      postWorkout: context.postWorkout,
      maxMinutes: request.maxMinutes,
      servings: request.servings,
      equipment: prepared.equipment,
      targetG: context.mealTargetG,
      restrictions: prepared.restrictions,
      chosenIds: prepared.pickedIds,
      liked: new Set(actor.profile.likedFoods),
      avoid,
      seen,
      foods: deps.foodIndex,
    },
    deps.random,
  );
  if (!pick) return null;
  const id = await storeLibraryCopy(db, {
    id: shortId(),
    cacheKey: prepared.cacheKey,
    pick,
    servings: request.servings,
    variant: request.variant,
    mealTargetG: context.mealTargetG,
    customTarget: context.customTarget ?? false,
    createdAt: (deps.now ?? Date.now)(),
  });
  if (!id) return null;
  log({ msg: "recipe_library_hit", candidates: candidates.length });
  const proteinIds = pick.ingredients
    .filter((i) => deps.foodIndex.get(i.foodId)?.role === "protein")
    .map((i) => i.foodId);
  return { ok: true, id, cached: true, source: "library", proteinIds };
}

/** Uma receita nova do modelo (as quotas já foram verificadas por quem chama). */
export async function fromModel(
  prepared: PreparedRecipe,
  personKey: string,
  deps: GenerateDeps,
  count: (metrics: OpsCounts) => void,
): Promise<GenerateResult> {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? (() => {});
  const { db, env } = deps;
  const { request, context, chosen, pantry, cacheKey } = prepared;
  const modelId = modelIdOf(env);

  const model =
    deps.model?.({ chosen, pantry }) ??
    languageModel(env, () =>
      mockModel(() => JSON.stringify(mockRecipe(request, chosen, pantry)), "mock"),
    );

  const { output, attempts, retrySkipped, inputTokens, outputTokens, latencyMs } =
    await callRecipeModel({
      model,
      prompt: { request, context, chosen, pantry },
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
        preWorkout: context.preWorkout,
        servings: request.servings,
        variant: request.variant,
        prepMinutes: output.prepMinutes,
        steps: output.steps.map((s) => s.trim()),
        proteinPerServingG: perServing,
        mealTargetG: context.mealTargetG,
        customTarget: context.customTarget ?? false,
        equipment: [...context.equipment],
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
    if (existing) return { ok: true, id: existing.id, cached: true, source: "cache" };
    throw err;
  }
  await countUsage(db, [personKey, GLOBAL_KEY], now());
  log({ msg: "recipe_generated", model: modelId, latencyMs, inputTokens, outputTokens });
  return { ok: true, id, cached: false, source: "model" };
}
