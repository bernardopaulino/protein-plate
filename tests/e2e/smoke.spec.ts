import { expect, test } from "@playwright/test";

test("a landing abre em português de Portugal", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Proteína sem dieta.");
  await expect(page.getByRole("link", { name: "Calcular a minha meta" }).first()).toBeVisible();
});

test("o Worker responde com a D1 e a IA simulada", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body).toMatchObject({ ok: true, ai: "mock:ok" });
  expect(body.foods).toBeGreaterThan(0);
});
