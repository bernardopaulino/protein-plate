import { hbar, icon, type IconName } from "./charts";
import { num } from "./format";
import { escapeHtml } from "./html";

/**
 * As peças comuns das páginas (adaptadas do backoffice do Rejection Quest): estados, pílulas,
 * avisos em faixa, cartões com cabeçalho, a faixa de números, a grelha de detalhes, o menu "⋯",
 * a lista vazia, a barra dos filtros, as listas de barras e as tabelas. Tudo sem JavaScript: os
 * menus abrem com o atributo `popover` do HTML e a ordem das listas são links. Os argumentos
 * chamados `html` (ou que o dizem) já vêm escapados; o resto escapa-se aqui.
 */

export type Status = "ok" | "attention" | "info";

const STATUS_ICON: Record<Status, IconName> = { ok: "ok", attention: "attention", info: "info" };

/** O tom de uma pílula: o ponto à esquerda reforça a palavra, nunca a substitui. */
export type Tone = "ok" | "attention" | "neutral" | "quiet";

/** Uma pílula de estado ("● Onboarding feito"). */
export function pill(text: string, tone: Tone = "neutral"): string {
  return `<span class="pill pill-${tone}"><span class="pill-dot" aria-hidden="true"></span>${escapeHtml(text)}</span>`;
}

/** A inicial de um nome, num círculo (decorativa: o nome está sempre ao lado). */
export function avatar(name: string, size: "small" | "large" = "small"): string {
  const initial = [...name.trim()][0]?.toLocaleUpperCase("pt-PT") ?? "?";
  return `<span class="avatar avatar-${size}" aria-hidden="true">${escapeHtml(initial)}</span>`;
}

/** Um aviso em faixa, no topo do conteúdo (`html` já vem escapado). */
export function alertBanner(
  title: string,
  html: string,
  tone: Status = "info",
  { live = false }: { live?: boolean } = {},
): string {
  return `<div class="alert alert-${tone}"${live ? ' role="status"' : ""}>${icon(STATUS_ICON[tone])}<div class="alert-text"><p class="alert-title">${escapeHtml(title)}</p>${html ? `<p>${html}</p>` : ""}</div></div>`;
}

/** Um link com a seta ("Todos →"). */
export function arrowLink(href: string, label: string): string {
  return `<a class="arrow-link" href="${escapeHtml(href)}">${escapeHtml(label)}${icon("arrow-right")}</a>`;
}

/**
 * Um cartão com cabeçalho (o título e, à direita, um link ou uma nota) e o conteúdo; `flush`
 * encosta o conteúdo às bordas (listas e tabelas).
 */
export function card({
  id,
  title,
  aside = "",
  body,
  flush = false,
}: {
  id: string;
  title: string;
  /** À direita do título (HTML já feito). */
  aside?: string;
  body: string;
  flush?: boolean;
}): string {
  return `<section class="card${flush ? " card-flush" : ""}" id="${escapeHtml(id)}" aria-labelledby="h-${escapeHtml(id)}">
<div class="card-head"><h2 id="h-${escapeHtml(id)}">${escapeHtml(title)}</h2>${aside}</div>
${flush ? body : `<div class="card-body">${body}</div>`}
</section>`;
}

/** Uma nota curta à direita do título de um cartão. */
export function cardMeta(text: string): string {
  return `<p class="card-meta">${escapeHtml(text)}</p>`;
}

/** Uma célula da faixa de números: o ícone e o nome, o número e as linhas por baixo. */
export function stripCell({
  id,
  iconName,
  label,
  figure,
  lines,
}: {
  id: string;
  iconName: IconName;
  label: string;
  /** O número (HTML já escapado). */
  figure: string;
  /** As linhas por baixo do número (HTML já escapado), da mais à menos importante. */
  lines: readonly string[];
}): string {
  return `<article class="strip-cell" aria-labelledby="${id}">
<h3 id="${id}" class="strip-label">${icon(iconName)}<span>${escapeHtml(label)}</span></h3>
<p class="strip-figure">${figure}</p>
${lines.map((line, i) => `<p class="${i === 0 ? "strip-line" : "strip-detail"}">${line}</p>`).join("")}
</article>`;
}

/** A faixa de números: as células lado a lado num só cartão, com divisórias. */
export function strip(cells: readonly string[], label: string): string {
  return `<section class="strip" aria-label="${escapeHtml(label)}">${cells.join("\n")}</section>`;
}

