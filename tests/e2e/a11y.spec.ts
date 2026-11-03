import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ONBOARDED_STATE, signIn } from "./support/auth";

/** Páginas abertas a toda a gente. */
const PUBLIC_PAGES = [
  "/",
  "/entrar",
  "/alimentos",
  "/alimentos/skyr-natural",
  "/privacidade",
  "/termos",
];
/** Páginas com login (pessoa com o plano feito). */
const APP_PAGES = ["/o-meu-dia", "/receitas", "/receitas/nova", "/conta", "/conta/preferencias"];

async function expectNoViolations(page: Page) {
  await page.waitForLoadState("load");
  // Com prefers-reduced-motion, o motion ainda faz fades de opacidade: espera que acabem (o axe
  // mediria o contraste a meio)
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity),
  );
  await page.waitForTimeout(400);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`acessibilidade (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    for (const path of PUBLIC_PAGES) {
      test(`${path}: sem violações WCAG 2.2 AA`, async ({ page }) => {
        await page.goto(path);
        await expectNoViolations(page);
      });
    }

    test("/comecar (formulário de boas-vindas): sem violações WCAG 2.2 AA", async ({
      context,
      page,
      baseURL,
    }) => {
      await signIn(context, baseURL!, `a11y-${scheme}@protein-plate.local`, { fresh: true });
      await page.goto("/comecar");
      await expectNoViolations(page);
    });

    test.describe("com login", () => {
      test.use({ storageState: ONBOARDED_STATE });
      for (const path of APP_PAGES) {
        test(`${path}: sem violações WCAG 2.2 AA`, async ({ page }) => {
          await page.goto(path);
          await expectNoViolations(page);
        });
      }
    });
  });
}

test.describe("sem scroll horizontal", () => {
  test.use({ storageState: ONBOARDED_STATE });
  test("nas páginas principais", async ({ page }) => {
    for (const path of [...PUBLIC_PAGES, ...APP_PAGES]) {
      await page.goto(path);
      await page.waitForLoadState("load");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
