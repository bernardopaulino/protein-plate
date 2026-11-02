import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { FIXTURE_FOODS } from "./__fixtures__/foods";
import { defaultPortion, findPortion, indexFoods } from "./food";
import {
  ceilToHalf,
  clamp,
  formatCount,
  formatProtein,
  isValidPortionCount,
  itemProtein,
  mealProtein,
  portionProtein,
  proteinForGrams,
  roundForDisplay,
  roundToHalf,
  totalProtein,
  type PlanItem,
} from "./protein";

const foods = indexFoods(FIXTURE_FOODS);
const frango = foods.get("frango")!;

const item = (partial: Partial<PlanItem> & Pick<PlanItem, "foodId" | "portionId">): PlanItem => ({
  id: `${partial.foodId}-${partial.meal ?? "almoco"}`,
  meal: "almoco",
  count: 1,
  ...partial,
});

describe("proteína", () => {
  it("proteina_g = gramas × proteina_por_100g / 100", () => {
    expect(proteinForGrams(150, 23)).toBeCloseTo(34.5, 10);
    expect(portionProtein(frango, "frango:peito", 1.5)).toBeCloseTo(51.75, 10);
    expect(portionProtein(frango, "frango:100g")).toBe(23);
  });

  it("recusa porções que não são do alimento", () => {
    expect(() => portionProtein(frango, "atum:lata")).toThrow("Porção desconhecida");
  });

  it("itens de alimentos ou porções que já não existem valem 0", () => {
    expect(itemProtein(item({ foodId: "nada", portionId: "nada:x" }), foods)).toBe(0);
    expect(itemProtein(item({ foodId: "frango", portionId: "frango:x" }), foods)).toBe(0);
  });

  it("o total é a soma exata, e pode diferir 1 g da soma das parcelas arredondadas", () => {
    // 3 itens de 10,4 g: cada um aparece como "10", o total exato 31,2 aparece como "31"
    const tenFour = FIXTURE_FOODS.find((f) => f.id === "atum")!; // 25 g/100 g, lata de 60 g = 15 g
    const items = [
      item({ foodId: "frango", portionId: "frango:100g", count: 0.5, meal: "almoco" }), // 11,5
      item({ foodId: "frango", portionId: "frango:100g", count: 0.5, meal: "jantar" }), // 11,5
      item({ foodId: tenFour.id, portionId: "atum:lata", count: 0.5 }), // 7,5
    ];
    const total = totalProtein(items, foods);
    expect(total).toBeCloseTo(30.5, 10);
    const roundedParts = items.reduce((s, i) => s + roundForDisplay(itemProtein(i, foods)), 0);
    expect(roundedParts).toBeCloseTo(31.5, 10); // 12 + 12 + 7,5
    expect(Math.abs(roundForDisplay(total) - roundedParts)).toBeLessThanOrEqual(1);
  });

  it("separa a proteína por refeição", () => {
    const items = [
      item({ foodId: "frango", portionId: "frango:100g", meal: "almoco" }),
      item({ foodId: "atum", portionId: "atum:lata", meal: "jantar" }),
    ];
    expect(mealProtein(items, "almoco", foods)).toBe(23);
    expect(mealProtein(items, "jantar", foods)).toBe(15);
    expect(mealProtein(items, "lanche", foods)).toBe(0);
  });

  it("o total nunca é negativo e cresce com as porções", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 8 }), (halves) => {
        const one = totalProtein(
          [item({ foodId: "frango", portionId: "frango:peito", count: halves / 2 })],
          foods,
        );
        const more = totalProtein(
          [item({ foodId: "frango", portionId: "frango:peito", count: halves / 2 + 0.5 })],
          foods,
        );
        expect(one).toBeGreaterThan(0);
        expect(more).toBeGreaterThan(one);
      }),
    );
  });
});

describe("apresentação", () => {
  it("inteiros a partir de 10 g, uma casa decimal abaixo", () => {
    expect(roundForDisplay(23.4)).toBe(23);
    expect(roundForDisplay(9.94)).toBe(9.9);
    expect(roundForDisplay(9.96)).toBe(10);
    expect(roundForDisplay(7.25)).toBe(7.3);
  });

  it("formata em pt-PT", () => {
    expect(formatProtein(7.5)).toBe("7,5");
    expect(formatProtein(7)).toBe("7");
    expect(formatProtein(34.5)).toBe("35");
    expect(formatProtein(1234)).toBe("1234");
    expect(formatProtein(7.5, "en")).toBe("7.5");
    expect(formatCount(1.5)).toBe("1,5");
    expect(formatCount(2)).toBe("2");
  });
});

describe("porções", () => {
  it("aceita 0,5 a 4 em passos de 0,5", () => {
    expect(isValidPortionCount(0.5)).toBe(true);
    expect(isValidPortionCount(4)).toBe(true);
    expect(isValidPortionCount(0)).toBe(false);
    expect(isValidPortionCount(4.5)).toBe(false);
    expect(isValidPortionCount(1.25)).toBe(false);
    expect(isValidPortionCount(Number.NaN)).toBe(false);
  });

  it("arredonda a meias porções", () => {
    expect(roundToHalf(1.24)).toBe(1);
    expect(roundToHalf(1.26)).toBe(1.5);
    expect(ceilToHalf(1.01)).toBe(1.5);
    expect(ceilToHalf(1.5)).toBe(1.5);
    expect(clamp(5, 1, 2)).toBe(2);
    expect(clamp(0, 1, 2)).toBe(1);
  });

  it("encontra a porção por defeito", () => {
    expect(defaultPortion(frango).id).toBe("frango:peito");
    expect(findPortion(frango, "frango:100g")?.grams).toBe(100);
    const noDefault = { ...frango, portions: frango.portions.map(({ default: _d, ...p }) => p) };
    expect(defaultPortion(noDefault).id).toBe("frango:peito");
    expect(() => defaultPortion({ ...frango, portions: [] })).toThrow("sem porções");
  });
});
