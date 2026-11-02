import { generateText } from "ai";
import { count } from "drizzle-orm";
import { mockModel } from "@/server/ai/model";
import { getDb } from "@/server/db/client";
import { foods } from "@/server/db/schema";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

/**
 * Verificação do Worker: lê da D1 e, com a IA simulada, chama o modelo (nunca chama o modelo real,
 * para não gastar). Sem dados pessoais.
 */
export async function GET() {
  const env = getEnv();
  const started = Date.now();
  const [row] = await getDb().select({ n: count() }).from(foods);
  let ai: string = env.AI_MODE;
  if (env.AI_MODE === "mock") {
    const { text } = await generateText({ model: mockModel(() => "ok"), prompt: "ping" });
    ai = `mock:${text}`;
  }
  return Response.json(
    { ok: true, env: env.APP_ENV, foods: row?.n ?? 0, ai, ms: Date.now() - started },
    { headers: { "Cache-Control": "no-store" } },
  );
}
