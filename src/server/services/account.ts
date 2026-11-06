import { and, asc, desc, eq, inArray, notInArray } from "drizzle-orm";
import { CONSENT_VERSION, type PreferencesInput } from "@/domain/contracts/profile";
import type { PlanItemInput } from "@/domain/contracts/plan";
import { buildExampleDay } from "@/domain/example-day";
import { findPortion, type Allergen, type Food, type FoodIndex } from "@/domain/food";
import { addItem, type NewItem } from "@/domain/plan";
import { recipeToItems } from "@/domain/recipe-to-day";
import { dailyTarget, type Intensity } from "@/domain/goal";
import { normalizeTraining, sortMeals, type Meal } from "@/domain/meals";
import {
  DEFAULT_COOK_MINUTES,
  DEFAULT_DIET,
  DEFAULT_EQUIPMENT,
  MIN_LIKED_PROTEINS,
  allowedFoods,
  cleanLikedFoods,
  isAllowed,
  proteinCount,
  type Diet,
  type Equipment,
  type Restrictions,
} from "@/domain/preferences";
import type { MaxMinutes } from "@/domain/recipe-options";
import type { ClientProfile } from "@/features/onboarding/draft";
import { user } from "../db/auth-schema";
import type { Db } from "../db/client-core";
import {
  dayPlans,
  mealRecipes,
  planItems,
  profiles,
  recipeIngredients,
  recipes,
  savedRecipes,
  userRecipes,
} from "../db/schema";

/** v1 usa um só plano por pessoa. */
export const DEFAULT_PLAN_NAME = "hoje";

/** O perfil completo (meta, refeições e preferências). */
export interface Profile {
  dailyTargetG: number;
  intensity: Intensity;
  weightKg: number | null;
  manualTarget: boolean;
  meals: Meal[];
  preWorkoutMeal: Meal | null;
  postWorkoutMeal: Meal | null;
  diet: Diet;
  allergies: Allergen[];
  likedFoods: string[];
  equipment: Equipment[];
  cookMinutes: MaxMinutes;
  /** Ver as calorias (só informação); muda-se no "Hoje", não no formulário. */
  showKcal: boolean;
  onboardedAt: number | null;
  healthConsentAt: number | null;
}

export interface StoredDay {
  profile: Profile | null;
  items: PlanItemInput[];
  updatedAt: number;
}

/** Perfil de uma conta acabada de criar (até concluir o formulário de boas-vindas). */
export const DEFAULT_PROFILE = {
  dailyTargetG: 140,
  intensity: "alta" as Intensity,
  meals: ["pequeno-almoco", "almoco", "lanche", "jantar"] as Meal[],
};

const COOK_MINUTES = new Set<number>([10, 20, 30, 45]);

export function restrictionsOf(profile: Pick<Profile, "diet" | "allergies">): Restrictions {
  return { diet: profile.diet, allergies: profile.allergies };
}

type ProfileRow = typeof profiles.$inferSelect;

function toProfile(row: ProfileRow): Profile {
  const meals = sortMeals(row.meals);
  const training = normalizeTraining(meals, row.preWorkoutMeal, row.postWorkoutMeal);
  return {
    dailyTargetG: row.dailyTargetG,
    intensity: row.intensity,
    weightKg: row.weightKg ?? null,
    manualTarget: row.manualTarget,
    meals,
    ...training,
    diet: row.diet,
    allergies: row.allergies,
    likedFoods: row.likedFoods,
    equipment: row.equipment,
    cookMinutes: (COOK_MINUTES.has(row.cookMinutes)
      ? row.cookMinutes
      : DEFAULT_COOK_MINUTES) as MaxMinutes,
    showKcal: row.showKcal,
    onboardedAt: row.onboardedAt ?? null,
    healthConsentAt: row.healthConsentAt ?? null,
  };
}

export async function loadProfile(db: Db, userId: string): Promise<Profile | null> {
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return row ? toProfile(row) : null;
}

/** Só itens de alimentos e porções que existem no catálogo (a D1 não tem FK para foods). */
export function knownItems(items: readonly PlanItemInput[], foods: FoodIndex): PlanItemInput[] {
  return items.filter((i) => {
    const food = foods.get(i.foodId);
    return Boolean(food && findPortion(food, i.portionId));
  });
}

