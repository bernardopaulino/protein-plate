import { count, eq } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_PROFILE, type ProfileInput } from "@/domain/contracts/account";
import type { PlanItemInput } from "@/domain/contracts/plan";
import { FOOD_INDEX } from "@/features/catalog/catalog";
import { account, session, user } from "@/server/db/auth-schema";
import { dayPlans, foods, planItems, profiles, recipes, savedRecipes } from "@/server/db/schema";
import {
  exportUserData,
  importGuestData,
  isRecipeSaved,
  listSavedRecipes,
  loadDay,
  recordConsent,
  saveDay,
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

const profile: ProfileInput = {
  dailyTargetG: 160,
  intensity: "alta",
  meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
  postWorkoutMeal: "lanche",
  locale: "pt",
};

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

describe("dia e meta (dois utilizadores)", () => {
  it("cada pessoa só lê e escreve o seu dia", async () => {
    const ana = await createUser(t.db, "Ana");
    const rui = await createUser(t.db, "Rui");
    await saveDay(t.db, ana, { profile, items }, FOOD_INDEX);
    await saveDay(
      t.db,
      rui,
      { profile: { ...profile, dailyTargetG: 120 }, items: [items[0]!] },
      FOOD_INDEX,
    );

    const dayAna = await loadDay(t.db, ana);
    const dayRui = await loadDay(t.db, rui);
    expect(dayAna.profile?.dailyTargetG).toBe(160);
    expect(dayAna.items.map((i) => i.foodId)).toEqual(["skyr-natural", "peito-frango"]);
    expect(dayRui.profile?.dailyTargetG).toBe(120);
    expect(dayRui.items).toHaveLength(1);
    // Ids gerados no servidor: os do cliente ("a", "b") nunca chegam à D1
    expect(dayAna.items.some((i) => i.id === "a")).toBe(false);
  });

  it("guardar outra vez substitui o dia e ignora alimentos que não existem", async () => {
    const id = await createUser(t.db);
    await saveDay(t.db, id, { profile, items }, FOOD_INDEX);
    await saveDay(
      t.db,
      id,
      {
        profile,
        items: [
          items[1]!,
          { id: "x", meal: "jantar", foodId: "nao-existe", portionId: "nao-existe:dose", count: 1 },
          // refeição que não faz parte do dia
          {
            id: "y",
            meal: "ceia",
            foodId: "skyr-natural",
            portionId: "skyr-natural:iogurte",
            count: 1,
          },
        ],
      },
      FOOD_INDEX,
    );
    const day = await loadDay(t.db, id);
    expect(day.items.map((i) => i.foodId)).toEqual(["peito-frango"]);
  });

  it("a D1 recusa porções fora de 0,5–4 em passos de 0,5", async () => {
    const id = await createUser(t.db);
    await saveDay(t.db, id, { profile, items }, FOOD_INDEX);
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

  it("o perfil nunca tem peso", async () => {
    const id = await createUser(t.db);
    await saveDay(t.db, id, { profile, items }, FOOD_INDEX);
    const [row] = await t.db.select().from(profiles).where(eq(profiles.userId, id));
    expect(Object.keys(row!).some((k) => k.toLowerCase().includes("weight"))).toBe(false);
  });
});

describe("importar o estado de convidado", () => {
  it("é idempotente pelo importId", async () => {
    const id = await createUser(t.db);
    const importId = crypto.randomUUID();
    expect(await importGuestData(t.db, id, { importId, profile, items }, FOOD_INDEX)).toBe(
      "imported",
    );
    expect(await importGuestData(t.db, id, { importId, profile, items }, FOOD_INDEX)).toBe(
      "already_imported",
    );
    expect((await loadDay(t.db, id)).items).toHaveLength(2);
  });

  it("sem duplicados quando a conta já tem um dia: pergunta qual manter", async () => {
    const id = await createUser(t.db);
    await saveDay(t.db, id, { profile, items: [items[0]!] }, FOOD_INDEX);
    const input = { importId: crypto.randomUUID(), profile, items };
    expect(await importGuestData(t.db, id, input, FOOD_INDEX)).toBe("conflict");
    expect((await loadDay(t.db, id)).items).toHaveLength(1);

    expect(await importGuestData(t.db, id, { ...input, keep: "account" }, FOOD_INDEX)).toBe(
      "kept_account",
    );
    expect((await loadDay(t.db, id)).items).toHaveLength(1);

    const second = { importId: crypto.randomUUID(), profile, items };
    expect(await importGuestData(t.db, id, { ...second, keep: "guest" }, FOOD_INDEX)).toBe(
      "imported",
    );
    expect((await loadDay(t.db, id)).items).toHaveLength(2);
  });

  it("regista a versão do consentimento", async () => {
    const id = await createUser(t.db);
    await recordConsent(t.db, id, DEFAULT_PROFILE);
    const [row] = await t.db.select().from(profiles).where(eq(profiles.userId, id));
    expect(row?.consentVersion).toBe(1);
    expect(row?.consentedAt).toBeTypeOf("number");
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
    await saveDay(t.db, ana, { profile, items }, FOOD_INDEX);
    await insertRecipe("rcpExport1");
    await setRecipeSaved(t.db, ana, "rcpExport1", true);
    const exported = await exportUserData(t.db, ana);
    expect(exported.account?.name).toBe("Ana");
    expect(exported.day).toHaveLength(2);
    expect(exported.savedRecipes.map((r) => r.id)).toEqual(["rcpExport1"]);
    expect(JSON.stringify(exported)).not.toContain(rui);
  });
});

describe("apagar um utilizador", () => {
  it("apaga em cascata perfil, dia, itens, receitas guardadas, sessões e contas; as receitas ficam", async () => {
    const id = await createUser(t.db);
    const other = await createUser(t.db);
    await saveDay(t.db, id, { profile, items }, FOOD_INDEX);
    await saveDay(t.db, other, { profile, items }, FOOD_INDEX);
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
