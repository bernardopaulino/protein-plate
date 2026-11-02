import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { symmetricDecrypt } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { and, eq } from "drizzle-orm";
import type { AppEnv } from "@/lib/env";
import type { Db } from "../db/client-core";
import * as authSchema from "../db/auth-schema";
import { appleClientSecret, revokeAppleToken, type AppleCredentials } from "./apple";
import { CONSENT_COOKIE, FRESH_SESSION_SECONDS, SESSION_EXPIRES_IN } from "./config";

const NAME_MAX_CHARS = 80;

/** Do perfil do Google ou da Apple só fica o nome (sem fotografia). */
function socialProfileToUser(profile: { name?: unknown }) {
  const name = typeof profile.name === "string" ? profile.name.trim().slice(0, NAME_MAX_CHARS) : "";
  return { name, image: undefined };
}

export function appleCredentials(env: AppEnv): AppleCredentials | null {
  const { APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY } = env;
  if (!APPLE_CLIENT_ID || !APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) return null;
  return {
    clientId: APPLE_CLIENT_ID,
    teamId: APPLE_TEAM_ID,
    keyId: APPLE_KEY_ID,
    privateKey: APPLE_PRIVATE_KEY,
  };
}

export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/**
 * Better Auth por pedido (o cliente Drizzle é do pedido). Login só Google e Apple, por redirect.
 * Regras (secção 7): conta nova só a partir de "Criar conta" com os termos aceites; sem ligação
 * implícita entre contas com o mesmo email; apagar conta só com um login acabado de fazer; a Apple
 * revoga os tokens; sessões sem IP nem user agent.
 */
export async function createAuth(
  env: AppEnv,
  db: Db,
  options: { waitUntil?: (p: Promise<unknown>) => void } = {},
) {
  const apple = appleCredentials(env);
  const google =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
      : null;

  return betterAuth({
    appName: "Protein Plate",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BETTER_AUTH_URL, "https://appleid.apple.com"],
    // A D1 não suporta transações interativas
    database: drizzleAdapter(db, { provider: "sqlite", schema: authSchema, transaction: false }),
    emailAndPassword: { enabled: false },
    session: {
      expiresIn: SESSION_EXPIRES_IN,
      updateAge: 24 * 60 * 60,
      // Apagar a conta (sem password) só com uma sessão criada há menos de 5 minutos
      freshAge: FRESH_SESSION_SECONDS,
    },
    socialProviders: {
      ...(google
        ? {
            google: {
              ...google,
              disableImplicitSignUp: true,
              prompt: "select_account" as const,
              mapProfileToUser: socialProfileToUser,
            },
          }
        : {}),
      ...(apple
        ? {
            apple: {
              clientId: apple.clientId,
              clientSecret: await appleClientSecret(apple),
              disableImplicitSignUp: true,
              mapProfileToUser: socialProfileToUser,
            },
          }
        : {}),
    },
    account: {
      // Um login com o email de outra conta não entra nela
      accountLinking: { enabled: false, disableImplicitLinking: true },
      // O refresh token da Apple (para a revogar ao apagar a conta) fica cifrado
      encryptOAuthTokens: true,
    },
    user: {
      deleteUser: {
        enabled: true,
        // A Apple exige revogar os tokens; o resto apaga-se em cascata (perfil, dias, itens,
        // receitas guardadas, sessões e contas)
        beforeDelete: async (user) => {
          if (!apple) return;
          const rows = await db
            .select({ refreshToken: authSchema.account.refreshToken })
            .from(authSchema.account)
            .where(
              and(
                eq(authSchema.account.userId, user.id),
                eq(authSchema.account.providerId, "apple"),
              ),
            );
          for (const row of rows) {
            if (!row.refreshToken) continue;
            const refreshToken = await symmetricDecrypt({
              key: env.BETTER_AUTH_SECRET,
              data: row.refreshToken,
            }).catch(() => null);
            if (refreshToken) {
              const ok = await revokeAppleToken(apple, refreshToken).catch(() => false);
              if (!ok) console.warn(JSON.stringify({ level: "warn", msg: "apple_revoke_failed" }));
            }
          }
        },
      },
    },
    databaseHooks: {
      account: {
        // Minimização: só fica o refresh token da Apple (cifrado), que serve para revogar
        create: {
          before: async (account) => ({
            data: {
              ...account,
              idToken: null,
              accessToken: null,
              accessTokenExpiresAt: null,
              refreshToken: account.providerId === "apple" ? account.refreshToken : null,
            },
          }),
        },
        update: {
          before: async (account) => ({
            data: {
              ...account,
              idToken: null,
              accessToken: null,
              accessTokenExpiresAt: null,
              ...(account.providerId && account.providerId !== "apple"
                ? { refreshToken: null }
                : {}),
            },
          }),
        },
      },
      session: {
        // Minimização: a sessão não guarda IP nem user agent
        create: {
          before: async (session) => ({ data: { ...session, ipAddress: null, userAgent: null } }),
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Conta nova só depois de aceitar os termos no ecrã "Criar conta" (cookie de 10 minutos)
        if (ctx.path === "/sign-in/social" && ctx.body?.requestSignUp === true) {
          const consent = readCookie(ctx.headers?.get("cookie"), CONSENT_COOKIE);
          if (!consent) {
            throw new APIError("FORBIDDEN", {
              message: "Consent required",
              code: "CONSENT_REQUIRED",
            });
          }
        }
        // Sem ID tokens vindos do browser: o login é sempre por redirect
        if (ctx.path === "/sign-in/social" && ctx.body?.idToken !== undefined) {
          throw new APIError("BAD_REQUEST", {
            message: "Redirect sign-in only",
            code: "INVALID_REQUEST",
          });
        }
      }),
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: {
        "/delete-user": { window: 60, max: 5 },
        "/sign-in/social": { window: 60, max: 10 },
      },
    },
    advanced: {
      cookiePrefix: "pp",
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.BETTER_AUTH_URL.startsWith("https://"),
      },
      ...(options.waitUntil ? { backgroundTasks: { handler: options.waitUntil } } : {}),
    },
    onAPIError: { errorURL: "/conta" },
    logger: {
      // Explícito: os registos "info" do Better Auth podem ter emails
      level: "warn",
      // Só a mensagem, curta e numa linha: os erros do Drizzle trazem os parâmetros das queries
      log: (level, message) => {
        const text = `[better-auth] ${String(message).split("\nparams:")[0]}`
          .replace(/\p{Cc}+/gu, " ")
          .slice(0, 300);
        if (level === "error") console.error(text);
        else console.warn(text);
      },
    },
    plugins: [nextCookies()],
  });
}

export type Auth = Awaited<ReturnType<typeof createAuth>>;
