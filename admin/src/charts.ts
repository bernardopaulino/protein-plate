import { escapeHtml } from "./html";

/**
 * Gráficos em SVG inline, gerados no servidor, como no backoffice do Rejection Quest. A CSP
 * recusa estilos inline mas não os atributos de geometria do SVG: as posições vão em
 * percentagem da largura (o gráfico estica com o cartão) e as alturas em píxeis exatos. As cores
 * vêm das classes de styles.ts. Cada marca tem um <title> (aparece ao passar o rato, sem
 * JavaScript); os valores estão também na tabela de cada gráfico, que é o que os leitores de
 * ecrã leem.
 */

/** Atributos curtos: três casas chegam para percentagens e píxeis. */
const fmt = (value: number) => String(Number(value.toFixed(3)));

export interface Column {
  value: number;
  /** O texto que aparece ao passar o rato (o dia ou a semana e o valor). */
  title: string;
  /** Dia ou semana ainda a decorrer: mais claro. */
  partial?: boolean;
}

/** O raio do topo das colunas; a base fica reta (o arredondado de baixo sai da área e é cortado). */
const TOP_RADIUS = 3;

/** Colunas a partir de zero, uma por dia ou semana, da mais antiga para a atual. */
export function columnChart(
  columns: readonly Column[],
  {
    height,
    fill = 0.62,
    label,
  }: {
    /** Altura da área do gráfico, em píxeis. */
    height: number;
    /** A parte de cada intervalo que a coluna ocupa (o resto é ar). */
    fill?: number;
    /** O que o gráfico mostra, para os leitores de ecrã. */
    label: string;
  },
): string {
  const top = Math.max(1, ...columns.map((c) => c.value));
  const slot = 100 / Math.max(columns.length, 1);
  const width = slot * fill;
  const marks = columns
    .map((column, i) => {
      let bar = "";
      if (column.value > 0) {
        // Altura exata; um valor acima de zero nunca desaparece (no mínimo 2 px)
        const h = Math.max((column.value / top) * height, 2);
        bar = `<rect class="mark${column.partial ? " partial" : ""}" x="${fmt(i * slot + (slot - width) / 2)}%" y="${fmt(height - h)}" width="${fmt(width)}%" height="${fmt(h + TOP_RADIUS)}" rx="${TOP_RADIUS}"/>`;
      }
      // A área que responde ao rato é o intervalo inteiro, não só a coluna
      return `<g><title>${escapeHtml(column.title)}</title><rect class="hit" x="${fmt(i * slot)}%" y="0" width="${fmt(slot)}%" height="${height}"/>${bar}</g>`;
    })
    .join("");
  return `<svg class="columns" width="100%" height="${height}" role="img" aria-label="${escapeHtml(label)}"><line class="gridline" x1="0" y1="0.5" x2="100%" y2="0.5"/>${marks}<line class="baseline" x1="0" y1="${fmt(height - 0.5)}" x2="100%" y2="${fmt(height - 0.5)}"/></svg>`;
}

/** Uma barra horizontal sobre a sua calha (a calha inteira é o máximo da lista). */
export function hbar(fraction: number): string {
  const width = fmt(Math.min(Math.max(fraction, 0), 1) * 100);
  const mark = fraction <= 0 ? "" : `<rect class="mark" width="${width}%" height="8" rx="4"/>`;
  return `<svg class="hbar" width="100%" height="8" aria-hidden="true" focusable="false"><rect class="track" width="100%" height="8" rx="4"/>${mark}</svg>`;
}

export type IconName =
  | "ok"
  | "attention"
  | "info"
  | "panel"
  | "users"
  | "recipe"
  | "food"
  | "spark"
  | "heart"
  | "menu"
  | "close"
  | "chevrons"
  | "more"
  | "arrow-right"
  | "arrow-down"
  | "external"
  | "search"
  | "logout";

