import type { AdminDb } from "./db";
import { DAY_MS, dayOf, weekStartDay } from "./format";
import { estimatedCost } from "./pricing";

/**
 * As contas do Painel: só totais e contagens por grupo, nunca uma linha de uma pessoa. "Os
 * últimos 7 dias" são as 7 × 24 h antes da leitura; os dias e as semanas (de segunda a domingo)
 * são em UTC. As preferências contam só as contas com o onboarding feito (antes dele, o perfil
 * tem os valores por omissão). As alergias contam só perfis com o consentimento de dados de
 * saúde e aparecem com o limite de privacy.ts.
 */

/** Semanas do gráfico das contas novas e dias do gráfico das receitas (o atual incluído). */
export const WEEKS = 12;
export const DAYS = 30;

/** As últimas `count` semanas (o dia de cada segunda-feira), da mais antiga para a atual. */
export function lastWeeks(now: number, count = WEEKS): number[] {
  const current = weekStartDay(now);
  return Array.from({ length: count }, (_, i) => current - (count - 1 - i) * 7);
}

/** Os últimos `count` dias (desde 1/1/1970, UTC), do mais antigo para o atual. */
export function lastDays(now: number, count = DAYS): number[] {
  const current = dayOf(now);
  return Array.from({ length: count }, (_, i) => current - (count - 1 - i));
}

/** Uma série com zero nos intervalos sem linhas. */
function series(keys: readonly number[], rows: readonly { k: number; n: number }[]): number[] {
  const byKey = new Map(rows.map((r) => [Number(r.k), Number(r.n)]));
  return keys.map((key) => byKey.get(key) ?? 0);
}

/** A semana (o dia da segunda-feira) de uma coluna em epoch ms, em SQL (divisão inteira). */
const weekOf = (column: string) => `(${column} / 86400000) - ((${column} / 86400000 + 3) % 7)`;

export interface UsersMetrics {
  total: number;
  new7: number;
  new30: number;
  /** Contas com o onboarding feito. */
  onboarded: number;
  /** Contas com uma sessão criada nos últimos 7 dias (entraram na app). */
  active7: number;
  weeks: number[];
  createdPerWeek: number[];
}

export async function usersMetrics(db: AdminDb, now: number): Promise<UsersMetrics> {
  const weeks = lastWeeks(now);
  const since = (weeks[0] ?? 0) * DAY_MS;
  const [totals, onboarded, active, perWeek] = await Promise.all([
    db.first<{ total: number; new7: number | null; new30: number | null }>(
      `select count(*) as total,
        sum(case when created_at >= ? then 1 else 0 end) as new7,
        sum(case when created_at >= ? then 1 else 0 end) as new30
      from "user"`,
      now - 7 * DAY_MS,
      now - 30 * DAY_MS,
    ),
    db.first<{ n: number }>(
      `select count(*) as n from profiles p join "user" u on u.id = p.user_id
      where p.onboarded_at is not null`,
    ),
    db.first<{ n: number }>(
      "select count(distinct user_id) as n from session where created_at >= ?",
      now - 7 * DAY_MS,
    ),
    db.all<{ k: number; n: number }>(
      `select ${weekOf("created_at")} as k, count(*) as n from "user"
      where created_at >= ? group by 1`,
      since,
    ),
  ]);
  return {
    total: Number(totals?.total ?? 0),
    new7: Number(totals?.new7 ?? 0),
    new30: Number(totals?.new30 ?? 0),
    onboarded: Number(onboarded?.n ?? 0),
    active7: Number(active?.n ?? 0),
    weeks,
    createdPerWeek: series(weeks, perWeek),
  };
}

export interface ModelUsage {
  model: string;
  recipes: number;
  input: number;
  output: number;
  /** Receitas sem tokens guardados (geradas antes de os guardar, ou sem resposta do modelo). */
  missing: number;
  /** null se o modelo não tem preço (pricing.ts). */
  cost: number | null;
}

export interface TokenWindow {
  recipes: number;
  input: number;
  output: number;
  /** O custo dos modelos com preço. */
  cost: number;
  byModel: ModelUsage[];
}

export interface RecipesMetrics {
  total: number;
  today: number;
  d7: number;
  d30: number;
  days: number[];
  perDay: number[];
  saved: number;
  saved7: number;
  /** Pessoas com pelo menos uma receita guardada. */
  savers: number;
  last30: TokenWindow;
  allTime: TokenWindow;
}

