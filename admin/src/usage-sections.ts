import { columnChart, hbar, type Column } from "./charts";
import { DAY_MS, dayLabel, decimal, num, pct, plural, weekStartDay } from "./format";
import { escapeHtml } from "./html";
import type { Loaded } from "./types";
import { FAILED_NOTE, dataDetails, dataTable, note, row, strip, stripCell } from "./ui";
import {
  COHORT_WEEKS,
  FUNNEL_MIN_AGE_DAYS,
  type ActiveMetrics,
  type Cohort,
  type FunnelMetrics,
} from "./usage";

/** O HTML dos blocos de uso do Painel (usage.ts): pessoas ativas, retenção e ativação. */

const failedCard = `<div class="card card-pad">${FAILED_NOTE}</div>`;

/** As datas por baixo de um gráfico por dia: o primeiro, o do meio e hoje. */
function dayAxis(days: readonly number[]): string {
  const label = (day: number | undefined, i: number) =>
    day === undefined ? "" : i === days.length - 1 ? "hoje" : dayLabel(day * DAY_MS);
  const middle = Math.floor((days.length - 1) / 2);
  return `<p class="axis" aria-hidden="true"><span>${escapeHtml(label(days[0], 0))}</span><span>${escapeHtml(label(days[middle], middle))}</span><span>${escapeHtml(label(days.at(-1), days.length - 1))}</span></p>`;
}

export function activeRow(loaded: Loaded<ActiveMetrics>): string {
  const title = "Pessoas ativas";
  const sub =
    "Quem fez alguma coisa na app em cada dia (UTC): entrou, pediu ou guardou uma receita, mudou o dia ou as preferências.";
  if (!loaded.ok) return row("ativos", title, sub, failedCard);
  const m = loaded.value;
  const today = m.perDay.at(-1) ?? 0;
  const stickiness = m.monthly > 0 ? m.dailyAverage / m.monthly : null;
  const cell = (id: string, label: string, figure: string, detail: string) =>
    stripCell({ id, iconName: "users", label, figure, lines: [detail] });
  const cells = [
    cell(
      "ativos-hoje",
      "Hoje",
      num(today),
      `${plural(today, "pessoa ativa", "pessoas ativas")} hoje (dia em curso).`,
    ),
    cell("ativos-media", "Por dia", decimal(m.dailyAverage), "Média dos últimos 7 dias completos."),
    cell(
      "ativos-semana",
      "Últimos 7 dias",
      num(m.weekly),
      `${plural(m.weekly, "pessoa diferente", "pessoas diferentes")}, hoje incluído.`,
    ),
    cell(
      "ativos-mes",
      "Últimos 30 dias",
      num(m.monthly),
      stickiness === null
        ? "Ninguém nos últimos 30 dias."
        : `Por dia, ${pct(stickiness)} delas (média diária a dividir pelas de 30 dias).`,
    ),
  ];
  const columns: Column[] = m.days.map((day, i) => {
    const value = m.perDay[i] ?? 0;
    const partial = i === m.days.length - 1;
    return {
      value,
      partial,
      title: `${dayLabel(day * DAY_MS, true)}${partial ? " (em curso)" : ""}: ${num(value)} ${plural(value, "pessoa", "pessoas")}`,
    };
  });
  const top = Math.max(0, ...m.perDay);
  const plot = `<div class="plot"><p class="y-axis" aria-hidden="true"><span>${top > 0 ? num(top) : ""}</span><span>0</span></p><div class="plot-area">${columnChart(
    columns,
    {
      height: 120,
      grid: top > 0,
      label: `Pessoas ativas por dia, nos últimos ${m.days.length} dias`,
    },
  )}${dayAxis(m.days)}</div></div>`;
  const data = dataTable(
    `Pessoas ativas por dia, do mais recente (${m.days.length} dias)`,
    ["Dia", "Pessoas"],
    m.days
      .map((day, i) => ({
        head: escapeHtml(dayLabel(day * DAY_MS, true)),
        cells: [m.perDay[i] ?? 0],
      }))
      .reverse(),
  );
  const chart = `<article class="card chart" aria-labelledby="grafico-ativos">
<div class="card-head"><h3 id="grafico-ativos">Pessoas ativas por dia</h3></div>
<div class="chart-body">
<p class="chart-sub">Últimos ${num(m.days.length)} dias; o de hoje, mais claro, ainda está a decorrer.</p>
${plot}
${dataDetails("Ver os dados", data)}
</div>
</article>`;
  return row("ativos", title, sub, `${strip(cells, "Pessoas ativas")}\n${chart}`);
}

/** O degrau do mapa de calor (0 a 5) de um valor numa escala até `max`. */
export function heatStep(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(5, 1 + Math.floor((value / max) * 5 - 1e-9));
}

