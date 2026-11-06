/**
 * Curvas de animação a partir dos tokens CSS (`--ease-out: cubic-bezier(...)`), para o 3D mexer com
 * a mesma curva que o resto da app. Sem dependências: serve também a cena do prato fora do Next.
 */

export type Easing = (t: number) => number;

/** A curva por defeito, igual ao `--ease-out` de globals.css. */
export const EASE_OUT: readonly [number, number, number, number] = [0.2, 0.8, 0.2, 1];

/** Lê "cubic-bezier(a, b, c, d)"; devolve null se não for uma curva válida. */
export function parseCubicBezier(value: string): [number, number, number, number] | null {
  const match = /^\s*cubic-bezier\(([^)]*)\)\s*$/.exec(value);
  if (!match) return null;
  const parts = match[1]!.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [x1, y1, x2, y2] = parts as [number, number, number, number];
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null;
  return [x1, y1, x2, y2];
}

/** A função da curva (o x é o tempo de 0 a 1; resolve-se por bisseção, sempre converge). */
export function cubicBezier([x1, y1, x2, y2]: readonly [number, number, number, number]): Easing {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (time) => {
    if (time <= 0) return 0;
    if (time >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = time;
    for (let i = 0; i < 30; i++) {
      t = (lo + hi) / 2;
      if (at(x1, x2, t) < time) lo = t;
      else hi = t;
    }
    return at(y1, y2, t);
  };
}
