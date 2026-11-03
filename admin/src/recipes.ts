import { isId, jsonStrings, type AdminDb } from "./db";

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

export async function listRecipes(db: AdminDb, page: number): Promise<RecipeList> {
  const counted = await db.first<{ n: number }>("select count(*) as n from recipes");
  const total = Number(counted?.n ?? 0);
  const pages = Math.max(1, Math.ceil(total / RECIPES_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const rows = await db.all<RecipeRow>(
    `select ${LIST_COLUMNS} from recipes r order by r.created_at desc, r.id limit ? offset ?`,
    RECIPES_PAGE_SIZE,
    (current - 1) * RECIPES_PAGE_SIZE,
  );
  return { total, page: current, pages, items: rows.map(listItem) };
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
