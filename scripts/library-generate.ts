/**
 * Pré-gera a biblioteca de receitas pela Batch API (secção 6): metade do preço, sem pressa. Usa o
 * mesmo prompt, o mesmo schema e a mesma validação do servidor; as receitas que não passam ficam
 * de fora (não há segunda tentativa).
 *
 *   npm run library:generate            mostra o plano e o custo estimado (não gasta nada)
 *   npm run library:generate submit     envia o batch (lê ANTHROPIC_API_KEY de .dev.vars)
 *   npm run library:generate fetch      vê o estado; quando acabar, escreve .library/recipes.sql
 *   npm run library:load:<ambiente>     carrega o SQL na D1 (local, staging ou production)
 *
 * O SQL é idempotente (ids derivados do batch e do pedido, INSERT OR IGNORE): carregar duas vezes
 * não duplica receitas.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { FOODS, FOOD_DATA_VERSION } from "../src/content/foods.generated";
import type { MaxMinutes, RecipeRequest } from "../src/domain/contracts/recipe";
import { indexFoods, type Food } from "../src/domain/food";
import { MAIN_MEALS, MEALS, type Meal } from "../src/domain/meals";
import { DIETS, allowedFoods, type Diet, type Equipment } from "../src/domain/preferences";
import { recipeBase } from "../src/domain/recipe-base";
import { fitProtein } from "../src/domain/recipe-fit";
import { AI_EFFORT } from "../src/server/ai/model";
import {
  PROMPT_VERSION,
  buildRecipePrompt,
  type RecipePromptInput,
} from "../src/server/ai/prompts/recipe.v5";
import {
  mergeDuplicateIngredients,
  proteinPerServing,
  recipeOutputSchema,
  recipeProblem,
  type RecipeOutput,
} from "../src/server/recipes/recipe-rules";

const DIR = join(import.meta.dirname, "..", ".library");
const BATCH_FILE = join(DIR, "batch.json");
const SQL_FILE = join(DIR, "recipes.sql");
const MODEL = process.env.AI_MODEL ?? "claude-haiku-5-5";
const FOOD_INDEX = indexFoods(FOODS);

/** Os conjuntos de equipamento mais comuns (uma receita serve quem tiver pelo menos este). */
const EQUIPMENT_SETS: readonly (readonly Equipment[])[] = [
  [],
  ["microwave"],
  ["stove", "microwave"],
  ["stove", "oven", "microwave", "airfryer"],
];

/** Por refeição, tipo de dia e equipamento: 6 sem treino, 2 pré-treino e 2 pós-treino. */
const SLOTS: readonly { workout: "none" | "pre" | "post"; minutes: MaxMinutes }[] = [
  { workout: "none", minutes: 10 },
  { workout: "none", minutes: 20 },
  { workout: "none", minutes: 30 },
  { workout: "none", minutes: 45 },
  { workout: "none", minutes: 20 },
  { workout: "none", minutes: 10 },
  { workout: "pre", minutes: 10 },
  { workout: "pre", minutes: 20 },
  { workout: "post", minutes: 10 },
  { workout: "post", minutes: 20 },
];

/** Custo medido por receita nova (eval de 5/11/2026), a metade do preço no batch. */
const EST = { inputTokens: 2_170, outputTokens: 384, inputPerM: 0.1, outputPerM: 0.5 };

interface Case {
  customId: string;
  locale: "pt" | "en";
  meal: Meal;
  diet: Diet;
  equipment: readonly Equipment[];
  workout: "none" | "pre" | "post";
  maxMinutes: MaxMinutes;
  targetG: number;
  seed: number;
  foodIds: string[];
}

/** Todas as combinações, com a base escolhida pela app (como num pedido sem alimentos). */
function buildCases(): Case[] {
  const cases: Case[] = [];
  for (const locale of ["pt", "en"] as const) {
    for (const meal of MEALS) {
      for (const diet of DIETS) {
        const foods = allowedFoods(FOODS, { diet, allergies: [] }).filter(
          (f) => f.role !== "pantry",
        );
        for (const equipment of EQUIPMENT_SETS) {
          SLOTS.forEach((slot, slotIndex) => {
            const index = cases.length;
            const targetG = slot.workout === "pre" ? 25 : MAIN_MEALS.has(meal) ? 40 : 25;
            const seed = index * 7919 + slotIndex;
            const base = recipeBase({
              meal,
              chosen: [],
              foods,
              preferred: new Set(),
              preWorkout: slot.workout === "pre",
              seed,
              noCooking: equipment.length === 0,
              canBoil: equipment.includes("stove") || equipment.includes("microwave"),
              targetG,
            });
            if (!base.some((f) => f.role === "protein")) return;
            cases.push({
              customId: `c${index}`,
              locale,
              meal,
              diet,
              equipment,
              workout: slot.workout,
              maxMinutes: slot.minutes,
              targetG,
              seed,
              foodIds: base.map((f) => f.id),
            });
          });
        }
      }
    }
  }
  return cases;
}

