import { env } from "cloudflare:workers";
import { createAdminApp } from "../src/app";
import type { AdminBindings } from "../src/types";

/** Ajudas dos testes: escrevem na D1 local de cada ficheiro como a app escreveria. */

export const DAY = 86_400_000;
export const NOW = Date.now();
export const ORIGIN = "http://localhost:8789";

/** O backoffice em local (entrada sem Access, só a pedidos a localhost). */
export const localBindings = (): AdminBindings => ({
  DB: env.DB,
  ACCESS_TEAM_DOMAIN: "",
  ACCESS_AUD: "",
  ADMIN_EMAILS: "",
  ADMIN_DEV_BYPASS: "1",
  APP_URL: "https://protein-plate.app",
});

/** Um GET ao backoffice em local, com cookies opcionais. */
export async function get(path: string, cookie = ""): Promise<Response> {
  return createAdminApp().request(
    `${ORIGIN}${path}`,
    { headers: cookie ? { Cookie: cookie } : {} },
    localBindings(),
  );
}

/** O HTML de uma página (e confirma o 200). */
export async function html(path: string, cookie = ""): Promise<string> {
  const res = await get(path, cookie);
  if (res.status !== 200) throw new Error(`GET ${path}: ${res.status}`);
  return res.text();
}

const run = (sql: string, ...params: unknown[]) => env.DB.prepare(sql).bind(...params);

/** Todas as tabelas com linhas dos testes, pela ordem em que se podem apagar. */
const TABLES = [
  "plan_items",
  "day_plans",
  "meal_recipes",
  "user_recipes",
  "saved_recipes",
  "recipe_ingredients",
  "recipes",
  "profiles",
  "session",
  "account",
  "verification",
  "usage_counters",
  "ops_counters",
  '"user"',
];

export async function resetDb(): Promise<void> {
  await env.DB.batch(TABLES.map((t) => run(`delete from ${t}`)));
}

export interface UserSeed {
  id: string;
  name?: string;
  email?: string;
  createdAt?: number;
  providers?: string[];
  sessions?: { createdAt: number; expiresAt?: number }[];
}

export async function seedUser({
  id,
  name = `Pessoa ${id}`,
  email = `${id}@example.test`,
  createdAt = NOW - 10 * DAY,
  providers = ["google"],
  sessions = [],
}: UserSeed): Promise<void> {
  await env.DB.batch([
    run(
      'insert into "user" (id, name, email, email_verified, created_at, updated_at) values (?, ?, ?, 1, ?, ?)',
      id,
      name,
      email,
      createdAt,
      createdAt,
    ),
    ...providers.map((provider) =>
      run(
        "insert into account (id, account_id, provider_id, user_id, refresh_token, created_at, updated_at) values (?, ?, ?, ?, 'cifrado', ?, ?)",
        `acc-${id}-${provider}`,
        `${provider}-${id}`,
        provider,
        id,
        createdAt,
        createdAt,
      ),
    ),
    ...sessions.map((s, i) =>
      run(
        "insert into session (id, expires_at, token, created_at, updated_at, user_id) values (?, ?, ?, ?, ?, ?)",
        `sess-${id}-${i}`,
        s.expiresAt ?? NOW + 30 * DAY,
        `token-${id}-${i}`,
        s.createdAt,
        s.createdAt,
        id,
      ),
    ),
  ]);
}

export interface ProfileSeed {
  userId: string;
  dailyTargetG?: number;
  intensity?: string;
  weightKg?: number | null;
  meals?: string[];
  preWorkoutMeal?: string | null;
  postWorkoutMeal?: string | null;
  diet?: string;
  allergies?: string[];
  likedFoods?: string[];
  equipment?: string[];
  cookMinutes?: number;
  showKcal?: boolean;
  healthConsentAt?: number | null;
  onboardedAt?: number | null;
}

export async function seedProfile({
  userId,
  dailyTargetG = 160,
  intensity = "alta",
  weightKg = null,
  meals = ["pequeno-almoco", "almoco", "lanche", "jantar"],
  preWorkoutMeal = null,
  postWorkoutMeal = null,
  diet = "omnivore",
  allergies = [],
  likedFoods = [],
  equipment = ["stove", "microwave"],
  cookMinutes = 20,
  showKcal = false,
  healthConsentAt = null,
  onboardedAt = NOW - DAY,
}: ProfileSeed): Promise<void> {
  await run(
    `insert into profiles (user_id, daily_target_g, intensity, weight_kg, manual_target, meals,
      pre_workout_meal, post_workout_meal, diet, allergies, liked_foods, equipment, cook_minutes,
      show_kcal, locale, consent_version, consented_at, health_consent_at, onboarded_at, updated_at)
    values (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pt', 1, ?, ?, ?, ?)`,
    userId,
    dailyTargetG,
    intensity,
    weightKg,
    JSON.stringify(meals),
    preWorkoutMeal,
    postWorkoutMeal,
    diet,
    JSON.stringify(allergies),
    JSON.stringify(likedFoods),
    JSON.stringify(equipment),
    cookMinutes,
    showKcal ? 1 : 0,
    NOW - 2 * DAY,
    healthConsentAt,
    onboardedAt,
    NOW - DAY,
  ).run();
}

