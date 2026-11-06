import "server-only";
import { UI_IMAGES, foodImage } from "@/content/food-images.generated";
import { proteinPer100Kcal } from "@/domain/calories";
import { defaultPortion } from "@/domain/food";
import { FOOD_SECTIONS, FOOD_SUBGROUPS, foodSubgroup } from "@/domain/food-groups";
import { MEALS } from "@/domain/meals";
import type { Locale } from "@/i18n/routing";
import {
  LISTED_FOODS,
  defaultPortionProtein,
  foodName,
  normalizeSearch,
  portionLabel,
} from "./catalog";
import type { CatalogItem, CatalogSection } from "./catalog-types";

/**
 * O índice do catálogo para o browser: só o que os cartões, a pesquisa e os filtros usam, já
 * traduzido e com a proteína calculada aqui (a tabela completa dos alimentos não vai para o
 * cliente). Pela ordem de content/foods, como o catálogo sempre mostrou nos empates.
 */
export function catalogItems(locale: Locale, categoryLabel: (c: string) => string): CatalogItem[] {
  return LISTED_FOODS.flatMap((food) => {
    const subgroup = foodSubgroup(food);
    if (!subgroup) return [];
    return [
      {
        id: food.id,
        name: foodName(food, locale),
        en: normalizeSearch(food.name.en),
        portion: portionLabel(defaultPortion(food), locale),
        protein: defaultPortionProtein(food),
        density: Math.round((proteinPer100Kcal(food) ?? 0) * 10) / 10,
        category: categoryLabel(food.category),
        ease: food.ease,
        meals: MEALS.reduce(
          (bits, meal, i) => (food.moments.includes(meal) ? bits | (1 << i) : bits),
          0,
        ),
        subgroup,
        rank: food.exampleRank,
        image: foodImage(food.id).replace(/^\/images\/foods\/(.+)\.webp$/, "$1"),
      },
    ];
  });
}

/** As 5 secções e os seus subgrupos, pela ordem do formulário, com nome e ilustração. */
export function catalogSections(
  sectionLabel: (s: string) => string,
  subgroupLabel: (s: string) => string,
): CatalogSection[] {
  const sectionImage = {
    protein: "group:aves",
    carb: "group:pao",
    fruit: "group:fruta-dia",
    vegetable: "group:couves",
    nuts: "group:frutos-secos",
  } as const;
  return FOOD_SECTIONS.map((id) => ({
    id,
    title: sectionLabel(id),
    image: UI_IMAGES[sectionImage[id]],
    subgroups: FOOD_SUBGROUPS.filter((g) => g.section === id).map((g) => ({
      id: g.id,
      title: subgroupLabel(g.id),
      image: UI_IMAGES[`group:${g.id}`],
    })),
  }));
}

/** A ilustração do cartão "Todos". */
export const ALL_IMAGE = UI_IMAGES["misc:all"];
