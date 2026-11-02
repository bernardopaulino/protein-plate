/**
 * Gera, a partir de content/foods, o seed SQL da D1 (.seed/foods.sql) e o módulo tipado
 * (src/content/foods.generated.ts). Um teste confirma que coincidem.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadCatalog } from "./lib/content";
import { toSeedSql, toTypedModule } from "./lib/generate";

const root = join(import.meta.dirname, "..");
const catalog = loadCatalog({ allowTodo: true });
if (catalog.issues.length > 0) {
  console.error("content:build: o conteúdo tem erros (corre o content:check)");
  for (const issue of catalog.issues) console.error(`  - ${issue.path}: ${issue.message}`);
  process.exit(1);
}

mkdirSync(join(root, ".seed"), { recursive: true });
mkdirSync(join(root, "src", "content"), { recursive: true });
writeFileSync(join(root, ".seed", "foods.sql"), toSeedSql(catalog.foods, catalog.foodDataVersion));
writeFileSync(
  join(root, "src", "content", "foods.generated.ts"),
  toTypedModule(catalog.foods, catalog.foodDataVersion, catalog.source),
);
console.log(
  `content:build ok: ${catalog.foods.length} alimentos → .seed/foods.sql e src/content/foods.generated.ts`,
);
