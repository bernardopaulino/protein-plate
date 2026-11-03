import { beforeEach, describe, expect, it } from "vitest";
import { usd } from "../src/format";
import {
  DAY,
  NOW,
  get,
  html,
  resetDb,
  seedDayPlan,
  seedProfile,
  seedRecipe,
  seedSaved,
  seedUser,
} from "./seed";

const XSS_NAME = `<script>alert("nome")</script>`;
const XSS_TITLE = `<img src=x onerror=alert(1)> Frango & arroz`;
const XSS_STEP = `Junta <b>tudo</b> e "mexe"`;

/** Nada de scripts, estilos inline nem handlers: o HTML só tem o que o servidor escreveu. */
function expectSafe(page: string): void {
  expect(page).not.toMatch(/<script/i);
  expect(page).not.toMatch(/<img/i);
  // Dentro de uma etiqueta (um texto escapado pode ter " onerror=" sem perigo)
  expect(page).not.toMatch(/<[^>]*\sstyle=/i);
  expect(page).not.toMatch(/<[^>]*\son[a-z]+=/i);
}

beforeEach(async () => {
  await resetDb();
  await seedUser({
    id: "u1",
    name: XSS_NAME,
    email: "ana@example.test",
    createdAt: NOW - 2 * DAY,
    providers: ["google", "apple"],
    sessions: [{ createdAt: NOW - DAY }, { createdAt: NOW - 3 * DAY }],
  });
  await seedProfile({
    userId: "u1",
    dailyTargetG: 140,
    meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
    preWorkoutMeal: "lanche",
    postWorkoutMeal: "jantar",
    diet: "vegetarian",
    likedFoods: ["ovo", "tofu-firme", "grao-bico", "id-retirado"],
    equipment: ["stove", "airfryer"],
    cookMinutes: 30,
  });
  await seedUser({ id: "u2", name: "Bruno", createdAt: NOW - 40 * DAY });
  await seedProfile({ userId: "u2", diet: "omnivore", likedFoods: ["ovo"], onboardedAt: null });
  await seedUser({ id: "u3", name: "Carla", createdAt: NOW - 5 * DAY, sessions: [] });
  await seedRecipe({
    id: "r1",
    title: XSS_TITLE,
    summary: "Resumo <i>simples</i>",
    steps: ["Corta o frango.", XSS_STEP],
    inputTokens: 1_000_000,
    outputTokens: 200_000,
    createdAt: NOW,
    ingredients: [
      { foodId: "peito-frango", grams: 300 },
      { foodId: "arroz-branco", grams: 150 },
      { foodId: "id-retirado", grams: 10 },
    ],
  });
  await seedRecipe({
    id: "r2",
    title: "Tofu salteado",
    model: "mock",
    createdAt: NOW - 3 * DAY,
    ingredients: [{ foodId: "tofu-firme", grams: 200 }],
  });
  await seedRecipe({
    id: "r3",
    title: "Receita antiga",
    inputTokens: null,
    outputTokens: null,
    createdAt: NOW - 60 * DAY,
    ingredients: [{ foodId: "peito-frango", grams: 200 }],
  });
  await seedSaved("u1", "r1");
  await seedSaved("u2", "r1", NOW - 10 * DAY);
  await seedDayPlan("u1", ["ovo", "tofu-firme"]);
});

