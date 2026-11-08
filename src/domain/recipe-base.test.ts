import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { fixtureFood } from "./__fixtures__/foods";
import { ALLERGENS, type Food } from "./food";
import { MEALS, isLightMeal, type Meal } from "./meals";
import { allowedFoods, DIETS } from "./preferences";
import { RECIPE_MAX_CHOSEN, recipeBase, servesLightMeal } from "./recipe-base";

const ALLOWED = allowedFoods(FOODS, { diet: "omnivore", allergies: [] }).filter(
  (f) => f.role !== "pantry",
);
const food = (id: string) => ALLOWED.find((f) => f.id === id)!;
const ids = (foods: { id: string }[]) => foods.map((f) => f.id);

describe("base da receita", () => {
  it("sem nada escolhido: uma proteína de que a pessoa gosta, hidratos e legumes ao almoço", () => {
    const base = recipeBase({
      meal: "almoco",
      chosen: [],
      foods: ALLOWED,
      preferred: new Set(["salmao", "batata-doce", "brocolos"]),
      preWorkout: false,
      seed: 0,
    });
    expect(ids(base)).toEqual(["salmao", "batata-doce", "brocolos"]);
  });

  it("ao lanche: proteína e hidratos (pode ser fruta), sem legumes", () => {
    const base = recipeBase({
      meal: "lanche",
      chosen: [],
      foods: ALLOWED,
      preferred: new Set(["skyr-natural", "morangos"]),
      preWorkout: false,
      seed: 0,
    });
    expect(ids(base)).toEqual(["skyr-natural", "morangos"]);
  });

  it("completa o que a pessoa escolheu sem repetir nem tirar nada", () => {
    const base = recipeBase({
      meal: "jantar",
      chosen: [food("brocolos")],
      foods: ALLOWED,
      preferred: new Set(["peito-frango", "arroz-branco"]),
      preWorkout: false,
      seed: 0,
    });
    expect(ids(base)).toEqual(["brocolos", "peito-frango", "arroz-branco"]);
    const full = recipeBase({
      meal: "jantar",
      chosen: [food("peito-frango"), food("arroz-branco"), food("brocolos")],
      foods: ALLOWED,
      preferred: new Set(),
      preWorkout: false,
      seed: 3,
    });
    expect(ids(full)).toEqual(["peito-frango", "arroz-branco", "brocolos"]);
  });

  it("com 6 escolhidos só junta a proteína, se faltar", () => {
    const six = ["brocolos", "tomate", "cenoura", "espinafres", "arroz-branco", "batata"].map(food);
    const base = recipeBase({
      meal: "almoco",
      chosen: six,
      foods: ALLOWED,
      preferred: new Set(),
      preWorkout: false,
      seed: 0,
    });
    expect(base).toHaveLength(RECIPE_MAX_CHOSEN + 1);
    expect(base.at(-1)?.role).toBe("protein");
  });

  it("antes do treino prefere uma proteína leve; sem nenhuma leve, serve outra", () => {
    const base = recipeBase({
      meal: "lanche",
      chosen: [],
      foods: ALLOWED,
      preferred: new Set(),
      preWorkout: true,
      seed: 0,
    });
    const protein = base.find((f) => f.role === "protein")!;
    expect(protein.ease).toBeLessThanOrEqual(2);
    expect(protein.fatPer100g).toBeLessThanOrEqual(10);

    const heavy = fixtureFood({ id: "pesada", ease: 3, fatPer100g: 20, moments: ["lanche"] });
    expect(
      ids(
        recipeBase({
          meal: "lanche",
          chosen: [],
          foods: [heavy],
          preferred: new Set(),
          preWorkout: true,
          seed: 0,
        }),
      ),
    ).toEqual(["pesada"]);
  });

  it("sem alimentos para o momento: uma leve usa os de outra leve, nunca os de prato; o almoço usa qualquer um", () => {
    const dinnerOnly = fixtureFood({ id: "so-jantar", moments: ["jantar"] });
    const snack = fixtureFood({ id: "lanche", moments: ["lanche"] });
    const base = (meal: Meal, foods: Food[]) =>
      ids(
        recipeBase({ meal, chosen: [], foods, preferred: new Set(), preWorkout: false, seed: 0 }),
      );
    expect(base("ceia", [dinnerOnly])).toEqual([]);
    expect(base("ceia", [dinnerOnly, snack])).toEqual(["lanche"]);
    expect(base("almoco", [snack])).toEqual(["lanche"]);
    expect(
      recipeBase({
        meal: "almoco",
        chosen: [],
        foods: [],
        preferred: new Set(),
        preWorkout: false,
        seed: 0,
      }),
    ).toEqual([]);
  });

  it("sem lácteos, o pequeno-almoço junta duas proteínas de pequeno-almoço em vez de ir buscar frango", () => {
    const foods = allowedFoods(FOODS, { diet: "omnivore", allergies: ["milk"] }).filter(
      (f) => f.role !== "pantry",
    );
    for (let seed = 0; seed < 30; seed++) {
      const base = recipeBase({
        meal: "pequeno-almoco",
        chosen: [],
        foods,
        preferred: new Set(),
        preWorkout: false,
        seed,
        targetG: 46,
      });
      expect(base.every((f) => f.moments.includes("pequeno-almoco"))).toBe(true);
    }
  });

  it("o que a pessoa escolheu fica, mesmo que não seja da refeição", () => {
    const base = recipeBase({
      meal: "pequeno-almoco",
      chosen: [food("peito-frango")],
      foods: ALLOWED,
      preferred: new Set(),
      preWorkout: false,
      seed: 0,
    });
    expect(ids(base)[0]).toBe("peito-frango");
    expect(base.slice(1).every((f) => f.moments.includes("pequeno-almoco"))).toBe(true);
  });

  it("propriedade: numa refeição leve, a app nunca junta um alimento só de prato", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DIETS),
        fc.subarray([...ALLERGENS]),
        fc.constantFrom(...MEALS.filter(isLightMeal)),
        fc.nat(10_000),
        fc.boolean(),
        fc.integer({ min: 5, max: 80 }),
        (diet, allergies, meal, seed, preWorkout, targetG) => {
          const foods = allowedFoods(FOODS, { diet, allergies }).filter((f) => f.role !== "pantry");
          const base = recipeBase({
            meal,
            chosen: [],
            foods,
            preferred: new Set(),
            preWorkout,
            seed,
            targetG,
          });
          expect(base.every(servesLightMeal)).toBe(true);
        },
      ),
    );
  });

  it("a seed varia a escolha", () => {
    const pick = (seed: number) =>
      recipeBase({
        meal: "almoco",
        chosen: [],
        foods: ALLOWED,
        preferred: new Set(),
        preWorkout: false,
        seed,
      })[0]!.id;
    expect(new Set([0, 1, 2, 3, 4].map(pick)).size).toBeGreaterThan(1);
  });

  it("propriedade: para qualquer dieta, refeição e seed, há sempre uma proteína permitida", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DIETS),
        fc.constantFrom(...MEALS),
        fc.nat(10_000),
        fc.boolean(),
        (diet, meal, seed, preWorkout) => {
          const foods = allowedFoods(FOODS, { diet, allergies: [] }).filter(
            (f) => f.role !== "pantry",
          );
          const base = recipeBase({
            meal,
            chosen: [],
            foods,
            preferred: new Set(),
            preWorkout,
            seed,
          });
          const allowed = new Set(foods.map((f) => f.id));
          expect(base.some((f) => f.role === "protein")).toBe(true);
          expect(base.every((f) => allowed.has(f.id))).toBe(true);
          expect(new Set(ids(base)).size).toBe(base.length);
        },
      ),
    );
  });
});

describe("refeições leves: o catálogo", () => {
  it("as conservas de peixe são só de almoço e jantar (o salmão fumado também é de pequeno-almoço)", () => {
    const canned = FOODS.filter((f) => f.category === "conservas" && f.id !== "salmao-fumado");
    expect(canned.length).toBeGreaterThan(0);
    for (const f of canned) expect(servesLightMeal(f), f.id).toBe(false);
  });

  it("sem lácteos, a ceia nunca leva conservas de peixe", () => {
    const foods = allowedFoods(FOODS, { diet: "omnivore", allergies: ["milk"] }).filter(
      (f) => f.role !== "pantry",
    );
    for (let seed = 0; seed < 30; seed++) {
      const base = recipeBase({
        meal: "ceia",
        chosen: [],
        foods,
        preferred: new Set(),
        preWorkout: false,
        seed,
        targetG: 20,
      });
      expect(base.filter((f) => f.category === "conservas").map((f) => f.id)).toEqual([]);
    }
  });
});
