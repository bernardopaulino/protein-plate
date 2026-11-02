import { z } from "zod";

/** Chave secreta de teste do Turnstile (passa sempre): nunca pode chegar à produção. */
export const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

const optional = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined);

const positiveInt = z.coerce.number().int().positive();

/**
 * Variáveis e segredos do Worker (wrangler.jsonc + .dev.vars / wrangler secret). O Worker não
 * arranca sem segredos válidos: worker/index.ts valida isto antes de servir qualquer pedido.
 */
export const envSchema = z
  .object({
    APP_ENV: z.enum(["local", "staging", "production"]),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32, "mínimo 32 caracteres"),
    GOOGLE_CLIENT_ID: optional,
    GOOGLE_CLIENT_SECRET: optional,
    APPLE_CLIENT_ID: optional,
    APPLE_TEAM_ID: optional,
    APPLE_KEY_ID: optional,
    APPLE_PRIVATE_KEY: optional,
    AI_MODE: z.enum(["live", "mock"]),
    AI_MODEL: z.string().min(1),
    AI_DAILY_LIMIT: positiveInt,
    QUOTA_GUEST: positiveInt,
    QUOTA_USER: positiveInt,
    ANTHROPIC_API_KEY: optional,
    TURNSTILE_SITE_KEY: z.string(),
    TURNSTILE_SECRET_KEY: z.string().min(1),
    IP_HASH_SECRET: z.string().min(32, "mínimo 32 caracteres"),
  })
  .superRefine((env, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (env.AI_MODE === "live" && !env.ANTHROPIC_API_KEY) {
      issue("ANTHROPIC_API_KEY", "obrigatória com AI_MODE=live");
    }
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      issue("GOOGLE_CLIENT_SECRET", "o Google precisa do ID e do segredo");
    }
    const apple = [env.APPLE_CLIENT_ID, env.APPLE_TEAM_ID, env.APPLE_KEY_ID, env.APPLE_PRIVATE_KEY];
    if (apple.some(Boolean) && !apple.every(Boolean)) {
      issue("APPLE_PRIVATE_KEY", "a Apple precisa do Services ID, Team ID, Key ID e chave");
    }
    if (env.APP_ENV === "production") {
      if (env.AI_MODE !== "live") issue("AI_MODE", "a produção usa o modelo real");
      if (env.TURNSTILE_SECRET_KEY === TURNSTILE_TEST_SECRET) {
        issue("TURNSTILE_SECRET_KEY", "a chave de teste não pode ir para produção");
      }
      if (!env.BETTER_AUTH_URL.startsWith("https://")) {
        issue("BETTER_AUTH_URL", "a produção usa HTTPS");
      }
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

const parsed = new WeakMap<object, AppEnv>();

export class InvalidEnvError extends Error {
  constructor(readonly fields: string[]) {
    // Só os nomes das variáveis: os valores nunca vão para os registos
    super(`Configuração inválida: ${fields.join(", ")}`);
    this.name = "InvalidEnvError";
  }
}

/** Valida (uma vez por objeto de bindings) e devolve as variáveis tipadas. */
export function parseEnv(raw: object): AppEnv {
  const cached = parsed.get(raw);
  if (cached) return cached;
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new InvalidEnvError([...new Set(result.error.issues.map((i) => i.path.join(".")))]);
  }
  parsed.set(raw, result.data);
  return result.data;
}
