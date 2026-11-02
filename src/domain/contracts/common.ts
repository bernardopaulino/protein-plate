import { z } from "zod";
import { MEALS } from "../meals";
import { INTENSITY_KEYS, type Intensity } from "../goal";
import { MANUAL_TARGET_LIMITS } from "../goal";
import { PORTION_COUNT } from "../protein";

/** Identificadores estáveis dos alimentos (ex.: atum-lata-natural). */
export const slugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug inválido");

/** `<foodId>:<slug>` */
export const portionIdSchema = z
  .string()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/, "id de porção inválido");

export const mealSchema = z.enum(MEALS);

export const intensitySchema = z.enum(INTENSITY_KEYS as [Intensity, ...Intensity[]]);

export const localeSchema = z.enum(["pt", "en"]);

export const dailyTargetSchema = z
  .number()
  .int()
  .min(MANUAL_TARGET_LIMITS.min)
  .max(MANUAL_TARGET_LIMITS.max);

export const portionCountSchema = z
  .number()
  .min(PORTION_COUNT.min)
  .max(PORTION_COUNT.max)
  .refine((n) => Number.isInteger(n / PORTION_COUNT.step), "passos de 0,5");

/** Refeições escolhidas: 2 a 6, sem repetidas. */
export const mealsSchema = z
  .array(mealSchema)
  .min(2)
  .max(6)
  .refine((ms) => new Set(ms).size === ms.length, "refeições repetidas");
