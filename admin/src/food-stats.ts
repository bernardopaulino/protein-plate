import type { Category } from "../../src/domain/food";
import type { AdminDb } from "./db";
import { CATALOG, catalogFood } from "./foods";
import { CATEGORY_LABEL } from "./labels";
import { jsonList } from "./metrics";

/**
 * Os alimentos, um a um: quantas pessoas os escolheram como "gosto e tenho" (o onboarding), em
 * quantos dias guardados aparecem e quantas receitas os usam. Só contagens; os ids que já não
 * estão no catálogo aparecem também (a base não tem chave estrangeira para os alimentos).
 */

export const FOOD_SORTS = ["gostam", "dias", "receitas", "nome"] as const;
export type FoodSort = (typeof FOOD_SORTS)[number];

export interface FoodFilters {
  /** Parte do nome ou do id (sem diferença de acentos nem maiúsculas); vazio: todos. */
  q: string;
  sort: FoodSort;
  /** Vazio: todas as categorias. */
  category: Category | "";
}

export function parseFoodFilters(query: {
  q?: string;
  ordem?: string | undefined;
  categoria?: string | undefined;
}): FoodFilters {
  const sort = FOOD_SORTS.find((s) => s === query.ordem) ?? "gostam";
  const category = Object.hasOwn(CATEGORY_LABEL, query.categoria ?? "")
    ? (query.categoria as Category)
    : "";
  return { q: query.q ?? "", sort, category };
}

export interface FoodStat {
  id: string;
  name: string;
  /** null: o id já não está no catálogo. */
  category: Category | null;
  likedBy: number;
  dayPlans: number;
  recipes: number;
}

export async function foodStats(db: AdminDb): Promise<FoodStat[]> {
  const [liked, plans, recipes] = await Promise.all([
    db.all<{ k: string; n: number }>(
      `select j.value as k, count(distinct p.user_id) as n
      from profiles p, json_each(${jsonList("p.liked_foods")}) j group by 1`,
    ),
    db.all<{ k: string; n: number }>(
      "select food_id as k, count(distinct plan_id) as n from plan_items group by 1",
    ),
    db.all<{ k: string; n: number }>(
      "select food_id as k, count(distinct recipe_id) as n from recipe_ingredients group by 1",
    ),
  ]);
  const toMap = (rows: readonly { k: string; n: number }[]) =>
    new Map(rows.map((r) => [String(r.k), Number(r.n)]));
  const likedBy = toMap(liked);
  const inPlans = toMap(plans);
  const inRecipes = toMap(recipes);
  const outside = new Set(
    [...likedBy.keys(), ...inPlans.keys(), ...inRecipes.keys()].filter((id) => !catalogFood(id)),
  );
  const stat = (id: string, name: string, category: Category | null): FoodStat => ({
    id,
    name,
    category,
    likedBy: likedBy.get(id) ?? 0,
    dayPlans: inPlans.get(id) ?? 0,
    recipes: inRecipes.get(id) ?? 0,
  });
  return [
    ...CATALOG.map((f) => stat(f.id, f.name, f.category)),
    ...[...outside].sort().map((id) => stat(id, id, null)),
  ];
}

const COLLATOR = new Intl.Collator("pt-PT", { sensitivity: "base" });

/** A lista filtrada e ordenada (do maior para o menor; o nome por ordem alfabética). */
/** Sem acentos nem maiúsculas, para a pesquisa ("grao" encontra "Grão-de-bico"). */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function sortFoods(
  all: readonly FoodStat[],
  { q, sort, category }: FoodFilters,
): FoodStat[] {
  const needle = fold(q);
  const shown = all.filter(
    (f) =>
      (category === "" || f.category === category) &&
      (needle === "" || fold(f.name).includes(needle) || f.id.includes(needle)),
  );
  const byName = (a: FoodStat, b: FoodStat) => COLLATOR.compare(a.name, b.name);
  const key: Record<Exclude<FoodSort, "nome">, (f: FoodStat) => number> = {
    gostam: (f) => f.likedBy,
    dias: (f) => f.dayPlans,
    receitas: (f) => f.recipes,
  };
  if (sort === "nome") return shown.sort(byName);
  const value = key[sort];
  return shown.sort((a, b) => value(b) - value(a) || byName(a, b));
}
