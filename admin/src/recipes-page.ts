import { icon } from "./charts";
import { catalogFood, foodName } from "./foods";
import { counted, dateTimeLabel, dayLabel, grams, num, tokens, usd } from "./format";
import { escapeHtml } from "./html";
import { CATEGORY_LABEL, mealLabel } from "./labels";
import { pageShell } from "./layout";
import { estimatedCost } from "./pricing";
import { MEALS } from "../../src/domain/meals";
import {
  RECIPES_PAGE_SIZE,
  hasRecipeFilters,
  type RecipeDetail,
  type RecipeFilters,
  type RecipeList,
  type RecipeListItem,
  type RecipeSort,
} from "./recipes";
import {
  DASH,
  card,
  detailsGrid,
  emptyState,
  note,
  pager,
  pill,
  searchField,
  selectField,
  sortHeader,
  tableScroll,
  toolbar,
} from "./ui";
import { QUERY_MAX_CHARS } from "./users";

/**
 * As receitas geradas: a lista, da mais recente, e a ficha de cada uma (os ingredientes com os
 * nomes do catálogo, os passos e o link para a página pública na app). O título, o resumo e os
 * passos vêm do modelo de IA: são sempre escapados.
 */

export function recipeHref(id: string): string {
  return `/receitas/${encodeURIComponent(id)}`;
}

/** O endereço da lista com estes filtros (os valores por omissão não aparecem). */
export function recipesHref(f: Partial<RecipeFilters>): string {
  const query = new URLSearchParams();
  if (f.q) query.set("q", f.q);
  if (f.meal) query.set("refeicao", f.meal);
  if (f.model) query.set("modelo", f.model);
  if (f.prompt != null) query.set("prompt", String(f.prompt));
  if (f.post) query.set("posTreino", f.post);
  if (f.sort && f.sort !== "recentes") query.set("ordem", f.sort);
  if (f.page && f.page > 1) query.set("pagina", String(f.page));
  const text = query.toString();
  return text ? `/receitas?${text}` : "/receitas";
}

const SORT_CAPTION: Record<RecipeSort, string> = {
  recentes: "da mais recente",
  guardadas: "das mais guardadas",
  proteina: "das com mais proteína por dose",
  tokens: "das que gastaram mais tokens",
};

const tokensText = (r: RecipeListItem) =>
  r.inputTokens === null || r.outputTokens === null
    ? DASH
    : `${escapeHtml(tokens(r.inputTokens))} <span class="muted">/</span> ${escapeHtml(tokens(r.outputTokens))}`;

const mealText = (r: { meal: string; postWorkout: boolean }) =>
  `${escapeHtml(mealLabel(r.meal))}${r.postWorkout ? ` ${pill("Pós-treino", "quiet")}` : ""}`;

export function recipesPage({
  adminEmail,
  now,
  list,
  filters,
  facets,
}: {
  adminEmail: string;
  now: number;
  list: RecipeList;
  filters: RecipeFilters;
  facets: { models: string[]; prompts: number[] };
}): string {
  const first = (list.page - 1) * RECIPES_PAGE_SIZE + 1;
  const last = first + list.items.length - 1;
  const rows = list.items
    .map(
      (r) => `<tr>
<th scope="row"><a href="${escapeHtml(recipeHref(r.id))}">${escapeHtml(r.title)}</a></th>
<td>${mealText(r)}</td>
<td class="num">${num(r.servings)}</td>
<td class="num">${escapeHtml(grams(r.proteinPerServingG))}</td>
<td><code>${escapeHtml(r.model)}</code></td>
<td class="num">${num(r.promptVersion)}</td>
<td class="num">${tokensText(r)}</td>
<td class="num">${r.saved === 0 ? DASH : num(r.saved)}</td>
<td><time datetime="${new Date(r.createdAt).toISOString()}">${escapeHtml(dateTimeLabel(r.createdAt))}</time></td>
</tr>`,
    )
    .join("");
  const filtered = hasRecipeFilters(filters);
  const sortHref = (sort: RecipeSort) => recipesHref({ ...filters, sort, page: 1 });
  const th = (label: string, sort: RecipeSort) =>
    sortHeader(label, sortHref(sort), filters.sort === sort, { numeric: sort !== "recentes" });
  const head = `<thead><tr><th scope="col">Receita</th><th scope="col">Refeição</th><th scope="col" class="num">Doses</th>${th("Proteína por dose", "proteina")}<th scope="col">Modelo</th><th scope="col" class="num">Prompt</th>${th("Tokens (entrada / saída)", "tokens")}${th("Guardada por", "guardadas")}${th("Criada (UTC)", "recentes")}</tr></thead>`;
  const table =
    list.items.length === 0
      ? filtered
        ? emptyState("recipe", "Nenhuma receita encontrada", "Nenhuma receita com estes filtros.")
        : emptyState(
            "recipe",
            "Ainda sem receitas",
            "Aparecem aqui quando a app gerar as primeiras.",
          )
      : tableScroll(
          "Receitas",
          `<table class="list wide"><caption class="visually-hidden">Receitas geradas, ${SORT_CAPTION[filters.sort]}</caption>${head}<tbody>${rows}</tbody></table>`,
        );
  const count =
    list.total === 0
      ? ""
      : `${list.pages > 1 ? `${num(first)}–${num(last)} de ` : ""}${counted(list.total, "receita", "receitas")}`;
  const filtersBar = toolbar({
    action: "/receitas",
    fields: [
      searchField("Procurar pelo título ou ID", filters.q, QUERY_MAX_CHARS),
      selectField(
        "refeicao",
        "Refeição",
        [
          { value: "", label: "Todas as refeições" },
          ...MEALS.map((m) => ({ value: m, label: mealLabel(m) })),
        ],
        filters.meal,
      ),
      selectField(
        "modelo",
        "Modelo",
        [
          { value: "", label: "Todos os modelos" },
          ...facets.models.map((m) => ({ value: m, label: m })),
        ],
        filters.model,
      ),
      selectField(
        "prompt",
        "Versão do prompt",
        [
          { value: "", label: "Todas as versões do prompt" },
          ...facets.prompts.map((v) => ({ value: String(v), label: `Prompt v${v}` })),
        ],
        filters.prompt === null ? "" : String(filters.prompt),
      ),
      selectField(
        "posTreino",
        "Pós-treino",
        [
          { value: "", label: "Com e sem pós-treino" },
          { value: "sim", label: "Só pós-treino" },
          { value: "nao", label: "Sem pós-treino" },
        ],
        filters.post,
      ),
    ],
    submit: "Aplicar",
    clear: filtered || filters.sort !== "recentes" ? "/receitas" : undefined,
    hidden: filters.sort === "recentes" ? [] : [{ name: "ordem", value: filters.sort }],
    count,
  });
  return pageShell({
    title: "Receitas",
    section: "receitas",
    adminEmail,
    now,
    heading: "Receitas",
    sub: "As receitas geradas pela IA, com pesquisa, filtros e ordem.",
    about:
      "<p>As receitas não têm dono: a lista não diz quem as pediu. A proteína por dose é a que a app calculou a partir da TCA (nunca vem do modelo). “Guardada por” conta as pessoas que a guardaram.</p>",
    wide: true,
    body: `${filtersBar}
<section class="card card-flush" aria-label="Lista de receitas">${table}</section>
${pager(list.page, list.pages, (page) => recipesHref({ ...filters, page }))}`,
  });
}

