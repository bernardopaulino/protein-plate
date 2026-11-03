"use client";

import { ChefHat, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { FilterChips } from "@/components/protein/chips";
import { Button } from "@/components/ui/button";
import type { RecipeResponse } from "@/domain/contracts/recipe";
import type { Allergen } from "@/domain/food";
import { isMeal, mealTargets, type Meal } from "@/domain/meals";
import { isAllowed, type Diet } from "@/domain/preferences";
import { formatProtein } from "@/domain/protein";
import {
  MAX_MINUTES_OPTIONS,
  type MaxMinutes,
  type RecipeErrorCode,
} from "@/domain/recipe-options";
import { FOOD_INDEX, LISTED_FOODS, foodName } from "@/features/catalog/catalog";
import { useDay } from "@/features/day/use-day";
import { useRouter } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";

export interface RecipeProfile {
  dailyTargetG: number;
  meals: Meal[];
  preWorkoutMeal: Meal | null;
  postWorkoutMeal: Meal | null;
  diet: Diet;
  allergies: Allergen[];
  likedFoods: string[];
  cookMinutes: MaxMinutes;
}

/**
 * Nova receita (ecrã 7): alimentos (os favoritos primeiro, só os que a pessoa pode comer),
 * refeição, tempo e doses. A meta da refeição e o treino vêm do perfil, no servidor.
 */
export function RecipeForm({
  profile,
  initialMeal,
  initialFoods,
  initialMinutes,
  initialServings,
  variant,
}: {
  profile: RecipeProfile;
  initialMeal: string | null;
  initialFoods: string[];
  initialMinutes: number | null;
  initialServings: number;
  variant: number;
}) {
  const t = useTranslations("recipes.form");
  const te = useTranslations("recipes.errors");
  const tm = useTranslations("meals");
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const router = useRouter();
  const { state } = useDay();

  const allowed = (id: string) => {
    const food = FOOD_INDEX.get(id);
    return Boolean(food && food.role !== "pantry" && isAllowed(food, profile));
  };
  const meals = profile.meals;
  const [meal, setMeal] = useState<Meal>(
    initialMeal && isMeal(initialMeal) && meals.includes(initialMeal)
      ? initialMeal
      : (meals[0] ?? "almoco"),
  );
  const validInitial = initialFoods.filter(allowed);
  const [selected, setSelected] = useState<string[]>(validInitial.slice(0, 6));
  const [minutes, setMinutes] = useState<MaxMinutes>(
    initialMinutes !== null && (MAX_MINUTES_OPTIONS as readonly number[]).includes(initialMinutes)
      ? (initialMinutes as MaxMinutes)
      : profile.cookMinutes,
  );
  const [servings, setServings] = useState(Math.min(4, Math.max(1, Math.round(initialServings))));
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<RecipeErrorCode | null>(null);

  // Alimentos à escolha: os do link, os do dia, os favoritos para a refeição e os mais usados
  const options = useMemo(() => {
    const dayIds = state?.plan.items.filter((i) => i.meal === meal).map((i) => i.foodId) ?? [];
    const byRank = LISTED_FOODS.filter((f) => f.moments.includes(meal)).sort(
      (a, b) => b.exampleRank - a.exampleRank,
    );
    const liked = new Set(profile.likedFoods);
    const likedForMeal = byRank.filter((f) => liked.has(f.id)).map((f) => f.id);
    const others = byRank.filter((f) => !liked.has(f.id)).map((f) => f.id);
    return [
      ...new Set([...validInitial, ...dayIds, ...likedForMeal, ...profile.likedFoods, ...others]),
    ]
      .filter(allowed)
      .slice(0, 30);
    // validInitial e o perfil vêm das props: só mudam com a navegação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, meal]);

  const post = profile.postWorkoutMeal;
  const pre = profile.preWorkoutMeal;
  const mealTarget = mealTargets(profile.dailyTargetG, meals, post).get(meal) ?? 0;

  const tooFew = selected.length < 2;
  const tooMany = selected.length > 6;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (tooFew || tooMany || status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodIds: selected,
          meal,
          maxMinutes: minutes,
          servings,
          locale,
          variant: Math.min(3, Math.max(1, Math.round(variant))),
        }),
      });
      const body = (await response.json()) as RecipeResponse;
      if (body.ok) {
        router.push(`/receitas/${body.id}`);
        return;
      }
      if (body.code === "unauthorized") {
        router.push("/entrar?next=/receitas/nova");
        return;
      }
      setError(body.code);
    } catch {
      setError("generation_failed");
    }
    setStatus("idle");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" aria-busy={status === "loading"}>
      <fieldset className="rounded-card border border-border bg-surface p-5">
        <legend className="px-1 font-display text-lg font-bold">{t("meal")}</legend>
        <FilterChips
          className="mt-2"
          label={t("meal")}
          options={meals.map((m) => ({
            value: m,
            label:
              m === post
                ? `${tm(m)} · ${tm("postWorkout")}`
                : m === pre
                  ? `${tm(m)} · ${tm("preWorkout")}`
                  : tm(m),
          }))}
          selected={[meal]}
          onChange={(next) => next[0] && setMeal(next[0])}
        />
        <p className="mt-2 text-sm text-muted">
          {t("mealTarget", { grams: formatProtein(mealTarget, lang) })}
        </p>
      </fieldset>

      <fieldset className="rounded-card border border-border bg-surface p-5">
        <legend className="px-1 font-display text-lg font-bold">{t("foods")}</legend>
        <p className="text-sm text-muted">{t("foodsHint")}</p>
        <FilterChips
          className="mt-3"
          label={t("foods")}
          options={options.map((id) => ({
            value: id,
            label: foodName(FOOD_INDEX.get(id)!, locale),
          }))}
          selected={selected}
          onChange={(next) => setSelected(next.slice(0, 6))}
          multiple
          wrap
        />
        <p aria-live="polite" className="mt-2 text-sm text-muted tabular">
          {t("foodsCount", { count: selected.length })}
          {tooFew ? ` · ${t("needsFoods")}` : ""}
        </p>
        {profile.diet !== "omnivore" || profile.allergies.length > 0 ? (
          <p className="mt-1 text-sm text-muted">{t("restricted")}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset className="rounded-card border border-border bg-surface p-5">
          <legend className="px-1 font-display text-lg font-bold">{t("time")}</legend>
          <FilterChips
            className="mt-2"
            label={t("time")}
            options={MAX_MINUTES_OPTIONS.map((m) => ({
              value: String(m),
              label: t("minutes", { minutes: m }),
            }))}
            selected={[String(minutes)]}
            onChange={(next) => next[0] && setMinutes(Number(next[0]) as MaxMinutes)}
          />
        </fieldset>
        <fieldset className="rounded-card border border-border bg-surface p-5">
          <legend className="px-1 font-display text-lg font-bold">{t("servings")}</legend>
          <FilterChips
            className="mt-2"
            label={t("servings")}
            options={["1", "2", "3", "4"].map((s) => ({ value: s, label: s }))}
            selected={[String(servings)]}
            onChange={(next) => next[0] && setServings(Number(next[0]))}
          />
        </fieldset>
      </div>

      <div aria-live="assertive">
        {error ? (
          <p className="rounded-card border border-border bg-surface p-4">{te(error)}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={tooFew || tooMany || status === "loading"}>
          {status === "loading" ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : (
            <ChefHat aria-hidden />
          )}
          {status === "loading" ? t("generating") : t("submit")}
        </Button>
        {status === "loading" ? <p className="text-sm text-muted">{t("generatingHint")}</p> : null}
      </div>
    </form>
  );
}
