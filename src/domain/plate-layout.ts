import { MEALS, type Meal } from "./meals";

/**
 * A disposição dos alimentos do dia no prato 3D (sem three: só números). O prato é um disco de raio
 * 1 no plano x/z, centrado na origem; cada refeição tem o seu setor (pela ordem do dia) e cada porção
 * é uma peça, até 3 por item (a partir daí uma peça maior e "×N" na legenda HTML). Tudo é
 * determinístico: o mesmo dia dá sempre o mesmo prato, e mudar uma refeição não mexe nas outras.
 */

export const PLATE = {
  /** Raio útil: as peças ficam por dentro do anel da borda. */
  usableRadius: 0.8,
  /** O cubo da roda (com o número por cima, em HTML): sem peças, quando há mais de uma refeição. */
  hubRadius: 0.36,
  /** Raio da pegada de uma peça normal (escala 1). */
  pieceRadius: 0.16,
  /** Até onde duas peças se podem sobrepor (fração da soma dos raios). */
  maxOverlap: 0.25,
  /** Peças por item, no máximo; a partir daí uma peça maior. */
  maxPiecesPerItem: 3,
  /** Escala da peça única de um item com mais de 3 porções. */
  bigScale: 1.3,
  /** Escala da última peça quando a porção é meia (0,5, 1,5, 2,5). */
  halfScale: 0.7,
} as const;

/** Quanto encolhem as peças de um setor a cada tentativa de as arrumar, e quantas tentativas. */
const SHRINK = 0.85;
const MAX_ATTEMPTS = 10;
/** Pontos candidatos no disco inteiro (o espaçamento acompanha o tamanho das peças). */
const MAX_CANDIDATES = 1200;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export interface PlateItem {
  id: string;
  meal: Meal;
  foodId: string;
  /** Porções (passos de 0,5). */
  count: number;
}

export interface PlatePiece {
  /** `<itemId>#<índice>` (estável: a animação de entrada só corre nas peças novas). */
  key: string;
  itemId: string;
  foodId: string;
  meal: Meal;
  x: number;
  z: number;
  /** Rotação em torno do eixo vertical (radianos, 0 a 2π). */
  rotation: number;
  /** Escala do modelo (1 = peça normal). */
  scale: number;
  /** Raio da pegada no prato (já com a escala). */
  radius: number;
}

export interface PlateEntry {
  itemId: string;
  foodId: string;
  meal: Meal;
  count: number;
  /** Peças no prato (0 se a porção não for válida). */
  pieces: number;
  /** Com mais de 3 porções: o N do "×N" da legenda; senão null. */
  multiplier: number | null;
}

export interface PlateLayout {
  pieces: PlatePiece[];
  entries: PlateEntry[];
}

/** As escalas das peças de um item com `count` porções e o multiplicador da legenda. */
export function piecesFor(count: number): { scales: number[]; multiplier: number | null } {
  if (!Number.isFinite(count) || count <= 0) return { scales: [], multiplier: null };
  if (count > PLATE.maxPiecesPerItem) return { scales: [PLATE.bigScale], multiplier: count };
  const n = Math.ceil(count);
  const half = n !== count;
  return {
    scales: Array.from({ length: n }, (_, i) => (half && i === n - 1 ? PLATE.halfScale : 1)),
    multiplier: null,
  };
}

/** FNV-1a de 32 bits: um número estável a partir de um texto. */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Os setores do prato: as refeições do dia pela ordem do dia, mais as que só aparecem nos itens. */
export function plateSectors(items: readonly PlateItem[], meals: readonly Meal[] = []): Meal[] {
  const used = new Set<Meal>([...meals, ...items.map((i) => i.meal)]);
  return MEALS.filter((m) => used.has(m));
}

interface Sector {
  start: number;
  span: number;
  anchorX: number;
  anchorZ: number;
}

function sectorAt(index: number, total: number): Sector {
  const span = (Math.PI * 2) / total;
  // A primeira refeição começa no topo do prato (de frente para a câmara fica a última)
  const start = -Math.PI / 2 + index * span;
  const mid = start + span / 2;
  const reach = total === 1 ? 0 : PLATE.usableRadius * 0.55;
  return { start, span, anchorX: Math.cos(mid) * reach, anchorZ: Math.sin(mid) * reach };
}

/** Distância de um ponto a uma semirreta que sai da origem com o ângulo `angle`. */
function distanceToRay(x: number, z: number, angle: number): number {
  const along = x * Math.cos(angle) + z * Math.sin(angle);
  if (along <= 0) return Math.hypot(x, z);
  return Math.abs(-x * Math.sin(angle) + z * Math.cos(angle));
}

/** O ângulo do ponto medido a partir do início do setor (0 a 2π). */
function angleInSector(x: number, z: number, start: number): number {
  const full = Math.PI * 2;
  return (((Math.atan2(z, x) - start) % full) + full) % full;
}

