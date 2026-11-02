import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { CONSENT_VERSION, type ProfileInput } from "@/domain/contracts/account";
import type { PlanItemInput } from "@/domain/contracts/plan";
import { findPortion, type FoodIndex } from "@/domain/food";
import type { Intensity } from "@/domain/goal";
import type { Meal } from "@/domain/meals";
import { user } from "../db/auth-schema";
import type { Db } from "../db/client-core";
import {
  dayPlans,
  planItems,
  profiles,
  recipeIngredients,
  recipes,
  savedRecipes,
} from "../db/schema";

/** v1 usa um só plano por pessoa. */
export const DEFAULT_PLAN_NAME = "hoje";

export interface StoredDay {
  profile: {
    dailyTargetG: number;
    intensity: Intensity;
    meals: Meal[];
    postWorkoutMeal: Meal | null;
  } | null;
  items: PlanItemInput[];
  updatedAt: number;
}

/** Só itens de alimentos e porções que existem no catálogo (a D1 não tem FK para foods). */
export function knownItems(items: readonly PlanItemInput[], foods: FoodIndex): PlanItemInput[] {
  return items.filter((i) => {
    const food = foods.get(i.foodId);
    return Boolean(food && findPortion(food, i.portionId));
  });
}

export async function loadDay(db: Db, userId: string): Promise<StoredDay> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  const [plan] = await db
    .select()
    .from(dayPlans)
    .where(and(eq(dayPlans.userId, userId), eq(dayPlans.name, DEFAULT_PLAN_NAME)));
  const items = plan
    ? await db
        .select()
        .from(planItems)
        .where(eq(planItems.planId, plan.id))
        .orderBy(asc(planItems.position))
    : [];
  return {
    profile: profile
      ? {
          dailyTargetG: profile.dailyTargetG,
          intensity: profile.intensity,
          meals: profile.meals,
          postWorkoutMeal: profile.postWorkoutMeal ?? null,
        }
      : null,
    items: items.map((i) => ({
      id: i.id,
      meal: i.meal,
      foodId: i.foodId,
      portionId: i.portionId,
      count: i.portionCount,
    })),
    updatedAt: Math.max(profile?.updatedAt ?? 0, plan?.updatedAt ?? 0),
  };
}

function profileValues(userId: string, profile: ProfileInput, now: number) {
  return {
    userId,
    dailyTargetG: profile.dailyTargetG,
    intensity: profile.intensity,
    meals: profile.meals,
    postWorkoutMeal: profile.postWorkoutMeal,
    locale: profile.locale,
    updatedAt: now,
  };
}

/**
 * Guarda meta, refeições e o dia de uma vez (batch D1). O dia é substituído por inteiro: os ids
 * dos itens são gerados aqui, nunca vêm do cliente (evita colisões entre pessoas).
 */
export async function saveDay(
  db: Db,
  userId: string,
  input: { profile: ProfileInput; items: readonly PlanItemInput[] },
  foods: FoodIndex,
  now = Date.now(),
): Promise<void> {
  const items = knownItems(input.items, foods).filter((i) => input.profile.meals.includes(i.meal));
  const [existing] = await db
    .select({ id: dayPlans.id })
    .from(dayPlans)
    .where(and(eq(dayPlans.userId, userId), eq(dayPlans.name, DEFAULT_PLAN_NAME)));
  const planId = existing?.id ?? crypto.randomUUID();
  const values = profileValues(userId, input.profile, now);

  await db.batch([
    db
      .insert(profiles)
      .values(values)
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          dailyTargetG: values.dailyTargetG,
          intensity: values.intensity,
          meals: values.meals,
          postWorkoutMeal: values.postWorkoutMeal,
          locale: values.locale,
          updatedAt: now,
        },
      }),
    db
      .insert(dayPlans)
      .values({ id: planId, userId, name: DEFAULT_PLAN_NAME, position: 0, updatedAt: now })
      .onConflictDoUpdate({ target: [dayPlans.userId, dayPlans.name], set: { updatedAt: now } }),
    db.delete(planItems).where(eq(planItems.planId, planId)),
    ...items.map((item, position) =>
      db.insert(planItems).values({
        id: crypto.randomUUID(),
        planId,
        meal: item.meal,
        foodId: item.foodId,
        portionId: item.portionId,
        portionCount: item.count,
        position,
      }),
    ),
  ] as unknown as Parameters<Db["batch"]>[0]);
}

