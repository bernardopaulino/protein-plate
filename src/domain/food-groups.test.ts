import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { fixtureFood } from "./__fixtures__/foods";
import {
  FOOD_SECTIONS,
  FOOD_SUBGROUPS,
  foodSubgroup,
  groupFoods,
  selectionOf,
  subgroupSection,
  summarizeLiked,
  toggleAll,
} from "./food-groups";
import { allowedFoods } from "./preferences";

describe("subgrupos dos alimentos", () => {
  it("todos os alimentos fora da despensa têm subgrupo; a despensa não", () => {
    for (const food of FOODS) {
      if (food.role === "pantry") expect(foodSubgroup(food), food.id).toBeNull();
      else expect(foodSubgroup(food), food.id).not.toBeNull();
    }
  });

  it("as fontes de proteína ficam na secção da proteína e o resto fora dela", () => {
    for (const food of FOODS.filter((f) => f.role !== "pantry")) {
      const section = subgroupSection(foodSubgroup(food)!);
      expect(section === "protein", food.id).toBe(food.role === "protein");
    }
  });

  it("cada subgrupo tem alimentos no catálogo e cada secção tem subgrupos", () => {
    for (const g of FOOD_SUBGROUPS) {
      expect(
        FOODS.some((f) => foodSubgroup(f) === g.id),
        g.id,
      ).toBe(true);
    }
    for (const section of FOOD_SECTIONS) {
      expect(groupFoods(FOODS, section).length, section).toBeGreaterThan(1);
    }
  });

  it("exemplos: aves, queijos, pão, frutos vermelhos e amendoim", () => {
    const sub = (id: string) => foodSubgroup(FOODS.find((f) => f.id === id)!);
    expect(sub("peito-peru")).toBe("aves");
    expect(sub("bife-vaca")).toBe("carne");
    expect(sub("parmesao")).toBe("queijos");
    expect(sub("skyr-natural")).toBe("leite-iogurtes");
    expect(sub("whey-sem-sabor")).toBe("leite-iogurtes");
    expect(sub("broa-milho")).toBe("pao");
    expect(sub("quinoa")).toBe("cereais");
    expect(sub("mirtilos")).toBe("frutos-vermelhos");
    expect(sub("manteiga-amendoim")).toBe("amendoim");
    expect(sub("tahini")).toBe("sementes");
  });

  it("um alimento novo cai no subgrupo da sua categoria", () => {
    expect(foodSubgroup(fixtureFood({ id: "faisao", category: "carne" }))).toBe("carne");
    expect(foodSubgroup(fixtureFood({ id: "nabica", category: "legumes" }))).toBe("cozinhar");
  });

  it("agrupa pela ordem dos subgrupos, os mais usados primeiro, sem subgrupos vazios", () => {
    const protein = groupFoods(FOODS, "protein");
    expect(protein[0]?.id).toBe("aves");
    const ranks = protein[0]!.foods.map((f) => f.exampleRank);
    expect([...ranks].sort((a, b) => b - a)).toEqual(ranks);
    // Vegetariano: sem aves, carne, peixe, conservas nem marisco
    const vegetarian = groupFoods(
      allowedFoods(FOODS, { diet: "vegetarian", allergies: [] }),
      "protein",
    ).map((g) => g.id);
    expect(vegetarian).toEqual(["ovos", "leite-iogurtes", "queijos", "leguminosas", "soja"]);
  });

  it("empate no uso: ordena pelo id", () => {
    const a = fixtureFood({ id: "b-ave", category: "carne", exampleRank: 1 });
    const b = fixtureFood({ id: "a-ave", category: "carne", exampleRank: 1 });
    expect(groupFoods([a, b], "protein")[0]?.foods.map((f) => f.id)).toEqual(["a-ave", "b-ave"]);
  });
});

describe("escolher um grupo inteiro", () => {
  const ids = ["a", "b", "c"];

  it("diz se o grupo está todo, em parte ou nada escolhido", () => {
    expect(selectionOf(ids, new Set())).toBe("none");
    expect(selectionOf(ids, new Set(["a"]))).toBe("some");
    expect(selectionOf(ids, new Set(ids))).toBe("all");
  });

  it("junta o que falta; se já estava todo, tira só esse grupo", () => {
    expect(toggleAll(["x", "a"], ids)).toEqual(["x", "a", "b", "c"]);
    expect(toggleAll(["x", "a", "b", "c"], ids)).toEqual(["x"]);
    expect(toggleAll([], ids)).toEqual(ids);
  });
});

describe("resumo do que a pessoa escolheu", () => {
  const allowed = allowedFoods(FOODS, { diet: "omnivore", allergies: [] }).filter(
    (f) => f.role !== "pantry",
  );
  const ids = (sub: string) => allowed.filter((f) => foodSubgroup(f) === sub).map((f) => f.id);

  it("grupos inteiros aparecem pelo nome e o resto alimento a alimento", () => {
    const liked = [...ids("aves"), "salmao", "arroz-branco"];
    expect(summarizeLiked(liked, allowed)).toEqual({
      everything: false,
      groups: ["aves"],
      foods: ["salmao", "arroz-branco"],
    });
  });

  it("tudo escolhido: como de tudo", () => {
    const all = summarizeLiked(
      allowed.map((f) => f.id),
      allowed,
    );
    expect(all.everything).toBe(true);
    expect(all.foods).toEqual([]);
    expect(summarizeLiked([], [])).toEqual({ everything: false, groups: [], foods: [] });
  });
});