function tokenWindow(rows: readonly ModelUsage[]): TokenWindow {
  const byModel = rows.filter((r) => r.recipes > 0).sort((a, b) => b.recipes - a.recipes);
  return {
    recipes: byModel.reduce((sum, r) => sum + r.recipes, 0),
    input: byModel.reduce((sum, r) => sum + r.input, 0),
    output: byModel.reduce((sum, r) => sum + r.output, 0),
    cost: byModel.reduce((sum, r) => sum + (r.cost ?? 0), 0),
    byModel,
  };
}

export async function recipesMetrics(db: AdminDb, now: number): Promise<RecipesMetrics> {
  const days = lastDays(now);
  const todayStart = dayOf(now) * DAY_MS;
  const cut30 = now - 30 * DAY_MS;
  const [counts, perDay, models, saved] = await Promise.all([
    db.first<{ total: number; today: number | null; d7: number | null; d30: number | null }>(
      `select count(*) as total,
        sum(case when created_at >= ? then 1 else 0 end) as today,
        sum(case when created_at >= ? then 1 else 0 end) as d7,
        sum(case when created_at >= ? then 1 else 0 end) as d30
      from recipes`,
      todayStart,
      now - 7 * DAY_MS,
      cut30,
    ),
    db.all<{ k: number; n: number }>(
      "select created_at / 86400000 as k, count(*) as n from recipes where created_at >= ? group by 1",
      (days[0] ?? 0) * DAY_MS,
    ),
    db.all<{
      model: string;
      n: number;
      input: number;
      output: number;
      missing: number;
      n30: number;
      input30: number;
      output30: number;
      missing30: number;
    }>(
      `select model, count(*) as n,
        coalesce(sum(input_tokens), 0) as input,
        coalesce(sum(output_tokens), 0) as output,
        sum(case when input_tokens is null or output_tokens is null then 1 else 0 end) as missing,
        sum(case when created_at >= ? then 1 else 0 end) as n30,
        coalesce(sum(case when created_at >= ? then input_tokens end), 0) as input30,
        coalesce(sum(case when created_at >= ? then output_tokens end), 0) as output30,
        sum(case when created_at >= ? and (input_tokens is null or output_tokens is null)
          then 1 else 0 end) as missing30
      from recipes group by model`,
      cut30,
      cut30,
      cut30,
      cut30,
    ),
    db.first<{ n: number; d7: number | null; savers: number }>(
      `select count(*) as n, sum(case when saved_at >= ? then 1 else 0 end) as d7,
        count(distinct user_id) as savers
      from saved_recipes`,
      now - 7 * DAY_MS,
    ),
  ]);
  const usage = (
    model: string,
    recipes: number,
    input: number,
    output: number,
    missing: number,
  ): ModelUsage => ({
    model,
    recipes,
    input,
    output,
    missing,
    cost: estimatedCost(model, input, output),
  });
  return {
    total: Number(counts?.total ?? 0),
    today: Number(counts?.today ?? 0),
    d7: Number(counts?.d7 ?? 0),
    d30: Number(counts?.d30 ?? 0),
    days,
    perDay: series(days, perDay),
    saved: Number(saved?.n ?? 0),
    saved7: Number(saved?.d7 ?? 0),
    savers: Number(saved?.savers ?? 0),
    last30: tokenWindow(
      models.map((m) =>
        usage(m.model, Number(m.n30), Number(m.input30), Number(m.output30), Number(m.missing30)),
      ),
    ),
    allTime: tokenWindow(
      models.map((m) =>
        usage(m.model, Number(m.n), Number(m.input), Number(m.output), Number(m.missing)),
      ),
    ),
  };
}

/** Uma contagem por valor (dieta, número de refeições, minutos, equipamento). */
export interface Bucket {
  key: string;
  n: number;
}

export interface PreferencesMetrics {
  /** Contas com o onboarding feito (a base de todas as contagens daqui). */
  onboarded: number;
  diets: Bucket[];
  mealCounts: Bucket[];
  /** Com uma refeição pré-treino, pós-treino, ou alguma das duas. */
  training: { any: number; pre: number; post: number };
  cookMinutes: Bucket[];
  equipment: Bucket[];
}

const ONBOARDED = "p.onboarded_at is not null";

/** Uma coluna JSON, ou uma lista vazia se o texto não for JSON (o json_each falharia). */
export const jsonList = (column: string) =>
  `(case when json_valid(${column}) then ${column} else '[]' end)`;

const buckets = (rows: readonly { k: string | number | null; n: number }[]): Bucket[] =>
  rows.filter((r) => r.k !== null).map((r) => ({ key: String(r.k), n: Number(r.n) }));

