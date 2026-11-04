import { Output, generateText, type LanguageModel } from "ai";
import type { FoodIndex } from "@/domain/food";
import { AI_DEADLINE_MS, AI_EFFORT, AI_MIN_RETRY_MS, AI_THINKING } from "../ai/model";
import { buildRecipePrompt, type RecipePromptInput } from "../ai/prompts/recipe.v2";
import {
  mergeDuplicateIngredients,
  recipeOutputSchema,
  recipeProblem,
  type RecipeOutput,
} from "./recipe-rules";

export interface RecipeModelResult {
  /** A receita validada, ou null se nenhuma tentativa passou. */
  output: RecipeOutput | null;
  /** O problema da última tentativa (null quando há receita). */
  problem: string | null;
  /** Os problemas de todas as tentativas, por ordem (para as avaliações). */
  problems: string[];
  attempts: number;
  /** A segunda tentativa não arrancou por já faltar pouco para o fim do prazo. */
  retrySkipped: boolean;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

/**
 * A chamada ao modelo, partilhada pelo servidor e pelo `eval:recipes` (as avaliações medem
 * exatamente o que corre em produção). Secção 6:
 * - schema fixo (a gramática fica em cache do lado da API), effort baixo e sem thinking;
 * - os repetidos juntam-se na app; o resto dos problemas leva a 1 nova tentativa com o erro descrito;
 * - prazo total de `AI_DEADLINE_MS` para as duas tentativas: a segunda só arranca se ainda houver
 *   pelo menos `AI_MIN_RETRY_MS`, e cada uma tem como timeout o tempo que falta.
 */
export async function callRecipeModel(params: {
  model: LanguageModel;
  prompt: Omit<RecipePromptInput, "previousError">;
  foods: FoodIndex;
  now?: () => number;
  log?: (event: Record<string, unknown>) => void;
}): Promise<RecipeModelResult> {
  const now = params.now ?? Date.now;
  const log = params.log ?? (() => {});
  const { request, chosen, pantry } = params.prompt;
  const check = {
    allowedIds: new Set([...chosen, ...pantry].map((f) => f.id)),
    maxMinutes: request.maxMinutes,
    proteinIds: chosen.filter((f) => f.role === "protein").map((f) => f.id),
    servings: request.servings,
    foods: params.foods,
  };

  const started = now();
  let output: RecipeOutput | null = null;
  let problem: string | null = null;
  const problems: string[] = [];
  let attempts = 0;
  let retrySkipped = false;
  let inputTokens = 0;
  let outputTokens = 0;
  for (let attempt = 1; attempt <= 2 && !output; attempt++) {
    const remaining = AI_DEADLINE_MS - (now() - started);
    if (attempt > 1 && remaining < AI_MIN_RETRY_MS) {
      log({ msg: "recipe_retry_skipped", remainingMs: remaining });
      retrySkipped = true;
      break;
    }
    attempts = attempt;
    const { system, prompt } = buildRecipePrompt({
      ...params.prompt,
      previousError: problem ?? undefined,
    });
    try {
      const result = await generateText({
        model: params.model,
        system,
        prompt,
        output: Output.object({ schema: recipeOutputSchema }),
        providerOptions: { anthropic: { effort: AI_EFFORT, thinking: AI_THINKING } },
        maxRetries: 0,
        timeout: remaining,
      });
      inputTokens += result.usage.inputTokens ?? 0;
      outputTokens += result.usage.outputTokens ?? 0;
      const candidate = mergeDuplicateIngredients(result.output);
      problem = recipeProblem(candidate, check);
      if (!problem) output = candidate;
    } catch (err) {
      problem = "a resposta não seguiu o formato pedido";
      log({
        msg: "recipe_attempt_error",
        attempt,
        name: err instanceof Error ? err.name : "unknown",
      });
    }
    if (problem) problems.push(problem);
    log({ msg: "recipe_attempt", attempt, valid: output !== null, problem });
  }
  return {
    output,
    problem: output ? null : problem,
    problems,
    attempts,
    retrySkipped,
    inputTokens,
    outputTokens,
    latencyMs: now() - started,
  };
}
