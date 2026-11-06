import { FOODS } from "../../src/content/foods.generated";
import { TODO } from "../../src/domain/contracts/food";
import { ALLERGENS } from "../../src/domain/food";
import { columnChart, icon, type Column, type IconName } from "./charts";
import { catalogFood, foodName } from "./foods";
import {
  DAY_MS,
  counted,
  dayLabel,
  num,
  pct,
  plural,
  signedPct,
  tokens,
  usd,
  weekStartDay,
} from "./format";
import { escapeHtml } from "./html";
import {
  ALLERGEN_LABEL,
  CATEGORY_LABEL,
  DIET_LABEL,
  EQUIPMENT_LABEL,
  labelOf,
  mealLabel,
} from "./labels";
import { pageShell } from "./layout";
import type {
  Bucket,
  HealthMetrics,
  PreferencesMetrics,
  RecipesMetrics,
  TokenWindow,
  TopFoodsMetrics,
  TopRecipe,
  TopRecipesMetrics,
  UsersMetrics,
  Window,
} from "./metrics";
import { healthRow, healthTiles, type OpsMetrics } from "./ops";
import { AI_PRICES_USD_PER_MTOK } from "./pricing";
import { MIN_GROUP, healthCount } from "./privacy";
import { GROWTH_WEEKS, HEALTH_DAYS, rangeHref, type Range } from "./range";
import { recipeHref } from "./recipes-page";
import type { Loaded } from "./types";
import {
  FAILED_NOTE,
  arrowLink,
  barList,
  card,
  cardMeta,
  dataDetails,
  dataTable,
  emptyState,
  note,
  rangeControl,
  row,
  strip,
  stripCell,
  tableScroll,
  type BarItem,
} from "./ui";
import type { ActiveMetrics, Cohort, FunnelMetrics } from "./usage";
import { activeRow, funnelRow, retentionRow } from "./usage-sections";

/** Tudo o que o Painel mostra, lido de uma vez (app.ts); cada fonte pode falhar sozinha. */
export interface DashboardData {
  users: Loaded<UsersMetrics>;
  recipes: Loaded<RecipesMetrics>;
  topRecipes: Loaded<TopRecipesMetrics>;
  ops: Loaded<OpsMetrics>;
  active: Loaded<ActiveMetrics>;
  cohorts: Loaded<Cohort[]>;
  funnel: Loaded<FunnelMetrics>;
  preferences: Loaded<PreferencesMetrics>;
  foods: Loaded<TopFoodsMetrics>;
  health: Loaded<HealthMetrics>;
}

/* ---------------------------------------------------------------- Períodos */

/** O período do funcionamento, em dias; o link mantém as semanas e volta ao bloco. */
export function daysControl(range: Range): string {
  return rangeControl(
    "periodo-dias",
    "Últimos",
    "dias",
    HEALTH_DAYS,
    range.days,
    (days) => `${rangeHref({ ...range, days: days as Range["days"] })}#funcionamento`,
  );
}

/** O período do crescimento, em semanas; o link mantém os dias e volta ao bloco. */
export function weeksControl(range: Range): string {
  return rangeControl(
    "periodo-semanas",
    "Últimas",
    "semanas",
    GROWTH_WEEKS,
    range.weeks,
    (weeks) => `${rangeHref({ ...range, weeks: weeks as Range["weeks"] })}#crescimento`,
  );
}

/* ---------------------------------------------------------------- Precisa de ti */

interface Todo {
  tone: "attention" | "ok";
  iconName: IconName;
  title: string;
  sub: string;
  link?: { href: string; label: string };
}

/** Os alimentos do catálogo ainda com valores provisórios (a curadoria da TCA por fazer). */
export const PROVISIONAL_FOODS = FOODS.filter((f) => f.tcaCode === TODO).length;

/**
 * "Precisa de ti": o que pede uma ação, primeiro na página. Os indicadores do funcionamento em
 * atenção, os modelos sem preço (o custo fica por baixo) e os alimentos com valores provisórios;
 * sem nada disso, uma só linha a dizê-lo.
 */
