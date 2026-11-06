"use client";

import { useCallback, useState, type ComponentProps } from "react";
import { HeroPlate } from "@/features/plate-3d/hero-plate";
import { ExampleDayCard } from "./example-day-card";

type CardProps = Omit<ComponentProps<typeof ExampleDayCard>, "shown" | "onShow">;

/**
 * O dia exemplo do hero com o prato 3D por trás (a partir de md): o cartão assenta no prato, que
 * espreita por baixo dele (centro na base do cartão, visto de lado, para as peças se verem). O prato
 * fica fora da grelha (absolute), por isso o hero tem a mesma disposição com ou sem 3D, e cabe
 * entre o cartão e a secção seguinte (sem scroll horizontal: 112 % do cartão, centrado).
 */
export function ExampleDayHero(props: CardProps) {
  const [shown, setShown] = useState(false);
  const onShow = useCallback(() => setShown(true), []);
  return (
    <div className="relative isolate">
      <HeroPlate
        shown={shown}
        meals={props.meals}
        target={props.target}
        className="absolute top-full left-1/2 -z-10 hidden aspect-[2/1] w-[112%] -translate-1/2 md:block"
      />
      <ExampleDayCard {...props} shown={shown} onShow={onShow} />
    </div>
  );
}
