import type { D1Migration } from "cloudflare:test";

declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[]; // só existe nos testes (admin/vitest.config.ts)
    }
  }
}