describe("Painel", () => {
  it("mostra as contas, o onboarding, os ativos e as receitas", async () => {
    const page = await html("/");
    expectSafe(page);
    // 3 contas, 2 novas nos últimos 7 dias, 1 com o onboarding feito (33%), 1 ativa
    expect(page).toMatch(/Utilizadores<\/span><\/h3>\s*<p class="strip-figure">3<\/p>/);
    expect(page).toContain("<strong>+2</strong> nos últimos 7 dias");
    expect(page).toMatch(/Onboarding feito<\/span><\/h3>\s*<p class="strip-figure">33%<\/p>/);
    expect(page).toContain("1 de 3 contas");
    expect(page).toMatch(/Ativos \(7 dias\)<\/span><\/h3>\s*<p class="strip-figure">1<\/p>/);
    // Receitas: r1 hoje, r2 há 3 dias (7 dias = 2), r3 há 60 dias (total 3)
    expect(page).toMatch(/Receitas geradas<\/span><\/h3>\s*<p class="strip-figure">2<\/p>/);
    expect(page).toContain("<strong>1</strong> hoje");
    expect(page).toContain("2 em 30 dias · 3 desde o início");
  });

  it("estima o custo com os preços do Haiku e não dá preço ao mock", async () => {
    const page = await html("/");
    // 1M de entrada a $0,10 + 200 mil de saída a $0,50 = $0,20
    expect(page).toContain(usd(0.2));
    expect(page).toContain("<code>mock</code>");
    expect(page).toContain("sem preço");
    expect(page).toContain("1 receita sem os tokens guardados");
  });

  it("mostra os gráficos por semana e por dia, com as tabelas dos dados", async () => {
    const page = await html("/");
    expect(page).toContain('aria-label="Contas novas por semana, nas últimas 12 semanas"');
    expect(page).toContain('aria-label="Receitas geradas por dia, nos últimos 30 dias"');
    expect(page).toContain("<caption>Contas novas por semana, da mais recente</caption>");
    expect(page).toMatch(/<title>[^<]*\(hoje\): 1 receita<\/title>/);
  });

  it("mostra as preferências de quem fez o onboarding e os alimentos pelo nome", async () => {
    const page = await html("/");
    expect(page).toContain("Vegetariana");
    // u2 não fez o onboarding: a dieta dele não conta
    expect(page).not.toContain("Come de tudo");
    expect(page).toContain("4 refeições");
    expect(page).toContain("Até 30 min");
    expect(page).toContain("Air fryer");
    expect(page).toMatch(/<p class="big-figure">100%<\/p>/);
    // Os alimentos escolhidos: o ovo por 2 pessoas, pelo nome do catálogo
    expect(page).toMatch(/bar-name">Ovo<\/span>.*?<span class="bar-value">2 pessoas</);
    expect(page).toContain("Tofu firme");
    expect(page).toContain("id-retirado");
    expect(page).toContain("Fora do catálogo");
    // Nas receitas: o peito de frango em 2
    expect(page).toMatch(/bar-name">Peito de frango<\/span>.*?<span class="bar-value">2 receitas</);
    expect(page).toContain("Receitas guardadas");
  });

  it("sem dados, mostra os estados vazios sem falhar", async () => {
    await resetDb();
    const page = await html("/");
    expectSafe(page);
    expect(page).toContain("Ainda ninguém escolheu alimentos");
    expect(page).toContain("Nenhuma receita gerada neste período.");
    expect(page).not.toContain("Não foi possível ler");
  });
});

describe("Utilizadores", () => {
  it("lista as contas com as formas de entrar e escapa os nomes", async () => {
    const page = await html("/utilizadores");
    expectSafe(page);
    expect(page).toContain("&lt;script&gt;alert(&quot;nome&quot;)&lt;/script&gt;");
    expect(page).toContain("Apple, Google");
    expect(page).toContain("Onboarding feito");
    expect(page).toContain("Onboarding por fazer");
    expect(page).toContain("3 contas");
  });

  it("a ficha mostra a conta, as sessões, as preferências e as receitas guardadas", async () => {
    const page = await html("/utilizadores/u1");
    expectSafe(page);
    expect(page).toContain("ana@example.test");
    expect(page).toContain("Google <span");
    expect(page).toContain("Apple <span");
    expect(page).toMatch(/Sessões ativas<\/dt><dd>2<\/dd>/);
    expect(page).toContain("Última entrada");
    expect(page).toContain("<strong>140 g</strong> de proteína");
    expect(page).toContain('Lanche <span class="muted">(pré-treino)</span>');
    expect(page).toContain('Jantar <span class="muted">(pós-treino)</span>');
    expect(page).toContain("Vegetariana");
    expect(page).toContain("Fogão, Air fryer");
    expect(page).toContain("Até 30 min");
    expect(page).toContain(">Grão-de-bico</li>");
    expect(page).toContain(">id-retirado</li>");
    // A receita guardada, com o link para a ficha da receita, escapada
    expect(page).toContain('href="/receitas/r1"');
    expect(page).toContain("&lt;img src=x onerror=alert(1)&gt; Frango &amp; arroz");
    expect(page).toContain("Sem dados de saúde");
    expect(page).toContain('action="/utilizadores/u1/sessoes"');
  });

  it("a ficha de uma conta sem perfil diz que ainda não há perfil", async () => {
    const page = await html("/utilizadores/u3");
    expect(page).toContain("ainda não tem perfil");
    expect(page).toContain("Sem receitas guardadas.");
    expect(page).toMatch(/Sessões ativas<\/dt><dd>0<\/dd>/);
    // Sem sessões, não há botão para as terminar
    expect(page).not.toContain('action="/utilizadores/u3/sessoes"');
  });

  it("a confirmação do apagar diz o que sai e pede o email", async () => {
    const page = await html("/utilizadores/u1/apagar");
    expectSafe(page);
    expect(page).toContain("Isto não dá para desfazer");
    expect(page).toContain("o dia guardado (2 alimentos)");
    expect(page).toContain("1 receita guardada");
    expect(page).toContain("2 sessões");
    expect(page).toContain('name="confirmar"');
  });

  it("uma conta que não existe (ou um ID inválido) dá 404", async () => {
    for (const path of [
      "/utilizadores/nao-existe",
      "/utilizadores/nao-existe/apagar",
      "/utilizadores/%3Cscript%3E",
      `/utilizadores/${"x".repeat(80)}`,
    ]) {
      expect((await get(path)).status, path).toBe(404);
    }
  });
});

describe("Receitas", () => {
  it("lista as receitas da mais recente, com o modelo, o prompt, os tokens e a proteína", async () => {
    const page = await html("/receitas");
    expectSafe(page);
    const first = page.indexOf("Frango &amp; arroz");
    const second = page.indexOf("Tofu salteado");
    const third = page.indexOf("Receita antiga");
    expect(first).toBeGreaterThan(-1);
    expect(first).toBeLessThan(second);
    expect(second).toBeLessThan(third);
    expect(page).toContain("<code>claude-haiku-5-5</code>");
    expect(page).toContain("35,5 g");
    // Os tokens abreviados (o espaço do Intl é inseparável)
    expect(page).toMatch(/1\sM <span class="muted">\/<\/span> 200\smil/);
    expect(page).toContain("3 receitas");
  });

  it("a ficha mostra os ingredientes pelo nome, os passos escapados e o link público", async () => {
    const page = await html("/receitas/r1");
    expectSafe(page);
    expect(page).toContain("Peito de frango");
    expect(page).toContain("300 g");
    expect(page).toContain("Arroz branco");
    expect(page).toContain("Fora do catálogo");
    expect(page).toContain("<li>Junta &lt;b&gt;tudo&lt;/b&gt; e &quot;mexe&quot;</li>");
    expect(page).toContain("Resumo &lt;i&gt;simples&lt;/i&gt;");
    expect(page).toContain('href="https://protein-plate.app/receitas/r1"');
    expect(page).toContain('rel="noopener noreferrer"');
    expect(page).toContain("Guardada por</dt><dd>2 pessoas");
    expect(page).toContain(usd(0.2));
  });

  it("uma receita que não existe dá 404", async () => {
    expect((await get("/receitas/nao-existe")).status).toBe(404);
  });
});

describe("Alimentos", () => {
  /** A ordem dos nomes na tabela. */
  const order = (page: string, names: readonly string[]) =>
    names.map((name) => page.indexOf(`<th scope="row">${name}</th>`));

  it("conta as pessoas que gostam, os dias e as receitas de cada alimento", async () => {
    const page = await html("/alimentos");
    expectSafe(page);
    expect(page).toMatch(
      /<th scope="row">Ovo<\/th><td>Ovos<\/td><td class="num">2<\/td><td class="num">1<\/td>/,
    );
    expect(page).toMatch(
      /<th scope="row">Tofu firme<\/th><td>Soja<\/td><td class="num">1<\/td><td class="num">1<\/td><td class="num">1<\/td>/,
    );
    expect(page).toMatch(/<th scope="row">id-retirado <span class="muted">\(fora do catálogo\)/);
  });

  it("ordena por cada coluna e filtra pela categoria", async () => {
    const byLiked = await html("/alimentos");
    const [ovo, tofu] = order(byLiked, ["Ovo", "Tofu firme"]);
    expect(ovo).toBeLessThan(tofu ?? 0);
    expect(byLiked).toMatch(/aria-sort="descending"><a[^>]*>Pessoas que gostam/);

    const byRecipes = await html("/alimentos?ordem=receitas");
    const [frango, ovoR] = order(byRecipes, ["Peito de frango", "Ovo"]);
    expect(frango).toBeLessThan(ovoR ?? 0);
    expect(byRecipes).toMatch(/aria-sort="descending"><a[^>]*>Receitas/);

    const byName = await html("/alimentos?ordem=nome");
    const [abacate, uvas] = order(byName, ["Abacate", "Uvas"]);
    expect(abacate).toBeLessThan(uvas ?? 0);

    const soja = await html("/alimentos?categoria=soja");
    expect(soja).toContain("Tofu firme");
    expect(soja).not.toContain(">Ovo<");
    expect(soja).toContain('<option value="soja" selected>');

    // Valores fora da lista ficam nos de omissão
    const odd = await html("/alimentos?ordem=%3Cx%3E&categoria=nada");
    expect(odd).toMatch(/aria-sort="descending"><a[^>]*>Pessoas que gostam/);
    expect(odd).toContain('<option value="" selected>');
  });
});