/** O prompt de um caso, igual ao do servidor (`prepareRecipe`). */
function promptInput(c: Case): Omit<RecipePromptInput, "previousError"> {
  const chosen = c.foodIds.map((id) => FOOD_INDEX.get(id)!);
  const pantry = allowedFoods(FOODS, { diet: c.diet, allergies: [] }).filter(
    (f) => f.role === "pantry" && !c.foodIds.includes(f.id),
  );
  const request: RecipeRequest = {
    foodIds: c.foodIds,
    meal: c.meal,
    maxMinutes: c.maxMinutes,
    servings: 1,
    locale: c.locale,
    variant: 1,
  };
  return {
    request,
    context: {
      mealTargetG: c.targetG,
      customTarget: false,
      postWorkout: c.workout === "post",
      preWorkout: c.workout === "pre",
      equipment: c.equipment,
      equipmentChosen: false,
      diet: c.diet,
    },
    chosen,
    pantry,
  };
}

function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Falta ANTHROPIC_API_KEY (em .dev.vars ou no ambiente).");
    process.exit(1);
  }
  return new Anthropic();
}

async function submit(cases: Case[]) {
  if (existsSync(BATCH_FILE)) {
    console.error(`Já há um batch em ${BATCH_FILE}. Corre "fetch" ou apaga o ficheiro.`);
    process.exit(1);
  }
  const format = zodOutputFormat(recipeOutputSchema);
  const batch = await client().messages.batches.create({
    requests: cases.map((c) => {
      const { system, prompt } = buildRecipePrompt(promptInput(c));
      return {
        custom_id: c.customId,
        params: {
          model: MODEL,
          max_tokens: 2_048,
          system,
          messages: [{ role: "user" as const, content: prompt }],
          thinking: { type: "disabled" as const },
          output_config: {
            effort: AI_EFFORT,
            format: { type: "json_schema" as const, schema: format.schema },
          },
        },
      };
    }),
  });
  mkdirSync(DIR, { recursive: true });
  writeFileSync(
    BATCH_FILE,
    JSON.stringify({ id: batch.id, model: MODEL, promptVersion: PROMPT_VERSION, cases }, null, 2),
  );
  console.log(`Batch ${batch.id} enviado com ${cases.length} pedidos. Corre "fetch" mais tarde.`);
}

const ALPHABET = "0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

/** Id curto e estável para o mesmo batch e pedido (carregar duas vezes não duplica). */
function stableId(batchId: string, customId: string): string {
  const digest = createHash("sha256").update(`${batchId}:${customId}`).digest();
  return [...digest.subarray(0, 10)].map((b) => ALPHABET[b % ALPHABET.length]).join("");
}

const sqlText = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** Valida como o servidor: schema, repetidos juntos, proteína ajustada, regras da app. */
function validate(c: Case, text: string): RecipeOutput | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return "JSON inválido";
  }
  const schema = recipeOutputSchema.safeParse(parsed);
  if (!schema.success) return "fora do schema";
  const merged = mergeDuplicateIngredients(schema.data);
  const fitted = fitProtein(merged.ingredients, 1, c.targetG, FOOD_INDEX);
  const output = { ...merged, ingredients: fitted.ingredients };
  const input = promptInput(c);
  const problem = recipeProblem(output, {
    allowedIds: new Set([...input.chosen, ...input.pantry].map((f: Food) => f.id)),
    maxMinutes: c.maxMinutes,
    proteinIds: input.chosen.filter((f) => f.role === "protein").map((f) => f.id),
    servings: 1,
    foods: FOOD_INDEX,
  });
  return problem ?? output;
}

