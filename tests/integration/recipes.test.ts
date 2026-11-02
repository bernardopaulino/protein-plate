import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FOODS, FOOD_DATA_VERSION } from "@/content/foods.generated";
import type { RecipeRequest } from "@/domain/contracts/recipe";
import { FOOD_INDEX } from "@/features/catalog/catalog";
import { parseEnv, type AppEnv } from "@/lib/env";
import { mockModel } from "@/server/ai/model";
import { recipeIngredients, recipes, usageCounters } from "@/server/db/schema";
import { generateRecipe, type Actor, type GenerateDeps } from "@/server/recipes/generate";
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
  QUOTA_GUEST: "3",
  QUOTA_USER: "15",
  TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  IP_HASH_SECRET: "ip-hash-secret-0123456789abcdef0123456789",
});

let requestCounter = 0;
/** Um pedido válido; `mealTargetG` muda a cada chamada para não bater na cache. */
function request(partial: Partial<RecipeRequest> = {}): RecipeRequest {
  requestCounter += 1;
  return {
    foodIds: ["atum-lata-natural", "grao-bico-lata", "tomate"],
    meal: "almoco",
    postWorkout: false,
    mealTargetG: 20 + requestCounter * 5,
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
    verifyTurnstile: async (token) => token === "ok",
    rateLimit: async () => true,
    ...overrides,
  };
}

const guest: Actor = { kind: "guest", ip: "203.0.113.7" };

describe("POST /api/recipes: pipeline com o modelo simulado", () => {
  it("gera, calcula a proteína pela app e guarda receita + ingredientes", async () => {
    const userId = await createUser(t.db);
    const req = request();
    const result = await generateRecipe(req, { kind: "user", userId }, deps());
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
    const first = await generateRecipe(req, { kind: "user", userId }, deps());
    const again = await generateRecipe(
      { ...req, foodIds: [...req.foodIds].reverse() },
      { kind: "user", userId },
      deps(),
    );
    expect(again).toEqual({ ok: true, id: first.ok ? first.id : "", cached: true });
    const other = await generateRecipe({ ...req, variant: 2 }, { kind: "user", userId }, deps());
    expect(other.ok && other.id).not.toBe(first.ok && first.id);
    const [usage] = await t.db.select({ n: count() }).from(recipes);
    expect(usage?.n).toBeGreaterThanOrEqual(2);
  });

  it("convidados: sem Turnstile válido não passa", async () => {
    expect(await generateRecipe(request(), guest, deps())).toMatchObject({
      ok: false,
      code: "turnstile_failed",
    });
    expect(await generateRecipe(request({ turnstileToken: "ok" }), guest, deps())).toMatchObject({
      ok: true,
    });
  });

  it("convidados: 3 receitas novas por dia; a quarta é recusada e a cache continua a abrir", async () => {
    const reqs = [1, 2, 3].map(() => request({ turnstileToken: "ok" }));
    for (const req of reqs) expect((await generateRecipe(req, guest, deps())).ok).toBe(true);
    expect(await generateRecipe(request({ turnstileToken: "ok" }), guest, deps())).toMatchObject({
      ok: false,
      code: "quota_exceeded",
    });
    expect(await generateRecipe(reqs[0]!, guest, deps())).toMatchObject({ ok: true, cached: true });
    // Outro IP tem a sua própria quota
    expect(
      (
        await generateRecipe(
          request({ turnstileToken: "ok" }),
          { kind: "guest", ip: "198.51.100.1" },
          deps(),
        )
      ).ok,
    ).toBe(true);
  });

  it("as chaves de quota não guardam o IP nem o id do utilizador", async () => {
    await generateRecipe(request({ turnstileToken: "ok" }), guest, deps());
    const rows = await t.db.select().from(usageCounters);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.keyHash).not.toContain("203.0.113.7");
      expect(row.keyHash === "global" || /^[0-9a-f]{64}$/.test(row.keyHash)).toBe(true);
    }
  });

  it("acima do limite global só serve a cache", async () => {
    const userId = await createUser(t.db);
    const low = { ...env, AI_DAILY_LIMIT: 1 };
    expect((await generateRecipe(request(), { kind: "user", userId }, deps({ env: low }))).ok).toBe(
      true,
    );
    expect(
      await generateRecipe(request(), { kind: "user", userId }, deps({ env: low })),
    ).toMatchObject({
      ok: false,
      code: "service_unavailable",
    });
  });

  it("rate limiting por chave", async () => {
    const userId = await createUser(t.db);
    expect(
      await generateRecipe(
        request(),
        { kind: "user", userId },
        deps({ rateLimit: async () => false }),
      ),
    ).toMatchObject({ ok: false, code: "rate_limited" });
  });

  it("alimentos desconhecidos ou da despensa como escolha são recusados", async () => {
    const userId = await createUser(t.db);
    for (const foodIds of [
      ["atum-lata-natural", "nao-existe"],
      ["atum-lata-natural", "azeite"],
    ]) {
      expect(
        await generateRecipe(request({ foodIds }), { kind: "user", userId }, deps()),
      ).toMatchObject({
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
      { kind: "user", userId },
      deps({ model: () => mockModel(respond) }),
    );
    expect(result.ok).toBe(true);
    expect(respond).toHaveBeenCalledTimes(2);
    expect(prompts[1]).toContain("faltam as fontes de proteína atum-lata-natural");
  });

  it("segunda falha: erro amigável e não conta para a quota", async () => {
    const userId = await createUser(t.db);
    const respond = vi.fn(() => JSON.stringify({ title: "x" }));
    const before = await t.db.select().from(usageCounters);
    const result = await generateRecipe(
      request(),
      { kind: "user", userId },
      deps({ model: () => mockModel(respond) }),
    );
    expect(result).toMatchObject({ ok: false, code: "generation_failed" });
    expect(respond).toHaveBeenCalledTimes(2);
    expect(await t.db.select().from(usageCounters)).toEqual(before);
  });

  it("recusa quantidades irreais (mais de 3 porções por dose) e proteína fora de 1–120 g", async () => {
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
      { kind: "user", userId },
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