/** Itens que cabem no perfil: refeições escolhidas e só alimentos que a pessoa pode comer. */
export function itemsForProfile(
  items: readonly PlanItemInput[],
  profile: Pick<Profile, "meals" | "diet" | "allergies">,
  foods: FoodIndex,
): PlanItemInput[] {
  const restrictions = restrictionsOf(profile);
  return knownItems(items, foods).filter(
    (i) => profile.meals.includes(i.meal) && isAllowed(foods.get(i.foodId)!, restrictions),
  );
}

async function loadItems(db: Db, userId: string) {
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
    plan,
    items: items.map((i) => ({
      id: i.id,
      meal: i.meal,
      foodId: i.foodId,
      portionId: i.portionId,
      count: i.portionCount,
    })),
  };
}

/** Só os itens do dia (o perfil já vem do guarda da página). */
export async function loadDayItems(db: Db, userId: string): Promise<PlanItemInput[]> {
  return (await loadItems(db, userId)).items;
}

export async function loadDay(db: Db, userId: string): Promise<StoredDay> {
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  const { plan, items } = await loadItems(db, userId);
  return {
    profile: row ? toProfile(row) : null,
    items,
    updatedAt: Math.max(row?.updatedAt ?? 0, plan?.updatedAt ?? 0),
  };
}

/** Substitui o dia por inteiro (os ids dos itens são gerados aqui, nunca vêm do cliente). */
function replaceItemsQueries(
  db: Db,
  userId: string,
  planId: string,
  items: readonly PlanItemInput[],
  now: number,
) {
  // A receita de uma refeição deixa de valer quando a refeição fica vazia
  const mealsWithItems = [...new Set(items.map((i) => i.meal))];
  return [
    mealsWithItems.length > 0
      ? db
          .delete(mealRecipes)
          .where(and(eq(mealRecipes.userId, userId), notInArray(mealRecipes.meal, mealsWithItems)))
      : db.delete(mealRecipes).where(eq(mealRecipes.userId, userId)),
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
  ];
}

async function planIdFor(db: Db, userId: string): Promise<string> {
  const [existing] = await db
    .select({ id: dayPlans.id })
    .from(dayPlans)
    .where(and(eq(dayPlans.userId, userId), eq(dayPlans.name, DEFAULT_PLAN_NAME)));
  return existing?.id ?? crypto.randomUUID();
}

/**
 * Guarda o dia (o "Hoje" chama-o depois de cada mudança). Sem perfil concluído não guarda nada; os
 * itens fora das refeições ou das restrições da pessoa ficam de fora.
 */
export async function saveDayItems(
  db: Db,
  userId: string,
  items: readonly PlanItemInput[],
  foods: FoodIndex,
  now = Date.now(),
): Promise<boolean> {
  const profile = await loadProfile(db, userId);
  if (!profile?.onboardedAt) return false;
  const planId = await planIdFor(db, userId);
  await db.batch(
    replaceItemsQueries(db, userId, planId, itemsForProfile(items, profile, foods), now) as never,
  );
  return true;
}

export type AddDayItemResult = "ok" | "no_profile" | "not_allowed";

/**
 * "Adicionar ao meu dia" no catálogo: junta um alimento a uma refeição da pessoa (soma porções se
 * já lá estiver). Alimentos fora das restrições ou refeições que a pessoa não tem não entram.
 */
export async function addDayItem(
  db: Db,
  userId: string,
  item: NewItem,
  foods: FoodIndex,
  now = Date.now(),
): Promise<AddDayItemResult> {
  const profile = await loadProfile(db, userId);
  if (!profile?.onboardedAt) return "no_profile";
  const food = foods.get(item.foodId);
  if (
    !food ||
    food.role === "pantry" ||
    !findPortion(food, item.portionId) ||
    !profile.meals.includes(item.meal) ||
    !isAllowed(food, restrictionsOf(profile))
  )
    return "not_allowed";
  const { items } = await loadItems(db, userId);
  const next = addItem(items, item, crypto.randomUUID());
  const planId = await planIdFor(db, userId);
  await db.batch(
    replaceItemsQueries(db, userId, planId, itemsForProfile(next, profile, foods), now) as never,
  );
  return "ok";
}

/** O dia exemplo da pessoa: só alimentos permitidos, com os de que gosta primeiro. */
export function personalExampleDay(
  profile: Pick<
    Profile,
    | "dailyTargetG"
    | "meals"
    | "preWorkoutMeal"
    | "postWorkoutMeal"
    | "diet"
    | "allergies"
    | "likedFoods"
  >,
  catalog: readonly Food[],
  seed = 0,
) {
  return buildExampleDay({
    target: profile.dailyTargetG,
    meals: profile.meals,
    preWorkoutMeal: profile.preWorkoutMeal,
    postWorkoutMeal: profile.postWorkoutMeal,
    foods: allowedFoods(catalog, restrictionsOf(profile)),
    preferred: new Set(profile.likedFoods),
    seed,
  });
}

