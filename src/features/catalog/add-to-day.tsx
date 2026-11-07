"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { defaultPortion, type Food } from "@/domain/food";
import type { Meal } from "@/domain/meals";
import { formatProtein, portionProtein } from "@/domain/protein";
import { Link } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import {
  addToDayAction,
  addToDayContextAction,
  type AddToDayContext,
} from "@/server/actions/account";

/**
 * "Adicionar ao meu dia" no detalhe (página pública e estática): pergunta à conta as refeições da
 * pessoa e grava lá. Sem sessão, sem plano ou com um alimento fora das restrições, explica porquê.
 */
export function AddToDay({ foodId, food }: { foodId: string; food: Food }) {
  const t = useTranslations("food");
  const tm = useTranslations("meals");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const mealId = useId();
  const portionId = useId();

  const [context, setContext] = useState<AddToDayContext | "loading" | "error">("loading");
  const [meal, setMeal] = useState<Meal | undefined>(undefined);
  const [portion, setPortion] = useState(defaultPortion(food).id);
  const [added, setAdded] = useState<Meal | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    let active = true;
    addToDayContextAction({ foodId })
      .then((result) => active && setContext(result.ok ? result.data : "error"))
      .catch(() => active && setContext("error"));
    return () => {
      active = false;
    };
  }, [foodId]);

  if (context === "loading")
    return <div aria-hidden className="h-40 animate-pulse rounded-card bg-track" />;

  const box = (children: React.ReactNode) => (
    <div className="border-t-2 border-text pt-4">
      <h2 className="text-lg font-bold">{t("addToDay")}</h2>
      {children}
    </div>
  );

  if (context === "error")
    return box(<p className="mt-2 text-muted">{tCommon("technicalError")}</p>);

  if (!context.signedIn) {
    return box(
      <>
        <p className="mt-2 text-muted">{t("signInToAdd")}</p>
        <Button asChild className="mt-4">
          <Link href={`/entrar?next=${encodeURIComponent(`/alimentos/${foodId}`)}`}>
            {t("signInCta")}
          </Link>
        </Button>
      </>,
    );
  }

  if (!context.onboarded) {
    return box(
      <>
        <p className="mt-2 text-muted">{t("noGoal")}</p>
        <Button asChild className="mt-4">
          <Link href="/comecar">{t("noGoalCta")}</Link>
        </Button>
      </>,
    );
  }

  if (!context.allowed) return box(<p className="mt-2 text-muted">{t("notForYou")}</p>);

  const meals = context.meals;
  const chosenMeal = meal ?? meals.find((m) => food.moments.includes(m)) ?? meals[0];

  return (
    <form
      className="border-t-2 border-text pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!chosenMeal || status === "saving") return;
        setStatus("saving");
        try {
          const result = await addToDayAction({
            meal: chosenMeal,
            foodId,
            portionId: portion,
            count: 1,
          });
          if (!result.ok) throw new Error(result.code);
          setAdded(chosenMeal);
          setStatus("idle");
        } catch {
          setStatus("error");
        }
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
        <Button type="submit" disabled={status === "saving"}>
          {t("addButton")}
        </Button>
        <p aria-live="polite" className="flex flex-wrap items-center gap-2 font-semibold">
          {added ? (
            <>
              <Check aria-hidden className="size-5 text-primary" />
              <span className="text-primary">{t("added", { meal: tm(added) })}</span>
              <Link href="/o-meu-dia" className="underline underline-offset-4">
                {t("seeDay")}
              </Link>
            </>
          ) : status === "error" ? (
            <span className="font-normal text-muted">{tCommon("technicalError")}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
