/**
 * Validação do token do Cloudflare Access (cabeçalho Cf-Access-Jwt-Assertion), como manda a
 * documentação do Access: assinatura RS256 com as chaves públicas da equipa, `aud` com a tag
 * da aplicação, `iss` da equipa e validade. Só WebCrypto, sem dependências.
 */

/** Uma chave pública da equipa, como vem de /cdn-cgi/access/certs. */
export interface AccessKey {
  kid: string;
  kty: string;
  n: string;
  e: string;
}

/** Dá as chaves da equipa; `refresh` pede uma leitura nova (chave desconhecida: houve rotação). */
export type KeySource = (options: { refresh: boolean }) => Promise<AccessKey[]>;

export class AccessDenied extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "AccessDenied";
  }
}

/** Folga para relógios desacertados (segundos). */
const LEEWAY_S = 60;

/** Nome de equipa válido (o subdomínio de cloudflareaccess.com). */
export const TEAM_DOMAIN = /^[a-z0-9-]{1,63}$/;
/** A tag da aplicação: 64 caracteres hexadecimais. */
export const AUD_TAG = /^[0-9a-f]{64}$/;

export function issuerFor(teamDomain: string): string {
  return `https://${teamDomain}.cloudflareaccess.com`;
}

function base64UrlToBytes(text: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new AccessDenied("malformed");
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(part: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    // cai no erro abaixo
  }
  throw new AccessDenied("malformed");
}

/** Valida o token e devolve o email de quem entrou (em minúsculas). */
export async function verifyAccessJwt(
  token: string,
  {
    issuer,
    audience,
    getKeys,
    now = Date.now(),
  }: {
    issuer: string;
    audience: string;
    getKeys: KeySource;
    now?: number;
  },
): Promise<{ email: string }> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new AccessDenied("malformed");
  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];

  // Só RS256: recusa "none", HS256 e qualquer outro algoritmo vindo do próprio token
  const header = decodeJson(headerPart);
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new AccessDenied("bad_header");
  }
  let key = (await getKeys({ refresh: false })).find((k) => k.kid === header.kid);
  key ??= (await getKeys({ refresh: true })).find((k) => k.kid === header.kid);
  if (!key || key.kty !== "RSA") throw new AccessDenied("unknown_key");

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: key.n, e: key.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    base64UrlToBytes(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`),
  );
  if (!valid) throw new AccessDenied("bad_signature");

  const payload = decodeJson(payloadPart);
  const nowS = Math.floor(now / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= nowS - LEEWAY_S) {
    throw new AccessDenied("expired");
  }
  for (const claim of ["nbf", "iat"] as const) {
    const value = payload[claim];
    if (value !== undefined && (typeof value !== "number" || value > nowS + LEEWAY_S)) {
      throw new AccessDenied("not_yet_valid");
    }
  }
  if (payload.iss !== issuer) throw new AccessDenied("bad_issuer");
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(audience)) throw new AccessDenied("bad_audience");
  // Só pessoas: os tokens de serviço do Access não trazem email
  if (typeof payload.email !== "string" || payload.email === "") {
    throw new AccessDenied("no_email");
  }
  return { email: payload.email.toLowerCase() };
}

/** Quanto tempo as chaves ficam guardadas, e o intervalo mínimo entre leituras forçadas. */
const KEYS_TTL_MS = 60 * 60 * 1000;
const MIN_REFRESH_MS = 60 * 1000;

const keyCache = new Map<string, { keys: AccessKey[]; fetchedAt: number }>();

/** As chaves públicas da equipa, de /cdn-cgi/access/certs, guardadas em memória. */
export function accessKeySource(teamDomain: string, fetcher: typeof fetch = fetch): KeySource {
  return async ({ refresh }) => {
    const cached = keyCache.get(teamDomain);
    const age = cached ? Date.now() - cached.fetchedAt : Infinity;
    if (cached && age < (refresh ? MIN_REFRESH_MS : KEYS_TTL_MS)) {
      return cached.keys;
    }
    const res = await fetcher(`${issuerFor(teamDomain)}/cdn-cgi/access/certs`);
    if (!res.ok) throw new AccessDenied("keys_unavailable");
    const body = (await res.json()) as { keys?: unknown };
    const keys = Array.isArray(body.keys)
      ? body.keys.filter(
          (k): k is AccessKey =>
            typeof k?.kid === "string" &&
            typeof k?.kty === "string" &&
            typeof k?.n === "string" &&
            typeof k?.e === "string",
        )
      : [];
    keyCache.set(teamDomain, { keys, fetchedAt: Date.now() });
    return keys;
  };
}
