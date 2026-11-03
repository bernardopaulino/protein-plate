import type { Context, MiddlewareHandler } from "hono";
import {
  AUD_TAG,
  TEAM_DOMAIN,
  accessKeySource,
  issuerFor,
  verifyAccessJwt,
  type KeySource,
} from "./access";
import { messagePage } from "./layout";
import type { AdminEnv } from "./types";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function deny(c: Context<AdminEnv>) {
  return c.html(messagePage("Sem acesso", "Esta página não está disponível."), 403);
}

/** Os emails autorizados, em minúsculas (vazios e espaços não contam). */
export function allowedEmails(list: string | undefined): Set<string> {
  return new Set(
    (list ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Todos os pedidos passam por aqui (incluindo o CSS, o ícone e as páginas de erro). Fecha por
 * defeito: sem configuração completa, sem token, com um token inválido ou com um email fora da
 * lista, recusa. O motivo nunca vai para a resposta nem para os registos.
 * `getKeys` só existe para os testes darem chaves suas; no Worker vêm da equipa do Access.
 */
export function requireAccess(getKeys?: KeySource): MiddlewareHandler<AdminEnv> {
  return async (c, next) => {
    const env = c.env;

    // Desenvolvimento local: só com a variável da configuração local e só a pedidos a localhost
    if (env.ADMIN_DEV_BYPASS === "1") {
      if (!LOCAL_HOSTS.has(new URL(c.req.url).hostname)) return deny(c);
      c.set("adminEmail", "local");
      return next();
    }

    const team = env.ACCESS_TEAM_DOMAIN ?? "";
    const audience = env.ACCESS_AUD ?? "";
    const allowed = allowedEmails(env.ADMIN_EMAILS);
    if (!TEAM_DOMAIN.test(team) || !AUD_TAG.test(audience) || allowed.size === 0) {
      return c.html(
        messagePage(
          "Backoffice por configurar",
          "Falta a configuração do Cloudflare Access neste ambiente.",
        ),
        503,
      );
    }

    const token = c.req.header("Cf-Access-Jwt-Assertion");
    if (!token) return deny(c);
    try {
      const { email } = await verifyAccessJwt(token, {
        issuer: issuerFor(team),
        audience,
        getKeys: getKeys ?? accessKeySource(team),
      });
      if (!allowed.has(email)) return deny(c);
      c.set("adminEmail", email);
    } catch {
      return deny(c);
    }
    return next();
  };
}
