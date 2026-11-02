import { defaultPortion, type Category, type Food, type FoodIndex } from "./food";
import { mealTargets, sortMeals, type Meal } from "./meals";
import {
  ceilToHalf,
  clamp,
  mealProtein,
  portionProtein,
  totalProtein,
  type PlanItem,
} from "./protein";

/** Quantas sugestões o painel "Para fechar a meta" mostra. */
export const SUGGESTION_COUNT = 3;
/** Máximo de porções numa sugestão. */
const MAX_COUNT = 2;
/** Penalização (g) por cada nível de facilidade acima de 1 (cozinhar pesa mais do que abrir). */
const EASE_PENALTY_G = 4;

export interface Suggestion {
  foodId: string;
  portionId: string;
  count: number;
  protein: number;
  /** Refeição onde a sugestão entra (a que mais falta para o seu alvo, entre as compatíveis). */
  meal: Meal;
  /** true quando a sugestão cobre sozinha o que falta. */
  covers: boolean;
}

export interface CloseGoalInput {
  target: number;
  items: readonly PlanItem[];
  meals: readonly Meal[];
  postWorkoutMeal?: Meal | null;
  foods: readonly Food[];
  foodIndex: FoodIndex;
}

export type CloseGoalResult =
  | { reached: true; missing: 0; suggestions: [] }
  | { reached: false; missing: number; suggestions: Suggestion[] };

/** O que falta (nunca negativo). */
export function missingProtein(target: number, total: number): number {
  return Math.max(0, target - total);
}

/** A refeição compatível onde mais falta para o seu alvo (a primeira do dia em caso de empate). */
function bestMealFor(food: Food, gaps: ReadonlyMap<Meal, number>): Meal | undefined {
  let best: Meal | undefined;
  let bestGap = Number.NEGATIVE_INFINITY;
  for (const [meal, gap] of gaps) {
    if (food.moments.includes(meal) && gap > bestGap) {
      best = meal;
      bestGap = gap;
    }
  }
  return best;
}

/**
 * Fechar a meta (secção 3): para cada fonte de proteína, as porções (até 2) que cobrem o que falta;
 * ordena pela diferença ao alvo, penalizando o que dá mais trabalho; devolve 3 de categorias
 * diferentes. Se nenhuma cobre tudo, as que mais se aproximam.
 */
export function closeTheGoal(input: CloseGoalInput): CloseGoalResult {
  const total = totalProtein(input.items, input.foodIndex);
  const missing = missingProtein(input.target, total);
  if (missing <= 0) return { reached: true, missing: 0, suggestions: [] };

  const meals = sortMeals(input.meals);
  const targets = mealTargets(input.target, meals, input.postWorkoutMeal ?? null);
  const gaps = new Map(
    [...targets].map(
      ([m, t]) => [m, t - mealProtein([...input.items], m, input.foodIndex)] as const,
    ),
  );
  const inPlan = new Set(input.items.map((i) => i.foodId));

  const scored = input.foods
    .filter((f) => f.role === "protein" && f.processing !== "ultra")
    .flatMap((food) => {
      const meal = bestMealFor(food, gaps);
      if (!meal) return [];
      const portion = defaultPortion(food);
      const perPortion = portionProtein(food, portion.id, 1);
      if (perPortion <= 0) return [];
      const count = clamp(ceilToHalf(missing / perPortion), 1, MAX_COUNT);
      const protein = perPortion * count;
      const covers = protein >= missing - 1e-9;
      const score =
        Math.abs(protein - missing) +
        EASE_PENALTY_G * (food.ease - 1) +
        // O que já está no dia fica atrás (variedade), sem ser excluído
        (inPlan.has(food.id) ? 2 : 0);
      return [
        {
          food,
          suggestion: { foodId: food.id, portionId: portion.id, count, protein, meal, covers },
          score,
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(b.suggestion.covers) - Number(a.suggestion.covers) ||
        (a.suggestion.covers ? a.score - b.score : b.suggestion.protein - a.suggestion.protein) ||
        a.food.id.localeCompare(b.food.id),
    );

  const usedCategories = new Set<Category>();
  const suggestions: Suggestion[] = [];
  for (const { food, suggestion } of scored) {
    if (usedCategories.has(food.category)) continue;
    usedCategories.add(food.category);
    suggestions.push(suggestion);
    if (suggestions.length === SUGGESTION_COUNT) break;
  }
  return { reached: false, missing, suggestions };
}
