import { describe, expect, it } from "vitest";
import { jsonStrings } from "../src/db";
import { parseFoodFilters, sortFoods, type FoodStat } from "../src/food-stats";
import { foodName } from "../src/foods";
import { agoLabel, dayLabel, grams, pct, usd, weekStartDay } from "../src/format";
import { escapeHtml } from "../src/html";
import { labelOf, DIET_LABEL } from "../src/labels";
import { lastDays, lastWeeks } from "../src/metrics";
import { AI_PRICES_USD_PER_MTOK, estimatedCost } from "../src/pricing";
import { publicRecipeUrl } from "../src/recipes";
import { parsePage } from "../src/users";

describe("custo da IA", () => {
  it("usa os preços do Haiku 5.5 ($0,10 e $0,50 por milhão)", () => {
    expect(AI_PRICES_USD_PER_MTOK["claude-haiku-5-5"]).toEqual({ input: 0.1, output: 0.5 });
    expect(estimatedCost("claude-haiku-5-5", 1_000_000, 1_000_000)).toBeCloseTo(0.6);
    expect(estimatedCost("claude-haiku-5-5", 2_000, 800)).toBeCloseTo(0.0006);
  });

  it("um modelo sem preço não tem custo (nem os nomes do Object)", () => {
    for (const model of ["mock", "outro-modelo", "toString", "__proto__", "constructor"]) {
      expect(estimatedCost(model, 1000, 1000), model).toBeNull();
    }
  });

  it("formata dólares, e um custo pequeno nunca parece zero", () => {
    expect(usd(0.2)).toMatch(/^0,20\sUS\$$/);
    expect(usd(0.0006)).toMatch(/^0,0006\sUS\$$/);
    expect(usd(0)).toMatch(/^0,00\sUS\$$/);
  });
});

describe("formatação", () => {
  it("percentagens, gramas e datas em português", () => {
    expect(pct(0)).toBe("0%");
    expect(pct(1 / 3)).toBe("33%");
    expect(pct(0.05)).toBe("5,0%");
    expect(pct(0.0001)).toBe("<0,1%");
    expect(grams(35.5)).toBe("35,5 g");
    expect(grams(140)).toBe("140 g");
    expect(dayLabel(Date.UTC(2026, 10, 3), true)).toBe("3 nov 2026");
    expect(agoLabel(0, 3 * 3_600_000)).toBe("há 3 h");
  });

  it("as semanas começam à segunda e os dias são em UTC", () => {
    // 3/11/2026 é uma terça; a segunda é o dia 2
    const tuesday = Date.UTC(2026, 10, 3, 12);
    expect(weekStartDay(tuesday) * 86_400_000).toBe(Date.UTC(2026, 10, 2));
    const weeks = lastWeeks(tuesday);
    expect(weeks).toHaveLength(12);
    expect(weeks.at(-1)).toBe(weekStartDay(tuesday));
    expect((weeks[1] ?? 0) - (weeks[0] ?? 0)).toBe(7);
    const days = lastDays(tuesday);
    expect(days).toHaveLength(30);
    expect(days.at(-1)).toBe(Math.floor(tuesday / 86_400_000));
  });

  it("escapa tudo o que vem de dados", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    );
  });
});

describe("entradas do endereço", () => {
  it("só aceita números de página simples", () => {
    expect(parsePage("3")).toBe(3);
    for (const value of [undefined, "", "0", "-2", "2.5", "1e3", " 2", "abc", "1234567"]) {
      expect(parsePage(value), String(value)).toBe(1);
    }
  });

  it("o link público da receita só com um APP_URL válido", () => {
    expect(publicRecipeUrl("https://protein-plate.app", "abc_1")).toBe(
      "https://protein-plate.app/receitas/abc_1",
    );
    expect(publicRecipeUrl("https://staging.protein-plate.app/", "x")).toBe(
      "https://staging.protein-plate.app/receitas/x",
    );
    for (const url of [undefined, "", "nao-e-url", "javascript:alert(1)", "ftp://x.pt"]) {
      expect(publicRecipeUrl(url, "x"), String(url)).toBeNull();
    }
  });

  it("os filtros dos alimentos são de uma lista fechada", () => {
    expect(parseFoodFilters({ ordem: "receitas", categoria: "soja" })).toEqual({
      sort: "receitas",
      category: "soja",
    });
    expect(parseFoodFilters({ ordem: "x", categoria: "toString" })).toEqual({
      sort: "gostam",
      category: "",
    });
  });
});

describe("dados guardados", () => {
  it("lê listas JSON com tolerância", () => {
    expect(jsonStrings('["a","b"]')).toEqual(["a", "b"]);
    expect(jsonStrings('["a",1,null]')).toEqual(["a"]);
    for (const text of [null, undefined, "", "{", '{"a":1}', "3"]) {
      expect(jsonStrings(text)).toEqual([]);
    }
  });

  it("dá nome aos alimentos e aos valores, e deixa os desconhecidos como estão", () => {
    expect(foodName("peito-frango")).toBe("Peito de frango");
    expect(foodName("id-retirado")).toBe("id-retirado");
    expect(labelOf(DIET_LABEL, "vegan")).toBe("Vegana");
    expect(labelOf(DIET_LABEL, "toString")).toBe("toString");
  });

  it("ordena os alimentos do maior para o menor, com o nome a desempatar", () => {
    const stat = (name: string, likedBy: number): FoodStat => ({
      id: name,
      name,
      category: "ovos",
      likedBy,
      dayPlans: 0,
      recipes: 0,
    });
    const sorted = sortFoods([stat("b", 1), stat("a", 1), stat("c", 3)], {
      sort: "gostam",
      category: "",
    });
    expect(sorted.map((f) => f.name)).toEqual(["c", "a", "b"]);
  });
});
