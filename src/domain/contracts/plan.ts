import { z } from "zod";
import { mealSchema, portionCountSchema, portionIdSchema, slugSchema } from "./common";

/** Máximo de itens num dia (muito acima de um dia real; protege a D1 e o localStorage). */
export const PLAN_MAX_ITEMS = 60;

export const planItemSchema = z
  .object({
    id: z.string().min(1).max(64),
    meal: mealSchema,
    foodId: slugSchema,
    portionId: portionIdSchema,
    count: portionCountSchema,
  })
  .refine((i) => i.portionId.startsWith(`${i.foodId}:`), {
    message: "a porção não é deste alimento",
    path: ["portionId"],
  });

export type PlanItemInput = z.infer<typeof planItemSchema>;

export const planItemsSchema = z.array(planItemSchema).max(PLAN_MAX_ITEMS);
