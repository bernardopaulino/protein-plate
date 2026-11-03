"use client";

import { ChefHat, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { FilterChips } from "@/components/protein/chips";
import { Button } from "@/components/ui/button";
import type { RecipeResponse } from "@/domain/contracts/recipe";
import {
  MAX_MINUTES_OPTIONS,
  type MaxMinutes,
  type RecipeErrorCode,
} from "@/domain/recipe-options";
import { MEALS, isMeal, mealTargets, type Meal } from "@/domain/meals";
import { formatProtein } from "@/domain/protein";
import { useDay } from "@/features/day/use-day";
import { FOOD_INDEX, LISTED_FOODS, foodName } from "@/features/catalog/catalog";
import { useRouter } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { Turnstile } from "./turnstile";

/** Meta de uma refeição sem meta definida (convidado que chegou direto aqui). */
const FALLBACK_MEAL_TARGET = 30;

/** Nova receita (ecrã 7): alimentos, refeição, tempo, doses e Turnstile para convidados. */
export function RecipeForm({
  initialMeal,
  initialFoods,
  initialMinutes,
  initialServings,
  variant,
  isGuest,
  siteKey,
}: {
  initialMeal: string | null;
  initialFoods: string[];
  initialMinutes: number;
  initialServings: number;
  variant: number;
  isGuest: boolean;
  siteKey: string;
}) {
  const t = useTranslations("recipes.form");
  const te = useTranslations("recipes.errors");
  const tm = useTranslations("meals");
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const router = useRouter();
  const { state } = useDay();

  const meals: readonly Meal[] = state?.meals ?? MEALS;
  const [meal, setMeal] = useState<Meal>(
    initialMeal && isMeal(initialMeal) ? initialMeal : (meals[0] ?? "almoco"),
  );
  const validInitial = initialFoods.filter(
    (id) => FOOD_INDEX.get(id) && FOOD_INDEX.get(id)?.role !== "pantry",
  );
  const [selected, setSelected] = useState<string[]>(validInitial.slice(0, 6));
  const [minutes, setMinutes] = useState<MaxMinutes>(
    (MAX_MINUTES_OPTIONS as readonly number[]).includes(initialMinutes)
      ? (initialMinutes as MaxMinutes)
      : 20,
  );
  const [servings, setServings] = useState(Math.min(4, Math.max(1, Math.round(initialServings))));
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<RecipeErrorCode | null>(null);

  // Alimentos à escolha: os do dia, os do link e os do catálogo mais usados para a refeição
  const options = useMemo(() => {
    const dayIds = state?.plan.items.map((i) => i.foodId) ?? [];
    const forMeal = LISTED_FOODS.filter((f) => f.moments.includes(meal))
      .sort((a, b) => b.exampleRank - a.exampleRank)
      .map((f) => f.id);
    return [...new Set([...validInitial, ...dayIds, ...forMeal])]
      .filter((id) => FOOD_INDEX.has(id) && FOOD_INDEX.get(id)?.role !== "pantry")
      .slice(0, 24);
    // validInitial vem das props: só muda com a navegação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, meal]);

  const post = state?.postWorkoutMeal ?? null;
  const mealTarget = state
    ? (mealTargets(state.target.grams, state.meals, post).get(meal) ?? FALLBACK_MEAL_TARGET)
    : FALLBACK_MEAL_TARGET;

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
          postWorkout: meal === post,
          mealTargetG: Math.round(mealTarget * 10) / 10,
          maxMinutes: minutes,
          servings,
          locale,
          variant: Math.min(3, Math.max(1, Math.round(variant))),
          ...(isGuest && token ? { turnstileToken: token } : {}),
        }),
      });
      const body = (await response.json()) as RecipeResponse;
      if (body.ok) {
        router.push(`/receitas/${body.id}`);
        return;
      }
      setError(body.code);
    } catch {
      setError("generation_failed");
    }
    setStatus("idle");
    if (isGuest) {
      setToken(null);
      setResetKey((k) => k + 1);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" aria-busy={status === "loading"}>
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
      </fieldset>

      <fieldset className="rounded-card border border-border bg-surface p-5">
        <legend className="px-1 font-display text-lg font-bold">{t("meal")}</legend>
        <FilterChips
          className="mt-2"
          label={t("meal")}
          options={meals.map((m) => ({
            value: m,
            label: m === post ? `${tm(m)} · ${tm("postWorkout")}` : tm(m),
          }))}
          selected={[meal]}
          onChange={(next) => next[0] && setMeal(next[0])}
        />
        <p className="mt-2 text-sm text-muted">
          {t("mealTarget", { grams: formatProtein(mealTarget, lang) })}
        </p>
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

      {isGuest && siteKey ? (
        <Turnstile
          siteKey={siteKey}
          onToken={setToken}
          label={t("turnstile")}
          resetKey={resetKey}
        />
      ) : null}

      <div aria-live="assertive">
        {error ? (
          <p className="rounded-card border border-border bg-surface p-4">
            {te(error)} {error === "quota_exceeded" && isGuest ? te("quota_guest") : null}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={
            tooFew || tooMany || status === "loading" || (isGuest && Boolean(siteKey) && !token)
          }
        >
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
