import { defaultPortion, type Food } from "@/domain/food";
import type { Meal } from "@/domain/meals";
import type { Diet, Equipment } from "@/domain/preferences";
import type { RecipeRequest } from "@/domain/contracts/recipe";

/**
 * Incrementa a cada mudança do prompt (entra na cache e nas avaliações). A 2 junta o pré-treino, o
 * equipamento e a dieta da pessoa; a 3, a proteína à escolha, o equipamento escolhido para a receita
 * (ou "sem cozinhar") e passos sem quantidades (a app pode ajustar as gramas depois); a 4, sem
 * fogão, nada de tachos nem água a ferver (o que se coze entra já cozido); a 5, o prompt inteiro em
 * inglês para as receitas em inglês (o português fica igual).
 */
export const PROMPT_VERSION = 5;

type Lang = "pt" | "en";

/** Os textos do prompt em cada idioma: a receita sai no idioma da pessoa. */
const COPY = {
  pt: {
    meals: {
      "pequeno-almoco": "pequeno-almoço",
      "meio-da-manha": "meio da manhã",
      almoco: "almoço",
      lanche: "lanche",
      jantar: "jantar",
      ceia: "ceia",
    } satisfies Record<Meal, string>,
    basis: {
      raw: "peso em cru",
      cooked: "peso cozinhado",
      as_sold: "peso como se compra",
    } satisfies Record<Food["weightBasis"], string>,
    equipment: {
      stove: "fogão",
      oven: "forno",
      microwave: "micro-ondas",
      airfryer: "airfryer",
      blender: "liquidificadora",
    } satisfies Record<Equipment, string>,
    diet: {
      omnivore: null,
      pescatarian: "A pessoa não come carne.",
      vegetarian: "A pessoa é vegetariana (sem carne nem peixe).",
      vegan: "A pessoa é vegana (nada de origem animal).",
    } satisfies Record<Diet, string | null>,
    line: (f: Food, basis: string) =>
      `- id "${f.id}": ${f.name.pt} (${basis}; porção habitual ${defaultPortion(f).grams} g; ${f.proteinPer100g} g de proteína por 100 g)`,
    postWorkout: " (refeição pós-treino: rápida, fácil e prática)",
    preWorkout: " (refeição pré-treino: leve, fácil de digerir, com hidratos e pouca gordura)",
    noCooking:
      "Sem cozinhar: nada de fogão, forno, micro-ondas, airfryer nem liquidificadora. A receita só se monta (cortar, misturar, servir).",
    chosenEquipment: (list: string) =>
      `A pessoa quer cozinhar com: ${list}. Usa este equipamento e nenhum outro.`,
    availableEquipment: (list: string) => `Equipamento disponível: ${list}. Não uses outro.`,
    noStove:
      "Não há fogão: nada de tachos, panelas nem água a ferver; cada passo usa só o equipamento indicado. Se um alimento precisar de ser cozido em água, usa-o já cozido (de véspera ou comprado assim) e diz isso no passo.",
    system: [
      "És um cozinheiro português que escreve receitas caseiras, simples e com comida de verdade.",
      "Escreves em português de Portugal, a tratar o leitor por tu, com frases curtas.",
      "Não fazes alegações de saúde, não falas de dietas, calorias nem emagrecimento.",
      "Usas só os ingredientes da lista, identificados pelo id. Não inventas ingredientes.",
    ],
    task: (meal: string, moment: string) => `Cria uma receita para ${meal}${moment}.`,
    servings: (servings: number, minutes: number) =>
      `Doses: ${servings}. Tempo máximo de preparação: ${minutes} minutos.`,
    chosenTitle: "Alimentos escolhidos (usa todos os que são fonte de proteína):",
    pantryTitle: "Despensa (opcional, em pequenas quantidades):",
    rules: "Regras:",
    mustUse: (ids: string) => `- Usa obrigatoriamente estas fontes de proteína: ${ids}.`,
    none: "nenhuma",
    grams:
      "- As gramas de cada ingrediente são para a receita completa (todas as doses), na base de peso indicada.",
    customTarget: (g: number) =>
      `- A pessoa quer ${g} g de proteína por dose: escolhe as quantidades das fontes de proteína para lá chegar; quantidades realistas (no máximo 3 porções habituais por dose).`,
    target: (g: number) =>
      `- Aponta para cerca de ${g} g de proteína por dose; quantidades realistas (no máximo 3 porções habituais por dose).`,
    noQuantities: "- Nos passos não escrevas gramas nem quantidades (estão nos ingredientes).",
    limits:
      "- Título até 60 caracteres, resumo até 140, 2 a 8 passos curtos (até 240 caracteres cada).",
    prepMinutes: (minutes: number) => `- prepMinutes é um número inteiro até ${minutes}.`,
    variant: (n: number) =>
      `- Esta é a variante ${n}: faz uma receita diferente das óbvias (outra técnica ou outro estilo).`,
    retry: (error: string) => `\nA tentativa anterior foi recusada por isto: ${error}. Corrige.`,
  },
  en: {
    meals: {
      "pequeno-almoco": "breakfast",
      "meio-da-manha": "a mid-morning snack",
      almoco: "lunch",
      lanche: "an afternoon snack",
      jantar: "dinner",
      ceia: "an evening snack",
    } satisfies Record<Meal, string>,
    basis: {
      raw: "raw weight",
      cooked: "cooked weight",
      as_sold: "weight as sold",
    } satisfies Record<Food["weightBasis"], string>,
    equipment: {
      stove: "stove",
      oven: "oven",
      microwave: "microwave",
      airfryer: "air fryer",
      blender: "blender",
    } satisfies Record<Equipment, string>,
    diet: {
      omnivore: null,
      pescatarian: "The person doesn't eat meat.",
      vegetarian: "The person is vegetarian (no meat or fish).",
      vegan: "The person is vegan (nothing of animal origin).",
    } satisfies Record<Diet, string | null>,
    line: (f: Food, basis: string) =>
      `- id "${f.id}": ${f.name.en} (${basis}; usual portion ${defaultPortion(f).grams} g; ${f.proteinPer100g} g of protein per 100 g)`,
    postWorkout: " (post-workout meal: quick, easy and practical)",
    preWorkout: " (pre-workout meal: light, easy to digest, with carbs and little fat)",
    noCooking:
      "No cooking: no stove, oven, microwave, air fryer or blender. The recipe is only assembled (cut, mix, serve).",
    chosenEquipment: (list: string) =>
      `The person wants to cook with: ${list}. Use this equipment and nothing else.`,
    availableEquipment: (list: string) => `Available equipment: ${list}. Don't use anything else.`,
    noStove:
      "There is no stove: no pots, pans or boiling water; every step uses only the listed equipment. If an ingredient needs boiling, use it already cooked (leftovers or bought that way) and say so in the step.",
    system: [
      "You are a home cook who writes simple, everyday recipes with real food.",
      "You write in English, addressing the reader as you, in short sentences.",
      "You make no health claims and never talk about diets, calories or weight loss.",
      "You only use ingredients from the list, identified by id. You never invent ingredients.",
    ],
    task: (meal: string, moment: string) => `Create a recipe for ${meal}${moment}.`,
    servings: (servings: number, minutes: number) =>
      `Servings: ${servings}. Maximum preparation time: ${minutes} minutes.`,
    chosenTitle: "Chosen foods (use every one that is a protein source):",
    pantryTitle: "Pantry (optional, in small amounts):",
    rules: "Rules:",
    mustUse: (ids: string) => `- You must use these protein sources: ${ids}.`,
    none: "none",
    grams:
      "- The grams of each ingredient are for the whole recipe (all servings), on the weight basis shown.",
    customTarget: (g: number) =>
      `- The person wants ${g} g of protein per serving: choose the amounts of the protein sources to get there; realistic amounts (at most 3 usual portions per serving).`,
    target: (g: number) =>
      `- Aim for about ${g} g of protein per serving; realistic amounts (at most 3 usual portions per serving).`,
    noQuantities: "- Don't write grams or amounts in the steps (they are in the ingredients).",
    limits:
      "- Title up to 60 characters, summary up to 140, 2 to 8 short steps (up to 240 characters each).",
    prepMinutes: (minutes: number) => `- prepMinutes is a whole number up to ${minutes}.`,
    variant: (n: number) =>
      `- This is variant ${n}: make a recipe that differs from the obvious ones (another technique or style).`,
    retry: (error: string) =>
      `\nThe previous attempt was rejected for this reason (in Portuguese): ${error}. Fix it.`,
  },
} as const;

