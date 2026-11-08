import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { FIXTURE_FOODS, fixtureFood } from "./__fixtures__/foods";
import { EXAMPLE_DAY_BAND, buildExampleDay } from "./example-day";
import { ALLERGENS, indexFoods, type Food } from "./food";
import { DIETS, MIN_LIKED_PROTEINS, allowedFoods, type Restrictions } from "./preferences";
import { DEFAULT_COMBINATIONS, MEALS, mealTargets, sortMeals, type Meal } from "./meals";
import { isValidPortionCount, totalProtein } from "./protein";

/** Todas as combinações de 2 a 6 refeições (57). */
const ALL_COMBINATIONS: Meal[][] = Array.from({ length: 64 }, (_, mask) =>
  MEALS.filter((_, i) => mask & (1 << i)),
).filter((meals) => meals.length >= 2);

const TARGETS = Array.from({ length: (250 - 80) / 5 + 1 }, (_, i) => 80 + i * 5);

function expectInBand(
  foods: readonly Food[],
  target: number,
  meals: Meal[],
  post: Meal | null,
  seed = 0,
) {
  const items = buildExampleDay({ target, meals, postWorkoutMeal: post, foods, seed });
  const total = totalProtein(items, indexFoods(foods));
  expect(
    total,
    `${target} g · ${meals.join(",")} · pós-treino ${post} · seed ${seed}`,
  ).toBeGreaterThanOrEqual(target * EXAMPLE_DAY_BAND.min - 1e-9);
  expect(
    total,
    `${target} g · ${meals.join(",")} · pós-treino ${post} · seed ${seed}`,
  ).toBeLessThanOrEqual(target * EXAMPLE_DAY_BAND.max + 1e-9);
  return items;
}

describe("dia exemplo: propriedade da especificação", () => {
  it("catálogo: para todas as metas de 80 a 250 g e todas as combinações de refeições, total entre 100% e 110%", () => {
    expect(ALL_COMBINATIONS).toHaveLength(57);
    for (const meals of ALL_COMBINATIONS) {
      for (const post of [null, ...meals]) {
        for (const target of TARGETS) expectInBand(FOODS, target, meals, post);
      }
    }
  }, 60_000);

  it("alimentos de teste: o mesmo nas combinações pré-selecionadas", () => {
    // Os 13 alimentos de teste não chegam a 250 g só com pequeno-almoço e meio da manhã
    for (const meals of Object.values(DEFAULT_COMBINATIONS)) {
      for (const target of TARGETS) expectInBand(FIXTURE_FOODS, target, [...meals], null);
    }
  });

  it("o mesmo com refeição pós-treino e outras seeds (amostra property-based)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TARGETS),
        fc.constantFrom(...ALL_COMBINATIONS),
        fc.nat({ max: 20 }),
        fc.nat({ max: 5 }),
        (target, meals, seed, postIndex) => {
          const post = meals[postIndex % (meals.length + 1)] ?? null;
          expectInBand(FOODS, target, meals, post, seed);
        },
      ),
      { numRuns: 500 },
    );
  }, 60_000);
});

