import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client-core";
import { usageCounters } from "../db/schema";
import { utcDay } from "./cleanup";

const encoder = new TextEncoder();

async function hmacHex(key: string | ArrayBuffer, message: string): Promise<string> {
  const raw = typeof key === "string" ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Chave de quota: HMAC com uma chave diária derivada de IP_HASH_SECRET e da data. O IP (ou o id do
 * utilizador) nunca é guardado; no dia seguinte as chaves já não se ligam às de ontem.
 */
export async function quotaKey(secret: string, subject: string, now = Date.now()): Promise<string> {
  const dailyKey = await hmacHex(secret, `quota:${utcDay(now)}`);
  return hmacHex(dailyKey, subject);
}

export const GLOBAL_KEY = "global";

export async function usageCount(db: Db, key: string, now = Date.now()): Promise<number> {
  const [row] = await db
    .select({ count: usageCounters.count })
    .from(usageCounters)
    .where(and(eq(usageCounters.keyHash, key), eq(usageCounters.day, utcDay(now))));
  return row?.count ?? 0;
}

/** Conta uma receita nova na chave da pessoa e no total do dia (uma ida à D1). */
export async function countUsage(db: Db, keys: readonly string[], now = Date.now()): Promise<void> {
  const day = utcDay(now);
  await db.batch(
    keys.map((keyHash) =>
      db
        .insert(usageCounters)
        .values({ keyHash, day, count: 1 })
        .onConflictDoUpdate({
          target: [usageCounters.keyHash, usageCounters.day],
          set: { count: sql`${usageCounters.count} + 1` },
        }),
    ) as unknown as Parameters<Db["batch"]>[0],
  );
}
