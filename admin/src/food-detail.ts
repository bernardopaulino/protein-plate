import { FOODS } from "../../src/content/foods.generated";
import { TODO } from "../../src/domain/contracts/food";
import type { Food } from "../../src/domain/food";
import { proteinForGrams } from "../../src/domain/protein";
import { icon } from "./charts";
import { isId, type AdminDb } from "./db";
import { counted, dayLabel, grams, num } from "./format";
import { escapeHtml } from "./html";
import { CATEGORY_LABEL, ROLE_LABEL, mealLabel } from "./labels";
import { pageShell } from "./layout";
import { jsonList } from "./metrics";
import { recipeHref } from "./recipes-page";
import { card, cardMeta, detailsGrid, emptyState, note, pill, tableScroll } from "./ui";

/**
 * A página de um alimento: os dados do catálogo (de content/foods, como a app os usa) e o que as
 * pessoas fazem com ele, só em contagens (quantas gostam, em quantos dias e em quantas receitas),
 * e as receitas mais recentes que o usam. Nunca diz quem.
 */

const BY_ID: ReadonlyMap<string, Food> = new Map(FOODS.map((f) => [f.id, f]));

/** Quantas receitas recentes com o alimento aparecem na página. */
export const FOOD_RECIPES_LIMIT = 10;

export interface FoodDetail {
  food: Food;
  likedBy: number;
  dayPlans: number;
  recipes: number;
  recent: { id: string; title: string; meal: string; createdAt: number }[];
}

export async function foodDetail(db: AdminDb, id: string): Promise<FoodDetail | null> {
  const food = isId(id) ? BY_ID.get(id) : undefined;
  if (!food) return null;
  const [counts, recent] = await Promise.all([
    db.first<{ liked: number; plans: number; recipes: number }>(
      `select
        (select count(distinct p.user_id) from profiles p, json_each(${jsonList("p.liked_foods")}) j
          where j.value = ?) as liked,
        (select count(distinct plan_id) from plan_items where food_id = ?) as plans,
        (select count(distinct recipe_id) from recipe_ingredients where food_id = ?) as recipes`,
      id,
      id,
      id,
    ),
    db.all<{ id: string; title: string; meal: string; created_at: number }>(
      `select r.id as id, r.title as title, r.meal as meal, r.created_at as created_at
      from recipes r where exists (
        select 1 from recipe_ingredients i where i.recipe_id = r.id and i.food_id = ?
      )
      order by r.created_at desc limit ?`,
      id,
      FOOD_RECIPES_LIMIT,
    ),
  ]);
  return {
    food,
    likedBy: Number(counts?.liked ?? 0),
    dayPlans: Number(counts?.plans ?? 0),
    recipes: Number(counts?.recipes ?? 0),
    recent: recent.map((r) => ({
      id: r.id,
      title: r.title,
      meal: r.meal,
      createdAt: Number(r.created_at),
    })),
  };
}

const BASIS_LABEL: Record<Food["weightBasis"], string> = {
  raw: "Em cru",
  cooked: "Cozinhado",
  as_sold: "Como se compra",
};

const PROCESSING_LABEL: Record<Food["processing"], string> = {
  natural: "Natural",
  culinary: "Ingrediente culinário",
  processed: "Processado",
  ultra: "Ultraprocessado (exceção)",
};

