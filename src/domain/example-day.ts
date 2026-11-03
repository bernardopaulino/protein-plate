import { defaultPortion, type Food, type Portion } from "./food";
import { MEALS, mealTargets, normalizeTraining, sortMeals, type Meal } from "./meals";
import { clamp, portionProtein, roundToHalf, type PlanItem } from "./protein";

/** O dia exemplo fica entre 100% e 110% da meta. */
export const EXAMPLE_DAY_BAND = { min: 1, max: 1.1 } as const;

/** Número máximo de porções de cada alimento no dia exemplo (1; 1,5; 2). */
const MAX_COUNT = 2;
const MIN_COUNT = 0.5;
/** Quantos dos mais fáceis entram na rotação de "Outras opções". */
const ROTATION = 3;
const MAX_ITERATIONS = 60;

export interface ExampleDayInput {
  target: number;
  meals: readonly Meal[];
  postWorkoutMeal?: Meal | null;
  /** Refeição antes do treino: leve e rápida, com hidratos. */
  preWorkoutMeal?: Meal | null;
  /**
   * Só os alimentos que a pessoa pode comer (as restrições já aplicadas). Com `preferred`, os
   * escolhidos por ela vêm primeiro; os outros só entram quando faltam opções para uma refeição.
   */
  foods: readonly Food[];
  preferred?: ReadonlySet<string>;
  /** 0 = os mais fáceis; "Outras opções" incrementa a seed (determinístico). */
  seed?: number;
}

type Kind = "source" | "side" | "extra";

interface Entry {
  meal: Meal;
  food: Food;
  portion: Portion;
  count: number;
  kind: Kind;
}

interface Move {
  /** 0 = mudar uma porção existente, 1 = acrescentar um alimento */
  rank: 0 | 1;
  /** 0 = alimento escolhido pela pessoa (ou mudança de porção), 1 = outro */
  pref: 0 | 1;
  /** 1 = na refeição pré-treino (que fica leve: só cresce se não houver outra opção) */
  light: 0 | 1;
  /** Facilidade do alimento (1 = sem preparação); 0 para mudanças de porção */
  ease: number;
  delta: number;
  apply: (entries: Entry[]) => Entry[];
}

const byRank = (a: Food, b: Food) => b.exampleRank - a.exampleRank || a.id.localeCompare(b.id);

const proteinOf = (e: Pick<Entry, "food" | "portion" | "count">) =>
  portionProtein(e.food, e.portion.id, e.count);

const totalOf = (entries: readonly Entry[]) => entries.reduce((s, e) => s + proteinOf(e), 0);

/** Sem ultraprocessados no que a app propõe sozinha (a whey só entra se a pessoa a escolher). */
const proposable = (f: Food) => f.processing !== "ultra";

function rotate<T>(pool: readonly T[], seed: number): T | undefined {
  if (pool.length === 0) return undefined;
  return pool[seed % Math.min(pool.length, ROTATION)];
}

/** Os escolhidos pela pessoa, se houver algum entre os candidatos; senão, todos. */
function preferredFirst(candidates: Food[], preferred: ReadonlySet<string> | undefined): Food[] {
  if (!preferred || preferred.size === 0) return candidates;
  const mine = candidates.filter((f) => preferred.has(f.id));
  return mine.length > 0 ? mine : candidates;
}

/** Filtra sem esvaziar: se nenhum candidato passar, ficam todos. */
function narrow(candidates: Food[], keep: (f: Food) => boolean): Food[] {
  const kept = candidates.filter(keep);
  return kept.length > 0 ? kept : candidates;
}

interface Context {
  post: Meal | null;
  pre: Meal | null;
  preferred: ReadonlySet<string> | undefined;
}

function pickProteinSource(
  foods: readonly Food[],
  meal: Meal,
  ctx: Context,
  used: ReadonlySet<string>,
  seed: number,
): Food | undefined {
  let candidates = preferredFirst(
    foods
      .filter((f) => f.role === "protein" && proposable(f) && f.moments.includes(meal))
      .sort(byRank),
    ctx.preferred,
  );
  // Pós-treino: opções rápidas (sem preparação) primeiro; pré-treino: rápidas e leves
  if (meal === ctx.post) candidates = narrow(candidates, (f) => f.ease === 1);
  if (meal === ctx.pre) candidates = narrow(candidates, (f) => f.ease <= 2 && f.fatPer100g <= 10);
  const unused = candidates.filter((f) => !used.has(f.id));
  return rotate(unused.length > 0 ? unused : candidates, seed);
}

