/**
 * Geometria da Roda (SVG): ângulos em graus a partir do topo, no sentido dos ponteiros do relógio,
 * com o centro em (0, 0). Sem React: serve a roda grande e as fatias pequenas.
 */

export function polar(radius: number, degrees: number): [number, number] {
  const a = (degrees * Math.PI) / 180;
  return [radius * Math.sin(a), -radius * Math.cos(a)];
}

const f = (n: number) => Number(n.toFixed(3));

/** Uma fatia entre dois raios (anel) ou até ao centro (inner = 0). */
export function wedgePath(inner: number, outer: number, start: number, end: number): string {
  const large = end - start > 180 ? 1 : 0;
  if (end - start >= 359.999) {
    // Roda inteira: dois meios arcos (um arco SVG não fecha um círculo completo)
    const [ox, oy] = polar(outer, 0);
    const [bx, by] = polar(outer, 180);
    const outerRing = `M${f(ox)} ${f(oy)}A${outer} ${outer} 0 1 1 ${f(bx)} ${f(by)}A${outer} ${outer} 0 1 1 ${f(ox)} ${f(oy)}Z`;
    if (inner <= 0) return outerRing;
    const [ix, iy] = polar(inner, 0);
    const [jx, jy] = polar(inner, 180);
    return `${outerRing}M${f(ix)} ${f(iy)}A${inner} ${inner} 0 1 0 ${f(jx)} ${f(jy)}A${inner} ${inner} 0 1 0 ${f(ix)} ${f(iy)}Z`;
  }
  const [x0, y0] = polar(outer, start);
  const [x1, y1] = polar(outer, end);
  if (inner <= 0) {
    return `M0 0L${f(x0)} ${f(y0)}A${outer} ${outer} 0 ${large} 1 ${f(x1)} ${f(y1)}Z`;
  }
  const [x2, y2] = polar(inner, end);
  const [x3, y3] = polar(inner, start);
  return `M${f(x0)} ${f(y0)}A${outer} ${outer} 0 ${large} 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${inner} ${inner} 0 ${large} 0 ${f(x3)} ${f(y3)}Z`;
}

/** Os limites de n setores iguais (começam no topo). */
export function sectorAngles(count: number): { start: number; end: number; mid: number }[] {
  const span = 360 / Math.max(1, count);
  return Array.from({ length: count }, (_, i) => ({
    start: i * span,
    end: (i + 1) * span,
    mid: (i + 0.5) * span,
  }));
}
