import { describe, expect, it } from "vitest";
import { FIXTURE_FOODS, fixtureFood } from "../__fixtures__/foods";
import { addToDayInputSchema, saveDayInputSchema } from "./account";
import { mealsSchema, portionCountSchema } from "./common";
import { TCA_REFERENCE, TODO, checkCatalog, foodSchema, foodsMetaSchema } from "./food";
import { planItemSchema } from "./plan";
import { preferencesInputSchema } from "./profile";
import { recipeRequestSchema, recipeResponseSchema } from "./recipe";

describe("itens do dia", () => {
  const item = {
    id: "x",
    meal: "almoco",
    foodId: "atum-lata-natural",
    portionId: "atum-lata-natural:lata",
    count: 1.5,
  };

  it("aceita porções em passos de 0,5 entre 0,5 e 4", () => {
    expect(planItemSchema.safeParse(item).success).toBe(true);
    expect(portionCountSchema.safeParse(0.5).success).toBe(true);
    expect(portionCountSchema.safeParse(1.25).success).toBe(false);
    expect(portionCountSchema.safeParse(4.5).success).toBe(false);
  });

  it("recusa uma porção que não é do alimento", () => {
    expect(planItemSchema.safeParse({ ...item, portionId: "skyr-natural:iogurte" }).success).toBe(
      false,
    );
  });

  it("refeições: 2 a 6, sem repetidas", () => {
    expect(mealsSchema.safeParse(["almoco"]).success).toBe(false);
    expect(mealsSchema.safeParse(["almoco", "almoco"]).success).toBe(false);
    expect(mealsSchema.safeParse(["almoco", "jantar"]).success).toBe(true);
  });

  it("recusa ids fora do formato", () => {
    expect(planItemSchema.safeParse({ ...item, foodId: "Atum Lata" }).success).toBe(false);
    expect(planItemSchema.safeParse({ ...item, portionId: "sem-separador" }).success).toBe(false);
  });
});

describe("conta", () => {
  const preferences = {
    weightKg: 80,
    intensity: "alta",
    manualTargetG: null,
    meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
    preWorkoutMeal: "lanche",
    postWorkoutMeal: "jantar",
    diet: "vegetarian",
    allergies: ["peanut"],
    likedFoods: ["skyr-natural", "ovo", "tofu-firme"],
    equipment: ["stove", "microwave"],
    cookMinutes: 20,
    healthConsent: true,
  };
  const issues = (input: unknown) =>
    preferencesInputSchema.safeParse(input).error?.issues.map((i) => i.path.join(".")) ?? [];

  it("aceita as preferências completas", () => {
    expect(issues(preferences)).toEqual([]);
  });

  it("o peso e as alergias só com consentimento; sem peso, a meta é manual", () => {
    expect(issues({ ...preferences, healthConsent: false })).toEqual(["healthConsent"]);
    expect(issues({ ...preferences, weightKg: null, allergies: [], healthConsent: false })).toEqual(
      ["weightKg"],
    );
    expect(
      issues({
        ...preferences,
        weightKg: null,
        manualTargetG: 150,
        allergies: [],
        healthConsent: false,
      }),
    ).toEqual([]);
  });

  it("as refeições do treino são das escolhidas e diferentes entre si", () => {
    expect(issues({ ...preferences, preWorkoutMeal: "ceia" })).toEqual(["preWorkoutMeal"]);
    expect(issues({ ...preferences, preWorkoutMeal: "jantar" })).toEqual(["preWorkoutMeal"]);
  });

  it("recusa repetidos, valores fora da lista e campos a mais", () => {
    expect(issues({ ...preferences, allergies: ["milk", "milk"] }).length).toBeGreaterThan(0);
    expect(issues({ ...preferences, equipment: [] }).length).toBeGreaterThan(0);
    expect(issues({ ...preferences, cookMinutes: 25 }).length).toBeGreaterThan(0);
    expect(issues({ ...preferences, diet: "keto" }).length).toBeGreaterThan(0);
    expect(issues({ ...preferences, notes: "x" }).length).toBeGreaterThan(0);
  });

  it("gravar o dia leva só os itens", () => {
    expect(saveDayInputSchema.safeParse({ items: [] }).success).toBe(true);
    expect(saveDayInputSchema.safeParse({ items: [], profile: {} }).success).toBe(false);
    expect(saveDayInputSchema.safeParse({ owner: "u1", items: [] }).success).toBe(false);
  });

  it("adicionar ao dia: refeição, alimento, porção dele e número de porções", () => {
    const add = { meal: "almoco", foodId: "ovo", portionId: "ovo:ovo", count: 1 };
    expect(addToDayInputSchema.safeParse(add).success).toBe(true);
    expect(
      addToDayInputSchema.safeParse({ ...add, portionId: "skyr-natural:iogurte" }).success,
    ).toBe(false);
    expect(addToDayInputSchema.safeParse({ ...add, count: 5 }).success).toBe(false);
    expect(addToDayInputSchema.safeParse({ ...add, userId: "x" }).success).toBe(false);
  });
});

