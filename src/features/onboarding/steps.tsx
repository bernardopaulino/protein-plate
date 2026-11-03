"use client";

import { AnimatePresence, m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, type ReactNode } from "react";
import { UI_IMAGES } from "@/content/food-images.generated";
import { ALLERGENS } from "@/domain/food";
import { INTENSITY_KEYS, MANUAL_TARGET_LIMITS } from "@/domain/goal";
import {
  DEFAULT_COMBINATIONS,
  MEALS,
  MEAL_COUNTS,
  mealTargets,
  sortMeals,
  type Meal,
  type MealCount,
} from "@/domain/meals";
import {
  DIETS,
  EQUIPMENT,
  MIN_LIKED_PROTEINS,
  allowedFoods,
  proteinCount,
} from "@/domain/preferences";
import { formatProtein } from "@/domain/protein";
import { MAX_MINUTES_OPTIONS } from "@/domain/recipe-options";
import { CATALOG, FOOD_INDEX } from "@/features/catalog/catalog";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { goalState, likedForDraft, training, type Draft } from "./draft";
import { FoodPicker } from "./food-picker";
import { AnimatedNumber, Illustration, OptionCard, Segmented } from "./ui";

export interface StepProps {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
}

export function StepHeader({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-extrabold sm:text-[2.5rem] sm:leading-tight">{title}</h1>
      <p className="mt-2 text-muted">{lead}</p>
    </header>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="mt-7 first:mt-0">
      <h2 id={id} className="font-display text-lg font-bold">
        {title}
      </h2>
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const input =
  "h-14 w-full rounded-card border-2 border-border bg-surface px-4 text-2xl font-bold tabular outline-none transition-colors focus:border-primary";

/* ------------------------------------------------------------------ 1. Meta */

export function GoalStep({ draft, update }: StepProps) {
  const t = useTranslations("onboarding.goal");
  const ti = useTranslations("intensity");
  const td = useTranslations("disclaimer");
  const ids = { weight: useId(), manual: useId(), hint: useId() };
  const goal = goalState(draft);
  const showWeightError = draft.weightText.trim() !== "" && !goal.weightOk;
  const showManualError = draft.manualText.trim() !== "" && !goal.manualOk;

  return (
    <div>
      <StepHeader title={t("title")} lead={t("lead")} />

      {/* O resultado fica sempre à vista: muda à medida que a pessoa escreve */}
      <div className="mb-6 flex items-center gap-4 rounded-card bg-primary-soft p-5">
        <Illustration src={UI_IMAGES["misc:target"]} size={56} />
        <div aria-live="polite">
          <p className="text-sm font-semibold text-muted">{t("result")}</p>
          <p className="font-display text-[2.75rem] leading-none font-extrabold text-primary">
            {goal.target !== null ? <AnimatedNumber value={goal.target} /> : "—"}
            <span className="ml-1 text-xl font-bold">g</span>
          </p>
          <p className="text-sm text-muted">{t("perDay")}</p>
        </div>
      </div>

      {draft.manual ? (
        <div>
          <label htmlFor={ids.manual} className="font-semibold">
            {t("manualLabel")}
          </label>
          <div className="relative mt-2">
            <input
              id={ids.manual}
              inputMode="numeric"
              autoComplete="off"
              value={draft.manualText}
              onChange={(e) => update({ manualText: e.target.value })}
              aria-invalid={showManualError}
              aria-describedby={ids.hint}
              placeholder={`${MANUAL_TARGET_LIMITS.min}–${MANUAL_TARGET_LIMITS.max}`}
              className={input}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg font-semibold text-muted">
              g
            </span>
          </div>
          <p
            id={ids.hint}
            className="mt-1 min-h-5 text-sm"
            role={showManualError ? "alert" : undefined}
          >
            {showManualError ? t("manualInvalid") : ""}
          </p>
        </div>
      ) : (
        <div>
          <label htmlFor={ids.weight} className="font-semibold">
            {t("weightLabel")}
          </label>
          <div className="relative mt-2">
            <input
              id={ids.weight}
              inputMode="decimal"
              autoComplete="off"
              value={draft.weightText}
              onChange={(e) => update({ weightText: e.target.value, weightConfirmed: false })}
              aria-invalid={showWeightError}
              aria-describedby={ids.hint}
              placeholder="70"
              className={input}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg font-semibold text-muted">
              {t("unit")}
            </span>
          </div>
          <div id={ids.hint} className="mt-1 min-h-5 text-sm">
            {showWeightError ? <p role="alert">{t("invalid")}</p> : null}
            {goal.needsConfirm ? (
              <label className="mt-2 flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={draft.weightConfirmed}
                  onChange={(e) => update({ weightConfirmed: e.target.checked })}
                  className="size-5 accent-[var(--primary)]"
                />
                <span>
                  {t("confirm")} <span className="text-muted">({t("confirmHint")})</span>
                </span>
              </label>
            ) : null}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => update({ manual: !draft.manual })}
        className="mt-1 min-h-11 font-semibold text-primary underline underline-offset-4"
      >
        {draft.manual ? t("weightToggle") : t("manualToggle")}
      </button>

      {!draft.manual ? (
        <Section title={t("intensityTitle")}>
          <div
            role="radiogroup"
            aria-label={t("intensityTitle")}
            className="grid gap-3 sm:grid-cols-2"
          >
            {INTENSITY_KEYS.map((key) => (
              <OptionCard
                key={key}
                selected={draft.intensity === key}
                onSelect={() => update({ intensity: key })}
                image={UI_IMAGES[`intensity:${key}`]}
                title={ti(`${key}.label`)}
                detail={ti(`${key}.detail`)}
              />
            ))}
          </div>
        </Section>
      ) : null}
      <p className="mt-6 text-sm text-muted">{td("health")}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ 2. Refeições */

export function MealsStep({ draft, update }: StepProps) {
  const t = useTranslations("onboarding.meals");
  const tm = useTranslations("meals");
  const lang = HTML_LANG[useLocale() as Locale];
  const target = goalState(draft).target ?? 0;
  const { preWorkoutMeal, postWorkoutMeal } = training(draft);
  const targets = mealTargets(target, draft.meals, postWorkoutMeal);
  const count = draft.meals.length as MealCount;

  const toggleMeal = (meal: Meal) => {
    const meals = draft.meals.includes(meal)
      ? draft.meals.filter((m) => m !== meal)
      : sortMeals([...draft.meals, meal]);
    update({ meals });
  };

  return (
    <div>
      <StepHeader title={t("title")} lead={t("lead")} />
      <Section title={t("count")}>
        <Segmented
          label={t("count")}
          layoutId="meal-count"
          options={MEAL_COUNTS}
          value={(MEAL_COUNTS as readonly number[]).includes(count) ? count : null}
          onChange={(n) => update({ meals: [...DEFAULT_COMBINATIONS[n]] })}
        />
      </Section>

      <Section title={t("which")}>
        <div role="group" aria-label={t("which")} className="grid grid-cols-2 gap-3">
          {MEALS.map((meal) => {
            const on = draft.meals.includes(meal);
            return (
              <OptionCard
                key={meal}
                role="checkbox"
                compact
                selected={on}
                onSelect={() => toggleMeal(meal)}
                image={UI_IMAGES[`meal:${meal}`]}
                title={tm(meal)}
                detail={
                  on && target > 0
                    ? t("target", { grams: formatProtein(targets.get(meal) ?? 0, lang) })
                    : undefined
                }
              />
            );
          })}
        </div>
        {draft.meals.length < 2 ? (
          <p role="alert" className="mt-2 text-sm font-semibold">
            {t("min")}
          </p>
        ) : null}
      </Section>

      <Section title={t("trains")}>
        <Segmented
          label={t("trains")}
          layoutId="trains"
          options={["yes", "no"] as const}
          value={draft.trains ? "yes" : "no"}
          onChange={(v) => update({ trains: v === "yes" })}
          render={(v) => (v === "yes" ? t("yes") : t("no"))}
        />
        <AnimatePresence initial={false}>
          {draft.trains ? (
            <m.div
              key="training"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                <TrainingPicker
                  title={t("pre")}
                  hint={t("preHint")}
                  image={UI_IMAGES["intensity:moderada"]}
                  meals={draft.meals}
                  value={preWorkoutMeal}
                  disabled={postWorkoutMeal}
                  noneLabel={t("none")}
                  onChange={(meal) => update({ preWorkoutMeal: meal })}
                />
                <TrainingPicker
                  title={t("post")}
                  hint={t("postHint")}
                  image={UI_IMAGES["misc:muscle"]}
                  meals={draft.meals}
                  value={postWorkoutMeal}
                  disabled={preWorkoutMeal}
                  noneLabel={t("none")}
                  onChange={(meal) =>
                    update({
                      postWorkoutMeal: meal,
                      // A mesma refeição não pode ser as duas: fica a pós-treino
                      ...(meal !== null && meal === draft.preWorkoutMeal
                        ? { preWorkoutMeal: null }
                        : {}),
                    })
                  }
                />
              </div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </Section>
    </div>
  );
}

function TrainingPicker({
  title,
  hint,
  image,
  meals,
  value,
  disabled,
  noneLabel,
  onChange,
}: {
  title: string;
  hint: string;
  image: string | undefined;
  meals: readonly Meal[];
  value: Meal | null;
  disabled: Meal | null;
  noneLabel: string;
  onChange: (meal: Meal | null) => void;
}) {
  const tm = useTranslations("meals");
  const id = useId();
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <Illustration src={image} size={36} />
        <div>
          <p id={id} className="font-semibold">
            {title}
          </p>
          <p className="text-sm text-muted">{hint}</p>
        </div>
      </div>
      <div role="radiogroup" aria-labelledby={id} className="mt-3 flex flex-wrap gap-2">
        {[null, ...sortMeals(meals)].map((meal) => {
          const on = value === meal;
          const blocked = meal !== null && meal === disabled;
          return (
            <button
              key={meal ?? "none"}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={blocked}
              onClick={() => onChange(meal)}
              className={cn(
                "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 disabled:opacity-40",
                on
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-bg hover:border-primary/60",
              )}
            >
              {meal ? tm(meal) : noneLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ 3. Restrições */

export function RestrictionsStep({ draft, update }: StepProps) {
  const t = useTranslations("onboarding.restrictions");
  const excluded = CATALOG.length - allowedFoods(CATALOG, draft).length;

  return (
    <div>
      <StepHeader title={t("title")} lead={t("lead")} />
      <Section title={t("diet")}>
        <div role="radiogroup" aria-label={t("diet")} className="grid gap-3 sm:grid-cols-2">
          {DIETS.map((diet) => (
            <OptionCard
              key={diet}
              selected={draft.diet === diet}
              onSelect={() => update({ diet })}
              image={UI_IMAGES[`diet:${diet}`]}
              title={t(`diets.${diet}.label`)}
              detail={t(`diets.${diet}.detail`)}
            />
          ))}
        </div>
      </Section>

      <Section title={t("allergies")} hint={t("allergiesHint")}>
        <div
          role="group"
          aria-label={t("allergies")}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {ALLERGENS.map((allergen) => {
            const on = draft.allergies.includes(allergen);
            return (
              <OptionCard
                key={allergen}
                role="checkbox"
                compact
                selected={on}
                onSelect={() =>
                  update({
                    allergies: on
                      ? draft.allergies.filter((a) => a !== allergen)
                      : ALLERGENS.filter((a) => a === allergen || draft.allergies.includes(a)),
                  })
                }
                image={UI_IMAGES[`allergy:${allergen}`]}
                title={t(`allergyNames.${allergen}`)}
              />
            );
          })}
        </div>
        <p aria-live="polite" className="mt-3 text-sm font-semibold text-muted">
          {t("excluded", { count: excluded })}
        </p>
        <p className="mt-1 text-sm text-muted">{t("safety")}</p>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ 4. Alimentos */

export function FoodsStep({ draft, update }: StepProps) {
  const t = useTranslations("onboarding.foods");
  const foods = useMemo(
    () => allowedFoods(CATALOG, draft).filter((f) => f.role !== "pantry"),
    [draft],
  );
  const liked = likedForDraft(draft, FOOD_INDEX);
  const proteins = proteinCount(liked, FOOD_INDEX);

  return (
    <div>
      <StepHeader title={t("title")} lead={t("lead")} />
      <FoodPicker
        foods={foods}
        selected={liked}
        onChange={(likedFoods) => update({ likedFoods })}
        everything
        stickyClassName="top-[4.25rem]"
        status={
          <p className="flex flex-wrap justify-between gap-2">
            <span className="font-semibold">{t("selected", { count: liked.length })}</span>
            {proteins < MIN_LIKED_PROTEINS ? (
              <span className="text-muted">
                {t("needProteins", { min: MIN_LIKED_PROTEINS, count: proteins })}
              </span>
            ) : null}
          </p>
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ 5. Cozinha */

const TIME_IMAGES: Record<number, string | undefined> = {
  10: UI_IMAGES["equipment:microwave"],
  20: UI_IMAGES["equipment:stove"],
  30: UI_IMAGES["equipment:oven"],
  45: UI_IMAGES["misc:sparkles"],
};

export function KitchenStep({ draft, update }: StepProps) {
  const t = useTranslations("onboarding.kitchen");
  return (
    <div>
      <StepHeader title={t("title")} lead={t("lead")} />
      <Section title={t("time")}>
        <div role="radiogroup" aria-label={t("time")} className="grid grid-cols-2 gap-3">
          {MAX_MINUTES_OPTIONS.map((minutes) => (
            <OptionCard
              key={minutes}
              compact
              selected={draft.cookMinutes === minutes}
              onSelect={() => update({ cookMinutes: minutes })}
              image={TIME_IMAGES[minutes]}
              title={t(`times.${minutes}`)}
              detail={t("minutes", { minutes })}
            />
          ))}
        </div>
      </Section>
      <Section title={t("equipment")}>
        <div
          role="group"
          aria-label={t("equipment")}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {EQUIPMENT.map((item) => {
            const on = draft.equipment.includes(item);
            return (
              <OptionCard
                key={item}
                role="checkbox"
                compact
                selected={on}
                onSelect={() =>
                  update({
                    equipment: on
                      ? draft.equipment.filter((e) => e !== item)
                      : EQUIPMENT.filter((e) => e === item || draft.equipment.includes(e)),
                  })
                }
                image={UI_IMAGES[`equipment:${item}`]}
                title={t(`equipmentNames.${item}`)}
              />
            );
          })}
        </div>
        {draft.equipment.length === 0 ? (
          <p role="alert" className="mt-2 text-sm font-semibold">
            {t("equipmentMin")}
          </p>
        ) : null}
      </Section>
    </div>
  );
}
