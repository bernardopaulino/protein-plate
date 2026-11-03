import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import {
  accessKeySource,
  issuerFor,
  verifyAccessJwt,
  type AccessKey,
  type KeySource,
} from "../src/access";
import { createAdminApp } from "../src/app";
import { allowedEmails } from "../src/require-access";
import type { AdminBindings } from "../src/types";

const TEAM = "pp-test";
const AUD = "a".repeat(64);
const ADMIN = "admin@example.com";
const URL_REMOTE = "https://admin.protein-plate.app";

type KeyPair = { privateKey: CryptoKey; publicJwk: AccessKey };

async function newKeyPair(kid: string): Promise<KeyPair> {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
  return {
    privateKey: pair.privateKey,
    publicJwk: { kid, kty: "RSA", n: jwk.n ?? "", e: jwk.e ?? "" },
  };
}

function base64Url(data: string | ArrayBuffer): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const nowS = () => Math.floor(Date.now() / 1000);

/** Um token como o do Access, assinado com `key` (ou com cabeçalho e claims à escolha). */
async function sign(
  key: KeyPair,
  claims: Record<string, unknown> = {},
  header: Record<string, unknown> = {},
): Promise<string> {
  const head = base64Url(JSON.stringify({ alg: "RS256", kid: key.publicJwk.kid, ...header }));
  const body = base64Url(
    JSON.stringify({
      aud: [AUD],
      iss: issuerFor(TEAM),
      email: ADMIN,
      iat: nowS(),
      nbf: nowS(),
      exp: nowS() + 600,
      ...claims,
    }),
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key.privateKey,
    new TextEncoder().encode(`${head}.${body}`),
  );
  return `${head}.${body}.${base64Url(signature)}`;
}

let main: KeyPair;
let other: KeyPair;
const keysOf =
  (...pairs: KeyPair[]): KeySource =>
  async () =>
    pairs.map((p) => p.publicJwk);

beforeAll(async () => {
  main = await newKeyPair("main");
  other = await newKeyPair("other");
});

const verify = (token: string, getKeys: KeySource = keysOf(main)) =>
  verifyAccessJwt(token, { issuer: issuerFor(TEAM), audience: AUD, getKeys });

describe("verifyAccessJwt", () => {
  it("aceita um token válido e devolve o email em minúsculas", async () => {
    const token = await sign(main, { email: "Admin@Example.com" });
    await expect(verify(token)).resolves.toEqual({ email: ADMIN });
  });

  it.each([
    ["outra aplicação (aud)", { aud: ["b".repeat(64)] }],
    ["outra equipa (iss)", { iss: issuerFor("outra-equipa") }],
    ["expirado", { exp: nowS() - 120 }],
    ["ainda não válido (nbf)", { nbf: nowS() + 600 }],
    ["emitido no futuro (iat)", { iat: nowS() + 600 }],
    ["sem email (token de serviço)", { email: undefined }],
    ["sem exp", { exp: undefined }],
  ])("recusa um token %s", async (_name, claims) => {
    await expect(verify(await sign(main, claims))).rejects.toThrow();
  });

  it("recusa uma assinatura de outra chave com o mesmo kid", async () => {
    const forged = await sign({ ...other, publicJwk: { ...other.publicJwk, kid: "main" } });
    await expect(verify(forged)).rejects.toThrow("bad_signature");
  });

  it.each([["none"], ["HS256"], ["RS512"]])("recusa o algoritmo %s vindo do token", async (alg) => {
    await expect(verify(await sign(main, {}, { alg }))).rejects.toThrow("bad_header");
  });

  it("recusa tokens mal formados", async () => {
    for (const token of ["", "a.b", "a.b.c.d", "%%%.e30.e30", "e30.e30.e30"]) {
      await expect(verify(token)).rejects.toThrow();
    }
  });

  it("com um kid desconhecido, volta a ler as chaves uma vez (rotação)", async () => {
    const calls: boolean[] = [];
    const rotating: KeySource = async ({ refresh }) => {
      calls.push(refresh);
      return refresh ? [main.publicJwk] : [other.publicJwk];
    };
    await expect(verify(await sign(main), rotating)).resolves.toEqual({ email: ADMIN });
    expect(calls).toEqual([false, true]);
  });

  it("recusa um kid que não existe nem depois de ler as chaves de novo", async () => {
    await expect(verify(await sign(other))).rejects.toThrow("unknown_key");
  });
});

