import { MEALS } from "../../src/domain/meals";
import { isId, jsonStrings, type AdminDb, type SqlValue } from "./db";
import { likePattern } from "./users";

/**
 * As receitas geradas (imutáveis e sem dono: não dizem quem as pediu). O texto vem do modelo de
 * IA, por isso tudo o que daqui sai para o HTML é escapado; a proteína é a que a app calculou.
 */

export const RECIPES_PAGE_SIZE = 50;

export interface RecipeListItem {
  id: string;
  title: string;
  meal: string;
  postWorkout: boolean;
  servings: number;
  model: string;
  promptVersion: number;
  inputTokens: number | null;
  outputTokens: number | null;
  proteinPerServingG: number;
  saved: number;
  createdAt: number;
}

export interface RecipeList {
  total: number;
  page: number;
  pages: number;
  items: RecipeListItem[];
}

type RecipeRow = {
  id: string;
  title: string;
  meal: string;
  post_workout: number;
  servings: number;
  model: string;
  prompt_version: number;
  input_tokens: number | null;
  output_tokens: number | null;
  protein_per_serving_g: number;
  saved: number;
  created_at: number;
};

function listItem(r: RecipeRow): RecipeListItem {
  return {
    id: r.id,
    title: r.title,
    meal: r.meal,
    postWorkout: Boolean(r.post_workout),
    servings: Number(r.servings),
    model: r.model,
    promptVersion: Number(r.prompt_version),
    inputTokens: r.input_tokens === null ? null : Number(r.input_tokens),
    outputTokens: r.output_tokens === null ? null : Number(r.output_tokens),
    proteinPerServingG: Number(r.protein_per_serving_g),
    saved: Number(r.saved ?? 0),
    createdAt: Number(r.created_at),
  };
}

const LIST_COLUMNS = `r.id as id, r.title as title, r.meal as meal, r.post_workout as post_workout,
  r.servings as servings, r.model as model, r.prompt_version as prompt_version,
  r.input_tokens as input_tokens, r.output_tokens as output_tokens,
  r.protein_per_serving_g as protein_per_serving_g, r.created_at as created_at,
  (select count(*) from saved_recipes s where s.recipe_id = r.id) as saved`;

export const RECIPE_SORTS = ["recentes", "guardadas", "proteina", "tokens"] as const;
export type RecipeSort = (typeof RECIPE_SORTS)[number];

/** A pesquisa, os filtros, a ordem e a página da lista (?q=, ?refeicao=, …). */
export interface RecipeFilters {
  /** Parte do título (já limpo com cleanQuery). */
  q: string;
  /** Vazio: todas as refeições. */
  meal: string;
  /** Vazio: todos os modelos. */
  model: string;
  /** null: todas as versões do prompt. */
  prompt: number | null;
  /** Vazio: todas; "sim": só pós-treino; "nao": sem as de pós-treino. */
  post: "" | "sim" | "nao";
  sort: RecipeSort;
  page: number;
}

/** Os valores válidos de cada filtro (outro texto fica sem filtro, sem erro). */
export function parseRecipeFilters(query: {
  q: string;
  refeicao?: string | undefined;
  modelo?: string | undefined;
  prompt?: string | undefined;
  posTreino?: string | undefined;
  ordem?: string | undefined;
  page: number;
}): RecipeFilters {
  const meal = (MEALS as readonly string[]).includes(query.refeicao ?? "") ? query.refeicao! : "";
  const model = /^[A-Za-z0-9._:-]{1,64}$/.test(query.modelo ?? "") ? query.modelo! : "";
  const prompt = /^\d{1,3}$/.test(query.prompt ?? "") ? Number(query.prompt) : null;
  const post = query.posTreino === "sim" || query.posTreino === "nao" ? query.posTreino : "";
  const sort = RECIPE_SORTS.find((s) => s === query.ordem) ?? "recentes";
  return { q: query.q, meal, model, prompt, post, sort, page: query.page };
}

/** Há algum filtro ou pesquisa (a ordem e a página não contam). */
export const hasRecipeFilters = (f: RecipeFilters) =>
  f.q !== "" || f.meal !== "" || f.model !== "" || f.prompt !== null || f.post !== "";

const RECIPE_ORDER: Record<RecipeSort, string> = {
  recentes: "r.created_at desc, r.id",
  guardadas: "saved desc, r.created_at desc, r.id",
  proteina: "r.protein_per_serving_g desc, r.created_at desc, r.id",
  tokens:
    "coalesce(r.input_tokens, 0) + coalesce(r.output_tokens, 0) desc, r.created_at desc, r.id",
};

