/**
 * Avaliação das receitas contra o modelo real (secção 6). Corre antes de mudar o prompt ou o
 * modelo; cada mudança incrementa PROMPT_VERSION.
 *
 *   npm run eval:recipes   (lê ANTHROPIC_API_KEY do ambiente ou de .dev.vars)
 *
 * Mede: respostas válidas (schema + regras da app, sem e com a segunda tentativa), ingredientes
 * fora da lista, proteína por dose plausível e perto da meta, e latência.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createAnthropic } from "@ai-sdk/anthropic";
import { FOODS } from "../src/content/foods.generated";
import type { MaxMinutes } from "../src/domain/contracts/recipe";
import { indexFoods } from "../src/domain/food";
import type { Meal } from "../src/domain/meals";
import type { Equipment } from "../src/domain/preferences";
import { AI_EFFORT, AI_THINKING } from "../src/server/ai/model";
import { PROMPT_VERSION } from "../src/server/ai/prompts/recipe.v3";
import { callRecipeModel } from "../src/server/recipes/model-call";
import { proteinPerServing, type RecipeOutput } from "../src/server/recipes/recipe-rules";

interface Case {
  foods: string[];
  meal: Meal;
  postWorkout?: boolean;
  target: number;
  minutes: MaxMinutes;
  servings: number;
  /** A proteína por dose foi escolhida pela pessoa (tem de ficar a menos de 20%). */
  customTarget?: boolean;
  /** Equipamento escolhido para a receita ([] = sem cozinhar); senão, fogão e micro-ondas. */
  equipment?: Equipment[];
}

/**
 * 24 combinações fixas: refeições, tempos, doses e pós-treino variados; as 4 últimas com a proteína
 * escolhida pela pessoa e com equipamento escolhido (ou sem cozinhar).
 */
const CASES: Case[] = [
  {
    foods: ["atum-lata-natural", "grao-bico-lata", "tomate"],
    meal: "almoco",
    target: 46,
    minutes: 10,
    servings: 1,
  },
  {
    foods: ["peito-frango", "arroz-branco", "brocolos"],
    meal: "jantar",
    target: 46,
    minutes: 30,
    servings: 2,
  },
  {
    foods: ["skyr-natural", "aveia-flocos", "banana"],
    meal: "pequeno-almoco",
    target: 30,
    minutes: 10,
    servings: 1,
  },
  {
    foods: ["ovo", "espinafres", "pao-integral"],
    meal: "pequeno-almoco",
    target: 25,
    minutes: 10,
    servings: 1,
  },
  { foods: ["salmao", "batata-doce"], meal: "jantar", target: 40, minutes: 30, servings: 2 },
  {
    foods: ["camarao", "massa-trigo", "tomate"],
    meal: "almoco",
    target: 40,
    minutes: 20,
    servings: 2,
  },
  {
    foods: ["tofu-firme", "arroz-branco", "brocolos"],
    meal: "jantar",
    target: 35,
    minutes: 30,
    servings: 2,
  },
  {
    foods: ["carne-picada-vaca", "massa-trigo", "tomate"],
    meal: "jantar",
    target: 50,
    minutes: 30,
    servings: 4,
  },
  {
    foods: ["iogurte-grego-natural", "amendoa", "banana"],
    meal: "lanche",
    postWorkout: true,
    target: 40,
    minutes: 10,
    servings: 1,
  },
  {
    foods: ["queijo-cottage", "pao-integral", "tomate"],
    meal: "lanche",
    target: 20,
    minutes: 10,
    servings: 1,
  },
  {
    foods: ["bacalhau-demolhado", "grao-bico-lata", "ovo"],
    meal: "almoco",
    target: 50,
    minutes: 45,
    servings: 2,
  },
  {
    foods: ["pescada", "batata", "brocolos"],
    meal: "jantar",
    target: 40,
    minutes: 30,
    servings: 2,
  },
  {
    foods: ["peito-peru", "feijao-lata", "arroz-branco"],
    meal: "almoco",
    target: 46,
    minutes: 20,
    servings: 1,
  },
  {
    foods: ["sardinhas-lata", "pao-integral", "tomate"],
    meal: "lanche",
    target: 25,
    minutes: 10,
    servings: 1,
  },
  {
    foods: ["claras-ovo", "aveia-flocos", "banana"],
    meal: "pequeno-almoco",
    target: 30,
    minutes: 20,
    servings: 2,
  },
  {
    foods: ["edamame", "arroz-branco", "ovo"],
    meal: "almoco",
    target: 35,
    minutes: 20,
    servings: 2,
  },
  {
    foods: ["salmao-fumado", "queijo-fresco", "pao-integral"],
    meal: "pequeno-almoco",
    target: 30,
    minutes: 10,
    servings: 1,
  },
  { foods: ["requeijao", "skyr-natural"], meal: "ceia", target: 25, minutes: 10, servings: 1 },
  {
    foods: ["peito-frango", "grao-bico-lata", "espinafres", "batata"],
    meal: "jantar",
    postWorkout: true,
    target: 55,
    minutes: 20,
    servings: 3,
  },
  {
    foods: ["atum-lata-natural", "ovo", "batata", "feijao-lata", "tomate", "espinafres"],
    meal: "almoco",
    target: 60,
    minutes: 30,
    servings: 4,
  },
  {
    foods: ["peito-frango", "arroz-branco", "brocolos"],
    meal: "jantar",
    target: 70,
    customTarget: true,
    minutes: 30,
    servings: 1,
  },
  {
    foods: ["skyr-natural", "morangos"],
    meal: "lanche",
    target: 20,
    customTarget: true,
    minutes: 10,
    servings: 1,
  },
  {
    foods: ["atum-lata-natural", "grao-bico-lata", "tomate"],
    meal: "almoco",
    target: 46,
    minutes: 10,
    servings: 1,
    equipment: [],
  },
  {
    foods: ["salmao", "batata-doce"],
    meal: "jantar",
    target: 50,
    customTarget: true,
    minutes: 30,
    servings: 2,
    equipment: ["airfryer"],
  },
];

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("Falta ANTHROPIC_API_KEY (as avaliações correm contra o modelo real).");
  process.exit(1);
}
const modelId = process.env.AI_MODEL ?? "claude-haiku-5-5";
const model = createAnthropic({ apiKey })(modelId);
const index = indexFoods(FOODS);
const pantry = FOODS.filter((f) => f.role === "pantry");

