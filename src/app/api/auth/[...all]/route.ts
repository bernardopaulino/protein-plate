import { authStatusMetric, once } from "@/domain/ops-metrics";
import { AUTH_BODY_MAX_BYTES, isAllowedAuthRoute } from "@/server/auth/config";
import { getAuth } from "@/server/auth/session";
import { countRequestOps } from "@/server/ops";

/**
 * Better Auth em /api/auth/*: só os endpoints da allowlist ficam acessíveis (os outros dão 404),
 * com um limite de tamanho para o corpo.
 */
async function authResponse(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (!isAllowedAuthRoute(request.method, pathname)) {
    return Response.json({ code: "NOT_FOUND" }, { status: 404 });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > AUTH_BODY_MAX_BYTES) {
    return Response.json({ code: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }
  const auth = await getAuth();
  return auth.handler(request);
}

/** Conta as respostas que interessam ao backoffice (recusas, limites e erros, os 5xx juntos). */
async function handle(request: Request): Promise<Response> {
  let response: Response;
  try {
    response = await authResponse(request);
  } catch (err) {
    countRequestOps({ "auth.5xx": 1 });
    throw err;
  }
  const metric = authStatusMetric(response.status);
  if (metric) countRequestOps(once(metric));
  return response;
}

export const GET = handle;
export const POST = handle;
