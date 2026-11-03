import { count, eq } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PlanItemInput } from "@/domain/contracts/plan";
import { preferencesInputSchema, type PreferencesInput } from "@/domain/contracts/profile";
import { isAllowed } from "@/domain/preferences";
import { totalProtein } from "@/domain/protein";
import { CATALOG, FOOD_INDEX } from "@/features/catalog/catalog";
import { account, session, user } from "@/server/db/auth-schema";
import {
  dayPlans,
  foods,
  mealRecipes,
  planItems,
  profiles,
  recipeIngredients,
  recipes,
  savedRecipes,
  userRecipes,
} from "@/server/db/schema";
import {
  RECIPE_HISTORY_MAX,
  addDayItem,
  applyRecipeToDay,
  exportUserData,
  listRecentRecipes,
  loadMealRecipes,
  recipeStateFor,
  recordRecipeHistory,
  setRecipeFavorite,
  isRecipeSaved,
  listSavedRecipes,
  loadDay,
  loadProfile,
  recordConsent,
  saveDayItems,
  savePreferences,
  setRecipeSaved,
} from "@/server/services/account";
import { cleanUpExpiredRows } from "@/server/services/cleanup";
import { createTestD1, createUser, type TestD1 } from "./d1";

let t: TestD1;
beforeAll(async () => {
  t = await createTestD1();
});
afterAll(async () => {
  await t?.dispose();
});

const preferences: PreferencesInput = {
  weightKg: 80,
  intensity: "alta",
  manualTargetG: null,
  meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
  preWorkoutMeal: "lanche",
  postWorkoutMeal: "jantar",
  diet: "omnivore",
  allergies: [],
  likedFoods: ["skyr-natural", "peito-frango", "ovo", "atum-lata-natural", "arroz-branco"],
  equipment: ["stove", "microwave"],
  cookMinutes: 20,
  healthConsent: true,
};

async function onboard(id: string, overrides: Partial<PreferencesInput> = {}) {
  const result = await savePreferences(
    t.db,
    id,
    { ...preferences, ...overrides },
    CATALOG,
    FOOD_INDEX,
  );
  if (!result.ok) throw new Error(result.code);
  return result.day;
}

const items: PlanItemInput[] = [
  {
    id: "a",
    meal: "pequeno-almoco",
    foodId: "skyr-natural",
    portionId: "skyr-natural:iogurte",
    count: 1,
  },
  { id: "b", meal: "almoco", foodId: "peito-frango", portionId: "peito-frango:peito", count: 1.5 },
];

async function insertRecipe(id: string) {
  await t.db.insert(recipes).values({
    id,
    cacheKey: `key-${id}`,
    locale: "pt",
    title: "Receita",
    summary: "Resumo",
    meal: "almoco",
    postWorkout: false,
    servings: 1,
    prepMinutes: 10,
    steps: ["a", "b"],
    proteinPerServingG: 30,
    mealTargetG: 40,
    model: "mock",
    promptVersion: 1,
    foodDataVersion: 1,
    createdAt: Date.now(),
  });
}

describe("catálogo na D1", () => {
  it("o seed coincide com o módulo tipado", async () => {
    const [row] = await t.db.select({ n: count() }).from(foods);
    expect(row?.n).toBe(FOOD_INDEX.size);
    const [frango] = await t.db.select().from(foods).where(eq(foods.id, "peito-frango"));
    expect(frango?.proteinPer100g).toBe(FOOD_INDEX.get("peito-frango")?.proteinPer100g);
  });
});

