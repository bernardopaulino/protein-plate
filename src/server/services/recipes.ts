import { asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/client-core";
import { recipeIngredients, recipes } from "../db/schema";

/** Uma receita (imutável e sem dono) com os ingredientes por ordem. */
export async function getRecipe(db: Db, id: string) {
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
  if (!recipe) return null;
  const ingredients = await db
    .select({ foodId: recipeIngredients.foodId, grams: recipeIngredients.grams })
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id))
    .orderBy(asc(recipeIngredients.position));
  return { ...recipe, ingredients };
}

export type RecipeWithIngredients = NonNullable<Awaited<ReturnType<typeof getRecipe>>>;

/** Várias receitas (o dia completo), com os ingredientes; as que não existem ficam de fora. */
export async function getRecipes(db: Db, ids: readonly string[]) {
  if (ids.length === 0) return [];
  const rows = await db
    .select()
    .from(recipes)
    .where(inArray(recipes.id, [...ids]));
  const ingredients = await db
    .select({
      recipeId: recipeIngredients.recipeId,
      foodId: recipeIngredients.foodId,
      grams: recipeIngredients.grams,
    })
    .from(recipeIngredients)
    .where(inArray(recipeIngredients.recipeId, [...ids]))
    .orderBy(asc(recipeIngredients.recipeId), asc(recipeIngredients.position));
  return rows.map((recipe) => ({
    ...recipe,
    ingredients: ingredients
      .filter((i) => i.recipeId === recipe.id)
      .map(({ foodId, grams }) => ({ foodId, grams })),
  }));
}
