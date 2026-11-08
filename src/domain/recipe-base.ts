import { defaultPortion, type Food } from "./food";
import { MAIN_MEALS, isLightMeal, type Meal } from "./meals";

/** Máximo de alimentos que a pessoa escolhe para uma receita (o resto completa a app). */
export const RECIPE_MAX_CHOSEN = 6;

/** O alimento faz sentido em alguma refeição leve (pequeno-almoço, meio da manhã, lanche, ceia). */
export const servesLightMeal = (f: Pick<Food, "moments">) => f.moments.some(isLightMeal);

/** Hidratos "de prato" (cereais, pão, batata), não fruta. */
const isStarch = (f: Food) => f.role === "carb" && f.category !== "fruta";
/** Antes do treino: proteína fácil de digerir (pouca gordura, sem muita preparação). */
const isLightProtein = (f: Food) => f.role === "protein" && f.ease <= 2 && f.fatPer100g <= 10;

/** A proteína que um alimento dá no máximo numa dose (3 porções habituais, o limite da receita). */
export const proteinReach = (f: Food) => (3 * defaultPortion(f).grams * f.proteinPer100g) / 100;

/**
 * Coze-se em água (arroz, massa, quinoa, leguminosas secas): sem fogão nem micro-ondas, a app não os
 * escolhe para completar a base (uma receita "só airfryer" com arroz cozido no tacho não serve).
 */
export const needsBoiling = (f: Food) =>
  f.ease > 1 &&
  ((f.category === "cereais" && f.weightBasis === "raw") || f.category === "leguminosas");

/** Abaixo disto da meta, a base junta outra fonte de proteína (se houver espaço). */
const REACH_MIN = 0.85;

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
  /** "Sem cozinhar": a app só completa com alimentos que se comem sem preparação (ease 1). */
  noCooking?: boolean;
  /** Há fogão ou micro-ondas (dá para cozer em água); sem eles, a app não escolhe o que se coze. */
  canBoil?: boolean;
  /** Fontes de proteína a evitar se houver outras (dia completo: uma proteína diferente por refeição). */
  avoid?: ReadonlySet<string>;
  /**
   * Proteína por dose a atingir: quando é a app a escolher a proteína, prefere fontes que lá chegam em
   * quantidades realistas e, se não houver nenhuma que chegue sozinha, junta outra.
   */
  targetG?: number;
}

/**
 * A base de uma receita: o que a pessoa escolheu, completado pela app com o que falta para ser uma
 * refeição (uma fonte de proteína; hidratos; legumes no almoço e no jantar). Escolhe primeiro entre
 * os alimentos de que a pessoa gosta e que servem para a refeição; a seed varia a escolha.
 *
 * O que a app junta serve sempre para a refeição: primeiro os alimentos dessa refeição (`moments`)
 * com qualquer dos filtros, só depois os de outra refeição leve e, só no almoço e no jantar,
 * qualquer um. Numa refeição leve, a app nunca junta um alimento só de prato (frango ao
 * pequeno-almoço): se nenhum chega sozinho à meta, junta dois da refeição. O que a pessoa escolheu
 * fica sempre, mesmo que não seja da refeição (decisão de 8/11/2026).
 */
export function recipeBase(input: RecipeBaseInput): Food[] {
  const base = [...input.chosen];
  const main = MAIN_MEALS.has(input.meal);
  let turn = 0;

  const tiers: ((f: Food) => boolean)[] = [
    (f) => f.moments.includes(input.meal),
    ...(isLightMeal(input.meal) ? [servesLightMeal] : [() => true]),
  ];

  const pick = (...filters: ((f: Food) => boolean)[]) => {
    const taken = new Set(base.map((f) => f.id));
    for (const tier of tiers) {
      for (const filter of filters) {
        const all = input.foods.filter(
          (f) =>
            !taken.has(f.id) &&
            tier(f) &&
            filter(f) &&
            (!input.noCooking || f.ease === 1) &&
            (input.canBoil !== false || !needsBoiling(f)),
        );
        const fresh = all.filter((f) => !input.avoid?.has(f.id));
        const pool = fresh.length > 0 ? fresh : all;
        const liked = pool.filter((f) => input.preferred.has(f.id));
        const options = (liked.length > 0 ? liked : pool).sort(
          (a, b) => b.exampleRank - a.exampleRank || a.id.localeCompare(b.id),
        );
        if (options.length > 0) {
          const food = options[(input.seed + turn * 7) % options.length]!;
          turn += 1;
          base.push(food);
          return;
        }
      }
    }
  };

  const has = (test: (f: Food) => boolean) => base.some(test);

  const target = input.targetG ?? 0;
  const reach = () =>
    base.filter((f) => f.role === "protein").reduce((sum, f) => sum + proteinReach(f), 0);
  const protein = (f: Food) => f.role === "protein";
  const reaches = (needed: number) => (f: Food) => protein(f) && proteinReach(f) >= needed;
  const room = () => base.length < RECIPE_MAX_CHOSEN;

  // Se a pessoa escolheu as proteínas, a app respeita a escolha (só ajusta as quantidades depois)
  const appPicksProtein = !has(protein);
  if (appPicksProtein) {
    const light = (f: Food) => isLightProtein(f) && proteinReach(f) >= target;
    if (input.preWorkout) pick(light, isLightProtein, reaches(target), protein);
    else pick(reaches(target), protein);
  }
  // A proteína que a app escolheu não chega à meta (sem cozinhar, vegano): junta outra
  if (appPicksProtein && target > 0 && reach() < target * REACH_MIN && room()) {
    pick(reaches(target - reach()), protein);
  }
  // A proteína entra sempre; os acompanhamentos só se houver espaço
  if (main) {
    if (room() && !has(isStarch)) pick(isStarch);
    if (room() && !has((f) => f.role === "vegetable")) pick((f) => f.role === "vegetable");
  } else if (room() && !has((f) => f.role === "carb")) {
    pick((f) => f.role === "carb");
  }
  return base;
}
