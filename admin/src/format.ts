/** Números, percentagens, dinheiro e datas do backoffice, em português e sempre em UTC. */

export const DAY_MS = 86_400_000;

const integer = new Intl.NumberFormat("pt-PT");
const oneDecimal = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const upToOneDecimal = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 });
const wholePercent = new Intl.NumberFormat("pt-PT", {
  style: "percent",
  maximumFractionDigits: 0,
});
const tenthPercent = new Intl.NumberFormat("pt-PT", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dollars = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const smallDollars = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});
const compact = new Intl.NumberFormat("pt-PT", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const num = (value: number) => integer.format(value);

/** Uma média com uma casa decimal ("6,2"). */
export const decimal = (value: number) => oneDecimal.format(value);

/** Gramas, com uma casa só quando faz falta ("32 g", "12,5 g"). */
export const grams = (value: number) => `${upToOneDecimal.format(value)} g`;

/** Tokens: exatos até 10 000, depois abreviados ("1,2 mi"). */
export const tokens = (value: number) =>
  value < 10_000 ? integer.format(value) : compact.format(value);

/**
 * Dólares (os preços da Anthropic estão em USD). Abaixo de um cêntimo leva quatro casas, para
 * um custo pequeno nunca parecer zero.
 */
export function usd(value: number): string {
  if (value > 0 && value < 0.01) return smallDollars.format(value);
  return dollars.format(value);
}

/**
 * Uma proporção (0 a 1) em percentagem. Abaixo de 10 % leva uma casa decimal; um valor que
 * arredondaria para zero aparece como "<0,1%", para nunca parecer zero.
 */
export function pct(ratio: number): string {
  if (ratio <= 0) return wholePercent.format(0);
  if (ratio < 0.0005) return `<${tenthPercent.format(0.001)}`;
  return ratio < 0.1 ? tenthPercent.format(ratio) : wholePercent.format(ratio);
}

const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

/** Um dia em UTC, como "13 out" (com o ano, quando pedido). */
export function dayLabel(ms: number, withYear = false): string {
  const date = new Date(ms);
  const label = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()] ?? ""}`;
  return withYear ? `${label} ${date.getUTCFullYear()}` : label;
}

/** A hora em UTC, como "09:05". */
export function timeLabel(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** Um dia e a hora em UTC, como "13 out 2026, 09:05". */
export function dateTimeLabel(ms: number): string {
  return `${dayLabel(ms, true)}, ${timeLabel(ms)}`;
}

/** Há quanto tempo, em palavras curtas ("há 3 h", "há 2 dias"). */
export function agoLabel(ms: number, now: number): string {
  const minutes = Math.max(0, Math.floor((now - ms) / 60_000));
  if (minutes < 60) return minutes <= 1 ? "agora" : `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${num(days)} dias`;
}

/** O dia (desde 1/1/1970, UTC) de `ms`. */
export const dayOf = (ms: number) => Math.floor(ms / DAY_MS);

/** O dia (desde 1/1/1970, UTC) da segunda-feira da semana de `ms`; 1/1/1970 foi uma quinta. */
export function weekStartDay(ms: number): number {
  const day = dayOf(ms);
  return day - ((day + 3) % 7);
}

export const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/** O texto de uma contagem com o nome no singular ou no plural ("1 receita", "3 receitas"). */
export const counted = (count: number, one: string, many: string) =>
  `${num(count)} ${plural(count, one, many)}`;

/** Um dia em UTC como texto AAAA-MM-DD (o formato dos contadores do funcionamento). */
export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** O início (00:00 UTC) de um dia AAAA-MM-DD, em ms. */
export const isoDayMs = (day: string) => Date.parse(`${day}T00:00:00Z`);

/** Uma variação com sinal, em percentagem inteira ("+12%", "−40%", "0%"). */
export function signedPct(ratio: number): string {
  const rounded = Math.round(ratio * 100);
  if (rounded === 0) return "0%";
  return `${rounded > 0 ? "+" : "−"}${integer.format(Math.abs(rounded))}%`;
}