export function needsYou(data: DashboardData, range: Range): string {
  const todos: Todo[] = [];
  if (data.ops.ok) {
    for (const tile of healthTiles(data.ops.value)) {
      if (tile.status !== "attention") continue;
      todos.push({
        tone: "attention",
        iconName: tile.iconName,
        title: tile.title,
        sub: tile.reason,
        link: { href: "#funcionamento", label: "Ver" },
      });
    }
  } else {
    todos.push({
      tone: "attention",
      iconName: "server",
      title: "Funcionamento por ler",
      sub: "Não foi possível ler os contadores da app. Recarrega a página.",
    });
  }
  if (data.recipes.ok) {
    const unpriced = data.recipes.value.last30.byModel.filter(
      (m) => m.cost === null && m.model !== "mock",
    );
    if (unpriced.length > 0) {
      todos.push({
        tone: "attention",
        iconName: "spark",
        title: `${plural(unpriced.length, "Modelo sem preço", "Modelos sem preço")}: ${unpriced.map((m) => m.model).join(", ")}`,
        sub: "As receitas destes modelos não entram no custo. Acrescenta o preço em admin/src/pricing.ts.",
        link: { href: "#ia", label: "Ver" },
      });
    }
  }
  if (PROVISIONAL_FOODS > 0) {
    todos.push({
      tone: "attention",
      iconName: "food",
      title: counted(
        PROVISIONAL_FOODS,
        "alimento com valores provisórios",
        "alimentos com valores provisórios",
      ),
      sub: "A curadoria da TCA do INSA ainda não está feita: a proteína destes alimentos é provisória.",
      link: { href: "/alimentos", label: "Ver" },
    });
  }
  if (todos.length === 0) {
    todos.push({
      tone: "ok",
      iconName: "ok",
      title: "Tudo em ordem",
      sub: "Nenhum indicador do funcionamento pede atenção, todos os modelos têm preço e o catálogo está curado.",
    });
  }
  const items = todos
    .map(
      (t) =>
        `<li class="todo-${t.tone}"><span class="todo-dot" aria-hidden="true"></span>${icon(t.iconName)}<div class="todo-text"><p class="todo-title">${escapeHtml(t.title)}</p><p class="todo-sub">${escapeHtml(t.sub)}</p></div>${t.link ? arrowLink(t.link.href, t.link.label) : ""}</li>`,
    )
    .join("");
  return card({
    id: "precisa",
    title: "Precisa de ti",
    aside: cardMeta(`Funcionamento dos últimos ${num(range.days)} dias`),
    body: `<ul class="todo">${items}</ul>`,
    flush: true,
  });
}

/* ---------------------------------------------------------------- Faixa de números */

const failedCell = (id: string, label: string, iconName: "users" | "ok" | "recipe" | "spark") =>
  stripCell({ id, iconName, label, figure: "—", lines: ["Não foi possível ler estes dados."] });

/** A variação face aos 7 dias anteriores ("+25% face aos 7 dias anteriores (8)"). */
function change(w: Window): string {
  return w.previous > 0
    ? `<strong>${escapeHtml(signedPct((w.recent - w.previous) / w.previous))}</strong> face aos 7 dias anteriores (${num(w.previous)})`
    : `${num(w.previous)} nos 7 dias anteriores`;
}

