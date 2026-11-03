import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "../src/db";
import {
  LIKE_MAX_BYTES,
  QUERY_MAX_CHARS,
  USERS_PAGE_SIZE,
  cleanQuery,
  likePattern,
  listUsers,
} from "../src/users";
import { DAY, NOW, get, html, resetDb, seedUser } from "./seed";

/** Os nomes da lista, pela ordem em que aparecem. */
function names(page: string): string[] {
  return [...page.matchAll(/<span class="person-name">([^<]*)<\/span>/g)].map((m) => m[1] ?? "");
}

describe("pesquisa", () => {
  beforeEach(async () => {
    await resetDb();
    await seedUser({ id: "p1", name: "Ana_Maria", email: "ana_maria@example.test" });
    await seedUser({ id: "p2", name: "AnaXMaria", email: "anaxmaria@example.test" });
    await seedUser({ id: "p3", name: "100% Proteína", email: "cem@example.test" });
    await seedUser({ id: "p4", name: "Bruno", email: "bruno@mail.test" });
    await seedUser({ id: "p5", name: "Barra\\Invertida", email: "barra@example.test" });
  });

  it("procura parte do nome ou do email, sem diferença de maiúsculas", async () => {
    expect(names(await html("/utilizadores?q=bruno"))).toEqual(["Bruno"]);
    expect(names(await html("/utilizadores?q=MAIL.TEST"))).toEqual(["Bruno"]);
    expect(names(await html("/utilizadores?q=anax"))).toEqual(["AnaXMaria"]);
  });

  it("o _ conta como texto, não como “um carácter qualquer”", async () => {
    expect(names(await html("/utilizadores?q=Ana_"))).toEqual(["Ana_Maria"]);
    expect(names(await html("/utilizadores?q=_"))).toEqual(["Ana_Maria"]);
  });

  it("o % conta como texto, não como “qualquer coisa”", async () => {
    expect(names(await html("/utilizadores?q=%25"))).toEqual(["100% Proteína"]);
    expect(names(await html("/utilizadores?q=Ana%25Maria"))).toEqual([]);
  });

  it("a barra invertida também conta como texto", async () => {
    expect(names(await html("/utilizadores?q=%5C"))).toEqual(["Barra\\Invertida"]);
  });

  it("encontra pelo ID exato, mas não por parte dele", async () => {
    expect(names(await html("/utilizadores?q=p4"))).toEqual(["Bruno"]);
    expect(names(await html("/utilizadores?q=p"))).toContain("AnaXMaria");
  });

  it("sem resultados mostra o estado vazio e escapa o texto procurado", async () => {
    const page = await html(`/utilizadores?q=${encodeURIComponent('<b>"x"</b>')}`);
    expect(page).toContain("Nenhuma conta encontrada");
    expect(page).toContain('value="&lt;b&gt;&quot;x&quot;&lt;/b&gt;"');
    expect(page).not.toContain("<b>");
  });

  it("um texto muito comprido é cortado ao que a D1 aceita num LIKE (50 bytes), sem erro", async () => {
    const page = await html(`/utilizadores?q=${"a".repeat(300)}`);
    expect(page).toContain(`value="${"a".repeat(QUERY_MAX_CHARS)}"`);
    expect(page).not.toContain("a".repeat(QUERY_MAX_CHARS + 1));
    // Acentos (2 bytes) e caracteres escapados (\%, \_) também contam
    for (const q of ["á".repeat(60), "%".repeat(60), "_a".repeat(40), "\\".repeat(60)]) {
      const res = await get(`/utilizadores?q=${encodeURIComponent(q)}`);
      expect(res.status, q).toBe(200);
    }
  });

  it("cleanQuery cabe sempre no limite do LIKE", () => {
    const bytes = (text: string) => new TextEncoder().encode(likePattern(text)).length;
    for (const q of [
      "a".repeat(80),
      "á".repeat(80),
      "%".repeat(80),
      "_ ".repeat(80),
      "€😀".repeat(30),
    ]) {
      expect(bytes(cleanQuery(q)), q).toBeLessThanOrEqual(LIKE_MAX_BYTES);
    }
    expect(cleanQuery("  ana   maria  ")).toBe("ana maria");
    expect(cleanQuery(undefined)).toBe("");
  });
});

describe("ordem e páginas", () => {
  const TOTAL = USERS_PAGE_SIZE + 5;

  beforeEach(async () => {
    await resetDb();
    // u00 é a mais antiga, u29 a mais recente
    for (let i = 0; i < TOTAL; i++) {
      const n = String(i).padStart(2, "0");
      await seedUser({ id: `u${n}`, name: `Pessoa ${n}`, createdAt: NOW - (TOTAL - i) * DAY });
    }
  });

  it("a primeira página tem as mais recentes, com o link para a seguinte", async () => {
    const page = await html("/utilizadores");
    const shown = names(page);
    expect(shown).toHaveLength(USERS_PAGE_SIZE);
    expect(shown[0]).toBe("Pessoa 29");
    expect(page).toContain("Página 1 de 2");
    expect(page).toContain('href="/utilizadores?pagina=2" rel="next"');
    expect(page).not.toContain('rel="prev"');
    expect(page).toContain(`1–${USERS_PAGE_SIZE} de ${TOTAL} contas`);
  });

  it("a segunda página tem o resto, com o link para a anterior", async () => {
    const page = await html("/utilizadores?pagina=2");
    const shown = names(page);
    expect(shown).toEqual(["Pessoa 04", "Pessoa 03", "Pessoa 02", "Pessoa 01", "Pessoa 00"]);
    expect(page).toContain("Página 2 de 2");
    expect(page).toContain('href="/utilizadores" rel="prev"');
    expect(page).not.toContain('rel="next"');
  });

  it("uma página a mais fica na última; um número inválido fica na primeira", async () => {
    expect(await html("/utilizadores?pagina=99")).toContain("Página 2 de 2");
    for (const value of ["abc", "-1", "0", "1.5", "%20", "9999999999"]) {
      expect(await html(`/utilizadores?pagina=${value}`), value).toContain("Página 1 de 2");
    }
  });

  it("ordena das mais antigas, e a ordem fica nos links das páginas e da pesquisa", async () => {
    const page = await html("/utilizadores?ordem=antigas");
    expect(names(page)[0]).toBe("Pessoa 00");
    expect(page).toContain('aria-sort="ascending"');
    expect(page).toContain('href="/utilizadores?ordem=antigas&amp;pagina=2" rel="next"');
    expect(page).toContain('<input type="hidden" name="ordem" value="antigas">');
    // O cabeçalho troca para a ordem contrária
    expect(page).toMatch(
      /<th scope="col" class="sortable" aria-sort="ascending"><a href="\/utilizadores"/,
    );
  });

  it("a pesquisa conta só as encontradas e mantém-se nas páginas", async () => {
    const list = await listUsers(adminDb(env.DB), { q: "Pessoa 1", sort: "recentes", page: 1 });
    expect(list.total).toBe(10);
    expect(list.pages).toBe(1);
    expect(list.items.map((u) => u.id)).toEqual([
      "u19",
      "u18",
      "u17",
      "u16",
      "u15",
      "u14",
      "u13",
      "u12",
      "u11",
      "u10",
    ]);
  });
});