describe("accessKeySource", () => {
  it("lê as chaves da equipa e guarda-as em memória", async () => {
    const urls: string[] = [];
    const fetcher = (async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return Response.json({ keys: [main.publicJwk, { kid: 1 }] });
    }) as typeof fetch;
    const source = accessKeySource("cache-test", fetcher);
    expect(await source({ refresh: false })).toEqual([main.publicJwk]);
    expect(await source({ refresh: false })).toEqual([main.publicJwk]);
    // Uma leitura forçada logo a seguir também usa a cópia (no máximo uma por minuto)
    expect(await source({ refresh: true })).toEqual([main.publicJwk]);
    expect(urls).toEqual(["https://cache-test.cloudflareaccess.com/cdn-cgi/access/certs"]);
  });

  it("falha se a equipa não responder", async () => {
    const fetcher = (async () => new Response("", { status: 500 })) as typeof fetch;
    await expect(accessKeySource("down-test", fetcher)({ refresh: false })).rejects.toThrow(
      "keys_unavailable",
    );
  });
});

describe("allowedEmails", () => {
  it("separa por vírgulas, em minúsculas, sem vazios", () => {
    expect([...allowedEmails(" A@x.pt, ,b@Y.pt ")]).toEqual(["a@x.pt", "b@y.pt"]);
    expect(allowedEmails("").size).toBe(0);
    expect(allowedEmails(undefined).size).toBe(0);
  });
});

/** Todas as rotas do backoffice (GET), incluindo o CSS, o ícone e uma que não existe. */
const ROUTES = [
  "/",
  "/styles.css",
  "/favicon.svg",
  "/nao-existe",
  "/utilizadores",
  "/utilizadores?q=a",
  "/utilizadores/qualquer",
  "/utilizadores/qualquer/apagar",
  "/receitas",
  "/receitas/qualquer",
  "/alimentos",
];

