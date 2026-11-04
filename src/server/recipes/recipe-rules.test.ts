import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { indexFoods } from "@/domain/food";
import {
  mergeDuplicateIngredients,
  recipeOutputSchema,
  recipeProblem,
  type RecipeOutput,
} from "./recipe-rules";

const foods = indexFoods(FOODS);

const recipe: RecipeOutput = {
  title: "Atum com grão",
  summary: "Uma salada rápida.",
  prepMinutes: 10,
  ingredients: [
    { foodId: "atum-lata-natural", grams: 120 },
    { foodId: "grao-bico-lata", grams: 150 },
  ],
  steps: ["Escorre o atum e o grão.", "Junta tudo e serve."],
};

const check = {
  allowedIds: new Set(["atum-lata-natural", "grao-bico-lata", "tomate"]),
  maxMinutes: 20 as const,
  proteinIds: ["atum-lata-natural"],
  servings: 1,
  foods,
};

describe("recipeOutputSchema (fixo: a gramática fica em cache na API)", () => {
  it("aceita ids quaisquer (a lista verifica-se em recipeProblem) e recusa tempos acima de 45", () => {
    expect(recipeOutputSchema.safeParse(recipe).success).toBe(true);
    expect(
      recipeOutputSchema.safeParse({
        ...recipe,
        ingredients: [...recipe.ingredients, { foodId: "inventado", grams: 10 }],
      }).success,
    ).toBe(true);
    expect(recipeOutputSchema.safeParse({ ...recipe, prepMinutes: 46 }).success).toBe(false);
  });
});

describe("mergeDuplicateIngredients", () => {
  it("soma as gramas dos repetidos e mantém a ordem da primeira vez", () => {
    const merged = mergeDuplicateIngredients({
      ...recipe,
      ingredients: [
        { foodId: "atum-lata-natural", grams: 60 },
        { foodId: "grao-bico-lata", grams: 150 },
        { foodId: "atum-lata-natural", grams: 60 },
      ],
    });
    expect(merged.ingredients).toEqual(recipe.ingredients);
  });

  it("sem repetidos devolve a mesma receita", () => {
    expect(mergeDuplicateIngredients(recipe)).toBe(recipe);
  });
});

describe("recipeProblem", () => {
  it("receita válida → null", () => {
    expect(recipeProblem(recipe, check)).toBeNull();
  });

  it("ingrediente fora da lista enviada ao modelo", () => {
    const outside = {
      ...recipe,
      ingredients: [...recipe.ingredients, { foodId: "peito-frango", grams: 100 }],
    };
    expect(recipeProblem(outside, check)).toContain("peito-frango não estão na lista");
  });

  it("tempo acima do pedido", () => {
    expect(recipeProblem({ ...recipe, prepMinutes: 30 }, check)).toContain(
      "passa o tempo máximo de 20 minutos",
    );
  });

  it("fonte de proteína em falta", () => {
    const missing = { ...recipe, ingredients: [{ foodId: "grao-bico-lata", grams: 150 }] };
    expect(recipeProblem(missing, check)).toContain("faltam as fontes de proteína");
  });
});