export interface RecipeSeed {
  id: string;
  title?: string;
  summary?: string;
  meal?: string;
  steps?: string[];
  model?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  createdAt?: number;
  ingredients?: { foodId: string; grams: number }[];
  /** Cópia reajustada de uma receita da biblioteca (sem tokens). */
  sourceRecipeId?: string | null;
}

export async function seedRecipe({
  id,
  title = `Receita ${id}`,
  summary = "Um prato simples.",
  meal = "almoco",
  steps = ["Cozinha.", "Serve."],
  model = "claude-haiku-5-5",
  inputTokens = 1000,
  outputTokens = 400,
  createdAt = NOW - DAY,
  sourceRecipeId = null,
  ingredients = [
    { foodId: "peito-frango", grams: 300 },
    { foodId: "arroz-branco", grams: 150 },
  ],
}: RecipeSeed): Promise<void> {
  await env.DB.batch([
    run(
      `insert into recipes (id, cache_key, locale, title, summary, meal, post_workout, servings,
        variant, prep_minutes, steps, protein_per_serving_g, meal_target_g, model, prompt_version,
        food_data_version, input_tokens, output_tokens, created_at, source_recipe_id)
      values (?, ?, 'pt', ?, ?, ?, 0, 2, 1, 20, ?, 35.5, 40, ?, 1, 3, ?, ?, ?, ?)`,
      id,
      `key-${id}`,
      title,
      summary,
      meal,
      JSON.stringify(steps),
      model,
      inputTokens,
      outputTokens,
      createdAt,
      sourceRecipeId,
    ),
    ...ingredients.map((ing, position) =>
      run(
        "insert into recipe_ingredients (recipe_id, position, food_id, grams) values (?, ?, ?, ?)",
        id,
        position,
        ing.foodId,
        ing.grams,
      ),
    ),
  ]);
}

export async function seedSaved(userId: string, recipeId: string, savedAt = NOW): Promise<void> {
  await run(
    "insert into saved_recipes (user_id, recipe_id, saved_at) values (?, ?, ?)",
    userId,
    recipeId,
    savedAt,
  ).run();
}

export async function seedDayPlan(userId: string, foodIds: string[]): Promise<void> {
  const planId = `plan-${userId}`;
  await env.DB.batch([
    run(
      "insert into day_plans (id, user_id, name, position, updated_at) values (?, ?, 'hoje', 0, ?)",
      planId,
      userId,
      NOW,
    ),
    ...foodIds.map((foodId, position) =>
      run(
        "insert into plan_items (id, plan_id, meal, food_id, portion_id, portion_count, position) values (?, ?, 'almoco', ?, ?, 1, ?)",
        `item-${userId}-${position}`,
        planId,
        foodId,
        `${foodId}:porcao`,
        position,
      ),
    ),
  ]);
}

/** Quantas linhas de uma tabela pertencem à conta. */
export async function countRows(table: string, column: string, id: string): Promise<number> {
  const row = await env.DB.prepare(`select count(*) as n from ${table} where ${column} = ?`)
    .bind(id)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/** Uma receita pedida pela pessoa (o histórico "Recentes"). */
export async function seedRequested(userId: string, recipeId: string, at = NOW): Promise<void> {
  await run(
    "insert into user_recipes (user_id, recipe_id, created_at) values (?, ?, ?)",
    userId,
    recipeId,
    at,
  ).run();
}

/** Uma receita posta numa refeição do dia ("Pôr no meu dia"). */
export async function seedMealRecipe(
  userId: string,
  meal: string,
  recipeId: string,
  at = NOW,
): Promise<void> {
  await run(
    "insert into meal_recipes (user_id, meal, recipe_id, used_at) values (?, ?, ?, ?)",
    userId,
    meal,
    recipeId,
    at,
  ).run();
}

/** Contadores do funcionamento de um dia (AAAA-MM-DD), como a app os grava. */
export async function seedOps(day: string, metrics: Record<string, number>): Promise<void> {
  await env.DB.batch(
    Object.entries(metrics).map(([metric, count]) =>
      run("insert into ops_counters (day, metric, count) values (?, ?, ?)", day, metric, count),
    ),
  );
}
