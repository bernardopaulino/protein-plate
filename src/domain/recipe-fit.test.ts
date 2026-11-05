import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { defaultPortion, type FoodIndex } from "./food";
import { allowedFoods } from "./preferences";
import { dayRecipeBases } from "./recipe-day";
import { needsBoiling, proteinReach, recipeBase } from "./recipe-base";
import { fitProtein, proteinPerServingOf } from "./recipe-fit";

const INDEX: FoodIndex = new Map(FOODS.map((f) => [f.id, f]));
const ALLOWED = allowedFoods(FOODS, { diet: "omnivore", allergies: [] }).filter(
  (f) => f.role !== "pantry",
);

const frangoComArroz = [
  { foodId: "peito-frango", grams: 300 },
  { foodId: "arroz-branco", grams: 160 },
  { foodId: "brocolos", grams: 200 },
  { foodId: "azeite", grams: 10 },
];

describe("ajuste da proteína da receita", () => {
  it("dentro da margem de 10%, não mexe", () => {
    const now = proteinPerServingOf(frangoComArroz, 2, INDEX);
    const result = fitProtein(frangoComArroz, 2, now * 1.05, INDEX);
    expect(result.adjusted).toBe(false);
    expect(result.ingredients).toEqual(frangoComArroz);
  });

  it("sobe a proteína mexendo só nas fontes de proteína", () => {
    const result = fitProtein(frangoComArroz, 2, 60, INDEX);
    expect(result.adjusted).toBe(true);
    const after = proteinPerServingOf(result.ingredients, 2, INDEX);
    expect(Math.abs(after - 60)).toBeLessThanOrEqual(60 * 0.1);
    // Arroz, brócolos e azeite ficam como estavam
    expect(result.ingredients.slice(1)).toEqual(frangoComArroz.slice(1));
    expect(result.ingredients[0]!.grams % 5).toBe(0);
  });

  it("desce a proteína até ao limite (×0,4), dentro da margem de aceitação", () => {
    const result = fitProtein(frangoComArroz, 2, 20, INDEX);
    const after = proteinPerServingOf(result.ingredients, 2, INDEX);
    expect(Math.abs(after - 20)).toBeLessThanOrEqual(20 * 0.2);
    expect(result.ingredients[0]!.grams).toBeGreaterThanOrEqual(40);
  });

  it("ovos em ovos inteiros por dose", () => {
    const omelete = [
      { foodId: "ovo", grams: 100 },
      { foodId: "espinafres", grams: 50 },
    ];
    const result = fitProtein(omelete, 1, 25, INDEX);
    const egg = defaultPortion(INDEX.get("ovo")!).grams;
    expect(result.ingredients[0]!.grams % egg).toBe(0);
    expect(result.ingredients[0]!.grams).toBeGreaterThan(100);
  });

  it("nunca passa de 3 porções habituais por dose nem de 2,5× o que a IA escreveu", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        fc.integer({ min: 1, max: 4 }),
        (target, servings) => {
          const recipe = frangoComArroz.map((i) => ({ ...i, grams: (i.grams / 2) * servings }));
          const { ingredients } = fitProtein(recipe, servings, target, INDEX);
          const chicken = ingredients[0]!.grams / servings;
          expect(chicken).toBeLessThanOrEqual(3 * defaultPortion(INDEX.get("peito-frango")!).grams);
          expect(chicken).toBeLessThanOrEqual(150 * 2.5 + 5);
          expect(chicken).toBeGreaterThanOrEqual(20);
        },
      ),
    );
  });
});

