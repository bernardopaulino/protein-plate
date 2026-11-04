"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { addToDayInputSchema, saveDayInputSchema } from "@/domain/contracts/account";
import { mealSchema, slugSchema } from "@/domain/contracts/common";
import type { Meal } from "@/domain/meals";
import { isAllowed } from "@/domain/preferences";
import { preferencesInputSchema } from "@/domain/contracts/profile";
import { CATALOG, FOOD_INDEX } from "@/features/catalog/catalog";
import { CONSENT_COOKIE, CONSENT_COOKIE_MAX_AGE } from "../auth/config";
import { getSession } from "../auth/session";
import { getDb } from "../db/client";
import { getEnv } from "../env";
import { countedAction } from "../ops";
import {
  addDayItem,
  applyRecipeToDay,
  listRecentRecipes,
  recipeStateFor,
  setRecipeFavorite,
  exportUserData,
  loadProfile,
  recordConsent,
  restrictionsOf,
  saveDayItems,
  savePreferences,
  setRecipeSaved,
} from "../services/account";

// Server Actions: o user ID vem sempre da sessão; tudo o que chega do cliente passa por Zod.
// Todas passam por `countedAction` (contadores do funcionamento: recusas e exceções).

type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: "unauthorized" | "invalid" | "liked_foods" | "no_profile" | "not_allowed" | "not_found";
    };

const unauthorized = { ok: false, code: "unauthorized" } as const;
const invalid = { ok: false, code: "invalid" } as const;

/** "Entrar": ao continuar, a pessoa aceita os termos (cookie curto lido pelo Better Auth). */
export const acceptTermsAction = countedAction(async (input: unknown): Promise<Result<null>> => {
  const parsed = z
    .object({ accepted: z.literal(true) })
    .strict()
    .safeParse(input);
  if (!parsed.success) return invalid;
  const env = getEnv();
  (await cookies()).set(CONSENT_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.BETTER_AUTH_URL.startsWith("https://"),
    path: "/",
    maxAge: CONSENT_COOKIE_MAX_AGE,
  });
  return { ok: true, data: null };
});

/**
 * /conta/bem-vindo, depois do login: regista o consentimento (contas novas) e diz se a pessoa já
 * concluiu o formulário de boas-vindas.
 */
export const welcomeAction = countedAction(async (): Promise<Result<{ onboarded: boolean }>> => {
  const session = await getSession();
  if (!session) return unauthorized;
  const db = getDb();
  const jar = await cookies();
  if (jar.get(CONSENT_COOKIE)) {
    await recordConsent(db, session.user.id);
    jar.delete(CONSENT_COOKIE);
  }
  const profile = await loadProfile(db, session.user.id);
  return { ok: true, data: { onboarded: Boolean(profile?.onboardedAt) } };
});

/** Guarda o dia do "Hoje" (com debounce no browser). */
export const saveDayAction = countedAction(async (input: unknown): Promise<Result<null>> => {
  const session = await getSession();
  if (!session) return unauthorized;
  const parsed = saveDayInputSchema.safeParse(input);
  if (!parsed.success) return invalid;
  const saved = await saveDayItems(getDb(), session.user.id, parsed.data.items, FOOD_INDEX);
  return saved ? { ok: true, data: null } : { ok: false, code: "no_profile" };
});

export type AddToDayContext =
  | { signedIn: false }
  | { signedIn: true; onboarded: false }
  | { signedIn: true; onboarded: true; meals: Meal[]; allowed: boolean };

/** "Adicionar ao meu dia" no detalhe de um alimento (página pública): as refeições da pessoa. */
export const addToDayContextAction = countedAction(
  async (input: unknown): Promise<Result<AddToDayContext>> => {
    const parsed = z.object({ foodId: slugSchema }).strict().safeParse(input);
    if (!parsed.success) return invalid;
    const session = await getSession();
    if (!session) return { ok: true, data: { signedIn: false } };
    const profile = await loadProfile(getDb(), session.user.id);
    if (!profile?.onboardedAt) return { ok: true, data: { signedIn: true, onboarded: false } };
    const food = FOOD_INDEX.get(parsed.data.foodId);
    return {
      ok: true,
      data: {
        signedIn: true,
        onboarded: true,
        meals: profile.meals,
        allowed: Boolean(food && isAllowed(food, restrictionsOf(profile))),
      },
    };
  },
);

