import { useEffect, useState, type RefObject } from "react";
import { EASE_OUT, cubicBezier, parseCubicBezier, type Easing } from "@/lib/easing";

/** As cores do prato, do anel e da luz, lidas dos tokens CSS (claro ou escuro). */
export interface PlateColors {
  plate: string;
  track: string;
  primary: string;
  accent: string;
  /** A luz que vem do chão (o fundo da página). */
  ground: string;
}

export interface PlateTheme {
  colors: PlateColors;
  ease: Easing;
}

const FALLBACK: PlateColors = {
  plate: "#ffffff",
  track: "#eae3d8",
  primary: "#2f6b3a",
  accent: "#f2b33d",
  ground: "#fbf8f3",
};

export function readPlateTheme(element: Element): PlateTheme {
  const style = getComputedStyle(element);
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    colors: {
      plate: token("--surface", FALLBACK.plate),
      track: token("--track", FALLBACK.track),
      primary: token("--primary", FALLBACK.primary),
      accent: token("--accent", FALLBACK.accent),
      ground: token("--bg", FALLBACK.ground),
    },
    ease: cubicBezier(parseCubicBezier(token("--ease-out", "")) ?? EASE_OUT),
  };
}

/**
 * As cores dos tokens no elemento (null até montar), atualizadas quando o tema do sistema muda ou
 * quando uma classe .dark/.light muda no documento.
 */
export function usePlateTheme(ref: RefObject<Element | null>): PlateTheme | null {
  const [theme, setTheme] = useState<PlateTheme | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setTheme(readPlateTheme(element));
    update();
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    return () => {
      scheme.removeEventListener("change", update);
      observer.disconnect();
    };
  }, [ref]);
  return theme;
}