describe("base que chega à meta", () => {
  it("sem nada escolhido, a proteína da base chega à meta da refeição", () => {
    for (const [meal, targetG] of [
      ["almoco", 46],
      ["jantar", 60],
      ["lanche", 23],
      ["pequeno-almoco", 40],
    ] as const) {
      for (let seed = 0; seed < 25; seed++) {
        const base = recipeBase({
          meal,
          chosen: [],
          foods: ALLOWED,
          preferred: new Set(),
          preWorkout: false,
          seed,
          targetG,
        });
        const reach = base
          .filter((f) => f.role === "protein")
          .reduce((sum, f) => sum + proteinReach(f), 0);
        expect(reach, `${meal} seed ${seed}`).toBeGreaterThanOrEqual(targetG * 0.85);
      }
    }
  });

  it("proteína escolhida pela pessoa: a app respeita-a, mesmo que não chegue à meta", () => {
    const grao = ALLOWED.find((f) => f.id === "grao-bico-lata")!;
    const base = recipeBase({
      meal: "almoco",
      chosen: [grao],
      foods: ALLOWED,
      preferred: new Set(),
      preWorkout: false,
      seed: 0,
      targetG: 46,
    });
    expect(base[0]!.id).toBe("grao-bico-lata");
    expect(base.filter((f) => f.role === "protein").map((f) => f.id)).toEqual(["grao-bico-lata"]);
  });
});

describe("base sem cozinhar e dia completo", () => {
  it("só airfryer (sem fogão nem micro-ondas): a app não escolhe nada que se coza em água", () => {
    for (const meal of ["almoco", "jantar", "pequeno-almoco"] as const) {
      for (let seed = 0; seed < 30; seed++) {
        const base = recipeBase({
          meal,
          chosen: [],
          foods: ALLOWED,
          preferred: new Set(),
          preWorkout: false,
          seed,
          canBoil: false,
          targetG: 40,
        });
        expect(
          base.filter(needsBoiling).map((f) => f.id),
          `${meal} ${seed}`,
        ).toEqual([]);
      }
    }
    // Arroz, massa e leguminosas secas cozem-se; pão, aveia, batata e conservas não
    const ids = ALLOWED.filter(needsBoiling).map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(["arroz-branco", "massa-trigo", "trigo-sarraceno"]));
    for (const id of ["pao-integral", "aveia-flocos", "batata-doce", "grao-bico-lata"]) {
      expect(ids).not.toContain(id);
    }
  });

  it("sem cozinhar: a app só completa com alimentos sem preparação", () => {
    for (let seed = 0; seed < 20; seed++) {
      const base = recipeBase({
        meal: "almoco",
        chosen: [],
        foods: ALLOWED,
        preferred: new Set(),
        preWorkout: false,
        seed,
        noCooking: true,
      });
      expect(base.length).toBeGreaterThan(0);
      expect(base.every((f) => f.ease === 1)).toBe(true);
    }
  });

  it("dia completo: uma base por refeição, sem repetir alimentos", () => {
    const meals = ["pequeno-almoco", "almoco", "lanche", "jantar"] as const;
    for (let seed = 0; seed < 20; seed++) {
      const bases = dayRecipeBases({
        meals,
        foods: ALLOWED,
        preferred: new Set(),
        preWorkoutMeal: "lanche",
        noCooking: false,
        canBoil: true,
        seed,
        targets: new Map(),
      });
      expect([...bases.keys()]).toEqual(meals);
      const all = [...bases.values()].flat().map((f) => f.id);
      expect(new Set(all).size).toBe(all.length);
      for (const base of bases.values()) expect(base.some((f) => f.role === "protein")).toBe(true);
    }
  });

  it("dia completo com poucos alimentos de que gosta: repete só quando não há alternativa", () => {
    const few = ALLOWED.filter((f) => ["peito-frango", "arroz-branco"].includes(f.id));
    const bases = dayRecipeBases({
      meals: ["almoco", "jantar"],
      foods: few,
      preferred: new Set(),
      preWorkoutMeal: null,
      noCooking: false,
      canBoil: true,
      seed: 0,
      targets: new Map(),
    });
    expect(bases.get("almoco")!.map((f) => f.id)).toContain("peito-frango");
    expect(bases.get("jantar")!.map((f) => f.id)).toContain("peito-frango");
  });
});
