/**
 * Os períodos do Painel, escolhidos por links (?dias= e ?semanas=), como no backoffice do
 * Rejection Quest. Só valem os valores da lista: qualquer outro texto fica no valor por omissão,
 * sem erro.
 */

/** Dias do funcionamento. 90 é o que os contadores guardam (OPS_RETENTION_DAYS da app). */
export const HEALTH_DAYS = [7, 14, 30, 90] as const;
/** Semanas do crescimento (contas novas e receitas por semana). */
export const GROWTH_WEEKS = [12, 26, 52] as const;

export type HealthDays = (typeof HEALTH_DAYS)[number];
export type GrowthWeeks = (typeof GROWTH_WEEKS)[number];

export interface Range {
  days: HealthDays;
  weeks: GrowthWeeks;
}

export const DEFAULT_RANGE: Range = { days: 14, weeks: 12 };

function pick<T extends number>(options: readonly T[], value: string | undefined, fallback: T): T {
  // Comparação de texto exata: "014", "14.0", " 14" ou "14abc" não entram
  return options.find((option) => String(option) === value) ?? fallback;
}

export function parseRange(query: {
  dias?: string | undefined;
  semanas?: string | undefined;
}): Range {
  return {
    days: pick(HEALTH_DAYS, query.dias, DEFAULT_RANGE.days),
    weeks: pick(GROWTH_WEEKS, query.semanas, DEFAULT_RANGE.weeks),
  };
}

/** O endereço do Painel com estes períodos (os valores por omissão não aparecem). */
export function rangeHref(range: Range): string {
  const params = new URLSearchParams();
  if (range.days !== DEFAULT_RANGE.days) params.set("dias", String(range.days));
  if (range.weeks !== DEFAULT_RANGE.weeks) params.set("semanas", String(range.weeks));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