describe("dia exemplo: regras", () => {
  const day = buildExampleDay({
    target: 160,
    meals: DEFAULT_COMBINATIONS[4],
    foods: FIXTURE_FOODS,
  });

  it("é determinístico", () => {
    expect(
      buildExampleDay({ target: 160, meals: DEFAULT_COMBINATIONS[4], foods: FIXTURE_FOODS }),
    ).toEqual(day);
  });

  it("cada refeição escolhida tem uma fonte de proteína e um acompanhamento", () => {
    const foods = indexFoods(FIXTURE_FOODS);
    for (const meal of DEFAULT_COMBINATIONS[4]) {
      const roles = day.filter((i) => i.meal === meal).map((i) => foods.get(i.foodId)!.role);
      expect(roles).toContain("protein");
      expect(roles.some((r) => r === "carb" || r === "vegetable")).toBe(true);
    }
  });

  it("só usa refeições escolhidas, pela ordem do dia, com porções válidas e ids únicos", () => {
    const meals = day.map((i) => i.meal);
    expect(new Set(meals)).toEqual(new Set(DEFAULT_COMBINATIONS[4]));
    expect(sortMeals(meals)).toEqual([...new Set(meals)]);
    expect(day.every((i) => isValidPortionCount(i.count) && i.count <= 2)).toBe(true);
    expect(new Set(day.map((i) => i.id)).size).toBe(day.length);
  });

  it("começa pelo mais fácil: maior exampleRank compatível com o momento", () => {
    const breakfast = day.filter((i) => i.meal === "pequeno-almoco").map((i) => i.foodId);
    expect(breakfast).toContain("skyr");
    const lunch = day.filter((i) => i.meal === "almoco").map((i) => i.foodId);
    expect(lunch).toContain("frango");
    expect(lunch).toContain("arroz");
  });

  it("nunca propõe ultraprocessados (a whey só entra se a pessoa a escolher)", () => {
    for (const seed of [0, 1, 2, 3]) {
      const items = buildExampleDay({
        target: 250,
        meals: DEFAULT_COMBINATIONS[6],
        foods: FIXTURE_FOODS,
        seed,
      });
      expect(items.map((i) => i.foodId)).not.toContain("whey");
    }
  });

  it("na refeição pós-treino privilegia opções sem preparação", () => {
    const items = buildExampleDay({
      target: 160,
      meals: ["almoco", "jantar", "lanche"],
      postWorkoutMeal: "jantar",
      foods: FIXTURE_FOODS,
    });
    const dinnerSource = items.find(
      (i) => i.meal === "jantar" && indexFoods(FIXTURE_FOODS).get(i.foodId)!.role === "protein",
    );
    expect(dinnerSource?.foodId).toBe("atum");
  });

  it("sem opções rápidas para o pós-treino, usa as que houver", () => {
    const slow = [fixtureFood({ id: "frango", proteinPer100g: 23, ease: 3 })];
    const items = buildExampleDay({
      target: 80,
      meals: ["almoco", "jantar"],
      postWorkoutMeal: "jantar",
      foods: slow,
    });
    expect(items.some((i) => i.meal === "jantar" && i.foodId === "frango")).toBe(true);
  });

  it("'Outras opções' (outra seed) troca as fontes de forma determinística", () => {
    const other = buildExampleDay({
      target: 160,
      meals: DEFAULT_COMBINATIONS[4],
      foods: FIXTURE_FOODS,
      seed: 1,
    });
    expect(other).not.toEqual(day);
    expect(
      buildExampleDay({
        target: 160,
        meals: DEFAULT_COMBINATIONS[4],
        foods: FIXTURE_FOODS,
        seed: 1,
      }),
    ).toEqual(other);
    // Seeds negativas ou decimais contam como inteiros não negativos
    expect(
      buildExampleDay({
        target: 160,
        meals: DEFAULT_COMBINATIONS[4],
        foods: FIXTURE_FOODS,
        seed: -3,
      }),
    ).toEqual(day);
    expect(
      buildExampleDay({
        target: 160,
        meals: DEFAULT_COMBINATIONS[4],
        foods: FIXTURE_FOODS,
        seed: 1.7,
      }),
    ).toEqual(other);
  });

  it("sem alimentos compatíveis com uma refeição, deixa-a vazia sem rebentar", () => {
    const onlyLunch = [
      fixtureFood({ id: "frango", proteinPer100g: 23, moments: ["almoco"] }),
      fixtureFood({ id: "arroz", role: "carb", proteinPer100g: 7, moments: ["almoco"] }),
    ];
    const items = buildExampleDay({ target: 80, meals: ["almoco", "ceia"], foods: onlyLunch });
    expect(items.every((i) => i.meal === "almoco")).toBe(true);
  });

  it("sem alimentos nenhuns devolve um dia vazio", () => {
    expect(buildExampleDay({ target: 120, meals: DEFAULT_COMBINATIONS[3], foods: [] })).toEqual([]);
  });

  it("reduz o maior passo quando o arranque passa dos 110%", () => {
    // 40 g por refeição com porções de 32 g: 1,25 porções arredonda para 1,5 (96 g = 120%)
    const foods = [
      fixtureFood({ id: "bife", proteinPer100g: 32 }, [
        { slug: "dose", label: { pt: "dose", en: "serving" }, grams: 100, default: true },
      ]),
    ];
    const items = expectInBand(foods, 80, ["almoco", "jantar"], null);
    expect(items.map((i) => i.count).sort()).toEqual([1, 1.5]);
  });

  it("quando nada encaixa entre 100% e 110%, fica o mais perto possível acima da meta", () => {
    // Só passos de 30 g: não há forma de cair entre 80 e 88
    const coarse = [
      fixtureFood({ id: "bife", proteinPer100g: 60 }, [
        { slug: "dose", label: { pt: "dose", en: "serving" }, grams: 100, default: true },
      ]),
    ];
    const items = buildExampleDay({ target: 80, meals: ["almoco", "jantar"], foods: coarse });
    expect(totalProtein(items, indexFoods(coarse))).toBeGreaterThanOrEqual(80);
  });

  it("quando não consegue chegar à meta, devolve o máximo que consegue", () => {
    const tiny = [
      fixtureFood({ id: "fiambre", proteinPer100g: 10 }, [
        { slug: "fatia", label: { pt: "fatia", en: "slice" }, grams: 20, default: true },
      ]),
    ];
    const items = buildExampleDay({ target: 250, meals: ["almoco", "jantar"], foods: tiny });
    expect(totalProtein(items, indexFoods(tiny))).toBeLessThan(250);
    expect(items.every((i) => i.count <= 2)).toBe(true);
  });

  it("abaixo da meta, quando subir passa dos 110%, combina subir uma coisa e baixar outra", () => {
    // Almoço: 1,5 × 40 = 60; jantar: 2 × 18 = 36 → 96 g. Mais meia porção de A dá 116 (acima de 110);
    // com menos meia porção de B fica em 107
    const foods = [
      fixtureFood({ id: "a", proteinPer100g: 40, moments: ["almoco"] }, [
        { slug: "d", label: { pt: "d", en: "d" }, grams: 100, default: true },
      ]),
      fixtureFood({ id: "b", proteinPer100g: 18, moments: ["jantar"] }, [
        { slug: "d", label: { pt: "d", en: "d" }, grams: 100, default: true },
      ]),
    ];
    const items = expectInBand(foods, 100, ["almoco", "jantar"], null);
    expect(items.map((i) => `${i.foodId}×${i.count}`)).toEqual(["a×2", "b×1.5"]);
  });
});

