import { expect, test } from "@playwright/test";

test("gerar uma receita (modelo simulado) a partir de uma refeição do dia", async ({ page }) => {
  await page.goto("/comecar");
  await page.getByLabel("Peso").fill("80");
  await page.getByRole("button", { name: "Vê como é fácil" }).click();
  await expect(page.getByText(/Meta atingida/).first()).toBeVisible();

  // Acrescenta um segundo alimento ao almoço, se for preciso, para poder gerar receita
  const lunch = page.locator("#refeicao-almoco");
  await lunch.getByRole("link", { name: "Gerar receita com estes alimentos" }).click();
  await expect(page).toHaveURL(/\/receitas\/nova\?/);
  await expect(page.getByRole("heading", { name: "Nova receita" })).toBeVisible();

  const submit = page.getByRole("button", { name: "Gerar receita" });
  // O Turnstile (chave de teste) desbloqueia o botão para convidados
  await expect(submit).toBeEnabled({ timeout: 20_000 });
  await submit.click();

  await expect(page).toHaveURL(/\/receitas\/[0-9a-zA-Z]{10}$/, { timeout: 20_000 });
  await expect(page.getByText("por dose").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ingredientes" })).toBeVisible();
  await expect(page.getByText(/Gerada por IA/)).toBeVisible();

  // A página da receita abre sem conta e tem cache pública longa
  const response = await page.request.get(page.url());
  expect(response.headers()["cache-control"]).toContain("public");
});