describe("backoffice atrás do Access", () => {
  const app = () => createAdminApp({ getKeys: keysOf(main) });
  const bindings = (overrides: Partial<AdminBindings> = {}): AdminBindings => ({
    DB: env.DB,
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ADMIN_EMAILS: `outra@example.com, ${ADMIN}`,
    APP_URL: "https://protein-plate.app",
    ...overrides,
  });
  const get = async (
    path: string,
    {
      token,
      url = URL_REMOTE,
      env: overrides,
    }: { token?: string; url?: string; env?: Partial<AdminBindings> } = {},
  ) =>
    app().request(
      `${url}${path}`,
      { headers: token ? { "Cf-Access-Jwt-Assertion": token } : {} },
      bindings(overrides),
    );

  it("sem token recusa todas as rotas (403), sem mostrar nada", async () => {
    for (const path of ROUTES) {
      const res = await get(path);
      expect(res.status, path).toBe(403);
      const text = await res.text();
      expect(text).toContain("Sem acesso");
      expect(text).not.toContain("Utilizadores");
    }
  });

  it("com um token inválido (outra chave, expirado ou de outra aplicação) recusa todas as rotas", async () => {
    const tokens = [
      await sign(other),
      await sign(main, { exp: nowS() - 120 }),
      await sign(main, { aud: ["b".repeat(64)] }),
      "nao.e.um-token",
    ];
    for (const token of tokens) {
      for (const path of ROUTES) {
        expect((await get(path, { token })).status, path).toBe(403);
      }
    }
  });

  it("recusa um email fora da lista em todas as rotas, mesmo com um token válido do Access", async () => {
    const token = await sign(main, { email: "intruso@example.com" });
    for (const path of ROUTES) {
      expect((await get(path, { token })).status, path).toBe(403);
    }
  });

  it("as ações também ficam atrás do Access: sem token, um POST é recusado antes de tudo", async () => {
    for (const path of ["/utilizadores/qualquer/sessoes", "/utilizadores/qualquer/apagar"]) {
      const res = await app().request(
        `${URL_REMOTE}${path}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Origin: URL_REMOTE,
          },
          body: "csrf=x&confirmar=x",
        },
        bindings(),
      );
      expect(res.status).toBe(403);
    }
  });

  it("com um token válido e um email da lista, mostra as páginas", async () => {
    const token = await sign(main, { email: "Admin@Example.com" });
    for (const path of ["/", "/utilizadores", "/receitas", "/alimentos"]) {
      const res = await get(path, { token });
      expect(res.status, path).toBe(200);
      const html = await res.text();
      expect(html).toContain(`Entraste como ${ADMIN}`);
      expect(html).toContain('href="/cdn-cgi/access/logout"');
    }
  });

  it.each([
    ["sem equipa", { ACCESS_TEAM_DOMAIN: "" }],
    ["com uma equipa inválida", { ACCESS_TEAM_DOMAIN: "Equipa.Com" }],
    ["sem AUD", { ACCESS_AUD: "" }],
    ["com um AUD inválido", { ACCESS_AUD: "nao-e-uma-tag" }],
    ["sem emails autorizados", { ADMIN_EMAILS: " , " }],
  ])("%s, fecha tudo (503, mesmo com um token válido)", async (_name, overrides) => {
    for (const path of ["/", "/utilizadores", "/styles.css"]) {
      const res = await get(path, { token: await sign(main), env: overrides });
      expect(res.status).toBe(503);
      expect(await res.text()).not.toContain("Utilizadores");
    }
  });

  it("a entrada local sem Access só vale em pedidos a localhost", async () => {
    for (const url of ["http://localhost:8789", "http://127.0.0.1:8789"]) {
      const local = await get("/", { url, env: { ADMIN_DEV_BYPASS: "1" } });
      expect(local.status).toBe(200);
      expect(await local.text()).toContain("Local (sem Access)");
    }
    for (const url of [URL_REMOTE, "https://localhost.example.com", "http://10.0.0.1:8789"]) {
      const remote = await get("/", { url, env: { ADMIN_DEV_BYPASS: "1" } });
      expect(remote.status, url).toBe(403);
    }
  });

  it('ADMIN_DEV_BYPASS diferente de "1" não abre nada', async () => {
    for (const value of ["0", "true", "yes", ""]) {
      const res = await get("/", {
        url: "http://localhost:8789",
        env: { ADMIN_DEV_BYPASS: value, ACCESS_TEAM_DOMAIN: "", ACCESS_AUD: "", ADMIN_EMAILS: "" },
      });
      expect(res.status, value).toBe(503);
    }
  });

  it("todas as respostas levam CSP sem scripts, no-store, noindex e same-origin", async () => {
    const token = await sign(main);
    for (const res of [
      await get("/"),
      await get("/", { token }),
      await get("/nao-existe", { token }),
      await get("/", { env: { ACCESS_AUD: "" } }),
    ]) {
      const csp = res.headers.get("Content-Security-Policy") ?? "";
      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).not.toContain("script-src");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
      expect(res.headers.get("Referrer-Policy")).toBe("same-origin");
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    }
  });

  it("serve o CSS e o ícone, e responde 404 a rotas desconhecidas, depois de entrar", async () => {
    const token = await sign(main);
    const css = await get("/styles.css", { token });
    expect(css.status).toBe(200);
    expect(css.headers.get("Content-Type")).toContain("text/css");
    const icon = await get("/favicon.svg", { token });
    expect(icon.status).toBe(200);
    expect(icon.headers.get("Content-Type")).toBe("image/svg+xml");
    expect((await get("/nao-existe", { token })).status).toBe(404);
  });

  it("só aceita POST nas duas ações (as páginas são só GET)", async () => {
    for (const path of ["/", "/utilizadores", "/receitas", "/alimentos"]) {
      const res = await app().request(
        `${URL_REMOTE}${path}`,
        { method: "POST", headers: { "Cf-Access-Jwt-Assertion": await sign(main) } },
        bindings(),
      );
      expect(res.status).toBe(404);
    }
  });
});
