/**
 * Os preços dos modelos, em dólares por milhão de tokens (o único sítio onde estão). O custo do
 * Painel é uma estimativa: tokens guardados em cada receita nova vezes estes preços. Um modelo
 * sem preço aqui (o "mock" do local e dos testes, ou um modelo novo) não entra no custo, e o
 * Painel di-lo.
 */
export const AI_PRICES_USD_PER_MTOK: Readonly<Record<string, { input: number; output: number }>> = {
  // Claude Haiku 5.5 (AI_MODEL da app): $0,10 por 1M de entrada e $0,50 por 1M de saída
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
};

/** O custo estimado, ou null se o modelo não tem preço. */
export function estimatedCost(model: string, input: number, output: number): number | null {
  const price = Object.hasOwn(AI_PRICES_USD_PER_MTOK, model)
    ? AI_PRICES_USD_PER_MTOK[model]
    : undefined;
  if (!price) return null;
  return (input * price.input + output * price.output) / 1_000_000;
}
