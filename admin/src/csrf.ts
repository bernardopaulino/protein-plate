import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { cookieName, cookieOptions } from "./cookies";
import type { AdminEnv } from "./types";

/**
 * Os formulários das ações (terminar sessões, apagar uma conta) contra pedidos forjados por
 * outros sítios, como no backoffice do Rejection Quest: o token do formulário tem de ser igual
 * ao do cookie (cookies.ts: `__Host-` em HTTPS, HttpOnly e SameSite=Strict), o pedido tem de
 * trazer a origem do próprio backoffice e o navegador não pode dizer que veio de outro sítio.
 */

/** O nome do cookie em http://localhost, onde o navegador não aceita o `__Host-`. */
export const CSRF_COOKIE_LOCAL = "pp-admin-csrf";
export const CSRF_COOKIE = `__Host-${CSRF_COOKIE_LOCAL}`;
export const CSRF_FIELD = "csrf";

/** 32 bytes aleatórios em base64url (43 caracteres). */
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** O token deste navegador para os formulários da página (cria o cookie, se faltar). */
export function csrfToken(c: Context<AdminEnv>): string {
  const name = cookieName(c, CSRF_COOKIE_LOCAL);
  const current = getCookie(c, name);
  if (current && TOKEN.test(current)) return current;
  const token = newToken();
  setCookie(c, name, token, cookieOptions(c));
  return token;
}

/** Comparação em tempo constante (o tamanho já é igual quando os dois passam no TOKEN). */
function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Um POST de formulário só vale se vier deste sítio, com o token certo. */
export function validCsrf(c: Context<AdminEnv>, formToken: unknown): boolean {
  const origin = c.req.header("Origin");
  if (!origin || origin !== new URL(c.req.url).origin) return false;
  const site = c.req.header("Sec-Fetch-Site");
  if (site !== undefined && site !== "same-origin") return false;
  const cookie = getCookie(c, cookieName(c, CSRF_COOKIE_LOCAL));
  return (
    typeof formToken === "string" &&
    cookie !== undefined &&
    TOKEN.test(cookie) &&
    TOKEN.test(formToken) &&
    sameToken(cookie, formToken)
  );
}
