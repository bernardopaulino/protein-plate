import { RECIPE_ERROR_CODES, type RecipeErrorCode } from "./recipe-options";

/**
 * Contadores diários do funcionamento (tabela `ops_counters`), lidos pelo backoffice. Os nomes são
 * um contrato fixo: só estes, nunca o utilizador, o email, o IP, os alimentos ou o corpo de um
 * pedido. Mudar ou retirar um nome parte os gráficos do backoffice.
 */
export const OPS_METRICS = [
  // Receita nova gerada pelo modelo
  "recipes.ok.new",
  // Receita servida da cache (o mesmo pedido já tinha sido gerado)
  "recipes.ok.cached",
  // Pedido de receita recusado ou falhado: um nome por código de erro do contrato da API
  ...RECIPE_ERROR_CODES.map((code) => `recipes.error.${code}` as const),
  // Houve uma segunda tentativa ao modelo (a primeira resposta não passou na validação)
  "recipes.retry",
  // A segunda tentativa não arrancou: o prazo total de 14 s estava perto do fim
  "recipes.retry_skipped",
  // Receita nova cujo tempo total de modelo passou de RECIPE_SLOW_MS
  "recipes.slow",
  // Exceção não tratada em POST /api/recipes
  "recipes.5xx",
  // Respostas de /api/auth: pedido inválido, sem sessão, proibido, fora da allowlist,
  // corpo grande demais, rate limiting do Better Auth, e os erros do servidor juntos
  "auth.400",
  "auth.401",
  "auth.403",
  "auth.404",
  "auth.413",
  "auth.429",
  "auth.5xx",
  // Server Action que falhou sem estar previsto (exceção)
  "actions.error",
  // Server Action que devolveu uma recusa (sessão, validação, dono, perfil em falta)
  "actions.rejected",
] as const;

export type OpsMetric = (typeof OPS_METRICS)[number];

/** Quanto somar a cada contador (os que não aparecem ficam como estão). */
export type OpsCounts = Partial<Record<OpsMetric, number>>;

/** Acima disto (tempo total de modelo, as duas tentativas), uma receita nova conta como lenta. */
export const RECIPE_SLOW_MS = 10_000;

/** O dia do contador, em UTC (de propósito: são do servidor, não da hora local de ninguém). */
export function opsDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Um contador a 1 (para quem conta um acontecimento de cada vez). */
export function once(metric: OpsMetric): OpsCounts {
  const counts: OpsCounts = {};
  counts[metric] = 1;
  return counts;
}

/** O contador do resultado de um pedido de receita. */
export function recipeOutcomeMetric(
  result: { ok: true; cached: boolean } | { ok: false; code: RecipeErrorCode },
): OpsMetric {
  if (result.ok) return result.cached ? "recipes.ok.cached" : "recipes.ok.new";
  return `recipes.error.${result.code}`;
}

const AUTH_STATUS_METRICS: ReadonlyMap<number, OpsMetric> = new Map<number, OpsMetric>([
  [400, "auth.400"],
  [401, "auth.401"],
  [403, "auth.403"],
  [404, "auth.404"],
  [413, "auth.413"],
  [429, "auth.429"],
]);

/** O contador de uma resposta de /api/auth (null: não conta, ex.: 200 ou o redirect do OAuth). */
export function authStatusMetric(status: number): OpsMetric | null {
  if (status >= 500) return "auth.5xx";
  return AUTH_STATUS_METRICS.get(status) ?? null;
}
