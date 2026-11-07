import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MEALS, type Meal } from "./meals";
import {
  PLATE,
  hashString,
  piecesFor,
  plateLayout,
  plateSectors,
  type PlateItem,
  type PlatePiece,
} from "./plate-layout";

const EPS = 1e-9;

const item = (id: string, meal: Meal, count = 1, foodId = "ovo"): PlateItem => ({
  id,
  meal,
  foodId,
  count,
});

/** Um dia realista: até 6 refeições, até 8 alimentos por refeição, 0,5 a 4 porções. */
const dayArb = fc
  .array(
    fc.record({
      meal: fc.constantFrom(...MEALS),
      foodId: fc.constantFrom("ovo", "skyr-natural", "arroz-branco", "banana", "brocolos"),
      count: fc.integer({ min: 1, max: 8 }).map((n) => n / 2),
    }),
    { maxLength: 30 },
  )
  .map((rows) => rows.map((r, i) => ({ ...r, id: `item-${i}` })))
  .filter((items) => MEALS.every((m) => items.filter((i) => i.meal === m).length <= 8));

const overlapOk = (a: PlatePiece, b: PlatePiece) =>
  Math.hypot(a.x - b.x, a.z - b.z) >= (a.radius + b.radius) * (1 - PLATE.maxOverlap) - EPS;

describe("peças por item", () => {
  it("uma peça por porção, a meia porção mais pequena", () => {
    expect(piecesFor(1)).toEqual({ scales: [1], multiplier: null });
    expect(piecesFor(0.5)).toEqual({ scales: [PLATE.halfScale], multiplier: null });
    expect(piecesFor(2.5)).toEqual({ scales: [1, 1, PLATE.halfScale], multiplier: null });
    expect(piecesFor(3)).toEqual({ scales: [1, 1, 1], multiplier: null });
  });

  it("mais de 3 porções: uma peça maior e o ×N da legenda", () => {
    expect(piecesFor(3.5)).toEqual({ scales: [PLATE.bigScale], multiplier: 3.5 });
    expect(piecesFor(4)).toEqual({ scales: [PLATE.bigScale], multiplier: 4 });
  });

  it("porções inválidas não dão peças", () => {
    for (const count of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(piecesFor(count)).toEqual({ scales: [], multiplier: null });
    }
  });
});

describe("setores", () => {
  it("as refeições do dia pela ordem do dia, mais as que só vêm nos itens", () => {
    expect(plateSectors([item("a", "jantar")], ["almoco", "pequeno-almoco"])).toEqual([
      "pequeno-almoco",
      "almoco",
      "jantar",
    ]);
    expect(plateSectors([])).toEqual([]);
  });

  it("hash estável (FNV-1a)", () => {
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
  });
});

describe("disposição no prato", () => {
  it("prato vazio", () => {
    expect(plateLayout([], ["almoco"])).toEqual({ pieces: [], entries: [] });
  });

  it("uma refeição usa o prato todo, a partir do centro", () => {
    const { pieces } = plateLayout([item("a", "almoco", 1)]);
    expect(pieces).toHaveLength(1);
    expect(Math.hypot(pieces[0]!.x, pieces[0]!.z)).toBeLessThan(PLATE.pieceRadius);
  });

  it("chaves estáveis por item e índice, legenda com ×N", () => {
    const { pieces, entries } = plateLayout([item("a", "almoco", 2), item("b", "almoco", 4)]);
    expect(pieces.map((p) => p.key)).toEqual(["a#0", "a#1", "b#0"]);
    expect(entries).toEqual([
      { itemId: "a", foodId: "ovo", meal: "almoco", count: 2, pieces: 2, multiplier: null },
      { itemId: "b", foodId: "ovo", meal: "almoco", count: 4, pieces: 1, multiplier: 4 },
    ]);
  });

  it("cada refeição fica no seu setor", () => {
    const meals: Meal[] = ["pequeno-almoco", "almoco", "jantar"];
    const { pieces } = plateLayout(
      meals.map((m, i) => item(`i${i}`, m, 2)),
      meals,
    );
    const span = (Math.PI * 2) / meals.length;
    for (const piece of pieces) {
      const index = meals.indexOf(piece.meal);
      const start = -Math.PI / 2 + index * span;
      const angle =
        (((Math.atan2(piece.z, piece.x) - start) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      expect(angle).toBeLessThanOrEqual(span);
    }
  });

  it("com mais de uma refeição, o cubo fica livre (sem peças)", () => {
    fc.assert(
      fc.property(dayArb, (items) => {
        const { pieces } = plateLayout(items, ["pequeno-almoco", "jantar"]);
        for (const p of pieces) {
          expect(Math.hypot(p.x, p.z) - p.radius).toBeGreaterThanOrEqual(PLATE.hubRadius - EPS);
        }
      }),
      { numRuns: 60 },
    );
  });

  it("é determinística", () => {
    fc.assert(
      fc.property(dayArb, (items) => {
        expect(plateLayout(items, ["almoco"])).toEqual(plateLayout(items, ["almoco"]));
      }),
      { numRuns: 60 },
    );
  });

  it("nada fora do prato, sobreposição limitada e uma peça por porção até 3", () => {
    fc.assert(
      fc.property(dayArb, (items) => {
        const { pieces, entries } = plateLayout(items);
        const expected = items.reduce((sum, i) => sum + piecesFor(i.count).scales.length, 0);
        expect(pieces).toHaveLength(expected);
        expect(entries.map((e) => e.itemId)).toEqual(items.map((i) => i.id));
        for (const p of pieces) {
          expect(Math.hypot(p.x, p.z) + p.radius).toBeLessThanOrEqual(PLATE.usableRadius + EPS);
          expect(p.rotation).toBeGreaterThanOrEqual(0);
          expect(p.rotation).toBeLessThan(Math.PI * 2);
          expect(p.scale).toBeGreaterThan(0);
        }
        for (let i = 0; i < pieces.length; i++) {
          for (let j = i + 1; j < pieces.length; j++) {
            expect(overlapOk(pieces[i]!, pieces[j]!)).toBe(true);
          }
        }
      }),
      { numRuns: 80 },
    );
  });

  it("mudar uma refeição não mexe nas outras", () => {
    fc.assert(
      fc.property(dayArb, fc.integer({ min: 1, max: 8 }), (items, half) => {
        const meals = [...MEALS];
        const before = plateLayout(items, meals);
        const after = plateLayout([...items, item("novo", "ceia", half / 2)], meals);
        const others = (pieces: PlatePiece[]) => pieces.filter((p) => p.meal !== "ceia");
        expect(others(after.pieces)).toEqual(others(before.pieces));
      }),
      { numRuns: 40 },
    );
  });

  it("um prato cheio de mais encolhe as peças e continua dentro do prato", () => {
    const crowded = Array.from({ length: 70 }, (_, i) => item(`x${i}`, "almoco", 3));
    const { pieces } = plateLayout(crowded, [...MEALS]);
    expect(pieces).toHaveLength(210);
    for (const p of pieces) {
      expect(Math.hypot(p.x, p.z) + p.radius).toBeLessThanOrEqual(PLATE.usableRadius + EPS);
    }
    expect(pieces[0]!.scale).toBeLessThan(0.3);
  });
});
