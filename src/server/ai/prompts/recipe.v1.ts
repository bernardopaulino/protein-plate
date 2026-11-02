import { defaultPortion, type Food } from "@/domain/food";
import type { Meal } from "@/domain/meals";
import type { RecipeRequest } from "@/domain/contracts/recipe";

/** Incrementa a cada mudança do prompt (entra na cache e nas avaliações). */
export const PROMPT_VERSION = 1;

const MEAL_NAMES: Record<Meal, string> = {
  "pequeno-almoco": "pequeno-almoço",
  "meio-da-manha": "meio da manhã",
  almoco: "almoço",
  lanche: "lanche",
  jantar: "jantar",
  ceia: "ceia",
};

const BASIS: Record<Food["weightBasis"], string> = {
  raw: "peso em cru",
  cooked: "peso cozinhado",
  as_sold: "peso como se compra",
};

export interface RecipePromptInput {
  request: Pick<
    RecipeRequest,
    "meal" | "postWorkout" | "mealTargetG" | "maxMinutes" | "servings" | "variant"
  >;
  chosen: readonly Food[];
  pantry: readonly Food[];
  /** Erro da tentativa anterior (só na segunda tentativa). */
  previousError?: string;
}

/**
 * Prompt versionado (secção 6). A IA só recebe ids e nomes de alimentos; nunca dados da pessoa.
 * Quantidades para a receita completa; a app calcula a proteína a partir da TCA.
 */
export function buildRecipePrompt(input: RecipePromptInput): { system: string; prompt: string } {
  const { request, chosen, pantry } = input;
  const line = (f: Food) =>
    `- id "${f.id}": ${f.name.pt} (${BASIS[f.weightBasis]}; porção habitual ${defaultPortion(f).grams} g)`;
  const proteins = chosen.filter((f) => f.role === "protein").map((f) => `"${f.id}"`);

  const system = [
    "És um cozinheiro português que escreve receitas caseiras, simples e com comida de verdade.",
    "Escreves em português de Portugal, a tratar o leitor por tu, com frases curtas.",
    "Não fazes alegações de saúde, não falas de dietas, calorias nem emagrecimento.",
    "Usas só os ingredientes da lista, identificados pelo id. Não inventas ingredientes.",
  ].join("\n");

  const prompt = [
    `Cria uma receita para ${MEAL_NAMES[request.meal]}${request.postWorkout ? " (refeição pós-treino: rápida, fácil e prática)" : ""}.`,
    `Doses: ${request.servings}. Tempo máximo de preparação: ${request.maxMinutes} minutos.`,
    "",
    "Alimentos escolhidos (usa todos os que são fonte de proteína):",
    ...chosen.map(line),
    "",
    "Despensa (opcional, em pequenas quantidades):",
    ...pantry.map(line),
    "",
    "Regras:",
    `- Usa obrigatoriamente estas fontes de proteína: ${proteins.join(", ") || "nenhuma"}.`,
    "- As gramas de cada ingrediente são para a receita completa (todas as doses), na base de peso indicada.",
    `- Aponta para cerca de ${Math.round(request.mealTargetG)} g de proteína por dose; quantidades realistas (no máximo 3 porções habituais por dose).`,
    "- Título até 60 caracteres, resumo até 140, 2 a 8 passos curtos (até 240 caracteres cada).",
    `- prepMinutes é um número inteiro até ${request.maxMinutes}.`,
    request.variant > 1
      ? `- Esta é a variante ${request.variant}: faz uma receita diferente das óbvias (outra técnica ou outro estilo).`
      : "",
    input.previousError
      ? `\nA tentativa anterior foi recusada por isto: ${input.previousError}. Corrige.`
      : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { system, prompt };
}
