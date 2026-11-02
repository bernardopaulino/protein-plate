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
    const response = await app.fetch(request, env, ctx);
    return withTransportSecurity(request, response);
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
