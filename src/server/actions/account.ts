"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { syncDayInputSchema } from "@/domain/contracts/account";
import { preferencesInputSchema } from "@/domain/contracts/profile";
import { CATALOG, FOOD_INDEX } from "@/features/catalog/catalog";
import { CONSENT_COOKIE, CONSENT_COOKIE_MAX_AGE } from "../auth/config";
import { getSession } from "../auth/session";
import { getDb } from "../db/client";
import { getEnv } from "../env";
import {
  exportUserData,
  isRecipeSaved,
  listSavedRecipes,
  loadDay,
  recordConsent,
  saveDayItems,
  savePreferences,
  setRecipeSaved,
  type StoredDay,
} from "../services/account";

// Server Actions: o user ID vem sempre da sessão; tudo o que chega do cliente passa por Zod.

type Result<T> =
  { ok: true; data: T } | { ok: false; code: "unauthorized" | "invalid" | "liked_foods" };

const unauthorized = { ok: false, code: "unauthorized" } as const;
const invalid = { ok: false, code: "invalid" } as const;

/** "Entrar": ao continuar, a pessoa aceita os termos (cookie curto lido pelo Better Auth). */
export async function acceptTermsAction(input: unknown): Promise<Result<null>> {
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
}

/**
 * /conta/bem-vindo, depois do login: regista o consentimento (contas novas) e devolve o dia
 * guardado. Sem o formulário de boas-vindas concluído, `profile.onboardedAt` vem a null.
 */
export async function welcomeAction(): Promise<Result<StoredDay>> {
  const session = await getSession();
  if (!session) return unauthorized;
  const db = getDb();
  const jar = await cookies();
  if (jar.get(CONSENT_COOKIE)) {
    await recordConsent(db, session.user.id);
    jar.delete(CONSENT_COOKIE);
  }
  return { ok: true, data: await loadDay(db, session.user.id) };
}

/** O dia guardado na conta (para a cópia local). */
export async function loadDayAction(): Promise<Result<StoredDay>> {
  const session = await getSession();
  if (!session) return unauthorized;
  return { ok: true, data: await loadDay(getDb(), session.user.id) };
}

/** Guarda o dia (chamado pelo AccountSync, com debounce). */
export async function syncDayAction(input: unknown): Promise<Result<null>> {
  const session = await getSession();
  if (!session) return unauthorized;
  const parsed = syncDayInputSchema.safeParse(input);
  if (!parsed.success) return invalid;
  // Uma cópia local de outra conta (aparelho partilhado) nunca escreve nesta
  if (parsed.data.owner !== session.user.id) return unauthorized;
  const saved = await saveDayItems(getDb(), session.user.id, parsed.data.items, FOOD_INDEX);
  return saved ? { ok: true, data: null } : invalid;
}

/** Formulário de boas-vindas e "As minhas preferências". */
export async function savePreferencesAction(input: unknown): Promise<Result<StoredDay>> {
  const session = await getSession();
  if (!session) return unauthorized;
  const parsed = preferencesInputSchema.safeParse(input);
  if (!parsed.success) return invalid;
  const result = await savePreferences(getDb(), session.user.id, parsed.data, CATALOG, FOOD_INDEX);
  return result.ok ? { ok: true, data: result.day } : { ok: false, code: result.code };
}

const recipeIdSchema = z.string().regex(/^[0-9a-zA-Z]{6,20}$/);

export async function setRecipeSavedAction(input: unknown): Promise<Result<boolean>> {
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
}

export async function recipeSavedStateAction(
  input: unknown,
): Promise<Result<{ signedIn: boolean; saved: boolean }>> {
  const parsed = z.object({ recipeId: recipeIdSchema }).strict().safeParse(input);
  if (!parsed.success) return invalid;
  const session = await getSession();
  if (!session) return { ok: true, data: { signedIn: false, saved: false } };
  return {
    ok: true,
    data: {
      signedIn: true,
      saved: await isRecipeSaved(getDb(), session.user.id, parsed.data.recipeId),
    },
  };
}

export async function listSavedRecipesAction(): Promise<
  Result<Awaited<ReturnType<typeof listSavedRecipes>>>
> {
  const session = await getSession();
  if (!session) return unauthorized;
  return { ok: true, data: await listSavedRecipes(getDb(), session.user.id) };
}

export async function exportDataAction(): Promise<
  Result<Awaited<ReturnType<typeof exportUserData>>>
> {
  const session = await getSession();
  if (!session) return unauthorized;
  return { ok: true, data: await exportUserData(getDb(), session.user.id) };
}