function kpis(data: DashboardData): string {
  const u = data.users.ok ? data.users.value : null;
  const r = data.recipes.ok ? data.recipes.value : null;
  const a = data.active.ok ? data.active.value : null;
  const cells = [
    u
      ? stripCell({
          id: "kpi-contas",
          iconName: "users",
          label: "Utilizadores",
          figure: num(u.total),
          lines: [
            u.created.recent === 0
              ? "Nenhum novo nos últimos 7 dias"
              : `<strong>+${num(u.created.recent)}</strong> nos últimos 7 dias`,
            `${num(u.created.previous)} nos 7 dias anteriores · +${num(u.new30)} em 30 dias`,
          ],
        })
      : failedCell("kpi-contas", "Utilizadores", "users"),
    u
      ? stripCell({
          id: "kpi-onboarding",
          iconName: "ok",
          label: "Onboarding feito",
          figure: u.total > 0 ? pct(u.onboarded / u.total) : "—",
          lines: [`${num(u.onboarded)} de ${counted(u.total, "conta", "contas")}`],
        })
      : failedCell("kpi-onboarding", "Onboarding feito", "ok"),
    a
      ? stripCell({
          id: "kpi-ativos",
          iconName: "users",
          label: "Ativos (7 dias)",
          figure: num(a.weekly),
          lines: [
            "fizeram alguma coisa na app nos últimos 7 dias",
            u && u.total > 0 ? `${pct(a.weekly / u.total)} das contas` : "",
          ].filter(Boolean),
        })
      : failedCell("kpi-ativos", "Ativos (7 dias)", "users"),
    r
      ? stripCell({
          id: "kpi-receitas",
          iconName: "recipe",
          label: "Receitas novas",
          figure: num(r.created.recent),
          lines: [
            `nos últimos 7 dias · ${change(r.created)}`,
            `<strong>${num(r.today)}</strong> hoje · ${num(r.total)} desde o início`,
          ],
        })
      : failedCell("kpi-receitas", "Receitas novas", "recipe"),
    r
      ? stripCell({
          id: "kpi-custo",
          iconName: "spark",
          label: "Custo da IA (30 dias)",
          figure: escapeHtml(usd(r.last30.cost)),
          lines: [
            `${escapeHtml(tokens(r.last30.input))} tokens de entrada · ${escapeHtml(tokens(r.last30.output))} de saída`,
            `${escapeHtml(usd(r.allTime.cost))} desde o início (estimativa)`,
          ],
        })
      : failedCell("kpi-custo", "Custo da IA (30 dias)", "spark"),
  ];
  return strip(cells, "Números principais");
}

/* ---------------------------------------------------------------- Listas curtas */

function recipeList(
  id: string,
  title: string,
  loaded: Loaded<TopRecipesMetrics>,
  pick: (m: TopRecipesMetrics) => TopRecipe[],
  empty: [string, string],
): string {
  const aside = arrowLink("/receitas?ordem=guardadas", "Todas");
  if (!loaded.ok) return card({ id, title, aside, body: FAILED_NOTE });
  const items = pick(loaded.value);
  const body =
    items.length === 0
      ? emptyState("recipe", empty[0], empty[1])
      : `<ul class="short-list">${items
          .map(
            (r) =>
              `<li><a href="${escapeHtml(recipeHref(r.id))}"><span class="short-main"><span class="short-title">${escapeHtml(r.title)}</span><span class="short-sub">${escapeHtml(mealLabel(r.meal))}</span></span><span class="short-value">${num(r.n)} <span class="muted">${plural(r.n, "pessoa", "pessoas")}</span></span></a></li>`,
          )
          .join("")}</ul>`;
  return card({ id, title, aside, body, flush: items.length > 0 });
}

function shortLists(loaded: Loaded<TopRecipesMetrics>): string {
  return `<div class="grid grid-2">${recipeList(
    "mais-guardadas",
    "Receitas mais guardadas",
    loaded,
    (m) => m.saved,
    ["Ainda sem receitas guardadas", "Aparecem quando alguém guardar uma receita."],
  )}
${recipeList("mais-no-dia", "Mais postas no dia", loaded, (m) => m.inDay, [
  "Ainda ninguém pôs uma receita no dia",
  "Aparecem com o “Pôr no meu dia” das receitas.",
])}</div>`;
}

/* ---------------------------------------------------------------- Gráficos */

function chartPanel(id: string, title: string, sub: string, plot: string, data: string): string {
  return `<article class="card chart" aria-labelledby="${id}">
<div class="card-head"><h3 id="${id}">${escapeHtml(title)}</h3></div>
<div class="chart-body">
<p class="chart-sub">${sub}</p>
${plot}
${dataDetails("Ver os dados", data)}
</div>
</article>`;
}

/** As datas por baixo de um gráfico: a primeira, a do meio e a atual. */
function axis(labels: readonly [string, string, string]): string {
  return `<p class="axis" aria-hidden="true">${labels.map((l) => `<span>${escapeHtml(l)}</span>`).join("")}</p>`;
}

function plot(columns: readonly Column[], label: string, height: number, axisHtml: string) {
  const top = Math.max(0, ...columns.map((c) => c.value));
  const yAxis = `<p class="y-axis" aria-hidden="true"><span>${top > 0 ? num(top) : ""}</span><span>0</span></p>`;
  return `<div class="plot">${yAxis}<div class="plot-area">${columnChart(columns, { height, label })}${axisHtml}</div></div>`;
}

