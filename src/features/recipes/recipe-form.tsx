"use client";

import { ChefHat, ChevronDown, Loader2, Minus, Plus, Sparkles, X } from "lucide-react";
import { LazyMotion, MotionConfig, domMax } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { FilterChips } from "@/components/protein/chips";
import { Button } from "@/components/ui/button";
import type { RecipeResponse } from "@/domain/contracts/recipe";
import type { Allergen } from "@/domain/food";
import { isLightMeal, isMeal, mealTargets, type Meal } from "@/domain/meals";
import { allowedFoods, type Diet, type Equipment } from "@/domain/preferences";
import { formatProtein } from "@/domain/protein";
import { RECIPE_MAX_CHOSEN, servesLightMeal } from "@/domain/recipe-base";
import {
  MAX_MINUTES_OPTIONS,
  RECIPE_TARGET,
  type MaxMinutes,
  type RecipeErrorCode,
} from "@/domain/recipe-options";
import { EquipmentPicker, EquipmentSummary, sameEquipment } from "./equipment-picker";
import { CATALOG, FOOD_INDEX, foodName } from "@/features/catalog/catalog";
import { FoodPicker } from "@/features/onboarding/food-picker";
import { useRouter } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

export interface RecipeProfile {
  dailyTargetG: number;
  meals: Meal[];
  preWorkoutMeal: Meal | null;
  postWorkoutMeal: Meal | null;
  diet: Diet;
  allergies: Allergen[];
  likedFoods: string[];
  cookMinutes: MaxMinutes;
  equipment: Equipment[];
}

/** A proteína escolhida: inteiro, nos limites e em passos de 1 g (os botões andam de 5 em 5). */
function clampTarget(value: number): number {
  if (!Number.isFinite(value)) return RECIPE_TARGET.min;
  return Math.min(RECIPE_TARGET.max, Math.max(RECIPE_TARGET.min, Math.round(value)));
}

/**
 * Nova receita (ecrã 8): por defeito basta escolher a refeição; a app escolhe a base entre os
 * alimentos de que a pessoa gosta e aponta para a meta da refeição. Opcional: a proteína por dose à
 * escolha, os eletrodomésticos (ou sem cozinhar) e os alimentos que a pessoa tem; o tempo e as doses
 * ficam em "Mais opções", já com o que a pessoa disse no formulário.
 */
