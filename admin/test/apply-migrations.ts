import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// Corre antes de cada ficheiro de teste; as migrações já aplicadas são ignoradas
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
