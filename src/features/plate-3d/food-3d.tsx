"use client";

import { Box, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import type { PlateItem } from "@/domain/plate-layout";
import { cn } from "@/lib/cn";
import { LazyPlate3D } from "./lazy-plate";
import { DEFAULT_VIEW, type PlateView } from "./view";
import { canUse3D, mightUse3D } from "./support";

const YAW_STEP = Math.PI / 12;
const PITCH_STEP = 0.1;
const PITCH = { min: -0.3, max: 0.5 } as const;
const DRAG_SPEED = 0.01;

const clampPitch = (pitch: number) => Math.min(PITCH.max, Math.max(PITCH.min, pitch));

/**
 * "Ver em 3D" no detalhe de um alimento: o three e o modelo só se pedem depois do clique. Mostra o
 * alimento na porção típica (`count` unidades, por exemplo 2 ovos); roda ao arrastar ou com as
 * setas (o quadro tem foco) e "Repor vista" volta ao início. Sem WebGL ou com poupança de dados,
 * o botão desaparece e a página fica como sempre.
 */
export function Food3D({
  foodId,
  count,
  label,
  className,
}: {
  foodId: string;
  /** Peças a mostrar (unidades da porção típica; 1 para o que não se conta). */
  count: number;
  /** "Ovo, 1 ovo médio" (nome acessível do quadro). */
  label: string;
  className?: string;
}) {
  const t = useTranslations("plate3d");
  const [supported, setSupported] = useState(true);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PlateView>(DEFAULT_VIEW);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const hintId = useId();
  const panelId = useId();

  useEffect(() => {
    // Decide-se depois de hidratar (o HTML estático tem sempre o botão: sem saltos no layout); o
    // teste com um contexto WebGL a sério só no clique
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!mightUse3D()) setSupported(false);
  }, []);

  const items = useMemo<PlateItem[]>(
    () => [{ id: foodId, meal: "almoco", foodId, count }],
    [foodId, count],
  );
  const meals = useMemo(() => ["almoco" as const], []);

  if (!supported) return null;

  const onKeyDown = (event: KeyboardEvent) => {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-YAW_STEP, 0],
      ArrowRight: [YAW_STEP, 0],
      ArrowUp: [0, -PITCH_STEP],
      ArrowDown: [0, PITCH_STEP],
    };
    const delta = step[event.key];
    if (!delta) return;
    event.preventDefault();
    setView((v) => ({ yaw: v.yaw + delta[0], pitch: clampPitch(v.pitch + delta[1]) }));
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open && !canUse3D()) {
            setSupported(false);
            return;
          }
          setOpen(!open);
          setView(DEFAULT_VIEW);
        }}
      >
        {open ? <X aria-hidden /> : <Box aria-hidden />}
        {open ? t("hide") : t("view")}
      </Button>
      <div id={panelId} hidden={!open} className="w-full max-w-xl">
        {open ? (
          <div className="mt-3 flex flex-col gap-2">
            <div
              role="group"
              tabIndex={0}
              aria-label={t("viewerLabel", { food: label })}
              aria-describedby={hintId}
              data-food-viewer=""
              data-yaw={view.yaw.toFixed(2)}
              data-pitch={view.pitch.toFixed(2)}
              onKeyDown={onKeyDown}
              onPointerDown={(e) => {
                drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d || d.id !== e.pointerId) return;
                const dx = e.clientX - d.x;
                const dy = e.clientY - d.y;
                drag.current = { ...d, x: e.clientX, y: e.clientY };
                setView((v) => ({
                  yaw: v.yaw + dx * DRAG_SPEED,
                  pitch: clampPitch(v.pitch + dy * DRAG_SPEED),
                }));
              }}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              className={cn(
                "relative aspect-[4/3] w-full cursor-grab touch-none overflow-hidden rounded-card border border-border bg-surface",
                "active:cursor-grabbing",
              )}
            >
              <LazyPlate3D
                items={items}
                meals={meals}
                total={0}
                target={0}
                showRing={false}
                view={view}
                frame="content"
                elevation={0.7}
                className="absolute inset-0"
                onUnavailable={() => {
                  setOpen(false);
                  setSupported(false);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p id={hintId} className="text-sm text-muted">
                {t("hint")}
              </p>
              <Button type="button" variant="ghost" onClick={() => setView(DEFAULT_VIEW)}>
                <RotateCcw aria-hidden />
                {t("reset")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