export interface RecipePromptInput {
  request: Pick<RecipeRequest, "meal" | "maxMinutes" | "servings" | "variant"> & {
    /** O idioma da receita (por defeito, português). */
    locale?: Lang;
  };
  /** Do perfil da pessoa (nunca do pedido). */
  context: {
    /** Proteína por dose a apontar: a meta da refeição ou a que a pessoa escolheu. */
    mealTargetG: number;
    /** A pessoa escolheu a proteína (em vez da meta da refeição). */
    customTarget?: boolean;
    /** A pessoa escolheu o equipamento desta receita (em vez do do perfil). */
    equipmentChosen?: boolean;
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
 * Prompt versionado (secção 6), no idioma da receita. A IA só recebe ids e nomes de alimentos, a
 * refeição, o equipamento e a dieta: nunca o nome, o peso nem as alergias da pessoa (os alimentos
 * com alergénios já não chegam à lista). Quantidades para a receita completa; a app calcula a
 * proteína a partir da TCA.
 */
export function buildRecipePrompt(input: RecipePromptInput): { system: string; prompt: string } {
  const { request, context, chosen, pantry } = input;
  const c = COPY[request.locale ?? "pt"];
  const line = (f: Food) => c.line(f, c.basis[f.weightBasis]);
  const proteins = chosen.filter((f) => f.role === "protein").map((f) => `"${f.id}"`);
  const moment = context.postWorkout ? c.postWorkout : context.preWorkout ? c.preWorkout : "";
  const equipment = context.equipment.map((e) => c.equipment[e]).join(", ");
  const equipmentLine =
    context.equipment.length === 0
      ? c.noCooking
      : context.equipmentChosen
        ? c.chosenEquipment(equipment)
        : c.availableEquipment(equipment);
  const noStove =
    context.equipment.length > 0 && !context.equipment.includes("stove") ? c.noStove : "";
  const target = Math.round(context.mealTargetG);

  const prompt = [
    c.task(c.meals[request.meal], moment),
    c.servings(request.servings, request.maxMinutes),
    equipmentLine,
    noStove,
    c.diet[context.diet] ?? "",
    "",
    c.chosenTitle,
    ...chosen.map(line),
    "",
    c.pantryTitle,
    ...pantry.map(line),
    "",
    c.rules,
    c.mustUse(proteins.join(", ") || c.none),
    c.grams,
    context.customTarget ? c.customTarget(target) : c.target(target),
    c.noQuantities,
    c.limits,
    c.prepMinutes(request.maxMinutes),
    request.variant > 1 ? c.variant(request.variant) : "",
    input.previousError ? c.retry(input.previousError) : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { system: c.system.join("\n"), prompt };
}
