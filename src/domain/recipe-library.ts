import { RECIPE_LIMITS } from "./contracts/recipe";
import { defaultPortion, type FoodIndex } from "./food";
import { isLightMeal, type Meal } from "./meals";
import { isAllowed, type Equipment, type Restrictions } from "./preferences";
import { servesLightMeal } from "./recipe-base";
import { fitProtein, proteinPerServingOf, type Ingredient } from "./recipe-fit";
import { RECIPE_TARGET_ACCEPT } from "./recipe-options";

/**
 * Biblioteca de receitas (secção 6): antes de chamar o modelo, a app procura uma receita já gerada
 * que sirva a pessoa e reajusta-a às doses e à proteína dela. Os passos não têm quantidades (regra
 * do prompt), por isso mudar as gramas não estraga a receita. A proteína continua calculada pela
 * app a partir do catálogo.
 */

/** Uma receita original (gerada pelo modelo ou pré-gerada), candidata a ser servida a outra pessoa. */
export interface LibraryRecipe {
  id: string;
  meal: Meal;
  locale: "pt" | "en";
  preWorkout: boolean;
  postWorkout: boolean;
  servings: number;
  prepMinutes: number;
  /** O equipamento com que foi gerada (vazio = sem cozinhar). */
  equipment: readonly Equipment[];
  ingredients: readonly Ingredient[];
}

/** O que a pessoa pede, já resolvido pelo pipeline (refeição, meta, equipamento, restrições). */
export interface LibraryNeed {
  meal: Meal;
  locale: "pt" | "en";
  preWorkout: boolean;
  postWorkout: boolean;
  maxMinutes: number;
  servings: number;
  /** O equipamento para esta receita (vazio = "Sem cozinhar"). */
  equipment: readonly Equipment[];
  /** Proteína por dose a atingir (a meta da refeição ou a escolhida). */
  targetG: number;
  restrictions: Restrictions;
  /** Os alimentos que a pessoa escolheu: a receita tem de os ter todos. */
  chosenIds: readonly string[];
  /** Os alimentos de que a pessoa gosta (vêm primeiro). */
  liked: ReadonlySet<string>;
  /**
   * Fontes de proteína que a receita não pode ter (dia completo: as das outras refeições). Sem
   * alternativa na biblioteca, vai ao modelo, que usa a base do dia (já sem repetições).
   */
  avoid?: ReadonlySet<string>;
  /** Receitas originais que a pessoa já viu (o histórico): nunca se repetem. */
  seen: ReadonlySet<string>;
  foods: FoodIndex;
}

/** Uma receita da biblioteca pronta a servir: a original e os ingredientes reajustados. */
export interface LibraryPick {
  recipe: LibraryRecipe;
  ingredients: Ingredient[];
  proteinPerServingG: number;
}

/**
 * Gramas "de cozinha" depois de mudar as doses: múltiplos de 5 a partir de 20 g; os ovos em ovos
 * inteiros por dose.
 */
function scaleGrams(foodId: string, grams: number, servings: number, foods: FoodIndex): number {
  const food = foods.get(foodId);
  if (food?.category === "ovos") {
    const unit = defaultPortion(food).grams;
    return Math.max(1, Math.round(grams / servings / unit)) * unit * servings;
  }
  return grams >= 20 ? Math.round(grams / 5) * 5 : Math.max(1, Math.round(grams));
}

/**
 * A receita serve a pessoa? Tudo o que é absoluto: refeição e idioma, contexto do treino, tempo,
 * equipamento (só o que a pessoa tem), restrições (todos os ingredientes, também a despensa),
 * alimentos escolhidos presentes e ingredientes que ainda existem no catálogo.
 */
export function libraryRecipeFits(recipe: LibraryRecipe, need: LibraryNeed): boolean {
  if (recipe.meal !== need.meal || recipe.locale !== need.locale) return false;
  if (recipe.preWorkout !== need.preWorkout || recipe.postWorkout !== need.postWorkout)
    return false;
  if (recipe.prepMinutes > need.maxMinutes) return false;
  if (recipe.equipment.some((e) => !need.equipment.includes(e))) return false;
  const ids = new Set(recipe.ingredients.map((i) => i.foodId));
  if (need.chosenIds.some((id) => !ids.has(id))) return false;
  const light = isLightMeal(need.meal);
  return recipe.ingredients.every((i) => {
    const food = need.foods.get(i.foodId);
    if (food === undefined || !isAllowed(food, need.restrictions)) return false;
    // Numa refeição leve, nada de proteína só de prato (lentilhas ao pequeno-almoço), a não ser
    // que tenha sido a pessoa a escolhê-la (as receitas antigas da biblioteca ainda as podem ter)
    return (
      !light || food.role !== "protein" || servesLightMeal(food) || need.chosenIds.includes(food.id)
    );
  });
}

/**
 * Reajusta uma receita às doses e à proteína da pessoa: escala as gramas para as doses pedidas,
 * ajusta as fontes de proteína (`fitProtein`) e aplica as mesmas regras de uma receita nova (no
 * máximo 3 porções habituais por dose, proteína entre 1 e 120 g e a menos de 20% do alvo). Devolve
 * null se a receita não chega ao alvo.
 */
export function adaptLibraryRecipe(
  recipe: LibraryRecipe,
  need: Pick<LibraryNeed, "servings" | "targetG" | "foods">,
): Omit<LibraryPick, "recipe"> | null {
  const scale = need.servings / recipe.servings;
  const scaled = recipe.ingredients.map((i) => ({
    foodId: i.foodId,
    grams: scale === 1 ? i.grams : scaleGrams(i.foodId, i.grams * scale, need.servings, need.foods),
  }));
  const { ingredients } = fitProtein(scaled, need.servings, need.targetG, need.foods);
  for (const ingredient of ingredients) {
    const food = need.foods.get(ingredient.foodId);
    if (!food) return null;
    const max = RECIPE_LIMITS.portionMultiplier * defaultPortion(food).grams;
    if (ingredient.grams / need.servings > max) return null;
  }
  const protein = proteinPerServingOf(ingredients, need.servings, need.foods);
  const { min, max } = RECIPE_LIMITS.proteinPerServing;
  if (protein < min || protein > max) return null;
  if (Math.abs(protein - need.targetG) > need.targetG * RECIPE_TARGET_ACCEPT) return null;
  return { ingredients, proteinPerServingG: protein };
}

/**
 * A melhor receita da biblioteca para a pessoa, ou null (vai ao modelo). Fora as que já viu e as
 * que repetem uma proteína a evitar; das que servem, prefere as que têm mais alimentos de que gosta;
 * entre as igualmente boas, `random` escolhe (para duas pessoas iguais não verem sempre a mesma).
 */
export function pickLibraryRecipe(
  candidates: readonly LibraryRecipe[],
  need: LibraryNeed,
  random: () => number = Math.random,
): LibraryPick | null {
  const score = (recipe: LibraryRecipe) =>
    recipe.ingredients.filter((i) => need.liked.has(i.foodId)).length;
  const repeats = (recipe: LibraryRecipe) =>
    recipe.ingredients.some(
      (i) => need.avoid?.has(i.foodId) && need.foods.get(i.foodId)?.role === "protein",
    );
  const ranked = candidates
    .filter((r) => !need.seen.has(r.id) && !repeats(r) && libraryRecipeFits(r, need))
    .map((recipe) => ({ recipe, score: score(recipe), tie: random() }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie);
  for (const { recipe } of ranked) {
    const adapted = adaptLibraryRecipe(recipe, need);
    if (adapted) return { recipe, ...adapted };
  }
  return null;
}
