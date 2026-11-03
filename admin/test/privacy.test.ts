import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { createAdminApp } from "../src/app";
import { ALLERGEN_LABEL } from "../src/labels";
import { MIN_GROUP, healthCount } from "../src/privacy";
import { DAY, NOW, ORIGIN, html, localBindings, resetDb, seedProfile, seedUser } from "./seed";

/**
 * Os dados de saúde nunca aparecem por pessoa: nem o peso, nem as alergias, nem a intensidade
 * (que, com a meta, dava o peso). As alergias só aparecem no Painel, agregadas e a partir de 5.
 */

const WEIGHT = 87.3;

beforeEach(async () => {
  await resetDb();
  // Uma pessoa com tudo: peso, alergias (com consentimento) e a intensidade "maxima"
  await seedUser({ id: "saude", name: "Sara", email: "sara@example.test", sessions: [] });
  await seedProfile({
    userId: "saude",
    dailyTargetG: 192,
    intensity: "maxima",
    weightKg: WEIGHT,
    allergies: ["peanut", "sesame", "lupin"],
    likedFoods: ["ovo", "skyr-natural"],
    healthConsentAt: NOW - 3 * DAY,
  });
});

/** As formas como o peso podia aparecer no HTML. */
const WEIGHT_TEXTS = ["87.3", "87,3", "87 kg", "87,3 kg"];
const ALLERGY_TEXTS = [
  "peanut",
  "sesame",
  "lupin",
  ALLERGEN_LABEL.peanut,
  ALLERGEN_LABEL.sesame,
  ALLERGEN_LABEL.lupin,
];
const INTENSITY_TEXTS = ["maxima", "Ganhar massa", "2,2 g por kg", "Intensidade"];

describe("dados de saúde por pessoa", () => {
  it("a ficha, a confirmação do apagar e a lista não mostram o peso, as alergias nem a intensidade", async () => {
    for (const path of [
      "/utilizadores/saude",
      "/utilizadores/saude/apagar",
      "/utilizadores",
      "/utilizadores?q=sara",
    ]) {
      const page = await html(path);
      for (const text of [...WEIGHT_TEXTS, ...ALLERGY_TEXTS, ...INTENSITY_TEXTS]) {
        expect(page, `${path}: ${text}`).not.toContain(text);
      }
    }
  });

  it("a ficha diz só que há dados de saúde e desde quando há consentimento", async () => {
    const page = await html("/utilizadores/saude");
    expect(page).toContain("Dados de saúde guardados com consentimento em");
    expect(page).not.toContain("Sem dados de saúde");
    // A meta continua lá (é o que o servidor guarda), sem a intensidade
    expect(page).toContain("<strong>192 g</strong> de proteína");
  });

  it("sem consentimento, a ficha diz que não há dados de saúde", async () => {
    await seedUser({ id: "semsaude", sessions: [] });
    await seedProfile({ userId: "semsaude" });
    const page = await html("/utilizadores/semsaude");
    expect(page).toContain("Sem dados de saúde");
    expect(page).not.toContain("Dados de saúde guardados");
  });

  it("as consultas da ficha e do apagar nunca pedem o peso, as alergias nem a intensidade", async () => {
    const queries: string[] = [];
    const recording = new Proxy(env.DB, {
      get(target, prop, receiver) {
        if (prop === "prepare") {
          return (query: string) => {
            queries.push(query);
            return target.prepare(query);
          };
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    for (const path of [
      "/utilizadores/saude",
      "/utilizadores/saude/apagar",
      "/utilizadores?q=sara",
    ]) {
      const res = await createAdminApp().request(
        `${ORIGIN}${path}`,
        {},
        {
          ...localBindings(),
          DB: recording,
        },
      );
      expect(res.status).toBe(200);
    }
    expect(queries.length).toBeGreaterThan(3);
    for (const query of queries) {
      // Nem colunas de saúde, nem "select *" (que as traria sem as pedir)
      expect(query).not.toMatch(
        /weight_kg|allergies|intensity|ip_address|user_agent|select\s+\*|\w\.\*/,
      );
    }
  });
});

describe("alergias no Painel (só agregadas)", () => {
  /** A linha de um alergénio na tabela do Painel. */
  const allergenCell = (page: string, label: string) =>
    new RegExp(`<th scope="row">${label}</th><td class="num[^"]*">([^<]*)</td>`).exec(page)?.[1];

  it("abaixo de 5 pessoas (e com zero) aparece “<5”; a partir de 5, o número", async () => {
    // Mais 4 pessoas com amendoim (5 no total) e mais 3 com leite (3)
    for (let i = 0; i < 4; i++) {
      await seedUser({ id: `a${i}`, sessions: [] });
      await seedProfile({
        userId: `a${i}`,
        allergies: i < 3 ? ["peanut", "milk"] : ["peanut"],
        healthConsentAt: NOW,
      });
    }
    const page = await html("/");
    expect(allergenCell(page, ALLERGEN_LABEL.peanut)).toBe("5");
    expect(allergenCell(page, ALLERGEN_LABEL.milk)).toBe("&lt;5");
    expect(allergenCell(page, ALLERGEN_LABEL.sesame)).toBe("&lt;5");
    expect(allergenCell(page, ALLERGEN_LABEL.gluten)).toBe("&lt;5");
    // As pessoas com alguma alergia: 5
    expect(page).toMatch(
      /<p class="stat-value">5<\/p><p class="stat-label">com pelo menos uma alergia/,
    );
  });

  it("com menos de 5 pessoas com alergias, nem o total aparece", async () => {
    const page = await html("/");
    expect(page).toMatch(
      /<p class="stat-value">&lt;5<\/p><p class="stat-label">com pelo menos uma alergia/,
    );
    expect(allergenCell(page, ALLERGEN_LABEL.peanut)).toBe("&lt;5");
  });

  it("não conta alergias de perfis sem o consentimento de dados de saúde", async () => {
    for (let i = 0; i < 6; i++) {
      await seedUser({ id: `s${i}`, sessions: [] });
      await seedProfile({ userId: `s${i}`, allergies: ["egg"], healthConsentAt: null });
    }
    const page = await html("/");
    expect(allergenCell(page, ALLERGEN_LABEL.egg)).toBe("&lt;5");
  });

  it("o Painel nunca mostra o peso", async () => {
    const page = await html("/");
    for (const text of WEIGHT_TEXTS) expect(page).not.toContain(text);
  });

  it("healthCount esconde de 0 a 4", () => {
    expect(MIN_GROUP).toBe(5);
    expect([0, 1, 4, 5, 12].map(healthCount)).toEqual(["<5", "<5", "<5", "5", "12"]);
  });
});
