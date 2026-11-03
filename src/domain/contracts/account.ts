import { z } from "zod";
import { planItemsSchema } from "./plan";

export { CONSENT_VERSION } from "./profile";

/**
 * O dia sincronizado pelo AccountSync. `owner` é a conta dona da cópia local (tem de ser a da
 * sessão); a meta e as refeições vêm do perfil no servidor, nunca daqui.
 */
export const syncDayInputSchema = z
  .object({
    owner: z.string().min(1).max(64),
    items: planItemsSchema,
  })
  .strict();

export type SyncDayInput = z.infer<typeof syncDayInputSchema>;
