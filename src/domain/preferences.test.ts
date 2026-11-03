import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import { fixtureFood } from "./__fixtures__/foods";
import { indexFoods } from "./food";
import { normalizeTraining } from "./meals";
import {
  DIETS,
  allowedFoods,
  cleanLikedFoods,
  exclusionReason,
  foodOrigin,
  isAllowed,
  proteinCount,
  suggestedLikedFoods,
  type Diet,
} from "./preferences";

const INDEX = indexFoods(FOODS);
const food = (id: string) => {
  const f = INDEX.get(id);
  if (!f) throw new Error(id);
  return f;
};

describe("origem dos alimentos", () => {
  it("vem da categoria, com as exceções da despensa", () => {
    expect(foodOrigin(food("peito-frango"))).toBe("meat");
    expect(foodOrigin(food("atum-lata-natural"))).toBe("seafood");
    expect(foodOrigin(food("camarao"))).toBe("seafood");
    expect(foodOrigin(food("ovo"))).toBe("egg");
    expect(foodOrigin(food("skyr-natural"))).toBe("dairy");
    expect(foodOrigin(food("whey-sem-sabor"))).toBe("dairy");
    expect(foodOrigin(food("manteiga"))).toBe("dairy");
    expect(foodOrigin(food("mel"))).toBe("honey");
    expect(foodOrigin(food("tofu-firme"))).toBe("plant");
    expect(foodOrigin(food("azeite"))).toBe("plant");
  });
});

describe("dietas", () => {
  const allowedIds = (diet: Diet) =>
    new Set(allowedFoods(FOODS, { diet, allergies: [] }).map((f) => f.id));

  it("omnívora: tudo", () => {
    expect(allowedIds("omnivore").size).toBe(FOODS.length);
  });

  it("pescetariana: sem carne, com peixe", () => {
    const ids = allowedIds("pescatarian");
    expect(ids.has("peito-frango")).toBe(false);
    expect(ids.has("presunto")).toBe(false);
    expect(ids.has("salmao")).toBe(true);
    expect(ids.has("ovo")).toBe(true);
  });

  it("vegetariana: sem carne nem peixe, com ovos e laticínios", () => {
    const ids = allowedIds("vegetarian");
    expect(ids.has("salmao")).toBe(false);
    expect(ids.has("mexilhao")).toBe(false);
    expect(ids.has("ovo")).toBe(true);
    expect(ids.has("queijo-fresco")).toBe(true);
    expect(ids.has("mel")).toBe(true);
  });

  it("vegana: só origem vegetal", () => {
    const ids = allowedIds("vegan");
    expect(ids.has("ovo")).toBe(false);
    expect(ids.has("manteiga")).toBe(false);
    expect(ids.has("mel")).toBe(false);
    expect(ids.has("tofu-firme")).toBe(true);
    expect(ids.has("grao-bico")).toBe(true);
    expect(ids.has("azeite")).toBe(true);
  });

  it("todas as dietas deixam fontes de proteína suficientes", () => {
    for (const diet of DIETS) {
      const proteins = allowedFoods(FOODS, { diet, allergies: [] }).filter(
        (f) => f.role === "protein",
      );
      expect(proteins.length, diet).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("alergias", () => {
  it("excluem os alimentos que contêm o alergénio, com o motivo", () => {
    const r = { diet: "omnivore" as const, allergies: ["milk" as const, "gluten" as const] };
    expect(exclusionReason(food("skyr-natural"), r)).toBe("milk");
    expect(exclusionReason(food("pao-integral"), r)).toBe("gluten");
    expect(exclusionReason(food("arroz-branco"), r)).toBeNull();
    expect(isAllowed(food("manteiga"), r)).toBe(false);
  });

  it("a dieta vem antes do alergénio no motivo", () => {
    expect(exclusionReason(food("camarao"), { diet: "vegan", allergies: ["shellfish"] })).toBe(
      "diet",
    );
  });

  it("marisco cobre crustáceos e moluscos (incluindo em conserva)", () => {
    const r = { diet: "omnivore" as const, allergies: ["shellfish" as const] };
    for (const id of ["camarao", "polvo", "lulas", "mexilhao", "mexilhao-conserva"]) {
      expect(isAllowed(food(id), r), id).toBe(false);
    }
    expect(isAllowed(food("salmao"), r)).toBe(true);
  });

  it("os ovos, os frutos de casca rija, o amendoim, a soja, o sésamo e o tremoço", () => {
    const check = (id: string, allergy: Parameters<typeof exclusionReason>[1]["allergies"][0]) =>
      expect(exclusionReason(food(id), { diet: "omnivore", allergies: [allergy] })).toBe(allergy);
    check("ovo", "egg");
    check("amendoa", "tree-nuts");
    check("manteiga-amendoim", "peanut");
    check("tofu-firme", "soy");
    check("tahini", "sesame");
    check("tremocos", "lupin");
    check("mostarda", "mustard");
    check("sardinhas-lata", "fish");
  });
});

describe("alimentos de que a pessoa gosta", () => {
  const r = { diet: "vegetarian" as const, allergies: ["egg" as const] };

  it("limpa repetidos, desconhecidos, a despensa e os excluídos", () => {
    expect(
      cleanLikedFoods(
        ["skyr-natural", "skyr-natural", "nao-existe", "azeite", "ovo", "salmao", "tofu-firme"],
        INDEX,
        r,
      ),
    ).toEqual(["skyr-natural", "tofu-firme"]);
  });

  it("conta as fontes de proteína", () => {
    expect(proteinCount(["skyr-natural", "banana", "tofu-firme", "nao-existe"], INDEX)).toBe(2);
  });

  it("sugere as fontes de proteína mais fáceis que pode comer, sem ultraprocessados", () => {
    const suggested = suggestedLikedFoods(FOODS, r);
    expect(suggested).toHaveLength(6);
    for (const id of suggested) {
      const f = food(id);
      expect(f.role).toBe("protein");
      expect(isAllowed(f, r)).toBe(true);
      expect(f.processing).not.toBe("ultra");
    }
    const whey = fixtureFood({ id: "whey", processing: "ultra", exampleRank: 100 });
    expect(suggestedLikedFoods([whey], { diet: "omnivore", allergies: [] }, 3)).toEqual([]);
  });
});

describe("refeições à volta do treino", () => {
  const meals = ["pequeno-almoco", "almoco", "lanche", "jantar"] as const;

  it("aceita pré e pós-treino diferentes, das refeições escolhidas", () => {
    expect(normalizeTraining(meals, "lanche", "jantar")).toEqual({
      preWorkoutMeal: "lanche",
      postWorkoutMeal: "jantar",
    });
  });

  it("se coincidirem, fica só a pós-treino; fora das escolhidas, nenhuma", () => {
    expect(normalizeTraining(meals, "lanche", "lanche")).toEqual({
      preWorkoutMeal: null,
      postWorkoutMeal: "lanche",
    });
    expect(normalizeTraining(meals, "ceia", undefined)).toEqual({
      preWorkoutMeal: null,
      postWorkoutMeal: null,
    });
  });
});
