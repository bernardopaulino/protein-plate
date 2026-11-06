"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { foodModelUrl } from "@/content/food-models.generated";
import type { Meal } from "@/domain/meals";
import { plateLayout, type PlateItem } from "@/domain/plate-layout";
import { roundForDisplay } from "@/domain/protein";
import { cn } from "@/lib/cn";
import { ModelLibrary } from "./scene/model-library";
import { PlateScene } from "./scene/plate-scene";
import { usePlateTheme } from "./scene/theme";
import { useReducedMotion } from "./support";
import type { PlateView } from "./view";

export interface Plate3DProps {
  items: readonly PlateItem[];
  meals: readonly Meal[];
  total: number;
  target: number;
  dropInitial?: boolean;
  showRing?: boolean;
  view?: PlateView;
  /** Raio a enquadrar; "content" enquadra só as peças (o visualizador do detalhe). */
  frame?: number | "content";
  elevation?: number;
  className?: string;
  /** Contexto WebGL perdido: quem usa o prato deixa de o mostrar. */
  onUnavailable?: () => void;
}

/**
 * O canvas do prato (só no cliente, carregado com next/dynamic). É decorativo (aria-hidden): o
 * GoalProgress em HTML é a fonte de verdade e o que os leitores de ecrã leem. O wrapper diz quantas
 * peças há (data-pieces), se os modelos já chegaram (data-ready) e se alguma se mexe
 * (data-animating), para os testes.
 */
export default function Plate3D({
  items,
  meals,
  total,
  target,
  dropInitial,
  showRing,
  view,
  frame,
  elevation,
  className,
  onUnavailable,
}: Plate3DProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const theme = usePlateTheme(wrapper);
  const reducedMotion = useReducedMotion();
  const [library] = useState(() => new ModelLibrary());
  useEffect(() => () => library.dispose(), [library]);

  const layout = useMemo(() => plateLayout(items, meals), [items, meals]);
  const frameRadius = useMemo(() => {
    if (frame !== "content") return frame;
    const reach = Math.max(0, ...layout.pieces.map((p) => Math.hypot(p.x, p.z) + p.radius));
    return Math.min(1.02, Math.max(0.42, reach * 1.35));
  }, [frame, layout]);
  const [ready, setReady] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [lost, setLost] = useState(false);
  const unavailable = useRef(onUnavailable);
  useEffect(() => {
    unavailable.current = onUnavailable;
  }, [onUnavailable]);

  const onReady = useCallback(() => setReady(true), []);
  const progress = target > 0 ? total / target : 0;
  // A mesma regra do GoalProgress: atingida quando o que falta, arredondado, é 0
  const reached = target > 0 && roundForDisplay(Math.max(0, target - total)) === 0;

  if (lost) return null;

  return (
    <div
      ref={wrapper}
      aria-hidden
      data-plate-3d=""
      data-pieces={layout.pieces.length}
      data-ready={ready}
      data-animating={animating}
      className={cn("pointer-events-none select-none", className)}
    >
      {theme ? (
        <Canvas
          frameloop="demand"
          flat
          dpr={[1, 2]}
          camera={{ fov: 30, near: 0.1, far: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              () => {
                setLost(true);
                unavailable.current?.();
              },
              { once: true },
            );
          }}
        >
          <PlateScene
            pieces={layout.pieces}
            modelUrl={foodModelUrl}
            library={library}
            colors={theme.colors}
            ease={theme.ease}
            progress={progress}
            reached={reached}
            motion={!reducedMotion}
            dropInitial={dropInitial}
            showRing={showRing}
            view={view}
            frame={frameRadius}
            elevation={elevation}
            onReady={onReady}
            onAnimatingChange={setAnimating}
          />
        </Canvas>
      ) : null}
    </div>
  );
}
