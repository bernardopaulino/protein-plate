import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { defaultPortion, type FoodIndex } from "./food";
import { MEALS } from "./meals";
import { ALLERGENS, DIETS, EQUIPMENT, isAllowed, type Restrictions } from "./preferences";
import { proteinPerServingOf } from "./recipe-fit";
import {
  adaptLibraryRecipe,
  libraryRecipeFits,
  pickLibraryRecipe,
  type LibraryNeed,
  type LibraryRecipe,
} from "./recipe-library";
import { MAX_MINUTES_OPTIONS } from "./recipe-options";

const INDEX: FoodIndex = new Map(FOODS.map((f) => [f.id, f]));

const frango: LibraryRecipe = {
  id: "frango1",
  meal: "almoco",
  locale: "pt",
  preWorkout: false,
  postWorkout: false,
  servings: 2,
  prepMinutes: 20,
  equipment: ["stove"],
  ingredients: [
    { foodId: "peito-frango", grams: 300 },
    { foodId: "arroz-branco", grams: 160 },
    { foodId: "brocolos", grams: 200 },
    { foodId: "azeite", grams: 10 },
  ],
};

const grao: LibraryRecipe = {
  ...frango,
  id: "grao1",
  equipment: [],
  prepMinutes: 10,
  ingredients: [
    { foodId: "grao-bico-lata", grams: 400 },
    { foodId: "tomate", grams: 200 },
    { foodId: "azeite", grams: 10 },
  ],
};

function need(partial: Partial<LibraryNeed> = {}): LibraryNeed {
  return {
    meal: "almoco",
    locale: "pt",
    preWorkout: false,
    postWorkout: false,
    maxMinutes: 20,
    servings: 2,
    equipment: ["stove", "microwave"],
    targetG: proteinPerServingOf(frango.ingredients, 2, INDEX),
    restrictions: { diet: "omnivore", allergies: [] },
    chosenIds: [],
    liked: new Set(),
    seen: new Set(),
    foods: INDEX,
    ...partial,
  };
}

describe("biblioteca de receitas: o que serve a pessoa", () => {
  it("serve uma receita igual ao pedido, sem mexer nas quantidades", () => {
    const pick = pickLibraryRecipe([frango], need());
    expect(pick?.recipe.id).toBe("frango1");
    expect(pick?.ingredients).toEqual(frango.ingredients);
  });

  it("outra refeição, idioma, contexto de treino ou tempo a mais: não serve", () => {
    expect(libraryRecipeFits(frango, need({ meal: "jantar" }))).toBe(false);
    expect(libraryRecipeFits(frango, need({ locale: "en" }))).toBe(false);
    expect(libraryRecipeFits(frango, need({ postWorkout: true }))).toBe(false);
    expect(libraryRecipeFits(frango, need({ preWorkout: true }))).toBe(false);
    expect(libraryRecipeFits(frango, need({ maxMinutes: 10 }))).toBe(false);
  });

  it("só o equipamento que a pessoa tem; sem cozinhar só aceita receitas sem equipamento", () => {
    expect(libraryRecipeFits(frango, need({ equipment: ["microwave"] }))).toBe(false);
    expect(libraryRecipeFits(frango, need({ equipment: [] }))).toBe(false);
    expect(libraryRecipeFits(grao, need({ equipment: [] }))).toBe(true);
  });

  it("as restrições valem para todos os ingredientes, também a despensa", () => {
    expect(
      libraryRecipeFits(frango, need({ restrictions: { diet: "vegetarian", allergies: [] } })),
    ).toBe(false);
    expect(libraryRecipeFits(grao, need({ restrictions: { diet: "vegan", allergies: [] } }))).toBe(
      true,
    );
  });

  it("os alimentos escolhidos pela pessoa têm de estar todos na receita", () => {
    expect(libraryRecipeFits(frango, need({ chosenIds: ["peito-frango"] }))).toBe(true);
    expect(libraryRecipeFits(frango, need({ chosenIds: ["peito-frango", "ovo"] }))).toBe(false);
  });

  it("numa refeição leve, uma proteína só de prato só serve se a pessoa a escolheu", () => {
    const lentilhas: LibraryRecipe = {
      ...grao,
      id: "lentilhas-pa",
      meal: "pequeno-almoco",
      ingredients: [
        { foodId: "lentilhas-castanhas", grams: 160 },
        { foodId: "aveia-flocos", grams: 80 },
      ],
    };
    const breakfast = need({ meal: "pequeno-almoco", equipment: ["stove"], maxMinutes: 45 });
    expect(libraryRecipeFits(lentilhas, breakfast)).toBe(false);
    expect(libraryRecipeFits(lentilhas, { ...breakfast, chosenIds: ["lentilhas-castanhas"] })).toBe(
      true,
    );
    // Ao almoço, a mesma receita serve
    expect(
      libraryRecipeFits({ ...lentilhas, meal: "almoco" }, { ...breakfast, meal: "almoco" }),
    ).toBe(true);
  });

  it("nunca repete uma receita que a pessoa já viu", () => {
    expect(pickLibraryRecipe([frango], need({ seen: new Set(["frango1"]) }))).toBeNull();
  });

  it("prefere os alimentos de que a pessoa gosta e evita proteínas de outras refeições", () => {
    const both = [frango, grao];
    const liking = need({ maxMinutes: 20, liked: new Set(["grao-bico-lata", "tomate"]) });
    expect(pickLibraryRecipe(both, { ...liking, targetG: 20 }, () => 0.5)?.recipe.id).toBe("grao1");
    const avoiding = need({ avoid: new Set(["grao-bico-lata"]), targetG: 20 });
    expect(pickLibraryRecipe(both, avoiding, () => 0.5)?.recipe.id).toBe("frango1");
  });
});

