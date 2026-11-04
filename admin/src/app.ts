import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import type { KeySource } from "./access";
import { deleteAccount, endSessions, removeHealthData } from "./actions";
import { CSRF_FIELD, csrfToken, validCsrf } from "./csrf";
import { dashboardPage, type DashboardData } from "./dashboard-page";
import { adminDb, isId, type AdminDb } from "./db";
import { FAVICON_SVG } from "./favicon";
import { foodStats, parseFoodFilters, sortFoods } from "./food-stats";
import { foodDetail, foodPage } from "./food-detail";
import { foodsPage } from "./foods-page";
import { messagePage } from "./layout";
import {
  healthMetrics,
  preferencesMetrics,
  recipesMetrics,
  topFoodsMetrics,
  topRecipesMetrics,
  usersMetrics,
} from "./metrics";
import { opsMetrics } from "./ops";
import { parseRange, type Range } from "./range";
import { activeMetrics, cohortMetrics, funnelMetrics } from "./usage";
import { setNotice, takeNotice } from "./notice";
import {
  listRecipes,
  parseRecipeFilters,
  publicRecipeUrl,
  recipeDetail,
  recipeFacets,
} from "./recipes";
import { recipePage, recipesPage } from "./recipes-page";
import { requireAccess } from "./require-access";
import { STYLES } from "./styles";
import type { AdminEnv, Loaded } from "./types";
import {
  USER_SORTS,
  accountEmail,
  cleanQuery,
  listUsers,
  parsePage,
  userDetail,
  type UserSort,
} from "./users";
import { deletePage, parseUserTab, userHref, userPage, usersPage } from "./users-page";

/**
 * Cada fonte do Painel lê-se à parte: se uma falhar, o resto aparece e o que dependia dela diz
 * que falhou. Do erro só fica o nome nos registos (a mensagem de um erro da D1 pode trazer os
 * parâmetros).
 */
async function load<T>(source: string, read: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, value: await read() };
  } catch (err) {
    console.error("admin_section_error", {
      section: source,
      name: err instanceof Error ? err.name : "unknown",
    });
    return { ok: false };
  }
}

export async function loadDashboard(
  db: AdminDb,
  now: number,
  range: Range,
): Promise<DashboardData> {
  const [users, recipes, topRecipes, ops, active, cohorts, funnel, preferences, foods, health] =
    await Promise.all([
      load("utilizadores", () => usersMetrics(db, now, range.weeks)),
      load("receitas", () => recipesMetrics(db, now, range.weeks)),
      load("receitas-top", () => topRecipesMetrics(db)),
      load("funcionamento", () => opsMetrics(db, now, range.days)),
      load("ativos", () => activeMetrics(db, now)),
      load("retencao", () => cohortMetrics(db, now)),
      load("ativacao", () => funnelMetrics(db, now)),
      load("preferencias", () => preferencesMetrics(db)),
      load("alimentos", () => topFoodsMetrics(db)),
      load("saude", () => healthMetrics(db)),
    ]);
  return { users, recipes, topRecipes, ops, active, cohorts, funnel, preferences, foods, health };
}

const notFound = (c: Context<AdminEnv>) =>
  c.html(messagePage("Página não encontrada", "Esta página não existe."), 404);

const forbiddenForm = (c: Context<AdminEnv>) =>
  c.html(
    messagePage(
      "Pedido recusado",
      "O formulário expirou ou não veio do backoffice. Volta à página e tenta de novo.",
    ),
    403,
  );

/** Os formulários das ações são pequenos: o token e, no apagar, o email de confirmação. */
const smallForm = bodyLimit({
  maxSize: 4 * 1024,
  onError: (c) => c.html(messagePage("Pedido recusado", "O pedido é demasiado grande."), 413),
});

/** O texto de um campo de formulário (um ficheiro ou um campo repetido não contam). */
function field(body: Record<string, unknown>, name: string): string | null {
  const value = body[name];
  return typeof value === "string" ? value : null;
}

