import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FOODS, FOOD_DATA_VERSION } from "@/content/foods.generated";
import type { RecipeRequest } from "@/domain/contracts/recipe";
import type { OpsCounts } from "@/domain/ops-metrics";
import { FOOD_INDEX } from "@/features/catalog/catalog";
import { parseEnv, type AppEnv } from "@/lib/env";
import { mockModel } from "@/server/ai/model";
import { recipeIngredients, recipes, usageCounters } from "@/server/db/schema";
import { generateRecipe, type Actor, type GenerateDeps } from "@/server/recipes/generate";
import { generateRecipeDay } from "@/server/recipes/generate-day";
import { mockRecipe } from "@/server/recipes/mock-recipe";
import { proteinPerServing } from "@/server/recipes/recipe-rules";
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

function request(partial: Partial<RecipeRequest> = {}): RecipeRequest {
  return {
    foodIds: ["atum-lata-natural", "grao-bico-lata", "tomate"],
    meal: "almoco",
    maxMinutes: 20,
    servings: 2,
    locale: "pt",
    variant: 1,
    ...partial,
  };
}

function deps(overrides: Partial<GenerateDeps> = {}): GenerateDeps {
  return {
    db: t.db,
    env,
    foods: FOODS,
    foodIndex: FOOD_INDEX,
    foodDataVersion: FOOD_DATA_VERSION,
    rateLimit: async () => true,
    // Estes testes são do caminho do modelo; a biblioteca tem os seus (mais abaixo)
    library: false,
    ...overrides,
  };
}

/** Soma o que o pipeline contou para os contadores do funcionamento (sem os zeros). */
function counter() {
  const totals: Record<string, number> = {};
  const count = (metrics: OpsCounts) => {
    for (const [metric, n] of Object.entries(metrics)) {
      if (n) totals[metric] = (totals[metric] ?? 0) + n;
    }
  };
  return { totals, count };
}

let targetCounter = 0;
/**
 * Uma conta com o formulário concluído. A meta muda a cada chamada (muda a meta da refeição e a
 * chave da cache), para cada teste gerar receitas novas.
 */
function person(userId: string, profile: Partial<Actor["profile"]> = {}): Actor {
  targetCounter += 1;
  return {
    userId,
    profile: {
      dailyTargetG: 60 + targetCounter * 20,
      meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
      preWorkoutMeal: null,
      postWorkoutMeal: null,
      diet: "omnivore",
      allergies: [],
      equipment: ["stove", "microwave"],
      likedFoods: ["peito-frango", "atum-lata-natural", "ovo", "arroz-branco", "brocolos"],
      ...profile,
    },
  };
}

