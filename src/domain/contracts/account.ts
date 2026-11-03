import { z } from "zod";
import { mealSchema, portionCountSchema, portionIdSchema, slugSchema } from "./common";
import { planItemsSchema } from "./plan";

export { CONSENT_VERSION } from "./profile";

/**
 * O dia do "Hoje", gravado depois de cada mudança. A meta e as refeições vêm do perfil no servidor,
 * nunca daqui; os ids dos itens são gerados de novo no servidor.
 */
export const saveDayInputSchema = z
  .object({
    items: planItemsSchema,
  })
  .strict();

export type SaveDayInput = z.infer<typeof saveDayInputSchema>;

/** "Adicionar ao meu dia" a partir do catálogo. */
export const addToDayInputSchema = z
  .object({
    meal: mealSchema,
    foodId: slugSchema,
    portionId: portionIdSchema,
    count: portionCountSchema,
  })
  .strict()
  .refine((i) => i.portionId.startsWith(`${i.foodId}:`), {
    message: "a porção não é deste alimento",
    path: ["portionId"],
  });

export type AddToDayInput = z.infer<typeof addToDayInputSchema>;
