import { lt, sql } from "drizzle-orm";
import { opsDay, type OpsCounts } from "../../domain/ops-metrics";
import type { Db } from "../db/client-core";
import { opsCounters } from "../db/schema";

/**
 * Contadores diários do funcionamento, para o backoffice (nomes em src/domain/ops-metrics.ts): só
 * nomes e totais por dia, gravados depois da resposta (waitUntil), num só batch com o que estiver
 * pendente. Os que podem vir em rajadas sem custo para quem pede (4xx do login, ações recusadas)
 * ficam em memória e gravam-se no máximo uma vez por minuto por isolate: um ciclo de pedidos
 * inválidos não enche a D1 de escritas. Os outros (receitas, erros do servidor) gravam-se logo: com
 * pouco tráfego, um isolate pode morrer sem outro pedido que grave o que ficou em memória. Uma
 * falha a gravá-los nunca afeta o pedido. Sem `server-only`: o cron também usa este módulo.
 */

/** Quantos dias ficam os contadores (o cron apaga os mais antigos). */
export const OPS_RETENTION_DAYS = 90;

/** Só com contadores de BATCHED: no máximo uma gravação por isolate neste intervalo. */
export const OPS_FLUSH_INTERVAL_MS = 60_000;

/** Os contadores que esperam pelo intervalo (podem vir em rajadas de pedidos sem sessão). */
export const BATCHED: ReadonlySet<string> = new Set([
  "auth.400",
  "auth.401",
  "auth.403",
  "auth.404",
  "auth.413",
  "auth.429",
  "actions.rejected",
]);

const DAY_MS = 86_400_000;

/** Onde gravar: a D1 do pedido e o waitUntil dele (sem ExecutionContext, grava já). */
export interface OpsTarget {
  db: Db;
  waitUntil?: (promise: Promise<unknown>) => void;
}

/** O que ainda não foi gravado neste isolate: dia → nome → total. */
const pending = new Map<string, Map<string, number>>();
let lastFlushAt = 0;

/** Soma as linhas (dia, nome) na D1 (upsert: uma linha por dia e por nome), num só batch. */
async function writeOps(
  db: Db,
  rows: { day: string; metric: string; count: number }[],
): Promise<void> {
  const upserts = rows
    .filter((r) => r.count > 0)
    .map((r) =>
      db
        .insert(opsCounters)
        .values(r)
        .onConflictDoUpdate({
          target: [opsCounters.day, opsCounters.metric],
          set: { count: sql`${opsCounters.count} + excluded.count` },
        }),
    );
  const [first, ...rest] = upserts;
  if (first) await db.batch([first, ...rest]);
}

/** Soma os contadores do dia e grava-os já (fora dos pedidos, ex.: testes). */
export async function countOps(db: Db, metrics: OpsCounts, now = Date.now()): Promise<void> {
  const day = opsDay(now);
  await writeOps(
    db,
    Object.entries(metrics).map(([metric, count]) => ({ day, metric, count })),
  );
}

/** Grava o que está pendente neste isolate e esvazia-o. */
export async function flushOps(db: Db): Promise<void> {
  const rows = [...pending].flatMap(([day, metrics]) =>
    [...metrics].map(([metric, count]) => ({ day, metric, count })),
  );
  pending.clear();
  await writeOps(db, rows);
}

/**
 * Soma em memória e grava tudo o que está pendente depois da resposta: já, se houver um contador
 * fora de BATCHED; senão, no máximo uma vez por minuto (waitUntil; sem ExecutionContext, a escrita
 * arranca já, sem esperar por ela).
 */
export function deferOps(target: OpsTarget, metrics: OpsCounts, now = Date.now()): void {
  const day = opsDay(now);
  const forDay = pending.get(day) ?? new Map<string, number>();
  for (const [metric, n] of Object.entries(metrics)) {
    if (n > 0) forDay.set(metric, (forDay.get(metric) ?? 0) + n);
  }
  pending.set(day, forDay);
  const urgent = Object.entries(metrics).some(
    ([metric, n]) => (n ?? 0) > 0 && !BATCHED.has(metric),
  );
  if (!urgent && now - lastFlushAt < OPS_FLUSH_INTERVAL_MS) return;
  lastFlushAt = now;
  const write = flushOps(target.db).catch((err: unknown) => {
    // Só o nome: a mensagem de um erro da D1 pode trazer os parâmetros da consulta
    console.error(
      JSON.stringify({
        level: "error",
        msg: "ops_counters_failed",
        name: err instanceof Error ? err.name : "unknown",
      }),
    );
  });
  target.waitUntil?.(write);
}

/** Para a limpeza de hora a hora: os dias que já passaram do prazo. */
export function expiredOpsRows(db: Db, now: number) {
  return db
    .delete(opsCounters)
    .where(lt(opsCounters.day, opsDay(now - OPS_RETENTION_DAYS * DAY_MS)));
}
