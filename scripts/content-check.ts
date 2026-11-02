/**
 * Valida content/foods/*.json com Zod (secção 4): campos obrigatórios, ids únicos, proteína 0–90 g,
 * porções 5–500 g, uma porção default, ultraprocessados só nas exceções. Os marcadores TODO (valores
 * por confirmar na TCA) só passam com --allow-todo (desenvolvimento e staging); a produção não.
 */
import { loadCatalog } from "./lib/content";

const allowTodo = process.argv.includes("--allow-todo");
const catalog = loadCatalog({ allowTodo });

if (catalog.issues.length > 0) {
  console.error(`content:check falhou (${catalog.issues.length} problemas):`);
  for (const issue of catalog.issues) console.error(`  - ${issue.path}: ${issue.message}`);
  process.exit(1);
}

const todo = catalog.foods.filter((f) => f.tcaCode === "TODO").length;
console.log(
  `content:check ok: ${catalog.foods.length} alimentos, FOOD_DATA_VERSION ${catalog.foodDataVersion}` +
    (todo > 0 ? ` (${todo} por confirmar na TCA)` : ""),
);