/** Se uma peça de raio `radius` em (x, z) cabe inteira no setor (e no prato). */
function fitsSector(x: number, z: number, radius: number, sector: Sector, total: number): boolean {
  if (Math.hypot(x, z) + radius > PLATE.usableRadius + 1e-9) return false;
  if (total === 1) return true;
  if (Math.hypot(x, z) - radius < PLATE.hubRadius - 1e-9) return false;
  if (angleInSector(x, z, sector.start) > sector.span) return false;
  return (
    distanceToRay(x, z, sector.start) >= radius - 1e-9 &&
    distanceToRay(x, z, sector.start + sector.span) >= radius - 1e-9
  );
}

/** Pontos de um girassol (filotaxia) no disco útil, com espaçamento de cerca de meio raio. */
function candidates(radius: number): { x: number; z: number }[] {
  const spacing = Math.max(radius * 0.5, 1e-3);
  const count = Math.min(MAX_CANDIDATES, Math.ceil((PLATE.usableRadius / spacing) ** 2));
  return Array.from({ length: count }, (_, i) => {
    const r = PLATE.usableRadius * Math.sqrt((i + 0.5) / count);
    const a = i * GOLDEN_ANGLE;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r };
  });
}

interface Pending {
  key: string;
  itemId: string;
  foodId: string;
  meal: Meal;
  scale: number;
}

/** Quanto falta para a peça não ultrapassar a sobreposição permitida (≥ 1 é aceitável). */
function clearance(x: number, z: number, radius: number, placed: readonly PlatePiece[]): number {
  let worst = Infinity;
  for (const other of placed) {
    const allowed = (radius + other.radius) * (1 - PLATE.maxOverlap);
    worst = Math.min(worst, Math.hypot(x - other.x, z - other.z) / allowed);
  }
  return worst;
}

/** Arruma as peças de um setor; encolhe-as até caberem (na última tentativa, aceita a melhor). */
function packSector(
  pending: readonly Pending[],
  sector: Sector,
  total: number,
  attempt = 0,
): PlatePiece[] {
  const last = attempt === MAX_ATTEMPTS - 1;
  const shrink = SHRINK ** attempt;
  const points = candidates(PLATE.pieceRadius * shrink).sort(
    (a, b) =>
      Math.hypot(a.x - sector.anchorX, a.z - sector.anchorZ) -
      Math.hypot(b.x - sector.anchorX, b.z - sector.anchorZ),
  );
  const placed: PlatePiece[] = [];
  for (const piece of pending) {
    const radius = PLATE.pieceRadius * piece.scale * shrink;
    const inside = points.filter((p) => fitsSector(p.x, p.z, radius, sector, total));
    let spot = inside.find((p) => clearance(p.x, p.z, radius, placed) >= 1);
    if (!spot) {
      if (!last) return packSector(pending, sector, total, attempt + 1);
      // Prato cheio de mais para o tamanho mínimo: a peça vai para o sítio mais livre do setor
      spot = inside.reduce<{ x: number; z: number; free: number }>(
        (best, p) => {
          const free = clearance(p.x, p.z, radius, placed);
          return free > best.free ? { ...p, free } : best;
        },
        { x: sector.anchorX, z: sector.anchorZ, free: -Infinity },
      );
    }
    placed.push({
      ...piece,
      x: spot.x,
      z: spot.z,
      rotation: (hashString(piece.key) / 0x100000000) * Math.PI * 2,
      scale: piece.scale * shrink,
      radius,
    });
  }
  return placed;
}

/**
 * Dispõe os itens do dia no prato. `meals` são as refeições do dia (os setores ficam estáveis
 * mesmo com refeições vazias); itens de refeições fora da lista ganham setor na mesma.
 */
export function plateLayout(items: readonly PlateItem[], meals: readonly Meal[] = []): PlateLayout {
  const sectors = plateSectors(items, meals);
  const entries: PlateEntry[] = [];
  const byMeal = new Map<Meal, Pending[]>();
  for (const item of items) {
    const { scales, multiplier } = piecesFor(item.count);
    entries.push({
      itemId: item.id,
      foodId: item.foodId,
      meal: item.meal,
      count: item.count,
      pieces: scales.length,
      multiplier,
    });
    const list = byMeal.get(item.meal) ?? [];
    scales.forEach((scale, index) =>
      list.push({
        key: `${item.id}#${index}`,
        itemId: item.id,
        foodId: item.foodId,
        meal: item.meal,
        scale,
      }),
    );
    byMeal.set(item.meal, list);
  }
  const pieces = sectors.flatMap((meal, index) =>
    packSector(byMeal.get(meal) ?? [], sectorAt(index, sectors.length), sectors.length),
  );
  return { pieces, entries };
}
