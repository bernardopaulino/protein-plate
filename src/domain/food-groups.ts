import type { Category, Food } from "./food";

/**
 * Grupos e subgrupos para escolher alimentos (formulário de boas-vindas e receitas). Os subgrupos
 * são o nível em que se escolhe depressa ("Aves" escolhe frango, peru e pato); os alimentos ficam
 * lá dentro para afinar. A despensa (azeite, especiarias) não entra.
 */
export const FOOD_SECTIONS = ["protein", "carb", "fruit", "vegetable", "nuts"] as const;
export type FoodSection = (typeof FOOD_SECTIONS)[number];

export const FOOD_SUBGROUPS = [
  { id: "aves", section: "protein" },
  { id: "carne", section: "protein" },
  { id: "peixe", section: "protein" },
  { id: "conservas", section: "protein" },
  { id: "marisco", section: "protein" },
  { id: "ovos", section: "protein" },
  { id: "leite-iogurtes", section: "protein" },
  { id: "queijos", section: "protein" },
  { id: "leguminosas", section: "protein" },
  { id: "soja", section: "protein" },
  { id: "pao", section: "carb" },
  { id: "arroz-massa", section: "carb" },
  { id: "cereais", section: "carb" },
  { id: "tuberculos", section: "carb" },
  { id: "fruta-dia", section: "fruit" },
  { id: "frutos-vermelhos", section: "fruit" },
  { id: "fruta-verao", section: "fruit" },
  { id: "fruta-outras", section: "fruit" },
  { id: "folhas", section: "vegetable" },
  { id: "couves", section: "vegetable" },
  { id: "salada", section: "vegetable" },
  { id: "cozinhar", section: "vegetable" },
  { id: "frutos-secos", section: "nuts" },
  { id: "amendoim", section: "nuts" },
  { id: "sementes", section: "nuts" },
] as const satisfies readonly { id: string; section: FoodSection }[];

export type FoodSubgroup = (typeof FOOD_SUBGROUPS)[number]["id"];

const SECTION_OF = new Map<FoodSubgroup, FoodSection>(FOOD_SUBGROUPS.map((g) => [g.id, g.section]));

/** Subgrupo por defeito de cada categoria (um alimento novo cai aqui sem mais nada). */
const BY_CATEGORY: Record<Exclude<Category, "despensa">, FoodSubgroup> = {
  carne: "carne",
  peixe: "peixe",
  conservas: "conservas",
  marisco: "marisco",
  ovos: "ovos",
  laticinios: "leite-iogurtes",
  suplementos: "leite-iogurtes",
  leguminosas: "leguminosas",
  soja: "soja",
  cereais: "cereais",
  tuberculos: "tuberculos",
  fruta: "fruta-dia",
  legumes: "cozinhar",
  "frutos-secos": "frutos-secos",
  sementes: "sementes",
};

/** As exceções ao subgrupo da categoria. */
const BY_ID: Record<string, FoodSubgroup> = {
  // carne
  "peito-frango": "aves",
  "coxa-frango": "aves",
  "peito-peru": "aves",
  "carne-picada-peru": "aves",
  "peito-pato": "aves",
  // laticínios
  "queijo-fresco": "queijos",
  requeijao: "queijos",
  "queijo-cottage": "queijos",
  "queijo-flamengo": "queijos",
  ricota: "queijos",
  "mozzarella-fresca": "queijos",
  "queijo-sao-jorge": "queijos",
  parmesao: "queijos",
  "queijo-cabra-curado": "queijos",
  // cereais
  "pao-integral": "pao",
  "pao-mistura": "pao",
  "pao-centeio": "pao",
  "broa-milho": "pao",
  "arroz-branco": "arroz-massa",
  "arroz-integral": "arroz-massa",
  "massa-trigo": "arroz-massa",
  "massa-integral": "arroz-massa",
  // fruta
  morangos: "frutos-vermelhos",
  mirtilos: "frutos-vermelhos",
  framboesas: "frutos-vermelhos",
  cerejas: "frutos-vermelhos",
  uvas: "fruta-verao",
  manga: "fruta-verao",
  ananas: "fruta-verao",
  pessego: "fruta-verao",
  melao: "fruta-verao",
  melancia: "fruta-verao",
  figos: "fruta-verao",
  ameixas: "fruta-verao",
  roma: "fruta-outras",
  tamaras: "fruta-outras",
  abacate: "fruta-outras",
  // legumes
  alface: "folhas",
  rucula: "folhas",
  espinafres: "folhas",
  brocolos: "couves",
  "couve-flor": "couves",
  "couve-portuguesa": "couves",
  "couve-kale": "couves",
  "couve-bruxelas": "couves",
  tomate: "salada",
  pepino: "salada",
  pimento: "salada",
  cenoura: "salada",
  beterraba: "salada",
  cebola: "salada",
  // frutos secos
  amendoim: "amendoim",
  "manteiga-amendoim": "amendoim",
};

