"use client";

import {
  ChefHat,
  CloudAlert,
  CloudCheck,
  Loader2,
  Pencil,
  Plus,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Illustration } from "@/components/illustration";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SuggestionChip } from "@/components/protein/chips";
import { GoalProgress } from "@/components/protein/goal-progress";
import { MealSection } from "@/components/protein/meal-section";
import { MealGlyph, mealColor } from "@/components/wheel/sector-glyph";
import { PortionStepper } from "@/components/protein/portion-stepper";
import { ProteinNumber } from "@/components/protein/protein-number";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { foodImage } from "@/content/food-images.generated";
import { formatKcal, itemKcal, mealKcal, totalKcal } from "@/domain/calories";
import { findPortion, type Allergen } from "@/domain/food";
import { mealTargets, sortMeals, type Meal } from "@/domain/meals";
import {
  formatCount,
  formatProtein,
  itemProtein,
  mealProtein,
  totalProtein,
  type PlanItem,
} from "@/domain/protein";
import { allowedFoods, type Diet } from "@/domain/preferences";
import { closeTheGoal } from "@/domain/suggestions";
import { CATALOG, FOOD_INDEX, foodName } from "@/features/catalog/catalog";
import { DayPlate } from "@/features/plate-3d/day-plate";
import { Link } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { clearLegacyStorage } from "@/lib/legacy-storage";
import { setShowKcalAction } from "@/server/actions/account";
import { AddFoodDrawer } from "./add-food-drawer";
import { useDay, type DayProfile, type SaveStatus } from "./use-day";

export interface DayPreferences {
  diet: Diet;
  allergies: Allergen[];
  likedFoods: string[];
}

/** Estado da gravação, sempre visível e anunciado aos leitores de ecrã. */
function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  const t = useTranslations("today");
  const tCommon = useTranslations("common");
  return (
    <p aria-live="polite" className="inline-flex items-center gap-1.5 text-sm text-muted">
      {status === "saving" ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {t("saving")}
        </>
      ) : status === "error" ? (
        <>
          <CloudAlert aria-hidden className="size-4" />
          {t("syncError")}
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold text-text underline underline-offset-4"
          >
            {tCommon("retry")}
          </button>
        </>
      ) : (
        <>
          <CloudCheck aria-hidden className="size-4" />
          {t("synced")}
        </>
      )}
    </p>
  );
}

/**
 * "Calorias": desligado por defeito; liga-se aqui e fica na conta. Muda logo no ecrã e volta atrás
 * se não se conseguir guardar (só o pedido mais recente conta).
 */
function useShowKcal(initial: boolean) {
  const [show, setShow] = useState(initial);
  const latest = useRef(0);
  const toggle = async (next: boolean) => {
    const request = ++latest.current;
    setShow(next);
    let ok = false;
    try {
      ok = (await setShowKcalAction({ show: next })).ok;
    } catch {
      ok = false;
    }
    if (!ok && request === latest.current) setShow(!next);
  };
  return [show, toggle] as const;
}

/**
 * "Hoje" (secção 10, ecrã 3): o dia da pessoa, carregado da conta. As mudanças aparecem logo e
 * gravam-se a seguir; só aparecem alimentos que a pessoa pode comer.
 */
