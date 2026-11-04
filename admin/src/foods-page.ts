import { CATEGORIES } from "../../src/domain/food";
import type { FoodFilters, FoodSort, FoodStat } from "./food-stats";
import { counted, num } from "./format";
import { escapeHtml } from "./html";
import { CATEGORY_LABEL } from "./labels";
import { pageShell } from "./layout";
import {
  DASH,
  card,
  emptyState,
  searchField,
  selectField,
  sortHeader,
  tableScroll,
  toolbar,
} from "./ui";
import { QUERY_MAX_CHARS } from "./users";

/** A lista dos alimentos com as três contagens, ordenada pelos cabeçalhos das colunas. */

export function foodHref(id: string): string {
  return `/alimentos/${encodeURIComponent(id)}`;
}

export function foodsHref({ q, sort, category }: Partial<FoodFilters>): string {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (category) query.set("categoria", category);
  if (sort && sort !== "gostam") query.set("ordem", sort);
  const text = query.toString();
  return text ? `/alimentos?${text}` : "/alimentos";
}

const SORT_LABEL: Record<FoodSort, string> = {
  gostam: "pelas pessoas que gostam",
  dias: "pelos dias guardados",
  receitas: "pelas receitas",
  nome: "pelo nome",
};

const cell = (n: number) =>
  n === 0 ? `<td class="num zero">${DASH}</td>` : `<td class="num">${num(n)}</td>`;

export function foodsPage({
  adminEmail,
  now,
  all,
  shown,
  filters,
}: {
  adminEmail: string;
  now: number;
  all: readonly FoodStat[];
  shown: readonly FoodStat[];
  filters: FoodFilters;
}): string {
  const sortHref = (sort: FoodSort) => foodsHref({ ...filters, sort });
  const head = `<thead><tr>${sortHeader("Alimento", sortHref("nome"), filters.sort === "nome", { ascending: true })}<th scope="col">Categoria</th>${(
    [
      ["gostam", "Pessoas que gostam"],
      ["dias", "Dias guardados"],
      ["receitas", "Receitas"],
    ] as const
  )
    .map(([sort, label]) =>
      sortHeader(label, sortHref(sort), filters.sort === sort, { numeric: true }),
    )
    .join("")}</tr></thead>`;
  const rows = shown
    .map(
      (f) =>
        `<tr><th scope="row">${f.category === null ? escapeHtml(f.name) : `<a href="${escapeHtml(foodHref(f.id))}">${escapeHtml(f.name)}</a>`}${f.category === null ? ` <span class="muted">(fora do catálogo)</span>` : ""}</th><td>${f.category === null ? DASH : escapeHtml(CATEGORY_LABEL[f.category])}</td>${cell(f.likedBy)}${cell(f.dayPlans)}${cell(f.recipes)}</tr>`,
    )
    .join("");
  const table =
    shown.length === 0
      ? emptyState(
          "food",
          "Nenhum alimento",
          filters.q ? "Nenhum alimento com esse nome." : "Nenhum alimento nesta categoria.",
        )
      : tableScroll(
          "Alimentos",
          `<table class="list wide"><caption class="visually-hidden">Alimentos, ${escapeHtml(SORT_LABEL[filters.sort])}</caption>${head}<tbody>${rows}</tbody></table>`,
        );
  const filtersBar = toolbar({
    action: "/alimentos",
    fields: [
      searchField("Procurar pelo nome", filters.q, QUERY_MAX_CHARS),
      selectField(
        "categoria",
        "Categoria",
        [
          { value: "", label: "Todas as categorias" },
          ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
        ],
        filters.category,
      ),
    ],
    clear:
      filters.q !== "" || filters.category !== "" || filters.sort !== "gostam"
        ? "/alimentos"
        : undefined,
    hidden: filters.sort === "gostam" ? [] : [{ name: "ordem", value: filters.sort }],
    count: `${shown.length === all.length ? "" : `${num(shown.length)} de `}${counted(all.length, "alimento", "alimentos")}`,
  });
  return pageShell({
    title: "Alimentos",
    section: "alimentos",
    adminEmail,
    now,
    heading: "Alimentos",
    sub: "O catálogo, com o que as pessoas escolhem e o que as receitas usam.",
    about:
      "<p>“Pessoas que gostam”: escolheram o alimento no onboarding. “Dias guardados”: dias de contas que o incluem. “Receitas”: receitas geradas que o usam. Os ids que já não estão no catálogo aparecem no fim, marcados.</p>",
    wide: true,
    body: `${filtersBar}
${card({ id: "lista-alimentos", title: "Catálogo", body: table, flush: true })}`,
  });
}