/** O subgrupo de um alimento (null para a despensa). */
export function foodSubgroup(food: Pick<Food, "id" | "category">): FoodSubgroup | null {
  if (food.category === "despensa") return null;
  return BY_ID[food.id] ?? BY_CATEGORY[food.category];
}

export function subgroupSection(subgroup: FoodSubgroup): FoodSection {
  return SECTION_OF.get(subgroup)!;
}

export interface SubgroupFoods {
  id: FoodSubgroup;
  foods: Food[];
}

/**
 * Os alimentos de uma secção, por subgrupo e pela ordem de FOOD_SUBGROUPS (dentro de cada um, os
 * mais usados primeiro). Subgrupos sem alimentos (por exemplo, para quem é vegetariano) não
 * aparecem.
 */
export function groupFoods(foods: readonly Food[], section: FoodSection): SubgroupFoods[] {
  const by = new Map<FoodSubgroup, Food[]>();
  for (const food of foods) {
    const subgroup = foodSubgroup(food);
    if (!subgroup || subgroupSection(subgroup) !== section) continue;
    by.set(subgroup, [...(by.get(subgroup) ?? []), food]);
  }
  return FOOD_SUBGROUPS.filter((g) => g.section === section && by.has(g.id)).map((g) => ({
    id: g.id,
    foods: by.get(g.id)!.sort((a, b) => b.exampleRank - a.exampleRank || a.id.localeCompare(b.id)),
  }));
}

export type Selection = "all" | "some" | "none";

/** Quantos alimentos de um grupo estão escolhidos (para o botão "Todos"). */
export function selectionOf(ids: readonly string[], chosen: ReadonlySet<string>): Selection {
  const n = ids.filter((id) => chosen.has(id)).length;
  return n === 0 ? "none" : n === ids.length ? "all" : "some";
}

/** Escolhe ou tira um grupo inteiro: se já estava todo escolhido, tira; senão, junta o que falta. */
export function toggleAll(chosen: readonly string[], ids: readonly string[]): string[] {
  const set = new Set(chosen);
  if (selectionOf(ids, set) === "all") return chosen.filter((id) => !ids.includes(id));
  return [...chosen, ...ids.filter((id) => !set.has(id))];
}

export interface LikedSummary {
  /** Escolheu tudo o que pode comer. */
  everything: boolean;
  /** Subgrupos escolhidos por inteiro. */
  groups: FoodSubgroup[];
  /** Os outros alimentos escolhidos (de subgrupos só em parte). */
  foods: string[];
}

/** Resumo legível do que a pessoa escolheu: "Como de tudo", grupos inteiros e o resto. */
export function summarizeLiked(liked: readonly string[], allowed: readonly Food[]): LikedSummary {
  const chosen = new Set(liked);
  const everything = allowed.length > 0 && allowed.every((f) => chosen.has(f.id));
  const groups: FoodSubgroup[] = [];
  const foods: string[] = [];
  for (const section of FOOD_SECTIONS) {
    for (const g of groupFoods(allowed, section)) {
      const ids = g.foods.map((f) => f.id);
      const state = selectionOf(ids, chosen);
      if (state === "all") groups.push(g.id);
      else if (state === "some") foods.push(...ids.filter((id) => chosen.has(id)));
    }
  }
  return { everything, groups, foods };
}
