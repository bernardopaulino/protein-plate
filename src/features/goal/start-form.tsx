"use client";

import { ArrowRight, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_INTENSITY,
  INTENSITY_KEYS,
  MANUAL_TARGET_LIMITS,
  dailyTarget,
  isPlausibleWeight,
  isValidManualTarget,
  weightNeedsConfirmation,
  type Intensity,
} from "@/domain/goal";
import {
  DEFAULT_COMBINATIONS,
  MEALS,
  MEAL_COUNTS,
  mealTargets,
  sortMeals,
  type Meal,
  type MealCount,
} from "@/domain/meals";
import { formatProtein } from "@/domain/protein";
import { useRouter } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { useDay } from "@/features/day/use-day";
import type { GuestState } from "@/domain/contracts/guest-state";

function parseNumber(text: string): number {
  return Number(text.replace(",", ".").trim());
}

const fieldset = "rounded-card border border-border bg-surface p-5";
const legend = "px-1 font-display text-lg font-bold";

/** Formulário de /comecar: peso, intensidade, refeições e pós-treino → meta (secção 3). */
export function StartForm() {
  const { state, hydrated } = useDay();
  // O formulário só monta depois de ler o localStorage, para começar com o que já está guardado
  if (!hydrated) return <div aria-hidden className="h-96 animate-pulse rounded-card bg-track" />;
  return <StartFormInner key={state?.updatedAt ?? 0} initial={state} />;
}