export function DayView({
  day,
  preferences,
  mealRecipes = {},
  showKcal = false,
}: {
  day: { profile: DayProfile; items: PlanItem[] };
  preferences: DayPreferences;
  /** Ver as calorias (preferência da conta; só informação) */
  showKcal?: boolean;
  /** A receita usada em cada refeição ("Pôr no meu dia" na página da receita). */
  mealRecipes?: Partial<Record<Meal, { id: string; title: string }>>;
}) {
  const t = useTranslations("today");
  const tm = useTranslations("meals");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const [drawerMeal, setDrawerMeal] = useState<Meal | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [kcalOn, setKcalOn] = useShowKcal(showKcal);
  const kcalText = (kcal: number) => tCommon("kcal", { kcal: formatKcal(kcal, lang) });

  const personal = useMemo(
    () => ({
      foods: allowedFoods(CATALOG, preferences),
      preferred: new Set(preferences.likedFoods),
    }),
    [preferences],
  );
  const { profile } = day;
  const {
    items: allItems,
    isExample,
    status,
    add,
    setCount,
    remove,
    otherOptions,
    retry,
  } = useDay({ initialItems: day.items, profile, personal });

  // Versões antigas guardavam uma cópia do dia (com o peso) no browser: deixa de ser precisa
  useEffect(() => clearLegacyStorage(), []);

  const target = profile.dailyTargetG;
  const allowedIds = new Set(personal.foods.map((f) => f.id));
  const items = allItems.filter((i) => allowedIds.has(i.foodId));
  const meals = sortMeals(profile.meals);
  const post = profile.postWorkoutMeal;
  const pre = profile.preWorkoutMeal;
  const targets = mealTargets(target, meals, post);
  const total = totalProtein(items, FOOD_INDEX);
  // O prato 3D recalcula a disposição só quando o dia muda (não a cada render)
  const plateItems = useMemo(
    () => allItems.filter((i) => personal.foods.some((f) => f.id === i.foodId)),
    [allItems, personal.foods],
  );
  const plateMeals = useMemo(() => sortMeals(profile.meals), [profile.meals]);
  const plateFoodName = useCallback(
    (id: string) => {
      const food = FOOD_INDEX.get(id);
      return food ? foodName(food, locale) : id;
    },
    [locale],
  );
  const close = closeTheGoal({
    target,
    items,
    meals,
    postWorkoutMeal: post,
    foods: personal.foods,
    foodIndex: FOOD_INDEX,
  });

  const closePanel = (
    <section
      aria-labelledby="fechar-meta"
      className="order-3 rounded-card border border-primary/40 bg-primary-soft/50 p-4"
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
          <ul className="mt-3 grid gap-2 md:grid-cols-3 lg:grid-cols-1">
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
                    actionLabel={t("suggestionAction")}
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
  );

  const resetActions = (
    <div className="order-4 flex flex-wrap items-center gap-3">
      {isExample ? (
        <Button variant="secondary" onClick={otherOptions}>
          <Shuffle aria-hidden />
          {t("otherOptions")}
        </Button>
      ) : confirmReset ? (
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface p-3">
          <span className="font-semibold">{t("resetConfirm")}</span>
          <Button
            size="sm"
            onClick={() => {
              otherOptions();
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
  );

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold lg:text-3xl">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <SaveIndicator status={status} onRetry={retry} />
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors duration-200 hover:bg-primary-soft">
            <Switch checked={kcalOn} onCheckedChange={(next) => void setKcalOn(next)} />
            {t("kcalToggle")}
          </label>
          <Button asChild variant="ghost" size="sm">
            <Link href="/conta/preferencias">
              <Pencil aria-hidden />
              {t("editGoal")}
            </Link>
          </Button>
        </div>
      </div>

      {/*
        Telemóvel: uma coluna (progresso fixo em cima, refeições, fechar a meta). Desktop: as
        refeições à esquerda (duas colunas em ecrãs largos) e o progresso com "Para fechar a meta"
        numa coluna fixa à direita. No telemóvel a coluna lateral é display: contents e a ordem vem
        do order-*.
      */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="contents lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-4">
          <GoalProgress
            total={total}
            target={target}
            kcal={kcalOn ? totalKcal(items, FOOD_INDEX) : undefined}
            segments={meals.map((meal) => ({
              key: meal,
              value: mealProtein(items, meal, FOOD_INDEX),
              color: mealColor(meal),
            }))}
            sticky
            className="order-1 lg:static"
          />
          <DayPlate
            placement="sidebar"
            items={plateItems}
            meals={plateMeals}
            total={total}
            target={target}
            foodName={plateFoodName}
            className="order-1 hidden lg:flex"
          />
          <DayPlate
            placement="collapsible"
            items={plateItems}
            meals={plateMeals}
            total={total}
            target={target}
            foodName={plateFoodName}
            className="order-1 lg:hidden"
          />
          {closePanel}
          {resetActions}
        </div>
        <div className="order-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:col-start-1 lg:row-start-1 xl:grid-cols-[repeat(2,minmax(0,1fr))] xl:items-start">
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
                glyph={<MealGlyph meals={meals} meal={meal} className="size-8" />}
                postWorkoutLabel={
                  meal === post ? tm("postWorkout") : meal === pre ? tm("preWorkout") : undefined
                }
                total={mealProtein(items, meal, FOOD_INDEX)}
                targetLabel={t("mealTarget", {
                  grams: formatProtein(targets.get(meal) ?? 0, lang),
                })}
                kcalLabel={
                  kcalOn && mealItems.length > 0
                    ? kcalText(mealKcal(items, meal, FOOD_INDEX))
                    : undefined
                }
                footer={
                  <>
                    <Button variant="soft" size="sm" onClick={() => setDrawerMeal(meal)}>
                      <Plus aria-hidden />
                      {t("addFood")}
                    </Button>
                    {recipeFoods.length >= 2 ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-auto min-h-11 max-w-full py-2 text-left whitespace-normal"
                      >
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
                {mealRecipes[meal] && mealItems.length > 0 ? (
                  <Link
                    href={`/receitas/${mealRecipes[meal].id}`}
                    className="mb-2 flex items-center gap-2 rounded-2xl bg-primary-soft px-3 py-2 text-sm font-semibold hover:underline"
                  >
                    <ChefHat aria-hidden className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 truncate">
                      {t("fromRecipe", { title: mealRecipes[meal].title })}
                    </span>
                  </Link>
                ) : null}
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
                          {food ? <Illustration src={foodImage(food.id)} size={32} /> : null}
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 leading-snug font-semibold">
                              {food ? (
                                <Link href={`/alimentos/${food.id}`} className="hover:underline">
                                  {name}
                                </Link>
                              ) : (
                                name
                              )}
                            </p>
                            <p className="line-clamp-2 text-sm leading-snug text-muted">
                              {portion
                                ? t("item.portions", {
                                    count: formatCount(item.count, lang),
                                    portion: portion.label[locale].toLowerCase(),
                                  })
                                : null}
                            </p>
                            {/* Linha própria: no telemóvel a porção já ocupa as 2 linhas do clamp */}
                            {portion && kcalOn ? (
                              <p className="text-sm leading-snug whitespace-nowrap text-muted tabular">
                                {kcalText(itemKcal(item, FOOD_INDEX))}
                              </p>
                            ) : null}
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
        </div>
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
