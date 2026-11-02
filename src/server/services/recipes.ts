import { asc, eq } from "drizzle-orm";
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
