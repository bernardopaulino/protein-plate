import type { Food, Portion } from "../food";
import type { Meal } from "../meals";

/** Alimentos de teste (independentes da curadoria em content/foods). */
export function fixtureFood(
  partial: Partial<Food> & Pick<Food, "id">,
  portions?: Array<Omit<Portion, "id"> & { slug: string }>,
): Food {
  const id = partial.id;
  return {
    name: { pt: id, en: id },
    category: "carne",
    role: "protein",
    proteinPer100g: 20,
    kcalPer100g: 100,
    carbsPer100g: 0,
    fatPer100g: 1,
    weightBasis: "raw",
    processing: "natural",
    moments: ["almoco", "jantar"] as Meal[],
    ease: 2,
    exampleRank: 50,
    allergens: [],
    tcaCode: "T001",
    ideas: { pt: [], en: [] },
    ...partial,
    portions: (
      portions ?? [
        { slug: "dose", label: { pt: "1 dose", en: "1 serving" }, grams: 100, default: true },
      ]
    ).map(({ slug, ...p }) => ({ id: `${id}:${slug}`, ...p })),
  };
}

const ALL: Meal[] = ["pequeno-almoco", "meio-da-manha", "almoco", "lanche", "jantar", "ceia"];
const SNACK_MOMENTS: Meal[] = ["pequeno-almoco", "meio-da-manha", "lanche", "ceia"];

export const FIXTURE_FOODS: Food[] = [
  fixtureFood({ id: "frango", category: "carne", proteinPer100g: 23, exampleRank: 95, ease: 3 }, [
    { slug: "peito", label: { pt: "1 peito", en: "1 breast" }, grams: 150, default: true },
    { slug: "100g", label: { pt: "100 g", en: "100 g" }, grams: 100 },
  ]),
  fixtureFood({ id: "atum", category: "conservas", proteinPer100g: 25, exampleRank: 80, ease: 1 }, [
    { slug: "lata", label: { pt: "1 lata", en: "1 can" }, grams: 60, default: true },
  ]),
  fixtureFood(
    { id: "pescada", category: "peixe", proteinPer100g: 16.5, exampleRank: 60, ease: 3 },
    [{ slug: "posta", label: { pt: "1 posta", en: "1 fillet" }, grams: 150, default: true }],
  ),
  fixtureFood(
    {
      id: "skyr",
      category: "laticinios",
      proteinPer100g: 11,
      exampleRank: 90,
      ease: 1,
      moments: SNACK_MOMENTS,
    },
    [{ slug: "iogurte", label: { pt: "1 iogurte", en: "1 pot" }, grams: 150, default: true }],
  ),
  fixtureFood(
    { id: "ovo", category: "ovos", proteinPer100g: 12.6, exampleRank: 85, ease: 2, moments: ALL },
    [{ slug: "ovo", label: { pt: "1 ovo", en: "1 egg" }, grams: 50, default: true }],
  ),
  fixtureFood(
    {
      id: "leite",
      category: "laticinios",
      proteinPer100g: 3.3,
      exampleRank: 40,
      ease: 1,
      moments: SNACK_MOMENTS,
    },
    [{ slug: "copo", label: { pt: "1 copo", en: "1 glass" }, grams: 250, default: true }],
  ),
  fixtureFood(
    {
      id: "tremocos",
      category: "leguminosas",
      proteinPer100g: 15.6,
      exampleRank: 30,
      ease: 1,
      moments: SNACK_MOMENTS,
    },
    [{ slug: "punhado", label: { pt: "1 punhado", en: "1 handful" }, grams: 50, default: true }],
  ),
  fixtureFood(
    {
      id: "whey",
      category: "suplementos",
      proteinPer100g: 80,
      exampleRank: 100,
      ease: 1,
      processing: "ultra",
      moments: ALL,
    },
    [{ slug: "dose", label: { pt: "1 dose", en: "1 scoop" }, grams: 30, default: true }],
  ),
  fixtureFood(
    { id: "arroz", category: "cereais", role: "carb", proteinPer100g: 7, exampleRank: 90, ease: 3 },
    [{ slug: "dose", label: { pt: "1 dose", en: "1 serving" }, grams: 80, default: true }],
  ),
  fixtureFood(
    {
      id: "aveia",
      category: "cereais",
      role: "carb",
      proteinPer100g: 13,
      exampleRank: 85,
      ease: 1,
      moments: ["pequeno-almoco", "lanche", "ceia"],
    },
    [{ slug: "colheres", label: { pt: "4 colheres", en: "4 tbsp" }, grams: 40, default: true }],
  ),
  fixtureFood(
    {
      id: "brocolos",
      category: "legumes",
      role: "vegetable",
      proteinPer100g: 3,
      exampleRank: 60,
      ease: 2,
    },
    [{ slug: "chavena", label: { pt: "1 chávena", en: "1 cup" }, grams: 100, default: true }],
  ),
  fixtureFood(
    {
      id: "banana",
      category: "fruta",
      role: "carb",
      proteinPer100g: 1.2,
      exampleRank: 75,
      ease: 1,
      moments: SNACK_MOMENTS,
    },
    [{ slug: "banana", label: { pt: "1 banana", en: "1 banana" }, grams: 120, default: true }],
  ),
  fixtureFood(
    {
      id: "azeite",
      category: "despensa",
      role: "pantry",
      proteinPer100g: 0,
      exampleRank: 0,
      ease: 1,
    },
    [{ slug: "colher", label: { pt: "1 colher", en: "1 tbsp" }, grams: 10, default: true }],
  ),
];