/** O traço dos ícones de linha (os da moldura, das listas e das ações). */
const LINE = `fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;

/** Ícones desenhados (16 × 16, traço de 1,5 a 2), na cor do texto ao lado. */
const ICONS: Record<IconName, string> = {
  ok: `<path d="M3.4 8.6 6.5 11.6 12.6 4.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  attention: `<path d="M8 2.2 14.6 13.8H1.4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 6.3v3.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.8" r="1" fill="currentColor"/>`,
  info: `<circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 7.2v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="4.8" r="1" fill="currentColor"/>`,
  panel: `<g ${LINE}><rect x="2.25" y="2.25" width="4.75" height="4.75" rx="1.2"/><rect x="9" y="2.25" width="4.75" height="4.75" rx="1.2"/><rect x="2.25" y="9" width="4.75" height="4.75" rx="1.2"/><rect x="9" y="9" width="4.75" height="4.75" rx="1.2"/></g>`,
  users: `<g ${LINE}><circle cx="6" cy="5.4" r="2.4"/><path d="M1.8 13.6c.5-2.4 2.1-3.7 4.2-3.7s3.7 1.3 4.2 3.7"/><path d="M10.4 3.2a2.3 2.3 0 0 1 0 4.4"/><path d="M11.9 10.1c1.2.5 2 1.6 2.3 3.5"/></g>`,
  recipe: `<g ${LINE}><path d="M2 7.5h12a6 6 0 0 1-12 0Z"/><path d="M5.5 5.2c0-1 .9-1.2.9-2.2M8.5 5.2c0-1 .9-1.2.9-2.2"/></g>`,
  food: `<g ${LINE}><path d="M3 13c0-5.5 3.5-9.2 10-10-.4 6.4-4.3 10-10 10Z"/><path d="M3 13 9 7"/></g>`,
  spark: `<g ${LINE}><path d="M8 1.8v3M8 11.2v3M1.8 8h3M11.2 8h3"/><path d="M8 5.2 9 7l1.8 1L9 9l-1 1.8L7 9 5.2 8 7 7Z"/></g>`,
  heart: `<path d="M8 13.4S2.2 10 2.2 6a3 3 0 0 1 5.8-1.2A3 3 0 0 1 13.8 6C13.8 10 8 13.4 8 13.4Z" ${LINE}/>`,
  menu: `<path d="M2.5 4h11M2.5 8h11M2.5 12h11" ${LINE}/>`,
  close: `<path d="M4 4l8 8M12 4l-8 8" ${LINE}/>`,
  chevrons: `<path d="M5.5 6.2 8 3.7l2.5 2.5M5.5 9.8 8 12.3l2.5-2.5" ${LINE}/>`,
  more: `<circle cx="3.5" cy="8" r="1.25" fill="currentColor"/><circle cx="8" cy="8" r="1.25" fill="currentColor"/><circle cx="12.5" cy="8" r="1.25" fill="currentColor"/>`,
  "arrow-right": `<path d="M3 8h9.5M9 4.5 12.5 8 9 11.5" ${LINE}/>`,
  "arrow-down": `<path d="M8 3v9.5M4.5 9 8 12.5 11.5 9" ${LINE}/>`,
  external: `<g ${LINE}><path d="M9.5 2.5h4v4"/><path d="M13.5 2.5 7.5 8.5"/><path d="M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3"/></g>`,
  search: `<g ${LINE}><circle cx="7" cy="7" r="4.4"/><path d="m10.3 10.3 3.3 3.3"/></g>`,
  logout: `<g ${LINE}><path d="M6.2 2.5H3.6a1.1 1.1 0 0 0-1.1 1.1v8.8a1.1 1.1 0 0 0 1.1 1.1h2.6"/><path d="M10.2 5 13.2 8l-3 3"/><path d="M13 8H6.3"/></g>`,
};

export function icon(name: IconName): string {
  return `<svg class="icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}
