import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as authSchema from "./auth-schema";
import * as appSchema from "./schema";

export const schema = { ...appSchema, ...authSchema };
export type Db = DrizzleD1Database<typeof schema>;

/** Cliente Drizzle a partir de um binding D1 (o pedido, o cron e os testes). */
export function createDb(d1: D1Database): Db {
  return drizzle(d1, { schema });
}
