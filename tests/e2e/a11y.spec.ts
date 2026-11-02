import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = [
  "/",
  "/comecar",
  "/alimentos",
  "/alimentos/skyr-natural",
  "/o-meu-dia",
  "/receitas",
  "/receitas/nova",
  "/conta",
  "/conta/criar",
  "/privacidade",
  "/termos",
];

/** Um dia já criado, para o ecrã "Hoje" ter conteúdo. */
async function withDay(page: Page) {
  await page.goto("/comecar");
  await page.locator("form[data-hydrated]").waitFor();
  await page.getByLabel("Peso").fill("80");
  await page.getByRole("button", { name: "Vê como é fácil" }).click();
  await expect(page.getByText(/Meta atingida/).first()).toBeVisible();
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`acessibilidade (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    for (const path of PAGES) {
      test(`${path}: sem violações WCAG 2.2 AA`, async ({ page }) => {
        if (path === "/o-meu-dia") await withDay(page);
        await page.goto(path);
        await page.waitForLoadState("load");
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          // O widget do Turnstile é um iframe de terceiros
          .exclude('iframe[src*="challenges.cloudflare.com"]')
          .analyze();
        expect(
          results.violations.map(
            (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
          ),
        ).toEqual([]);
      });
    }
  });
}

test("sem scroll horizontal nas páginas principais", async ({ page }) => {
  await withDay(page);
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForLoadState("load");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
