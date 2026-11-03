import { defaultPortion, type Food } from "@/domain/food";
import type { Meal } from "@/domain/meals";
import type { Diet, Equipment } from "@/domain/preferences";
import type { RecipeRequest } from "@/domain/contracts/recipe";

/**
 * Incrementa a cada mudança do prompt (entra na cache e nas avaliações). A 2 junta o pré-treino, o
 * equipamento e a dieta da pessoa.
 */
export const PROMPT_VERSION = 2;

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

const EQUIPMENT_NAMES: Record<Equipment, string> = {
  stove: "fogão",
  oven: "forno",
  microwave: "micro-ondas",
  airfryer: "airfryer",
  blender: "liquidificadora",
};

const DIET_NOTES: Record<Diet, string | null> = {
  omnivore: null,
  pescatarian: "A pessoa não come carne.",
  vegetarian: "A pessoa é vegetariana (sem carne nem peixe).",
  vegan: "A pessoa é vegana (nada de origem animal).",
};

export interface RecipePromptInput {
  request: Pick<RecipeRequest, "meal" | "maxMinutes" | "servings" | "variant">;
  /** Do perfil da pessoa (nunca do pedido). */
  context: {
    mealTargetG: number;
    postWorkout: boolean;
    preWorkout: boolean;
    equipment: readonly Equipment[];
    diet: Diet;
  };
  chosen: readonly Food[];
  /** A despensa já sem o que as restrições excluem. */
  pantry: readonly Food[];
  /** Erro da tentativa anterior (só na segunda tentativa). */
  previousError?: string;
}

/**
 * Prompt versionado (secção 6). A IA só recebe ids e nomes de alimentos, a refeição, o equipamento
 * e a dieta: nunca o nome, o peso nem as alergias da pessoa (os alimentos com alergénios já não
 * chegam à lista). Quantidades para a receita completa; a app calcula a proteína a partir da TCA.
 */
export function buildRecipePrompt(input: RecipePromptInput): { system: string; prompt: string } {
  const { request, context, chosen, pantry } = input;
  const line = (f: Food) =>
    `- id "${f.id}": ${f.name.pt} (${BASIS[f.weightBasis]}; porção habitual ${defaultPortion(f).grams} g)`;
  const proteins = chosen.filter((f) => f.role === "protein").map((f) => `"${f.id}"`);
  const moment = context.postWorkout
    ? " (refeição pós-treino: rápida, fácil e prática)"
    : context.preWorkout
      ? " (refeição pré-treino: leve, fácil de digerir, com hidratos e pouca gordura)"
      : "";
  const equipment = context.equipment.map((e) => EQUIPMENT_NAMES[e]).join(", ");

  const system = [
    "És um cozinheiro português que escreve receitas caseiras, simples e com comida de verdade.",
    "Escreves em português de Portugal, a tratar o leitor por tu, com frases curtas.",
    "Não fazes alegações de saúde, não falas de dietas, calorias nem emagrecimento.",
    "Usas só os ingredientes da lista, identificados pelo id. Não inventas ingredientes.",
  ].join("\n");

  const prompt = [
    `Cria uma receita para ${MEAL_NAMES[request.meal]}${moment}.`,
    `Doses: ${request.servings}. Tempo máximo de preparação: ${request.maxMinutes} minutos.`,
    `Equipamento disponível: ${equipment}. Não uses outro.`,
    DIET_NOTES[context.diet] ?? "",
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
    `- Aponta para cerca de ${Math.round(context.mealTargetG)} g de proteína por dose; quantidades realistas (no máximo 3 porções habituais por dose).`,
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
