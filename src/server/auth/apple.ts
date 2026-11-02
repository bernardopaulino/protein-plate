import { SignJWT, importPKCS8 } from "jose";
import { APPLE_SECRET_TTL_SECONDS } from "./config";

const APPLE_ISSUER = "https://appleid.apple.com";
const REVOKE_URL = `${APPLE_ISSUER}/auth/revoke`;

export interface AppleCredentials {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
}

let cached: { key: string; secret: string; expiresAt: number } | undefined;

/**
 * Client secret da Apple: JWT ES256 assinado com a chave "Sign in with Apple" (.p8), válido 180
 * dias. Gerado com jose e guardado em memória no isolate até faltar um dia para expirar.
 */
export async function appleClientSecret(
  creds: AppleCredentials,
  now = Date.now(),
): Promise<string> {
  const cacheKey = `${creds.clientId}:${creds.teamId}:${creds.keyId}`;
  if (cached && cached.key === cacheKey && cached.expiresAt - now > 24 * 3600 * 1000) {
    return cached.secret;
  }
  const iat = Math.floor(now / 1000);
  const exp = iat + APPLE_SECRET_TTL_SECONDS;
  const key = await importPKCS8(creds.privateKey.replace(/\\n/g, "\n"), "ES256");
  const secret = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: creds.keyId })
    .setIssuer(creds.teamId)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setAudience(APPLE_ISSUER)
    .setSubject(creds.clientId)
    .sign(key);
  cached = { key: cacheKey, secret, expiresAt: exp * 1000 };
  return secret;
}

/** Revoga o refresh token da Apple ao apagar a conta (exigência da Apple). */
export async function revokeAppleToken(
  creds: AppleCredentials,
  refreshToken: string,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  const response = await fetcher(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: await appleClientSecret(creds),
      token: refreshToken,
      token_type_hint: "refresh_token",
    }),
  });
  return response.ok;
}
