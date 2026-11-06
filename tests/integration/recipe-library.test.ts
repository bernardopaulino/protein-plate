import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FOODS, FOOD_DATA_VERSION } from "@/content/foods.generated";
import type { RecipeRequest } from "@/domain/contracts/recipe";
import type { OpsCounts } from "@/domain/ops-metrics";
import { isAllowed } from "@/domain/preferences";
import { FOOD_INDEX } from "@/features/catalog/catalog";
import { parseEnv, type AppEnv } from "@/lib/env";
import { usageCounters } from "@/server/db/schema";
import { generateRecipe, type Actor, type GenerateDeps } from "@/server/recipes/generate";
import { generateRecipeDay } from "@/server/recipes/generate-day";
import { proteinPerServing } from "@/server/recipes/recipe-rules";
import { recordRecipeHistory } from "@/server/services/account";
import { getRecipe } from "@/server/services/recipes";
import { createTestD1, createUser, type TestD1 } from "./d1";

let t: TestD1;
beforeAll(async () => {
  t = await createTestD1();
});
afterAll(async () => {
  await t?.dispose();
});
beforeEach(async () => {
  await t.db.delete(usageCounters);
});

const env: AppEnv = parseEnv({
  APP_ENV: "local",
  BETTER_AUTH_URL: "http://localhost:8787",
  BETTER_AUTH_SECRET: "test-secret-0123456789abcdef0123456789abcdef",
  AI_MODE: "mock",
  AI_MODEL: "claude-haiku-5-5",
  AI_DAILY_LIMIT: "100",
  QUOTA_USER: "15",
  IP_HASH_SECRET: "ip-hash-secret-0123456789abcdef0123456789",
});

function deps(overrides: Partial<GenerateDeps> = {}): GenerateDeps {
  return {
    db: t.db,
    env,
    foods: FOODS,
    foodIndex: FOOD_INDEX,
    foodDataVersion: FOOD_DATA_VERSION,
    rateLimit: async () => true,
    ...overrides,
  };
}

function person(userId: string, profile: Partial<Actor["profile"]> = {}): Actor {
  return {
    userId,
    profile: {
      dailyTargetG: 140,
      meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
      preWorkoutMeal: null,
      postWorkoutMeal: null,
      diet: "omnivore",
      allergies: [],
      equipment: ["stove", "microwave"],
      likedFoods: [],
      ...profile,
    },
  };
}

const request = (partial: Partial<RecipeRequest> = {}): RecipeRequest => ({
  foodIds: [],
  meal: "almoco",
  maxMinutes: 20,
  servings: 2,
  locale: "pt",
  variant: 1,
  ...partial,
});

/** Gera receitas novas (biblioteca desligada) com uma conta à parte, para encher a biblioteca. */
async function seedLibrary(foodIds: string[][], profile: Partial<Actor["profile"]> = {}) {
  const author = person(await createUser(t.db), profile);
  const ids: string[] = [];
  for (const foods of foodIds) {
    const result = await generateRecipe(
      request({ foodIds: foods }),
      author,
      deps({ library: false }),
    );
    if (!result.ok) throw new Error(result.code);
    ids.push(result.id);
  }
  await t.db.delete(usageCounters);
  return ids;
}

function counter() {
  const totals: Record<string, number> = {};
  const count = (metrics: OpsCounts) => {
    for (const [metric, n] of Object.entries(metrics)) {
      if (n) totals[metric] = (totals[metric] ?? 0) + n;
    }
  };
  return { totals, count };
}

