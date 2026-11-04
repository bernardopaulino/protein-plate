import type { Ease } from "@/domain/food";
import type { FoodSection, FoodSubgroup } from "@/domain/food-groups";

/**
 * Um alimento do catálogo como o browser o recebe (ver catalogItems). Compacto de propósito: vai
 * no HTML da página, 168 vezes.
 */
export interface CatalogItem {
  id: string;
  name: string;
  /** Nome em inglês, normalizado (a pesquisa também o encontra) */
  en: string;
  /** A porção por defeito */
  portion: string;
  /** Proteína da porção por defeito (calculada pela app) */
  protein: number;
  /** Categoria já traduzida */
  category: string;
  ease: Ease;
  /** Refeições em que encaixa: o bit i é MEALS[i] */
  meals: number;
  subgroup: FoodSubgroup;
  /** Nos empates dentro de um subgrupo, os mais usados primeiro */
  rank: number;
  /** Ilustração: o nome do ficheiro em /images/foods, sem extensão */
  image: string;
}

/** A ilustração de um alimento do índice. */
export function catalogImage(item: Pick<CatalogItem, "image">): string {
  return `/images/foods/${item.image}.webp`;
}

export interface CatalogGroup<Id extends string = string> {
  id: Id;
  title: string;
  image: string | undefined;
}

export interface CatalogSection extends CatalogGroup<FoodSection> {
  subgroups: CatalogGroup<FoodSubgroup>[];
}
