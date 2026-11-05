import { z } from "zod";
import {
  ALLERGENS,
  CATEGORIES,
  PROCESSING_EXCEPTIONS,
  PROCESSING_LEVELS,
  ROLES,
  WEIGHT_BASES,
  type Food,
} from "../food";
import { MEALS } from "../meals";
import { portionIdSchema, slugSchema } from "./common";

/** Marcador de curadoria: alimento ainda sem os valores confirmados na TCA. */
export const TODO = "TODO";

/**
 * Valores de referência revistos (alinhados com a TCA e tabelas equivalentes), sem o código do item
 * na TCA. Passa no content:check; quando o código for confirmado, substitui este marcador.
 */
export const TCA_REFERENCE = "REF";

/** Porção mínima (g) fora da despensa. */
export const PORTION_MIN_GRAMS = 5;

const localized = z
  .object({ pt: z.string().min(1).max(80), en: z.string().min(1).max(80) })
  .strict();

const nutrient = (max: number) => z.number().min(0).max(max);

export const portionSchema = z
  .object({
    id: portionIdSchema,
    label: localized,
    // 1 g só na despensa (uma pitada de sal); os outros alimentos a partir de 5 g (superRefine)
    grams: z.number().min(1).max(500),
    default: z.literal(true).optional(),
  })
  .strict();

export const foodSchema = z
  .object({
    id: slugSchema,
    name: localized,
    category: z.enum(CATEGORIES),
    role: z.enum(ROLES),
    proteinPer100g: nutrient(90),
    kcalPer100g: nutrient(900),
    carbsPer100g: nutrient(100),
    fatPer100g: nutrient(100),
    weightBasis: z.enum(WEIGHT_BASES),
    processing: z.enum(PROCESSING_LEVELS),
    portions: z.array(portionSchema).min(1).max(6),
    moments: z.array(z.enum(MEALS)).min(1),
    ease: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    exampleRank: z.number().int().min(0).max(100),
    allergens: z.array(z.enum(ALLERGENS)).max(6),
    tcaCode: z.string().min(1).max(20),
    ideas: z
      .object({
        pt: z.array(z.string().min(1).max(140)).max(5),
        en: z.array(z.string().min(1).max(140)).max(5),
      })
      .strict(),
  })
  .strict()
  .superRefine((food, ctx) => {
    const defaults = food.portions.filter((p) => p.default).length;
    if (defaults !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["portions"],
        message: `tem ${defaults} porções default (tem de ser 1)`,
      });
    }
    const portionIds = food.portions.map((p) => p.id);
    if (new Set(portionIds).size !== portionIds.length) {
      ctx.addIssue({ code: "custom", path: ["portions"], message: "ids de porção repetidos" });
    }
    for (const [i, p] of food.portions.entries()) {
      if (food.role !== "pantry" && p.grams < PORTION_MIN_GRAMS) {
        ctx.addIssue({
          code: "custom",
          path: ["portions", i, "grams"],
          message: `porções entre ${PORTION_MIN_GRAMS} e 500 g (só a despensa aceita menos)`,
        });
      }
      if (!p.id.startsWith(`${food.id}:`)) {
        ctx.addIssue({
          code: "custom",
          path: ["portions", i, "id"],
          message: `tem de começar por "${food.id}:"`,
        });
      }
    }
    if (food.processing === "ultra" && !PROCESSING_EXCEPTIONS.includes(food.id)) {
      ctx.addIssue({
        code: "custom",
        path: ["processing"],
        message: "ultraprocessado fora da lista de exceções (PROCESSING_EXCEPTIONS)",
      });
    }
    if (new Set(food.moments).size !== food.moments.length) {
      ctx.addIssue({ code: "custom", path: ["moments"], message: "momentos repetidos" });
    }
    if (new Set(food.allergens).size !== food.allergens.length) {
      ctx.addIssue({ code: "custom", path: ["allergens"], message: "alergénios repetidos" });
    }
  });

/** Um ficheiro content/foods/<categoria>.json */
export const foodFileSchema = z.array(foodSchema);

export const foodsMetaSchema = z
  .object({
    /** Incrementa a cada alteração dos alimentos (entra na cache das receitas). */
    foodDataVersion: z.number().int().positive(),
    source: z.string(),
  })
  .strict();

export interface CatalogIssue {
  path: string;
  message: string;
}

/** Validações entre ficheiros: ids únicos e marcadores TODO (só aceites com allowTodo). */
export function checkCatalog(
  foods: readonly Food[],
  options: { allowTodo: boolean },
): CatalogIssue[] {
  const issues: CatalogIssue[] = [];
  const seen = new Set<string>();
  for (const food of foods) {
    if (seen.has(food.id)) issues.push({ path: food.id, message: "id repetido" });
    seen.add(food.id);
    if (!options.allowTodo && food.tcaCode === TODO) {
      issues.push({ path: `${food.id}.tcaCode`, message: "valores por confirmar na TCA (TODO)" });
    }
  }
  return issues;
}
