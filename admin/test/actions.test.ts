import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminApp } from "../src/app";
import { CSRF_COOKIE, CSRF_COOKIE_LOCAL } from "../src/csrf";
import { NOTICE_COOKIE } from "../src/notice";
import {
  DAY,
  NOW,
  ORIGIN,
  countRows,
  html,
  localBindings,
  resetDb,
  seedDayPlan,
  seedProfile,
  seedRecipe,
  seedMealRecipe,
  seedRequested,
  seedSaved,
  seedUser,
} from "./seed";

const app = () => createAdminApp();

/** Uma conta com linhas em todas as tabelas que o apagar tem de limpar. */
async function seedAccount(id: string, email: string): Promise<void> {
  await seedUser({
    id,
    email,
    providers: ["google", "apple"],
    sessions: [{ createdAt: NOW - DAY }, { createdAt: NOW - 2 * DAY }],
  });
  await seedProfile({ userId: id, allergies: ["milk"], weightKg: 70, healthConsentAt: NOW });
  await seedDayPlan(id, ["ovo", "tofu-firme", "skyr-natural"]);
  await seedSaved(id, "r1");
}

/** As linhas da conta em cada tabela que tem o ID dela. */
async function rowsOf(id: string): Promise<Record<string, number>> {
  return {
    user: await countRows('"user"', "id", id),
    profiles: await countRows("profiles", "user_id", id),
    day_plans: await countRows("day_plans", "user_id", id),
    plan_items: await countRows("plan_items", "plan_id", `plan-${id}`),
    saved_recipes: await countRows("saved_recipes", "user_id", id),
    session: await countRows("session", "user_id", id),
    account: await countRows("account", "user_id", id),
  };
}

const FULL = {
  user: 1,
  profiles: 1,
  day_plans: 1,
  plan_items: 3,
  saved_recipes: 1,
  session: 2,
  account: 2,
};
const EMPTY = Object.fromEntries(Object.keys(FULL).map((k) => [k, 0]));

let logs: unknown[][];

beforeEach(async () => {
  await resetDb();
  await seedRecipe({ id: "r1", title: "Receita partilhada" });
  await seedAccount("uDel", "Apagar@Example.test");
  await seedAccount("uKeep", "keep@example.test");
  logs = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args);
  });
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    logs.push(args);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** O token e o cookie, como o navegador os recebe ao abrir a ficha. */
async function formToken(id = "uDel"): Promise<{ token: string; cookie: string }> {
  const res = await app().request(`${ORIGIN}/utilizadores/${id}`, {}, localBindings());
  expect(res.status).toBe(200);
  const page = await res.text();
  const token = /name="csrf" value="([^"]+)"/.exec(page)?.[1] ?? "";
  const cookie = (res.headers.get("Set-Cookie") ?? "").split(";")[0] ?? "";
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  // Em http://localhost o cookie é o local (sem __Host-, que o navegador recusaria em http)
  expect(cookie).toBe(`${CSRF_COOKIE_LOCAL}=${token}`);
  return { token, cookie };
}