describe("dia exemplo personalizado (preferências)", () => {
  const index = indexFoods(FOODS);
  const proteinsFor = (r: Restrictions) =>
    allowedFoods(FOODS, r)
      .filter((f) => f.role === "protein" && f.processing !== "ultra")
      .map((f) => f.id);

  it("com as restrições aplicadas, o total fica entre 100% e 110% (amostra property-based)", () => {
    const restrictions = fc.record({
      diet: fc.constantFrom(...DIETS),
      allergies: fc.subarray([...ALLERGENS]),
    });
    fc.assert(
      fc.property(
        fc.constantFrom(...TARGETS),
        fc.constantFrom(...Object.values(DEFAULT_COMBINATIONS)),
        restrictions,
        fc.nat({ max: 1000 }),
        fc.nat({ max: 6 }),
        fc.nat({ max: 6 }),
        (target, combo, r, pick, preIndex, postIndex) => {
          const meals = [...combo];
          const foods = allowedFoods(FOODS, r);
          const proteins = proteinsFor(r);
          fc.pre(proteins.length >= MIN_LIKED_PROTEINS);
          // Uma escolha da pessoa: 3 a 8 fontes de proteína do que pode comer
          const preferred = new Set(
            proteins.filter((_, i) => (i * 7 + pick) % 3 === 0).slice(0, 8),
          );
          for (const id of proteins.slice(0, 3)) preferred.add(id);
          const items = buildExampleDay({
            target,
            meals,
            foods,
            preferred,
            preWorkoutMeal: meals[preIndex] ?? null,
            postWorkoutMeal: meals[postIndex] ?? null,
          });
          const total = totalProtein(items, index);
          expect(total).toBeGreaterThanOrEqual(target - 1e-9);
          expect(total).toBeLessThanOrEqual(target * EXAMPLE_DAY_BAND.max + 1e-9);
          // Nunca um alimento excluído
          for (const item of items) expect(foods.some((f) => f.id === item.foodId)).toBe(true);
        },
      ),
      { numRuns: 300 },
    );
  }, 60_000);

  it("usa primeiro as fontes de proteína escolhidas pela pessoa", () => {
    const preferred = new Set(["tofu-firme", "grao-bico-lata", "iogurte-grego-natural"]);
    const items = buildExampleDay({
      target: 120,
      meals: ["pequeno-almoco", "almoco", "jantar"],
      foods: FOODS,
      preferred,
    });
    const sources = items
      .filter((i) => index.get(i.foodId)?.role === "protein")
      .map((i) => i.foodId);
    expect(sources.length).toBeGreaterThan(0);
    for (const id of sources.slice(0, 3)) expect(preferred.has(id), id).toBe(true);
  });

  it("antes do treino escolhe hidratos e uma proteína rápida e leve", () => {
    const items = buildExampleDay({
      target: 160,
      meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
      foods: FOODS,
      preWorkoutMeal: "lanche",
    });
    const snack = items.filter((i) => i.meal === "lanche").map((i) => index.get(i.foodId)!);
    expect(snack.some((f) => f.role === "carb")).toBe(true);
    const source = snack.find((f) => f.role === "protein");
    expect(source?.ease).toBeLessThanOrEqual(2);
    expect(source?.fatPer100g).toBeLessThanOrEqual(10);
  });
});

