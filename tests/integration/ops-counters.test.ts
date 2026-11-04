import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { opsDay } from "@/domain/ops-metrics";
import { opsCounters } from "@/server/db/schema";
import { cleanUpExpiredRows } from "@/server/services/cleanup";
import { OPS_FLUSH_INTERVAL_MS, countOps } from "@/server/services/ops-counters";
import { createTestD1, type TestD1 } from "./d1";

// O contexto da Cloudflare do pedido (D1 e waitUntil), para os contadores das rotas e ações
const cf = vi.hoisted(() => ({
  context: null as null | {
    env: { DB: D1Database };
    ctx: { waitUntil: (promise: Promise<unknown>) => void };
  },
}));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => {
    if (!cf.context) throw new Error("sem contexto");
    return cf.context;
  },
}));

let t: TestD1;
beforeAll(async () => {
  t = await createTestD1();
});
afterAll(async () => {
  await t?.dispose();
});
beforeEach(async () => {
  cf.context = null;
  await t.db.delete(opsCounters);
});

const DAY_MS = 86_400_000;

/** Os contadores gravados de um dia, por nome. */
async function rowsOf(day: string): Promise<Record<string, number>> {
  const rows = await t.db.select().from(opsCounters);
  return Object.fromEntries(rows.filter((r) => r.day === day).map((r) => [r.metric, r.count]));
}

/** Módulos novos: o que está pendente e a hora da última gravação são por isolate. */
async function freshModules() {
  vi.resetModules();
  return {
    service: await import("@/server/services/ops-counters"),
    request: await import("@/server/ops"),
  };
}

describe("ops_counters: gravação", () => {
  it("countOps soma no mesmo dia e nome (upsert) e separa os dias", async () => {
    const now = Date.UTC(2026, 10, 4, 12);
    await countOps(t.db, { "recipes.ok.new": 2, "recipes.retry": 1 }, now);
    await countOps(t.db, { "recipes.ok.new": 3, "recipes.ok.cached": 0 }, now);
    await countOps(t.db, { "recipes.ok.new": 1 }, now + DAY_MS);
    expect(await rowsOf("2026-11-04")).toEqual({ "recipes.ok.new": 5, "recipes.retry": 1 });
    expect(await rowsOf("2026-11-05")).toEqual({ "recipes.ok.new": 1 });
  });

  it("deferOps junta os 4xx em memória e grava-os no máximo uma vez por minuto, num só batch", async () => {
    const { service } = await freshModules();
    const writes: Promise<unknown>[] = [];
    const target = { db: t.db, waitUntil: (p: Promise<unknown>) => void writes.push(p) };
    const start = Date.UTC(2026, 10, 4, 10);
    const day = opsDay(start);

    // A primeira do isolate grava logo
    service.deferOps(target, { "auth.401": 1 }, start);
    expect(writes).toHaveLength(1);
    await Promise.all(writes);
    expect(await rowsOf(day)).toEqual({ "auth.401": 1 });

    // Dentro do intervalo, só 4xx e ações recusadas: só em memória
    service.deferOps(target, { "auth.401": 1, "actions.rejected": 1 }, start + 1_000);
    service.deferOps(target, { "actions.rejected": 2 }, start + OPS_FLUSH_INTERVAL_MS - 1);
    expect(writes).toHaveLength(1);
    expect(await rowsOf(day)).toEqual({ "auth.401": 1 });

    // Passado o intervalo: tudo o que estava pendente, de uma vez
    service.deferOps(target, { "auth.429": 1 }, start + OPS_FLUSH_INTERVAL_MS);
    expect(writes).toHaveLength(2);
    await Promise.all(writes);
    expect(await rowsOf(day)).toEqual({ "auth.401": 2, "actions.rejected": 3, "auth.429": 1 });
  });

  it("uma receita ou um erro do servidor grava logo, com o que estava pendente", async () => {
    const { service } = await freshModules();
    const writes: Promise<unknown>[] = [];
    const target = { db: t.db, waitUntil: (p: Promise<unknown>) => void writes.push(p) };
    const start = Date.UTC(2026, 10, 6, 10);
    const day = opsDay(start);
    service.deferOps(target, { "auth.401": 1 }, start);
    service.deferOps(target, { "auth.401": 1 }, start + 1_000);
    expect(writes).toHaveLength(1);
    // Dentro do intervalo, mas uma receita nova: grava já, com o 401 pendente
    service.deferOps(target, { "recipes.ok.new": 1 }, start + 2_000);
    expect(writes).toHaveLength(2);
    await Promise.all(writes);
    expect(await rowsOf(day)).toEqual({ "auth.401": 2, "recipes.ok.new": 1 });
  });

  it("deferOps sem waitUntil grava já; uma falha da D1 não chega a quem conta", async () => {
    const { service } = await freshModules();
    const now = Date.UTC(2026, 10, 4, 11);
    service.deferOps({ db: t.db }, { "recipes.5xx": 1 }, now);
    await vi.waitFor(async () => expect(await rowsOf(opsDay(now))).toEqual({ "recipes.5xx": 1 }));

    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = Object.assign(new Error("D1 em baixo: parâmetros da consulta"), {
      name: "D1Error",
    });
    // A mesma D1, mas o batch falha
    const broken: typeof t.db = Object.assign(Object.create(t.db) as typeof t.db, {
      batch: () => Promise.reject(failure),
    });
    const writes: Promise<unknown>[] = [];
    service.deferOps(
      { db: broken, waitUntil: (p) => void writes.push(p) },
      { "recipes.5xx": 1 },
      now + OPS_FLUSH_INTERVAL_MS,
    );
    await Promise.all(writes);
    expect(errors).toHaveBeenCalledWith(expect.stringContaining('"name":"D1Error"'));
    expect(errors).not.toHaveBeenCalledWith(expect.stringContaining("parâmetros"));
    errors.mockRestore();
  });

  it("o cron apaga só os dias com mais de 90 dias", async () => {
    const now = Date.UTC(2026, 10, 4, 3);
    for (const daysAgo of [0, 89, 90, 91, 400]) {
      await countOps(t.db, { "recipes.ok.new": 1 }, now - daysAgo * DAY_MS);
    }
    await cleanUpExpiredRows(t.db, now);
    const days = (await t.db.select({ day: opsCounters.day }).from(opsCounters))
      .map((r) => r.day)
      .sort();
    expect(days).toEqual([opsDay(now - 90 * DAY_MS), opsDay(now - 89 * DAY_MS), opsDay(now)]);
  });
});