function post(path: string, fields: Record<string, string>, headers: Record<string, string>) {
  return app().request(
    `${ORIGIN}${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
      body: new URLSearchParams(fields).toString(),
    },
    localBindings(),
  );
}

/** O cookie do aviso que uma ação deixou ("nome=valor"). */
function noticeOf(res: Response): string {
  const cookie = res.headers.get("Set-Cookie") ?? "";
  return new RegExp(`(?:^|, )(${NOTICE_COOKIE}=[^;]*)`).exec(cookie)?.[1] ?? "";
}

/** Os registos não levam o ID, o email nem o corpo do pedido. */
function expectCleanLogs(): void {
  const text = JSON.stringify(logs);
  for (const secret of ["uDel", "uKeep", "apagar@example.test", "Apagar@Example.test", "csrf"]) {
    expect(text).not.toContain(secret);
  }
}

describe("CSRF nas ações", () => {
  it.each([
    ["sem o cookie", (t: string) => ({ fields: { csrf: t }, headers: { Origin: ORIGIN } })],
    [
      "com outro token no formulário",
      (_t: string, c: string) => ({
        fields: { csrf: "A".repeat(43) },
        headers: { Origin: ORIGIN, Cookie: c },
      }),
    ],
    [
      "sem o campo do token",
      (_t: string, c: string) => ({ fields: {}, headers: { Origin: ORIGIN, Cookie: c } }),
    ],
    ["sem a origem", (t: string, c: string) => ({ fields: { csrf: t }, headers: { Cookie: c } })],
    [
      "de outra origem",
      (t: string, c: string) => ({
        fields: { csrf: t },
        headers: { Origin: "https://evil.example", Cookie: c },
      }),
    ],
    [
      "com a origem null",
      (t: string, c: string) => ({ fields: { csrf: t }, headers: { Origin: "null", Cookie: c } }),
    ],
    [
      "vindo de outro sítio (Sec-Fetch-Site)",
      (t: string, c: string) => ({
        fields: { csrf: t },
        headers: { Origin: ORIGIN, Cookie: c, "Sec-Fetch-Site": "cross-site" },
      }),
    ],
  ])("recusa %s, nas duas ações, sem mexer em nada", async (_name, build) => {
    const { token, cookie } = await formToken();
    for (const path of ["/utilizadores/uDel/sessoes", "/utilizadores/uDel/apagar"]) {
      const { fields, headers } = build(token, cookie);
      const res = await post(
        path,
        { ...fields, confirmar: "apagar@example.test" },
        headers as Record<string, string>,
      );
      expect(res.status, path).toBe(403);
      expect(await res.text()).toContain("Pedido recusado");
    }
    expect(await rowsOf("uDel")).toEqual(FULL);
  });

  it("recusa um pedido demasiado grande (413)", async () => {
    const { token, cookie } = await formToken();
    const res = await post(
      "/utilizadores/uDel/apagar",
      { csrf: token, confirmar: "x".repeat(5000) },
      { Origin: ORIGIN, Cookie: cookie },
    );
    expect(res.status).toBe(413);
    expect(await rowsOf("uDel")).toEqual(FULL);
  });

  it("em HTTPS, o cookie do token leva o prefixo __Host-, Secure, HttpOnly e SameSite=Strict", async () => {
    const res = await app().request("https://localhost/utilizadores/uDel", {}, localBindings());
    expect(res.status).toBe(200);
    const cookie = res.headers.get("Set-Cookie") ?? "";
    expect(cookie.startsWith(`${CSRF_COOKIE}=`)).toBe(true);
    expect(cookie).toMatch(/; Secure/);
    expect(cookie).toMatch(/; HttpOnly/);
    expect(cookie).toMatch(/; SameSite=Strict/);
    expect(cookie).toMatch(/; Path=\//);
    expect(cookie).not.toMatch(/Domain=/i);
  });

  it("o mesmo token serve várias páginas (não muda enquanto o cookie existe)", async () => {
    const { token, cookie } = await formToken();
    const page = await html("/utilizadores/uKeep", cookie);
    expect(page).toContain(`name="csrf" value="${token}"`);
  });
});

describe("terminar as sessões", () => {
  it("apaga as sessões só desta conta e mostra o aviso uma vez, na ficha dela", async () => {
    const { token, cookie } = await formToken();
    const res = await post(
      "/utilizadores/uDel/sessoes",
      { csrf: token },
      { Origin: ORIGIN, Cookie: cookie, "Sec-Fetch-Site": "same-origin" },
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/utilizadores/uDel?separador=gestao");
    expect(await rowsOf("uDel")).toEqual({ ...FULL, session: 0 });
    expect(await rowsOf("uKeep")).toEqual(FULL);

    const notice = noticeOf(res);
    expect(notice).toBe(`${NOTICE_COOKIE}=sessions.2.uDel`);
    // O aviso só aparece na ficha desta conta, e na outra ficha não
    expect(await html("/utilizadores/uKeep", notice)).not.toContain("sessões terminadas");
    const page = await html("/utilizadores/uDel?separador=gestao", notice);
    expect(page).toContain("2 sessões terminadas.");
    expect(page).toContain('role="status"');
    // A ficha já não tem o botão (não há sessões)
    expect(page).not.toContain('action="/utilizadores/uDel/sessoes"');

    expect(logs).toContainEqual(["admin_action", { action: "end_sessions" }]);
    expectCleanLogs();
  });

  it("um aviso forjado no cookie (fora da lista) não aparece", async () => {
    const page = await html("/utilizadores/uDel", `${NOTICE_COOKIE}=<b>falso</b>`);
    expect(page).not.toContain("falso");
  });

  it("uma conta que não existe dá 404, mesmo com o token certo", async () => {
    const { token, cookie } = await formToken();
    for (const id of ["nao-existe", "%3Cx%3E"]) {
      const res = await post(
        `/utilizadores/${id}/sessoes`,
        { csrf: token },
        { Origin: ORIGIN, Cookie: cookie },
      );
      expect(res.status).toBe(404);
    }
    expect(await rowsOf("uDel")).toEqual(FULL);
  });
});

describe("apagar os dados de saúde", () => {
  type HealthRow = {
    weight_kg: number | null;
    allergies: string;
    health_consent_at: number | null;
    manual_target: number;
    daily_target_g: number;
  };
  const healthOf = (id: string) =>
    env.DB.prepare(
      "select weight_kg, allergies, health_consent_at, manual_target, daily_target_g from profiles where user_id = ?",
    )
      .bind(id)
      .first<HealthRow>();

  it("apaga o peso, as alergias e o consentimento só desta conta, e a meta fica (manual)", async () => {
    const before = await healthOf("uDel");
    const { token, cookie } = await formToken();
    const res = await post(
      "/utilizadores/uDel/saude",
      { csrf: token },
      { Origin: ORIGIN, Cookie: cookie, "Sec-Fetch-Site": "same-origin" },
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/utilizadores/uDel?separador=gestao");
    expect(await healthOf("uDel")).toEqual({
      weight_kg: null,
      allergies: "[]",
      health_consent_at: null,
      manual_target: 1,
      daily_target_g: before?.daily_target_g,
    });
    // A outra conta fica igual, e o resto desta também
    expect((await healthOf("uKeep"))?.weight_kg).toBe(70);
    expect(await rowsOf("uDel")).toEqual(FULL);

    const notice = noticeOf(res);
    expect(notice).toBe(`${NOTICE_COOKIE}=health.1.uDel`);
    const page = await html("/utilizadores/uDel?separador=gestao", notice);
    expect(page).toContain("Dados de saúde apagados: o peso, as alergias e o consentimento.");
    expect(page).toContain("Sem dados de saúde: nada a apagar.");
    expect(page).not.toContain("70");
    expect(logs).toContainEqual(["admin_action", { action: "remove_health_data" }]);
    expectCleanLogs();

    // Uma segunda vez não muda nada e diz que não havia dados
    const again = await post(
      "/utilizadores/uDel/saude",
      { csrf: token },
      { Origin: ORIGIN, Cookie: cookie, "Sec-Fetch-Site": "same-origin" },
    );
    expect(noticeOf(again)).toBe(`${NOTICE_COOKIE}=health.0.uDel`);
  });

  it("sem o token do formulário, não apaga nada (403)", async () => {
    const res = await post("/utilizadores/uDel/saude", {}, { Origin: ORIGIN });
    expect(res.status).toBe(403);
    expect((await healthOf("uDel"))?.weight_kg).toBe(70);
  });
});

describe("apagar uma conta", () => {
  it("com o email errado, volta à confirmação (422) e não apaga nada", async () => {
    const { token, cookie } = await formToken();
    for (const confirmar of ["", "keep@example.test", "apagar@example"]) {
      const res = await post(
        "/utilizadores/uDel/apagar",
        { csrf: token, confirmar },
        { Origin: ORIGIN, Cookie: cookie },
      );
      expect(res.status).toBe(422);
      const page = await res.text();
      expect(page).toContain("O email não é o desta conta. Nada foi apagado.");
      expect(page).toContain('aria-invalid="true"');
    }
    expect(await rowsOf("uDel")).toEqual(FULL);
  });

  it("com o email certo (sem diferença de maiúsculas), apaga a conta e tudo o que é dela, em cascata", async () => {
    const { token, cookie } = await formToken();
    const res = await post(
      "/utilizadores/uDel/apagar",
      { csrf: token, confirmar: "  apagar@EXAMPLE.test " },
      { Origin: ORIGIN, Cookie: cookie },
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toBe("/utilizadores");
    expect(await rowsOf("uDel")).toEqual(EMPTY);
    // A outra conta fica inteira, e a receita (sem dono) também
    expect(await rowsOf("uKeep")).toEqual(FULL);
    expect(await countRows("recipes", "id", "r1")).toBe(1);
    expect(await countRows("saved_recipes", "recipe_id", "r1")).toBe(1);

    const notice = noticeOf(res);
    expect(notice).toBe(`${NOTICE_COOKIE}=deleted`);
    const list = await html("/utilizadores", notice);
    expect(list).toContain("Conta apagada, com todos os dados.");
    expect(list).not.toContain("Apagar@Example.test");
    // A ficha já não existe
    const gone = await app().request(`${ORIGIN}/utilizadores/uDel`, {}, localBindings());
    expect(gone.status).toBe(404);

    expect(logs).toContainEqual(["admin_action", { action: "delete_account" }]);
    expectCleanLogs();
  });

  it("não fica nenhuma linha da conta em nenhuma tabela com user_id (o mesmo que o apagar da app)", async () => {
    await seedRequested("uDel", "r1");
    await seedMealRecipe("uDel", "almoco", "r1");
    const { token, cookie } = await formToken();
    await post(
      "/utilizadores/uDel/apagar",
      { csrf: token, confirmar: "apagar@example.test" },
      { Origin: ORIGIN, Cookie: cookie },
    );
    // As tabelas com uma coluna user_id, a partir do CREATE TABLE (a D1 não deixa usar pragmas)
    const { results } = await env.DB.prepare(
      "select name, sql from sqlite_master where type = 'table' and sql is not null",
    ).all<{ name: string; sql: string }>();
    const tables = results.filter((t) => /[`"]user_id[`"]/.test(t.sql));
    expect(tables.map((t) => t.name).sort()).toEqual(
      [
        "account",
        "day_plans",
        "meal_recipes",
        "profiles",
        "saved_recipes",
        "session",
        "user_recipes",
      ].sort(),
    );
    for (const { name } of tables) {
      expect([name, await countRows(name, "user_id", "uDel")]).toEqual([name, 0]);
    }
    expect(await countRows("user_recipes", "user_id", "uKeep")).toBe(0);
    expect(await countRows("saved_recipes", "user_id", "uKeep")).toBe(1);
  });

  it("uma conta que não existe dá 404", async () => {
    const { token, cookie } = await formToken();
    const res = await post(
      "/utilizadores/nao-existe/apagar",
      { csrf: token, confirmar: "x@example.test" },
      { Origin: ORIGIN, Cookie: cookie },
    );
    expect(res.status).toBe(404);
  });

  it("as chaves estrangeiras da D1 estão ligadas (é o que faz a cascata)", async () => {
    const row = await env.DB.prepare("pragma foreign_keys").first<{ foreign_keys: number }>();
    expect(row?.foreign_keys).toBe(1);
  });
});

describe("as páginas não escrevem", () => {
  it("a D1 das páginas recusa qualquer escrita", async () => {
    const { adminDb } = await import("../src/db");
    const db = adminDb(env.DB);
    for (const query of [
      'delete from "user"',
      "update profiles set diet = 'vegan'",
      "insert into session (id) values ('x')",
      'with x as (select 1) delete from "user"',
      'select 1; delete from "user"',
      "pragma foreign_keys = off",
      "drop table profiles",
    ]) {
      await expect(db.all(query), query).rejects.toThrow("read_only");
    }
    expect(await rowsOf("uDel")).toEqual(FULL);
  });

  it("um GET a uma ação não faz nada (só POST)", async () => {
    const res = await app().request(`${ORIGIN}/utilizadores/uDel/sessoes`, {}, localBindings());
    expect(res.status).toBe(404);
    expect(await rowsOf("uDel")).toEqual(FULL);
  });
});
