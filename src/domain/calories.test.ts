import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { FIXTURE_FOODS } from "./__fixtures__/foods";
import {
  formatKcal,
  itemKcal,
  kcalForGrams,
  kcalPerServingOf,
  mealKcal,
  portionKcal,
  proteinPer100Kcal,
  roundKcal,
  totalKcal,
} from "./calories";
import { indexFoods, type Food } from "./food";
import type { PlanItem } from "./protein";

// Nos fixtures todos os alimentos têm 100 kcal/100 g; aqui o frango tem os valores reais
const frango: Food = { ...FIXTURE_FOODS.find((f) => f.id === "frango")!, kcalPer100g: 110 };
const foods = indexFoods(FIXTURE_FOODS.map((f) => (f.id === "frango" ? frango : f)));

const item = (partial: Partial<PlanItem> & Pick<PlanItem, "foodId" | "portionId">): PlanItem => ({
  id: `${partial.foodId}-${partial.meal ?? "almoco"}`,
  meal: "almoco",
  count: 1,
  ...partial,
});

describe("calorias", () => {
  it("kcal = gramas × kcal_por_100g / 100", () => {
    expect(kcalForGrams(150, 110)).toBeCloseTo(165, 10);
    expect(portionKcal(frango, "frango:peito", 1.5)).toBeCloseTo(247.5, 10);
    expect(portionKcal(frango, "frango:100g")).toBe(110);
  });

  it("recusa porções que não são do alimento", () => {
    expect(() => portionKcal(frango, "atum:lata")).toThrow("Porção desconhecida");
  });

  it("itens de alimentos ou porções que já não existem valem 0", () => {
    expect(itemKcal(item({ foodId: "nada", portionId: "nada:x" }), foods)).toBe(0);
    expect(itemKcal(item({ foodId: "frango", portionId: "frango:x" }), foods)).toBe(0);
  });

  it("o total do dia e o de cada refeição são somas exatas", () => {
    const items = [
      item({ foodId: "frango", portionId: "frango:peito", meal: "almoco" }), // 165
      item({ foodId: "arroz", portionId: "arroz:dose", meal: "almoco" }), // 80
      item({ foodId: "skyr", portionId: "skyr:iogurte", count: 0.5, meal: "lanche" }), // 75
    ];
    expect(totalKcal(items, foods)).toBeCloseTo(320, 10);
    expect(mealKcal(items, "almoco", foods)).toBeCloseTo(245, 10);
    expect(mealKcal(items, "lanche", foods)).toBeCloseTo(75, 10);
    expect(mealKcal(items, "jantar", foods)).toBe(0);
  });

  it("o total do dia é a soma das refeições (propriedade)", () => {
    const meals = ["pequeno-almoco", "almoco", "lanche", "jantar"] as const;
    const portions = FIXTURE_FOODS.flatMap((f) => f.portions.map((p) => [f.id, p.id] as const));
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            pick: fc.constantFrom(...portions),
            meal: fc.constantFrom(...meals),
            halves: fc.integer({ min: 1, max: 8 }),
          }),
          { maxLength: 20 },
        ),
        (raw) => {
          const items = raw.map((r, i) => ({
            ...item({ foodId: r.pick[0], portionId: r.pick[1], meal: r.meal, count: r.halves / 2 }),
            id: String(i),
          }));
          const byMeal = meals.reduce((sum, m) => sum + mealKcal(items, m, foods), 0);
          expect(byMeal).toBeCloseTo(totalKcal(items, foods), 6);
        },
      ),
    );
  });

  it("receitas: calorias por dose, com a despensa e sem os ingredientes desconhecidos", () => {
    const ingredients = [
      { foodId: "frango", grams: 300 }, // 330
      { foodId: "azeite", grams: 20 }, // 20 (100 kcal/100 g nos fixtures)
      { foodId: "nada", grams: 500 },
    ];
    expect(kcalPerServingOf(ingredients, 2, foods)).toBeCloseTo(175, 10);
  });

  it("proteína por 100 kcal; null sem calorias", () => {
    expect(proteinPer100Kcal(frango)).toBeCloseTo(20.909, 3);
    expect(proteinPer100Kcal({ proteinPer100g: 0, kcalPer100g: 0 })).toBeNull();
  });

  it("arredonda de 5 em 5 abaixo de 100 kcal e de 10 em 10 a partir daí", () => {
    expect(roundKcal(0)).toBe(0);
    expect(roundKcal(2)).toBe(0);
    expect(roundKcal(3)).toBe(5);
    expect(roundKcal(78.65)).toBe(80);
    expect(roundKcal(92)).toBe(90);
    expect(roundKcal(98)).toBe(100);
    expect(roundKcal(164)).toBe(160);
    expect(roundKcal(1846)).toBe(1850);
  });

  it("formata como estimativa, sem casas decimais", () => {
    expect(formatKcal(1846, "pt-PT")).toBe("1850");
    expect(formatKcal(12_346, "pt-PT")).toMatch(/^12\s350$/); // espaço inseparável
    expect(formatKcal(1846, "en-US")).toBe("1,850");
    expect(formatKcal(78.65)).toBe("80");
  });
});

describe("calorias no catálogo", () => {
  it("todos os alimentos têm calorias, e nenhum fora da despensa sem elas", () => {
    for (const food of FOODS) {
      expect(food.kcalPer100g, food.id).toBeGreaterThanOrEqual(0);
      if (food.role !== "pantry") expect(food.kcalPer100g, food.id).toBeGreaterThan(0);
    }
  });

  it("as calorias batem com os macros (4/4/9) nos alimentos com proteína", () => {
    // A fibra e os ácidos explicam desvios em legumes, fruta, sementes e especiarias; nas fontes
    // de proteína (o centro da app) o valor tem de ser coerente
    for (const food of FOODS.filter((f) => f.role === "protein")) {
      const atwater = 4 * food.proteinPer100g + 4 * food.carbsPer100g + 9 * food.fatPer100g;
      expect(Math.abs(food.kcalPer100g - atwater) / food.kcalPer100g, food.id).toBeLessThan(0.15);
    }
  });
});
