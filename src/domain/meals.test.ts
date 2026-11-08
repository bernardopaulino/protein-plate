import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMBINATIONS,
  MEALS,
  MEAL_COUNTS,
  isLightMeal,
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
  it("almoço e jantar valem 3, pequeno-almoço 2, as leves 1", () => {
    expect(mealWeight("almoco")).toBe(3);
    expect(mealWeight("jantar")).toBe(3);
    expect(mealWeight("pequeno-almoco")).toBe(2);
    expect(mealWeight("meio-da-manha")).toBe(1);
    expect(mealWeight("lanche")).toBe(1);
    expect(mealWeight("ceia")).toBe(1);
  });

  it("a pós-treino vale pelo menos 2 e nunca desce", () => {
    expect(mealWeight("lanche", "lanche")).toBe(2);
    expect(mealWeight("pequeno-almoco", "pequeno-almoco")).toBe(2);
    expect(mealWeight("jantar", "jantar")).toBe(3);
    expect(mealWeight("jantar", "lanche")).toBe(3);
  });

  it("almoço e jantar são as refeições de prato; as outras são leves", () => {
    expect(MEALS.filter(isLightMeal)).toEqual([
      "pequeno-almoco",
      "meio-da-manha",
      "lanche",
      "ceia",
    ]);
  });

  it("a pós-treino só conta se for uma das refeições escolhidas", () => {
    expect(normalizePostWorkout(["almoco", "jantar"], "lanche")).toBeNull();
    expect(normalizePostWorkout(["almoco", "jantar"], "jantar")).toBe("jantar");
    expect(normalizePostWorkout(["almoco", "jantar"], undefined)).toBeNull();
  });
});

describe("mealTargets", () => {
  it("160 g em 4 refeições sem pós-treino ≈ 36/53/18/53", () => {
    const t = mealTargets(160, DEFAULT_COMBINATIONS[4]);
    expect([...t.values()].map(Math.round)).toEqual([36, 53, 18, 53]);
  });

  it("160 g em 4 refeições com lanche pós-treino = 32/48/32/48", () => {
    const t = mealTargets(160, DEFAULT_COMBINATIONS[4], "lanche");
    expect([...t.values()]).toEqual([32, 48, 32, 48]);
  });

  it("o almoço e o jantar têm sempre mais do que o pequeno-almoço, e este mais do que um lanche", () => {
    const t = mealTargets(120, DEFAULT_COMBINATIONS[6]);
    expect(t.get("almoco")!).toBeGreaterThan(t.get("pequeno-almoco")!);
    expect(t.get("pequeno-almoco")!).toBeGreaterThan(t.get("lanche")!);
    expect(t.get("ceia")).toBe(t.get("lanche"));
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
