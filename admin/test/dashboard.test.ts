import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { PROVISIONAL_FOODS } from "../src/dashboard-page";
import { adminDb } from "../src/db";
import { isoDay, signedPct } from "../src/format";
import { healthTiles, opsMetrics } from "../src/ops";
import { DEFAULT_RANGE, parseRange, rangeHref } from "../src/range";
import { activeMetrics, cohortMetrics, funnelMetrics } from "../src/usage";
import { heatStep } from "../src/usage-sections";
import {
  DAY,
  NOW,
  get,
  html,
  resetDb,
  seedDayPlan,
  seedMealRecipe,
  seedOps,
  seedProfile,
  seedRecipe,
  seedRequested,
  seedSaved,
  seedUser,
} from "./seed";

/** Nada de scripts, estilos inline nem handlers. */
function expectSafe(page: string): void {
  expect(page).not.toMatch(/<script/i);
  expect(page).not.toMatch(/<[^>]*\sstyle=/i);
  expect(page).not.toMatch(/<[^>]*\son[a-z]+=/i);
}

const today = isoDay(NOW);
const daysAgo = (n: number) => isoDay(NOW - n * DAY);
const db = () => adminDb(env.DB);

beforeEach(async () => {
  await resetDb();
});

describe("período do Painel", () => {
  it("só aceita os valores da lista; o resto fica no valor por omissão", () => {
    expect(parseRange({ dias: "30", semanas: "52" })).toEqual({ days: 30, weeks: 52 });
    for (const bad of ["014", "14.0", " 14", "14abc", "3", ""]) {
      expect(parseRange({ dias: bad, semanas: bad })).toEqual(DEFAULT_RANGE);
    }
    expect(rangeHref(DEFAULT_RANGE)).toBe("/");
    expect(rangeHref({ days: 90, weeks: 12 })).toBe("/?dias=90");
  });

  it("variações com sinal e degraus do mapa de calor", () => {
    expect(signedPct(0.25)).toBe("+25%");
    expect(signedPct(-0.4)).toBe("−40%");
    expect(signedPct(0.001)).toBe("0%");
    expect(heatStep(0, 100)).toBe(0);
    expect(heatStep(1, 100)).toBe(1);
    expect(heatStep(100, 100)).toBe(5);
  });
});

describe("funcionamento", () => {
  it("sem contadores no período, diz que ainda não há", async () => {
    const page = await html("/");
    expectSafe(page);
    expect(page).toContain("Ainda sem contadores neste período.");
  });

  it("os erros do servidor desde ontem e as receitas que falham pedem atenção", async () => {
    await seedOps(daysAgo(5), { "recipes.ok.new": 40, "recipes.ok.cached": 10 });
    await seedOps(today, {
      "recipes.ok.new": 10,
      "recipes.error.generation_failed": 5,
      "recipes.retry": 6,
      "recipes.5xx": 1,
      "auth.401": 3,
      "auth.5xx": 1,
      "actions.rejected": 2,
    });
    const m = await opsMetrics(db(), NOW, 14);
    const tiles = Object.fromEntries(healthTiles(m).map((t) => [t.id, t]));
    expect(tiles["5xx"]?.status).toBe("attention");
    expect(tiles["5xx"]?.value).toBe("2");
    // 5 falhadas em 55 pedidas ao modelo (9,1%) > 5%
    expect(tiles.falhadas?.status).toBe("attention");
    expect(tiles.falhadas?.unit).toBe("5 de 55 pedidas ao modelo");
    expect(tiles.lentas?.status).toBe("ok");
    expect(tiles.limite?.status).toBe("ok");

    const page = await html("/");
    expectSafe(page);
    expect(page).toContain("2 pontos pedem atenção");
    // "Precisa de ti" mostra os dois, com o link para o bloco
    expect(page).toMatch(/todo-attention.*?Erros do servidor/s);
    expect(page).toMatch(/todo-attention.*?Receitas que falharam/s);
    expect(page).toContain("50 receitas novas e 10 da cache");
    // A tabela completa explica cada coluna
    expect(page).toContain("<dt>Login 4xx</dt>");
    expect(page).toContain("hoje, em curso");
  });

  it("o limite global atingido desde ontem pede atenção; antes disso, não", async () => {
    await seedOps(daysAgo(6), { "recipes.error.service_unavailable": 3 });
    let tiles = healthTiles(await opsMetrics(db(), NOW, 14));
    expect(tiles.find((t) => t.id === "limite")?.status).toBe("ok");
    await seedOps(today, { "recipes.error.service_unavailable": 1 });
    tiles = healthTiles(await opsMetrics(db(), NOW, 14));
    expect(tiles.find((t) => t.id === "limite")?.status).toBe("attention");
  });

  it("o período dos dias escolhe quantos dias os contadores cobrem", async () => {
    await seedOps(daysAgo(20), { "recipes.5xx": 4 });
    expect((await opsMetrics(db(), NOW, 14)).byDay[daysAgo(20)]).toBeUndefined();
    expect((await opsMetrics(db(), NOW, 30)).byDay[daysAgo(20)]).toEqual({ "recipes.5xx": 4 });
  });
});