describe("receitas", () => {
  const request = {
    foodIds: ["atum-lata-natural", "arroz-branco"],
    meal: "almoco",
    maxMinutes: 20,
    servings: 2,
    locale: "pt",
  };

  it("aceita só campos fechados", () => {
    expect(recipeRequestSchema.parse(request).variant).toBe(1);
    expect(recipeRequestSchema.safeParse({ ...request, notes: "sem glúten" }).success).toBe(false);
    expect(recipeRequestSchema.safeParse({ ...request, maxMinutes: 25 }).success).toBe(false);
    // Os alimentos são opcionais (a app completa a base), até 6
    expect(recipeRequestSchema.safeParse({ ...request, foodIds: [] }).success).toBe(true);
    expect(
      recipeRequestSchema.safeParse({
        ...request,
        foodIds: ["a", "b", "c", "d", "e", "f", "g"],
      }).success,
    ).toBe(false);
    expect(recipeRequestSchema.safeParse({ ...request, foodIds: ["Atum!"] }).success).toBe(false);
    expect(recipeRequestSchema.safeParse({ ...request, foodIds: ["atum", "atum"] }).success).toBe(
      false,
    );
    expect(recipeRequestSchema.safeParse({ ...request, servings: 5 }).success).toBe(false);
    // A meta da refeição e o treino vêm do perfil, nunca do pedido
    expect(recipeRequestSchema.safeParse({ ...request, mealTargetG: 46 }).success).toBe(false);
  });

  it("a resposta é um id ou um código de erro", () => {
    expect(recipeResponseSchema.safeParse({ ok: true, id: "abc", cached: false }).success).toBe(
      true,
    );
    expect(recipeResponseSchema.safeParse({ ok: false, code: "quota_exceeded" }).success).toBe(
      true,
    );
    expect(recipeResponseSchema.safeParse({ ok: false, code: "outro" }).success).toBe(false);
  });
});

describe("alimentos (content/foods)", () => {
  const valid = FIXTURE_FOODS[0]!;

  it("aceita um alimento completo", () => {
    expect(foodSchema.safeParse(valid).success).toBe(true);
    expect(foodsMetaSchema.safeParse({ foodDataVersion: 1, source: "TCA" }).success).toBe(true);
  });

  const issues = (food: unknown) =>
    foodSchema.safeParse(food).error?.issues.map((i) => `${i.path.join(".")}: ${i.message}`) ?? [];

  it("exige exatamente uma porção default", () => {
    const none = { ...valid, portions: valid.portions.map(({ default: _d, ...p }) => p) };
    expect(issues(none).join()).toContain("0 porções default");
    const two = {
      ...valid,
      portions: valid.portions.map((p) => ({ ...p, default: true as const })),
    };
    expect(issues(two).join()).toContain("2 porções default");
  });

  it("recusa porções repetidas, de outro alimento ou fora de 5–500 g", () => {
    const dup = { ...valid, portions: [valid.portions[0]!, valid.portions[0]!] };
    expect(issues(dup).join()).toContain("repetidos");
    const other = { ...valid, portions: [{ ...valid.portions[0]!, id: "atum:lata" }] };
    expect(issues(other).join()).toContain('começar por "frango:"');
    const heavy = { ...valid, portions: [{ ...valid.portions[0]!, grams: 501 }] };
    expect(issues(heavy).length).toBeGreaterThan(0);
    const light = { ...valid, portions: [{ ...valid.portions[0]!, grams: 4 }] };
    expect(issues(light).join()).toContain("só a despensa");
    const pinch = { ...valid, role: "pantry", portions: [{ ...valid.portions[0]!, grams: 1 }] };
    expect(issues(pinch)).toEqual([]);
    const zero = { ...valid, role: "pantry", portions: [{ ...valid.portions[0]!, grams: 0.5 }] };
    expect(issues(zero).length).toBeGreaterThan(0);
  });

  it("proteína entre 0 e 90 g por 100 g", () => {
    expect(issues({ ...valid, proteinPer100g: 91 }).length).toBeGreaterThan(0);
    expect(issues({ ...valid, proteinPer100g: -1 }).length).toBeGreaterThan(0);
  });

  it("ultraprocessados só nas exceções (whey)", () => {
    expect(issues({ ...valid, processing: "ultra" }).join()).toContain("PROCESSING_EXCEPTIONS");
    const whey = fixtureFood({ id: "whey-sem-sabor", processing: "ultra" });
    expect(issues(whey)).toEqual([]);
  });

  it("recusa momentos repetidos e campos desconhecidos", () => {
    expect(issues({ ...valid, moments: ["almoco", "almoco"] }).join()).toContain(
      "momentos repetidos",
    );
    expect(issues({ ...valid, price: 3 }).length).toBeGreaterThan(0);
  });

  it("recusa alergénios repetidos ou desconhecidos", () => {
    expect(issues({ ...valid, allergens: ["milk", "milk"] }).join()).toContain(
      "alergénios repetidos",
    );
    expect(issues({ ...valid, allergens: ["celery"] }).length).toBeGreaterThan(0);
  });

  it("checkCatalog: ids únicos e TODO só com allowTodo", () => {
    const todo = fixtureFood({ id: "novo", tcaCode: TODO });
    expect(checkCatalog([valid, valid], { allowTodo: true })).toEqual([
      { path: "frango", message: "id repetido" },
    ]);
    expect(checkCatalog([todo], { allowTodo: true })).toEqual([]);
    expect(checkCatalog([todo], { allowTodo: false })[0]?.path).toBe("novo.tcaCode");
    const reference = fixtureFood({ id: "revisto", tcaCode: TCA_REFERENCE });
    expect(checkCatalog([reference], { allowTodo: false })).toEqual([]);
  });
});