export function RecipeForm({
  profile,
  initialMeal,
  initialFoods,
  initialMinutes,
  initialServings,
  initialTarget,
  initialEquipment,
  variant,
}: {
  profile: RecipeProfile;
  initialMeal: string | null;
  initialFoods: string[];
  initialMinutes: number | null;
  initialServings: number;
  /** Proteína por dose à escolha (de "Gerar outra"); null = a meta da refeição. */
  initialTarget: number | null;
  /** Equipamento desta receita (de "Gerar outra"); null = o do perfil. */
  initialEquipment: Equipment[] | null;
  variant: number;
}) {
  const t = useTranslations("recipes.form");
  const te = useTranslations("recipes.errors");
  const tm = useTranslations("meals");
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const router = useRouter();
  const optionsId = useId();

  const foods = useMemo(
    () => allowedFoods(CATALOG, profile).filter((f) => f.role !== "pantry"),
    [profile],
  );
  const allowedIds = useMemo(() => new Set(foods.map((f) => f.id)), [foods]);
  const meals = profile.meals;
  const [meal, setMeal] = useState<Meal>(
    initialMeal && isMeal(initialMeal) && meals.includes(initialMeal)
      ? initialMeal
      : (meals[0] ?? "almoco"),
  );
  const [selected, setSelected] = useState<string[]>(() =>
    [...new Set(initialFoods)].filter((id) => allowedIds.has(id)).slice(0, RECIPE_MAX_CHOSEN),
  );
  const [picking, setPicking] = useState(selected.length > 0);
  const [minutes, setMinutes] = useState<MaxMinutes>(
    initialMinutes !== null && (MAX_MINUTES_OPTIONS as readonly number[]).includes(initialMinutes)
      ? (initialMinutes as MaxMinutes)
      : profile.cookMinutes,
  );
  const [servings, setServings] = useState(Math.min(4, Math.max(1, Math.round(initialServings))));
  const [moreOpen, setMoreOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<RecipeErrorCode | null>(null);

  // Numa refeição leve, o seletor só mostra alimentos de refeições leves (nada de frango ao
  // pequeno-almoço); o que já vinha escolhido (do "O meu dia") fica, porque foi a pessoa a pô-lo
  const light = isLightMeal(meal);
  const pickable = useMemo(() => (light ? foods.filter(servesLightMeal) : foods), [foods, light]);

  const post = profile.postWorkoutMeal;
  const pre = profile.preWorkoutMeal;
  const mealTarget = mealTargets(profile.dailyTargetG, meals, post).get(meal) ?? 0;

  const [customTarget, setCustomTarget] = useState(initialTarget !== null);
  const [target, setTarget] = useState(() =>
    clampTarget(initialTarget ?? Math.round(mealTarget / RECIPE_TARGET.step) * RECIPE_TARGET.step),
  );
  const [targetText, setTargetText] = useState(String(target));
  const updateTarget = (value: number) => {
    const next = clampTarget(value);
    setTarget(next);
    setTargetText(String(next));
  };
  const proteinPerServing = customTarget ? target : mealTarget;

  const [equipment, setEquipment] = useState<Equipment[]>(initialEquipment ?? profile.equipment);
  const equipmentChanged = !sameEquipment(equipment, profile.equipment);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodIds: picking ? selected : [],
          meal,
          maxMinutes: minutes,
          servings,
          locale,
          variant: Math.min(3, Math.max(1, Math.round(variant))),
          // Só vão quando mudam: sem eles, o servidor usa a meta da refeição e o perfil
          ...(customTarget ? { targetProteinG: target } : {}),
          ...(equipmentChanged ? { equipment } : {}),
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
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <form
          onSubmit={submit}
          className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8"
          aria-busy={status === "loading"}
        >
          <div className="flex min-w-0 flex-col gap-5">
            <fieldset className="min-w-0 border-t-2 border-text pt-4 [&>legend]:float-left [&>legend]:mb-3 [&>legend]:w-full [&>legend]:px-0 [&>legend~*]:clear-both">
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
                wrap
              />
              <p className="mt-2 text-sm text-muted">
                {t("mealTarget", { grams: formatProtein(mealTarget, lang) })}
              </p>
            </fieldset>

            <fieldset className="min-w-0 border-t-2 border-text pt-4 [&>legend]:float-left [&>legend]:mb-3 [&>legend]:w-full [&>legend]:px-0 [&>legend~*]:clear-both">
              <legend className="px-1 font-display text-lg font-bold">{t("protein")}</legend>
              <div
                role="radiogroup"
                aria-label={t("protein")}
                className="mt-2 grid gap-2 sm:grid-cols-2"
              >
                {[
                  {
                    custom: false,
                    title: t("proteinMeal"),
                    hint: t("proteinMealHint", { grams: formatProtein(mealTarget, lang) }),
                  },
                  { custom: true, title: t("proteinCustom"), hint: t("proteinCustomHint") },
                ].map((option) => {
                  const on = customTarget === option.custom;
                  return (
                    <button
                      key={String(option.custom)}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        if (option.custom && !customTarget) {
                          updateTarget(
                            Math.round(mealTarget / RECIPE_TARGET.step) * RECIPE_TARGET.step,
                          );
                        }
                        setCustomTarget(option.custom);
                      }}
                      className={cn(
                        "flex min-h-14 flex-col justify-center rounded-card border-2 px-4 py-2 text-left transition-colors duration-200",
                        on
                          ? "border-primary bg-primary-soft"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <span className="font-semibold">{option.title}</span>
                      <span className="text-sm text-muted">{option.hint}</span>
                    </button>
                  );
                })}
              </div>
              {customTarget ? (
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label={t("proteinLess")}
                      disabled={target <= RECIPE_TARGET.min}
                      onClick={() => updateTarget(target - RECIPE_TARGET.step)}
                    >
                      <Minus aria-hidden />
                    </Button>
                    <label className="relative">
                      <span className="sr-only">{t("proteinValue")}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={RECIPE_TARGET.min}
                        max={RECIPE_TARGET.max}
                        step={1}
                        value={targetText}
                        onChange={(e) => {
                          setTargetText(e.target.value);
                          const value = Number(e.target.value);
                          if (
                            e.target.value !== "" &&
                            value >= RECIPE_TARGET.min &&
                            value <= RECIPE_TARGET.max
                          ) {
                            setTarget(Math.round(value));
                          }
                        }}
                        onBlur={() => updateTarget(Number(targetText))}
                        className="h-14 w-28 rounded-card border-2 border-border bg-surface pr-9 pl-4 font-display text-2xl font-bold tabular outline-none focus:border-primary"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted"
                      >
                        g
                      </span>
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      aria-label={t("proteinMore")}
                      disabled={target >= RECIPE_TARGET.max}
                      onClick={() => updateTarget(target + RECIPE_TARGET.step)}
                    >
                      <Plus aria-hidden />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {t("proteinNote", { min: RECIPE_TARGET.min, max: RECIPE_TARGET.max })}
                  </p>
                </div>
              ) : null}
            </fieldset>

            <fieldset className="min-w-0 border-t-2 border-text pt-4 [&>legend]:float-left [&>legend]:mb-3 [&>legend]:w-full [&>legend]:px-0 [&>legend~*]:clear-both">
              <legend className="px-1 font-display text-lg font-bold">{t("equipment")}</legend>
              <p className="mt-1 text-sm text-muted">{t("equipmentHint")}</p>
              <EquipmentPicker
                className="mt-3"
                value={equipment}
                onChange={setEquipment}
                profileEquipment={profile.equipment}
              />
            </fieldset>

            <section aria-labelledby={`${optionsId}-foods`} className="border-t-2 border-text pt-4">
              <h2 id={`${optionsId}-foods`} className="font-display text-lg font-bold">
                {t("foods")}
              </h2>
              {!picking ? (
                <div className="mt-2 flex flex-col gap-3">
                  <p className="flex gap-2 text-muted">
                    <Sparkles aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                    {t("autoFoods")}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-auto min-h-11 self-start py-2 text-left whitespace-normal"
                    onClick={() => setPicking(true)}
                  >
                    {t("pickFoods")}
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-muted">
                    {t("pickHint", { max: RECIPE_MAX_CHOSEN })}
                    {light ? ` ${t("pickHintLight")}` : null}
                  </p>
                  {selected.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("chosen")}>
                      {selected.map((id) => (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => setSelected(selected.filter((x) => x !== id))}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-semibold text-on-primary"
                            aria-label={t("removeFood", {
                              food: foodName(FOOD_INDEX.get(id)!, locale),
                            })}
                          >
                            {foodName(FOOD_INDEX.get(id)!, locale)}
                            <X aria-hidden className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-4">
                    <FoodPicker
                      foods={pickable}
                      selected={selected}
                      onChange={(next) => setSelected(next.slice(0, RECIPE_MAX_CHOSEN))}
                      max={RECIPE_MAX_CHOSEN}
                      stickyClassName="top-16"
                      status={
                        <p className="text-muted tabular">
                          {t("foodsCount", { count: selected.length, max: RECIPE_MAX_CHOSEN })}
                        </p>
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-3 h-auto min-h-11 py-2 text-left whitespace-normal"
                    onClick={() => {
                      setPicking(false);
                      setSelected([]);
                    }}
                  >
                    {t("autoInstead")}
                  </Button>
                </div>
              )}
            </section>

            <div className="border-y border-border">
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-controls={`${optionsId}-more`}
                onClick={() => setMoreOpen((o) => !o)}
                className="flex min-h-14 w-full items-center justify-between gap-3 text-left"
              >
                <span>
                  <span className="font-display text-lg font-bold">{t("more")}</span>
                  <span className="block text-sm text-muted">
                    {t("moreSummary", { minutes, servings })}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-5 transition-transform duration-200",
                    moreOpen && "rotate-180",
                  )}
                />
              </button>
              <div
                id={`${optionsId}-more`}
                hidden={!moreOpen}
                className="grid gap-5 border-t border-border py-5 sm:grid-cols-2"
              >
                <fieldset className="min-w-0">
                  <legend className="font-semibold">{t("time")}</legend>
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
                <fieldset className="min-w-0">
                  <legend className="font-semibold">{t("servings")}</legend>
                  <FilterChips
                    className="mt-2"
                    label={t("servings")}
                    options={["1", "2", "3", "4"].map((s) => ({ value: s, label: s }))}
                    selected={[String(servings)]}
                    onChange={(next) => next[0] && setServings(Number(next[0]))}
                  />
                </fieldset>
              </div>
            </div>
          </div>

          {/* Desktop: o resumo e o botão ficam fixos ao lado; no telemóvel, no fim do formulário */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="hidden rounded-card border border-border bg-surface p-5 lg:block">
              <p className="font-display text-lg font-bold">{t("summary")}</p>
              <dl className="mt-3 flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("meal")}</dt>
                  <dd className="text-right font-semibold">{tm(meal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("summaryTarget")}</dt>
                  <dd className="font-semibold tabular">
                    {customTarget ? "" : "≈ "}
                    {formatProtein(proteinPerServing, lang)} g
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("summaryEquipment")}</dt>
                  <dd className="text-right font-semibold">
                    <EquipmentSummary value={equipment} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("foods")}</dt>
                  <dd className="text-right font-semibold">
                    {picking && selected.length > 0
                      ? t("summaryChosen", { count: selected.length })
                      : t("summaryAuto")}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("more")}</dt>
                  <dd className="text-right font-semibold">
                    {t("moreSummary", { minutes, servings })}
                  </dd>
                </div>
              </dl>
            </div>

            <div aria-live="assertive">
              {error ? (
                <p className="rounded-card border border-border bg-surface p-4">{te(error)}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" className="lg:w-full" disabled={status === "loading"}>
                {status === "loading" ? (
                  <Loader2 aria-hidden className="animate-spin" />
                ) : (
                  <ChefHat aria-hidden />
                )}
                {status === "loading" ? t("generating") : t("submit")}
              </Button>
              {status === "loading" ? (
                <p className="text-sm text-muted">{t("generatingHint")}</p>
              ) : null}
            </div>
          </div>
        </form>
      </MotionConfig>
    </LazyMotion>
  );
}
