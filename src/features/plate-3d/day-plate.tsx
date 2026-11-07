"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { Meal } from "@/domain/meals";
import { PLATE, type PlateItem } from "@/domain/plate-layout";
import { formatCount, formatProtein } from "@/domain/protein";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { LazyPlate3D } from "./lazy-plate";
import { canUse3D, mightUse3D } from "./support";

const DESKTOP = "(min-width: 1024px)";

/** lg em diante (o prato vai na coluna fixa); null até se saber, no cliente. */
function useDesktop(): boolean | null {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const query = window.matchMedia(DESKTOP);
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

/**
 * O prato do dia no "O meu dia": no desktop (lg) na coluna fixa, por baixo do GoalProgress; no
 * telemóvel num bloco recolhível por cima das refeições, fechado por omissão (o three só se pede ao
 * abrir). Os dois sítios existem no HTML, mas só um tem canvas de cada vez. Sem WebGL ou com
 * poupança de dados não aparece nada.
 */
export function DayPlate({
  placement,
  items,
  meals,
  total,
  target,
  foodName,
  className,
}: {
  placement: "sidebar" | "collapsible";
  items: readonly PlateItem[];
  meals: readonly Meal[];
  total: number;
  target: number;
  foodName: (foodId: string) => string;
  className?: string;
}) {
  const t = useTranslations("plate3d");
  const lang = HTML_LANG[useLocale() as Locale];
  const desktop = useDesktop();
  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const tt = useTranslations("today");

  useEffect(() => {
    // Só no browser, depois de hidratar. No desktop o prato aparece logo: o teste completo (com um
    // contexto WebGL) faz-se já; no telemóvel, só ao abrir o bloco
    const shownNow = placement === "sidebar" && window.matchMedia(DESKTOP).matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(shownNow ? canUse3D() : mightUse3D());
  }, [placement]);

  // A legenda do "×N": os itens com mais porções do que peças no prato
  const legend = useMemo(
    () =>
      items
        .filter((i) => i.count > PLATE.maxPiecesPerItem)
        .map((i) => `${foodName(i.foodId)} ×${formatCount(i.count, lang)}`),
    [items, foodName, lang],
  );

  if (!supported || desktop === null) return null;
  const active = placement === "sidebar" ? desktop : !desktop;
  if (!active) return null;

  const plate = (
    <>
      <div className="relative">
        <LazyPlate3D
          items={items}
          meals={meals}
          total={total}
          target={target}
          className="aspect-square w-full"
          onReady={() => setReady(true)}
          onUnavailable={() => setSupported(false)}
        />
        {/* O cubo da roda: o total do dia (o GoalProgress em HTML continua a ser a fonte de verdade) */}
        {ready ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="grid aspect-square w-[30%] place-items-center rounded-full bg-surface text-center shadow-[0_12px_26px_-14px_rgb(31_27_22/0.5)]">
              <div>
                <p className="font-display text-[clamp(1.5rem,3.2vw,2.25rem)] leading-none font-extrabold tracking-[-0.03em] text-primary tabular">
                  {formatProtein(total, lang)}
                  <span className="ml-0.5 text-[0.5em] text-muted">g</span>
                </p>
                <p className="mt-0.5 text-xs text-muted tabular">
                  {tt("ofTarget", { target: formatProtein(target, lang) })}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {legend.length > 0 ? (
        <p aria-hidden className="px-1 text-center text-sm text-muted">
          {legend.join(" · ")}
        </p>
      ) : null}
    </>
  );

  if (placement === "sidebar") {
    return <div className={cn("flex flex-col gap-1", className)}>{plate}</div>;
  }

  return (
    <details
      className={cn("group rounded-card border border-border bg-surface", className)}
      onToggle={(e) => {
        const next = e.currentTarget.open;
        if (next && !canUse3D()) {
          setSupported(false);
          return;
        }
        setOpen(next);
      }}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 font-semibold [&::-webkit-details-marker]:hidden">
        {t("dayToggle")}
        <ChevronDown
          aria-hidden
          className="size-5 text-muted transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      {open ? <div className="flex flex-col gap-1 px-2 pb-3">{plate}</div> : null}
    </details>
  );
}
