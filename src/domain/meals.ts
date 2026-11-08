/** Os seis tipos de refeição, sempre por esta ordem. */
export const MEALS = [
  "pequeno-almoco",
  "meio-da-manha",
  "almoco",
  "lanche",
  "jantar",
  "ceia",
] as const;
export type Meal = (typeof MEALS)[number];

/** As refeições de prato (almoço e jantar): as que pesam mais. As outras são refeições leves. */
export const MAIN_MEALS: ReadonlySet<Meal> = new Set(["almoco", "jantar"]);

/** Refeição leve (pequeno-almoço, meio da manhã, lanche, ceia): nada de "prato" de almoço. */
export const isLightMeal = (meal: Meal) => !MAIN_MEALS.has(meal);

/**
 * Peso de cada refeição na meta do dia: almoço e jantar 3, pequeno-almoço 2, meio da manhã,
 * lanche e ceia 1 (decisão de 8/11/2026: as refeições de prato levam mais proteína, as leves menos).
 */
export const MEAL_WEIGHTS: Readonly<Record<Meal, 1 | 2 | 3>> = {
  "pequeno-almoco": 2,
  "meio-da-manha": 1,
  almoco: 3,
  lanche: 1,
  jantar: 3,
  ceia: 1,
};

/** A refeição pós-treino vale pelo menos isto (um lanche pós-treino fica como o pequeno-almoço). */
export const POST_WORKOUT_MIN_WEIGHT = 2;

export const MEAL_COUNTS = [2, 3, 4, 5, 6] as const;
export type MealCount = (typeof MEAL_COUNTS)[number];

/** Combinação pré-selecionada para cada número de refeições. */
export const DEFAULT_COMBINATIONS: Record<MealCount, readonly Meal[]> = {
  2: ["almoco", "jantar"],
  3: ["pequeno-almoco", "almoco", "jantar"],
  4: ["pequeno-almoco", "almoco", "lanche", "jantar"],
  5: ["pequeno-almoco", "meio-da-manha", "almoco", "lanche", "jantar"],
  6: ["pequeno-almoco", "meio-da-manha", "almoco", "lanche", "jantar", "ceia"],
};

export function isMeal(value: unknown): value is Meal {
  return typeof value === "string" && (MEALS as readonly string[]).includes(value);
}

/** As refeições pela ordem do dia, sem repetidas. */
export function sortMeals(meals: readonly Meal[]): Meal[] {
  const chosen = new Set(meals);
  return MEALS.filter((m) => chosen.has(m));
}

/** A refeição pós-treino só conta se for uma das escolhidas (não cria refeição nova). */
export function normalizePostWorkout(
  meals: readonly Meal[],
  postWorkoutMeal: Meal | null | undefined,
): Meal | null {
  return postWorkoutMeal && meals.includes(postWorkoutMeal) ? postWorkoutMeal : null;
}

/**
 * Refeições à volta do treino: cada uma tem de ser uma das escolhidas e não podem ser a mesma
 * (se coincidirem, fica só a pós-treino). A pré-treino não muda o peso da refeição.
 */
export function normalizeTraining(
  meals: readonly Meal[],
  preWorkoutMeal: Meal | null | undefined,
  postWorkoutMeal: Meal | null | undefined,
): { preWorkoutMeal: Meal | null; postWorkoutMeal: Meal | null } {
  const post = normalizePostWorkout(meals, postWorkoutMeal);
  const pre = normalizePostWorkout(meals, preWorkoutMeal);
  return { preWorkoutMeal: pre !== null && pre !== post ? pre : null, postWorkoutMeal: post };
}

/** Peso de uma refeição (`MEAL_WEIGHTS`); a pós-treino vale pelo menos 2. */
export function mealWeight(meal: Meal, postWorkoutMeal: Meal | null = null): 1 | 2 | 3 {
  const weight = MEAL_WEIGHTS[meal];
  return meal === postWorkoutMeal && weight < POST_WORKOUT_MIN_WEIGHT
    ? POST_WORKOUT_MIN_WEIGHT
    : weight;
}

/**
 * meta_refeicao = meta × peso_refeicao / soma_dos_pesos_escolhidos (valores exatos; o arredondamento
 * fica para a apresentação).
 */
export function mealTargets(
  dailyTargetG: number,
  meals: readonly Meal[],
  postWorkoutMeal: Meal | null = null,
): Map<Meal, number> {
  const ordered = sortMeals(meals);
  const post = normalizePostWorkout(ordered, postWorkoutMeal);
  const totalWeight = ordered.reduce((sum, m) => sum + mealWeight(m, post), 0);
  return new Map(ordered.map((m) => [m, (dailyTargetG * mealWeight(m, post)) / totalWeight]));
}

export function mealTarget(
  dailyTargetG: number,
  meals: readonly Meal[],
  meal: Meal,
  postWorkoutMeal: Meal | null = null,
): number {
  return mealTargets(dailyTargetG, meals, postWorkoutMeal).get(meal) ?? 0;
}