function pickSide(
  foods: readonly Food[],
  meal: Meal,
  ctx: Context,
  used: ReadonlySet<string>,
  seed: number,
): Food | undefined {
  let candidates = preferredFirst(
    foods
      .filter(
        (f) =>
          (f.role === "carb" || f.role === "vegetable") &&
          proposable(f) &&
          f.moments.includes(meal),
      )
      .sort(byRank),
    ctx.preferred,
  );
  // Antes do treino, hidratos (fruta, pão, aveia)
  if (meal === ctx.pre) candidates = narrow(candidates, (f) => f.role === "carb");
  const unused = candidates.filter((f) => !used.has(f.id));
  return rotate(unused.length > 0 ? unused : candidates, seed);
}

function initialEntries(input: {
  target: number;
  meals: readonly Meal[];
  foods: readonly Food[];
  seed: number;
  ctx: Context;
}) {
  const { foods, seed, ctx } = input;
  const meals = sortMeals(input.meals);
  const targets = mealTargets(input.target, meals, ctx.post);
  const usedSources = new Set<string>();
  const usedSides = new Set<string>();
  const entries: Entry[] = [];

  for (const [meal, mealTarget] of targets) {
    const side = pickSide(foods, meal, ctx, usedSides, seed);
    let sideProtein = 0;
    if (side) {
      usedSides.add(side.id);
      const entry: Entry = {
        meal,
        food: side,
        portion: defaultPortion(side),
        count: 1,
        kind: "side",
      };
      sideProtein = proteinOf(entry);
      entries.push(entry);
    }
    const source = pickProteinSource(foods, meal, ctx, usedSources, seed);
    if (!source) continue;
    usedSources.add(source.id);
    const portion = defaultPortion(source);
    const perPortion = portionProtein(source, portion.id, 1);
    const need = Math.max(0, mealTarget - sideProtein);
    const count = clamp(roundToHalf(need / perPortion), MIN_COUNT, MAX_COUNT);
    entries.push({ meal, food: source, portion, count, kind: "source" });
  }
  return entries;
}

function withCount(entries: Entry[], index: number, count: number): Entry[] {
  return entries.map((e, i) => (i === index ? { ...e, count } : e));
}

function increaseMoves(
  entries: readonly Entry[],
  foods: readonly Food[],
  preferred: ReadonlySet<string> | undefined,
  pre: Meal | null = null,
): Move[] {
  const moves: Move[] = [];
  const light = (meal: Meal): 0 | 1 => (meal === pre ? 1 : 0);
  entries.forEach((e, i) => {
    if (e.food.role === "protein" && e.count < MAX_COUNT) {
      const step = portionProtein(e.food, e.portion.id, 0.5);
      moves.push({
        rank: 0,
        pref: 0,
        light: light(e.meal),
        ease: 0,
        delta: step,
        apply: (es) => withCount(es, i, e.count + 0.5),
      });
    }
  });
  const pref = (food: Food): 0 | 1 => (!preferred || preferred.has(food.id) ? 0 : 1);
  const meals = [...new Set(entries.map((e) => e.meal))];
  for (const meal of meals) {
    const present = new Set(entries.filter((e) => e.meal === meal).map((e) => e.food.id));
    for (const food of foods) {
      if (food.role !== "protein" || !proposable(food) || !food.moments.includes(meal)) continue;
      if (present.has(food.id)) continue;
      const portion = defaultPortion(food);
      for (const count of [1, 0.5]) {
        const entry: Entry = { meal, food, portion, count, kind: "extra" };
        moves.push({
          rank: 1,
          pref: pref(food),
          light: light(meal),
          ease: food.ease,
          delta: proteinOf(entry),
          apply: (es) => [...es, entry],
        });
      }
    }
  }
  return moves;
}

function decreaseMoves(entries: readonly Entry[]): Move[] {
  const moves: Move[] = [];
  entries.forEach((e, i) => {
    if (e.count > MIN_COUNT) {
      const step = portionProtein(e.food, e.portion.id, 0.5);
      moves.push({
        rank: 0,
        pref: 0,
        light: 0,
        ease: 0,
        delta: -step,
        apply: (es) => withCount(es, i, e.count - 0.5),
      });
    }
  });
  return moves;
}

/**
 * Ordem estável entre movimentos: primeiro mudar porções, depois acrescentar; entre alimentos novos,
 * os sem preparação primeiro ("o snack com mais proteína por porção"); depois o maior passo.
 */
const preferBig = (a: Move, b: Move) =>
  a.rank - b.rank || a.pref - b.pref || a.ease - b.ease || Math.abs(b.delta) - Math.abs(a.delta);