describe("preferências e formulário de boas-vindas (dois utilizadores)", () => {
  it("calcula a meta pelo peso, guarda tudo e cria o dia exemplo da pessoa", async () => {
    const ana = await createUser(t.db, "Ana");
    const rui = await createUser(t.db, "Rui");
    const dayAna = await onboard(ana);
    const dayRui = await onboard(rui, {
      weightKg: 60,
      diet: "vegetarian",
      allergies: ["peanut"],
      likedFoods: ["tofu-firme", "grao-bico-lata", "iogurte-grego-natural", "peito-frango"],
    });

    expect(dayAna.profile?.dailyTargetG).toBe(160);
    expect(dayAna.profile?.weightKg).toBe(80);
    expect(dayAna.profile?.onboardedAt).toBeTypeOf("number");
    expect(dayAna.profile?.healthConsentAt).toBeTypeOf("number");
    expect(dayAna.profile?.preWorkoutMeal).toBe("lanche");
    expect(dayAna.items.length).toBeGreaterThan(0);
    const total = totalProtein(dayAna.items, FOOD_INDEX);
    expect(total).toBeGreaterThanOrEqual(160);
    expect(total).toBeLessThanOrEqual(176);

    // A carne que o Rui marcou não fica (é vegetariano) e o dia só tem o que ele pode comer
    const rui0 = await loadProfile(t.db, rui);
    expect(rui0?.dailyTargetG).toBe(120);
    expect(rui0?.likedFoods).toEqual(["tofu-firme", "grao-bico-lata", "iogurte-grego-natural"]);
    for (const item of dayRui.items) {
      expect(isAllowed(FOOD_INDEX.get(item.foodId)!, rui0!), item.foodId).toBe(true);
    }
    // Cada pessoa só vê o seu
    expect((await loadDay(t.db, ana)).profile?.diet).toBe("omnivore");
    expect((await loadDay(t.db, rui)).profile?.diet).toBe("vegetarian");
  });

  it('"Como de tudo": todos os alimentos fora da despensa cabem no contrato e ficam guardados', async () => {
    const id = await createUser(t.db);
    const all = CATALOG.filter((f) => f.role !== "pantry").map((f) => f.id);
    const input = { ...preferences, likedFoods: all };
    expect(preferencesInputSchema.safeParse(input).success).toBe(true);
    await onboard(id, { likedFoods: all });
    expect((await loadProfile(t.db, id))?.likedFoods).toHaveLength(all.length);
  });

  it("meta manual sem peso: não guarda dados de saúde", async () => {
    const id = await createUser(t.db);
    const day = await onboard(id, { weightKg: null, manualTargetG: 130, healthConsent: false });
    expect(day.profile?.dailyTargetG).toBe(130);
    expect(day.profile?.weightKg).toBeNull();
    expect(day.profile?.healthConsentAt).toBeNull();
    expect(day.profile?.manualTarget).toBe(true);
  });

  it("recusa menos de 3 fontes de proteína que a pessoa possa comer", async () => {
    const id = await createUser(t.db);
    const result = await savePreferences(
      t.db,
      id,
      { ...preferences, diet: "vegan", likedFoods: ["peito-frango", "ovo", "tofu-firme"] },
      CATALOG,
      FOOD_INDEX,
    );
    expect(result).toEqual({ ok: false, code: "liked_foods" });
    expect(await loadProfile(t.db, id)).toBeNull();
  });

  it("ao editar, mantém o dia que ainda cabe e tira o que deixou de caber", async () => {
    const id = await createUser(t.db);
    const first = await onboard(id);
    await saveDayItems(t.db, id, items, FOOD_INDEX);
    const onboardedAt = first.profile?.onboardedAt;

    const edited = await onboard(id, { diet: "pescatarian" });
    expect(edited.items.map((i) => i.foodId)).toEqual(["skyr-natural"]);
    expect(edited.profile?.onboardedAt).toBe(onboardedAt);

    // Sem nada que caiba, volta ao dia exemplo (vegano)
    const vegan = await onboard(id, {
      diet: "vegan",
      likedFoods: ["tofu-firme", "grao-bico-lata", "lentilhas-castanhas"],
    });
    expect(vegan.items.length).toBeGreaterThan(0);
    for (const item of vegan.items) {
      expect(isAllowed(FOOD_INDEX.get(item.foodId)!, vegan.profile!), item.foodId).toBe(true);
    }
  });

  it("regista a versão 2 do consentimento sem dar o formulário por concluído", async () => {
    const id = await createUser(t.db);
    await recordConsent(t.db, id);
    const profile = await loadProfile(t.db, id);
    const [row] = await t.db.select().from(profiles).where(eq(profiles.userId, id));
    expect(row?.consentVersion).toBe(2);
    expect(row?.consentedAt).toBeTypeOf("number");
    expect(profile?.onboardedAt).toBeNull();
  });
});

