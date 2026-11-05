import {
  recipeRequestSchema,
  type RecipeErrorCode,
  type RecipeResponse,
} from "@/domain/contracts/recipe";
import { once, recipeOutcomeMetric } from "@/domain/ops-metrics";
import { FOOD_DATA_VERSION } from "@/content/foods.generated";
import { CATALOG, FOOD_INDEX } from "@/features/catalog/catalog";
import { getSession } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getBindings, getEnv } from "@/server/env";
import { countRequestOps } from "@/server/ops";
import { generateRecipe } from "@/server/recipes/generate";
import { readRecipeBody } from "@/server/recipes/read-body";
import { loadProfile, recordRecipeHistory } from "@/server/services/account";

export const dynamic = "force-dynamic";

function json(body: RecipeResponse, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Registos em JSON, sem dados pessoais (sem corpo do pedido, emails nem IPs). */
function log(event: Record<string, unknown>) {
  console.log(JSON.stringify({ route: "/api/recipes", ...event }));
}

/** Recusado antes do pipeline (que conta os seus próprios resultados). */
function reject(code: RecipeErrorCode, status: number) {
  countRequestOps(once(recipeOutcomeMetric({ ok: false, code })));
  return json({ ok: false, code }, status);
}

/** POST /api/recipes: contrato público (também para a futura app). Exige login e perfil. */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    return await handle(request, requestId);
  } catch (err) {
    // Erro inesperado: conta e regista só o nome (a mensagem pode trazer dados do pedido); a
    // resposta continua a ser a do Next (o contrato não tem um código para isto)
    countRequestOps({ "recipes.5xx": 1 });
    log({ requestId, msg: "recipe_unhandled", name: err instanceof Error ? err.name : "unknown" });
    throw err;
  }
}

async function handle(request: Request, requestId: string) {
  const started = Date.now();
  const env = getEnv();
  const body = await readRecipeBody(request);
  if (!body.ok) return reject("invalid_request", body.status);
  const parsed = recipeRequestSchema.safeParse(body.raw);
  if (!parsed.success) return reject("invalid_request", 400);

  const session = await getSession();
  if (!session) return reject("unauthorized", 401);
  const db = getDb();
  const profile = await loadProfile(db, session.user.id);
  if (!profile?.onboardedAt) return reject("onboarding_required", 403);

  const bindings = getBindings();
  const result = await generateRecipe(
    parsed.data,
    { userId: session.user.id, profile },
    {
      db,
      env,
      foods: CATALOG,
      foodIndex: FOOD_INDEX,
      foodDataVersion: FOOD_DATA_VERSION,
      rateLimit: async (key) => (await bindings.RECIPE_LIMITER.limit({ key })).success,
      log: (event) => log({ requestId, ...event }),
      count: countRequestOps,
    },
  );

  log({
    requestId,
    status: result.ok ? 200 : result.status,
    code: result.ok ? undefined : result.code,
    cached: result.ok ? result.cached : undefined,
    ms: Date.now() - started,
  });
  if (!result.ok) return json({ ok: false, code: result.code }, result.status);
  // Fica no histórico da pessoa ("Recentes" em /receitas), também quando veio da cache
  await recordRecipeHistory(db, session.user.id, result.id);
  return json({ ok: true, id: result.id, cached: result.cached }, 200);
}