export async function preferencesMetrics(db: AdminDb): Promise<PreferencesMetrics> {
  const [base, diets, mealCounts, cook, equipment] = await Promise.all([
    db.first<{ n: number; trains: number | null; pre: number | null; post: number | null }>(
      `select count(*) as n,
        sum(case when p.pre_workout_meal is not null or p.post_workout_meal is not null
          then 1 else 0 end) as trains,
        sum(case when p.pre_workout_meal is not null then 1 else 0 end) as pre,
        sum(case when p.post_workout_meal is not null then 1 else 0 end) as post
      from profiles p where ${ONBOARDED}`,
    ),
    db.all<{ k: string; n: number }>(
      `select p.diet as k, count(*) as n from profiles p where ${ONBOARDED} group by 1 order by 2 desc`,
    ),
    db.all<{ k: number; n: number }>(
      `select json_array_length(${jsonList("p.meals")}) as k, count(*) as n from profiles p
      where ${ONBOARDED} group by 1 order by 1`,
    ),
    db.all<{ k: number; n: number }>(
      `select p.cook_minutes as k, count(*) as n from profiles p where ${ONBOARDED} group by 1 order by 1`,
    ),
    db.all<{ k: string; n: number }>(
      `select e.value as k, count(distinct p.user_id) as n
      from profiles p, json_each(${jsonList("p.equipment")}) e
      where ${ONBOARDED} group by 1 order by 2 desc`,
    ),
  ]);
  return {
    onboarded: Number(base?.n ?? 0),
    diets: buckets(diets),
    mealCounts: buckets(mealCounts),
    training: {
      any: Number(base?.trains ?? 0),
      pre: Number(base?.pre ?? 0),
      post: Number(base?.post ?? 0),
    },
    cookMinutes: buckets(cook),
    equipment: buckets(equipment),
  };
}

/** Quantos alimentos aparecem nas listas do Painel. */
export const TOP_FOODS = 15;

export interface TopFoodsMetrics {
  /** Pessoas que escolheram pelo menos um alimento. */
  choosers: number;
  liked: Bucket[];
  /** Receitas com cada alimento. */
  inRecipes: Bucket[];
}

export async function topFoodsMetrics(db: AdminDb): Promise<TopFoodsMetrics> {
  const [choosers, liked, inRecipes] = await Promise.all([
    db.first<{ n: number }>(
      `select count(*) as n from profiles p
      where json_array_length(${jsonList("p.liked_foods")}) > 0`,
    ),
    db.all<{ k: string; n: number }>(
      `select j.value as k, count(distinct p.user_id) as n
      from profiles p, json_each(${jsonList("p.liked_foods")}) j
      group by 1 order by 2 desc, 1 limit ?`,
      TOP_FOODS,
    ),
    db.all<{ k: string; n: number }>(
      `select food_id as k, count(distinct recipe_id) as n from recipe_ingredients
      group by 1 order by 2 desc, 1 limit ?`,
      TOP_FOODS,
    ),
  ]);
  return {
    choosers: Number(choosers?.n ?? 0),
    liked: buckets(liked),
    inRecipes: buckets(inRecipes),
  };
}

export interface HealthMetrics {
  /** Perfis com o consentimento de dados de saúde. */
  consented: number;
  /** Desses, com pelo menos uma alergia. */
  withAllergies: number;
  /** Pessoas por alergénio (só para mostrar com o limite de privacy.ts). */
  byAllergen: Map<string, number>;
}

/** Só contagens: nunca uma linha de uma pessoa (o limite dos 5 aplica-se ao mostrar). */
export async function healthMetrics(db: AdminDb): Promise<HealthMetrics> {
  const [base, byAllergen] = await Promise.all([
    db.first<{ n: number; allergic: number | null }>(
      `select count(*) as n,
        sum(case when json_array_length(${jsonList("p.allergies")}) > 0 then 1 else 0 end)
          as allergic
      from profiles p where p.health_consent_at is not null`,
    ),
    db.all<{ k: string; n: number }>(
      `select a.value as k, count(distinct p.user_id) as n
      from profiles p, json_each(${jsonList("p.allergies")}) a
      where p.health_consent_at is not null group by 1`,
    ),
  ]);
  return {
    consented: Number(base?.n ?? 0),
    withAllergies: Number(base?.allergic ?? 0),
    byAllergen: new Map(byAllergen.map((r) => [String(r.k), Number(r.n)])),
  };
}