function adjust(
  entries: Entry[],
  foods: readonly Food[],
  ctx: Pick<Context, "preferred" | "pre">,
  low: number,
  high: number,
): Entry[] {
  const { preferred, pre } = ctx;
  let current = entries;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const total = totalOf(current);
    if (total >= low - 1e-9 && total <= high + 1e-9) return current;
    const inBand = (t: number) => t >= low - 1e-9 && t <= high + 1e-9;

    if (total < low) {
      const ups = increaseMoves(current, foods, preferred, pre).sort(preferBig);
      // Primeiro mais meia porção do que já está no prato; só depois um alimento novo
      // Os alimentos escolhidos pela pessoa vêm antes dos outros, mesmo que encaixem pior, e a
      // refeição pré-treino só cresce quando nenhuma outra pode
      const tier = (rank: 0 | 1, pref: 0 | 1) => {
        for (const light of [0, 1]) {
          const moves = ups.filter((m) => m.rank === rank && m.pref === pref && m.light === light);
          const move =
            moves.find((m) => inBand(total + m.delta)) ?? moves.find((m) => total + m.delta < low);
          if (move) return move;
        }
        return undefined;
      };
      const next = tier(0, 0) ?? tier(1, 0) ?? tier(1, 1);
      if (next) {
        current = next.apply(current);
        continue;
      }
      // Tudo passa dos 110%: subir uma coisa e baixar outra
      const pair = bestPair(current, total, inBand, ups, (es) => decreaseMoves(es));
      if (pair) return pair;
      const smallest = [...ups].sort((a, b) => a.delta - b.delta)[0];
      if (!smallest) return current;
      current = smallest.apply(current);
    } else {
      const downs = decreaseMoves(current).sort(preferBig);
      // "Acima de 110%, reduz o maior passo"
      const landing = downs.find((m) => inBand(total + m.delta));
      if (landing) return landing.apply(current);
      const fitting = downs.find((m) => total + m.delta > high);
      if (fitting) {
        current = fitting.apply(current);
        continue;
      }
      const pair = bestPair(current, total, inBand, downs, (es) =>
        increaseMoves(es, foods, preferred, pre),
      );
      // Nenhum passo cai entre 100% e 110%: fica acima da meta, o mais perto possível
      return pair ?? current;
    }
  }
  /* v8 ignore next -- limite de segurança: cada iteração aproxima o total da faixa */
  return current;
}

function bestPair(
  entries: Entry[],
  total: number,
  inBand: (t: number) => boolean,
  first: readonly Move[],
  second: (es: Entry[]) => Move[],
): Entry[] | undefined {
  for (const a of first) {
    const after = a.apply(entries);
    const b = second(after)
      .sort(preferBig)
      .find((m) => inBand(total + a.delta + m.delta));
    if (b) return b.apply(after);
  }
  return undefined;
}

/**
 * Dia exemplo determinístico (secção 3): em cada refeição, a fonte de proteína mais fácil para esse
 * momento e um acompanhamento; a fonte ajusta-se em meias porções até ao alvo da refeição; abaixo
 * da meta acrescenta proteína, acima de 110% reduz o maior passo.
 */
export function buildExampleDay(input: ExampleDayInput): PlanItem[] {
  const seed = Math.max(0, Math.floor(input.seed ?? 0));
  const meals = sortMeals(input.meals);
  const { preWorkoutMeal: pre, postWorkoutMeal: post } = normalizeTraining(
    meals,
    input.preWorkoutMeal,
    input.postWorkoutMeal,
  );
  const ctx: Context = { pre, post, preferred: input.preferred };
  const initial = initialEntries({ target: input.target, meals, foods: input.foods, seed, ctx });
  const low = input.target * EXAMPLE_DAY_BAND.min;
  const high = input.target * EXAMPLE_DAY_BAND.max;
  const adjusted = adjust(initial, input.foods, ctx, low, high);

  const kindOrder: Record<Kind, number> = { source: 0, extra: 1, side: 2 };
  return adjusted
    .map((e, index) => ({ e, index }))
    .sort(
      (a, b) =>
        MEALS.indexOf(a.e.meal) - MEALS.indexOf(b.e.meal) ||
        kindOrder[a.e.kind] - kindOrder[b.e.kind] ||
        a.index - b.index,
    )
    .map(({ e }) => ({
      id: `ex-${e.meal}-${e.food.id}`,
      meal: e.meal,
      foodId: e.food.id,
      portionId: e.portion.id,
      count: e.count,
    }));
}
