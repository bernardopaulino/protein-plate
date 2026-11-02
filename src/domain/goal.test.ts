import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_INTENSITY,
  INTENSITIES,
  INTENSITY_KEYS,
  dailyTarget,
  isPlausibleWeight,
  isValidManualTarget,
  roundToMultipleOf5,
  weightNeedsConfirmation,
} from "./goal";

describe("dailyTarget", () => {
  it("multiplica o peso pela intensidade e arredonda a múltiplos de 5", () => {
    expect(dailyTarget(80, "alta")).toBe(160);
    expect(dailyTarget(80, "base")).toBe(130); // 128
    expect(dailyTarget(72, "moderada")).toBe(130); // 129,6
    expect(dailyTarget(63, "maxima")).toBe(140); // 138,6
  });

  it("usa os fatores da especificação", () => {
    expect(INTENSITIES).toEqual({ base: 1.6, moderada: 1.8, alta: 2.0, maxima: 2.2 });
    expect(DEFAULT_INTENSITY).toBe("alta");
  });

  it("devolve sempre um múltiplo de 5 a menos de 2,5 g do valor exato", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 35, max: 250, noNaN: true }),
        fc.constantFrom(...INTENSITY_KEYS),
        (weight, intensity) => {
          const target = dailyTarget(weight, intensity);
          expect(target % 5).toBe(0);
          expect(Math.abs(target - weight * INTENSITIES[intensity])).toBeLessThanOrEqual(2.5);
        },
      ),
    );
  });

  it("recusa pesos que não são números positivos", () => {
    expect(() => dailyTarget(0, "alta")).toThrow(RangeError);
    expect(() => dailyTarget(Number.NaN, "alta")).toThrow(RangeError);
    expect(() => dailyTarget(-5, "alta")).toThrow(RangeError);
  });
});

describe("limites", () => {
  it("pede confirmação fora de 35–250 kg", () => {
    expect(weightNeedsConfirmation(34.9)).toBe(true);
    expect(weightNeedsConfirmation(35)).toBe(false);
    expect(weightNeedsConfirmation(250)).toBe(false);
    expect(weightNeedsConfirmation(251)).toBe(true);
  });

  it("aceita pesos plausíveis entre 20 e 400 kg", () => {
    expect(isPlausibleWeight(19)).toBe(false);
    expect(isPlausibleWeight(20)).toBe(true);
    expect(isPlausibleWeight(400)).toBe(true);
    expect(isPlausibleWeight(401)).toBe(false);
    expect(isPlausibleWeight(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("aceita metas manuais inteiras entre 40 e 300 g", () => {
    expect(isValidManualTarget(39)).toBe(false);
    expect(isValidManualTarget(40)).toBe(true);
    expect(isValidManualTarget(300)).toBe(true);
    expect(isValidManualTarget(301)).toBe(false);
    expect(isValidManualTarget(120.5)).toBe(false);
  });

  it("arredonda a múltiplos de 5", () => {
    expect(roundToMultipleOf5(162.4)).toBe(160);
    expect(roundToMultipleOf5(162.5)).toBe(165);
  });
});
