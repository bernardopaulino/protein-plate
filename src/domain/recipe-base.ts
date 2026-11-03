import type { Food } from "./food";
import type { Meal } from "./meals";

/** Máximo de alimentos que a pessoa escolhe para uma receita (o resto completa a app). */
export const RECIPE_MAX_CHOSEN = 6;

const MAIN_MEALS: ReadonlySet<Meal> = new Set(["almoco", "jantar"]);

/** Hidratos "de prato" (cereais, pão, batata), não fruta. */
const isStarch = (f: Food) => f.role === "carb" && f.category !== "fruta";
/** Antes do treino: proteína fácil de digerir (pouca gordura, sem muita preparação). */
const isLightProtein = (f: Food) => f.role === "protein" && f.ease <= 2 && f.fatPer100g <= 10;

export interface RecipeBaseInput {
  meal: Meal;
  /** O que a pessoa escolheu (pode ser nada). */
  chosen: readonly Food[];
  /** Os alimentos que a pessoa pode comer (já sem a despensa). */
  foods: readonly Food[];
  /** Os de que a pessoa gosta (formulário de boas-vindas): vêm primeiro. */
  preferred: ReadonlySet<string>;
  preWorkout: boolean;
  /** Para variar a base entre pedidos (inteiro ≥ 0). */
  seed: number;
}

/**
 * A base de uma receita: o que a pessoa escolheu, completado pela app com o que falta para ser uma
 * refeição (uma fonte de proteína; hidratos; legumes no almoço e no jantar). Escolhe primeiro entre
 * os alimentos de que a pessoa gosta e que servem para a refeição; a seed varia a escolha.
 */
export function recipeBase(input: RecipeBaseInput): Food[] {
  const base = [...input.chosen];
  const main = MAIN_MEALS.has(input.meal);
  let turn = 0;

  const pick = (...filters: ((f: Food) => boolean)[]) => {
    const taken = new Set(base.map((f) => f.id));
    for (const filter of filters) {
      const pool = input.foods.filter((f) => !taken.has(f.id) && filter(f));
      const forMeal = pool.filter((f) => f.moments.includes(input.meal));
      const fitting = forMeal.length > 0 ? forMeal : pool;
      const liked = fitting.filter((f) => input.preferred.has(f.id));
      const options = (liked.length > 0 ? liked : fitting).sort(
        (a, b) => b.exampleRank - a.exampleRank || a.id.localeCompare(b.id),
      );
      if (options.length > 0) {
        const food = options[(input.seed + turn * 7) % options.length]!;
        turn += 1;
        base.push(food);
        return;
      }
    }
  };

  const has = (test: (f: Food) => boolean) => base.some(test);

  if (!has((f) => f.role === "protein")) {
    const protein = (f: Food) => f.role === "protein";
    if (input.preWorkout) pick(isLightProtein, protein);
    else pick(protein);
  }
  // A proteína entra sempre; os acompanhamentos só se houver espaço
  const room = () => base.length < RECIPE_MAX_CHOSEN;
  if (main) {
    if (room() && !has(isStarch)) pick(isStarch);
    if (room() && !has((f) => f.role === "vegetable")) pick((f) => f.role === "vegetable");
  } else if (room() && !has((f) => f.role === "carb")) {
    pick((f) => f.role === "carb");
  }
  return base;
}