describe("dia (dois utilizadores)", () => {
  it("sem formulário concluído não guarda nada", async () => {
    const id = await createUser(t.db);
    expect(await saveDayItems(t.db, id, items, FOOD_INDEX)).toBe(false);
    await recordConsent(t.db, id);
    expect(await saveDayItems(t.db, id, items, FOOD_INDEX)).toBe(false);
  });

  it("cada pessoa só escreve o seu dia; ids gerados no servidor", async () => {
    const ana = await createUser(t.db, "Ana");
    const rui = await createUser(t.db, "Rui");
    await onboard(ana);
    await onboard(rui);
    await saveDayItems(t.db, ana, items, FOOD_INDEX);
    await saveDayItems(t.db, rui, [items[0]!], FOOD_INDEX);
    const dayAna = await loadDay(t.db, ana);
    expect(dayAna.items.map((i) => i.foodId)).toEqual(["skyr-natural", "peito-frango"]);
    expect((await loadDay(t.db, rui)).items).toHaveLength(1);
    expect(dayAna.items.some((i) => i.id === "a")).toBe(false);
  });

  it("ignora alimentos que não existem, refeições fora do dia e o que as restrições excluem", async () => {
    const id = await createUser(t.db);
    await onboard(id, { allergies: ["milk"] });
    await saveDayItems(
      t.db,
      id,
      [
        ...items,
        { id: "x", meal: "jantar", foodId: "nao-existe", portionId: "nao-existe:dose", count: 1 },
        {
          id: "y",
          meal: "ceia",
          foodId: "peito-frango",
          portionId: "peito-frango:peito",
          count: 1,
        },
      ],
      FOOD_INDEX,
    );
    expect((await loadDay(t.db, id)).items.map((i) => i.foodId)).toEqual(["peito-frango"]);
  });

  it("adicionar ao dia (catálogo): soma porções e respeita o perfil de cada pessoa", async () => {
    const ana = await createUser(t.db, "Ana");
    const rui = await createUser(t.db, "Rui");
    await onboard(ana);
    await onboard(rui, {
      diet: "vegetarian",
      likedFoods: ["tofu-firme", "grao-bico-lata", "iogurte-grego-natural"],
    });
    await saveDayItems(t.db, ana, [items[1]!], FOOD_INDEX);
    const chicken = {
      meal: "almoco",
      foodId: "peito-frango",
      portionId: "peito-frango:peito",
    } as const;

    expect(await addDayItem(t.db, ana, { ...chicken, count: 1 }, FOOD_INDEX)).toBe("ok");
    const dayAna = await loadDay(t.db, ana);
    expect(dayAna.items).toHaveLength(1);
    expect(dayAna.items[0]?.count).toBe(2.5);

    // Vegetariano: o frango não entra; nem refeições que a pessoa não tem
    expect(await addDayItem(t.db, rui, { ...chicken, count: 1 }, FOOD_INDEX)).toBe("not_allowed");
    expect(
      await addDayItem(
        t.db,
        rui,
        { meal: "ceia", foodId: "tofu-firme", portionId: "tofu-firme:meio-bloco", count: 1 },
        FOOD_INDEX,
      ),
    ).toBe("not_allowed");
    expect(
      await addDayItem(
        t.db,
        rui,
        { ...chicken, foodId: "nao-existe", portionId: "nao-existe:dose", count: 1 },
        FOOD_INDEX,
      ),
    ).toBe("not_allowed");
    expect(
      await addDayItem(
        t.db,
        rui,
        { meal: "almoco", foodId: "tofu-firme", portionId: "tofu-firme:meio-bloco", count: 1 },
        FOOD_INDEX,
      ),
    ).toBe("ok");
    // O dia da Ana não mudou com os pedidos do Rui
    expect((await loadDay(t.db, ana)).items).toHaveLength(1);

    const fresh = await createUser(t.db);
    expect(await addDayItem(t.db, fresh, { ...chicken, count: 1 }, FOOD_INDEX)).toBe("no_profile");
  });

  it("a D1 recusa porções fora de 0,5–4 em passos de 0,5", async () => {
    const id = await createUser(t.db);
    await onboard(id);
    const [plan] = await t.db.select().from(dayPlans).where(eq(dayPlans.userId, id));
    await expect(
      t.db.insert(planItems).values({
        id: crypto.randomUUID(),
        planId: plan!.id,
        meal: "almoco",
        foodId: "ovo",
        portionId: "ovo:ovo",
        portionCount: 1.25,
        position: 9,
      }),
    ).rejects.toThrow();
  });
});