/**
 * O Worker do backoffice. Tudo atrás do Access (incluindo o CSS, o ícone e as páginas de erro).
 * Os GET só leem, pela D1 só de leitura; as ações (terminar sessões e apagar uma conta) são POST
 * com o token do formulário (csrf.ts), e o aviso de cada uma vai num cookie de uso único
 * (notice.ts). Os registos dizem só a ação: nunca o ID, o email nem o corpo do pedido.
 * `getKeys` só existe para os testes.
 */
export function createAdminApp({ getKeys }: { getKeys?: KeySource } = {}) {
  const app = new Hono<AdminEnv>()
    .use(
      secureHeaders({
        contentSecurityPolicy: {
          defaultSrc: ["'none'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'"],
          baseUri: ["'none'"],
          // A pesquisa, os filtros e as ações: só para o próprio backoffice
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        },
        // Nada sai para outros sítios; nos pedidos ao próprio backoffice, o navegador manda a
        // origem (com "no-referrer", um POST de formulário leva "Origin: null" e o csrf.ts recusa)
        referrerPolicy: "same-origin",
        xFrameOptions: "DENY",
        crossOriginResourcePolicy: "same-origin",
      }),
    )
    // Em todas as respostas, incluindo 403 e 404: nada fica em cache nem em motores de busca
    .use(async (c, next) => {
      await next();
      c.res.headers.set("Cache-Control", "no-store");
      c.res.headers.set("X-Robots-Tag", "noindex, nofollow");
    })
    .use(requireAccess(getKeys))
    .get("/", async (c) => {
      const now = Date.now();
      const range = parseRange({ dias: c.req.query("dias"), semanas: c.req.query("semanas") });
      return c.html(
        dashboardPage({
          adminEmail: c.get("adminEmail"),
          now,
          range,
          data: await loadDashboard(adminDb(c.env.DB), now, range),
        }),
      );
    })
    .get("/utilizadores", async (c) => {
      const sort =
        USER_SORTS.find((s) => s === c.req.query("ordem")) ?? ("recentes" satisfies UserSort);
      const params = {
        q: cleanQuery(c.req.query("q")),
        sort,
        page: parsePage(c.req.query("pagina")),
      };
      const list = await listUsers(adminDb(c.env.DB), params);
      return c.html(
        usersPage({
          adminEmail: c.get("adminEmail"),
          now: Date.now(),
          list,
          params,
          notice: takeNotice(c, "users"),
        }),
      );
    })
    .get("/utilizadores/:id", async (c) => {
      const now = Date.now();
      const user = await userDetail(adminDb(c.env.DB), c.req.param("id"), now);
      if (!user) return notFound(c);
      return c.html(
        userPage({
          adminEmail: c.get("adminEmail"),
          now,
          user,
          csrf: csrfToken(c),
          tab: parseUserTab(c.req.query("separador")),
          notice: takeNotice(c, { userId: user.id }),
        }),
      );
    })
    .get("/utilizadores/:id/apagar", async (c) => {
      const now = Date.now();
      const user = await userDetail(adminDb(c.env.DB), c.req.param("id"), now);
      if (!user) return notFound(c);
      return c.html(deletePage({ adminEmail: c.get("adminEmail"), now, user, csrf: csrfToken(c) }));
    })
    .post("/utilizadores/:id/sessoes", smallForm, async (c) => {
      const id = c.req.param("id");
      const body = await c.req.parseBody();
      if (!validCsrf(c, field(body, CSRF_FIELD))) return forbiddenForm(c);
      if (!isId(id) || (await accountEmail(adminDb(c.env.DB), id)) === null) return notFound(c);
      const ended = await endSessions(c.env.DB, id);
      // Sem o ID nem o email: quem e o quê ficam no Access e no próprio pedido
      console.log("admin_action", { action: "end_sessions" });
      setNotice(c, { kind: "sessions", userId: id, count: Math.min(ended, 9999) });
      return c.redirect(userHref(id, "gestao"), 303);
    })
    .post("/utilizadores/:id/saude", smallForm, async (c) => {
      const id = c.req.param("id");
      const body = await c.req.parseBody();
      if (!validCsrf(c, field(body, CSRF_FIELD))) return forbiddenForm(c);
      if (!isId(id) || (await accountEmail(adminDb(c.env.DB), id)) === null) return notFound(c);
      const removed = await removeHealthData(c.env.DB, id, Date.now());
      console.log("admin_action", { action: "remove_health_data" });
      setNotice(c, { kind: "health", userId: id, removed });
      return c.redirect(userHref(id, "gestao"), 303);
    })
    .post("/utilizadores/:id/apagar", smallForm, async (c) => {
      const id = c.req.param("id");
      const body = await c.req.parseBody();
      if (!validCsrf(c, field(body, CSRF_FIELD))) return forbiddenForm(c);
      const db = adminDb(c.env.DB);
      const email = await accountEmail(db, id);
      if (email === null) return notFound(c);
      const typed = (field(body, "confirmar") ?? "").trim().toLowerCase();
      if (typed !== email.trim().toLowerCase()) {
        const now = Date.now();
        const user = await userDetail(db, id, now);
        if (!user) return notFound(c);
        return c.html(
          deletePage({
            adminEmail: c.get("adminEmail"),
            now,
            user,
            csrf: csrfToken(c),
            error: true,
          }),
          422,
        );
      }
      await deleteAccount(c.env.DB, id);
      console.log("admin_action", { action: "delete_account" });
      setNotice(c, { kind: "deleted" });
      return c.redirect("/utilizadores", 303);
    })
    .get("/receitas", async (c) => {
      const db = adminDb(c.env.DB);
      const filters = parseRecipeFilters({
        q: cleanQuery(c.req.query("q")),
        refeicao: c.req.query("refeicao"),
        modelo: c.req.query("modelo"),
        prompt: c.req.query("prompt"),
        posTreino: c.req.query("posTreino"),
        ordem: c.req.query("ordem"),
        page: parsePage(c.req.query("pagina")),
      });
      const [list, facets] = await Promise.all([listRecipes(db, filters), recipeFacets(db)]);
      return c.html(
        recipesPage({ adminEmail: c.get("adminEmail"), now: Date.now(), list, filters, facets }),
      );
    })
    .get("/receitas/:id", async (c) => {
      const recipe = await recipeDetail(adminDb(c.env.DB), c.req.param("id"));
      if (!recipe) return notFound(c);
      return c.html(
        recipePage({
          adminEmail: c.get("adminEmail"),
          now: Date.now(),
          recipe,
          publicUrl: publicRecipeUrl(c.env.APP_URL, recipe.id),
        }),
      );
    })
    .get("/alimentos", async (c) => {
      const filters = parseFoodFilters({
        q: cleanQuery(c.req.query("q")),
        ordem: c.req.query("ordem"),
        categoria: c.req.query("categoria"),
      });
      const all = await foodStats(adminDb(c.env.DB));
      return c.html(
        foodsPage({
          adminEmail: c.get("adminEmail"),
          now: Date.now(),
          all,
          shown: sortFoods(all, filters),
          filters,
        }),
      );
    })
    .get("/alimentos/:id", async (c) => {
      const detail = await foodDetail(adminDb(c.env.DB), c.req.param("id"));
      if (!detail) return notFound(c);
      return c.html(foodPage({ adminEmail: c.get("adminEmail"), now: Date.now(), detail }));
    })
    .get("/styles.css", (c) => c.body(STYLES, 200, { "Content-Type": "text/css; charset=utf-8" }))
    // Sem ele, cada página pedia /favicon.ico e recebia um 404
    .get("/favicon.svg", (c) => c.body(FAVICON_SVG, 200, { "Content-Type": "image/svg+xml" }));

  app.notFound(notFound);

  app.onError((err, c) => {
    // Só o nome do erro: a mensagem de um erro da D1 pode trazer os parâmetros da consulta
    console.error("admin_unhandled_error", { path: c.req.routePath, name: err.name });
    return c.html(messagePage("Erro", "Não foi possível mostrar esta página."), 500);
  });

  return app;
}
