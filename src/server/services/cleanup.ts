import { lt } from "drizzle-orm";
import { rateLimit, session, verification } from "../db/auth-schema";
import type { Db } from "../db/client-core";
import { usageCounters } from "../db/schema";
import { expiredOpsRows } from "./ops-counters";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** AAAA-MM-DD (UTC) */
export function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * Limpeza de hora a hora (cron): sessões e verificações expiradas, linhas do rate limiting do
 * Better Auth com mais de uma hora, contadores de quotas com mais de 2 dias e contadores do
 * funcionamento com mais de 90 dias.
 */
export async function cleanUpExpiredRows(db: Db, now = Date.now()): Promise<void> {
  await db.batch([
    db.delete(session).where(lt(session.expiresAt, new Date(now))),
    db.delete(verification).where(lt(verification.expiresAt, new Date(now))),
    db.delete(rateLimit).where(lt(rateLimit.lastRequest, now - HOUR_MS)),
    db.delete(usageCounters).where(lt(usageCounters.day, utcDay(now - 2 * DAY_MS))),
    expiredOpsRows(db, now),
  ]);
}