/** Os detalhes de uma ficha, em colunas de etiqueta e valor (o valor já vem escapado). */
export function detailsGrid(items: readonly (readonly [string, string])[]): string {
  return `<dl class="details">${items
    .map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${value}</dd></div>`)
    .join("")}</dl>`;
}

/** Uma entrada de um menu: um link ou um formulário (POST, com o token já no `html`). */
export type MenuItem =
  { kind: "link"; label: string; href: string; danger?: boolean } | { kind: "form"; html: string };

/**
 * O menu "⋯" de uma linha ou de uma ficha: abre com `popovertarget`, sem JavaScript, e fecha
 * com Esc ou ao tocar fora. O id tem de ser único na página.
 */
export function moreMenu(id: string, label: string, items: readonly MenuItem[]): string {
  const entries = items
    .map((item) =>
      item.kind === "link"
        ? `<a class="menu-item${item.danger ? " menu-danger" : ""}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
        : item.html,
    )
    .join("");
  return `<button type="button" class="icon-button" popovertarget="${escapeHtml(id)}" aria-label="${escapeHtml(label)}">${icon("more")}</button><div class="menu" id="${escapeHtml(id)}" popover>${entries}</div>`;
}

/** Uma lista sem nada: o ícone num quadrado, o título e a frase. */
export function emptyState(iconName: IconName, title: string, text: string): string {
  return `<div class="empty"><span class="empty-icon">${icon(iconName)}</span><p class="empty-title">${escapeHtml(title)}</p><p class="empty-text">${escapeHtml(text)}</p></div>`;
}

/** Um bloco do painel: o título na página e, por baixo, os cartões (`subHtml` já escapado). */
export function row(id: string, title: string, subHtml: string, body: string): string {
  return `<section class="row" id="${id}" aria-labelledby="h-${id}">
<div class="row-head"><h2 id="h-${id}">${escapeHtml(title)}</h2>${subHtml ? `<p class="row-sub">${subHtml}</p>` : ""}</div>
${body}
</section>`;
}

/** Quando uma leitura falha, o resto da página aparece na mesma. */
export const FAILED_NOTE = `<p class="note">Não foi possível ler estes dados. Recarrega a página.</p>`;

export function note(text: string): string {
  return `<p class="note">${escapeHtml(text)}</p>`;
}

/** Uma linha de uma lista de barras: o nome, a barra e o valor (já formatado). */
export interface BarItem {
  label: string;
  /** O valor que dá o tamanho da barra. */
  value: number;
  /** O que aparece escrito (por omissão, o valor). */
  text?: string;
  /** Uma nota por baixo do nome (ex.: a categoria do alimento). */
  sub?: string;
  /** Um link no nome. */
  href?: string;
}

/**
 * Uma distribuição numa lista de barras horizontais, todas na escala do maior valor: os nomes
 * à esquerda, a barra e o número à direita (nunca só a barra). `caption` diz o que conta, para os
 * leitores de ecrã.
 */
export function barList(items: readonly BarItem[], caption: string): string {
  const max = Math.max(0, ...items.map((i) => i.value));
  return `<ul class="bars" aria-label="${escapeHtml(caption)}">${items
    .map((item) => {
      const name = item.href
        ? `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
        : escapeHtml(item.label);
      return `<li><span class="bar-label"><span class="bar-name">${name}</span>${item.sub ? `<span class="bar-sub">${escapeHtml(item.sub)}</span>` : ""}</span>${hbar(max > 0 ? item.value / max : 0)}<span class="bar-value">${escapeHtml(item.text ?? num(item.value))}</span></li>`;
    })
    .join("")}</ul>`;
}

/**
 * Um filtro numa caixa de seleção (aplica-se com o botão do formulário). A primeira opção diz o
 * que o filtro escolhe ("Todas as categorias").
 */
export function selectField(
  name: string,
  label: string,
  options: readonly { value: string; label: string }[],
  selected: string,
): string {
  const id = `f-${name}`;
  return `<div class="field"><label class="visually-hidden" for="${id}">${escapeHtml(label)}</label><span class="select"><select id="${id}" name="${escapeHtml(name)}">${options
    .map(
      (o) =>
        `<option value="${escapeHtml(o.value)}"${o.value === selected ? " selected" : ""}>${escapeHtml(o.label)}</option>`,
    )
    .join("")}</select></span></div>`;
}

/** O campo de pesquisa de uma lista, com a lupa. */
export function searchField(label: string, value: string, maxLength: number): string {
  return `<div class="field field-search"><label class="visually-hidden" for="q">${escapeHtml(label)}</label><span class="search-box">${icon("search")}<input id="q" name="q" type="search" value="${escapeHtml(value)}" maxlength="${maxLength}" placeholder="${escapeHtml(label)}" autocomplete="off" spellcheck="false"></span></div>`;
}

/**
 * A barra por cima de uma lista: a pesquisa e os filtros num só formulário (GET), o botão, o
 * "Limpar" quando há filtros e, à direita, quantos aparecem.
 */
export function toolbar({
  action,
  fields,
  submit = "Aplicar",
  clear,
  hidden = [],
  count,
}: {
  action: string;
  fields: readonly string[];
  submit?: string;
  /** O endereço sem filtros, quando há algum escolhido. */
  clear?: string;
  /** Campos escondidos que o formulário mantém (ex.: a ordem da tabela). */
  hidden?: readonly { name: string; value: string }[];
  /** Quantos aparecem (HTML já escapado). */
  count: string;
}): string {
  return `<div class="toolbar"><form class="filters" method="get" action="${escapeHtml(action)}" role="search">
