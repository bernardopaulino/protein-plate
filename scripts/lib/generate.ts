import type { Food } from "../../src/domain/food";

const QUOTE = "'";
const sqlString = (value: string) => QUOTE + value.split(QUOTE).join(QUOTE + QUOTE) + QUOTE;
const sqlNumber = (value: number) => {
  if (!Number.isFinite(value)) throw new Error(`Número inválido: ${value}`);
  return String(value);
};

const FOOD_COLUMNS = [
  "id",
  "name_pt",
  "name_en",
  "category",
  "role",
  "protein_per_100g",
  "kcal_per_100g",
  "carbs_per_100g",
  "fat_per_100g",
  "weight_basis",
  "processing",
  "ease",
  "example_rank",
  "tca_code",
  "ideas_pt",
  "ideas_en",
  "data_version",
];

/**
 * Seed da D1: substitui o catálogo inteiro (alimentos, porções e momentos). Os alimentos usam
 * upsert; plan_items e recipe_ingredients não têm chave estrangeira para foods, por isso retirar um
 * alimento nunca apaga dados das pessoas.
 */
export function toSeedSql(foods: readonly Food[], foodDataVersion: number): string {
  const lines: string[] = [
    "-- Gerado por scripts/content-build.ts a partir de content/foods. Não editar.",
    `-- FOOD_DATA_VERSION ${foodDataVersion}`,
    "DELETE FROM food_moments;",
    "DELETE FROM food_portions;",
    foods.length > 0
      ? `DELETE FROM foods WHERE id NOT IN (${foods.map((f) => sqlString(f.id)).join(", ")});`
      : "DELETE FROM foods;",
  ];
  const updates = FOOD_COLUMNS.filter((c) => c !== "id")
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");

  for (const f of foods) {
    const values = [
      sqlString(f.id),
      sqlString(f.name.pt),
      sqlString(f.name.en),
      sqlString(f.category),
      sqlString(f.role),
      sqlNumber(f.proteinPer100g),
      sqlNumber(f.kcalPer100g),
      sqlNumber(f.carbsPer100g),
      sqlNumber(f.fatPer100g),
      sqlString(f.weightBasis),
      sqlString(f.processing),
      sqlNumber(f.ease),
      sqlNumber(f.exampleRank),
      sqlString(f.tcaCode),
      sqlString(JSON.stringify(f.ideas.pt)),
      sqlString(JSON.stringify(f.ideas.en)),
      sqlNumber(foodDataVersion),
    ];
    lines.push(
      `INSERT INTO foods (${FOOD_COLUMNS.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT(id) DO UPDATE SET ${updates};`,
    );
    for (const p of f.portions) {
      const portion = [
        sqlString(p.id),
        sqlString(f.id),
        sqlString(p.label.pt),
        sqlString(p.label.en),
        sqlNumber(p.grams),
        p.default ? "1" : "0",
      ];
      lines.push(
        `INSERT INTO food_portions (id, food_id, label_pt, label_en, grams, is_default) VALUES (${portion.join(", ")});`,
      );
    }
    for (const m of f.moments) {
      lines.push(
        `INSERT INTO food_moments (food_id, moment) VALUES (${sqlString(f.id)}, ${sqlString(m)});`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

/** Módulo TypeScript tipado (páginas estáticas e cálculos no browser). */
export function toTypedModule(
  foods: readonly Food[],
  foodDataVersion: number,
  source: string,
): string {
  return [
    "// Gerado por scripts/content-build.ts a partir de content/foods. Não editar.",
    'import type { Food } from "@/domain/food";',
    "",
    `export const FOOD_DATA_VERSION = ${foodDataVersion};`,
    "",
    `export const FOOD_SOURCE = ${JSON.stringify(source)};`,
    "",
    `export const FOODS: readonly Food[] = ${JSON.stringify(foods, null, 2)};`,
    "",
  ].join("\n");
}
