import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import type { Ingredient } from "@/domain/recipe-fit";
import type { LibraryPick, LibraryRecipe } from "@/domain/recipe-library";
import type { Db } from "../db/client-core";
import { recipeIngredients, recipes, userRecipes } from "../db/schema";

/** Quantas receitas originais se sorteiam de cada vez como candidatas. */
export const LIBRARY_CANDIDATES = 200;

/**
 * Receitas originais (não cópias) que podem servir o pedido, filtradas no SQL pelo que é barato
 * (idioma, refeição, versão dos dados, contexto do treino, tempo) e sorteadas; o resto (restrições,
 * equipamento, alimentos escolhidos, proteína) decide `pickLibraryRecipe`. As receitas anteriores à
 * 0006 (sem `pre_workout`) ficam de fora.
 */
export async function libraryCandidates(
  db: Db,
  query: {
    locale: "pt" | "en";
    meal: LibraryRecipe["meal"];
    foodDataVersion: number;
    preWorkout: boolean;
    postWorkout: boolean;
    maxMinutes: number;
  },
): Promise<LibraryRecipe[]> {
  const ids = db
    .select({ id: recipes.id })
    .from(recipes)
    .where(
      and(
        eq(recipes.locale, query.locale),
        eq(recipes.meal, query.meal),
        eq(recipes.foodDataVersion, query.foodDataVersion),
        isNull(recipes.sourceRecipeId),
        eq(recipes.preWorkout, query.preWorkout),
        eq(recipes.postWorkout, query.postWorkout),
        lte(recipes.prepMinutes, query.maxMinutes),
      ),
    )
    .orderBy(sql`random()`)
    .limit(LIBRARY_CANDIDATES);
  const rows = await db
    .select({
      id: recipes.id,
      servings: recipes.servings,
      prepMinutes: recipes.prepMinutes,
      equipment: recipes.equipment,
      foodId: recipeIngredients.foodId,
      grams: recipeIngredients.grams,
    })
    .from(recipes)
    .innerJoin(recipeIngredients, eq(recipeIngredients.recipeId, recipes.id))
    .where(inArray(recipes.id, ids))
    .orderBy(recipes.id, recipeIngredients.position);

  const byId = new Map<string, LibraryRecipe & { ingredients: Ingredient[] }>();
  for (const row of rows) {
    let recipe = byId.get(row.id);
    if (!recipe) {
      recipe = {
        id: row.id,
        meal: query.meal,
        locale: query.locale,
        preWorkout: query.preWorkout,
        postWorkout: query.postWorkout,
        servings: row.servings,
        prepMinutes: row.prepMinutes,
        equipment: row.equipment ?? [],
        ingredients: [],
      };
      byId.set(row.id, recipe);
    }
    recipe.ingredients.push({ foodId: row.foodId, grams: row.grams });
  }
  return [...byId.values()];
}

/** As receitas originais que a pessoa já viu (o histórico guarda as cópias). */
export async function seenLibraryIds(db: Db, userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ id: sql<string>`coalesce(${recipes.sourceRecipeId}, ${recipes.id})` })
    .from(userRecipes)
    .innerJoin(recipes, eq(recipes.id, userRecipes.recipeId))
    .where(eq(userRecipes.userId, userId));
  return new Set(rows.map((r) => r.id));
}

/**
 * Guarda a cópia reajustada para a pessoa: o texto e os passos da original, as gramas e a proteína
 * dela, sem tokens (não houve chamada ao modelo). Devolve o id da cópia; se outro pedido igual já a
 * criou (mesma `cache_key`), devolve esse.
 */
export async function storeLibraryCopy(
  db: Db,
  params: {
    id: string;
    cacheKey: string;
    pick: LibraryPick;
    servings: number;
    variant: number;
    mealTargetG: number;
    customTarget: boolean;
    createdAt: number;
  },
): Promise<string | null> {
  const [source] = await db.select().from(recipes).where(eq(recipes.id, params.pick.recipe.id));
  if (!source) return null;
  try {
    await db.batch([
      db.insert(recipes).values({
        ...source,
        id: params.id,
        cacheKey: params.cacheKey,
        sourceRecipeId: source.id,
        servings: params.servings,
        variant: params.variant,
        proteinPerServingG: params.pick.proteinPerServingG,
        mealTargetG: params.mealTargetG,
        customTarget: params.customTarget,
        inputTokens: 0,
        outputTokens: 0,
        createdAt: params.createdAt,
      }),
      ...params.pick.ingredients.map((ingredient, position) =>
        db.insert(recipeIngredients).values({
          recipeId: params.id,
          position,
          foodId: ingredient.foodId,
          grams: ingredient.grams,
        }),
      ),
    ]);
    return params.id;
  } catch (err) {
    const [existing] = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.cacheKey, params.cacheKey));
    if (existing) return existing.id;
    throw err;
  }
}
