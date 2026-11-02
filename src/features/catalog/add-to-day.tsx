"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { defaultPortion, type Food } from "@/domain/food";
import type { Meal } from "@/domain/meals";
import { formatProtein, portionProtein } from "@/domain/protein";
import { useDay } from "@/features/day/use-day";
import { Link } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";

/** "Adicionar ao meu dia" no detalhe: escolhe a refeição (das da pessoa) e a porção. */
export function AddToDay({ foodId, food }: { foodId: string; food: Food }) {
  const t = useTranslations("food");
  const tm = useTranslations("meals");
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const { state, hydrated, add } = useDay();
  const mealId = useId();
  const portionId = useId();

  const meals = state?.meals ?? [];
  const suggestedMeal = meals.find((m) => food.moments.includes(m)) ?? meals[0];
  const [meal, setMeal] = useState<Meal | undefined>(undefined);
  const [portion, setPortion] = useState(defaultPortion(food).id);
  const [added, setAdded] = useState<Meal | null>(null);
  const chosenMeal = meal ?? suggestedMeal;

  if (!hydrated) return <div aria-hidden className="h-40 animate-pulse rounded-card bg-track" />;

  if (!state) {
    return (
      <div className="rounded-card border border-border bg-surface p-5">
        <p>{t("noGoal")}</p>
        <Button asChild className="mt-4">
          <Link href="/comecar">{t("noGoalCta")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="rounded-card border border-border bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!chosenMeal) return;
        add({ meal: chosenMeal, foodId, portionId: portion, count: 1 });
        setAdded(chosenMeal);
      }}
    >
      <h2 className="text-lg font-bold">{t("addToDay")}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label htmlFor={mealId} className="flex flex-col gap-1 text-sm font-semibold">
          {t("chooseMeal")}
          <select
            id={mealId}
            value={chosenMeal}
            onChange={(e) => {
              setMeal(e.target.value as Meal);
              setAdded(null);
            }}
            className="h-12 rounded-2xl border border-border bg-bg px-3 text-base font-normal"
          >
            {meals.map((m) => (
              <option key={m} value={m}>
                {tm(m)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={portionId} className="flex flex-col gap-1 text-sm font-semibold">
          {t("choosePortion")}
          <select
            id={portionId}
            value={portion}
            onChange={(e) => {
              setPortion(e.target.value);
              setAdded(null);
            }}
            className="h-12 rounded-2xl border border-border bg-bg px-3 text-base font-normal"
          >
            {food.portions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label[locale]} · {formatProtein(portionProtein(food, p.id), lang)} g
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit">{t("addButton")}</Button>
        <p aria-live="polite" className="flex items-center gap-2 font-semibold text-primary">
          {added ? (
            <>
              <Check aria-hidden className="size-5" />
              {t("added", { meal: tm(added) })}
              <Link href="/o-meu-dia" className="text-text underline underline-offset-4">
                {t("seeDay")}
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}
