import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  DoubleSide,
  LatheGeometry,
  RingGeometry,
  Vector2,
  type Group,
  type Object3D,
} from "three";
import type { PlatePiece } from "@/domain/plate-layout";
import type { Easing } from "@/lib/easing";
import { DEFAULT_VIEW, type PlateView } from "../view";
import type { ModelLibrary } from "./model-library";
import type { PlateColors } from "./theme";

/**
 * A cena do prato (dentro de um <Canvas> do @react-three/fiber, com frameloop="demand"): o prato,
 * o anel da meta na borda e as peças dos alimentos. Sem dependências do Next: só React, three e o
 * domínio. Nada anda sozinho; cada animação pede os frames de que precisa (invalidate) e para.
 */

/** Altura do fundo do prato e da aba (onde fica o anel). */
const PLATE_TOP = 0;
const RIM_TOP = 0.055;
/** Duração da queda de uma peça nova e da mudança de lugar (entre 250 e 350 ms). */
export const DROP_MS = 300;
const DROP_HEIGHT = 0.45;
const RING_MS = 250;
const RING_SEGMENTS = 160;

export interface PlateSceneProps {
  pieces: readonly PlatePiece[];
  modelUrl: (foodId: string) => string;
  library: ModelLibrary;
  colors: PlateColors;
  ease: Easing;
  /** Proteína do dia sobre a meta (0 a 1). */
  progress: number;
  reached: boolean;
  /** false com prefers-reduced-motion: tudo aparece logo no sítio. */
  motion: boolean;
  /** As peças do primeiro desenho também caem (página inicial); senão só as novas. */
  dropInitial?: boolean;
  showRing?: boolean;
  view?: PlateView;
  /** Raio (em unidades do prato) que a câmara enquadra. */
  frame?: number;
  /** Inclinação da câmara: 0 = de lado, π/2 = de cima. */
  elevation?: number;
  onReady?: () => void;
  onAnimatingChange?: (animating: boolean) => void;
}

