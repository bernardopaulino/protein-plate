"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CountUp } from "@/components/count-up";
import { Illustration } from "@/components/illustration";
import { ProteinNumber } from "@/components/protein/protein-number";
import { MealGlyph, mealColor } from "@/components/wheel/sector-glyph";
import { Wheel } from "@/components/wheel/wheel";
import type { Meal } from "@/domain/meals";
import type { PlateItem } from "@/domain/plate-layout";
import { formatProtein } from "@/domain/protein";
import { LazyPlate3D } from "@/features/plate-3d/lazy-plate";
import { canUse3D, whenIdleAfterLcp } from "@/features/plate-3d/support";
import { DEFAULT_VIEW } from "@/features/plate-3d/view";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

export interface StoryItem {
  id: string;
  foodId: string;
  count: number;
  name: string;
  portion: string;
  protein: number;
  image: string;
}

export interface StoryMeal {
  key: Meal;
  label: string;
  protein: number;
  items: StoryItem[];
}

/** A roda inclina-se como um prato visto da mesa; o 3D usa a mesma inclinação. */
const TILT_DEG = 38;
const ELEVATION = Math.asin(Math.cos((TILT_DEG * Math.PI) / 180));
const DESKTOP = "(min-width: 64rem)";
/** O prato 3D enquadrado com folga, para as legendas do aro (em SVG, por cima) ficarem por fora. */
const PLATE_FRAME = 1.12;

/** A rotação (graus) que traz a fatia `index` para a frente (o fundo da roda inclinada). */
function frontRotation(index: number, count: number): number {
  return 180 - ((index + 0.5) * 360) / count;
}

/** O passo mais curto entre duas rotações (a roda nunca dá a volta inteira para lá chegar). */
function nearest(previous: number, target: number): number {
  const delta = ((((target - previous) % 360) + 540) % 360) - 180;
  return previous + delta;
}

/**
 * A história da página inicial: o hero e o dia exemplo à esquerda; a roda fixa à direita, que gira
 * para trazer à frente a refeição que se está a ler, acende a fatia dela e esbate as outras, e no
 * fim mostra o dia inteiro. No desktop (lg), depois do LCP e com o browser livre, a roda passa a
 * ser o prato 3D com os alimentos do dia; no telemóvel fica a roda em SVG, por baixo do título, sem
 * pedir o three. O texto é a fonte de verdade: a roda é decorativa.
 */
