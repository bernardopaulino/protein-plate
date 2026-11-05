import {
  recipeDayRequestSchema,
  type RecipeDayResponse,
  type RecipeErrorCode,
} from "@/domain/contracts/recipe";
import { once, recipeOutcomeMetric } from "@/domain/ops-metrics";
import { FOOD_DATA_VERSION } from "@/content/foods.generated";
import { CATALOG, FOOD_INDEX } from "@/features/catalog/catalog";
import { getSession } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getBindings, getEnv } from "@/server/env";
import { countRequestOps } from "@/server/ops";
import { generateRecipeDay } from "@/server/recipes/generate-day";
import { readRecipeBody } from "@/server/recipes/read-body";
import { loadProfile, recordRecipeHistory } from "@/server/services/account";

export const dynamic = "force-dynamic";

function json(body: RecipeDayResponse, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Registos em JSON, sem dados pessoais (sem corpo do pedido, emails nem IPs). */
function log(event: Record<string, unknown>) {
  console.log(JSON.stringify({ route: "/api/recipes/day", ...event }));
}

function reject(code: RecipeErrorCode, status: number, remaining?: number) {
  countRequestOps(once(recipeOutcomeMetric({ ok: false, code })));
  return json({ ok: false, code, ...(remaining !== undefined ? { remaining } : {}) }, status);
}

/** POST /api/recipes/day: uma receita para cada refeição do dia da pessoa (secção 6). */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    return await handle(request, requestId);
  } catch (err) {
    countRequestOps({ "recipes.5xx": 1 });
    log({ requestId, msg: "day_unhandled", name: err instanceof Error ? err.name : "unknown" });
    throw err;
  }
}

async function handle(request: Request, requestId: string) {
  const started = Date.now();
  const env = getEnv();
  const body = await readRecipeBody(request);
  if (!body.ok) return reject("invalid_request", body.status);
  const parsed = recipeDayRequestSchema.safeParse(body.raw);
  if (!parsed.success) return reject("invalid_request", 400);

  const session = await getSession();
  if (!session) return reject("unauthorized", 401);
  const db = getDb();
  const profile = await loadProfile(db, session.user.id);
  if (!profile?.onboardedAt) return reject("onboarding_required", 403);

  const bindings = getBindings();
  const result = await generateRecipeDay(
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
    meals: result.ok ? result.recipes.length : undefined,
    failed: result.ok ? result.recipes.filter((r) => !r.ok).length : undefined,
    ms: Date.now() - started,
  });
  if (!result.ok) {
    return json(
      {
        ok: false,
        code: result.code,
        ...(result.remaining !== undefined ? { remaining: result.remaining } : {}),
      },
      result.status,
    );
  }
  // Ficam no histórico da pessoa, pela ordem do dia (a última refeição fica a mais recente)
  for (const recipe of result.recipes) {
    if (recipe.ok) await recordRecipeHistory(db, session.user.id, recipe.id);
  }
  return json(
    {
      ok: true,
      recipes: result.recipes.map((r) =>
        r.ok ? { meal: r.meal, ok: true, id: r.id } : { meal: r.meal, ok: false, code: r.code },
      ),
    },
    200,
  );
}
