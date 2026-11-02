import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { parseEnv, type AppEnv } from "@/lib/env";

/** Bindings do pedido atual (D1, rate limiting, assets). */
export function getBindings(): CloudflareEnv {
  return getCloudflareContext().env;
}

/** Variáveis validadas com Zod (o Worker já recusou arrancar se forem inválidas). */
export function getEnv(): AppEnv {
  return parseEnv(getBindings());
}
