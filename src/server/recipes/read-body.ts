import { isCrossOrigin } from "../origin";

/** Corpo máximo dos pedidos de receitas (só campos fechados). */
export const BODY_MAX_BYTES = 4 * 1024;

/**
 * Lê o JSON de um pedido às rotas das receitas: recusa outras origens, corpos grandes (antes de os
 * ler, pelo Content-Length, e depois, para pedidos sem ele) e JSON inválido.
 */
export async function readRecipeBody(
  request: Request,
): Promise<{ ok: true; raw: unknown } | { ok: false; status: 400 | 403 | 413 }> {
  if (isCrossOrigin(request)) return { ok: false, status: 403 };
  if (Number(request.headers.get("content-length") ?? 0) > BODY_MAX_BYTES) {
    return { ok: false, status: 413 };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > BODY_MAX_BYTES) return { ok: false, status: 413 };
  try {
    return { ok: true, raw: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400 };
  }
}