describe("ops_counters: pedidos e Server Actions", () => {
  it("countRequestOps usa a D1 e o waitUntil do pedido; sem contexto não falha", async () => {
    const { service, request } = await freshModules();
    const writes: Promise<unknown>[] = [];
    cf.context = { env: { DB: t.d1 }, ctx: { waitUntil: (p) => void writes.push(p) } };
    request.countRequestOps({ "auth.404": 1 });
    expect(writes).toHaveLength(1);
    await Promise.all(writes);
    request.countRequestOps({ "auth.404": 1 });
    await service.flushOps(t.db);
    expect(await rowsOf(opsDay(Date.now()))).toEqual({ "auth.404": 2 });

    cf.context = null;
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => request.countRequestOps({ "auth.404": 1 })).not.toThrow();
    expect(errors).toHaveBeenCalledWith(expect.stringContaining("ops_counters_failed"));
    errors.mockRestore();
  });

  it("countedAction conta as recusas e as exceções sem mudar o resultado", async () => {
    const { service, request } = await freshModules();
    const writes: Promise<unknown>[] = [];
    cf.context = { env: { DB: t.d1 }, ctx: { waitUntil: (p) => void writes.push(p) } };
    const action = request.countedAction(async (input: number) =>
      input > 0 ? { ok: true as const, data: input } : { ok: false as const, code: "invalid" },
    );
    const failing = request.countedAction(async (): Promise<{ ok: true }> => {
      throw new RangeError("inesperado");
    });

    expect(await action(2)).toEqual({ ok: true, data: 2 });
    expect(await action(-1)).toEqual({ ok: false, code: "invalid" });
    await expect(failing()).rejects.toThrow("inesperado");
    await Promise.all(writes);
    await service.flushOps(t.db);
    expect(await rowsOf(opsDay(Date.now()))).toEqual({
      "actions.rejected": 1,
      "actions.error": 1,
    });
  });
});
