/** Gramas de proteína por kg de peso, por intensidade (secção 3 da especificação). */
export const INTENSITIES = {
  base: 1.6,
  moderada: 1.8,
  alta: 2.0,
  maxima: 2.2,
} as const;

export type Intensity = keyof typeof INTENSITIES;
export const INTENSITY_KEYS = Object.keys(INTENSITIES) as Intensity[];
export const DEFAULT_INTENSITY: Intensity = "alta";

/** Peso aceite sem pedir confirmação (kg). */
export const WEIGHT_LIMITS = { min: 35, max: 250 } as const;
/** Limites absolutos do campo de peso (fora disto, o valor é um engano). */
export const WEIGHT_HARD_LIMITS = { min: 20, max: 400 } as const;
/** Meta manual opcional (g). */
export const MANUAL_TARGET_LIMITS = { min: 40, max: 300 } as const;

export function roundToMultipleOf5(value: number): number {
  return Math.round(value / 5) * 5;
}

/** meta = arredondar a múltiplos de 5 (peso_kg × intensidade). */
export function dailyTarget(weightKg: number, intensity: Intensity): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new RangeError("O peso tem de ser um número positivo");
  }
  return roundToMultipleOf5(weightKg * INTENSITIES[intensity]);
}

/** Fora de 35–250 kg a app pede confirmação antes de calcular. */
export function weightNeedsConfirmation(weightKg: number): boolean {
  return weightKg < WEIGHT_LIMITS.min || weightKg > WEIGHT_LIMITS.max;
}

export function isPlausibleWeight(weightKg: number): boolean {
  return (
    Number.isFinite(weightKg) &&
    weightKg >= WEIGHT_HARD_LIMITS.min &&
    weightKg <= WEIGHT_HARD_LIMITS.max
  );
}

export function isValidManualTarget(grams: number): boolean {
  return (
    Number.isInteger(grams) &&
    grams >= MANUAL_TARGET_LIMITS.min &&
    grams <= MANUAL_TARGET_LIMITS.max
  );
}
