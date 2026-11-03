import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { expect, type BrowserContext, type Page } from "@playwright/test";

const ROOT = join(import.meta.dirname, "..", "..", "..");

/** Sessão guardada pelo setup (pessoa com o formulário concluído). */
export const ONBOARDED_STATE = join(ROOT, "tests", "e2e", ".auth", "onboarded.json");

/**
 * Entra sem passar pelo Google: cria a pessoa e uma sessão na D1 local (scripts/dev-session.ts) e
 * põe o cookie assinado no browser. `fresh` apaga o perfil, para o formulário aparecer de novo.
 */
export async function signIn(
  context: BrowserContext,
  baseURL: string,
  email: string,
  { fresh = false } = {},
) {
  const out = execFileSync(
    "npx",
    ["tsx", "--env-file=.dev.vars", "scripts/dev-session.ts", email, ...(fresh ? ["--fresh"] : [])],
    { cwd: ROOT, encoding: "utf8", shell: process.platform === "win32" },
  );
  const { name, value } = JSON.parse(out.trim().split("\n").at(-1)!) as {
    name: string;
    value: string;
  };
  await context.addCookies([{ name, value, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

/** Preenche o formulário de boas-vindas com o mínimo (80 kg, 4 refeições, aves e ovos). */
export async function completeOnboarding(page: Page) {
  await page.goto("/comecar");
  await page.getByLabel("Peso").fill("80");
  // O resultado ao vivo prova que a página já está hidratada
  await expect(page.getByText("160", { exact: true })).toBeVisible();
  const next = page.getByRole("button", { name: "Continuar" });
  await next.click();
  await expect(page.getByRole("heading", { name: "Como é o teu dia?" })).toBeVisible();
  await next.click();
  await expect(page.getByRole("heading", { name: "Há alguma coisa que não comes?" })).toBeVisible();
  await next.click();
  await expect(page.getByRole("heading", { name: "Do que gostas?" })).toBeVisible();
  await expect(page.getByText(/Escolhe pelo menos 3 fontes de proteína/)).toBeVisible();
  await page.getByRole("button", { name: "Escolher todos: Aves" }).click();
  await page.getByRole("button", { name: "Escolher todos: Ovos" }).click();
  await expect(page.getByText(/Escolhe pelo menos 3 fontes de proteína/)).toBeHidden();
  await next.click();
  await expect(page.getByRole("heading", { name: "E na cozinha?" })).toBeVisible();
  await next.click();
  await expect(page.getByRole("heading", { name: "O teu plano está pronto" })).toBeVisible();
  await page.getByLabel(/Autorizo o Protein Plate/).check();
  await page.getByRole("button", { name: "Criar o meu plano" }).click();
  await expect(page).toHaveURL(/\/o-meu-dia$/, { timeout: 20_000 });
  await expect(page.getByText(/Meta atingida/).first()).toBeVisible();
}