/** O máximo de uma série ("Máximo: 12, na semana de 3 nov."). */
function peak(values: readonly number[], keys: readonly number[], label: (key: number) => string) {
  let best = -1;
  values.forEach((v, i) => {
    if (v > 0 && (best < 0 || v >= (values[best] ?? 0))) best = i;
  });
  const key = keys[best];
  return best < 0 || key === undefined
    ? null
    : `Máximo: <strong>${num(values[best] ?? 0)}</strong>, ${escapeHtml(label(key))}.`;
}

/** Um gráfico de colunas por semana (as contas novas ou as receitas novas). */
function weeklyChart({
  id,
  title,
  weeks,
  values,
  now,
  noun,
  empty,
}: {
  id: string;
  title: string;
  weeks: readonly number[];
  values: readonly number[];
  now: number;
  noun: [string, string];
  empty: string;
}): string {
  const current = weekStartDay(now);
  const columns: Column[] = weeks.map((week, i) => {
    const value = values[i] ?? 0;
    const partial = week === current;
    return {
      value,
      partial,
      title: `Semana de ${dayLabel(week * DAY_MS)}${partial ? " (em curso)" : ""}: ${counted(value, noun[0], noun[1])}`,
    };
  });
  const weekText = (week: number) =>
    week === current ? "esta semana" : dayLabel(week * DAY_MS, true);
  const sub = peak(values, weeks, (w) => `na semana de ${dayLabel(w * DAY_MS)}`) ?? empty;
  const first = weeks[0] ?? current;
  const middle = weeks[Math.floor((weeks.length - 1) / 2)] ?? current;
  return chartPanel(
    id,
    title,
    `${sub} A semana em curso, mais clara.`,
    plot(
      columns,
      `${title}, nas últimas ${weeks.length} semanas`,
      120,
      axis([dayLabel(first * DAY_MS), dayLabel(middle * DAY_MS), "esta semana"]),
    ),
    dataTable(
      `${title}, da mais recente`,
      ["Semana de", noun[1].charAt(0).toUpperCase() + noun[1].slice(1)],
      weeks
        .map((week, i) => ({ head: escapeHtml(weekText(week)), cells: [values[i] ?? 0] }))
        .reverse(),
    ),
  );
}

function growthRow(data: DashboardData, now: number, filterHtml: string): string {
  const failed = (title: string) =>
    `<article class="card chart"><div class="card-head"><h3>${escapeHtml(title)}</h3></div><div class="chart-body">${FAILED_NOTE}</div></article>`;
  const users = data.users.ok
    ? weeklyChart({
        id: "grafico-contas",
        title: "Contas novas por semana",
        weeks: data.users.value.weeks,
        values: data.users.value.createdPerWeek,
        now,
        noun: ["conta nova", "contas novas"],
        empty: "Nenhuma conta nova nestas semanas.",
      })
    : failed("Contas novas por semana");
  const recipes = data.recipes.ok
    ? weeklyChart({
        id: "grafico-receitas",
        title: "Receitas novas por semana",
        weeks: data.recipes.value.weeks,
        values: data.recipes.value.perWeek,
        now,
        noun: ["receita nova", "receitas novas"],
        empty: "Nenhuma receita nova nestas semanas.",
      })
    : failed("Receitas novas por semana");
  return row(
    "crescimento",
    "Crescimento",
    "Semanas de segunda a domingo, em UTC. As receitas são as novas (as da cache não contam).",
    `<div class="grid grid-2">${users}\n${recipes}</div>`,
    filterHtml,
  );
}

/* ---------------------------------------------------------------- IA e receitas */