export function LandingStory({
  hero,
  title,
  caption,
  totalLabel,
  reachedLabel,
  ofTargetLabel,
  meals,
  total,
  target,
  close,
}: {
  hero: ReactNode;
  title: string;
  caption: string;
  totalLabel: string;
  reachedLabel: string;
  /** "de 160 g" */
  ofTargetLabel: string;
  meals: StoryMeal[];
  total: number;
  target: number;
  /** O fecho do capítulo do total (o botão). */
  close: ReactNode;
}) {
  const lang = HTML_LANG[useLocale() as Locale];
  const format = useCallback((n: number) => formatProtein(n, lang), [lang]);
  const order = useMemo(() => meals.map((m) => m.key), [meals]);
  const [active, setActive] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const chapters = useRef<HTMLDivElement>(null);

  // A refeição que está a meio do ecrã comanda a roda (a manivela é o scroll)
  useEffect(() => {
    const root = chapters.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const value = (entry.target as HTMLElement).dataset.chapter;
          const index = value === undefined || value === "" ? null : Number(value);
          setActive(index !== null && index < meals.length ? index : null);
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    root.querySelectorAll("[data-chapter]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [meals.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a rotação acumula a anterior
    setRotation((previous) =>
      nearest(previous, active === null ? 0 : frontRotation(active, meals.length)),
    );
  }, [active, meals.length]);

  // O prato 3D: só no desktop, depois do LCP, com WebGL e sem poupança de dados
  const [show3D, setShow3D] = useState(false);
  const [ready3D, setReady3D] = useState(false);
  useEffect(() => {
    if (!window.matchMedia(DESKTOP).matches) return;
    return whenIdleAfterLcp(() => {
      if (canUse3D()) setShow3D(true);
    });
  }, []);

  const plateItems = useMemo<PlateItem[]>(
    () =>
      meals.flatMap((m) =>
        m.items.map((i) => ({ id: i.id, meal: m.key, foodId: i.foodId, count: i.count })),
      ),
    [meals],
  );
  const span = (Math.PI * 2) / Math.max(1, meals.length);
  const view = useMemo(
    () => (active === null ? DEFAULT_VIEW : { yaw: -Math.PI + (active + 0.5) * span, pitch: 0 }),
    [active, span],
  );

  const sectors = meals.map((m) => ({
    key: m.key,
    color: mealColor(m.key),
    foods: m.items.map((i) => i.image),
    label: m.label,
  }));
  const focus = active === null ? null : meals[active]!;
  const hubValue = focus ? focus.protein : total;
  const hubLabel = focus ? focus.label : totalLabel;
  const hubCaption = focus ? null : ofTargetLabel;

  const hub = (
    // O cubo deitado como a roda (elipse com a mesma inclinação), para não tapar a comida da frente
    <div className="grid aspect-[1/0.8] w-[36%] place-items-center rounded-[50%] bg-surface text-center shadow-[0_18px_36px_-16px_rgb(31_27_22/0.5)]">
      <div className="px-2">
        <p className="truncate font-display text-[clamp(0.85rem,1.5vw,1.2rem)] font-bold text-muted">
          {hubLabel}
        </p>
        <p className="font-display text-[clamp(2.5rem,6.2vw,5.25rem)] leading-[0.9] font-extrabold tracking-[-0.04em] text-primary">
          <CountUp value={hubValue} format={format} />
          <span className="ml-0.5 text-[0.5em] text-muted">g</span>
        </p>
        {hubCaption ? (
          <p className="text-[clamp(0.8rem,1.3vw,1.05rem)] font-semibold text-muted tabular">
            {hubCaption}
          </p>
        ) : null}
      </div>
    </div>
  );

  const wheelProps = {
    sectors,
    progress: total / target,
    reached: total >= target,
    active,
    rotation,
    tilt: TILT_DEG,
  };

  return (
    <div className="landing-bleed lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14 xl:gap-20">
      <div>
        <div className="flex flex-col justify-center lg:min-h-[calc(100svh-4rem)] lg:py-10">
          {hero}
        </div>

        {/* Telemóvel e tablet: a roda por baixo do título (SVG, sem three) */}
        <div aria-hidden className="mx-auto mt-10 w-[min(100%,26rem)] lg:hidden">
          <Wheel {...wheelProps} active={null} rotation={0} tilt={28} idPrefix="roda-m">
            {hub}
          </Wheel>
        </div>

        <section aria-labelledby="dia-exemplo" className="mt-16 lg:mt-0">
          <h2
            id="dia-exemplo"
            className="text-[2rem] leading-tight font-extrabold lg:text-[2.75rem]"
          >
            {title}
          </h2>
          <p className="mt-2 text-lg text-muted">{caption}</p>

          <div ref={chapters}>
            <ol className="mt-8 flex flex-col gap-12 lg:mt-0 lg:gap-0">
              {meals.map((meal, i) => (
                <li
                  key={meal.key}
                  data-chapter={i}
                  className="flex flex-col justify-center lg:min-h-[72svh]"
                >
                  <div>
                    <p className="flex items-center gap-3">
                      <MealGlyph meals={order} meal={meal.key} className="size-9" />
                      <span className="font-display text-xl font-bold">{meal.label}</span>
                    </p>
                    <p className="mt-3">
                      <ProteinNumber
                        value={meal.protein}
                        size="hero"
                        className="text-[clamp(3.25rem,5.5vw,4.5rem)] leading-none"
                      />
                    </p>
                    <ul className="mt-5 flex flex-col">
                      {meal.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-4 border-t border-border py-3 last:border-b"
                        >
                          <Illustration src={item.image} size={44} />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-sm text-muted">{item.portion}</span>
                          </span>
                          <ProteinNumber value={item.protein} size="md" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
            <div
              data-chapter=""
              className="mt-14 flex flex-col justify-center lg:mt-0 lg:min-h-[80svh]"
            >
              <p className="font-display text-xl font-bold">{totalLabel}</p>
              <p className="mt-2 flex flex-wrap items-baseline gap-x-4">
                <ProteinNumber value={total} size="hero" className="text-display text-primary" />
                <span className="text-2xl text-muted tabular">{ofTargetLabel}</span>
              </p>
              <p className="mt-4 inline-flex w-fit rounded-full bg-accent px-4 py-1.5 text-lg font-bold text-[#1f1b16]">
                {reachedLabel}
              </p>
              <div className="mt-8">{close}</div>
            </div>
          </div>
        </section>
      </div>

      {/* Desktop: a roda fixa ao lado, que gira com a leitura (e passa a 3D quando o three chega) */}
      <div aria-hidden className="hidden lg:block">
        <div className="sticky top-16 flex h-[calc(100svh-4rem)] items-center">
          <div className="relative w-[118%] shrink-0">
            <Wheel
              {...wheelProps}
              idPrefix="roda-d"
              className={cn(
                "transition-opacity duration-700 ease-out",
                ready3D && "[&_.wheel-svg]:opacity-0",
              )}
            >
              {hub}
            </Wheel>
            {show3D ? (
              <LazyPlate3D
                items={plateItems}
                meals={order}
                total={total}
                target={target}
                dropInitial
                view={view}
                smoothView
                activeSector={active}
                elevation={ELEVATION}
                frame={PLATE_FRAME}
                className={cn(
                  "absolute inset-0 -z-10 transition-opacity duration-700 ease-out",
                  ready3D ? "opacity-100" : "opacity-0",
                )}
                onReady={() => setReady3D(true)}
                onUnavailable={() => {
                  setShow3D(false);
                  setReady3D(false);
                }}
              />
            ) : null}
            {ready3D ? (
              <Wheel
                {...wheelProps}
                layer="labels"
                idPrefix="roda-3d"
                className="pointer-events-none absolute inset-0"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
