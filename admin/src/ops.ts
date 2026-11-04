import { RECIPE_ERROR_CODES } from "../../src/domain/recipe-options";
import { columnChart, type Column, type IconName } from "./charts";
import type { AdminDb } from "./db";
import { DAY_MS, dayLabel, isoDay, isoDayMs, num, pct, plural } from "./format";
import { escapeHtml } from "./html";
import { DEFAULT_RANGE } from "./range";
import type { Loaded } from "./types";
import { FAILED_NOTE, dataTable, note, row, statusChip, type Status } from "./ui";

/**
 * O funcionamento: os contadores diários que a app grava (src/server/services/ops-counters.ts),
 * só nomes e totais por dia, nunca uma pessoa. Os dias são em UTC, como na app, e o de hoje
 * ainda está a decorrer. Adaptado do backoffice do Rejection Quest.
 */

export interface OpsMetrics {
  /** Os dias (AAAA-MM-DD), do mais antigo para hoje. */
  days: string[];
  /** Contadores por dia e por nome. */
  byDay: Record<string, Record<string, number>>;
}

export async function opsMetrics(
  db: AdminDb,
  now: number,
  dayCount: number = DEFAULT_RANGE.days,
): Promise<OpsMetrics> {
  const days = Array.from({ length: dayCount }, (_, i) =>
    isoDay(now - (dayCount - 1 - i) * DAY_MS),
  );
  const rows = await db.all<{ day: string; metric: string; count: number }>(
    "select day, metric, count from ops_counters where day >= ?",
    days[0] ?? isoDay(now),
  );
  const byDay: OpsMetrics["byDay"] = {};
  for (const r of rows) {
    (byDay[r.day] ??= {})[r.metric] = Number(r.count);
  }
  return { days, byDay };
}

type Counters = Record<string, number>;
const sum = (m: Counters, keys: readonly string[]) =>
  keys.reduce((total, key) => total + (m[key] ?? 0), 0);
const withPrefix = (m: Counters, prefix: string) =>
  sum(
    m,
    Object.keys(m).filter((k) => k.startsWith(prefix)),
  );
const error = (code: (typeof RECIPE_ERROR_CODES)[number]) => `recipes.error.${code}`;

/** Os pedidos recusados antes do modelo (pedido inválido, alimento, sessão ou formulário). */
const REFUSED = [
  error("invalid_request"),
  error("unknown_food"),
  error("restricted_food"),
  error("unauthorized"),
  error("onboarding_required"),
];

/** Cada valor a partir dos contadores de um dia. */
export const VALUE = {
  fresh: (m: Counters) => m["recipes.ok.new"] ?? 0,
  cached: (m: Counters) => m["recipes.ok.cached"] ?? 0,
  failed: (m: Counters) => m[error("generation_failed")] ?? 0,
  retried: (m: Counters) => m["recipes.retry"] ?? 0,
  retrySkipped: (m: Counters) => m["recipes.retry_skipped"] ?? 0,
  slow: (m: Counters) => m["recipes.slow"] ?? 0,
  quota: (m: Counters) => m[error("quota_exceeded")] ?? 0,
  rateLimited: (m: Counters) => m[error("rate_limited")] ?? 0,
  globalLimit: (m: Counters) => m[error("service_unavailable")] ?? 0,
  refused: (m: Counters) => sum(m, REFUSED),
  auth4xx: (m: Counters) => withPrefix(m, "auth.") - (m["auth.5xx"] ?? 0),
  actionsRejected: (m: Counters) => m["actions.rejected"] ?? 0,
  server: (m: Counters) => sum(m, ["recipes.5xx", "auth.5xx", "actions.error"]),
};

