import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkCatalog,
  foodFileSchema,
  foodsMetaSchema,
  type CatalogIssue,
} from "../../src/domain/contracts/food";
import { CATEGORIES, type Food } from "../../src/domain/food";

export const FOODS_DIR = join(import.meta.dirname, "..", "..", "content", "foods");

export interface LoadedCatalog {
  foods: Food[];
  foodDataVersion: number;
  source: string;
  issues: CatalogIssue[];
}

/** Lê content/foods/*.json (um ficheiro por categoria) e valida tudo com Zod. */
export function loadCatalog(options: { allowTodo: boolean }, dir = FOODS_DIR): LoadedCatalog {
  const issues: CatalogIssue[] = [];
  const meta = foodsMetaSchema.safeParse(JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")));
  if (!meta.success) {
    issues.push(
      ...meta.error.issues.map((i) => ({
        path: `meta.json:${i.path.join(".")}`,
        message: i.message,
      })),
    );
  }

  const foods: Food[] = [];
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "meta.json")
    .sort();
  for (const file of files) {
    const category = file.replace(/\.json$/, "");
    if (!(CATEGORIES as readonly string[]).includes(category)) {
      issues.push({ path: file, message: "o nome do ficheiro tem de ser uma categoria" });
      continue;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dir, file), "utf8"));
    } catch (err) {
      issues.push({ path: file, message: `JSON inválido: ${(err as Error).message}` });
      continue;
    }
    const parsed = foodFileSchema.safeParse(raw);
    if (!parsed.success) {
      issues.push(
        ...parsed.error.issues.map((i) => ({
          path: `${file}:${i.path.join(".")}`,
          message: i.message,
        })),
      );
      continue;
    }
    for (const food of parsed.data) {
      if (food.category !== category) {
        issues.push({
          path: `${file}:${food.id}`,
          message: `categoria "${food.category}" no ficheiro errado`,
        });
      }
      foods.push(food as Food);
    }
  }
  issues.push(...checkCatalog(foods, options));

  // Ordem estável: pela ordem das categorias e depois pelo id
  const order = new Map(CATEGORIES.map((c, i) => [c, i]));
  foods.sort(
    (a, b) =>
      (order.get(a.category) ?? 0) - (order.get(b.category) ?? 0) || a.id.localeCompare(b.id),
  );

  return {
    foods,
    foodDataVersion: meta.success ? meta.data.foodDataVersion : 0,
    source: meta.success ? meta.data.source : "",
    issues,
  };
}
