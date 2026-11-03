import { expect, test } from "@playwright/test";
import { ONBOARDED_STATE, completeOnboarding, signIn } from "./support/auth";

test.use({ storageState: ONBOARDED_STATE });

test("gerar uma receita (modelo simulado) a partir de uma refeição do dia", async ({ page }) => {
  await page.goto("/o-meu-dia");
  await expect(page.getByRole("heading", { name: "O meu dia" })).toBeVisible();

  const meal = page
    .locator("section[id^='refeicao-']")
    .filter({ has: page.getByRole("link", { name: "Gerar receita com estes alimentos" }) })
    .first();
  await meal.getByRole("link", { name: "Gerar receita com estes alimentos" }).click();
  await expect(page).toHaveURL(/\/receitas\/nova\?/);
  await expect(page.getByRole("heading", { name: "Nova receita" })).toBeVisible();

  const submit = page.getByRole("button", { name: "Gerar receita" });
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page).toHaveURL(/\/receitas\/[0-9a-zA-Z]{10}$/, { timeout: 20_000 });
  await expect(page.getByText("por dose").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ingredientes" })).toBeVisible();
  await expect(page.getByText(/Gerada por IA/)).toBeVisible();

  // A página da receita abre sem conta e tem cache pública longa
  const response = await page.request.get(page.url(), { headers: { cookie: "" } });
  expect(response.headers()["cache-control"]).toContain("public");
});

test.describe("conta própria (o limite é de 5 receitas por minuto por conta)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("gerar sem escolher alimentos e depois com alimentos escolhidos por grupos", async ({
    context,
    page,
    baseURL,
  }, testInfo) => {
    await signIn(context, baseURL!, `receitas-${testInfo.project.name}@protein-plate.local`, {
      fresh: true,
    });
    await completeOnboarding(page);

    // Sem escolher nada: a app escolhe a base
    await page.goto("/receitas/nova");
    await expect(page.getByRole("heading", { name: "Nova receita" })).toBeVisible();
    await page.getByRole("button", { name: "Gerar receita" }).click();
    await expect(page).toHaveURL(/\/receitas\/[0-9a-zA-Z]{10}$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Ingredientes" })).toBeVisible();

    // Com um alimento escolhido pelos grupos
    await page.goto("/receitas/nova");
    await page.getByRole("button", { name: "Quero usar alimentos que tenho" }).click();
    await page.getByRole("radio", { name: /^Legumes/ }).click();
    await page.getByRole("button", { name: /^Brócolos e couves/ }).click();
    await page
      .getByRole("list", { name: "Brócolos e couves" })
      .getByRole("button", { name: /^Brócolos/ })
      .first()
      .click();
    await expect(page.getByText("1 de 6")).toBeVisible();
    await page.getByRole("button", { name: "Gerar receita" }).click();
    await expect(page).toHaveURL(/\/receitas\/[0-9a-zA-Z]{10}$/, { timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Brócolos" }).first()).toBeVisible();
  });
});

test("sem sessão, gerar receitas pede para entrar", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/receitas/nova");
  await expect(page).toHaveURL(/\/entrar\?next=%2Freceitas%2Fnova$/);
  const response = await page.request.post("/api/recipes", {
    data: { foodIds: ["ovo", "tomate"], meal: "almoco", maxMinutes: 20, servings: 1, locale: "pt" },
  });
  expect(response.status()).toBe(401);
  await context.close();
});