/** As colunas da tabela completa, com o que cada uma conta (à vista, por baixo da tabela). */
export const COLUMNS: { label: string; meaning: string; value: (m: Counters) => number }[] = [
  { label: "Novas", meaning: "Receitas novas, geradas pelo modelo.", value: VALUE.fresh },
  {
    label: "Da cache",
    meaning: "Pedidos servidos por uma receita já gerada (sem custo).",
    value: VALUE.cached,
  },
  {
    label: "Falharam",
    meaning: "Sem receita válida dentro do prazo de 14 s; a pessoa vê um erro e a quota fica.",
    value: VALUE.failed,
  },
  {
    label: "2.ª tentativa",
    meaning: "A primeira resposta não passou nas regras e o modelo tentou outra vez.",
    value: VALUE.retried,
  },
  {
    label: "Sem 2.ª",
    meaning: "A primeira resposta falhou perto do prazo e não houve tempo para outra.",
    value: VALUE.retrySkipped,
  },
  {
    label: "Lentas",
    meaning: "Receitas novas que demoraram mais de 10 s no modelo.",
    value: VALUE.slow,
  },
  {
    label: "Quota",
    meaning: "Pedidos acima da quota diária da conta (QUOTA_USER).",
    value: VALUE.quota,
  },
  {
    label: "Ritmo",
    meaning: "Pedidos acima de 5 por minuto da mesma conta.",
    value: VALUE.rateLimited,
  },
  {
    label: "Limite global",
    meaning: "Pedidos acima do limite diário de receitas novas (AI_DAILY_LIMIT): só a cache serve.",
    value: VALUE.globalLimit,
  },
  {
    label: "Recusados",
    meaning:
      "Pedidos recusados antes do modelo: inválidos, alimentos desconhecidos ou fora das restrições, sem sessão ou sem o formulário de boas-vindas.",
    value: VALUE.refused,
  },
  {
    label: "Login 4xx",
    meaning: "Respostas 4xx de /api/auth (pedidos inválidos, endpoints fora da lista, limites).",
    value: VALUE.auth4xx,
  },
  {
    label: "Ações recusadas",
    meaning: "Server actions que recusaram o pedido (sem sessão, validação ou dono).",
    value: VALUE.actionsRejected,
  },
  {
    label: "5xx",
    meaning: "Erros do servidor em /api/recipes, /api/auth e nas server actions.",
    value: VALUE.server,
  },
];

/** Acima desta parte das receitas pedidas ao modelo, as falhadas pedem atenção. */
export const FAILED_LIMIT = 0.05;
/** Acima desta parte das receitas novas, as lentas pedem atenção. */
export const SLOW_LIMIT = 0.1;
/**
 * "Desde ontem": os contadores são por dia (UTC), por isso hoje e ontem cobrem sempre as
 * últimas 24 horas (e às vezes um pouco mais).
 */
const RECENT_DAYS = 2;

export interface HealthTile {
  id: "5xx" | "falhadas" | "lentas" | "limite";
  title: string;
  /** O código ou a família, ao lado do título. */
  code: string;
  iconName: IconName;
  status: Status;
  /** O número grande: um total, ou uma percentagem. */
  value: string;
  /** O que o número conta. */
  unit: string;
  /** Porque está neste estado, ou o que quer dizer. */
  reason: string;
  /** A regra do estado, sempre à vista. */
  rule: string;
  /** O valor de cada dia, do mais antigo para hoje. */
  series: number[];
  /** Os dias que dão o estado de atenção (na cor de aviso). */
  alert: boolean[];
  /** Para o texto de cada coluna: [uma, várias]. */
  noun: [string, string];
}

const total = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : null);

