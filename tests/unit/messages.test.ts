import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";

function keys(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return [prefix];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

describe("mensagens", () => {
  it("o inglês tem as mesmas chaves que o português (estrutura pronta para a v1.1)", () => {
    expect(keys(en).sort()).toEqual(keys(pt).sort());
  });

  it("sem 'falhaste' nem culpa nos textos", () => {
    const text = JSON.stringify(pt).toLowerCase();
    for (const word of ["falhaste", "falhou a meta", "culpa", "fracass"]) {
      expect(text).not.toContain(word);
    }
  });
});
