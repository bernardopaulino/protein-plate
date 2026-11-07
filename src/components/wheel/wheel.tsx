import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { polar, sectorAngles, wedgePath } from "./geometry";

export interface WheelSector {
  key: string;
  /** Cor da fatia (um token, ex.: "var(--meal-almoco)"). */
  color: string;
  /** Ilustrações dos alimentos da fatia (até 3 desenham-se). */
  foods: string[];
  /** A legenda curva no aro (o nome da refeição). */
  label?: string;
}

const RING = { radius: 96, width: 9 } as const;
const SECTOR = { inner: 25, outer: 85 } as const;
const FOOD_SIZE = 25;
/** Raio da linha de base das legendas: por fora do aro (em baixo, as letras ficam para dentro). */
const LABEL = { top: 108, bottom: 116, size: 9.5 } as const;

/** Posições das ilustrações dentro de uma fatia: em leque à volta do ângulo do meio. */
function foodSpots(mid: number, span: number, count: number): [number, number][] {
  const d = Math.min(span * 0.2, 26);
  const layouts: Record<number, [number, number][]> = {
    1: [[56, mid]],
    2: [
      [49, mid - d],
      [64, mid + d],
    ],
    3: [
      [66, mid - d],
      [66, mid + d],
      [43, mid],
    ],
  };
  return (layouts[Math.min(3, count)] ?? []).map(([r, a]) => polar(r, a));
}

const f = (n: number) => Number(n.toFixed(3));

/**
 * O arco de uma legenda: em cima segue o sentido dos ponteiros do relógio; em baixo, o contrário,
 * para o texto se ler sempre da esquerda para a direita. Decide-se pelo ângulo depois de girar.
 */
function labelArc(mid: number, half: number, finalAngle: number): string {
  const a = ((finalAngle % 360) + 360) % 360;
  const bottom = a > 90 && a < 270;
  const r = bottom ? LABEL.bottom : LABEL.top;
  const [x0, y0] = polar(r, bottom ? mid + half : mid - half);
  const [x1, y1] = polar(r, bottom ? mid - half : mid + half);
  return `M${f(x0)} ${f(y0)}A${r} ${r} 0 0 ${bottom ? 0 : 1} ${f(x1)} ${f(y1)}`;
}

/**
 * A Roda: o dia como a Roda dos Alimentos. Cada refeição é uma fatia (pela ordem do dia, a começar
 * no topo), em cor cheia, com os seus alimentos lá dentro e o nome curvo no aro; o aro é a meta,
 * que enche em --primary (e ganha o --accent por trás ao chegar, só como fundo). Decorativa
 * (aria-hidden): o texto à volta diz o mesmo. `rotation` gira as fatias (os alimentos ficam de
 * pé), `active` acende uma fatia e esbate as outras, `tilt` inclina a roda em 3D (CSS). `layer`
 * "labels" desenha só as legendas (por cima do prato 3D). `children` é o cubo, em HTML.
 */
export function Wheel({
  sectors,
  progress,
  reached = false,
  active = null,
  rotation = 0,
  tilt = 0,
  layer = "all",
  idPrefix = "wheel",
  children,
  className,
}: {
  sectors: WheelSector[];
  /** Proteína sobre a meta (0 a 1). */
  progress: number;
  reached?: boolean;
  active?: number | null;
  /** Graus, no sentido dos ponteiros do relógio. */
  rotation?: number;
  /** Inclinação em graus (0 = de frente). */
  tilt?: number;
  layer?: "all" | "labels";
  /** Prefixo dos ids dos arcos das legendas (único por roda na página). */
  idPrefix?: string;
  children?: ReactNode;
  className?: string;
}) {
  const angles = sectorAngles(sectors.length);
  const span = 360 / Math.max(1, sectors.length);
  const fill = Math.max(0, Math.min(1, progress)) * 100;
  const full = layer === "all";
  const style = {
    "--wheel-rotation": `${rotation}deg`,
    "--wheel-tilt": `${tilt}deg`,
  } as CSSProperties;

  return (
    <div className={cn("wheel-stage relative isolate aspect-square", className)} style={style}>
      <svg
        aria-hidden
        viewBox="-124 -124 248 248"
        className={cn("wheel-svg size-full overflow-visible", !full && "wheel-labels-only")}
        focusable="false"
      >
        {full ? (
          <>
            <circle r={RING.radius + RING.width / 2 + 3} fill="var(--surface)" />
            <circle
              r={RING.radius}
              fill="none"
              stroke={reached ? "var(--accent)" : "var(--track)"}
              strokeWidth={RING.width + (reached ? 5 : 0)}
            />
            <circle
              r={RING.radius}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={RING.width}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${fill} 100`}
              transform="rotate(-90)"
              className="wheel-progress"
            />
          </>
        ) : null}
        <g className="wheel-sectors">
          {sectors.map((sector, i) => {
            const a = angles[i]!;
            const dim = active !== null && active !== i;
            const arcId = `${idPrefix}-arc-${sector.key}`;
            return (
              <g
                key={sector.key}
                className="wheel-sector"
                data-dim={dim || undefined}
                data-active={active === i || undefined}
              >
                {full ? (
                  <>
                    <path
                      d={wedgePath(SECTOR.inner, SECTOR.outer, a.start, a.end)}
                      fill={sector.color}
                    />
                    {foodSpots(a.mid, span, sector.foods.length).map(([x, y], j) => (
                      <image
                        key={`${sector.key}-${j}`}
                        href={sector.foods[j]}
                        x={x - FOOD_SIZE / 2}
                        y={y - FOOD_SIZE / 2}
                        width={FOOD_SIZE}
                        height={FOOD_SIZE}
                        className="wheel-food"
                      />
                    ))}
                  </>
                ) : null}
                {sector.label ? (
                  <>
                    <path
                      id={arcId}
                      d={labelArc(a.mid, span / 2 - 3, a.mid + rotation)}
                      fill="none"
                    />
                    <text className="wheel-label" fontSize={LABEL.size}>
                      <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                        {sector.label}
                      </textPath>
                    </text>
                  </>
                ) : null}
              </g>
            );
          })}
          {full && sectors.length > 1
            ? angles.map((a) => {
                const [x0, y0] = polar(SECTOR.inner - 2, a.start);
                const [x1, y1] = polar(SECTOR.outer + 1, a.start);
                return (
                  <line
                    key={a.start}
                    x1={x0}
                    y1={y0}
                    x2={x1}
                    y2={y1}
                    stroke="var(--surface)"
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                );
              })
            : null}
        </g>
        {full ? <circle r={SECTOR.inner} fill="var(--surface)" /> : null}
      </svg>
      {children ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