/** Os quatro indicadores do funcionamento, com o estado de cada um. */
export function healthTiles(m: OpsMetrics): HealthTile[] {
  const perDay = (value: (c: Counters) => number) => m.days.map((day) => value(m.byDay[day] ?? {}));
  const span = `em ${m.days.length} dias`;
  const recentStart = m.days.length - RECENT_DAYS;

  const server = perDay(VALUE.server);
  const serverRecent = total(server.slice(-RECENT_DAYS));

  const fresh = perDay(VALUE.fresh);
  const failed = perDay(VALUE.failed);
  const failedTotal = total(failed);
  const askedTotal = total(fresh) + failedTotal;
  const failedRate = ratio(failedTotal, askedTotal);
  const failedOver = failedRate !== null && failedRate > FAILED_LIMIT;

  const slow = perDay(VALUE.slow);
  const slowTotal = total(slow);
  const slowRate = ratio(slowTotal, total(fresh));
  const slowOver = slowRate !== null && slowRate > SLOW_LIMIT;

  const limit = perDay(VALUE.globalLimit);
  const limitRecent = total(limit.slice(-RECENT_DAYS));

  const dayOver = (part: readonly number[], whole: readonly number[], max: number) =>
    part.map((v, i) => v > 0 && v / Math.max(whole[i] ?? 0, v) > max);
  const freshPlusFailed = fresh.map((v, i) => v + (failed[i] ?? 0));

  return [
    {
      id: "5xx",
      title: "Erros do servidor",
      code: "5xx",
      iconName: "server",
      status: serverRecent > 0 ? "attention" : "ok",
      value: num(total(server)),
      unit: span,
      reason:
        serverRecent > 0
          ? `${num(serverRecent)} desde ontem (UTC). Os registos do Worker dizem onde.`
          : total(server) > 0
            ? "Nenhum desde ontem (UTC)."
            : "Nenhum no período.",
      rule: "Atenção com algum erro desde ontem (UTC).",
      series: server,
      alert: server.map((v, i) => v > 0 && i >= recentStart),
      noun: ["erro", "erros"],
    },
    {
      id: "falhadas",
      title: "Receitas que falharam",
      code: "IA",
      iconName: "recipe",
      status: failedOver ? "attention" : "ok",
      value: failedRate === null ? "—" : pct(failedRate),
      unit: `${num(failedTotal)} de ${num(askedTotal)} ${plural(askedTotal, "pedida", "pedidas")} ao modelo`,
      reason: failedOver
        ? "Acima de 5% das receitas pedidas ao modelo: ver o prompt e o eval:recipes."
        : failedRate === null
          ? "Nenhuma receita pedida ao modelo no período."
          : "Até 5% das receitas pedidas ao modelo.",
      rule: "Atenção acima de 5% das receitas pedidas ao modelo no período.",
      series: failed,
      alert: dayOver(failed, freshPlusFailed, FAILED_LIMIT),
      noun: ["receita falhada", "receitas falhadas"],
    },
    {
      id: "lentas",
      title: "Receitas lentas",
      code: "> 10 s",
      iconName: "clock",
      status: slowOver ? "attention" : "ok",
      value: slowRate === null ? "—" : pct(slowRate),
      unit: `${num(slowTotal)} de ${num(total(fresh))} ${plural(total(fresh), "nova", "novas")}`,
      reason: slowOver
        ? "Mais de 10% das receitas novas acima de 10 s (o objetivo é responder em menos de 15 s)."
        : slowRate === null
          ? "Nenhuma receita nova no período."
          : "Até 10% das receitas novas acima de 10 s.",
      rule: "Atenção acima de 10% das receitas novas no período.",
      series: slow,
      alert: dayOver(slow, fresh, SLOW_LIMIT),
      noun: ["receita lenta", "receitas lentas"],
    },
    {
      id: "limite",
      title: "Limite global de receitas",
      code: "503",
      iconName: "gauge",
      status: limitRecent > 0 ? "attention" : "ok",
      value: num(total(limit)),
      unit: span,
      reason:
        limitRecent > 0
          ? "O limite diário (AI_DAILY_LIMIT) foi atingido desde ontem: só a cache serve receitas."
          : total(limit) > 0
            ? "Atingido no período, mas não desde ontem (UTC)."
            : "Nunca atingido no período.",
      rule: "Atenção se o limite diário foi atingido desde ontem (UTC).",
      series: limit,
      alert: limit.map((v, i) => v > 0 && i >= recentStart),
      noun: ["pedido recusado", "pedidos recusados"],
    },
  ];
}

