import "server-only";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getDb } from "../db/client";
import { loadProfile, type Profile } from "../services/account";
import { getSession, type AppSession } from "./session";

/** Caminhos internos aceites em `?next=` (nunca um endereço de fora). */
export function safeNext(value: unknown, fallback = "/o-meu-dia"): string {
  if (typeof value !== "string") return fallback;
  return /^\/(?!\/)[a-z0-9\-/]*$/.test(value) && value.length <= 80 ? value : fallback;
}

/** Páginas com login: sem sessão, vai para /entrar (e volta aqui depois). */
export async function requireSession(locale: Locale, next: string): Promise<AppSession> {
  const session = await getSession();
  if (!session) {
    redirect({ href: `/entrar?next=${encodeURIComponent(safeNext(next))}`, locale });
  }
  return session!;
}

/**
 * Páginas da app: login e formulário de boas-vindas concluído. Sem perfil concluído, vai para
 * /comecar antes de tudo o resto.
 */
export async function requireProfile(
  locale: Locale,
  next: string,
): Promise<{ session: AppSession; profile: Profile }> {
  const session = await requireSession(locale, next);
  const profile = await loadProfile(getDb(), session.user.id);
  if (!profile?.onboardedAt) redirect({ href: "/comecar", locale });
  return { session, profile: profile! };
}