describe("receitas guardadas (dois utilizadores)", () => {
  it("cada pessoa vê só as suas", async () => {
    const ana = await createUser(t.db);
    const rui = await createUser(t.db);
    await insertRecipe("rcpAna0001");
    expect(await setRecipeSaved(t.db, ana, "rcpAna0001", true)).toBe(true);
    expect(await setRecipeSaved(t.db, ana, "rcpAna0001", true)).toBe(true); // sem duplicados
    expect(await isRecipeSaved(t.db, ana, "rcpAna0001")).toBe(true);
    expect(await isRecipeSaved(t.db, rui, "rcpAna0001")).toBe(false);
    expect(await listSavedRecipes(t.db, ana)).toHaveLength(1);
    expect(await listSavedRecipes(t.db, rui)).toHaveLength(0);
    expect(await setRecipeSaved(t.db, rui, "nao-existe", true)).toBe(false);
    expect(await setRecipeSaved(t.db, ana, "rcpAna0001", false)).toBe(false);
    expect(await listSavedRecipes(t.db, ana)).toHaveLength(0);
  });

  it("exportar devolve só os dados da própria pessoa", async () => {
    const ana = await createUser(t.db, "Ana");
    const rui = await createUser(t.db, "Rui");
    await onboard(ana, { allergies: ["egg"] });
    await saveDayItems(t.db, ana, items, FOOD_INDEX);
    await insertRecipe("rcpExport1");
    await setRecipeSaved(t.db, ana, "rcpExport1", true);
    const exported = await exportUserData(t.db, ana);
    expect(exported.account?.name).toBe("Ana");
    expect(exported.day).toHaveLength(2);
    // A própria pessoa recebe todos os seus dados, incluindo os de saúde
    expect(exported.profile?.weightKg).toBe(80);
    expect(exported.profile?.allergies).toEqual(["egg"]);
    expect(exported.profile?.likedFoods).toContain("skyr-natural");
    expect(exported.savedRecipes.map((r) => r.id)).toEqual(["rcpExport1"]);
    expect(JSON.stringify(exported)).not.toContain(rui);
  });
});