describe("biblioteca de receitas", () => {
  it("serve a outra pessoa uma receita já gerada, reajustada, sem chamar o modelo nem gastar quota", async () => {
    const [sourceId] = await seedLibrary([["peito-frango", "arroz-branco", "brocolos"]]);
    const me = person(await createUser(t.db), { dailyTargetG: 120 });
    const { totals, count } = counter();
    const result = await generateRecipe(
      request({ servings: 3, foodIds: ["peito-frango"] }),
      me,
      deps({
        count,
        model: () => {
          throw new Error("não devia chamar o modelo");
        },
      }),
    );
    expect(result).toMatchObject({ ok: true, cached: true, source: "library" });
    if (!result.ok) return;
    expect(totals).toEqual({ "recipes.ok.library": 1 });
    expect(await t.db.select().from(usageCounters)).toEqual([]);

    const copy = (await getRecipe(t.db, result.id))!;
    const source = (await getRecipe(t.db, sourceId!))!;
    expect(copy.title).toBe(source.title);
    expect(copy.steps).toEqual(source.steps);
    expect(copy.servings).toBe(3);
    // A proteína é calculada pela app, a menos de 20% da meta desta pessoa
    const protein = proteinPerServing(copy.ingredients, 3, FOOD_INDEX);
    expect(copy.proteinPerServingG).toBeCloseTo(protein, 9);
    expect(Math.abs(protein - copy.mealTargetG)).toBeLessThanOrEqual(copy.mealTargetG * 0.2);
  });

  it("nunca serve uma receita com alimentos que as restrições da pessoa excluem", async () => {
    await seedLibrary([
      ["peito-frango", "arroz-branco"],
      ["atum-lata-natural", "batata"],
      ["ovo", "pao-integral"],
    ]);
    const vegan = person(await createUser(t.db), { diet: "vegan" });
    for (let i = 0; i < 4; i++) {
      const result = await generateRecipe(request(), vegan, deps({ random: () => i / 4 }));
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      await recordRecipeHistory(t.db, vegan.userId, result.id);
      for (const ingredient of (await getRecipe(t.db, result.id))!.ingredients) {
        const food = FOOD_INDEX.get(ingredient.foodId)!;
        expect(isAllowed(food, { diet: "vegan", allergies: [] }), food.id).toBe(true);
      }
    }
  });

  it("'Gerar outra' traz outra receita da biblioteca e só depois vai ao modelo", async () => {
    await seedLibrary([
      ["peito-frango", "arroz-branco", "brocolos"],
      ["peito-frango", "batata", "cenoura"],
    ]);
    const me = person(await createUser(t.db));
    const sources = new Set<string>();
    for (let variant = 1; variant <= 3; variant++) {
      const result = await generateRecipe(
        request({ foodIds: ["peito-frango"], variant }),
        me,
        deps({ random: () => 0.3 }),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      await recordRecipeHistory(t.db, me.userId, result.id);
      if (result.source === "library") {
        const [row] = await t.d1
          .prepare("SELECT source_recipe_id AS s FROM recipes WHERE id = ?")
          .bind(result.id)
          .all<{ s: string }>()
          .then((r) => r.results);
        expect(sources.has(row!.s)).toBe(false);
        sources.add(row!.s);
      }
    }
    expect(sources.size).toBeGreaterThanOrEqual(2);
  });

  it("acima do limite global, a biblioteca continua a servir", async () => {
    await seedLibrary([["peito-frango", "arroz-branco", "brocolos"]]);
    const me = person(await createUser(t.db));
    const empty = { ...env, AI_DAILY_LIMIT: 1 };
    await t.db.insert(usageCounters).values({ keyHash: "global", day: today(), count: 1 });
    const result = await generateRecipe(
      request({ foodIds: ["peito-frango"], servings: 1 }),
      me,
      deps({ env: empty }),
    );
    expect(result).toMatchObject({ ok: true, source: "library" });
  });

  it("dia completo: as refeições da biblioteca não gastam quota e não repetem a proteína", async () => {
    const me = person(await createUser(t.db), { likedFoods: [] });
    // Um primeiro dia enche a biblioteca (receitas novas)
    const author = person(await createUser(t.db), { likedFoods: [] });
    const first = await generateRecipeDay(
      { maxMinutes: 20, servings: 1, locale: "pt" },
      author,
      deps({ library: false, random: () => 0.1 }),
    );
    expect(first.ok).toBe(true);
    await t.db.delete(usageCounters);

    const result = await generateRecipeDay(
      { maxMinutes: 20, servings: 1, locale: "pt" },
      me,
      deps({ random: () => 0.9 }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipes.every((r) => r.ok)).toBe(true);
    expect(result.recipes.some((r) => r.ok && r.cached)).toBe(true);
    const saved = await Promise.all(
      result.recipes.map((r) => (r.ok ? getRecipe(t.db, r.id) : null)),
    );
    const proteins = saved.flatMap((r) =>
      r!.ingredients
        .filter((i) => FOOD_INDEX.get(i.foodId)!.role === "protein")
        .map((i) => i.foodId),
    );
    expect(new Set(proteins).size).toBe(proteins.length);
    // Só as receitas novas contam na quota
    const fresh = result.recipes.filter((r) => r.ok && !r.cached).length;
    const [global] = await t.d1
      .prepare("SELECT count FROM usage_counters WHERE key_hash = 'global'")
      .all<{ count: number }>()
      .then((r) => r.results);
    expect(global?.count ?? 0).toBe(fresh);
  });
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