async function fetchResults() {
  if (!existsSync(BATCH_FILE)) {
    console.error(`Não há batch em ${BATCH_FILE}. Corre "submit" primeiro.`);
    process.exit(1);
  }
  const saved = JSON.parse(readFileSync(BATCH_FILE, "utf8")) as {
    id: string;
    model: string;
    promptVersion: number;
    cases: Case[];
  };
  const api = client();
  const batch = await api.messages.batches.retrieve(saved.id);
  const counts = batch.request_counts;
  if (batch.processing_status !== "ended") {
    console.log(
      `Batch ${saved.id}: ${batch.processing_status} (a processar ${counts.processing}, ` +
        `feitos ${counts.succeeded}, com erro ${counts.errored}). Volta a correr "fetch" mais tarde.`,
    );
    return;
  }

  const byId = new Map(saved.cases.map((c) => [c.customId, c]));
  const lines: string[] = [];
  const rejected = new Map<string, number>();
  const reject = (reason: string) => rejected.set(reason, (rejected.get(reason) ?? 0) + 1);
  let inputTokens = 0;
  let outputTokens = 0;
  let accepted = 0;
  const now = Date.now();
  for await (const result of await api.messages.batches.results(saved.id)) {
    const c = byId.get(result.custom_id);
    if (!c) continue;
    if (result.result.type !== "succeeded") {
      reject(`pedido ${result.result.type}`);
      continue;
    }
    const message = result.result.message;
    inputTokens += message.usage.input_tokens;
    outputTokens += message.usage.output_tokens;
    if (message.stop_reason !== "end_turn") {
      reject(`stop_reason ${message.stop_reason}`);
      continue;
    }
    const text = message.content.find((b) => b.type === "text")?.text ?? "";
    const output = validate(c, text);
    if (typeof output === "string") {
      reject(output.replace(/[\d.]+ ?g?/g, "N").slice(0, 60));
      continue;
    }
    accepted += 1;
    const id = stableId(saved.id, c.customId);
    const protein = proteinPerServing(output.ingredients, 1, FOOD_INDEX);
    lines.push(
      "INSERT OR IGNORE INTO recipes (id, cache_key, locale, title, summary, meal, post_workout, " +
        "pre_workout, source_recipe_id, servings, variant, prep_minutes, steps, " +
        "protein_per_serving_g, meal_target_g, custom_target, equipment, model, prompt_version, " +
        "food_data_version, input_tokens, output_tokens, created_at) VALUES (" +
        [
          sqlText(id),
          sqlText(`library:${saved.id}:${c.customId}`),
          sqlText(c.locale),
          sqlText(output.title.trim()),
          sqlText(output.summary.trim()),
          sqlText(c.meal),
          c.workout === "post" ? 1 : 0,
          c.workout === "pre" ? 1 : 0,
          "NULL",
          1,
          1,
          output.prepMinutes,
          sqlText(JSON.stringify(output.steps.map((s) => s.trim()))),
          protein,
          c.targetG,
          0,
          sqlText(JSON.stringify(c.equipment)),
          sqlText(saved.model),
          saved.promptVersion,
          FOOD_DATA_VERSION,
          message.usage.input_tokens,
          message.usage.output_tokens,
          now,
        ].join(", ") +
        ");",
    );
    output.ingredients.forEach((ingredient, position) => {
      lines.push(
        "INSERT OR IGNORE INTO recipe_ingredients (recipe_id, position, food_id, grams) VALUES (" +
          `${sqlText(id)}, ${position}, ${sqlText(ingredient.foodId)}, ${ingredient.grams});`,
      );
    });
  }
  writeFileSync(SQL_FILE, lines.join("\n") + "\n");
  const cost = ((inputTokens * EST.inputPerM + outputTokens * EST.outputPerM) / 1e6) * 0.5;
  console.log(
    `Aceites: ${accepted} de ${saved.cases.length}. Custo do batch: ~$${cost.toFixed(2)}.`,
  );
  for (const [reason, n] of [...rejected].sort((a, b) => b[1] - a[1])) {
    console.log(`  recusadas (${n}): ${reason}`);
  }
  console.log(`SQL em ${SQL_FILE}. Carrega com npm run library:load:<ambiente>.`);
}

const cases = buildCases();
const command = process.argv[2] ?? "plan";
if (command === "submit") {
  await submit(cases);
} else if (command === "fetch") {
  await fetchResults();
} else if (command === "sample") {
  // Um batch pequeno (2 por idioma) para confirmar o formato antes de gastar no grande
  const sample = [
    ...cases.filter((c) => c.locale === "pt").slice(0, 2),
    ...cases.filter((c) => c.locale === "en").slice(0, 2),
  ];
  await submit(sample);
} else {
  const cost =
    ((cases.length * (EST.inputTokens * EST.inputPerM + EST.outputTokens * EST.outputPerM)) / 1e6) *
    0.5;
  console.log(
    `${cases.length} receitas (${MODEL}, prompt v${PROMPT_VERSION}); custo estimado ~$${cost.toFixed(2)}.`,
  );
  console.log('Para enviar: npm run library:generate submit (ou "sample" para 4 de teste).');
}