export type SavePreferencesResult =
  { ok: true; day: StoredDay } | { ok: false; code: "liked_foods" };

/**
 * Formulário de boas-vindas e "As minhas preferências". A meta calcula-se aqui a partir do peso
 * (ou é a manual). Na primeira vez, o dia passa a ser o exemplo da pessoa; depois, o dia mantém-se
 * sem os itens que deixaram de caber (e volta ao exemplo se ficar vazio).
 */
export async function savePreferences(
  db: Db,
  userId: string,
  input: PreferencesInput,
  catalog: readonly Food[],
  foods: FoodIndex,
  now = Date.now(),
): Promise<SavePreferencesResult> {
  const restrictions: Restrictions = { diet: input.diet, allergies: input.allergies };
  const likedFoods = cleanLikedFoods(input.likedFoods, foods, restrictions);
  if (proteinCount(likedFoods, foods) < MIN_LIKED_PROTEINS)
    return { ok: false, code: "liked_foods" };

  const meals = sortMeals(input.meals);
  const training = normalizeTraining(meals, input.preWorkoutMeal, input.postWorkoutMeal);
  const manual = input.manualTargetG !== null;
  const dailyTargetG = manual
    ? input.manualTargetG!
    : dailyTarget(input.weightKg!, input.intensity);
  const weightKg = input.weightKg;
  const hasHealthData = weightKg !== null || input.allergies.length > 0;

  const previous = await loadProfile(db, userId);
  const values = {
    dailyTargetG,
    intensity: input.intensity,
    weightKg,
    manualTarget: manual,
    meals,
    preWorkoutMeal: training.preWorkoutMeal,
    postWorkoutMeal: training.postWorkoutMeal,
    diet: input.diet,
    allergies: [...input.allergies],
    likedFoods,
    equipment: [...input.equipment],
    cookMinutes: input.cookMinutes,
    healthConsentAt: hasHealthData ? (previous?.healthConsentAt ?? now) : null,
    onboardedAt: previous?.onboardedAt ?? now,
    updatedAt: now,
  };
  // O formulário não mexe nas calorias: ficam como estavam
  const profile: Profile = { ...values, showKcal: previous?.showKcal ?? false };

  const { items: current } = await loadItems(db, userId);
  const kept = previous?.onboardedAt ? itemsForProfile(current, profile, foods) : [];
  const items = kept.length > 0 ? kept : personalExampleDay(profile, catalog);
  const planId = await planIdFor(db, userId);

  await db.batch([
    db
      .insert(profiles)
      .values({ userId, locale: "pt", ...values })
      .onConflictDoUpdate({ target: profiles.userId, set: values }),
    ...replaceItemsQueries(db, userId, planId, items, now),
  ] as never);
  return { ok: true, day: await loadDay(db, userId) };
}

/** Regista o consentimento (versão dos termos) no primeiro login, antes do formulário. */
export async function recordConsent(db: Db, userId: string, now = Date.now()) {
  await db
    .insert(profiles)
    .values({
      userId,
      ...DEFAULT_PROFILE,
      diet: DEFAULT_DIET,
      equipment: [...DEFAULT_EQUIPMENT],
      cookMinutes: DEFAULT_COOK_MINUTES,
      consentVersion: CONSENT_VERSION,
      consentedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { consentVersion: CONSENT_VERSION, consentedAt: now },
    });
}

/**
 * "Mostrar calorias" no "Hoje". Só muda a preferência; devolve false se a pessoa ainda não tiver
 * perfil (a conta é criada no primeiro login, com o consentimento).
 */
export async function setShowKcal(
  db: Db,
  userId: string,
  show: boolean,
  now = Date.now(),
): Promise<boolean> {
  const updated = await db
    .update(profiles)
    .set({ showKcal: show, updatedAt: now })
    .where(eq(profiles.userId, userId))
    .returning({ userId: profiles.userId });
  return updated.length > 0;
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
      meal: recipes.meal,
      proteinPerServingG: recipes.proteinPerServingG,
      prepMinutes: recipes.prepMinutes,
      savedAt: savedRecipes.savedAt,
      favorite: savedRecipes.favorite,
    })
    .from(savedRecipes)
    .innerJoin(recipes, eq(recipes.id, savedRecipes.recipeId))
    .where(eq(savedRecipes.userId, userId))
    .orderBy(desc(savedRecipes.favorite), desc(savedRecipes.savedAt))
    .limit(100);
}

