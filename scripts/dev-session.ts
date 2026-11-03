/**
 * Sessão de teste na D1 LOCAL (e2e e desenvolvimento), sem passar pelo Google nem pela Apple.
 *
 *   npx tsx --env-file=.dev.vars scripts/dev-session.ts [email] [--fresh]
 *
 * Cria (ou reaproveita) a pessoa com esse email e uma sessão nova, e escreve em JSON o nome e o
 * valor do cookie (assinado com BETTER_AUTH_SECRET, como o Better Auth faz). `--fresh` apaga o
 * perfil antes, para o formulário de boas-vindas aparecer outra vez. Só mexe na base local
 * (wrangler d1 execute --local): nunca em staging nem em produção.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const COOKIE_NAME = "pp.session_token";
const args = process.argv.slice(2);
const email = (args.find((a) => !a.startsWith("--")) ?? "teste@protein-plate.local").toLowerCase();
const fresh = args.includes("--fresh");

if (!/^[a-z0-9._+-]+@[a-z0-9.-]+$/.test(email)) {
  console.error("Email inválido.");
  process.exit(1);
}
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32) {
  console.error("Falta BETTER_AUTH_SECRET (corre com --env-file=.dev.vars).");
  process.exit(1);
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return encodeURIComponent(`${value}.${base64}`);
}

const now = Date.now();
const userId = `dev-${email.replace(/[^a-z0-9]/g, "-")}`.slice(0, 60);
const token = crypto.randomUUID().replace(/-/g, "");
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const sql = [
  `INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (${q(userId)}, 'Pessoa de teste', ${q(email)}, 1, ${now}, ${now}) ON CONFLICT(id) DO NOTHING;`,
  fresh ? `DELETE FROM profiles WHERE user_id = ${q(userId)};` : "",
  fresh ? `DELETE FROM day_plans WHERE user_id = ${q(userId)};` : "",
  `INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id) VALUES (${q(crypto.randomUUID())}, ${now + 7 * 24 * 3600 * 1000}, ${q(token)}, ${now}, ${now}, ${q(userId)});`,
]
  .filter(Boolean)
  .join("\n");

const dir = mkdtempSync(join(tmpdir(), "pp-session-"));
const file = join(dir, "session.sql");
writeFileSync(file, sql);
try {
  execFileSync("npx", ["wrangler", "d1", "execute", "DB", "--local", `--file=${file}`], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(JSON.stringify({ userId, name: COOKIE_NAME, value: await sign(token) }));
