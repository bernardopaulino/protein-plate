import { describe, expect, it } from "vitest";
import { FOOD_IMAGES, FOOD_IMAGE_FALLBACK } from "@/content/food-images.generated";
import { FOOD_SECTIONS, FOOD_SUBGROUPS, foodSubgroup } from "@/domain/food-groups";
import { MEALS } from "@/domain/meals";
import { LISTED_FOODS, defaultPortionProtein } from "./catalog";
import { catalogItems, catalogSections } from "./catalog-index";
import { catalogImage } from "./catalog-types";

describe("índice do catálogo para o browser", () => {
  const items = catalogItems("pt", (c) => `cat:${c}`);

  it("tem cada alimento listado uma vez, pela ordem de content/foods", () => {
    expect(items.map((i) => i.id)).toEqual(LISTED_FOODS.map((f) => f.id));
  });

  it("traz a proteína calculada pela app e o grupo de cada alimento", () => {
    for (const food of LISTED_FOODS) {
      const item = items.find((i) => i.id === food.id)!;
      expect(item.protein).toBe(defaultPortionProtein(food));
      expect(
        Math.abs(item.density - (food.proteinPer100g / food.kcalPer100g) * 100),
      ).toBeLessThanOrEqual(0.05 + 1e-9);
      expect(item.subgroup).toBe(foodSubgroup(food));
      expect(item.category).toBe(`cat:${food.category}`);
      expect(item.name).toBe(food.name.pt);
      expect(MEALS.filter((_, i) => item.meals & (1 << i))).toEqual(
        MEALS.filter((m) => food.moments.includes(m)),
      );
      expect(catalogImage(item)).toBe(FOOD_IMAGES[food.id] ?? FOOD_IMAGE_FALLBACK);
    }
  });

  it("traz o nome em inglês normalizado para a pesquisa", () => {
    const grao = items.find((i) => i.name.startsWith("Grão"));
    expect(grao?.en).toContain("chickpea");
  });

  it("todas as ilustrações dos alimentos estão em /images/foods", () => {
    for (const path of Object.values(FOOD_IMAGES))
      expect(path).toMatch(/^\/images\/foods\/.+\.webp$/);
  });

  it("tem as 5 secções e todos os subgrupos, pela ordem do formulário", () => {
    const sections = catalogSections(
      (s) => s,
      (s) => s,
    );
    expect(sections.map((s) => s.id)).toEqual([...FOOD_SECTIONS]);
    expect(sections.flatMap((s) => s.subgroups.map((g) => g.id))).toEqual(
      FOOD_SUBGROUPS.map((g) => g.id),
    );
    expect(sections.every((s) => s.image)).toBe(true);
  });
});