describe("livro de receitas: favoritas, recentes e pôr no dia (dois utilizadores)", () => {
  async function recipeWithIngredients(id: string, servings = 2) {
    await insertRecipe(id);
    await t.db.update(recipes).set({ servings }).where(eq(recipes.id, id));
    await t.db.insert(recipeIngredients).values([
      { recipeId: id, position: 0, foodId: "peito-frango", grams: 300 },
      { recipeId: id, position: 1, foodId: "arroz-branco", grams: 160 },
      { recipeId: id, position: 2, foodId: "azeite", grams: 20 },
    ]);
  }

  it("favorita: marcar também guarda; as favoritas vêm primeiro; cada pessoa tem as suas", async () => {
    const ana = await createUser(t.db);
    const rui = await createUser(t.db);
    await insertRecipe("rcpFav0001");
    await insertRecipe("rcpFav0002");
    await setRecipeSaved(t.db, ana, "rcpFav0001", true, 1000);
    expect(await setRecipeFavorite(t.db, ana, "rcpFav0002", true, 500)).toEqual({
      saved: true,
      favorite: true,
    });
    expect((await listSavedRecipes(t.db, ana)).map((r) => [r.id, r.favorite])).toEqual([
      ["rcpFav0002", true],
      ["rcpFav0001", false],
    ]);
    expect(await recipeStateFor(t.db, ana, "rcpFav0002")).toEqual({ saved: true, favorite: true });
    expect(await recipeStateFor(t.db, rui, "rcpFav0002")).toEqual({
      saved: false,
      favorite: false,
    });
    expect(await setRecipeFavorite(t.db, ana, "nao-existe", true)).toEqual({
      saved: false,
      favorite: false,
    });
    // Tirar das favoritas mantém guardada
    await setRecipeFavorite(t.db, ana, "rcpFav0002", false);
    expect(await recipeStateFor(t.db, ana, "rcpFav0002")).toEqual({ saved: true, favorite: false });
  });

  it("recentes: mais recentes primeiro, sem repetidos, no máximo 50 e só da própria pessoa", async () => {
    const ana = await createUser(t.db);
    const rui = await createUser(t.db);
    await insertRecipe("rcpRec0001");
    await insertRecipe("rcpRec0002");
    await recordRecipeHistory(t.db, ana, "rcpRec0001", 1000);
    await recordRecipeHistory(t.db, ana, "rcpRec0002", 2000);
    await recordRecipeHistory(t.db, ana, "rcpRec0001", 3000);
    expect((await listRecentRecipes(t.db, ana)).map((r) => r.id)).toEqual([
      "rcpRec0001",
      "rcpRec0002",
    ]);
    expect(await listRecentRecipes(t.db, rui)).toEqual([]);

    for (let i = 0; i < RECIPE_HISTORY_MAX + 3; i++) {
      const id = `rcpMax${String(i).padStart(4, "0")}`;
      await insertRecipe(id);
      await recordRecipeHistory(t.db, rui, id, 10_000 + i);
    }
    const [row] = await t.db
      .select({ n: count() })
      .from(userRecipes)
      .where(eq(userRecipes.userId, rui));
    expect(row?.n).toBe(RECIPE_HISTORY_MAX);
  });

  it("pôr no dia: troca os alimentos dessa refeição por uma dose da receita e liga a receita", async () => {
    const ana = await createUser(t.db);
    const rui = await createUser(t.db);
    await onboard(ana);
    await onboard(rui, {
      diet: "vegetarian",
      likedFoods: ["tofu-firme", "grao-bico-lata", "iogurte-grego-natural"],
    });
    await saveDayItems(t.db, ana, items, FOOD_INDEX);
    await recipeWithIngredients("rcpUse0001");

    expect(await applyRecipeToDay(t.db, ana, "rcpUse0001", "almoco", FOOD_INDEX)).toBe("ok");
    const day = await loadDay(t.db, ana);
    // O pequeno-almoço fica; o almoço passa a ser frango + arroz (sem o azeite da despensa)
    expect(day.items.filter((i) => i.meal === "pequeno-almoco").map((i) => i.foodId)).toEqual([
      "skyr-natural",
    ]);
    expect(day.items.filter((i) => i.meal === "almoco").map((i) => i.foodId)).toEqual([
      "peito-frango",
      "arroz-branco",
    ]);
    expect(await loadMealRecipes(t.db, ana)).toEqual({
      almoco: { id: "rcpUse0001", title: "Receita" },
    });

    // Vegetariano: o frango fica de fora; o arroz entra
    expect(await applyRecipeToDay(t.db, rui, "rcpUse0001", "almoco", FOOD_INDEX)).toBe("ok");
    expect(
      (await loadDay(t.db, rui)).items.filter((i) => i.meal === "almoco").map((i) => i.foodId),
    ).toEqual(["arroz-branco"]);
    // Refeições que a pessoa não tem, receitas que não existem, contas sem plano
    expect(await applyRecipeToDay(t.db, ana, "rcpUse0001", "ceia", FOOD_INDEX)).toBe("not_allowed");
    expect(await applyRecipeToDay(t.db, ana, "nao-existe", "almoco", FOOD_INDEX)).toBe("not_found");
    const fresh = await createUser(t.db);
    expect(await applyRecipeToDay(t.db, fresh, "rcpUse0001", "almoco", FOOD_INDEX)).toBe(
      "no_profile",
    );

    // Esvaziar a refeição desliga a receita
    await saveDayItems(
      t.db,
      ana,
      day.items.filter((i) => i.meal !== "almoco"),
      FOOD_INDEX,
    );
    expect(await loadMealRecipes(t.db, ana)).toEqual({});
    // A ligação do Rui não mudou
    expect(Object.keys(await loadMealRecipes(t.db, rui))).toEqual(["almoco"]);
  });

  it("exportar inclui as recentes, as favoritas e as receitas do dia; apagar a conta leva tudo", async () => {
    const id = await createUser(t.db);
    await onboard(id);
    await recipeWithIngredients("rcpExp0002");
    await recordRecipeHistory(t.db, id, "rcpExp0002");
    await setRecipeFavorite(t.db, id, "rcpExp0002", true);
    await applyRecipeToDay(t.db, id, "rcpExp0002", "jantar", FOOD_INDEX);
    const exported = await exportUserData(t.db, id);
    expect(exported.recentRecipes.map((r) => r.id)).toEqual(["rcpExp0002"]);
    expect(exported.mealRecipes).toEqual([{ meal: "jantar", recipeId: "rcpExp0002" }]);
    expect(exported.savedRecipes[0]?.favorite).toBe(true);

    await t.db.delete(user).where(eq(user.id, id));
    for (const [table, col] of [
      [userRecipes, userRecipes.userId],
      [mealRecipes, mealRecipes.userId],
    ] as const) {
      const [row] = await t.db.select({ n: count() }).from(table).where(eq(col, id));
      expect(row?.n).toBe(0);
    }
  });
});