export function PlateScene({
  pieces,
  modelUrl,
  library,
  colors,
  ease,
  progress,
  reached,
  motion,
  dropInitial = false,
  showRing = true,
  view = DEFAULT_VIEW,
  frame = 1.02,
  elevation = 0.95,
  onReady,
  onAnimatingChange,
}: PlateSceneProps) {
  const invalidate = useThree((s) => s.invalidate);
  const urls = useMemo(
    () => [...new Set(pieces.map((p) => modelUrl(p.foodId)))],
    [pieces, modelUrl],
  );
  const [templates, setTemplates] = useState<ReadonlyMap<string, Object3D>>(new Map());
  const ready = urls.every((url) => templates.has(url));

  useEffect(() => {
    let alive = true;
    for (const url of urls) {
      if (templates.has(url)) continue;
      library
        .load(url)
        .then((model) => {
          if (alive) setTemplates((current) => new Map(current).set(url, model));
        })
        // Sem o modelo (rede), a peça não aparece; o resto do prato continua
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [urls, templates, library]);

  // As peças que já estavam no primeiro desenho completo não caem (exceto na página inicial)
  // (estado derivado no render: decide-se uma vez, quando os modelos chegam pela primeira vez)
  const [settled, setSettled] = useState<ReadonlySet<string> | null>(null);
  if (!settled && ready) setSettled(new Set(dropInitial ? [] : pieces.map((p) => p.key)));

  useEffect(() => {
    if (ready && settled) {
      invalidate();
      onReady?.();
    }
  }, [ready, settled, invalidate, onReady]);

  // Quantas peças estão a mexer-se (para o data-animating do wrapper e para os testes)
  const moving = useRef(0);
  const report = useRef(onAnimatingChange);
  useEffect(() => {
    report.current = onAnimatingChange;
  }, [onAnimatingChange]);
  const animation = useMemo(
    () => ({
      start: () => {
        if (moving.current++ === 0) report.current?.(true);
      },
      end: () => {
        if (--moving.current === 0) report.current?.(false);
      },
    }),
    [],
  );

  // Luz branca quente (um toque do --accent), igual nos dois temas: a comida tem as cores dela; o
  // chão reflete o --bg (no escuro, sombras mais fundas)
  const light = useMemo(
    () => "#" + new Color("#ffffff").lerp(new Color(colors.accent), 0.12).getHexString(),
    [colors.accent],
  );

  return (
    <>
      <CameraRig frame={frame} elevation={elevation + view.pitch} />
      <hemisphereLight args={[light, colors.ground, 1.9]} />
      <directionalLight position={[-2.5, 5, 3]} intensity={2.2} color={light} />
      <group rotation-y={view.yaw}>
        <Plate color={colors.plate} />
        {showRing ? (
          <GoalRing
            progress={progress}
            reached={reached}
            colors={colors}
            motion={motion}
            ease={ease}
          />
        ) : null}
        {settled
          ? pieces.map((piece) => {
              const template = templates.get(modelUrl(piece.foodId));
              return template ? (
                <Piece
                  key={piece.key}
                  piece={piece}
                  template={template}
                  dropIn={motion && !settled.has(piece.key)}
                  motion={motion}
                  ease={ease}
                  animation={animation}
                />
              ) : null;
            })
          : null}
      </group>
    </>
  );
}

/** Altura das peças mais altas (em unidades do prato), para o enquadramento não as cortar. */
const PIECE_HEIGHT = 0.25;

/**
 * A câmara olha para o centro do prato e enquadra o disco de raio `frame` visto com esta
 * inclinação (uma elipse: largura 2·frame, altura 2·frame·sen(inclinação) mais as peças), em
 * qualquer proporção do canvas.
 */
function CameraRig({ frame, elevation }: { frame: number; elevation: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    if (!("fov" in camera)) return;
    const vertical = (camera.fov * Math.PI) / 180;
    const aspect = size.width / Math.max(1, size.height);
    const halfWidth = frame;
    const halfHeight = frame * Math.sin(elevation) + PIECE_HEIGHT * Math.cos(elevation);
    // A perspetiva aumenta a borda de perto: 5 % de folga
    const distance =
      1.05 *
      Math.max(halfWidth / (Math.tan(vertical / 2) * aspect), halfHeight / Math.tan(vertical / 2));
    camera.position.set(0, Math.sin(elevation) * distance, Math.cos(elevation) * distance);
    camera.lookAt(0, (PIECE_HEIGHT / 2) * Math.cos(elevation), 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, frame, elevation, invalidate]);
  return null;
}

/** O prato: fundo plano, uma subida curta e a aba plana onde vive o anel. */
function Plate({ color }: { color: string }) {
  const geometry = useMemo(
    () =>
      new LatheGeometry(
        [
          [0, -0.04],
          [0.7, -0.04],
          [0.98, 0.0],
          [1.0, 0.035],
          [1.0, RIM_TOP],
          [0.88, RIM_TOP],
          [0.84, PLATE_TOP + 0.01],
          [0.82, PLATE_TOP],
          [0, PLATE_TOP],
        ].map(([x, y]) => new Vector2(x, y)),
        96,
      ),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={0.85} side={DoubleSide} />
    </mesh>
  );
}

/**
 * O GoalProgress em 3D: a faixa da aba é o fundo (--track; --accent ao chegar à meta, só como
 * fundo, como no 2D) e o anel enche em --primary, no sentido dos ponteiros do relógio a partir de
 * cima. Materiais sem luz: as cores ficam iguais às dos tokens.
 */
function GoalRing({
  progress,
  reached,
  colors,
  motion,
  ease,
}: {
  progress: number;
  reached: boolean;
  colors: PlateColors;
  motion: boolean;
  ease: Easing;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const band = useMemo(() => new RingGeometry(0.885, 0.995, RING_SEGMENTS), []);
  const fill = useMemo(
    () => new RingGeometry(0.905, 0.975, RING_SEGMENTS, 1, Math.PI / 2, Math.PI * 2),
    [],
  );
  useEffect(
    () => () => {
      band.dispose();
      fill.dispose();
    },
    [band, fill],
  );

  const target = Math.max(0, Math.min(1, progress));
  const shown = useRef(motion ? 0 : target);
  const tween = useRef<{ from: number; start: number | null } | null>(null);

  const apply = (value: number) => {
    shown.current = value;
    // Cada segmento são 2 triângulos (6 índices), pela ordem do ângulo
    fill.setDrawRange(0, Math.round(value * RING_SEGMENTS) * 6);
  };

  useLayoutEffect(() => {
    if (!motion) {
      tween.current = null;
      apply(target);
    } else {
      tween.current = { from: shown.current, start: null };
    }
    invalidate();
    // apply só mexe na geometria memorizada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, motion, invalidate]);

  useFrame(() => {
    const t = tween.current;
    if (!t) return;
    const now = performance.now();
    t.start ??= now;
    const k = Math.min(1, (now - t.start) / RING_MS);
    apply(t.from + (target - t.from) * ease(k));
    if (k < 1) invalidate();
    else tween.current = null;
  });

  return (
    // Deitado na aba; o -1 em x troca o sentido para o dos ponteiros do relógio
    <group position-y={RIM_TOP + 0.001} rotation-x={-Math.PI / 2} scale={[-1, 1, 1]}>
      <mesh geometry={band}>
        <meshBasicMaterial
          color={reached ? colors.accent : colors.track}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh geometry={fill} position-z={0.002}>
        <meshBasicMaterial
          color={colors.primary}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </group>
  );
}

interface Pose {
  x: number;
  y: number;
  z: number;
  s: number;
}

/** Uma peça: cai no prato quando é nova e muda de lugar com a mesma curva quando o setor se arruma. */
function Piece({
  piece,
  template,
  dropIn,
  motion,
  ease,
  animation,
}: {
  piece: PlatePiece;
  template: Object3D;
  dropIn: boolean;
  motion: boolean;
  ease: Easing;
  animation: { start: () => void; end: () => void };
}) {
  const invalidate = useThree((s) => s.invalidate);
  const group = useRef<Group>(null);
  // Os clones partilham a geometria e os materiais do modelo (libertados pela ModelLibrary)
  const object = useMemo(() => template.clone(true), [template]);
  const tween = useRef<{ from: Pose; to: Pose; start: number | null } | null>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const node = group.current;
    if (!node) return;
    const to: Pose = { x: piece.x, y: PLATE_TOP, z: piece.z, s: piece.radius };
    const from: Pose | null = first.current
      ? dropIn
        ? { ...to, y: PLATE_TOP + DROP_HEIGHT, s: to.s * 0.85 }
        : null
      : motion
        ? { x: node.position.x, y: node.position.y, z: node.position.z, s: node.scale.x }
        : null;
    first.current = false;
    if (from) {
      if (!tween.current) animation.start();
      tween.current = { from, to, start: null };
      setPose(node, from);
    } else {
      if (tween.current) animation.end();
      tween.current = null;
      setPose(node, to);
    }
    invalidate();
    // A queda só se decide ao montar; depois, só a pose muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece.x, piece.z, piece.radius]);

  useEffect(
    () => () => {
      if (tween.current) animation.end();
    },
    [animation],
  );

  useFrame(() => {
    const t = tween.current;
    const node = group.current;
    if (!t || !node) return;
    const now = performance.now();
    t.start ??= now;
    const k = Math.min(1, (now - t.start) / DROP_MS);
    const e = ease(k);
    setPose(node, {
      x: t.from.x + (t.to.x - t.from.x) * e,
      y: t.from.y + (t.to.y - t.from.y) * e,
      z: t.from.z + (t.to.z - t.from.z) * e,
      s: t.from.s + (t.to.s - t.from.s) * e,
    });
    if (k < 1) {
      invalidate();
    } else {
      tween.current = null;
      animation.end();
    }
  });

  return (
    <group ref={group} rotation-y={piece.rotation}>
      <primitive object={object} />
    </group>
  );
}

function setPose(node: Group, pose: Pose) {
  node.position.set(pose.x, pose.y, pose.z);
  node.scale.setScalar(pose.s);
}
