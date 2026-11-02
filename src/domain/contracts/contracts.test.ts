import { describe, expect, it } from "vitest";
import { FIXTURE_FOODS, fixtureFood } from "../__fixtures__/foods";
import { importGuestDataSchema, profileInputSchema, savePlanInputSchema } from "./account";
import { mealsSchema, portionCountSchema } from "./common";
import { TODO, checkCatalog, foodSchema, foodsMetaSchema } from "./food";
import { guestStateSchema } from "./guest-state";
import { planItemSchema } from "./plan";
import { recipeRequestSchema, recipeResponseSchema } from "./recipe";

const validState = {
  version: 1,
  target: { grams: 160, intensity: "alta", weightKg: 80 },
  meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
  postWorkoutMeal: "lanche",
  plan: {
    items: [
      {
        id: "b1",
        meal: "pequeno-almoco",
        foodId: "skyr-natural",
        portionId: "skyr-natural:iogurte",
        count: 1,
      },
    ],
  },
  updatedAt: 1793577600000,
};

describe("estado de convidado", () => {
  it("aceita o exemplo da especificação e preenche os valores por defeito", () => {
    const parsed = guestStateSchema.parse(validState);
    expect(parsed.target.manual).toBe(false);
    expect(parsed.plan.seed).toBe(0);
    expect(parsed.plan.isExample).toBe(false);
  });

  it("recusa uma refeição pós-treino fora das escolhidas", () => {
    expect(guestStateSchema.safeParse({ ...validState, postWorkoutMeal: "ceia" }).success).toBe(
      false,
    );
  });

  it("recusa versões desconhecidas e refeições repetidas", () => {
    expect(guestStateSchema.safeParse({ ...validState, version: 2 }).success).toBe(false);
    expect(guestStateSchema.safeParse({ ...validState, meals: ["almoco", "almoco"] }).success).toBe(
      false,
    );
    expect(mealsSchema.safeParse(["almoco"]).success).toBe(false);
  });
});

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

  it("recusa ids fora do formato", () => {
    expect(planItemSchema.safeParse({ ...item, foodId: "Atum Lata" }).success).toBe(false);
    expect(planItemSchema.safeParse({ ...item, portionId: "sem-separador" }).success).toBe(false);
  });
});

describe("conta", () => {
  const profile = {
    dailyTargetG: 160,
    intensity: "alta",
    meals: ["almoco", "jantar"],
    postWorkoutMeal: null,
  };

  it("o perfil nunca leva o peso", () => {
    expect(profileInputSchema.parse(profile).locale).toBe("pt");
    expect(profileInputSchema.safeParse({ ...profile, weightKg: 80 }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...profile, postWorkoutMeal: "lanche" }).success).toBe(
      false,
    );
  });

  it("a importação exige um importId UUID e recusa campos a mais", () => {
    const input = { importId: crypto.randomUUID(), profile, items: [] };
    expect(importGuestDataSchema.safeParse(input).success).toBe(true);
    expect(importGuestDataSchema.safeParse({ ...input, importId: "abc" }).success).toBe(false);
    expect(importGuestDataSchema.safeParse({ ...input, weightKg: 80 }).success).toBe(false);
    expect(savePlanInputSchema.safeParse({ items: [], extra: 1 }).success).toBe(false);
  });
});

describe("receitas", () => {
  const request = {
    foodIds: ["atum-lata-natural", "arroz-branco"],
    meal: "almoco",
    postWorkout: false,
    mealTargetG: 46,
    maxMinutes: 20,
    servings: 2,
    locale: "pt",
  };

  it("aceita só campos fechados", () => {
    expect(recipeRequestSchema.parse(request).variant).toBe(1);
    expect(recipeRequestSchema.safeParse({ ...request, notes: "sem glúten" }).success).toBe(false);
    expect(recipeRequestSchema.safeParse({ ...request, maxMinutes: 25 }).success).toBe(false);
    expect(recipeRequestSchema.safeParse({ ...request, foodIds: ["a-b"] }).success).toBe(false);
    expect(recipeRequestSchema.safeParse({ ...request, foodIds: ["atum", "atum"] }).success).toBe(
      false,
    );
    expect(recipeRequestSchema.safeParse({ ...request, servings: 5 }).success).toBe(false);
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
    expect(issues(light).length).toBeGreaterThan(0);
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

  it("checkCatalog: ids únicos e TODO só com allowTodo", () => {
    const todo = fixtureFood({ id: "novo", tcaCode: TODO });
    expect(checkCatalog([valid, valid], { allowTodo: true })).toEqual([
      { path: "frango", message: "id repetido" },
    ]);
    expect(checkCatalog([todo], { allowTodo: true })).toEqual([]);
    expect(checkCatalog([todo], { allowTodo: false })[0]?.path).toBe("novo.tcaCode");
  });
});
