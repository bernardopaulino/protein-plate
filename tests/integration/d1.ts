import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getPlatformProxy } from "wrangler";
import { FOODS, FOOD_DATA_VERSION } from "@/content/foods.generated";
import { user } from "@/server/db/auth-schema";
import { createDb, type Db } from "@/server/db/client-core";
import { toSeedSql } from "../../scripts/lib/generate";

const ROOT = join(import.meta.dirname, "..", "..");

/** Divide um ficheiro SQL em instruções (migrações do drizzle-kit e o seed). */
function statements(sql: string): string[] {
  return sql
    .split(/--> statement-breakpoint|;\s*\n/)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
}

export interface TestD1 {
  d1: D1Database;
  db: Db;
  dispose: () => Promise<void>;
}

/**
 * Uma D1 local real (workerd, via getPlatformProxy), em memória: migrações aplicadas e catálogo
 * carregado com o mesmo seed que vai para a D1.
 */
export async function createTestD1(): Promise<TestD1> {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: join(ROOT, "wrangler.jsonc"),
    persist: false,
  });
  const d1 = proxy.env.DB;
  const dir = join(ROOT, "migrations");
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    for (const statement of statements(readFileSync(join(dir, file), "utf8"))) {
      await d1.prepare(statement).run();
    }
  }
  await d1.batch(statements(toSeedSql(FOODS, FOOD_DATA_VERSION)).map((s) => d1.prepare(s)));
  return { d1, db: createDb(d1), dispose: () => proxy.dispose() };
}

let counter = 0;

/** Cria um utilizador (como o Better Auth faria) e devolve o id. */
export async function createUser(db: Db, name = "Pessoa"): Promise<string> {
  counter += 1;
  const id = `user-${counter}-${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(user).values({
    id,
    name,
    email: `${id}@example.test`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}
