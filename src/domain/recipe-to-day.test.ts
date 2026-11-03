import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { fixtureFood } from "./__fixtures__/foods";
import { indexFoods } from "./food";
import { itemProtein, proteinForGrams } from "./protein";
import { closestPortion, recipeToItems } from "./recipe-to-day";

const INDEX = indexFoods(FOODS);

describe("receita → itens do dia", () => {
  it("uma dose: divide pelas doses, tira a despensa e soma repetidos", () => {
    const items = recipeToItems(
      [
        { foodId: "peito-frango", grams: 300 },
        { foodId: "arroz-branco", grams: 160 },
        { foodId: "azeite", grams: 20 },
        { foodId: "peito-frango", grams: 60 },
        { foodId: "nao-existe", grams: 100 },
      ],
      2,
      "almoco",
      INDEX,
    );
    expect(items.map((i) => i.foodId)).toEqual(["peito-frango", "arroz-branco"]);
    expect(items.every((i) => i.meal === "almoco")).toBe(true);
  });

  it("a proteína dos itens fica perto da proteína por dose da receita", () => {
    const ingredients = [
      { foodId: "peito-frango", grams: 360 },
      { foodId: "grao-bico-lata", grams: 240 },
      { foodId: "brocolos", grams: 200 },
    ];
    const perServing =
      ingredients.reduce(
        (sum, i) => sum + proteinForGrams(i.grams, INDEX.get(i.foodId)!.proteinPer100g),
        0,
      ) / 2;
    const items = recipeToItems(ingredients, 2, "jantar", INDEX).map((i, n) => ({
      ...i,
      id: String(n),
    }));
    const total = items.reduce((sum, i) => sum + itemProtein(i, INDEX), 0);
    expect(Math.abs(total - perServing) / perServing).toBeLessThan(0.2);
  });

  it("respeita as restrições da pessoa", () => {
    const items = recipeToItems(
      [
        { foodId: "peito-frango", grams: 150 },
        { foodId: "tofu-firme", grams: 150 },
      ],
      1,
      "almoco",
      INDEX,
      (food) => food.category !== "carne",
    );
    expect(items.map((i) => i.foodId)).toEqual(["tofu-firme"]);
  });

  it("a porção mais próxima, entre meia e 4 porções; em empate, a de defeito", () => {
    const food = fixtureFood({ id: "x" }, [
      { slug: "pequena", label: { pt: "p", en: "p" }, grams: 50 },
      { slug: "dose", label: { pt: "d", en: "d" }, grams: 100, default: true },
    ]);
    expect(closestPortion(food, 100)).toEqual({ portionId: "x:dose", count: 1 });
    expect(closestPortion(food, 75)).toEqual({ portionId: "x:pequena", count: 1.5 });
    expect(closestPortion(food, 10)).toEqual({ portionId: "x:pequena", count: 0.5 });
    expect(closestPortion(food, 1000)).toEqual({ portionId: "x:dose", count: 4 });
    // 0 doses conta como 1
    expect(recipeToItems([{ foodId: "x", grams: 100 }], 0, "almoco", indexFoods([food]))).toEqual([
      { meal: "almoco", foodId: "x", portionId: "x:dose", count: 1 },
    ]);
  });
});