/** Favorita (as guardadas de que a pessoa mais gosta). Marcar como favorita também guarda. */
export async function setRecipeFavorite(
  db: Db,
  userId: string,
  recipeId: string,
  favorite: boolean,
  now = Date.now(),
): Promise<{ saved: boolean; favorite: boolean }> {
  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.id, recipeId));
  if (!recipe) return { saved: false, favorite: false };
  await db
    .insert(savedRecipes)
    .values({ userId, recipeId, savedAt: now, favorite })
    .onConflictDoUpdate({
      target: [savedRecipes.userId, savedRecipes.recipeId],
      set: { favorite },
    });
  return { saved: true, favorite };
}

export async function recipeStateFor(db: Db, userId: string, recipeId: string) {
  const [row] = await db
    .select({ favorite: savedRecipes.favorite })
    .from(savedRecipes)
    .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.recipeId, recipeId)));
  return { saved: Boolean(row), favorite: row?.favorite ?? false };
}

/* ------------------------------------------------------------ Histórico de receitas */

/** Quantas receitas recentes ficam no histórico de cada pessoa. */
export const RECIPE_HISTORY_MAX = 50;

/** Regista uma receita gerada (ou servida da cache) no histórico da pessoa. */
export async function recordRecipeHistory(
  db: Db,
  userId: string,
  recipeId: string,
  now = Date.now(),
): Promise<void> {
  await db
    .insert(userRecipes)
    .values({ userId, recipeId, createdAt: now })
    .onConflictDoUpdate({
      target: [userRecipes.userId, userRecipes.recipeId],
      set: { createdAt: now },
    });
  const keep = db
    .select({ id: userRecipes.recipeId })
    .from(userRecipes)
    .where(eq(userRecipes.userId, userId))
    .orderBy(desc(userRecipes.createdAt))
    .limit(RECIPE_HISTORY_MAX);
  await db
    .delete(userRecipes)
    .where(and(eq(userRecipes.userId, userId), notInArray(userRecipes.recipeId, keep)));
}

export async function listRecentRecipes(db: Db, userId: string, limit = 12) {
  return db
    .select({
      id: recipes.id,
      title: recipes.title,
      summary: recipes.summary,
      meal: recipes.meal,
      proteinPerServingG: recipes.proteinPerServingG,
      prepMinutes: recipes.prepMinutes,
      createdAt: userRecipes.createdAt,
    })
    .from(userRecipes)
    .innerJoin(recipes, eq(recipes.id, userRecipes.recipeId))
    .where(eq(userRecipes.userId, userId))
    .orderBy(desc(userRecipes.createdAt))
    .limit(limit);
}

/* ------------------------------------------------------------ Receita → dia */

export type ApplyRecipeResult = "ok" | "no_profile" | "not_found" | "not_allowed";

/**
 * "Usar no meu almoço": os alimentos dessa refeição passam a ser os de uma dose da receita (sem
 * a despensa e só o que a pessoa pode comer); a refeição fica ligada à receita.
 */
export async function applyRecipeToDay(
  db: Db,
  userId: string,
  recipeId: string,
  meal: Meal,
  foods: FoodIndex,
  now = Date.now(),
): Promise<ApplyRecipeResult> {
  return applyRecipesToDay(db, userId, [{ recipeId, meal }], foods, now);
}

/**
 * Várias receitas de uma vez (o dia completo): cada refeição passa a ter uma dose da sua receita,
 * numa só escrita. Falha tudo se alguma receita não existir, se uma refeição não for da pessoa ou se
 * uma receita não tiver nada que a pessoa possa comer.
 */
