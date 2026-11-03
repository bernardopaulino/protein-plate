// zod/mini: estes schemas chegam ao bundle do cliente (guest store), por isso usam a API funcional,
// que só leva para o bundle as verificações usadas. Os contratos só do servidor usam o Zod clássico.
import { z } from "zod/mini";
import { MEALS } from "../meals";
import { INTENSITY_KEYS, type Intensity } from "../goal";
import { MANUAL_TARGET_LIMITS } from "../goal";
import { PORTION_COUNT } from "../protein";

/** Identificadores estáveis dos alimentos (ex.: atum-lata-natural). */
export const slugSchema = z
  .string()
  .check(z.minLength(2), z.maxLength(60), z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug inválido"));

/** `<foodId>:<slug>` */
export const portionIdSchema = z
  .string()
  .check(
    z.maxLength(100),
    z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/, "id de porção inválido"),
  );

export const mealSchema = z.enum(MEALS);

export const intensitySchema = z.enum(INTENSITY_KEYS as [Intensity, ...Intensity[]]);

export const localeSchema = z.enum(["pt", "en"]);

export const dailyTargetSchema = z
  .int()
  .check(z.gte(MANUAL_TARGET_LIMITS.min), z.lte(MANUAL_TARGET_LIMITS.max));

export const portionCountSchema = z.number().check(
  z.gte(PORTION_COUNT.min),
  z.lte(PORTION_COUNT.max),
  z.refine((n) => Number.isInteger(n / PORTION_COUNT.step), "passos de 0,5"),
);

/** Refeições escolhidas: 2 a 6, sem repetidas. */
export const mealsSchema = z.array(mealSchema).check(
  z.minLength(2),
  z.maxLength(6),
  z.refine((ms) => new Set(ms).size === ms.length, "refeições repetidas"),
);
