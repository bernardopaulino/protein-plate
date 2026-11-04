import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import type { AppEnv } from "@/lib/env";

/**
 * Prazo total de uma receita nova, com as duas tentativas (secção 6). O critério do MVP é resposta
 * em menos de 15 s; o resto fica para a cache, a D1 e a rede.
 */
export const AI_DEADLINE_MS = 14_000;

/** A segunda tentativa só arranca se ainda faltar pelo menos isto do prazo. */
export const AI_MIN_RETRY_MS = 5_000;

/**
 * Quanto o modelo pensa antes de responder. O Haiku 5.5 pensa por defeito (effort `medium`); uma
 * receita em JSON com regras explícitas não ganha com isso. Medido com `eval:recipes` (20 casos,
 * 4/11/2026): por defeito p50 8,0 s / p95 12,5 s; effort low p50 6,0 s / p95 8,6 s (~1150 tokens
 * de saída); sem thinking p50 3,1 s / p95 5,6–6,7 s (~410 tokens), com 20/20 válidas e a proteína
 * igualmente perto da meta. O thinking desligado só é aceite com effort `high` ou abaixo.
 */
export const AI_EFFORT = "low";
export const AI_THINKING = { type: "disabled" } as const;

/** Modelo simulado (AI_MODE=mock): responde com o texto que `respond` devolver para o prompt. */
export function mockModel(respond: (prompt: string) => string, modelId = "mock"): LanguageModel {
  return new MockLanguageModelV3({
    modelId,
    doGenerate: async (options) => {
      const prompt = JSON.stringify(options.prompt);
      const text = respond(prompt);
      return {
        content: [{ type: "text", text }],
        finishReason: { unified: "stop", raw: "stop" },
        usage: {
          inputTokens: {
            total: Math.ceil(prompt.length / 4),
            noCache: undefined,
            cacheRead: undefined,
            cacheWrite: undefined,
          },
          outputTokens: {
            total: Math.ceil(text.length / 4),
            text: undefined,
            reasoning: undefined,
          },
        },
        warnings: [],
      };
    },
  });
}

/** O modelo real (AI_MODE=live) ou um simulado (local, testes e staging sem chave). */
export function languageModel(env: AppEnv, mock: () => LanguageModel): LanguageModel {
  if (env.AI_MODE === "mock") return mock();
  const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return anthropic(env.AI_MODEL);
}