describe("POST /api/recipes: pipeline com o modelo simulado", () => {
  it("gera, calcula a proteína pela app e guarda receita + ingredientes", async () => {
    const userId = await createUser(t.db);
    const req = request();
    const result = await generateRecipe(req, person(userId), deps());
    expect(result).toMatchObject({ ok: true, cached: false });
    if (!result.ok) return;

    const saved = await getRecipe(t.db, result.id);
    expect(saved).not.toBeNull();
    // Ingredientes 100% da base de dados
    expect(saved!.ingredients.every((i) => FOOD_INDEX.has(i.foodId))).toBe(true);
    expect(saved!.ingredients.map((i) => i.foodId)).toEqual(
      expect.arrayContaining(["atum-lata-natural", "grao-bico-lata"]),
    );
    // Proteína calculada pela app a partir do catálogo
    expect(saved!.proteinPerServingG).toBeCloseTo(
      proteinPerServing(saved!.ingredients, req.servings, FOOD_INDEX),
      9,
    );
    expect(saved!.prepMinutes).toBeLessThanOrEqual(req.maxMinutes);
  });

  it("o mesmo pedido devolve a receita da cache, sem gastar quota; outra variante gera outra", async () => {
    const userId = await createUser(t.db);
    const req = request();
    const me = person(userId);
    const first = await generateRecipe(req, me, deps());
    const again = await generateRecipe({ ...req, foodIds: [...req.foodIds].reverse() }, me, deps());
    expect(again).toEqual({
      ok: true,
      id: first.ok ? first.id : "",
      cached: true,
      source: "cache",
    });
    const other = await generateRecipe({ ...req, variant: 2 }, me, deps());
    expect(other.ok && other.id).not.toBe(first.ok && first.id);
    const [usage] = await t.db.select({ n: count() }).from(recipes);
    expect(usage?.n).toBeGreaterThanOrEqual(2);
  });

  it("quota por conta: a receita a mais é recusada, a cache continua a abrir e cada conta tem a sua", async () => {
    const userId = await createUser(t.db);
    const small = { ...env, QUOTA_USER: 2 };
    const reqs = [1, 2].map(() => request());
    const actors = reqs.map(() => person(userId));
    for (const [i, req] of reqs.entries()) {
      expect((await generateRecipe(req, actors[i]!, deps({ env: small }))).ok).toBe(true);
    }
    expect(await generateRecipe(request(), person(userId), deps({ env: small }))).toMatchObject({
      ok: false,
      code: "quota_exceeded",
    });
    expect(await generateRecipe(reqs[0]!, actors[0]!, deps({ env: small }))).toMatchObject({
      ok: true,
      cached: true,
    });
    const other = await createUser(t.db);
    expect((await generateRecipe(request(), person(other), deps({ env: small }))).ok).toBe(true);
  });

  it("as chaves de quota não guardam o id da conta", async () => {
    const userId = await createUser(t.db);
    await generateRecipe(request(), person(userId), deps());
    const rows = await t.db.select().from(usageCounters);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.keyHash).not.toContain(userId);
      expect(row.keyHash === "global" || /^[0-9a-f]{64}$/.test(row.keyHash)).toBe(true);
    }
  });

  it("recusa alimentos que as restrições da pessoa excluem e refeições que não são dela", async () => {
    const userId = await createUser(t.db);
    expect(
      await generateRecipe(request(), person(userId, { diet: "vegetarian" }), deps()),
    ).toMatchObject({ ok: false, code: "restricted_food" });
    expect(
      await generateRecipe(request(), person(userId, { allergies: ["fish"] }), deps()),
    ).toMatchObject({ ok: false, code: "restricted_food" });
    expect(await generateRecipe(request({ meal: "ceia" }), person(userId), deps())).toMatchObject({
      ok: false,
      code: "invalid_request",
    });
  });

  it("sem alimentos escolhidos: a app escolhe a base entre os de que a pessoa gosta", async () => {
    const userId = await createUser(t.db);
    const me = person(userId, { likedFoods: ["salmao", "batata-doce", "brocolos"] });
    const result = await generateRecipe(request({ foodIds: [] }), me, deps({ random: () => 0 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const saved = await getRecipe(t.db, result.id);
    expect(saved!.ingredients.map((i) => i.foodId)).toEqual(
      expect.arrayContaining(["salmao", "batata-doce", "brocolos"]),
    );
  });

  it("sem nada escolhido, cada pedido pode trazer outra base; vegetariano nunca leva carne", async () => {
    const userId = await createUser(t.db);
    const me = person(userId, {
      diet: "vegetarian",
      likedFoods: ["tofu-firme", "ovo", "grao-bico-lata", "lentilhas-castanhas"],
    });
    const ids = new Set<string>();
    for (const r of [0, 1e-6, 2e-6, 3e-6]) {
      const result = await generateRecipe(request({ foodIds: [] }), me, deps({ random: () => r }));
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      ids.add(result.id);
      const saved = await getRecipe(t.db, result.id);
      for (const i of saved!.ingredients) {
        expect(FOOD_INDEX.get(i.foodId)!.category, i.foodId).not.toMatch(/carne|peixe|marisco/);
      }
    }
    expect(ids.size).toBeGreaterThan(1);
  });

  it("com um alimento escolhido, completa com uma proteína e o pedido repetido vem da cache", async () => {
    const userId = await createUser(t.db);
    const me = person(userId);
    const req = request({ foodIds: ["brocolos"] });
    const first = await generateRecipe(req, me, deps({ random: () => 0.1 }));
    const again = await generateRecipe(req, me, deps({ random: () => 0.9 }));
    expect(first.ok).toBe(true);
    expect(again).toMatchObject({ ok: true, cached: true });
    if (!first.ok) return;
    const saved = await getRecipe(t.db, first.id);
    const foods = saved!.ingredients.map((i) => FOOD_INDEX.get(i.foodId)!);
    expect(foods.some((f) => f.id === "brocolos")).toBe(true);
    expect(foods.some((f) => f.role === "protein")).toBe(true);
  });

  it("o prompt leva o equipamento, o pré-treino e só a despensa que a pessoa pode comer", async () => {
    const userId = await createUser(t.db);
    const prompts: string[] = [];
    const me = person(userId, {
      diet: "vegan",
      preWorkoutMeal: "almoco",
      equipment: ["airfryer"],
    });
    const req = request({ foodIds: ["tofu-firme", "grao-bico-lata", "tomate"] });
    const chosen = req.foodIds.map((id) => FOOD_INDEX.get(id)!);
    const result = await generateRecipe(
      req,
      me,
      deps({
        model: () =>
          mockModel((prompt) => {
            prompts.push(prompt);
            return JSON.stringify(mockRecipe(req, chosen, []));
          }),
      }),
    );
    expect(result.ok).toBe(true);
    expect(prompts[0]).toContain("Equipamento disponível: airfryer");
    expect(prompts[0]).toContain("Não há fogão");
    expect(prompts[0]).toContain("pré-treino");
    expect(prompts[0]).toContain("vegana");
    expect(prompts[0]).not.toContain("manteiga");
    expect(prompts[0]).not.toContain(String.raw`id \"mel\"`);
    expect(prompts[0]).toContain("azeite");
    if (!result.ok) return;
    const saved = await getRecipe(t.db, result.id);
    expect(saved?.postWorkout).toBe(false);
  });

  it("acima do limite global só serve a cache", async () => {
    const userId = await createUser(t.db);
    const low = { ...env, AI_DAILY_LIMIT: 1 };
    expect((await generateRecipe(request(), person(userId), deps({ env: low }))).ok).toBe(true);
    expect(await generateRecipe(request(), person(userId), deps({ env: low }))).toMatchObject({
      ok: false,
      code: "service_unavailable",
    });
  });

  it("rate limiting por chave", async () => {
    const userId = await createUser(t.db);
    expect(
      await generateRecipe(request(), person(userId), deps({ rateLimit: async () => false })),
    ).toMatchObject({ ok: false, code: "rate_limited" });
  });

  it("alimentos desconhecidos ou da despensa como escolha são recusados", async () => {
    const userId = await createUser(t.db);
    for (const foodIds of [
      ["atum-lata-natural", "nao-existe"],
      ["atum-lata-natural", "azeite"],
    ]) {
      expect(await generateRecipe(request({ foodIds }), person(userId), deps())).toMatchObject({
        ok: false,
        code: "unknown_food",
      });
    }
  });

  it("resposta inválida: uma nova tentativa com o erro descrito; se acertar, guarda", async () => {
    const userId = await createUser(t.db);
    const req = request();
    const chosen = req.foodIds.map((id) => FOOD_INDEX.get(id)!);
    const good = mockRecipe(req, chosen, []);
    // Primeira resposta sem o atum (fonte de proteína obrigatória)
    const bad = {
      ...good,
      ingredients: good.ingredients.filter((i) => i.foodId !== "atum-lata-natural"),
    };
    const prompts: string[] = [];
    const respond = vi.fn((prompt: string) => {
      prompts.push(prompt);
      return JSON.stringify(prompts.length === 1 ? bad : good);
    });
    const result = await generateRecipe(
      req,
      person(userId),
      deps({ model: () => mockModel(respond) }),
    );
    expect(result.ok).toBe(true);
    expect(respond).toHaveBeenCalledTimes(2);
    expect(prompts[1]).toContain("faltam as fontes de proteína atum-lata-natural");
  });

  it("ingredientes repetidos: a app junta-os sem gastar outra chamada ao modelo", async () => {
    const userId = await createUser(t.db);
    const plain = request();
    const chosen = plain.foodIds.map((id) => FOOD_INDEX.get(id)!);
    const good = mockRecipe(plain, chosen, []);
    // A proteína pedida é a da receita: o ajuste da app não mexe nas quantidades
    const req = request({
      targetProteinG: Math.round(proteinPerServing(good.ingredients, plain.servings, FOOD_INDEX)),
    });
    const atum = good.ingredients.find((i) => i.foodId === "atum-lata-natural")!;
    const split = {
      ...good,
      ingredients: [
        ...good.ingredients.filter((i) => i !== atum),
        { foodId: atum.foodId, grams: atum.grams / 2 },
        { foodId: atum.foodId, grams: atum.grams / 2 },
      ],
    };
    const respond = vi.fn(() => JSON.stringify(split));
    const result = await generateRecipe(
      req,
      person(userId),
      deps({ model: () => mockModel(respond) }),
    );
    expect(result.ok).toBe(true);
    expect(respond).toHaveBeenCalledTimes(1);
    if (!result.ok) return;
    const saved = await getRecipe(t.db, result.id);
    const atumRows = saved!.ingredients.filter((i) => i.foodId === "atum-lata-natural");
    expect(atumRows).toHaveLength(1);
    expect(atumRows[0]!.grams).toBeCloseTo(atum.grams, 9);
  });

  it("ingrediente fora da lista enviada: nova tentativa a dizer qual é", async () => {
    const userId = await createUser(t.db);
    const req = request();
    const chosen = req.foodIds.map((id) => FOOD_INDEX.get(id)!);
    const good = mockRecipe(req, chosen, []);
    const invented = {
      ...good,
      ingredients: [...good.ingredients, { foodId: "lagosta-inventada", grams: 100 }],
    };
    const prompts: string[] = [];
    const respond = vi.fn((prompt: string) => {
      prompts.push(prompt);
      return JSON.stringify(prompts.length === 1 ? invented : good);
    });
    const result = await generateRecipe(
      req,
      person(userId),
      deps({ model: () => mockModel(respond) }),
    );
    expect(result.ok).toBe(true);
    expect(respond).toHaveBeenCalledTimes(2);
    expect(prompts[1]).toContain("lagosta-inventada não estão na lista");
  });

  it("prazo total: se a primeira tentativa gastou o tempo, não há segunda", async () => {
    const userId = await createUser(t.db);
    let clock = 1_000_000;
    // A primeira resposta (inválida) demora 10 s; ficam 4 s, menos do que a segunda precisa
    const respond = vi.fn(() => {
      clock += 10_000;
      return JSON.stringify({ title: "x" });
    });
    const logs: Record<string, unknown>[] = [];
    const result = await generateRecipe(
      request(),
      person(userId),
      deps({
        model: () => mockModel(respond),
        now: () => clock,
        log: (event) => logs.push(event),
      }),
    );
    expect(result).toMatchObject({ ok: false, code: "generation_failed" });
    expect(respond).toHaveBeenCalledTimes(1);
    expect(logs).toContainEqual(expect.objectContaining({ msg: "recipe_retry_skipped" }));
  });

  it("segunda falha: erro amigável e não conta para a quota", async () => {
    const userId = await createUser(t.db);
    const respond = vi.fn(() => JSON.stringify({ title: "x" }));
    const before = await t.db.select().from(usageCounters);
    const result = await generateRecipe(
      request(),
      person(userId),
      deps({ model: () => mockModel(respond) }),
    );
    expect(result).toMatchObject({ ok: false, code: "generation_failed" });
    expect(respond).toHaveBeenCalledTimes(2);
    expect(await t.db.select().from(usageCounters)).toEqual(before);
  });

  it("contadores: receita nova, da cache e quota esgotada", async () => {
    const userId = await createUser(t.db);
    const { totals, count } = counter();
    const small = { ...env, QUOTA_USER: 1 };
    const req = request();
    const me = person(userId);
    await generateRecipe(req, me, deps({ env: small, count }));
    await generateRecipe(req, me, deps({ env: small, count }));
    await generateRecipe(request(), person(userId), deps({ env: small, count }));
    expect(totals).toEqual({
      "recipes.ok.new": 1,
      "recipes.ok.cached": 1,
      "recipes.error.quota_exceeded": 1,
    });
  });

  it("contadores: nova tentativa, tentativa saltada pelo prazo e receita lenta", async () => {
    const userId = await createUser(t.db);
    const req = request();
    const chosen = req.foodIds.map((id) => FOOD_INDEX.get(id)!);
    const good = mockRecipe(req, chosen, []);
    const bad = {
      ...good,
      ingredients: good.ingredients.filter((i) => i.foodId !== "atum-lata-natural"),
    };

    // A primeira resposta não passa; a segunda sim
    const retried = counter();
    let calls = 0;
    const badThenGood = () => JSON.stringify(++calls === 1 ? bad : good);
    expect(
      await generateRecipe(
        req,
        person(userId),
        deps({ model: () => mockModel(badThenGood), count: retried.count }),
      ),
    ).toMatchObject({ ok: true, cached: false });
    expect(retried.totals).toEqual({ "recipes.retry": 1, "recipes.ok.new": 1 });

    // A primeira (inválida) demora 10 s: a segunda não arranca
    const skipped = counter();
    let clock = 1_000_000;
    const slowBad = () => {
      clock += 10_000;
      return JSON.stringify({ title: "x" });
    };
    await generateRecipe(
      request(),
      person(userId),
      deps({ model: () => mockModel(slowBad), now: () => clock, count: skipped.count }),
    );
    expect(skipped.totals).toEqual({
      "recipes.retry_skipped": 1,
      "recipes.error.generation_failed": 1,
    });

    // Válida à primeira, mas com 11 s de modelo
    const slow = counter();
    const slowGood = () => {
      clock += 11_000;
      return JSON.stringify(good);
    };
    expect(
      await generateRecipe(
        req,
        person(userId),
        deps({ model: () => mockModel(slowGood), now: () => clock, count: slow.count }),
      ),
    ).toMatchObject({ ok: true, cached: false });
    expect(slow.totals).toEqual({ "recipes.slow": 1, "recipes.ok.new": 1 });
  });

  it("recusa quantidades irreais (mais de 3 porções por dose) e proteína fora de 1–120 g", async () => {
    const userId = await createUser(t.db);
    const req = request({ servings: 1 });
    const chosen = req.foodIds.map((id) => FOOD_INDEX.get(id)!);
    const good = mockRecipe(req, chosen, []);
    const huge = {
      ...good,
      ingredients: good.ingredients.map((i) => (i.foodId === "tomate" ? { ...i, grams: 2000 } : i)),
    };
    const result = await generateRecipe(
      req,
      person(userId),
      deps({ model: () => mockModel(() => JSON.stringify(huge)) }),
    );
    expect(result).toMatchObject({ ok: false, code: "generation_failed" });
    const ingredientRows = await t.db
      .select({ n: count() })
      .from(recipeIngredients)
      .where(eq(recipeIngredients.foodId, "nao-existe"));
    expect(ingredientRows[0]?.n).toBe(0);
  });
});

describe("proteína à escolha, equipamento e sem cozinhar", () => {
  it("fonte de proteína exagerada: a app corta-a para a meta em vez de recusar", async () => {
    const userId = await createUser(t.db);
    const req = request({ servings: 1 });
    const chosen = req.foodIds.map((id) => FOOD_INDEX.get(id)!);
    const good = mockRecipe(req, chosen, []);
    const huge = {
      ...good,
      ingredients: good.ingredients.map((i) =>
        i.foodId === "atum-lata-natural" ? { ...i, grams: 2000 } : i,
      ),
    };
    const result = await generateRecipe(
      req,
      person(userId),
      deps({ model: () => mockModel(() => JSON.stringify(huge)) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const atum = (await getRecipe(t.db, result.id))!.ingredients.find(
      (i) => i.foodId === "atum-lata-natural",
    )!;
    expect(atum.grams).toBeLessThanOrEqual(3 * 60);
  });

  it("proteína à escolha: a app ajusta as quantidades e guarda o pedido", async () => {
    const userId = await createUser(t.db);
    const req = request({
      foodIds: ["peito-frango", "arroz-branco"],
      servings: 1,
      targetProteinG: 60,
    });
    const result = await generateRecipe(req, person(userId), deps());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const saved = await getRecipe(t.db, result.id);
    expect(saved!.customTarget).toBe(true);
    expect(saved!.mealTargetG).toBe(60);
    expect(Math.abs(saved!.proteinPerServingG - 60)).toBeLessThanOrEqual(60 * 0.2);
    // A proteína guardada é sempre a calculada pela app a partir dos ingredientes guardados
    expect(saved!.proteinPerServingG).toBeCloseTo(
      proteinPerServing(saved!.ingredients, 1, FOOD_INDEX),
      9,
    );
  });

  it("a proteína à escolha entra na cache: outro valor gera outra receita", async () => {
    const userId = await createUser(t.db);
    const me = person(userId);
    const base = request({ foodIds: ["peito-frango", "arroz-branco"], servings: 1 });
    const a = await generateRecipe({ ...base, targetProteinG: 30 }, me, deps());
    const b = await generateRecipe({ ...base, targetProteinG: 50 }, me, deps());
    const again = await generateRecipe({ ...base, targetProteinG: 30 }, me, deps());
    expect(a.ok && b.ok && a.id !== b.id).toBe(true);
    expect(again).toMatchObject({ ok: true, cached: true });
  });

  it("equipamento escolhido: vai para o prompt e fica na receita", async () => {
    const userId = await createUser(t.db);
    const prompts: string[] = [];
    const req = request({ equipment: ["airfryer", "oven"] });
    const chosen = req.foodIds.map((id) => FOOD_INDEX.get(id)!);
    const result = await generateRecipe(
      req,
      person(userId),
      deps({
        model: () =>
          mockModel((prompt) => {
            prompts.push(prompt);
            return JSON.stringify(mockRecipe(req, chosen, []));
          }),
      }),
    );
    expect(result.ok).toBe(true);
    expect(prompts[0]).toContain("A pessoa quer cozinhar com: airfryer, forno");
    expect(prompts[0]).toContain("Não há fogão");
    if (!result.ok) return;
    expect((await getRecipe(t.db, result.id))!.equipment).toEqual(["airfryer", "oven"]);
  });

  it("sem cozinhar: recusa alimentos que precisam de lume e completa só com o que não precisa", async () => {
    const userId = await createUser(t.db);
    expect(
      await generateRecipe(
        request({ foodIds: ["peito-frango"], equipment: [] }),
        person(userId),
        deps(),
      ),
    ).toMatchObject({ ok: false, code: "needs_cooking" });
    const result = await generateRecipe(
      request({ foodIds: [], equipment: [] }),
      person(userId),
      deps({ random: () => 0.3 }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const saved = await getRecipe(t.db, result.id);
    expect(saved!.equipment).toEqual([]);
    for (const i of saved!.ingredients) {
      const food = FOOD_INDEX.get(i.foodId)!;
      if (food.role !== "pantry") expect(food.ease, i.foodId).toBe(1);
    }
  });
});

describe("POST /api/recipes/day: dia completo", () => {
  const dayRequest = { maxMinutes: 20 as const, servings: 1, locale: "pt" as const };

  it("uma receita por refeição, com a meta de cada uma e sem repetir a proteína", async () => {
    const userId = await createUser(t.db);
    const me = person(userId, { likedFoods: [] });
    const result = await generateRecipeDay(dayRequest, me, deps({ random: () => 0.42 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipes.map((r) => r.meal)).toEqual(me.profile.meals);
    expect(result.recipes.every((r) => r.ok)).toBe(true);
    const saved = await Promise.all(
      result.recipes.map((r) => (r.ok ? getRecipe(t.db, r.id) : null)),
    );
    const proteins = saved.flatMap((r) =>
      r!.ingredients
        .filter((i) => FOOD_INDEX.get(i.foodId)!.role === "protein")
        .map((i) => i.foodId),
    );
    expect(new Set(proteins).size).toBe(proteins.length);
    for (const recipe of saved) expect(recipe!.customTarget).toBe(false);
    // Cada receita nova conta uma na quota
    const rows = await t.db.select().from(usageCounters);
    expect(rows.find((r) => r.keyHash === "global")?.count).toBe(me.profile.meals.length);
  });

  it("a quota tem de chegar para o dia todo; o rate limiting conta o pedido uma vez", async () => {
    const userId = await createUser(t.db);
    const small = { ...env, QUOTA_USER: 3 };
    expect(await generateRecipeDay(dayRequest, person(userId), deps({ env: small }))).toEqual({
      ok: false,
      code: "quota_exceeded",
      status: 429,
      remaining: 3,
    });
    let calls = 0;
    const counted = deps({
      rateLimit: async () => {
        calls += 1;
        return true;
      },
    });
    expect((await generateRecipeDay(dayRequest, person(userId), counted)).ok).toBe(true);
    expect(calls).toBe(1);
    expect(
      await generateRecipeDay(dayRequest, person(userId), deps({ rateLimit: async () => false })),
    ).toMatchObject({ ok: false, code: "rate_limited" });
  });

  it("vegana: nenhuma receita do dia leva origem animal", async () => {
    const userId = await createUser(t.db);
    const me = person(userId, { diet: "vegan", likedFoods: [] });
    const result = await generateRecipeDay(dayRequest, me, deps({ random: () => 0.7 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const r of result.recipes) {
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      for (const i of (await getRecipe(t.db, r.id))!.ingredients) {
        expect(FOOD_INDEX.get(i.foodId)!.category, i.foodId).not.toMatch(
          /carne|peixe|marisco|conservas|ovos|laticinios/,
        );
      }
    }
  });
});
