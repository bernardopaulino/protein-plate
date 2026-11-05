/**
 * Worker próprio (custom worker do OpenNext): valida as variáveis antes de servir qualquer pedido
 * dinâmico e corre a limpeza de hora a hora (cron em wrangler.jsonc).
 */
// O ficheiro só existe depois do build do OpenNext (@ts-expect-error falharia depois do build)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { default as openNext } from "../.open-next/worker.js";
import { InvalidEnvError, parseEnv } from "../src/lib/env";
import { createDb } from "../src/server/db/client-core";
import { cleanUpExpiredRows } from "../src/server/services/cleanup";

const app = openNext as Required<Pick<ExportedHandler<CloudflareEnv>, "fetch">>;

const HSTS = "max-age=63072000; includeSubDomains";

/** HSTS só em HTTPS (em http://localhost o browser ficaria preso ao HTTPS). */
function withTransportSecurity(request: Request, response: Response): Response {
  if (new URL(request.url).protocol !== "https:") return response;
  const secured = new Response(response.body, response);
  secured.headers.set("Strict-Transport-Security", HSTS);
  return secured;
}

const RECIPE_PAGE = /^(\/en)?\/receitas\/[0-9a-zA-Z]{6,20}\/?$/;

/**
 * As receitas são imutáveis e a página não tem nada da pessoa: cache pública longa (só o HTML;
 * os pedidos RSC do router variam por cabeçalhos e ficam de fora).
 */
function withRecipeCache(request: Request, response: Response): Response {
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    response.status !== 200 ||
    !RECIPE_PAGE.test(url.pathname) ||
    url.searchParams.has("_rsc") ||
    request.headers.has("RSC")
  ) {
    return response;
  }
  const cached = new Response(response.body, response);
  cached.headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400",
  );
  return cached;
}

/**
 * Fora da produção (staging), nada vai para o Google: robots.txt fecha tudo e cada resposta leva
 * X-Robots-Tag: noindex (o canonical já aponta para a produção; isto evita o conteúdo duplicado).
 */
function blockedOutsideProduction(request: Request, env: CloudflareEnv): Response | null {
  if (env.APP_ENV === "production" || new URL(request.url).pathname !== "/robots.txt") return null;
  return new Response("User-agent: *\nDisallow: /\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}

function withNoIndex(env: CloudflareEnv, response: Response): Response {
  if (env.APP_ENV === "production") return response;
  const hidden = new Response(response.body, response);
  hidden.headers.set("X-Robots-Tag", "noindex, nofollow");
  return hidden;
}

const handler: ExportedHandler<CloudflareEnv> = {
  async fetch(request, env, ctx) {
    try {
      parseEnv(env);
    } catch (err) {
      // O Worker não arranca sem segredos válidos (só os nomes das variáveis vão para os registos)
      const fields = err instanceof InvalidEnvError ? err.fields : ["unknown"];
      console.error(JSON.stringify({ level: "error", msg: "env_invalid", fields }));
      return new Response("Service unavailable", { status: 503 });
    }
    const blocked = blockedOutsideProduction(request, env);
    if (blocked) return withTransportSecurity(request, blocked);
    const response = await app.fetch(request, env, ctx);
    return withTransportSecurity(request, withNoIndex(env, withRecipeCache(request, response)));
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      cleanUpExpiredRows(createDb(env.DB)).catch((err: unknown) => {
        console.error(
          JSON.stringify({
            level: "error",
            msg: "cleanup_failed",
            name: err instanceof Error ? err.name : "unknown",
          }),
        );
      }),
    );
  },
};

export default handler;
