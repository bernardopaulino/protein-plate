import { defaultPortion, type Food } from "@/domain/food";
import type { RecipeRequest } from "@/domain/contracts/recipe";
import type { RecipeOutput } from "./recipe-rules";

/**
 * Receita simulada (AI_MODE=mock): válida e determinística, a partir dos alimentos escolhidos.
 * Serve o desenvolvimento local, os testes e o e2e sem gastar no modelo real.
 */
export function mockRecipe(
  request: Pick<RecipeRequest, "servings" | "maxMinutes" | "variant">,
  chosen: readonly Food[],
  pantry: readonly Food[],
): RecipeOutput {
  const names = chosen.map((f) => f.name.pt.toLowerCase());
  const extras = pantry.slice(0, 2);
  const title = `Prato rápido de ${names.slice(0, 2).join(" e ")}`.slice(0, 60);
  return {
    title,
    summary: `Uma receita simples com ${names.join(", ")}.`.slice(0, 140),
    prepMinutes: Math.min(request.maxMinutes, 10 + 5 * (request.variant - 1)),
    ingredients: [
      ...chosen.map((f) => ({ foodId: f.id, grams: defaultPortion(f).grams * request.servings })),
      ...extras.map((f) => ({ foodId: f.id, grams: defaultPortion(f).grams })),
    ],
    steps: [
      `Prepara ${names.join(", ")}.`.slice(0, 240),
      "Junta tudo numa frigideira com um fio de azeite e tempera a gosto.",
      "Serve logo.",
    ],
  };
}