function modelTable(caption: string, w: TokenWindow): string {
  if (w.byModel.length === 0) return note("Nenhuma receita gerada neste período.");
  const rows = w.byModel
    .map(
      (m) =>
        `<tr><th scope="row"><code>${escapeHtml(m.model)}</code></th><td class="num">${num(m.recipes)}</td><td class="num">${num(m.input)}</td><td class="num">${num(m.output)}</td><td class="num">${m.cost === null ? `<span class="muted">sem preço</span>` : escapeHtml(usd(m.cost))}</td></tr>`,
    )
    .join("");
  const total =
    w.byModel.length > 1
      ? `<tfoot><tr><th scope="row">Total</th><td class="num">${num(w.recipes)}</td><td class="num">${num(w.input)}</td><td class="num">${num(w.output)}</td><td class="num">${escapeHtml(usd(w.cost))}</td></tr></tfoot>`
      : "";
  return tableScroll(
    caption,
    `<table><caption class="visually-hidden">${escapeHtml(caption)}</caption><thead><tr><th scope="col">Modelo</th><th scope="col" class="num">Receitas</th><th scope="col" class="num">Tokens de entrada</th><th scope="col" class="num">Tokens de saída</th><th scope="col" class="num">Custo estimado</th></tr></thead><tbody>${rows}</tbody>${total}</table>`,
  );
}

function priceNote(): string {
  const prices = Object.entries(AI_PRICES_USD_PER_MTOK)
    .map(
      ([model, p]) =>
        `<code>${escapeHtml(model)}</code>: ${escapeHtml(usd(p.input))} por 1M de tokens de entrada e ${escapeHtml(usd(p.output))} por 1M de saída`,
    )
    .join("; ");
  return `<p class="card-foot">Estimativa com os preços de <code>admin/src/pricing.ts</code> (${prices}). Cada receita gera-se uma vez: os pedidos servidos pela cache ou pela biblioteca não gastam tokens e não aparecem aqui. As receitas pré-geradas pela Batch API custaram metade do que se mostra.</p>`;
}

function aiRow(loaded: Loaded<RecipesMetrics>): string {
  if (!loaded.ok) return row("ia", "IA e receitas", "", FAILED_NOTE);
  const r = loaded.value;
  const missing = r.allTime.byModel.reduce((sum, m) => sum + m.missing, 0);
  const usage = card({
    id: "custos",
    title: "Tokens e custo por modelo",
    flush: true,
    body: `<div class="card-section"><h3 class="section-title">Últimos 30 dias</h3></div>${modelTable("Tokens e custo por modelo, nos últimos 30 dias", r.last30)}
<div class="card-section"><h3 class="section-title">Desde o início</h3></div>${modelTable("Tokens e custo por modelo, desde o início", r.allTime)}
${missing > 0 ? `<p class="card-foot">${counted(missing, "receita sem os tokens guardados", "receitas sem os tokens guardados")} (não entram no custo).</p>` : ""}${priceNote()}`,
  });
  const avg = r.allTime.recipes > 0 ? r.allTime.cost / r.allTime.recipes : 0;
  const saved = card({
    id: "guardadas",
    title: "Receitas guardadas",
    body: `<div class="stats">
<div class="stat"><p class="stat-value">${num(r.saved)}</p><p class="stat-label">guardadas (todas as contas)</p></div>
<div class="stat"><p class="stat-value">${num(r.saved7)}</p><p class="stat-label">nos últimos 7 dias</p></div>
<div class="stat"><p class="stat-value">${num(r.savers)}</p><p class="stat-label">${r.savers === 1 ? "pessoa com receitas guardadas" : "pessoas com receitas guardadas"}</p></div>
<div class="stat"><p class="stat-value">${escapeHtml(usd(avg))}</p><p class="stat-label">custo médio por receita</p></div>
</div>
<p class="card-foot">${arrowLink("/receitas", "Ver as receitas")}</p>`,
  });
  return row(
    "ia",
    "IA e receitas",
    "Os tokens que cada receita nova gastou e o custo estimado.",
    `<div class="grid grid-split">${usage}\n${saved}</div>`,
  );
}

/* ---------------------------------------------------------------- Preferências */

/** "12 · 40%": a contagem e a parte das contas com o onboarding feito. */
const share = (n: number, base: number) => (base > 0 ? `${num(n)} · ${pct(n / base)}` : num(n));

function bucketsCard(
  id: string,
  title: string,
  items: readonly BarItem[],
  base: number,
  caption: string,
): string {
  return card({
    id,
    title,
    body:
      items.length === 0 || base === 0
        ? note("Ainda sem contas com o onboarding feito.")
        : barList(
            items.map((i) => ({ ...i, text: share(i.value, base) })),
            caption,
          ),
  });
}

