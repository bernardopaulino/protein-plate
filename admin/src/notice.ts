import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { cookieName, cookieOptions } from "./cookies";
import { flash } from "./layout";
import type { AdminEnv } from "./types";

/**
 * O aviso depois de uma ação (POST, 303, GET): vai num cookie de uso único (cookies.ts) que só
 * um POST válido cria, e nunca no endereço, para um link de fora não conseguir mostrar um aviso
 * falso. Leva só o tipo do aviso, a conta e o número de sessões, de uma lista fechada; dura um
 * minuto e sai na primeira página que o lê.
 */

export const NOTICE_COOKIE = "pp-admin-notice";

export type Notice = { kind: "sessions"; userId: string; count: number } | { kind: "deleted" };

const VALUE = /^(?:sessions\.(\d{1,4})\.([A-Za-z0-9_-]{1,64})|(deleted))$/;

function encode(notice: Notice): string {
  return notice.kind === "sessions" ? `sessions.${notice.count}.${notice.userId}` : "deleted";
}

function decode(value: string): Notice | null {
  const m = VALUE.exec(value);
  if (!m) return null;
  if (m[1] && m[2]) return { kind: "sessions", count: Number(m[1]), userId: m[2] };
  return m[3] ? { kind: "deleted" } : null;
}

function text(notice: Notice): string {
  if (notice.kind === "deleted") return "Conta apagada, com todos os dados.";
  if (notice.count === 0) return "A conta não tinha sessões ativas.";
  return notice.count === 1 ? "1 sessão terminada." : `${notice.count} sessões terminadas.`;
}

/** Guarda o aviso para a página a seguir ao redirecionamento. */
export function setNotice(c: Context<AdminEnv>, notice: Notice): void {
  setCookie(c, cookieName(c, NOTICE_COOKIE), encode(notice), {
    ...cookieOptions(c),
    maxAge: 60,
  });
}

/**
 * O aviso desta página (HTML), se houver um para ela: o das sessões só na ficha dessa conta, o
 * da conta apagada só na lista. Lê-o uma vez e apaga-o.
 */
export function takeNotice(c: Context<AdminEnv>, page: { userId: string } | "users"): string {
  const name = cookieName(c, NOTICE_COOKIE);
  const value = getCookie(c, name);
  if (value === undefined) return "";
  deleteCookie(c, name, cookieOptions(c));
  const notice = decode(value);
  if (!notice) return "";
  const forThisPage =
    notice.kind === "deleted"
      ? page === "users"
      : page !== "users" && page.userId === notice.userId;
  return forThisPage ? flash(text(notice)) : "";
}
