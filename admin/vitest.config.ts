import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Testes do backoffice, no runtime dos Workers com a configuração do admin e uma D1 local real
// (corre a partir da raiz do repo: npm run admin:test), como no Rejection Quest. As migrações da
// app aplicam-se antes de cada ficheiro (test/apply-migrations.ts); cada ficheiro tem a sua base
export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations");
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./admin/wrangler.jsonc" },
        miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
      }),
    ],
    test: {
      include: ["admin/test/**/*.test.ts"],
      setupFiles: ["./admin/test/apply-migrations.ts"],
    },
  };
});