describe("refeição pré-treino leve", () => {
  it("a proteína que falta vai para as outras refeições antes de crescer a pré-treino", () => {
    const index = indexFoods(FOODS);
    const r: Restrictions = { diet: "vegetarian", allergies: ["peanut"] };
    const meals: Meal[] = ["pequeno-almoco", "almoco", "lanche", "jantar"];
    const items = buildExampleDay({
      target: 160,
      meals,
      foods: allowedFoods(FOODS, r),
      preferred: new Set(["skyr-natural", "ovo", "iogurte-grego-natural", "grao-bico-lata"]),
      preWorkoutMeal: "lanche",
      postWorkoutMeal: "jantar",
    });
    const total = totalProtein(items, index);
    expect(total).toBeGreaterThanOrEqual(160);
    expect(total).toBeLessThanOrEqual(176);
    const snack = totalProtein(
      items.filter((i) => i.meal === "lanche"),
      index,
    );
    // Meta do lanche: 160 × 1/7 ≈ 23 g
    expect(snack).toBeLessThan(23 * 1.6);
  });
});

describe("dia exemplo: cada refeição perto da sua meta", () => {
  it("com o catálogo real, nenhuma refeição de prato fica abaixo de 70% nem acima de 160% da sua meta", () => {
    const foods = allowedFoods(FOODS, { diet: "omnivore", allergies: [] });
    const index = indexFoods(FOODS);
    for (let target = 80; target <= 250; target += 10) {
      for (const n of [3, 4, 5] as const) {
        const meals = DEFAULT_COMBINATIONS[n];
        const targets = mealTargets(target, meals);
        const items = buildExampleDay({ target, meals, foods });
        for (const meal of ["almoco", "jantar"] as const) {
          const got = totalProtein(
            items.filter((i) => i.meal === meal),
            index,
          );
          const want = targets.get(meal)!;
          expect(got, `${target} g, ${n} refeições, ${meal}`).toBeGreaterThanOrEqual(want * 0.7);
          expect(got, `${target} g, ${n} refeições, ${meal}`).toBeLessThanOrEqual(want * 1.6);
        }
      }
    }
  });
});
