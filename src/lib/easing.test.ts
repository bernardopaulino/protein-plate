import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EASE_OUT, cubicBezier, parseCubicBezier } from "./easing";

describe("curvas de animação", () => {
  it("lê o cubic-bezier dos tokens", () => {
    expect(parseCubicBezier("cubic-bezier(0.2, 0.8, 0.2, 1)")).toEqual([0.2, 0.8, 0.2, 1]);
    expect(parseCubicBezier(" cubic-bezier(0,0,1,1) ")).toEqual([0, 0, 1, 1]);
  });

  it("recusa o que não é uma curva válida", () => {
    for (const value of [
      "",
      "ease-out",
      "cubic-bezier(0.2, 0.8, 0.2)",
      "cubic-bezier(a, 0.8, 0.2, 1)",
      "cubic-bezier(1.2, 0.8, 0.2, 1)",
      "cubic-bezier(0.2, 0.8, -0.1, 1)",
    ]) {
      expect(parseCubicBezier(value)).toBeNull();
    }
  });

  it("começa em 0, acaba em 1 e cresce (ease-out: à frente da linear)", () => {
    const ease = cubicBezier(EASE_OUT);
    expect(ease(-1)).toBe(0);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(2)).toBe(1);
    expect(ease(0.5)).toBeGreaterThan(0.5);
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), (t) => {
        expect(ease(Math.min(1, t + 0.01))).toBeGreaterThanOrEqual(ease(t) - 1e-6);
      }),
    );
  });

  it("a curva linear é a identidade", () => {
    const linear = cubicBezier([0, 0, 1, 1]);
    expect(linear(0.25)).toBeCloseTo(0.25, 5);
    expect(linear(0.8)).toBeCloseTo(0.8, 5);
  });
});
