import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { OpsCounts } from "@/domain/ops-metrics";
import { getDb } from "./db/client";
import { deferOps } from "./services/ops-counters";

/**
 * Conta no pedido atual (Route Handlers e Server Actions): soma em memória e grava depois da
 * resposta com o waitUntil do pedido; sem ExecutionContext, grava já. Nunca falha o pedido.
 */
export function countRequestOps(metrics: OpsCounts): void {
  try {
    const { ctx } = getCloudflareContext();
    const waitUntil =
      typeof ctx?.waitUntil === "function"
        ? (promise: Promise<unknown>) => ctx.waitUntil(promise)
        : undefined;
    deferOps({ db: getDb(), waitUntil }, metrics);
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "ops_counters_failed",
        name: err instanceof Error ? err.name : "unknown",
      }),
    );
  }
}

/**
 * Server Action com contadores: `actions.rejected` quando devolve uma recusa (`ok: false`: sessão,
 * validação, dono, perfil em falta) e `actions.error` quando lança uma exceção (que segue como
 * antes). O resultado e os argumentos não mudam.
 */
export function countedAction<Args extends unknown[], R extends { ok: boolean }>(
  action: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R> {
  return async (...args) => {
    let result: R;
    try {
      result = await action(...args);
    } catch (err) {
      countRequestOps({ "actions.error": 1 });
      throw err;
    }
    if (!result.ok) countRequestOps({ "actions.rejected": 1 });
    return result;
  };
}