describe("Precisa de ti", () => {
  it("lista os alimentos com valores provisórios e os modelos sem preço", async () => {
    await seedRecipe({ id: "rx", model: "claude-novo", createdAt: NOW - DAY });
    const page = await html("/");
    if (PROVISIONAL_FOODS > 0) expect(page).toContain("alimentos com valores provisórios");
    expect(page).toContain("Modelo sem preço: claude-novo");
    // O mock (local e testes) não conta como modelo sem preço
    await seedRecipe({ id: "rm", model: "mock", createdAt: NOW - DAY });
    expect(await html("/")).not.toContain("mock, ");
  });
});

describe("uso da app", () => {
  beforeEach(async () => {
    // Ana: criada há 20 dias, voltou no 10.º dia (sessão) e pediu e guardou uma receita
    await seedUser({
      id: "ana",
      createdAt: NOW - 20 * DAY,
      sessions: [{ createdAt: NOW - 20 * DAY }, { createdAt: NOW - 10 * DAY }],
    });
    await seedProfile({ userId: "ana", onboardedAt: NOW - 20 * DAY });
    // Bruno: criado há 16 dias, nunca voltou e não fez o formulário
    await seedUser({
      id: "bruno",
      createdAt: NOW - 16 * DAY,
      sessions: [{ createdAt: NOW - 16 * DAY }],
    });
    // Carla: criada ontem (ainda não entra no funil), ativa hoje
    await seedUser({ id: "carla", createdAt: NOW - DAY, sessions: [{ createdAt: NOW }] });
    await seedRecipe({ id: "r1", createdAt: NOW - 2 * DAY });
    await seedRequested("ana", "r1", NOW - 2 * DAY);
    await seedSaved("ana", "r1", NOW - 2 * DAY);
    await seedMealRecipe("carla", "almoco", "r1", NOW);
  });

  it("pessoas ativas por dia, nos últimos 7 e 30 dias", async () => {
    const m = await activeMetrics(db(), NOW);
    expect(m.days).toHaveLength(30);
    expect(m.perDay.at(-1)).toBe(1); // Carla hoje
    expect(m.weekly).toBe(2); // Ana (receita há 2 dias) e Carla
    expect(m.monthly).toBe(3);
  });

  it("o funil conta só as contas com 14 dias ou mais", async () => {
    expect(await funnelMetrics(db(), NOW)).toEqual({
      eligible: 2,
      onboarded: 1,
      firstRecipe: 1,
      keptRecipe: 1,
      returned: 1,
      recent: 1,
    });
  });

  it("a retenção segue as contas de cada semana", async () => {
    const cohorts = await cohortMetrics(db(), NOW);
    expect(cohorts).toHaveLength(8);
    const total = cohorts.reduce((sum, c) => sum + c.size, 0);
    expect(total).toBe(3);
    // A semana em curso ainda não terminou: nenhuma coluna aparece
    expect(cohorts.at(-1)?.retained.every((v) => v === null)).toBe(true);
  });

  it("o Painel mostra os blocos de uso e as listas curtas", async () => {
    const page = await html("/");
    expectSafe(page);
    expect(page).toContain('id="ativos"');
    expect(page).toContain('<table class="heatmap">');
    expect(page).toContain("Voltou na 2.ª semana");
    expect(page).toMatch(/Receitas mais guardadas.*?href="\/receitas\/r1"/s);
    expect(page).toMatch(/Mais postas no dia.*?href="\/receitas\/r1"/s);
  });
});