/** O nome de uma semana na tabela ("3 nov", "29 dez 2025"), com a marca da atual. */
function weekHead(week: number, now: number): string {
  const ms = week * DAY_MS;
  const label = escapeHtml(
    dayLabel(ms, new Date(ms).getUTCFullYear() !== new Date(now).getUTCFullYear()),
  );
  return week === weekStartDay(now) ? `${label} <span class="tag-partial">em curso</span>` : label;
}

export function retentionRow(loaded: Loaded<Cohort[]>, now: number): string {
  const title = "Retenção";
  const sub = `Que parte das contas de cada semana voltou nas semanas seguintes (S0: os primeiros 7 dias de cada pessoa). Últimas ${COHORT_WEEKS} semanas.`;
  if (!loaded.ok) return row("retencao", title, sub, failedCard);
  const cohorts = [...loaded.value].reverse(); // a mais recente primeiro
  const head = Array.from(
    { length: COHORT_WEEKS },
    (_, k) => `<th scope="col" class="num">S${k}</th>`,
  ).join("");
  const body = cohorts
    .map((c) => {
      const cells = c.retained
        .map((value, k) => {
          if (value === null || c.size === 0) {
            const why = c.size === 0 ? "sem contas" : "por terminar";
            return `<td class="heat heat-0 is-pending" title="${c.size === 0 ? "Sem contas" : "Semana ainda por terminar"}"><span aria-hidden="true">—</span><span class="visually-hidden">${why}</span></td>`;
          }
          const share = value / c.size;
          return `<td class="heat heat-${heatStep(share * 100, 100)}" title="S${k}: ${num(value)} de ${num(c.size)}">${escapeHtml(pct(share))}</td>`;
        })
        .join("");
      return `<tr><th scope="row">${weekHead(c.week, now)}</th><td class="num">${num(c.size)}</td>${cells}</tr>`;
    })
    .join("");
  const table = `<div class="table-scroll" tabindex="0" role="region" aria-label="Retenção por semana de registo"><table class="heatmap"><caption>Semana de registo nas linhas; nas colunas, a parte das contas que voltou em cada semana depois do registo</caption><thead><tr><th scope="col">Semana de registo</th><th scope="col" class="num">Contas</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  return row(
    "retencao",
    title,
    sub,
    `<div class="card card-flush">${table}<p class="card-foot">Quanto mais escuro, maior a parte da coorte que voltou. Uma semana só aparece quando já terminou para todas as contas da coorte. O S0 é quase sempre 100%: entrar pela primeira vez já conta.</p></div>`,
  );
}

export interface FunnelStep {
  label: string;
  count: number;
  share: number | null;
}

export function funnelSteps(m: FunnelMetrics): FunnelStep[] {
  const share = (count: number) => (m.eligible > 0 ? count / m.eligible : null);
  return [
    {
      label: `Contas com ${FUNNEL_MIN_AGE_DAYS} dias ou mais`,
      count: m.eligible,
      share: m.eligible > 0 ? 1 : null,
    },
    { label: "Formulário de boas-vindas feito", count: m.onboarded, share: share(m.onboarded) },
    { label: "Pediu uma receita", count: m.firstRecipe, share: share(m.firstRecipe) },
    {
      label: "Guardou uma receita ou pô-la no dia",
      count: m.keptRecipe,
      share: share(m.keptRecipe),
    },
    { label: "Voltou na 2.ª semana", count: m.returned, share: share(m.returned) },
  ];
}

export function funnelRow(loaded: Loaded<FunnelMetrics>): string {
  const title = "Ativação";
  const sub = `Das contas com ${FUNNEL_MIN_AGE_DAYS} dias ou mais, até onde chegaram. "Voltou" é fazer alguma coisa na app entre o 7.º e o 13.º dia.`;
  if (!loaded.ok) return row("ativacao", title, sub, failedCard);
  const m = loaded.value;
  const steps = funnelSteps(m)
    .map(
      (step) =>
        `<li class="step"><p class="step-head"><span class="step-label">${escapeHtml(step.label)}</span><span class="step-count">${num(step.count)}</span><span class="step-share">${step.share === null ? "" : escapeHtml(pct(step.share))}</span></p>${hbar(step.share ?? 0)}</li>`,
    )
    .join("");
  const recent =
    m.recent === 0
      ? ""
      : note(
          `${num(m.recent)} ${plural(m.recent, "conta mais recente ainda não entra", "contas mais recentes ainda não entram")} (menos de ${FUNNEL_MIN_AGE_DAYS} dias).`,
        );
  return row(
    "ativacao",
    title,
    sub,
    `<div class="card card-pad funnel"><ol class="funnel-steps">${steps}</ol>${m.eligible === 0 ? note(`Ainda sem contas com ${FUNNEL_MIN_AGE_DAYS} dias.`) : ""}${recent}</div>`,
  );
}