function StartFormInner({ initial }: { initial: GuestState | null }) {
  const t = useTranslations("start");
  const tm = useTranslations("meals");
  const ti = useTranslations("intensity");
  const lang = HTML_LANG[useLocale() as Locale];
  const router = useRouter();
  const { setGoal } = useDay();
  const ids = { weight: useId(), manual: useId(), weightHint: useId(), manualHint: useId() };

  const [manual, setManual] = useState(initial?.target.manual ?? false);
  const [weightText, setWeightText] = useState(
    initial?.target.weightKg != null ? String(initial.target.weightKg).replace(".", ",") : "",
  );
  const [manualText, setManualText] = useState(
    initial?.target.manual ? String(initial.target.grams) : "",
  );
  const [confirmed, setConfirmed] = useState(false);
  const [intensity, setIntensity] = useState<Intensity>(
    initial?.target.intensity ?? DEFAULT_INTENSITY,
  );
  const [meals, setMeals] = useState<Meal[]>(
    initial ? [...initial.meals] : [...DEFAULT_COMBINATIONS[4]],
  );
  const [post, setPost] = useState<Meal | null>(initial?.postWorkoutMeal ?? null);
  const [touched, setTouched] = useState(false);

  const weight = parseNumber(weightText);
  const weightOk = isPlausibleWeight(weight);
  const needsConfirm = weightOk && weightNeedsConfirmation(weight);
  const manualGrams = parseNumber(manualText);
  const manualOk = isValidManualTarget(manualGrams);

  const target = manual
    ? manualOk
      ? manualGrams
      : null
    : weightOk && (!needsConfirm || confirmed)
      ? dailyTarget(weight, intensity)
      : null;
  const mealsOk = meals.length >= 2;
  const ready = target !== null && mealsOk;
  const postEffective = post && meals.includes(post) ? post : null;
  const mainMealTarget = target
    ? Math.max(...mealTargets(target, meals, postEffective).values())
    : 0;

  const chooseCount = (n: MealCount) => {
    setMeals([...DEFAULT_COMBINATIONS[n]]);
  };
  const toggleMeal = (meal: Meal) => {
    setMeals((current) =>
      current.includes(meal) ? current.filter((m) => m !== meal) : sortMeals([...current, meal]),
    );
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!ready || target === null) return;
    setGoal({
      grams: target,
      intensity,
      weightKg: manual ? null : weight,
      manual,
      meals: sortMeals(meals),
      postWorkoutMeal: postEffective,
    });
    router.push("/o-meu-dia");
  };

  const radioCard = (on: boolean) =>
    cn(
      "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-150 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
      on ? "border-primary bg-primary-soft" : "border-border hover:border-primary/60",
    );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {/* 1. Peso (ou meta manual) */}
      <fieldset className={fieldset}>
        <legend className={legend}>{t("weight.legend")}</legend>
        {!manual ? (
          <div className="mt-3">
            <label htmlFor={ids.weight} className="font-semibold">
              {t("weight.label")}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id={ids.weight}
                inputMode="decimal"
                autoComplete="off"
                value={weightText}
                onChange={(e) => {
                  setWeightText(e.target.value);
                  setConfirmed(false);
                }}
                aria-describedby={ids.weightHint}
                aria-invalid={touched && !weightOk ? true : undefined}
                className="h-14 w-32 rounded-2xl border border-border bg-bg px-4 font-display text-2xl font-bold tabular focus:border-primary"
                placeholder="80"
              />
              <span className="text-lg text-muted">{t("weight.unit")}</span>
            </div>
            <p id={ids.weightHint} className="mt-2 text-sm text-muted">
              {touched && !weightOk ? (
                <span className="font-semibold text-text">{t("weight.invalid")}</span>
              ) : (
                t("weight.hint")
              )}
            </p>
            {needsConfirm ? (
              <div className="mt-3 rounded-2xl bg-primary-soft p-3">
                <p className="text-sm">{t("weight.confirmHint")}</p>
                <label className="mt-2 flex min-h-11 items-center gap-3 font-semibold">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="size-5 accent-[var(--primary)]"
                  />
                  {t("weight.confirm")}
                </label>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-3">
            <label htmlFor={ids.manual} className="font-semibold">
              {t("weight.manualLabel")}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id={ids.manual}
                inputMode="numeric"
                autoComplete="off"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                aria-describedby={ids.manualHint}
                aria-invalid={touched && !manualOk ? true : undefined}
                className="h-14 w-32 rounded-2xl border border-border bg-bg px-4 font-display text-2xl font-bold tabular focus:border-primary"
                placeholder="160"
              />
              <span className="text-lg text-muted">g</span>
            </div>
            <p id={ids.manualHint} className="mt-2 text-sm text-muted">
              {touched && !manualOk
                ? t("weight.manualInvalid")
                : `${MANUAL_TARGET_LIMITS.min}–${MANUAL_TARGET_LIMITS.max} g`}
            </p>
          </div>
        )}
        <Button variant="link" className="mt-3" onClick={() => setManual((m) => !m)}>
          {manual ? t("weight.weightToggle") : t("weight.manualToggle")}
        </Button>
      </fieldset>

      {/* 2. Intensidade */}
      {!manual ? (
        <fieldset className={fieldset}>
          <legend className={legend}>{t("intensity.legend")}</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {INTENSITY_KEYS.map((key) => (
              <label key={key} className={radioCard(intensity === key)}>
                <input
                  type="radio"
                  name="intensity"
                  value={key}
                  checked={intensity === key}
                  onChange={() => setIntensity(key)}
                  className="sr-only"
                />
                <span className="flex-1">
                  <span className="block font-semibold">{ti(`${key}.label`)}</span>
                  <span className="block text-sm text-muted">{ti(`${key}.detail`)}</span>
                </span>
                {intensity === key ? <Check aria-hidden className="size-5 text-primary" /> : null}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {/* 3. Refeições */}
      <fieldset className={fieldset}>
        <legend className={legend}>{t("meals.legend")}</legend>
        <div role="radiogroup" aria-label={t("meals.legend")} className="mt-3 flex gap-2">
          {MEAL_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={meals.length === n}
              onClick={() => chooseCount(n)}
              className={cn(
                "grid size-12 place-items-center rounded-full border font-display text-lg font-bold tabular transition-colors duration-150",
                meals.length === n
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border hover:border-primary/60",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-4 font-semibold">{t("meals.which")}</p>
        <p className="text-sm text-muted">{t("meals.whichHint")}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {MEALS.map((meal) => (
            <label key={meal} className={radioCard(meals.includes(meal))}>
              <input
                type="checkbox"
                checked={meals.includes(meal)}
                onChange={() => toggleMeal(meal)}
                className="size-5 accent-[var(--primary)]"
              />
              {tm(meal)}
            </label>
          ))}
        </div>
        {!mealsOk ? <p className="mt-2 text-sm font-semibold">{t("meals.min")}</p> : null}
      </fieldset>

      {/* 4. Pós-treino (opcional) */}
      <fieldset className={fieldset}>
        <legend className={legend}>{t("postWorkout.legend")}</legend>
        <p className="mt-1 text-sm text-muted">{t("postWorkout.hint")}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[...sortMeals(meals), null].map((meal) => (
            <label key={meal ?? "none"} className={radioCard(postEffective === meal)}>
              <input
                type="radio"
                name="post-workout"
                checked={postEffective === meal}
                onChange={() => setPost(meal)}
                className="sr-only"
              />
              {meal ? tm(meal) : t("postWorkout.none")}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Resultado */}
      <section
        aria-live="polite"
        className="sticky bottom-20 z-30 rounded-card border border-primary/40 bg-surface p-5 shadow-lg md:bottom-4"
      >
        {target !== null ? (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted">{t("result.title")}</p>
              <p className="font-display text-[2.5rem] leading-none font-extrabold tabular">
                {t("result.value", { grams: formatProtein(target, lang) })}
              </p>
              {mealsOk ? (
                <p className="mt-1 text-sm text-muted">
                  {t("result.perMeal", { grams: formatProtein(mainMealTarget, lang) })}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" disabled={!ready}>
              {t("result.cta")}
              <ArrowRight aria-hidden />
            </Button>
          </div>
        ) : (
          <p className="text-muted">{t("result.empty")}</p>
        )}
      </section>
    </form>
  );
}
