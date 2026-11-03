// zod/mini: chega ao cliente pelo guest store (ver common.ts).
import { z } from "zod/mini";
import { mealSchema, portionCountSchema, portionIdSchema, slugSchema } from "./common";

/** Máximo de itens num dia (muito acima de um dia real; protege a D1 e o localStorage). */
export const PLAN_MAX_ITEMS = 60;

export const planItemSchema = z
  .object({
    id: z.string().check(z.minLength(1), z.maxLength(64)),
    meal: mealSchema,
    foodId: slugSchema,
    portionId: portionIdSchema,
    count: portionCountSchema,
  })
  .check(
    z.refine((i) => i.portionId.startsWith(`${i.foodId}:`), {
      message: "a porção não é deste alimento",
      path: ["portionId"],
    }),
  );

export type PlanItemInput = z.infer<typeof planItemSchema>;

export const planItemsSchema = z.array(planItemSchema).check(z.maxLength(PLAN_MAX_ITEMS));
