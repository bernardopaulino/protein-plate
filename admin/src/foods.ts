import { FOODS } from "../../src/content/foods.generated";
import type { Category, Role } from "../../src/domain/food";

/**
 * O catálogo da app (src/content/foods.generated.ts, gerado de content/foods), só para dar nome
 * aos ids que a base guarda. A base não tem chave estrangeira para os alimentos: um id que já
 * não está no catálogo aparece tal como está, marcado como "fora do catálogo".
 */

export interface CatalogFood {
  id: string;
  name: string;
  category: Category;
  role: Role;
}

export const CATALOG: readonly CatalogFood[] = FOODS.map((f) => ({
  id: f.id,
  name: f.name.pt,
  category: f.category,
  role: f.role,
}));

const BY_ID: ReadonlyMap<string, CatalogFood> = new Map(CATALOG.map((f) => [f.id, f]));

export function catalogFood(id: string): CatalogFood | undefined {
  return BY_ID.get(id);
}

/** O nome em português, ou o próprio id se já não estiver no catálogo. */
export function foodName(id: string): string {
  return BY_ID.get(id)?.name ?? id;
}
