"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RecipeCard } from "@/components/protein/recipe-card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { setRecipeFavoriteAction } from "@/server/actions/account";

export interface LibraryRecipe {
  id: string;
  title: string;
  summary: string;
  proteinPerServingG: number;
  prepMinutes: number;
}

type Saved = LibraryRecipe & { favorite: boolean };

function Card({ recipe, className }: { recipe: LibraryRecipe; className?: string }) {
  const td = useTranslations("recipes.detail");
  return (
    <RecipeCard
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

const GRID = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";

/**
 * O livro de receitas (/receitas): as guardadas (favoritas primeiro, com a estrela para marcar e
 * um filtro "Só favoritas") e as recentes (tudo o que a pessoa gerou).
 */
export function RecipeLibrary({ recent, saved }: { recent: LibraryRecipe[]; saved: Saved[] }) {
  const t = useTranslations("recipes");
  const [list, setList] = useState(saved);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const toggle = async (id: string, favorite: boolean) => {
    setList((l) => l.map((r) => (r.id === id ? { ...r, favorite } : r)));
    const result = await setRecipeFavoriteAction({ recipeId: id, favorite }).catch(() => null);
    if (!result?.ok)
      setList((l) => l.map((r) => (r.id === id ? { ...r, favorite: !favorite } : r)));
  };

  const favorites = list.filter((r) => r.favorite).length;
  const shown = [...(onlyFavorites ? list.filter((r) => r.favorite) : list)].sort(
    (a, b) => Number(b.favorite) - Number(a.favorite),
  );

  return (
    <div className="mt-10 flex flex-col gap-12">
      <section aria-labelledby="guardadas" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="guardadas" className="text-xl font-bold">
            {t("saved")}
          </h2>
          {favorites > 0 ? (
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
        {list.length === 0 ? (
          <p className="text-muted">{t("savedEmpty")}</p>
        ) : (
          <ul className={GRID}>
            {shown.map((r) => (
              <li key={r.id} className="relative min-w-0">
                <Card recipe={r} className="pr-14" />
                <button
                  type="button"
                  aria-pressed={r.favorite}
                  aria-label={t(r.favorite ? "unmarkFavorite" : "markFavorite", { title: r.title })}
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
        )}
      </section>

      <section aria-labelledby="recentes" className="flex flex-col gap-4">
        <h2 id="recentes" className="text-xl font-bold">
          {t("recent")}
        </h2>
        {recent.length === 0 ? (
          <p className="text-muted">{t("recentEmpty")}</p>
        ) : (
          <ul className={GRID}>
            {recent.map((r) => (
              <li key={r.id} className="min-w-0">
                <Card recipe={r} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