function tileHtml(tile: HealthTile, days: readonly string[]): string {
  const last = days.length - 1;
  const columns: Column[] = days.map((day, i) => {
    const value = tile.series[i] ?? 0;
    const today = i === last;
    return {
      value,
      partial: today,
      attention: tile.alert[i] ?? false,
      title: `${dayLabel(isoDayMs(day))}${today ? ", hoje (em curso)" : ""}: ${num(value)} ${value === 1 ? tile.noun[0] : tile.noun[1]}`,
    };
  });
  const first = days[0];
  return `<article class="card tile" aria-labelledby="tile-${tile.id}">
<div class="tile-head"><h3 id="tile-${tile.id}">${escapeHtml(tile.title)} <span class="code">${escapeHtml(tile.code)}</span></h3>${statusChip(tile.status)}</div>
<p class="figure-line"><span class="figure">${escapeHtml(tile.value)}</span> <span class="unit">${escapeHtml(tile.unit)}</span></p>
<p class="reason">${escapeHtml(tile.reason)}</p>
<div class="spark">${columnChart(columns, {
    height: 36,
    grid: false,
    fill: days.length > 30 ? 0.72 : days.length > 7 ? 0.6 : 0.36,
    label: `${tile.title} por dia, ${tile.unit}`,
  })}<p class="axis" aria-hidden="true"><span>${first ? escapeHtml(dayLabel(isoDayMs(first))) : ""}</span><span>hoje</span></p></div>
<p class="rule">${escapeHtml(tile.rule)}</p>
</article>`;
}

/** A tabela completa por dia, com o que cada coluna conta. */
function opsTable(m: OpsMetrics, now: number): string {
  const year = new Date(now).getUTCFullYear();
  const today = m.days.at(-1);
  const rows = [...m.days].reverse().map((day) => {
    const ms = isoDayMs(day);
    const label = dayLabel(ms, new Date(ms).getUTCFullYear() !== year);
    const counters = m.byDay[day] ?? {};
    return {
      head:
        day === today
          ? `${escapeHtml(label)} <span class="tag-partial">hoje, em curso</span>`
          : escapeHtml(label),
      cells: COLUMNS.map((c) => c.value(counters)),
    };
  });
  const meanings = COLUMNS.map(
    (c) => `<dt>${escapeHtml(c.label)}</dt><dd>${escapeHtml(c.meaning)}</dd>`,
  ).join("");
  return `<details class="card data-panel"><summary>Tabela completa por dia</summary>
${dataTable(
  `Contadores por dia, do mais recente (${m.days.length} dias, UTC)`,
  ["Dia", ...COLUMNS.map((c) => c.label)],
  rows,
)}
<dl class="meanings">${meanings}</dl>
</details>`;
}

const SUB = "Contadores diários da app, em UTC; sem pessoas, só totais.";

/** O funcionamento; `filterHtml` é o período (os dias), no cabeçalho do bloco. */
export function healthRow(loaded: Loaded<OpsMetrics>, now: number, filterHtml = ""): string {
  if (!loaded.ok) {
    return row(
      "funcionamento",
      "Funcionamento",
      SUB,
      `<div class="card card-pad">${FAILED_NOTE}</div>`,
      filterHtml,
    );
  }
  const m = loaded.value;
  if (Object.keys(m.byDay).length === 0) {
    return row(
      "funcionamento",
      "Funcionamento",
      SUB,
      `<div class="card card-pad">${note(
        "Ainda sem contadores neste período. Começam quando a app com os contadores estiver publicada.",
      )}</div>`,
      filterHtml,
    );
  }
  const tiles = healthTiles(m);
  const fresh = total(m.days.map((d) => VALUE.fresh(m.byDay[d] ?? {})));
  const cached = total(m.days.map((d) => VALUE.cached(m.byDay[d] ?? {})));
  const attention = tiles.filter((t) => t.status === "attention");
  const summary =
    attention.length === 0
      ? statusChip("ok", "Tudo normal")
      : statusChip(
          "attention",
          attention.length === 1
            ? `${attention[0]?.title ?? ""}: atenção`
            : `${num(attention.length)} pontos pedem atenção`,
        );
  return row(
    "funcionamento",
    "Funcionamento",
    `${num(fresh)} ${plural(fresh, "receita nova", "receitas novas")} e ${num(cached)} da cache, em UTC. A âmbar, os dias que pedem atenção.`,
    `<div class="grid grid-health">${tiles.map((t) => tileHtml(t, m.days)).join("\n")}</div>
${opsTable(m, now)}`,
    `${summary}${filterHtml}`,
  );
}
