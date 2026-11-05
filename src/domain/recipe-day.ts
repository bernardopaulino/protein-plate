import type { Food } from "./food";
import type { Meal } from "./meals";
import { recipeBase } from "./recipe-base";

export interface DayBasesInput {
  /** As refeições da pessoa, pela ordem do dia. */
  meals: readonly Meal[];
  /** O que a pessoa pode comer (já sem a despensa). */
  foods: readonly Food[];
  preferred: ReadonlySet<string>;
  preWorkoutMeal: Meal | null;
  noCooking: boolean;
  /** Há fogão ou micro-ondas (ver `needsBoiling`). */
  canBoil: boolean;
  /** A meta de cada refeição (a base escolhe proteínas que lá chegam). */
  targets: ReadonlyMap<Meal, number>;
  /** Varia o dia inteiro (inteiro ≥ 0). */
  seed: number;
}

/**
 * As bases do dia completo: uma por refeição, completadas pela app como numa receita sem alimentos
 * escolhidos, mas sem repetir alimentos entre refeições enquanto houver alternativas (um dia com
 * frango ao almoço e ao jantar não é o que se espera).
 */
export function dayRecipeBases(input: DayBasesInput): Map<Meal, Food[]> {
  const used = new Set<string>();
  const bases = new Map<Meal, Food[]>();
  input.meals.forEach((meal, index) => {
    const base = recipeBase({
      meal,
      chosen: [],
      foods: input.foods,
      preferred: input.preferred,
      preWorkout: meal === input.preWorkoutMeal,
      seed: input.seed + index * 13,
      noCooking: input.noCooking,
      canBoil: input.canBoil,
      avoid: used,
      targetG: input.targets.get(meal),
    });
    for (const food of base) used.add(food.id);
    bases.set(meal, base);
  });
  return bases;
}
