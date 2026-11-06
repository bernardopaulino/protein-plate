import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FOODS } from "@/content/foods.generated";
import {
  FOOD_MODELS,
  MODEL_FALLBACK,
  MODEL_URLS,
  foodModelUrl,
  portionUnits,
} from "@/content/food-models.generated";

const PUBLIC = join(import.meta.dirname, "..", "..", "public");

describe("modelos 3D dos alimentos", () => {
  it("todos os alimentos têm modelo (nunca um buraco no prato)", () => {
    for (const food of FOODS) {
      expect(FOOD_MODELS[food.id], food.id).toBeDefined();
      expect(MODEL_URLS[FOOD_MODELS[food.id]!], food.id).toBeDefined();
    }
    expect(foodModelUrl("nao-existe")).toBe(MODEL_URLS[MODEL_FALLBACK]);
  });

  it("cada modelo existe em public/models, com o hash no nome, e não sobra nenhum", () => {
    const urls = Object.values(MODEL_URLS);
    for (const url of urls) {
      expect(url).toMatch(/^\/models\/[a-z0-9-]+\.[0-9a-f]{10}\.glb$/);
      expect(existsSync(join(PUBLIC, url)), url).toBe(true);
    }
    const files = readdirSync(join(PUBLIC, "models")).filter((f) => f.endsWith(".glb"));
    expect(files.sort()).toEqual(urls.map((u) => u.slice("/models/".length)).sort());
  });

  it("a licença do Kenney Food Kit é CC0", () => {
    const license = readFileSync(join(PUBLIC, "models", "LICENSE-kenney.txt"), "utf8");
    expect(license).toMatch(/Creative Commons Zero, CC0/);
  });

  it("a porção típica em unidades: 1 ovo, 2 tangerinas; o que não se conta é uma peça", () => {
    expect(portionUnits("ovo", 50)).toBe(1);
    expect(portionUnits("ovo", 100)).toBe(2);
    expect(portionUnits("tangerina", 140)).toBe(2);
    expect(portionUnits("arroz-branco", 80)).toBe(1);
    expect(portionUnits("ovo", 10)).toBe(1);
  });
});