${fields.join("\n")}
${hidden.map((h) => `<input type="hidden" name="${escapeHtml(h.name)}" value="${escapeHtml(h.value)}">`).join("")}
<div class="filter-actions"><button type="submit" class="button">${escapeHtml(submit)}</button>${clear ? `<a class="link-button" href="${escapeHtml(clear)}">Limpar</a>` : ""}</div>
</form>${count ? `<p class="result-count">${count}</p>` : ""}</div>`;
}

/**
 * O cabeçalho de uma coluna que ordena a lista: um link; a coluna escolhida tem aria-sort e a
 * seta, as outras a seta dupla, mais clara.
 */
export function sortHeader(
  label: string,
  href: string,
  current: boolean,
  { numeric = false, ascending = false }: { numeric?: boolean; ascending?: boolean } = {},
): string {
  const sort = current ? ` aria-sort="${ascending ? "ascending" : "descending"}"` : "";
  const arrow = current
    ? icon("arrow-down").replace('class="icon"', `class="icon${ascending ? " is-up" : ""}"`)
    : icon("chevrons");
  return `<th scope="col" class="sortable${numeric ? " num" : ""}"${sort}><a href="${escapeHtml(href)}"${current ? ' aria-current="true"' : ""}>${escapeHtml(label)}${arrow}</a></th>`;
}

/** Um contentor que se desloca na horizontal (a página nunca); recebe o foco, para o teclado. */
export function tableScroll(label: string, table: string): string {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${escapeHtml(label)}">${table}</div>`;
}

/** Uma célula: um número (com a marca dos zeros) ou HTML já feito. */
export type Cell = number | { html: string };

/** Uma tabela de dados simples com legenda: a primeira coluna é o nome de cada linha. */
export function dataTable(
  caption: string,
  columns: readonly string[],
  rows: readonly { head: string; cells: readonly Cell[] }[],
): string {
  const head = columns
    .map((column, i) => `<th scope="col"${i > 0 ? ' class="num"' : ""}>${escapeHtml(column)}</th>`)
    .join("");
  const body = rows
    .map(({ head: rowHead, cells }) => {
      const tds = cells
        .map((cell) =>
          typeof cell === "number"
            ? `<td class="num${cell === 0 ? " zero" : ""}">${num(cell)}</td>`
            : `<td class="num">${cell.html}</td>`,
        )
        .join("");
      return `<tr><th scope="row">${rowHead}</th>${tds}</tr>`;
    })
    .join("");
  return tableScroll(
    caption,
    `<table><caption>${escapeHtml(caption)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`,
  );
}

/** Os dados de um gráfico, abertos a pedido. */
export function dataDetails(summary: string, content: string): string {
  return `<details class="data"><summary>${escapeHtml(summary)}</summary>${content}</details>`;
}

/** As páginas de uma lista: "Página 2 de 5" e os botões Anterior e Seguinte. */
export function pager(page: number, pages: number, href: (page: number) => string): string {
  if (pages <= 1) return "";
  const prev =
    page > 1
      ? `<a class="button button-secondary" href="${escapeHtml(href(page - 1))}" rel="prev">Anterior</a>`
      : "";
  const next =
    page < pages
      ? `<a class="button button-secondary" href="${escapeHtml(href(page + 1))}" rel="next">Seguinte</a>`
      : "";
  return `<nav class="pager" aria-label="Páginas"><p>Página ${num(page)} de ${num(pages)}</p><div class="pager-actions">${prev}${next}</div></nav>`;
}

/** Um traço apagado, para o que não tem valor. */
export const DASH = `<span class="muted">—</span>`;