describe("apagar um utilizador", () => {
  it("apaga em cascata perfil, dia, itens, receitas guardadas, sessões e contas; as receitas ficam", async () => {
    const id = await createUser(t.db);
    const other = await createUser(t.db);
    await onboard(id);
    await onboard(other);
    await saveDayItems(t.db, id, items, FOOD_INDEX);
    await saveDayItems(t.db, other, items, FOOD_INDEX);
    await insertRecipe("rcpCascade");
    await setRecipeSaved(t.db, id, "rcpCascade", true);
    await setRecipeSaved(t.db, other, "rcpCascade", true);
    await t.db.insert(session).values({
      id: crypto.randomUUID(),
      token: crypto.randomUUID(),
      userId: id,
      expiresAt: new Date(Date.now() + 1e6),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await t.db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "google-sub",
      providerId: "google",
      userId: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await t.db.delete(user).where(eq(user.id, id));

    const left = async (table: SQLiteTable, col: SQLiteColumn) =>
      (await t.db.select({ n: count() }).from(table).where(eq(col, id)))[0]?.n;
    expect(await left(profiles, profiles.userId)).toBe(0);
    expect(await left(dayPlans, dayPlans.userId)).toBe(0);
    expect(await left(savedRecipes, savedRecipes.userId)).toBe(0);
    expect(await left(session, session.userId)).toBe(0);
    expect(await left(account, account.userId)).toBe(0);
    const orphanItems = await t.d1
      .prepare(
        "SELECT count(*) AS n FROM plan_items WHERE plan_id NOT IN (SELECT id FROM day_plans)",
      )
      .first<{ n: number }>();
    expect(orphanItems?.n).toBe(0);
    // A outra pessoa e a receita (sem dono) continuam
    expect((await loadDay(t.db, other)).items).toHaveLength(2);
    expect(await isRecipeSaved(t.db, other, "rcpCascade")).toBe(true);
  });
});

describe("cron de limpeza", () => {
  it("apaga sessões expiradas e mantém as válidas", async () => {
    const id = await createUser(t.db);
    const expired = crypto.randomUUID();
    const valid = crypto.randomUUID();
    for (const [sid, expiresAt] of [
      [expired, Date.now() - 1000],
      [valid, Date.now() + 1e7],
    ] as const) {
      await t.db.insert(session).values({
        id: sid,
        token: sid,
        userId: id,
        expiresAt: new Date(expiresAt),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await cleanUpExpiredRows(t.db);
    const ids = (
      await t.db.select({ id: session.id }).from(session).where(eq(session.userId, id))
    ).map((r) => r.id);
    expect(ids).toEqual([valid]);
  });
});
