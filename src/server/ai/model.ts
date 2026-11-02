import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import type { AppEnv } from "@/lib/env";

/** Timeout de cada chamada ao modelo (secção 6). */
export const AI_TIMEOUT_MS = 20_000;

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
