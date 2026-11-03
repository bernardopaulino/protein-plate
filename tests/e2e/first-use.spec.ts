import { expect, test } from "@playwright/test";
import { ONBOARDED_STATE, completeOnboarding, signIn } from "./support/auth";

test("sem sessão, a app pede para entrar e volta depois", async ({ page }) => {
  await page.goto("/o-meu-dia");
  await expect(page).toHaveURL(/\/entrar\?next=%2Fo-meu-dia$/);
  await expect(page.getByRole("heading", { name: "Entra para começar" })).toBeVisible();
  // A página inicial e o catálogo continuam abertos
  await page.goto("/alimentos");
  await expect(page).toHaveURL(/\/alimentos$/);
});

/**
 * Critério de sucesso do MVP: depois de entrar, uma pessoa nova chega a um dia que atinge a meta,
 * com os alimentos de que gosta, em menos de 2 minutos.
 */
test("primeira utilização: entrar → formulário de boas-vindas → um dia que atinge a meta", async ({
  context,
  page,
  baseURL,
}) => {
  await signIn(context, baseURL!, "primeira@protein-plate.local", { fresh: true });
  const started = Date.now();
  await page.goto("/o-meu-dia");
  // Sem o formulário concluído, a app leva-o para lá primeiro
  await expect(page).toHaveURL(/\/comecar$/);
  await completeOnboarding(page);

  for (const meal of ["Pequeno-almoço", "Almoço", "Lanche", "Jantar"]) {
    await expect(page.getByRole("heading", { name: meal, exact: true })).toBeVisible();
  }
  expect(Date.now() - started).toBeLessThan(120_000);
  // Depois de concluído, /comecar já não aparece
  await page.goto("/comecar");
  await expect(page).toHaveURL(/\/o-meu-dia$/);
});

test.describe("com o plano feito", () => {
  test.use({ storageState: ONBOARDED_STATE });

  test("ajustar o dia: tirar porções mostra o que falta e uma sugestão fecha a meta", async ({
    page,
  }) => {
    await page.goto("/o-meu-dia");
    await expect(page.getByRole("heading", { name: "O meu dia" })).toBeVisible();
    const close = page.getByRole("region", { name: "Para fechar a meta" });

    // Tira alimentos do almoço até faltar proteína
    const lunch = page.locator("#refeicao-almoco");
    const decrease = lunch.getByRole("button", { name: /^(Menos meia porção|Tirar) / }).first();
    const missing = page.getByText(/^Faltam \d+ g\.$/).first();
    for (let i = 0; i < 12 && !(await missing.isVisible()); i++) {
      if (!(await decrease.isVisible())) break;
      await decrease.click();
    }
    await expect(missing).toBeVisible();

    // Uma sugestão de um toque fecha a meta
    await close.getByRole("button").first().click();
    await expect(page.getByText(/Meta atingida/).first()).toBeVisible();
  });

  test("as preferências abrem o mesmo formulário com o que está guardado", async ({ page }) => {
    await page.goto("/conta");
    await page.getByRole("link", { name: /As minhas preferências/ }).click();
    await expect(page).toHaveURL(/\/conta\/preferencias$/);
    await expect(page.getByRole("heading", { name: "Quanto pesas?" })).toBeVisible();
    await expect(page.getByLabel("Peso")).toHaveValue("80");
  });
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
