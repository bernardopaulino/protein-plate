"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { FilterChips } from "@/components/protein/chips";
import { RecipeCard } from "@/components/protein/recipe-card";
import { MealGlyph } from "@/components/wheel/sector-glyph";
import { MEALS, type Meal } from "@/domain/meals";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { setRecipeFavoriteAction } from "@/server/actions/account";

export interface LibraryRecipe {
  id: string;
  title: string;
  summary: string;
  meal: Meal;
  proteinPerServingG: number;
  prepMinutes: number;
}

type Saved = LibraryRecipe & { favorite: boolean };
type Tab = "saved" | "recent";
const ALL = "all";

function Card({ recipe, className }: { recipe: LibraryRecipe; className?: string }) {
  const td = useTranslations("recipes.detail");
  const tm = useTranslations("meals");
  return (
    <RecipeCard
      meal={
        <>
          <MealGlyph meals={MEALS} meal={recipe.meal} className="size-5" />
          {tm(recipe.meal)}
        </>
      }
      title={recipe.title}
      summary={recipe.summary}
      proteinPerServing={recipe.proteinPerServingG}
      perServingLabel={td("perServing")}
      minutesLabel={td("time", { minutes: recipe.prepMinutes })}
      href={`/receitas/${recipe.id}`}
      className={cn("h-full", className)}
      renderLink={({ href, className: cls, children }) => (
        <Link href={href} className={cls}>
          {children}
        </Link>
      )}
    />
  );
}

const GRID = "grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

/**
 * O livro de receitas (/receitas): dois separadores, as guardadas (favoritas primeiro, com a estrela
 * para marcar e "Só favoritas") e as recentes (tudo o que a pessoa gerou), com um filtro por
 * refeição. Abre nas guardadas se houver alguma; senão, nas recentes.
 */
export function RecipeLibrary({ recent, saved }: { recent: LibraryRecipe[]; saved: Saved[] }) {
  const t = useTranslations("recipes");
  const tm = useTranslations("meals");
  const ids = useId();
  const [list, setList] = useState(saved);
  const [tab, setTab] = useState<Tab>(saved.length > 0 ? "saved" : "recent");
  const [meal, setMeal] = useState<Meal | typeof ALL>(ALL);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const toggle = async (id: string, favorite: boolean) => {
    setList((l) => l.map((r) => (r.id === id ? { ...r, favorite } : r)));
    const result = await setRecipeFavoriteAction({ recipeId: id, favorite }).catch(() => null);
    if (!result?.ok)
      setList((l) => l.map((r) => (r.id === id ? { ...r, favorite: !favorite } : r)));
  };

  const current: LibraryRecipe[] = tab === "saved" ? list : recent;
  const meals = MEALS.filter((m) => current.some((r) => r.meal === m));
  const byMeal = (r: LibraryRecipe) => meal === ALL || r.meal === meal;
  const favorites = list.filter((r) => r.favorite).length;
  const savedShown = list
    .filter((r) => byMeal(r) && (!onlyFavorites || r.favorite))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite));
  const recentShown = recent.filter(byMeal);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "saved", label: t("library.savedCount"), count: list.length },
    { id: "recent", label: t("library.recentCount"), count: recent.length },
  ];

  return (
    <section aria-labelledby={`${ids}-title`} className="mt-12 flex flex-col gap-5">
      <h2 id={`${ids}-title`} className="text-xl font-bold">
        {t("library.title")}
      </h2>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label={t("library.tabs")}
          className="inline-flex self-start rounded-full border border-border bg-surface p-1"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${ids}-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`${ids}-panel`}
              onClick={() => {
                setTab(item.id);
                setMeal(ALL);
              }}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200",
                tab === item.id ? "bg-primary text-on-primary" : "text-muted hover:text-text",
              )}
            >
              {item.label}
              <span className={cn("tabular", tab === item.id ? "opacity-80" : "text-muted")}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {meals.length > 1 ? (
            <FilterChips
              label={t("library.mealFilter")}
              options={[
                { value: ALL, label: t("library.allMeals") },
                ...meals.map((m) => ({ value: m, label: tm(m) })),
              ]}
              selected={[meal]}
              onChange={(next) => setMeal((next[0] as Meal | undefined) ?? ALL)}
            />
          ) : null}
          {tab === "saved" && favorites > 0 ? (
            <button
              type="button"
              aria-pressed={onlyFavorites}
              onClick={() => setOnlyFavorites((v) => !v)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-200",
                onlyFavorites
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface hover:border-primary/50",
              )}
            >
              <Star aria-hidden className={cn("size-4", onlyFavorites && "fill-accent")} />
              {t("favoritesOnly")}
              <span className="text-muted tabular">{favorites}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div role="tabpanel" id={`${ids}-panel`} aria-labelledby={`${ids}-tab-${tab}`}>
        {tab === "saved" ? (
          list.length === 0 ? (
            <p className="text-muted">{t("savedEmpty")}</p>
          ) : savedShown.length === 0 ? (
            <p className="text-muted">{t("library.noneForMeal")}</p>
          ) : (
            <ul className={GRID}>
              {savedShown.map((r) => (
                <li key={r.id} className="relative min-w-0">
                  <Card recipe={r} className="pr-14" />
                  <button
                    type="button"
                    aria-pressed={r.favorite}
                    aria-label={t(r.favorite ? "unmarkFavorite" : "markFavorite", {
                      title: r.title,
                    })}
                    onClick={() => void toggle(r.id, !r.favorite)}
                    className="absolute top-2 right-2 grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-track hover:text-text"
                  >
                    <Star
                      aria-hidden
                      className={cn("size-5", r.favorite && "fill-accent text-text")}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : recent.length === 0 ? (
          <p className="text-muted">{t("recentEmpty")}</p>
        ) : recentShown.length === 0 ? (
          <p className="text-muted">{t("library.noneForMeal")}</p>
        ) : (
          <ul className={GRID}>
            {recentShown.map((r) => (
              <li key={r.id} className="min-w-0">
                <Card recipe={r} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
