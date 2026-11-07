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
  "/en",
  "/en/alimentos/skyr-natural",
];
/** Páginas com login (pessoa com o plano feito). */
const APP_PAGES = [
  "/o-meu-dia",
  "/receitas",
  "/receitas/nova",
  "/receitas/dia",
  "/conta",
  "/conta/preferencias",
  "/en/o-meu-dia",
  "/en/receitas/nova",
];

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

/** Telemóvel pequeno, tablet ao alto e deitado, portátil e ecrã grande. */
const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
];

test.describe("responsive", () => {
  test.use({ storageState: ONBOARDED_STATE });

  test("sem scroll horizontal nas páginas principais", async ({ page }) => {
    for (const path of [...PUBLIC_PAGES, ...APP_PAGES]) {
      await page.goto(path);
      await page.waitForLoadState("load");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("de 320 px a 2560 px: sem scroll horizontal e o conteúdo usa a largura", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "os tamanhos são definidos aqui");
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      for (const path of ["/", "/alimentos", "/o-meu-dia", "/receitas", "/receitas/nova"]) {
        await page.goto(path);
        await page.waitForLoadState("load");
        const { overflow, main, width, culprits } = await page.evaluate(() => {
          const limit = document.documentElement.clientWidth;
          // Os elementos que passam da margem direita (para a mensagem de erro dizer qual é)
          const culprits = [...document.querySelectorAll("body *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.right > limit + 0.5;
            })
            .slice(0, 5)
            .map(
              (el) =>
                `<${el.tagName.toLowerCase()} class="${String(el.getAttribute("class")).slice(0, 60)}"> right=${Math.round(el.getBoundingClientRect().right)} "${(el.textContent ?? "").trim().slice(0, 40)}"`,
            );
          return {
            overflow: document.documentElement.scrollWidth - limit,
            main: document.querySelector("main")!.getBoundingClientRect().width,
            width: limit,
            culprits,
          };
        });
        expect(
          overflow,
          [`${path} a ${viewport.width}px`, ...culprits].join("\n"),
        ).toBeLessThanOrEqual(0);
        // Até 1280 px o conteúdo ocupa a largura toda; acima, a coluna cresce até 1440 px
        expect(main, `${path} a ${viewport.width}px`).toBeGreaterThanOrEqual(
          Math.min(width, 1280) - 1,
        );
      }
    }
  });
});
