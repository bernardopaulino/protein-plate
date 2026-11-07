import { FOOD_SECTIONS, type FoodSection } from "@/domain/food-groups";
import type { Meal } from "@/domain/meals";
import { cn } from "@/lib/cn";
import { polar, sectorAngles, wedgePath } from "./geometry";

/**
 * Uma roda pequena (a marca de fatia): `parts` setores iguais, os de `filled` acesos. Decorativa;
 * o texto ao lado diz o mesmo.
 */
export function SectorGlyph({
  parts,
  filled,
  color = "var(--primary)",
  className,
}: {
  parts: number;
  /** Índices acesos (ex.: [2] = só o terceiro; [0, 1] = os dois primeiros). */
  filled: readonly number[];
  color?: string;
  className?: string;
}) {
  const angles = sectorAngles(parts);
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="-12 -12 24 24"
      className={cn("size-7 shrink-0", className)}
    >
      {angles.map((a, i) => (
        <path
          key={a.start}
          d={wedgePath(0, 11.5, a.start, a.end)}
          fill={filled.includes(i) ? color : "var(--track)"}
        />
      ))}
      {parts > 1
        ? angles.map((a) => {
            const [x, y] = polar(12, a.start);
            return (
              <line
                key={`s${a.start}`}
                x1={0}
                y1={0}
                x2={x}
                y2={y}
                stroke="var(--bg)"
                strokeWidth={1.6}
              />
            );
          })
        : null}
    </svg>
  );
}

/** A cor da fatia de uma refeição. */
export function mealColor(meal: Meal): string {
  return `var(--meal-${meal})`;
}

/** A fatia de uma refeição no dia (ex.: o almoço é a 2.ª de 4). */
export function MealGlyph({
  meals,
  meal,
  className,
}: {
  meals: readonly Meal[];
  meal: Meal;
  className?: string;
}) {
  return (
    <SectorGlyph
      parts={meals.length}
      filled={[meals.indexOf(meal)]}
      color={mealColor(meal)}
      className={className}
    />
  );
}

/** A fatia de um grupo de alimentos na roda das cinco secções ("all" acende a roda toda). */
export function SectionGlyph({
  section,
  className,
}: {
  section: FoodSection | "all";
  className?: string;
}) {
  const all = section === "all";
  return (
    <SectorGlyph
      parts={FOOD_SECTIONS.length}
      filled={all ? FOOD_SECTIONS.map((_, i) => i) : [FOOD_SECTIONS.indexOf(section)]}
      color={all ? "var(--primary)" : `var(--group-${section})`}
      className={className}
    />
  );
}