export async function applyRecipesToDay(
  db: Db,
  userId: string,
  pairs: readonly { recipeId: string; meal: Meal }[],
  foods: FoodIndex,
  now = Date.now(),
): Promise<ApplyRecipeResult> {
  const profile = await loadProfile(db, userId);
  if (!profile?.onboardedAt) return "no_profile";
  if (pairs.length === 0) return "not_allowed";
  if (pairs.some((p) => !profile.meals.includes(p.meal))) return "not_allowed";
  if (new Set(pairs.map((p) => p.meal)).size !== pairs.length) return "not_allowed";
  const ids = [...new Set(pairs.map((p) => p.recipeId))];
  const found = await db
    .select({ id: recipes.id, servings: recipes.servings })
    .from(recipes)
    .where(inArray(recipes.id, ids));
  if (found.length !== ids.length) return "not_found";
  const servingsOf = new Map(found.map((r) => [r.id, r.servings]));
  const ingredientRows = await db
    .select({
      recipeId: recipeIngredients.recipeId,
      foodId: recipeIngredients.foodId,
      grams: recipeIngredients.grams,
    })
    .from(recipeIngredients)
    .where(inArray(recipeIngredients.recipeId, ids))
    .orderBy(asc(recipeIngredients.recipeId), asc(recipeIngredients.position));
  const restrictions = restrictionsOf(profile);

  const { items } = await loadItems(db, userId);
  const meals = new Set(pairs.map((p) => p.meal));
  let next = items.filter((i) => !meals.has(i.meal));
  for (const { recipeId, meal } of pairs) {
    const fromRecipe = recipeToItems(
      ingredientRows.filter((i) => i.recipeId === recipeId),
      servingsOf.get(recipeId)!,
      meal,
      foods,
      (food) => isAllowed(food, restrictions),
    );
    if (fromRecipe.length === 0) return "not_allowed";
    next = fromRecipe.reduce((list, item) => addItem(list, item, crypto.randomUUID()), next);
  }
  const planId = await planIdFor(db, userId);
  await db.batch([
    ...replaceItemsQueries(db, userId, planId, itemsForProfile(next, profile, foods), now),
    ...pairs.map(({ recipeId, meal }) =>
      db
        .insert(mealRecipes)
        .values({ userId, meal, recipeId, usedAt: now })
        .onConflictDoUpdate({
          target: [mealRecipes.userId, mealRecipes.meal],
          set: { recipeId, usedAt: now },
        }),
    ),
  ] as never);
  return "ok";
}

/** A receita usada em cada refeição do dia (para o "Hoje"). */
export async function loadMealRecipes(
  db: Db,
  userId: string,
): Promise<Partial<Record<Meal, { id: string; title: string }>>> {
  const rows = await db
    .select({ meal: mealRecipes.meal, id: recipes.id, title: recipes.title })
    .from(mealRecipes)
    .innerJoin(recipes, eq(recipes.id, mealRecipes.recipeId))
    .where(eq(mealRecipes.userId, userId));
  return Object.fromEntries(rows.map((r) => [r.meal, { id: r.id, title: r.title }]));
}

/* ------------------------------------------------------------ Exportar dados */

const iso = (ms: number | null | undefined) => (ms ? new Date(ms).toISOString() : null);

/** Tudo o que a app guarda sobre a pessoa (RGPD: direito de acesso e portabilidade). */
export async function exportUserData(db: Db, userId: string) {
  const [account] = await db
    .select({ name: user.name, email: user.email, createdAt: user.createdAt })
    .from(user)
    .where(eq(user.id, userId));
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  const { items } = await loadItems(db, userId);
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
    profile: row
      ? {
          dailyTargetG: row.dailyTargetG,
          intensity: row.intensity,
          weightKg: row.weightKg,
          manualTarget: row.manualTarget,
          meals: row.meals,
          preWorkoutMeal: row.preWorkoutMeal,
          postWorkoutMeal: row.postWorkoutMeal,
          diet: row.diet,
          allergies: row.allergies,
          likedFoods: row.likedFoods,
          equipment: row.equipment,
          cookMinutes: row.cookMinutes,
          showKcal: row.showKcal,
          locale: row.locale,
          consentVersion: row.consentVersion,
          consentedAt: iso(row.consentedAt),
          healthConsentAt: iso(row.healthConsentAt),
          onboardedAt: iso(row.onboardedAt),
        }
      : null,
    day: items.map(({ meal, foodId, portionId, count }) => ({ meal, foodId, portionId, count })),
    recentRecipes: (await listRecentRecipes(db, userId, RECIPE_HISTORY_MAX)).map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: new Date(r.createdAt).toISOString(),
    })),
    mealRecipes: Object.entries(await loadMealRecipes(db, userId)).map(([meal, r]) => ({
      meal,
      recipeId: r.id,
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

/** O perfil que vai para o browser (sem datas internas). */
export function toClientProfile(profile: Profile): ClientProfile {
  const { onboardedAt, healthConsentAt, showKcal: _showKcal, ...rest } = profile;
  return { ...rest, onboarded: onboardedAt !== null, healthConsent: healthConsentAt !== null };
}
