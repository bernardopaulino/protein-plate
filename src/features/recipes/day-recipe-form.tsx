"use client";

import { ChefHat, Loader2 } from "lucide-react";
import { LazyMotion, MotionConfig, domMax } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FilterChips } from "@/components/protein/chips";
import { Illustration } from "@/components/illustration";
import { Button } from "@/components/ui/button";
import { UI_IMAGES } from "@/content/food-images.generated";
import type { RecipeDayResponse } from "@/domain/contracts/recipe";
import type { Meal } from "@/domain/meals";
import type { Equipment } from "@/domain/preferences";
import { formatProtein } from "@/domain/protein";
import {
  MAX_MINUTES_OPTIONS,
  type MaxMinutes,
  type RecipeErrorCode,
} from "@/domain/recipe-options";
import { useRouter } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { EquipmentPicker, sameEquipment } from "./equipment-picker";

export interface DayMeal {
  meal: Meal;
  targetG: number;
  preWorkout: boolean;
  postWorkout: boolean;
}

/**
 * Dia completo (/receitas/dia): mostra as refeições do plano com a meta de cada uma, deixa escolher
 * o tempo, as doses e os eletrodomésticos e gera todas as receitas de uma vez. Avisa antes se a
 * quota de hoje não chega para o dia todo.
 */
export function DayRecipeForm({
  meals,
  dailyTargetG,
  cookMinutes,
  profileEquipment,
  remaining,
}: {
  meals: DayMeal[];
  dailyTargetG: number;
  cookMinutes: MaxMinutes;
  profileEquipment: Equipment[];
  /** Receitas novas que ainda dá para gerar hoje. */
  remaining: number;
}) {
  const t = useTranslations("recipes.day");
  const tf = useTranslations("recipes.form");
  const te = useTranslations("recipes.errors");
  const tm = useTranslations("meals");
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const router = useRouter();

  const [minutes, setMinutes] = useState<MaxMinutes>(cookMinutes);
  const [servings, setServings] = useState(1);
  const [equipment, setEquipment] = useState<Equipment[]>(profileEquipment);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<{ code: RecipeErrorCode; remaining?: number } | null>(null);
  const [left, setLeft] = useState(remaining);
  const enough = left >= meals.length;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "loading" || !enough) return;
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/recipes/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxMinutes: minutes,
          servings,
          locale,
          ...(sameEquipment(equipment, profileEquipment) ? {} : { equipment }),
        }),
      });
      const body = (await response.json()) as RecipeDayResponse;
      if (body.ok) {
        const done = body.recipes.filter((r) => r.ok);
        const failed = body.recipes.filter((r) => !r.ok).map((r) => r.meal);
        router.push({
          pathname: "/receitas/dia/ver",
          query: {
            r: done.map((r) => `${r.meal}.${r.ok ? r.id : ""}`).join(","),
            ...(failed.length > 0 ? { f: failed.join(",") } : {}),
          },
        });
        return;
      }
      if (body.code === "unauthorized") {
        router.push("/entrar?next=/receitas/dia");
        return;
      }
      if (body.remaining !== undefined) setLeft(body.remaining);
      setError({ code: body.code, remaining: body.remaining });
    } catch {
      setError({ code: "generation_failed" });
    }
    setStatus("idle");
  };

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <form
          onSubmit={submit}
          className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8"
          aria-busy={status === "loading"}
        >
          <div className="flex min-w-0 flex-col gap-5">
            <section
              aria-labelledby="refeicoes-dia"
              className="rounded-card border border-border bg-surface p-5"
            >
              <h2 id="refeicoes-dia" className="font-display text-lg font-bold">
                {t("meals")}
              </h2>
              <p className="mt-1 text-sm text-muted">{t("mealsHint")}</p>
              <ul className="mt-4 flex flex-col divide-y divide-border">
                {meals.map((m) => (
                  <li key={m.meal} className="flex items-center gap-3 py-3">
                    <Illustration src={UI_IMAGES[`meal:${m.meal}`]} size={36} />
                    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 font-semibold">
                      {tm(m.meal)}
                      {m.preWorkout || m.postWorkout ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-[#1f1b16]">
                          {tm(m.postWorkout ? "postWorkout" : "preWorkout")}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-display font-bold tabular">
                      ≈ {formatProtein(m.targetG, lang)} g
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 pt-3">
                  <span className="text-muted">{t("total")}</span>
                  <span className="font-display text-xl font-bold text-primary tabular">
                    {formatProtein(dailyTargetG, lang)} g
                  </span>
                </li>
              </ul>
            </section>

            <section
              aria-labelledby="opcoes-dia"
              className="flex flex-col gap-5 rounded-card border border-border bg-surface p-5"
            >
              <h2 id="opcoes-dia" className="font-display text-lg font-bold">
                {t("options")}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <fieldset className="min-w-0">
                  <legend className="font-semibold">{tf("time")}</legend>
                  <FilterChips
                    className="mt-2"
                    label={tf("time")}
                    options={MAX_MINUTES_OPTIONS.map((m) => ({
                      value: String(m),
                      label: tf("minutes", { minutes: m }),
                    }))}
                    selected={[String(minutes)]}
                    onChange={(next) => next[0] && setMinutes(Number(next[0]) as MaxMinutes)}
                  />
                </fieldset>
                <fieldset className="min-w-0">
                  <legend className="font-semibold">{tf("servings")}</legend>
                  <FilterChips
                    className="mt-2"
                    label={tf("servings")}
                    options={["1", "2", "3", "4"].map((s) => ({ value: s, label: s }))}
                    selected={[String(servings)]}
                    onChange={(next) => next[0] && setServings(Number(next[0]))}
                  />
                </fieldset>
              </div>
              <fieldset className="min-w-0">
                <legend className="font-semibold">{tf("equipment")}</legend>
                <EquipmentPicker
                  className="mt-3"
                  value={equipment}
                  onChange={setEquipment}
                  profileEquipment={profileEquipment}
                />
              </fieldset>
            </section>
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <p className="rounded-card border border-border bg-surface p-4 text-sm">
              {enough
                ? t("quota", { count: meals.length, remaining: left })
                : t("quotaShort", { count: meals.length, remaining: left })}
            </p>
            <div aria-live="assertive">
              {error && error.code !== "quota_exceeded" ? (
                <p className="rounded-card border border-border bg-surface p-4">{te(error.code)}</p>
              ) : null}
            </div>
            <Button
              type="submit"
              size="lg"
              className="lg:w-full"
              disabled={status === "loading" || !enough}
            >
              {status === "loading" ? (
                <Loader2 aria-hidden className="animate-spin" />
              ) : (
                <ChefHat aria-hidden />
              )}
              {status === "loading" ? t("generating", { count: meals.length }) : t("submit")}
            </Button>
            {status === "loading" ? (
              <p className="text-sm text-muted">{t("generatingHint")}</p>
            ) : null}
          </div>
        </form>
      </MotionConfig>
    </LazyMotion>
  );
}