describe("biblioteca de receitas: reajuste às doses e à proteína", () => {
  it("muda as doses: as gramas escalam e a proteína por dose fica igual", () => {
    const target = proteinPerServingOf(frango.ingredients, 2, INDEX);
    const adapted = adaptLibraryRecipe(frango, { servings: 4, targetG: target, foods: INDEX });
    expect(adapted).not.toBeNull();
    expect(adapted!.ingredients.find((i) => i.foodId === "arroz-branco")?.grams).toBe(320);
    expect(Math.abs(adapted!.proteinPerServingG - target)).toBeLessThanOrEqual(target * 0.1);
  });

  it("outra meta: só as fontes de proteína mudam", () => {
    const adapted = adaptLibraryRecipe(frango, { servings: 2, targetG: 60, foods: INDEX });
    expect(adapted).not.toBeNull();
    expect(Math.abs(adapted!.proteinPerServingG - 60)).toBeLessThanOrEqual(60 * 0.2);
    expect(adapted!.ingredients.slice(1)).toEqual(frango.ingredients.slice(1));
  });

  it("uma meta que a receita não alcança: não serve (vai ao modelo)", () => {
    expect(adaptLibraryRecipe(frango, { servings: 2, targetG: 120, foods: INDEX })).toBeNull();
  });
});

describe("biblioteca de receitas: garantias (fast-check)", () => {
  const proteins = FOODS.filter((f) => f.role === "protein");
  const others = FOODS.filter((f) => f.role !== "protein");

  const recipeArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 6 }),
    meal: fc.constantFrom(...MEALS),
    locale: fc.constantFrom("pt" as const, "en" as const),
    preWorkout: fc.boolean(),
    postWorkout: fc.boolean(),
    servings: fc.integer({ min: 1, max: 4 }),
    prepMinutes: fc.integer({ min: 5, max: 45 }),
    equipment: fc.subarray([...EQUIPMENT]),
    ingredients: fc
      .tuple(
        fc.subarray(proteins, { minLength: 1, maxLength: 2 }),
        fc.subarray(others, { minLength: 1, maxLength: 4 }),
      )
      .map(([p, o]) =>
        [...p, ...o].map((f) => ({ foodId: f.id, grams: defaultPortion(f).grams * 2 })),
      ),
  });

  const restrictionsArb: fc.Arbitrary<Restrictions> = fc.record({
    diet: fc.constantFrom(...DIETS),
    allergies: fc.subarray([...ALLERGENS]),
  });

  const needArb = fc.record({
    meal: fc.constantFrom(...MEALS),
    locale: fc.constantFrom("pt" as const, "en" as const),
    preWorkout: fc.boolean(),
    postWorkout: fc.boolean(),
    maxMinutes: fc.constantFrom(...MAX_MINUTES_OPTIONS),
    servings: fc.integer({ min: 1, max: 4 }),
    equipment: fc.subarray([...EQUIPMENT]),
    targetG: fc.integer({ min: 10, max: 80 }),
    restrictions: restrictionsArb,
  });

  it("nunca serve um alimento excluído, equipamento que a pessoa não tem ou tempo a mais", () => {
    fc.assert(
      fc.property(fc.array(recipeArb, { maxLength: 12 }), needArb, (candidates, partial) => {
        const pick = pickLibraryRecipe(candidates, need(partial));
        if (!pick) return;
        expect(pick.recipe.meal).toBe(partial.meal);
        expect(pick.recipe.locale).toBe(partial.locale);
        expect(pick.recipe.prepMinutes).toBeLessThanOrEqual(partial.maxMinutes);
        expect(pick.recipe.equipment.every((e) => partial.equipment.includes(e))).toBe(true);
        for (const { foodId } of pick.ingredients) {
          expect(isAllowed(INDEX.get(foodId)!, partial.restrictions)).toBe(true);
        }
        // A proteína é a da app e fica a menos de 20% do alvo
        const protein = proteinPerServingOf(pick.ingredients, partial.servings, INDEX);
        expect(pick.proteinPerServingG).toBeCloseTo(protein, 9);
        expect(Math.abs(protein - partial.targetG)).toBeLessThanOrEqual(partial.targetG * 0.2);
      }),
    );
  });
});
