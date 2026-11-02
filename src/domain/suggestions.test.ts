import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { FIXTURE_FOODS, fixtureFood } from "./__fixtures__/foods";
import { buildExampleDay } from "./example-day";
import { indexFoods } from "./food";
import { DEFAULT_COMBINATIONS } from "./meals";
import { totalProtein, type PlanItem } from "./protein";
import { SUGGESTION_COUNT, closeTheGoal, missingProtein } from "./suggestions";

const fixtureIndex = indexFoods(FIXTURE_FOODS);
const meals = DEFAULT_COMBINATIONS[4];

const lunch: PlanItem = {
  id: "a",
  meal: "almoco",
  foodId: "frango",
  portionId: "frango:peito",
  count: 2,
};

describe("missingProtein", () => {
  it("nunca é negativo", () => {
    expect(missingProtein(160, 137)).toBe(23);
    expect(missingProtein(160, 170)).toBe(0);
  });
});

describe("closeTheGoal", () => {
  it("meta atingida: não sugere nada", () => {
    const result = closeTheGoal({
      target: 60,
      items: [lunch],
      meals,
      foods: FIXTURE_FOODS,
      foodIndex: fixtureIndex,
    });
    expect(result).toEqual({ reached: true, missing: 0, suggestions: [] });
  });

  it("devolve 3 sugestões de categorias diferentes que cobrem o que falta com 1 ou 2 porções", () => {
    const result = closeTheGoal({
      target: 100,
      items: [lunch],
      meals,
      foods: FIXTURE_FOODS,
      foodIndex: fixtureIndex,
    });
    expect(result.reached).toBe(false);
    expect(result.missing).toBeCloseTo(31, 9);
    expect(result.suggestions).toHaveLength(SUGGESTION_COUNT);
    const categories = result.suggestions.map((s) => fixtureIndex.get(s.foodId)!.category);
    expect(new Set(categories).size).toBe(SUGGESTION_COUNT);
    for (const s of result.suggestions) {
      expect(s.covers).toBe(true);
      expect(s.protein).toBeGreaterThanOrEqual(result.missing);
      expect(s.count).toBeGreaterThanOrEqual(1);
      expect(s.count).toBeLessThanOrEqual(2);
      expect(fixtureIndex.get(s.foodId)!.moments).toContain(s.meal);
    }
  });

  it("nunca sugere ultraprocessados nem alimentos que não são fonte de proteína", () => {
    const result = closeTheGoal({
      target: 100,
      items: [lunch],
      meals,
      foods: FIXTURE_FOODS,
      foodIndex: fixtureIndex,
    });
    for (const s of result.suggestions) {
      const food = fixtureIndex.get(s.foodId)!;
      expect(food.role).toBe("protein");
      expect(food.processing).not.toBe("ultra");
    }
  });

  it("penaliza o que dá mais trabalho: com o mesmo valor, ganha o sem preparação", () => {
    const quick = fixtureFood({ id: "rapido", category: "conservas", ease: 1, proteinPer100g: 20 });
    const slow = fixtureFood({ id: "lento", category: "carne", ease: 3, proteinPer100g: 20 });
    const foods = [slow, quick];
    const result = closeTheGoal({
      target: 20,
      items: [],
      meals,
      foods,
      foodIndex: indexFoods(foods),
    });
    expect(result.suggestions.map((s) => s.foodId)).toEqual(["rapido", "lento"]);
  });

  it("põe a sugestão na refeição compatível onde mais falta", () => {
    // Faltam 21 g; o atum (lata de 15 g) cobre com 1,5 e só serve ao almoço e ao jantar
    const result = closeTheGoal({
      target: 90,
      items: [lunch],
      meals,
      foods: FIXTURE_FOODS,
      foodIndex: fixtureIndex,
    });
    const atum = result.suggestions.find((s) => s.foodId === "atum");
    expect(atum?.meal).toBe("jantar");
  });

  it("quando nada cobre tudo, mostra as que mais se aproximam", () => {
    const result = closeTheGoal({
      target: 300,
      items: [],
      meals,
      foods: FIXTURE_FOODS,
      foodIndex: fixtureIndex,
    });
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.every((s) => !s.covers && s.count === 2)).toBe(true);
    const proteins = result.suggestions.map((s) => s.protein);
    expect(proteins).toEqual([...proteins].sort((a, b) => b - a));
  });

  it("ignora alimentos sem refeição compatível ou sem proteína", () => {
    const foods = [
      fixtureFood({ id: "so-ceia", moments: ["ceia"] }),
      fixtureFood({ id: "zero", proteinPer100g: 0, category: "peixe" }),
    ];
    const result = closeTheGoal({
      target: 50,
      items: [],
      meals,
      foods,
      foodIndex: indexFoods(foods),
    });
    expect(result.suggestions).toEqual([]);
  });

  it("o que já está no dia fica atrás, por variedade", () => {
    const a = fixtureFood({ id: "a", category: "carne", proteinPer100g: 20 });
    const b = fixtureFood({ id: "b", category: "peixe", proteinPer100g: 20 });
    const foods = [a, b];
    const items: PlanItem[] = [
      { id: "x", meal: "almoco", foodId: "a", portionId: "a:dose", count: 0.5 },
    ];
    const result = closeTheGoal({ target: 30, items, meals, foods, foodIndex: indexFoods(foods) });
    expect(result.suggestions[0]?.foodId).toBe("b");
  });

  it("com o catálogo: cada sugestão cobre a falta de qualquer dia exemplo incompleto", () => {
    const index = indexFoods(FOODS);
    fc.assert(
      fc.property(
        fc.integer({ min: 16, max: 50 }),
        fc.integer({ min: 1, max: 6 }),
        (targetBy5, removed) => {
          const target = targetBy5 * 5;
          const day = buildExampleDay({ target, meals, foods: FOODS });
          const partial = day.slice(0, Math.max(0, day.length - removed));
          const result = closeTheGoal({
            target,
            items: partial,
            meals,
            foods: FOODS,
            foodIndex: index,
          });
          const missing = target - totalProtein(partial, index);
          if (missing <= 0) {
            expect(result.reached).toBe(true);
            return;
          }
          for (const s of result.suggestions.filter((x) => x.covers)) {
            expect(s.protein).toBeGreaterThanOrEqual(missing - 1e-9);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