export function foodPage({
  adminEmail,
  now,
  detail,
}: {
  adminEmail: string;
  now: number;
  detail: FoodDetail;
}): string {
  const { food } = detail;
  const provisional = food.tcaCode === TODO;
  const data = detailsGrid([
    ["Categoria", escapeHtml(CATEGORY_LABEL[food.category])],
    ["Papel", escapeHtml(ROLE_LABEL[food.role])],
    ["Proteína", `<strong>${escapeHtml(grams(food.proteinPer100g))}</strong> por 100 g`],
    ["Base do peso", escapeHtml(BASIS_LABEL[food.weightBasis])],
    ["Processamento", escapeHtml(PROCESSING_LABEL[food.processing])],
    [
      "Refeições",
      escapeHtml(food.moments.map((m) => mealLabel(m)).join(", ")) ||
        `<span class="muted">—</span>`,
    ],
    [
      "TCA (INSA)",
      provisional
        ? `<span class="muted">Valores provisórios: curadoria por fazer</span>`
        : `<code>${escapeHtml(food.tcaCode)}</code>`,
    ],
    ["ID", `<code>${escapeHtml(food.id)}</code>`],
  ]);
  const portions = tableScroll(
    "Porções",
    `<table><caption class="visually-hidden">Porções e proteína por porção</caption><thead><tr><th scope="col">Porção</th><th scope="col" class="num">Gramas</th><th scope="col" class="num">Proteína</th></tr></thead><tbody>${food.portions
      .map(
        (p) =>
          `<tr><th scope="row">${escapeHtml(p.label.pt)}${p.default ? ` ${pill("Por defeito", "quiet")}` : ""}</th><td class="num">${escapeHtml(grams(p.grams))}</td><td class="num">${escapeHtml(grams(proteinForGrams(p.grams, food.proteinPer100g)))}</td></tr>`,
      )
      .join("")}</tbody></table>`,
  );
  const use = `<div class="stats">
<div class="stat"><p class="stat-value">${num(detail.likedBy)}</p><p class="stat-label">${detail.likedBy === 1 ? "pessoa gosta e tem em casa" : "pessoas gostam e têm em casa"}</p></div>
<div class="stat"><p class="stat-value">${num(detail.dayPlans)}</p><p class="stat-label">${detail.dayPlans === 1 ? "dia guardado o inclui" : "dias guardados o incluem"}</p></div>
<div class="stat"><p class="stat-value">${num(detail.recipes)}</p><p class="stat-label">${detail.recipes === 1 ? "receita gerada o usa" : "receitas geradas o usam"}</p></div>
</div>`;
  const recipes =
    detail.recent.length === 0
      ? emptyState("recipe", "Ainda sem receitas", "Nenhuma receita gerada usa este alimento.")
      : `<ul class="short-list">${detail.recent
          .map(
            (r) =>
              `<li><a href="${escapeHtml(recipeHref(r.id))}"><span class="short-main"><span class="short-title">${escapeHtml(r.title)}</span><span class="short-sub">${escapeHtml(mealLabel(r.meal))} · ${escapeHtml(dayLabel(r.createdAt, true))}</span></span>${icon("arrow-right")}</a></li>`,
          )
          .join("")}</ul>`;
  return pageShell({
    title: food.name.pt,
    section: "alimentos",
    adminEmail,
    now,
    heading: food.name.pt,
    badges: provisional ? pill("Valores provisórios", "attention") : pill("TCA", "ok"),
    sub: `${escapeHtml(CATEGORY_LABEL[food.category])} · ${escapeHtml(grams(food.proteinPer100g))} de proteína por 100 g`,
    about:
      "<p>Os dados vêm do catálogo da app (content/foods), os mesmos com que a app calcula a proteína. O uso é só em contagens: nunca diz quem.</p>",
    aside: `<a class="button button-secondary" href="/alimentos">Todos os alimentos</a>`,
    body: `<div class="grid grid-split">${card({ id: "alimento-dados", title: "No catálogo", body: data })}
${card({ id: "alimento-uso", title: "Uso", body: use })}</div>
<div class="grid grid-split">${card({ id: "alimento-porcoes", title: "Porções", aside: cardMeta(counted(food.portions.length, "porção", "porções")), body: portions, flush: true })}
${card({ id: "alimento-receitas", title: "Receitas recentes", aside: cardMeta(`As ${num(FOOD_RECIPES_LIMIT)} mais recentes`), body: recipes, flush: detail.recent.length > 0 })}</div>
${provisional ? note("A curadoria da TCA do INSA ainda não chegou a este alimento: os valores podem mudar.") : ""}`,
  });
}