describe("listas", () => {
  beforeEach(async () => {
    await seedUser({
      id: "velha",
      name: "Velha",
      createdAt: NOW - 30 * DAY,
      sessions: [{ createdAt: NOW }],
    });
    await seedUser({ id: "nova", name: "Nova", createdAt: NOW - DAY });
    await seedRecipe({ id: "ra", title: "Frango ao almoço", meal: "almoco", createdAt: NOW - DAY });
    await seedRecipe({
      id: "rb",
      title: "Papas de aveia",
      meal: "pequeno-almoco",
      model: "mock",
      inputTokens: 9000,
      createdAt: NOW - 2 * DAY,
    });
    await seedRequested("velha", "ra");
    await seedRequested("velha", "rb");
    await seedSaved("nova", "rb", NOW - 5 * DAY);
  });

  it("utilizadores: ordem pela atividade e pelas receitas pedidas", async () => {
    const byActivity = await html("/utilizadores?ordem=atividade");
    expect(byActivity.indexOf("Velha")).toBeLessThan(byActivity.indexOf("Nova"));
    expect(byActivity).toContain("da atividade mais recente");
    const byRecipes = await html("/utilizadores?ordem=receitas");
    expect(byRecipes.indexOf("Velha")).toBeLessThan(byRecipes.indexOf("Nova"));
    // A ordem por omissão (as mais recentes primeiro)
    const recent = await html("/utilizadores");
    expect(recent.indexOf("Nova")).toBeLessThan(recent.indexOf("Velha"));
  });

  it("receitas: pesquisa, filtros, ordem e opções a partir das receitas", async () => {
    const all = await html("/receitas");
    expectSafe(all);
    expect(all).toContain('<option value="mock">mock</option>');
    expect(all).toContain("2 receitas");
    const search = await html("/receitas?q=aveia");
    expect(search).toContain("Papas de aveia");
    expect(search).not.toContain("Frango ao almoço");
    const meal = await html("/receitas?refeicao=almoco");
    expect(meal).toContain("Frango ao almoço");
    expect(meal).not.toContain("Papas de aveia");
    const model = await html("/receitas?modelo=mock");
    expect(model).toContain("Papas de aveia");
    expect(model).not.toContain("Frango ao almoço");
    const tokens = await html("/receitas?ordem=tokens");
    expect(tokens.indexOf("Papas de aveia")).toBeLessThan(tokens.indexOf("Frango ao almoço"));
    expect(await html("/receitas?ordem=guardadas")).toContain("das mais guardadas");
    // Valores fora da lista: sem filtro, sem erro
    expect(await html("/receitas?refeicao=<x>&modelo=a%20b&prompt=x&posTreino=talvez")).toContain(
      "2 receitas",
    );
    expect(await html("/receitas?q=nada-disto")).toContain("Nenhuma receita encontrada");
  });

  it("alimentos: pesquisa sem acentos e a página de cada um", async () => {
    await seedProfile({ userId: "velha", likedFoods: ["grao-bico", "ovo"] });
    await seedDayPlan("velha", ["grao-bico"]);
    const list = await html("/alimentos?q=grao");
    expect(list).toContain('href="/alimentos/grao-bico"');
    expect(list).not.toContain(">Ovo<");
    const page = await html("/alimentos/grao-bico");
    expectSafe(page);
    expect(page).toContain("Grão-de-bico");
    expect(page).toMatch(/stat-value">1<\/p><p class="stat-label">pessoa gosta/);
    expect(page).toMatch(/stat-value">1<\/p><p class="stat-label">dia guardado o inclui/);
    expect(page).toContain("Porções");
    expect((await get("/alimentos/nao-existe")).status).toBe(404);
    expect((await get("/alimentos/%3Cx%3E")).status).toBe(404);
  });
});
