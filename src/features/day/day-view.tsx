"use client";

import { ChefHat, CloudCheck, Pencil, Plus, Shuffle, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SuggestionChip } from "@/components/protein/chips";
import { GoalProgress } from "@/components/protein/goal-progress";
import { MealSection } from "@/components/protein/meal-section";
import { PortionStepper } from "@/components/protein/portion-stepper";
import { ProteinNumber } from "@/components/protein/protein-number";
import { Button } from "@/components/ui/button";
import { foodImage } from "@/content/food-images.generated";
import { findPortion, type Allergen } from "@/domain/food";
import { mealTargets, sortMeals, type Meal } from "@/domain/meals";
import {
  formatCount,
  formatProtein,
  itemProtein,
  mealProtein,
  totalProtein,
} from "@/domain/protein";
import { allowedFoods, type Diet } from "@/domain/preferences";
import { closeTheGoal } from "@/domain/suggestions";
import { CATALOG, FOOD_INDEX, foodName } from "@/features/catalog/catalog";
import { Link } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { AddFoodDrawer } from "./add-food-drawer";
import { reconcileLocalDay, type ServerDay } from "./local-day";
import { useDay } from "./use-day";

export interface DayPreferences {
  diet: Diet;
  allergies: Allergen[];
  likedFoods: string[];
}

/**
 * "Hoje" (secção 10, ecrã 3): o dia da pessoa. A cópia local (sincronizada com a D1) acerta-se
 * primeiro com o dia que veio do servidor; só aparecem alimentos que a pessoa pode comer.
 */
