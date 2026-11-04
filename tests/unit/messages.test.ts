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

  it("só textos (as mensagens são compiladas no build e não aceitam listas nem números)", () => {
    const leaves = (value: unknown): unknown[] =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.values(value).flatMap(leaves)
        : [value];
    for (const messages of [pt, en]) {
      expect(leaves(messages).every((v) => typeof v === "string")).toBe(true);
    }
  });

  it("sem 'falhaste' nem culpa nos textos", () => {
    const text = JSON.stringify(pt).toLowerCase();
    for (const word of ["falhaste", "falhou a meta", "culpa", "fracass"]) {
      expect(text).not.toContain(word);
    }
  });
});
