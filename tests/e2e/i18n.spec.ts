import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("inglês em /en: textos, lang, hreflang e o seletor de idioma", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Protein without the diet.");
  await expect(page.locator('link[rel="alternate"][hreflang="pt-PT"]')).toHaveAttribute(
    "href",
    "https://protein-plate.app",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://protein-plate.app/en",
  );

  // O catálogo e o detalhe também em inglês, e o seletor leva à mesma página em português
  await page.goto("/en/alimentos/ovo");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Egg");
  await page.getByRole("link", { name: "Português" }).click();
  await expect(page).toHaveURL(/\/alimentos\/ovo$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ovo");
});

test("sem sessão, as páginas da app em inglês levam ao /en/entrar", async ({ page }) => {
  await page.goto("/en/receitas/nova");
  await expect(page).toHaveURL(/\/en\/entrar\?next=%2Freceitas%2Fnova$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
