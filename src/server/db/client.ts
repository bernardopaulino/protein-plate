import "server-only";
import { cache } from "react";
import { getBindings } from "../env";
import { createDb, type Db } from "./client-core";

export { createDb, schema, type Db } from "./client-core";

/** Cliente por pedido, nunca global (a D1 do pedido vem do contexto da Cloudflare). */
export const getDb = cache((): Db => createDb(getBindings().DB));
