import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * O tailwind-merge não conhece os tamanhos de letra do tema (`text-hero` em globals.css) e tomava-os
 * por cores: `cn("text-hero", "text-primary")` deixava só a cor (os números grandes ficavam
 * pequenos). Aqui ficam declarados como tamanhos.
 */
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["hero"] } },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