interface Row {
  case: number;
  valid: boolean;
  attempts: number;
  outOfList: number;
  protein: number | null;
  targetRatio: number | null;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  problem: string | null;
  /** O texto, para rever à mão (o eval só mede regras e números) */
  recipe: RecipeOutput | null;
}

const rows: Row[] = [];
for (const [i, c] of CASES.entries()) {
  const chosen = c.foods.map((id) => index.get(id)!);
  const request = {
    meal: c.meal,
    maxMinutes: c.minutes,
    servings: c.servings,
    variant: 1,
  };
  // Perfil típico: fogão e micro-ondas, come de tudo
  const context = {
    mealTargetG: c.target,
    postWorkout: c.postWorkout ?? false,
    preWorkout: false,
    equipment: c.equipment ?? (["stove", "microwave"] as Equipment[]),
    equipmentChosen: c.equipment !== undefined,
    customTarget: c.customTarget ?? false,
    diet: "omnivore" as const,
  };
  // A mesma chamada do servidor: schema fixo, effort, repetidos juntos, prazo e nova tentativa
  const result = await callRecipeModel({
    model,
    prompt: { request, context, chosen, pantry },
    foods: index,
  });
  const { attempts, latencyMs, problem } = result;
  const outOfList = result.problems.filter((p) => p.includes("não estão na lista")).length;
  const protein = result.output
    ? proteinPerServing(result.output.ingredients, c.servings, index)
    : null;
  rows.push({
    case: i + 1,
    valid: problem === null,
    attempts,
    outOfList,
    protein,
    targetRatio: protein !== null ? protein / c.target : null,
    latencyMs,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    problem,
    recipe: result.output,
  });
  console.log(
    `#${String(i + 1).padStart(2)} ${problem === null ? "ok " : "NOK"} tentativas=${attempts} proteína=${protein?.toFixed(1) ?? "-"} g (meta ${c.target}) ${latencyMs} ms${problem ? ` — ${problem}` : ""}`,
  );
}

const valid = rows.filter((r) => r.valid);
const firstTry = rows.filter((r) => r.valid && r.attempts === 1).length;
const latencies = rows.map((r) => r.latencyMs).sort((a, b) => a - b);
const p95 = latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] ?? 0;
const nearTarget = valid.filter(
  (r) => r.targetRatio !== null && r.targetRatio >= 0.7 && r.targetRatio <= 1.4,
).length;
const customHit = valid.filter(
  (r) => CASES[r.case - 1]!.customTarget && r.targetRatio !== null && Math.abs(r.targetRatio - 1) <= 0.2,
).length;
const summary = {
  model: modelId,
  effort: AI_EFFORT,
  thinking: AI_THINKING.type,
  promptVersion: PROMPT_VERSION,
  cases: rows.length,
  valid: valid.length,
  validFirstTry: firstTry,
  /** Tentativas com ingredientes fora da lista (ids inventados) */
  outOfListIngredients: rows.reduce((s, r) => s + r.outOfList, 0),
  proteinNearTarget: nearTarget,
  /** Com a proteína escolhida: dentro de 20% do pedido */
  customTargetHit: `${customHit}/${CASES.filter((c) => c.customTarget).length}`,
  latencyP50Ms: latencies[Math.floor(latencies.length / 2)] ?? 0,
  latencyP95Ms: p95,
  /** Tokens médios por receita (todas as tentativas) */
  avgInputTokens: Math.round(rows.reduce((s, r) => s + r.inputTokens, 0) / rows.length),
  avgOutputTokens: Math.round(rows.reduce((s, r) => s + r.outputTokens, 0) / rows.length),
};
console.log("\nResumo:", summary);

const dir = join(import.meta.dirname, "..", "eval-results");
mkdirSync(dir, { recursive: true });
const file = join(
  dir,
  `recipes-v${PROMPT_VERSION}-${modelId}-${new Date().toISOString().slice(0, 19).replace(/:/g, "")}.json`,
);
writeFileSync(file, JSON.stringify({ summary, rows }, null, 2));
console.log(`Resultados em ${file}`);
// Critérios mínimos: 90% válidas e p95 < 15 s
process.exit(valid.length >= Math.ceil(rows.length * 0.9) && p95 < 15_000 ? 0 : 1);