const bucketItems = (buckets: readonly Bucket[], label: (key: string) => string): BarItem[] =>
  buckets.map((b) => ({ label: label(b.key), value: b.n }));

function preferencesRow(loaded: Loaded<PreferencesMetrics>): string {
  if (!loaded.ok) return row("preferencias", "Preferências", "", FAILED_NOTE);
  const p = loaded.value;
  const base = p.onboarded;
  const trainCard = card({
    id: "treino",
    title: "Treino",
    body:
      base === 0
        ? note("Ainda sem contas com o onboarding feito.")
        : `<p class="big-figure">${escapeHtml(pct(p.training.any / base))}</p><p class="panel-sub">treinam (têm uma refeição antes ou depois do treino): ${num(p.training.any)} de ${num(base)}.</p>${barList(
            [
              { label: "Pré-treino", value: p.training.pre, text: share(p.training.pre, base) },
              { label: "Pós-treino", value: p.training.post, text: share(p.training.post, base) },
            ],
            "Refeições à volta do treino",
          )}`,
  });
  const kcalCard = card({
    id: "calorias",
    title: "Calorias",
    body:
      base === 0
        ? note("Ainda sem contas com o onboarding feito.")
        : `<p class="big-figure">${escapeHtml(pct(p.showKcal / base))}</p><p class="panel-sub">veem as calorias no "Hoje" (só informação; desligado por defeito): ${num(p.showKcal)} de ${num(base)}.</p>`,
  });
  return row(
    "preferencias",
    "Preferências",
    `Das ${counted(base, "conta", "contas")} com o onboarding feito; a percentagem é dessas contas.`,
    `<div class="grid grid-3">${bucketsCard(
      "dietas",
      "Alimentação",
      bucketItems(p.diets, (k) => labelOf(DIET_LABEL, k)),
      base,
      "Contas por tipo de alimentação",
    )}
${bucketsCard(
  "refeicoes",
  "Refeições por dia",
  bucketItems(p.mealCounts, (k) => `${k} ${k === "1" ? "refeição" : "refeições"}`),
  base,
  "Contas por número de refeições por dia",
)}
${trainCard}
${bucketsCard(
  "tempo",
  "Tempo para cozinhar",
  bucketItems(p.cookMinutes, (k) => `Até ${k} min`),
  base,
  "Contas por tempo para cozinhar",
)}
${bucketsCard(
  "equipamento",
  "Equipamento",
  bucketItems(p.equipment, (k) => labelOf(EQUIPMENT_LABEL, k)),
  base,
  "Contas com cada equipamento de cozinha",
)}
${kcalCard}</div>`,
  );
}

/* ---------------------------------------------------------------- Alimentos */

function foodItems(buckets: readonly Bucket[]): BarItem[] {
  return buckets.map((b) => {
    const food = catalogFood(b.key);
    return {
      label: foodName(b.key),
      sub: food ? CATEGORY_LABEL[food.category] : "Fora do catálogo",
      value: b.n,
      href: food ? `/alimentos/${encodeURIComponent(b.key)}` : undefined,
    };
  });
}

function foodsRow(loaded: Loaded<TopFoodsMetrics>): string {
  if (!loaded.ok) return row("alimentos", "Alimentos", "", FAILED_NOTE);
  const f = loaded.value;
  const liked = card({
    id: "mais-escolhidos",
    title: "Mais escolhidos",
    aside: arrowLink("/alimentos", "Todos"),
    body:
      f.liked.length === 0
        ? emptyState(
            "food",
            "Ainda ninguém escolheu alimentos",
            "Aparecem quando as pessoas fizerem o onboarding.",
          )
        : barList(
            foodItems(f.liked).map((i) => ({ ...i, text: counted(i.value, "pessoa", "pessoas") })),
            "Alimentos mais escolhidos no onboarding, por número de pessoas",
          ),
  });
  const used = card({
    id: "mais-usados",
    title: "Mais usados nas receitas",
    aside: arrowLink("/alimentos?ordem=receitas", "Todos"),
    body:
      f.inRecipes.length === 0
        ? emptyState("recipe", "Ainda sem receitas", "Aparecem quando a app gerar as primeiras.")
        : barList(
            foodItems(f.inRecipes).map((i) => ({
              ...i,
              text: counted(i.value, "receita", "receitas"),
            })),
            "Alimentos mais usados nas receitas geradas, por número de receitas",
          ),
  });
  return row(
    "alimentos",
    "Alimentos",
    `Os 15 primeiros. ${counted(f.choosers, "pessoa escolheu", "pessoas escolheram")} alimentos de que gostam e que têm em casa.`,
    `<div class="grid grid-2">${liked}\n${used}</div>`,
  );
}

