import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMBINATIONS,
  MEALS,
  MEAL_COUNTS,
  isMeal,
  mealTarget,
  mealTargets,
  mealWeight,
  normalizePostWorkout,
  sortMeals,
  type Meal,
} from "./meals";

describe("combinações pré-selecionadas", () => {
  it("têm o número de refeições pedido, pela ordem do dia", () => {
    for (const n of MEAL_COUNTS) {
      const meals = DEFAULT_COMBINATIONS[n];
      expect(meals).toHaveLength(n);
      expect(sortMeals(meals)).toEqual(meals);
    }
    expect(DEFAULT_COMBINATIONS[4]).toEqual(["pequeno-almoco", "almoco", "lanche", "jantar"]);
  });
});

describe("sortMeals", () => {
  it("ordena pela ordem do dia e tira repetidas", () => {
    expect(sortMeals(["jantar", "pequeno-almoco", "jantar", "lanche"])).toEqual([
      "pequeno-almoco",
      "lanche",
      "jantar",
    ]);
  });
});

describe("isMeal", () => {
  it("só aceita os seis tipos", () => {
    expect(MEALS.every(isMeal)).toBe(true);
    expect(isMeal("brunch")).toBe(false);
    expect(isMeal(3)).toBe(false);
  });
});

describe("pesos", () => {
  it("principais valem 2, intermédias 1, pós-treino 2", () => {
    expect(mealWeight("almoco")).toBe(2);
    expect(mealWeight("lanche")).toBe(1);
    expect(mealWeight("lanche", "lanche")).toBe(2);
    expect(mealWeight("jantar", "lanche")).toBe(2);
  });

  it("a pós-treino só conta se for uma das refeições escolhidas", () => {
    expect(normalizePostWorkout(["almoco", "jantar"], "lanche")).toBeNull();
    expect(normalizePostWorkout(["almoco", "jantar"], "jantar")).toBe("jantar");
    expect(normalizePostWorkout(["almoco", "jantar"], undefined)).toBeNull();
  });
});

describe("mealTargets", () => {
  it("160 g em 4 refeições sem pós-treino ≈ 46/46/23/46", () => {
    const t = mealTargets(160, DEFAULT_COMBINATIONS[4]);
    expect([...t.values()].map(Math.round)).toEqual([46, 46, 23, 46]);
  });

  it("160 g em 4 refeições com lanche pós-treino = 40 cada", () => {
    const t = mealTargets(160, DEFAULT_COMBINATIONS[4], "lanche");
    expect([...t.values()]).toEqual([40, 40, 40, 40]);
  });

  it("ignora uma pós-treino que não está nas refeições", () => {
    expect(mealTargets(160, ["almoco", "jantar"], "lanche")).toEqual(
      new Map([
        ["almoco", 80],
        ["jantar", 80],
      ]),
    );
  });

  it("sem refeições não há metas", () => {
    expect(mealTargets(160, []).size).toBe(0);
  });

  it("mealTarget devolve 0 para uma refeição que não foi escolhida", () => {
    expect(mealTarget(160, ["almoco", "jantar"], "lanche")).toBe(0);
    expect(mealTarget(160, ["almoco", "jantar"], "almoco")).toBe(80);
  });

  it("as metas das refeições somam sempre a meta do dia", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 40, max: 300 }),
        fc.subarray([...MEALS], { minLength: 2 }),
        fc.option(fc.constantFrom(...MEALS), { nil: null }),
        (target, meals, post) => {
          const sum = [...mealTargets(target, meals as Meal[], post).values()].reduce(
            (a, b) => a + b,
            0,
          );
          expect(sum).toBeCloseTo(target, 9);
        },
      ),
    );
  });
});
