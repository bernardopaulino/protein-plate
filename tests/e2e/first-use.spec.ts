import AxeBuilder from "@axe-core/playwright";
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

test("o dia vive na conta: as mudanças ficam depois de recarregar e noutro browser", async ({
  browser,
  context,
  page,
  baseURL,
}) => {
  // Duas sessões novas (subprocessos) e o formulário inteiro: um fluxo longo, mais tempo
  test.setTimeout(60_000);
  const email = "guardar@protein-plate.local";
  await signIn(context, baseURL!, email, { fresh: true });
  await completeOnboarding(page);

  const firstRow = () =>
    page.locator("#refeicao-pequeno-almoco").getByRole("listitem").first().locator("p").nth(1);
  const before = await firstRow().innerText();
  await page
    .locator("#refeicao-pequeno-almoco")
    .getByRole("button", { name: /^Mais meia porção/ })
    .first()
    .click();
  await expect(firstRow()).not.toHaveText(before);
  const after = await firstRow().innerText();
  await expect(page.getByText("Guardado na tua conta.")).toBeVisible();

  await page.reload();
  await expect(firstRow()).toHaveText(after);

  // Outro browser (sem nada guardado localmente) vê o mesmo dia
  const other = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  await signIn(other, baseURL!, email);
  const second = await other.newPage();
  await second.goto("/o-meu-dia");
  await expect(
    second.locator("#refeicao-pequeno-almoco").getByRole("listitem").first().locator("p").nth(1),
  ).toHaveText(after);
  await other.close();
});

test("adicionar ao meu dia a partir do catálogo", async ({ context, page, baseURL }) => {
  // Sem sessão, explica que é preciso entrar
  await page.goto("/alimentos/skyr-natural");
  await expect(page.getByRole("link", { name: "Entrar", exact: true })).toBeVisible();

  await signIn(context, baseURL!, "catalogo@protein-plate.local", { fresh: true });
  await completeOnboarding(page);
  await page.goto("/alimentos/skyr-natural");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByText(/^Adicionado a /)).toBeVisible();
  await page.getByRole("link", { name: "Ver o meu dia" }).click();
  await expect(page.getByRole("link", { name: "Skyr natural" }).first()).toBeVisible();
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

    // Com as sugestões à vista, o axe também passa (o nome de cada uma começa pelo texto visível)
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);

    // Uma sugestão de um toque fecha a meta
    await close.getByRole("button").first().click();
    await expect(page.getByText(/Meta atingida/).first()).toBeVisible();
  });

  test("calorias: desligadas por defeito, ligam-se no dia e ficam na conta", async ({ page }) => {
    await page.goto("/o-meu-dia");
    const toggle = page.getByRole("switch", { name: "Calorias" });
    const dayKcal = page.getByText(/^≈ [\d\s.,]+ kcal com estes alimentos$/);
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(dayKcal).toHaveCount(0);

    const savedOn = page.waitForResponse(
      (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/o-meu-dia",
    );
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await savedOn;
    await expect(dayKcal).toBeVisible();
    await expect(
      page
        .locator("#refeicao-almoco")
        .getByText(/^≈ [\d\s.,]+ kcal$/)
        .first(),
    ).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);

    // Fica guardado na conta: depois de recarregar continua ligado; desliga-se para os outros testes
    await page.reload();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    // O interruptor muda logo no ecrã; espera que a Server Action grave antes de recarregar
    const saved = page.waitForResponse(
      (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/o-meu-dia",
    );
    await toggle.click();
    await expect(dayKcal).toHaveCount(0);
    await saved;
    await page.reload();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  test("as preferências abrem o mesmo formulário com o que está guardado", async ({ page }) => {
    await page.goto("/conta");
    await page.getByRole("link", { name: /As minhas preferências/ }).click();
    await expect(page).toHaveURL(/\/conta\/preferencias$/);
    await expect(page.getByRole("heading", { name: "Quanto pesas?" })).toBeVisible();
    await expect(page.getByLabel("Peso")).toHaveValue("80");
  });
});

test("catálogo: grupos, snack sem preparação com mais proteína e pesquisa", async ({ page }) => {
  await page.goto("/alimentos");
  await page.getByLabel("Refeição").selectOption({ label: "Lanche" });
  await page.getByLabel("Preparação").selectOption({ label: "Sem preparação" });
  await page.getByRole("radio", { name: /^Proteína/ }).click();
  // Agrupado por subgrupo, os de mais proteína primeiro
  const first = page.getByRole("region").first().getByRole("link").first();
  await expect(first).toBeVisible();

  // A pesquisa procura em tudo
  await page.getByLabel("Procurar").fill("skyr");
  await expect(
    page.getByRole("list", { name: "Resultados da pesquisa" }).getByRole("link"),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Limpar a pesquisa" }).click();

  await first.click();
  await expect(page).toHaveURL(/\/alimentos\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
