"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import {
  DEFAULT_PROFILE,
  importGuestDataSchema,
  profileInputSchema,
  savePlanInputSchema,
} from "@/domain/contracts/account";
import { FOOD_INDEX } from "@/features/catalog/catalog";
import { CONSENT_COOKIE, CONSENT_COOKIE_MAX_AGE } from "../auth/config";
import { getSession } from "../auth/session";
import { getDb } from "../db/client";
import { getEnv } from "../env";
import {
  exportUserData,
  importGuestData,
  isRecipeSaved,
  listSavedRecipes,
  loadDay,
  recordConsent,
  saveDay,
  setRecipeSaved,
  type ImportOutcome,
  type StoredDay,
} from "../services/account";

// Server Actions: o user ID vem sempre da sessão; tudo o que chega do cliente passa por Zod.

type Result<T> = { ok: true; data: T } | { ok: false; code: "unauthorized" | "invalid" };

const unauthorized = { ok: false, code: "unauthorized" } as const;
const invalid = { ok: false, code: "invalid" } as const;

/** O dia sincronizado; owner é a conta dona da cópia local (tem de ser a da sessão). */
const syncDaySchema = z
  .object({
    owner: z.string().min(1).max(64),
    profile: profileInputSchema,
    items: savePlanInputSchema.shape.items,
  })
  .strict();

/** Ecrã "Criar conta": regista que a pessoa aceitou os termos (cookie curto lido pelo Better Auth). */
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

/** O dia guardado na conta (para a cópia local). */
export async function loadDayAction(): Promise<Result<StoredDay>> {
  const session = await getSession();
  if (!session) return unauthorized;
  return { ok: true, data: await loadDay(getDb(), session.user.id) };
}

/** Guarda meta, refeições e o dia (chamado pelo AccountSync, com debounce). Sem peso. */
export async function syncDayAction(input: unknown): Promise<Result<null>> {
  const session = await getSession();
  if (!session) return unauthorized;
  const parsed = syncDaySchema.safeParse(input);
  if (!parsed.success) return invalid;
  // Uma cópia local de outra conta (aparelho partilhado) nunca escreve nesta
  if (parsed.data.owner !== session.user.id) return unauthorized;
  await saveDay(getDb(), session.user.id, parsed.data, FOOD_INDEX);
  return { ok: true, data: null };
}

/** /conta/bem-vindo: consentimento (contas novas) e importação do estado de convidado. */
export async function importGuestDataAction(input: unknown): Promise<Result<ImportOutcome>> {
  const session = await getSession();
  if (!session) return unauthorized;
  const parsed = importGuestDataSchema.safeParse(input);
  if (!parsed.success) return invalid;
  const db = getDb();
  const jar = await cookies();
  if (jar.get(CONSENT_COOKIE)) {
    await recordConsent(db, session.user.id, parsed.data.profile);
    jar.delete(CONSENT_COOKIE);
  }
  const outcome = await importGuestData(db, session.user.id, parsed.data, FOOD_INDEX);
  return { ok: true, data: outcome };
}

/** Conta nova sem estado de convidado: regista o consentimento com uma meta por defeito. */
export async function ensureConsentAction(): Promise<Result<null>> {
  const session = await getSession();
  if (!session) return unauthorized;
  const jar = await cookies();
  if (jar.get(CONSENT_COOKIE)) {
    await recordConsent(getDb(), session.user.id, DEFAULT_PROFILE);
    jar.delete(CONSENT_COOKIE);
  }
  return { ok: true, data: null };
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
