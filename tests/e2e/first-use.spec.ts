import { expect, test } from "@playwright/test";

/**
 * Critério de sucesso do MVP: uma pessoa nova chega a um dia que atinge a meta em menos de
 * 2 minutos, sem criar conta.
 */
test("primeira utilização: da landing a um dia que atinge a meta", async ({ page }) => {
  const started = Date.now();
  await page.goto("/");
  await page.getByRole("link", { name: "Calcular a minha meta" }).first().click();
  await expect(page).toHaveURL(/\/comecar$/);

  await page.getByLabel("Peso").fill("80");
  // "Treino intenso" e 4 refeições já vêm escolhidos
  await expect(page.getByText("160 g por dia")).toBeVisible();
  await page.getByRole("button", { name: "Vê como é fácil" }).click();

  await expect(page).toHaveURL(/\/o-meu-dia$/);
  await expect(page.getByRole("heading", { name: "O meu dia" })).toBeVisible();
  for (const meal of ["Pequeno-almoço", "Almoço", "Lanche", "Jantar"]) {
    await expect(page.getByRole("heading", { name: meal, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/Meta atingida/).first()).toBeVisible();
  expect(Date.now() - started).toBeLessThan(120_000);

  // O peso nunca sai do browser: fica só no localStorage
  const stored = await page.evaluate(() => localStorage.getItem("protein-plate:guest"));
  expect(JSON.parse(stored ?? "{}")).toMatchObject({ target: { grams: 160, weightKg: 80 } });
});

test("ajustar o dia: tirar porções mostra o que falta e uma sugestão fecha a meta", async ({
  page,
}) => {
  await page.goto("/comecar");
  await page.getByLabel("Peso").fill("80");
  await page.getByRole("button", { name: "Vê como é fácil" }).click();
  await expect(page.getByText(/Meta atingida/).first()).toBeVisible();

  // Tira o primeiro alimento do almoço até sair do dia
  const lunch = page.locator("#refeicao-almoco");
  const firstDecrease = lunch.getByRole("button", { name: /^(Menos meia porção|Tirar) / }).first();
  for (let i = 0; i < 8 && (await firstDecrease.isVisible()); i++) {
    const label = (await firstDecrease.getAttribute("aria-label")) ?? "";
    await firstDecrease.click();
    if (label.startsWith("Tirar")) break;
  }
  await expect(page.getByText(/^Faltam \d+ g\.$/).first()).toBeVisible();

  // Uma sugestão de um toque fecha a meta
  const suggestion = page
    .getByRole("region", { name: "Para fechar a meta" })
    .getByRole("button")
    .first();
  await suggestion.click();
  await expect(page.getByText(/Meta atingida/).first()).toBeVisible();
});

test("catálogo: snack sem preparação com mais proteína em 2 toques", async ({ page }) => {
  await page.goto("/alimentos");
  await page.getByRole("button", { name: "Lanche", exact: true }).click();
  await page.getByRole("button", { name: "Sem preparação", exact: true }).click();
  const first = page.getByRole("list", { name: "Alimentos" }).getByRole("link").first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/\/alimentos\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
