import { expect, test } from "@playwright/test";
import { ONBOARDED_STATE } from "./support/auth";

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
