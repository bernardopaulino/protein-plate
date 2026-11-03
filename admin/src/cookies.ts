import type { Context } from "hono";
import type { AdminEnv } from "./types";

/**
 * Os cookies do backoffice (o token dos formulários e o aviso depois de uma ação). Em HTTPS (o
 * backoffice publicado) levam o prefixo `__Host-` (só HTTPS, só este endereço, sem Domain), e só
 * esses contam. Em http://localhost (desenvolvimento, já só com a entrada local) o navegador
 * recusa-os, por isso lá vão sem o prefixo nem o Secure. Sempre HttpOnly e SameSite=Strict.
 */

export const isHttps = (c: Context<AdminEnv>) => new URL(c.req.url).protocol === "https:";

/** O nome do cookie neste pedido: `__Host-<nome>` em HTTPS, só o nome em http. */
export function cookieName(c: Context<AdminEnv>, name: string): string {
  return isHttps(c) ? `__Host-${name}` : name;
}

export function cookieOptions(c: Context<AdminEnv>) {
  return {
    path: "/",
    secure: isHttps(c),
    httpOnly: true,
    sameSite: "Strict",
  } as const;
}