/* ---------------------------------------------------------------- Saúde (só agregado) */

function healthDataRow(loaded: Loaded<HealthMetrics>): string {
  if (!loaded.ok) return row("saude", "Dados de saúde", "", FAILED_NOTE);
  const h = loaded.value;
  const rows = ALLERGENS.map((a) => {
    const n = h.byAllergen.get(a) ?? 0;
    return `<tr><th scope="row">${escapeHtml(ALLERGEN_LABEL[a])}</th><td class="num${n < MIN_GROUP ? " zero" : ""}">${escapeHtml(healthCount(n))}</td></tr>`;
  }).join("");
  const body = `<div class="stats">
<div class="stat"><p class="stat-value">${num(h.consented)}</p><p class="stat-label">${h.consented === 1 ? "conta com consentimento de dados de saúde" : "contas com consentimento de dados de saúde"}</p></div>
<div class="stat"><p class="stat-value">${escapeHtml(healthCount(h.withAllergies))}</p><p class="stat-label">com pelo menos uma alergia ou intolerância</p></div>
</div>
${tableScroll("Pessoas por alergénio", `<table><caption>Pessoas por alergénio (abaixo de ${MIN_GROUP}, “&lt;${MIN_GROUP}”)</caption><thead><tr><th scope="col">Alergénio</th><th scope="col" class="num">Pessoas</th></tr></thead><tbody>${rows}</tbody></table>`)}
<p class="card-foot">Só contagens, nunca por pessoa: abaixo de ${MIN_GROUP} pessoas aparece “&lt;${MIN_GROUP}” (também o zero). O peso nunca aparece no backoffice.</p>`;
  return row(
    "saude",
    "Dados de saúde",
    "Só agregados: as alergias de quem deu o consentimento de dados de saúde.",
    card({ id: "alergias", title: "Alergias e intolerâncias", aside: cardMeta("Agregado"), body }),
  );
}

/* ---------------------------------------------------------------- Página */

/**
 * O Painel, por ordem (como no backoffice do Rejection Quest): o que precisa de uma ação, os
 * números principais, duas listas curtas e, por baixo, os blocos com os gráficos (funcionamento,
 * crescimento, pessoas ativas, retenção e ativação), a IA, as preferências, os alimentos e os
 * dados de saúde agregados.
 */
export function dashboardPage({
  adminEmail,
  now,
  range,
  data,
}: {
  adminEmail: string;
  now: number;
  range: Range;
  data: DashboardData;
}): string {
  const day = new Date(now).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return pageShell({
    title: "Painel",
    section: "painel",
    adminEmail,
    now,
    heading: "Painel",
    sub: `${escapeHtml(day.charAt(0).toUpperCase() + day.slice(1))} · o funcionamento, o uso da app e o custo da IA.`,
    about:
      "<p>Só totais e contagens, nunca uma pessoa. “Ativos” são as pessoas que fizeram alguma coisa na app (entraram, pediram ou guardaram uma receita, mudaram o dia ou as preferências). O funcionamento vem dos contadores diários da app, sem pessoas. As preferências contam só as contas com o onboarding feito. O custo é uma estimativa a partir dos tokens guardados em cada receita.</p>",
    body: [
      needsYou(data, range),
      kpis(data),
      shortLists(data.topRecipes),
      healthRow(data.ops, now, daysControl(range)),
      growthRow(data, now, weeksControl(range)),
      activeRow(data.active),
      retentionRow(data.cohorts, now),
      funnelRow(data.funnel),
      aiRow(data.recipes),
      preferencesRow(data.preferences),
      foodsRow(data.foods),
      healthDataRow(data.health),
    ].join("\n"),
  });
}