function recipeWhere(f: RecipeFilters): { where: string; params: SqlValue[] } {
  const clauses: string[] = [];
  const params: SqlValue[] = [];
  if (f.q !== "") {
    clauses.push("(r.title like ? escape '\\' or r.id = ?)");
    params.push(likePattern(f.q), f.q);
  }
  if (f.meal !== "") {
    clauses.push("r.meal = ?");
    params.push(f.meal);
  }
  if (f.model !== "") {
    clauses.push("r.model = ?");
    params.push(f.model);
  }
  if (f.prompt !== null) {
    clauses.push("r.prompt_version = ?");
    params.push(f.prompt);
  }
  if (f.post !== "") clauses.push(f.post === "sim" ? "r.post_workout = 1" : "r.post_workout = 0");
  return { where: clauses.length ? clauses.join(" and ") : "1 = 1", params };
}

export async function listRecipes(db: AdminDb, f: RecipeFilters): Promise<RecipeList> {
  const { where, params } = recipeWhere(f);
  const counted = await db.first<{ n: number }>(
    `select count(*) as n from recipes r where ${where}`,
    ...params,
  );
  const total = Number(counted?.n ?? 0);
  const pages = Math.max(1, Math.ceil(total / RECIPES_PAGE_SIZE));
  const current = Math.min(Math.max(1, f.page), pages);
  const rows = await db.all<RecipeRow>(
    `select ${LIST_COLUMNS} from recipes r where ${where}
    order by ${RECIPE_ORDER[f.sort]} limit ? offset ?`,
    ...params,
    RECIPES_PAGE_SIZE,
    (current - 1) * RECIPES_PAGE_SIZE,
  );
  return { total, page: current, pages, items: rows.map(listItem) };
}

/** Os modelos e as versões do prompt que já geraram receitas (as opções dos filtros). */
export async function recipeFacets(db: AdminDb): Promise<{ models: string[]; prompts: number[] }> {
  const [models, prompts] = await Promise.all([
    db.all<{ model: string }>("select distinct model from recipes order by model"),
    db.all<{ v: number }>("select distinct prompt_version as v from recipes order by 1 desc"),
  ]);
  return { models: models.map((m) => m.model), prompts: prompts.map((v) => Number(v.v)) };
}

export interface RecipeDetail extends RecipeListItem {
  locale: string;
  summary: string;
  variant: number;
  prepMinutes: number;
  steps: string[];
  mealTargetG: number;
  foodDataVersion: number;
  ingredients: { position: number; foodId: string; grams: number }[];
}

export async function recipeDetail(db: AdminDb, id: string): Promise<RecipeDetail | null> {
  if (!isId(id)) return null;
  const [row, ingredients] = await Promise.all([
    db.first<
      RecipeRow & {
        locale: string;
        summary: string;
        variant: number;
        prep_minutes: number;
        steps: string;
        meal_target_g: number;
        food_data_version: number;
      }
    >(
      `select ${LIST_COLUMNS}, r.locale as locale, r.summary as summary, r.variant as variant,
        r.prep_minutes as prep_minutes, r.steps as steps, r.meal_target_g as meal_target_g,
        r.food_data_version as food_data_version
      from recipes r where r.id = ?`,
      id,
    ),
    db.all<{ position: number; food_id: string; grams: number }>(
      "select position, food_id, grams from recipe_ingredients where recipe_id = ? order by position",
      id,
    ),
  ]);
  if (!row) return null;
  return {
    ...listItem(row),
    locale: row.locale,
    summary: row.summary,
    variant: Number(row.variant),
    prepMinutes: Number(row.prep_minutes),
    steps: jsonStrings(row.steps),
    mealTargetG: Number(row.meal_target_g),
    foodDataVersion: Number(row.food_data_version),
    ingredients: ingredients.map((i) => ({
      position: Number(i.position),
      foodId: i.food_id,
      grams: Number(i.grams),
    })),
  };
}

/** O endereço público da receita na app, ou null se APP_URL não for um endereço válido. */
export function publicRecipeUrl(appUrl: string | undefined, id: string): string | null {
  if (!appUrl) return null;
  try {
    const base = new URL(appUrl);
    if (base.protocol !== "https:" && base.protocol !== "http:") return null;
    return new URL(`/receitas/${encodeURIComponent(id)}`, base).toString();
  } catch {
    return null;
  }
}
