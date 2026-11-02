/** Os únicos endpoints do Better Auth que a app usa; todos os outros respondem 404. */
export const AUTH_ROUTES: ReadonlySet<string> = new Set([
  // Login por redirect (web): Google e Apple
  "POST /sign-in/social",
  "GET /callback/google",
  "GET /callback/apple",
  // A Apple devolve o código por form_post
  "POST /callback/apple",
  "POST /sign-out",
  "GET /get-session",
  // O ecrã de apagar conta pede o login com o provider da conta
  "GET /list-accounts",
  "POST /delete-user",
]);

/** `METHOD /caminho` relativo a /api/auth, para comparar com AUTH_ROUTES. */
export function authRouteKey(method: string, pathname: string): string {
  const path = pathname.replace(/^\/api\/auth/, "").replace(/\/+$/, "") || "/";
  return `${method.toUpperCase()} ${path}`;
}

export function isAllowedAuthRoute(method: string, pathname: string): boolean {
  return AUTH_ROUTES.has(authRouteKey(method, pathname));
}

/** Apagar a conta exige um login acabado de fazer (segundos). */
export const FRESH_SESSION_SECONDS = 5 * 60;

/** Duração da sessão (segundos). */
export const SESSION_EXPIRES_IN = 30 * 24 * 60 * 60;

/** Cookie que prova que a pessoa aceitou os termos no ecrã "Criar conta" (10 minutos). */
export const CONSENT_COOKIE = "pp_consent";
export const CONSENT_COOKIE_MAX_AGE = 10 * 60;

/** Corpo máximo dos pedidos de autenticação. */
export const AUTH_BODY_MAX_BYTES = 8 * 1024;

/** Validade do client secret da Apple (máximo da Apple: 6 meses). */
export const APPLE_SECRET_TTL_SECONDS = 180 * 24 * 60 * 60;