export function DayView({
  userId,
  serverDay,
  preferences,
}: {
  userId: string;
  serverDay: ServerDay;
  preferences: DayPreferences;
}) {
  const t = useTranslations("today");
  const tm = useTranslations("meals");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const { state, hydrated, add, setCount, remove, otherOptions } = useDay();
  const [drawerMeal, setDrawerMeal] = useState<Meal | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [reconciled, setReconciled] = useState(false);

  useEffect(() => {
    reconcileLocalDay(serverDay, userId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a cópia local só existe no browser
    setReconciled(true);
  }, [serverDay, userId]);

  const personal = useMemo(
    () => ({
      foods: allowedFoods(CATALOG, preferences),
      preferred: new Set(preferences.likedFoods),
    }),
    [preferences],
  );

  if (!hydrated || !reconciled) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <div className="h-28 animate-pulse rounded-card bg-track" />
        <div className="h-48 animate-pulse rounded-card bg-track" />
        <div className="h-48 animate-pulse rounded-card bg-track" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-lg rounded-card border border-border bg-surface p-8 text-center">
        <h1 className="text-2xl font-extrabold">{t("emptyTitle")}</h1>
        <p className="mt-2 text-muted">{t("emptyBody")}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/comecar">{t("emptyCta")}</Link>
        </Button>
      </div>
    );
  }

  const target = state.target.grams;
  const allowedIds = new Set(personal.foods.map((f) => f.id));
  const items = state.plan.items.filter((i) => allowedIds.has(i.foodId));
  const meals = sortMeals(state.meals);
  const post = state.postWorkoutMeal;
  const pre = state.preWorkoutMeal;
  const targets = mealTargets(target, meals, post);
  const total = totalProtein(items, FOOD_INDEX);
  const close = closeTheGoal({
    target,
    items,
    meals,
    postWorkoutMeal: post,
    foods: personal.foods,
    foodIndex: FOOD_INDEX,
  });

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          {state.owner ? (
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              <CloudCheck aria-hidden className="size-4" />
              {t("synced")}
            </span>
          ) : null}
          <Button asChild variant="ghost" size="sm">
            <Link href="/conta/preferencias">
              <Pencil aria-hidden />
              {t("editGoal")}
            </Link>
          </Button>
        </div>
      </div>

      <GoalProgress total={total} target={target} sticky />

      {meals.map((meal) => {
        const mealItems = items.filter((i) => i.meal === meal);
        const recipeFoods = [...new Set(mealItems.map((i) => i.foodId))].filter((id) =>
          FOOD_INDEX.has(id),
        );
        return (
          <MealSection
            key={meal}
            id={`refeicao-${meal}`}
            title={tm(meal)}
            postWorkoutLabel={
              meal === post ? tm("postWorkout") : meal === pre ? tm("preWorkout") : undefined
            }
            total={mealProtein(items, meal, FOOD_INDEX)}
            targetLabel={t("mealTarget", { grams: formatProtein(targets.get(meal) ?? 0, lang) })}
            footer={
              <>
                <Button variant="soft" size="sm" onClick={() => setDrawerMeal(meal)}>
                  <Plus aria-hidden />
                  {t("addFood")}
                </Button>
                {recipeFoods.length >= 2 ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={{
                        pathname: "/receitas/nova",
                        query: { refeicao: meal, alimentos: recipeFoods.slice(0, 6).join(",") },
                      }}
                    >
                      <ChefHat aria-hidden />
                      {t("recipe")}
                    </Link>
                  </Button>
                ) : null}
              </>
            }
          >
            {mealItems.length === 0 ? (
              <p className="text-sm text-muted">{t("mealEmpty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {mealItems.map((item) => {
                  const food = FOOD_INDEX.get(item.foodId);
                  const portion = food ? findPortion(food, item.portionId) : undefined;
                  const name = food ? foodName(food, locale) : t("item.unknown");
                  return (
                    <li key={item.id} className="flex items-center gap-3 py-2.5">
                      {food ? (
                        <Image
                          src={foodImage(food.id)}
                          alt=""
                          aria-hidden
                          width={32}
                          height={32}
                          className="shrink-0"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {food ? (
                            <Link href={`/alimentos/${food.id}`} className="hover:underline">
                              {name}
                            </Link>
                          ) : (
                            name
                          )}
                        </p>
                        <p className="truncate text-sm text-muted">
                          {portion
                            ? t("item.portions", {
                                count: formatCount(item.count, lang),
                                portion: portion.label[locale].toLowerCase(),
                              })
                            : null}
                        </p>
                      </div>
                      <ProteinNumber value={itemProtein(item, FOOD_INDEX)} size="md" />
                      <PortionStepper
                        count={item.count}
                        onChange={(count) => setCount(item.id, count)}
                        onRemove={() => remove(item.id)}
                        decreaseLabel={t("item.decrease", { food: name })}
                        increaseLabel={t("item.increase", { food: name })}
                        removeLabel={t("item.remove", { food: name })}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </MealSection>
        );
      })}

      <section
        aria-labelledby="fechar-meta"
        className="rounded-card border border-primary/40 bg-primary-soft/50 p-4"
      >
        <h2 id="fechar-meta" className="flex items-center gap-2 text-lg font-bold">
          <Sparkles aria-hidden className="size-5 text-primary" />
          {t("closeTitle")}
        </h2>
        {close.reached ? (
          <p className="mt-2">{t("closeDone")}</p>
        ) : (
          <>
            <p className="mt-1 text-muted">
              {close.suggestions.some((s) => s.covers)
                ? t("closeLead", { grams: formatProtein(close.missing, lang) })
                : t("closePartial", { grams: formatProtein(close.missing, lang) })}
            </p>
            <ul className="mt-3 grid gap-2 md:grid-cols-3">
              {close.suggestions.map((s) => {
                const food = FOOD_INDEX.get(s.foodId)!;
                const portion = findPortion(food, s.portionId)!;
                const name = foodName(food, locale);
                const detail = `${formatCount(s.count, lang)} × ${portion.label[locale].toLowerCase()} · ${tm(s.meal)}`;
                return (
                  <li key={s.foodId}>
                    <SuggestionChip
                      protein={s.protein}
                      title={name}
                      detail={detail}
                      ariaLabel={t("suggestion", {
                        count: formatCount(s.count, lang),
                        portion: portion.label[locale].toLowerCase(),
                        food: name,
                        grams: formatProtein(s.protein, lang),
                        meal: tm(s.meal),
                      })}
                      onSelect={() =>
                        add({
                          meal: s.meal,
                          foodId: s.foodId,
                          portionId: s.portionId,
                          count: s.count,
                        })
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {state.plan.isExample ? (
          <Button variant="secondary" onClick={() => otherOptions(personal)}>
            <Shuffle aria-hidden />
            {t("otherOptions")}
          </Button>
        ) : confirmReset ? (
          <div className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface p-3">
            <span className="font-semibold">{t("resetConfirm")}</span>
            <Button
              size="sm"
              onClick={() => {
                otherOptions(personal);
                setConfirmReset(false);
              }}
            >
              {t("resetYes")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
              {tCommon("cancel")}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmReset(true)}>
            <Shuffle aria-hidden />
            {t("resetExample")}
          </Button>
        )}
      </div>

      <AddFoodDrawer
        meal={drawerMeal}
        open={drawerMeal !== null}
        onOpenChange={(open) => !open && setDrawerMeal(null)}
        onAdd={(foodId, portionId) => {
          if (drawerMeal) add({ meal: drawerMeal, foodId, portionId, count: 1 });
        }}
        foods={personal.foods}
        preferred={personal.preferred}
      />
    </div>
  );
}
