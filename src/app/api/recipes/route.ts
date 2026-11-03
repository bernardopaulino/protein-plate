import { recipeRequestSchema, type RecipeResponse } from "@/domain/contracts/recipe";
import { FOOD_DATA_VERSION } from "@/content/foods.generated";
import { CATALOG, FOOD_INDEX } from "@/features/catalog/catalog";
import { getSession } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getBindings, getEnv } from "@/server/env";
import { generateRecipe } from "@/server/recipes/generate";
import { loadProfile } from "@/server/services/account";

export const dynamic = "force-dynamic";

/** Corpo máximo do pedido (só campos fechados). */
const BODY_MAX_BYTES = 4 * 1024;

function json(body: RecipeResponse, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Registos em JSON, sem dados pessoais (sem corpo do pedido, emails nem IPs). */
function log(event: Record<string, unknown>) {
  console.log(JSON.stringify({ route: "/api/recipes", ...event }));
}

/** POST /api/recipes: contrato público (também para a futura app). Exige login e perfil. */
export async function POST(request: Request) {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const text = await request.text();
  if (new TextEncoder().encode(text).length > BODY_MAX_BYTES) {
    return json({ ok: false, code: "invalid_request" }, 413);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json({ ok: false, code: "invalid_request" }, 400);
  }
  const parsed = recipeRequestSchema.safeParse(raw);
  if (!parsed.success) return json({ ok: false, code: "invalid_request" }, 400);

  const session = await getSession();
  if (!session) return json({ ok: false, code: "unauthorized" }, 401);
  const db = getDb();
  const profile = await loadProfile(db, session.user.id);
  if (!profile?.onboardedAt) return json({ ok: false, code: "onboarding_required" }, 403);

  const env = getEnv();
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
  return json({ ok: true, id: result.id, cached: result.cached }, 200);
}