/** Regista o consentimento (versão dos termos) na primeira visita depois de criar conta. */
export async function recordConsent(
  db: Db,
  userId: string,
  profile: ProfileInput,
  now = Date.now(),
) {
  await db
    .insert(profiles)
    .values({
      ...profileValues(userId, profile, now),
      consentVersion: CONSENT_VERSION,
      consentedAt: now,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { consentVersion: CONSENT_VERSION, consentedAt: now },
    });
}

export type ImportOutcome = "imported" | "already_imported" | "conflict" | "kept_account";

/**
 * Importa o estado de convidado (idempotente pelo importId). Se a conta já tem um dia, pergunta
 * qual manter (`keep`); sem resposta devolve "conflict" e não mexe em nada.
 */
export async function importGuestData(
  db: Db,
  userId: string,
  input: {
    importId: string;
    profile: ProfileInput;
    items: readonly PlanItemInput[];
    keep?: "guest" | "account";
  },
  foods: FoodIndex,
  now = Date.now(),
): Promise<ImportOutcome> {
  const [profile] = await db
    .select({ lastImportId: profiles.lastImportId })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  if (profile?.lastImportId === input.importId) return "already_imported";

  const current = await loadDay(db, userId);
  const hasDay = current.items.length > 0;
  if (hasDay && !input.keep) return "conflict";

  if (input.keep === "account") {
    await db
      .update(profiles)
      .set({ lastImportId: input.importId })
      .where(eq(profiles.userId, userId));
    return "kept_account";
  }

  await saveDay(db, userId, input, foods, now);
  await db
    .update(profiles)
    .set({ lastImportId: input.importId })
    .where(eq(profiles.userId, userId));
  return "imported";
}

/* ------------------------------------------------------------ Receitas guardadas */

export async function setRecipeSaved(
  db: Db,
  userId: string,
  recipeId: string,
  saved: boolean,
  now = Date.now(),
): Promise<boolean> {
  if (!saved) {
    await db
      .delete(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.recipeId, recipeId)));
    return false;
  }
  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.id, recipeId));
  if (!recipe) return false;
  await db.insert(savedRecipes).values({ userId, recipeId, savedAt: now }).onConflictDoNothing();
  return true;
}

export async function isRecipeSaved(db: Db, userId: string, recipeId: string): Promise<boolean> {
  const [row] = await db
    .select({ recipeId: savedRecipes.recipeId })
    .from(savedRecipes)
    .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.recipeId, recipeId)));
  return Boolean(row);
}

export async function listSavedRecipes(db: Db, userId: string) {
  return db
    .select({
      id: recipes.id,
      title: recipes.title,
      summary: recipes.summary,
      proteinPerServingG: recipes.proteinPerServingG,
      prepMinutes: recipes.prepMinutes,
      savedAt: savedRecipes.savedAt,
    })
    .from(savedRecipes)
    .innerJoin(recipes, eq(recipes.id, savedRecipes.recipeId))
    .where(eq(savedRecipes.userId, userId))
    .orderBy(desc(savedRecipes.savedAt))
    .limit(100);
}

/* ------------------------------------------------------------ Exportar dados */

/** Tudo o que a app guarda sobre a pessoa (RGPD: direito de acesso e portabilidade). */
export async function exportUserData(db: Db, userId: string) {
  const [account] = await db
    .select({ name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, userId));
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  const day = await loadDay(db, userId);
  const saved = await listSavedRecipes(db, userId);
  const ingredients = saved.length
    ? await db
        .select()
        .from(recipeIngredients)
        .where(
          inArray(
            recipeIngredients.recipeId,
            saved.map((s) => s.id),
          ),
        )
    : [];
  return {
    exportedAt: new Date().toISOString(),
    account: account
      ? { name: account.name, email: account.email, createdAt: account.createdAt.toISOString() }
      : null,
    profile: profile
      ? {
          dailyTargetG: profile.dailyTargetG,
          intensity: profile.intensity,
          meals: profile.meals,
          postWorkoutMeal: profile.postWorkoutMeal,
          locale: profile.locale,
          consentVersion: profile.consentVersion,
          consentedAt: profile.consentedAt ? new Date(profile.consentedAt).toISOString() : null,
        }
      : null,
    day: day.items.map(({ meal, foodId, portionId, count }) => ({
      meal,
      foodId,
      portionId,
      count,
    })),
    savedRecipes: saved.map((r) => ({
      ...r,
      savedAt: new Date(r.savedAt).toISOString(),
      ingredients: ingredients
        .filter((i) => i.recipeId === r.id)
        .map(({ foodId, grams }) => ({ foodId, grams })),
    })),
  };
}
