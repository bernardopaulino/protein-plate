import { defineConfig, devices } from "@playwright/test";

const PORT = 8787;
const serve = `npx wrangler dev --port ${PORT} --log-level warn`;

/**
 * E2E contra o Worker local (o mesmo build que vai para produção). Na CI o build vem do job
 * anterior (PLAYWRIGHT_SKIP_BUILD=1); em local, faz o build do OpenNext antes.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  // Um só worker: os testes com login partilham a pessoa do setup (e o dia dela)
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "pt-PT",
    // Sem animações: o motion e o CSS respeitam prefers-reduced-motion
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    // Entra sem o Google (sessão na D1 local) e conclui o formulário uma vez
    { name: "setup", testMatch: /global.setup.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, dependencies: ["setup"] },
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
  ],
  webServer: {
    command: process.env.PLAYWRIGHT_SKIP_BUILD
      ? serve
      : `npx opennextjs-cloudflare build && ${serve}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