export const addToDayAction = countedAction(async (input: unknown): Promise<Result<null>> => {
  const session = await getSession();
  if (!session) return unauthorized;
  const parsed = addToDayInputSchema.safeParse(input);
  if (!parsed.success) return invalid;
  const result = await addDayItem(getDb(), session.user.id, parsed.data, FOOD_INDEX);
  return result === "ok" ? { ok: true, data: null } : { ok: false, code: result };
});

/** Formulário de boas-vindas e "As minhas preferências". */
export const savePreferencesAction = countedAction(
  async (input: unknown): Promise<Result<null>> => {
    const session = await getSession();
    if (!session) return unauthorized;
    const parsed = preferencesInputSchema.safeParse(input);
    if (!parsed.success) return invalid;
    const result = await savePreferences(
      getDb(),
      session.user.id,
      parsed.data,
      CATALOG,
      FOOD_INDEX,
    );
    return result.ok ? { ok: true, data: null } : { ok: false, code: result.code };
  },
);

const recipeIdSchema = z.string().regex(/^[0-9a-zA-Z]{6,20}$/);

export const setRecipeSavedAction = countedAction(
  async (input: unknown): Promise<Result<boolean>> => {
    const session = await getSession();
    if (!session) return unauthorized;
    const parsed = z
      .object({ recipeId: recipeIdSchema, saved: z.boolean() })
      .strict()
      .safeParse(input);
    if (!parsed.success) return invalid;
    const saved = await setRecipeSaved(
      getDb(),
      session.user.id,
      parsed.data.recipeId,
      parsed.data.saved,
    );
    return { ok: true, data: saved };
  },
);

export type RecipeState =
  | { signedIn: false }
  | {
      signedIn: true;
      saved: boolean;
      favorite: boolean;
      /** Refeições da pessoa (vazio sem o formulário concluído) para "Usar no meu dia". */
      meals: Meal[];
    };

/** O estado de uma receita para quem a vê (a página é pública e igual para toda a gente). */
export const recipeStateAction = countedAction(
  async (input: unknown): Promise<Result<RecipeState>> => {
    const parsed = z.object({ recipeId: recipeIdSchema }).strict().safeParse(input);
    if (!parsed.success) return invalid;
    const session = await getSession();
    if (!session) return { ok: true, data: { signedIn: false } };
    const db = getDb();
    const [state, profile] = await Promise.all([
      recipeStateFor(db, session.user.id, parsed.data.recipeId),
      loadProfile(db, session.user.id),
    ]);
    return {
      ok: true,
      data: { signedIn: true, ...state, meals: profile?.onboardedAt ? profile.meals : [] },
    };
  },
);

export const setRecipeFavoriteAction = countedAction(
  async (input: unknown): Promise<Result<{ saved: boolean; favorite: boolean }>> => {
    const session = await getSession();
    if (!session) return unauthorized;
    const parsed = z
      .object({ recipeId: recipeIdSchema, favorite: z.boolean() })
      .strict()
      .safeParse(input);
    if (!parsed.success) return invalid;
    return {
      ok: true,
      data: await setRecipeFavorite(
        getDb(),
        session.user.id,
        parsed.data.recipeId,
        parsed.data.favorite,
      ),
    };
  },
);

/** "Usar no meu almoço": os alimentos da refeição passam a ser os da receita. */
export const applyRecipeToDayAction = countedAction(
  async (input: unknown): Promise<Result<null>> => {
    const session = await getSession();
    if (!session) return unauthorized;
    const parsed = z
      .object({ recipeId: recipeIdSchema, meal: mealSchema })
      .strict()
      .safeParse(input);
    if (!parsed.success) return invalid;
    const result = await applyRecipeToDay(
      getDb(),
      session.user.id,
      parsed.data.recipeId,
      parsed.data.meal,
      FOOD_INDEX,
    );
    return result === "ok" ? { ok: true, data: null } : { ok: false, code: result };
  },
);

export const listRecentRecipesAction = countedAction(
  async (): Promise<Result<Awaited<ReturnType<typeof listRecentRecipes>>>> => {
    const session = await getSession();
    if (!session) return unauthorized;
    return { ok: true, data: await listRecentRecipes(getDb(), session.user.id) };
  },
);

export const exportDataAction = countedAction(
  async (): Promise<Result<Awaited<ReturnType<typeof exportUserData>>>> => {
    const session = await getSession();
    if (!session) return unauthorized;
    return { ok: true, data: await exportUserData(getDb(), session.user.id) };
  },
);