export function recipePage({
  adminEmail,
  now,
  recipe,
  publicUrl,
}: {
  adminEmail: string;
  now: number;
  recipe: RecipeDetail;
  /** A página pública na app, ou null se APP_URL não estiver configurado. */
  publicUrl: string | null;
}): string {
  const r = recipe;
  const cost =
    r.inputTokens === null || r.outputTokens === null
      ? null
      : estimatedCost(r.model, r.inputTokens, r.outputTokens);
  const items: [string, string][] = [
    ["Refeição", mealText(r)],
    ["Doses", num(r.servings)],
    ["Proteína por dose", `<strong>${escapeHtml(grams(r.proteinPerServingG))}</strong>`],
    ["Meta da refeição", escapeHtml(grams(r.mealTargetG))],
    ["Tempo", `${num(r.prepMinutes)} min`],
    ["Variante", `${num(r.variant)} de 3`],
    ["Língua", r.locale === "en" ? "Inglês" : "Português"],
    ["Modelo", `<code>${escapeHtml(r.model)}</code>`],
    ["Versão do prompt", num(r.promptVersion)],
    ["Versão dos alimentos", num(r.foodDataVersion)],
    [
      "Tokens",
      r.inputTokens === null || r.outputTokens === null
        ? `<span class="muted">Não guardados</span>`
        : `${num(r.inputTokens)} de entrada · ${num(r.outputTokens)} de saída`,
    ],
    ["Custo estimado", cost === null ? DASH : escapeHtml(usd(cost))],
    ["Guardada por", counted(r.saved, "pessoa", "pessoas")],
    ["Criada", `${escapeHtml(dateTimeLabel(r.createdAt))} UTC`],
    ["ID", `<code>${escapeHtml(r.id)}</code>`],
  ];
  const ingredients =
    r.ingredients.length === 0
      ? note("Sem ingredientes guardados.")
      : tableScroll(
          "Ingredientes",
          `<table class="list"><caption class="visually-hidden">Ingredientes, para a receita completa</caption><thead><tr><th scope="col">Alimento</th><th scope="col">Categoria</th><th scope="col" class="num">Gramas</th></tr></thead><tbody>${r.ingredients
            .map((i) => {
              const food = catalogFood(i.foodId);
              return `<tr><th scope="row">${escapeHtml(foodName(i.foodId))}</th><td>${food ? escapeHtml(CATEGORY_LABEL[food.category]) : `<span class="muted">Fora do catálogo</span>`}</td><td class="num">${escapeHtml(grams(i.grams))}</td></tr>`;
            })
            .join("")}</tbody></table>`,
        );
  const steps =
    r.steps.length === 0
      ? note("Sem passos guardados.")
      : `<ol class="steps">${r.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`;
  const open = publicUrl
    ? `<a class="button button-secondary" href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener noreferrer">${icon("external")}<span>Abrir na app</span></a>`
    : "";
  return pageShell({
    title: r.title,
    section: "receitas",
    adminEmail,
    now,
    heading: r.title,
    sub: `${escapeHtml(r.summary)}<br><span class="muted">Gerada a ${escapeHtml(dayLabel(r.createdAt, true))}</span>`,
    aside: `<a class="button button-secondary" href="/receitas">Todas as receitas</a>${open}`,
    body: `<div class="grid grid-split">${card({ id: "receita-ingredientes", title: "Ingredientes", body: ingredients, flush: r.ingredients.length > 0 })}
${card({ id: "receita-detalhes", title: "Detalhes", body: detailsGrid(items) })}</div>
${card({ id: "receita-passos", title: "Passos", body: steps })}`,
  });
}
