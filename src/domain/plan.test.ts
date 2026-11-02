import { describe, expect, it } from "vitest";
import { addItem, keepMeals, removeItem, setItemCount } from "./plan";
import type { PlanItem } from "./protein";

const base: PlanItem[] = [
  { id: "a", meal: "almoco", foodId: "frango", portionId: "frango:peito", count: 1 },
];

describe("operações do dia", () => {
  it("acrescenta um alimento novo com o id dado", () => {
    const items = addItem(
      base,
      { meal: "jantar", foodId: "atum", portionId: "atum:lata", count: 1 },
      "b",
    );
    expect(items).toHaveLength(2);
    expect(items[1]).toEqual({
      id: "b",
      meal: "jantar",
      foodId: "atum",
      portionId: "atum:lata",
      count: 1,
    });
  });

  it("soma porções quando a mesma porção já está na refeição (até 4)", () => {
    const once = addItem(
      base,
      { meal: "almoco", foodId: "frango", portionId: "frango:peito", count: 1.5 },
      "x",
    );
    expect(once).toEqual([{ ...base[0], count: 2.5 }]);
    const capped = addItem(
      once,
      { meal: "almoco", foodId: "frango", portionId: "frango:peito", count: 3 },
      "y",
    );
    expect(capped[0]?.count).toBe(4);
  });

  it("muda porções em passos de 0,5 entre 0,5 e 4", () => {
    expect(setItemCount(base, "a", 1.3)[0]?.count).toBe(1.5);
    expect(setItemCount(base, "a", 0)[0]?.count).toBe(0.5);
    expect(setItemCount(base, "a", 9)[0]?.count).toBe(4);
    expect(setItemCount(base, "outro", 2)).toEqual(base);
  });

  it("tira itens e refeições que saíram do dia", () => {
    expect(removeItem(base, "a")).toEqual([]);
    expect(keepMeals(base, ["jantar"])).toEqual([]);
    expect(keepMeals(base, ["almoco", "jantar"])).toEqual(base);
  });
});
