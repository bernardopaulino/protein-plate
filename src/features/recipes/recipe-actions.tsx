"use client";

import { Bookmark, BookmarkCheck, Check, RefreshCw, Share2, Star, Utensils } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Meal } from "@/domain/meals";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import {
  applyRecipeToDayAction,
  recipeStateAction,
  setRecipeFavoriteAction,
  setRecipeSavedAction,
  type RecipeState,
} from "@/server/actions/account";

type SignedIn = Extract<RecipeState, { signedIn: true }>;

/** "Usar no meu almoço": escolhe a refeição (a da receita, se a pessoa a tiver) e troca-a no dia. */
function UseInDay({
  recipeId,
  recipeMeal,
  meals,
}: {
  recipeId: string;
  recipeMeal: Meal;
  meals: Meal[];
}) {
  const t = useTranslations("recipes.detail");
  const tm = useTranslations("meals");
  const selectId = useId();
  const [meal, setMeal] = useState<Meal>(meals.includes(recipeMeal) ? recipeMeal : meals[0]!);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  const apply = async () => {
    setStatus("saving");
    try {
      const result = await applyRecipeToDayAction({ recipeId, meal });
      setStatus(result.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      aria-labelledby={`${selectId}-title`}
      className="rounded-card border border-primary/40 bg-primary-soft/50 p-4"
    >
      <h2 id={`${selectId}-title`} className="flex items-center gap-2 font-bold">
        <Utensils aria-hidden className="size-5 text-primary" />
        {t("useTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted">{t("useHint")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          {t("useMeal")}
        </label>
        <select
          id={selectId}
          value={meal}
          onChange={(e) => {
            setMeal(e.target.value as Meal);
            setStatus("idle");
          }}
          className="h-11 min-w-0 rounded-full border border-border bg-surface px-4 text-sm font-semibold"
        >
          {meals.map((m) => (
            <option key={m} value={m}>
              {tm(m)}
            </option>
          ))}
        </select>
        <Button onClick={apply} disabled={status === "saving"}>
          {t("useButton")}
        </Button>
      </div>
      <p
        aria-live="polite"
        className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold"
      >
        {status === "done" ? (
          <>
            <Check aria-hidden className="size-4 text-primary" />
            <span>{t("useDone", { meal: tm(meal) })}</span>
            <Link href="/o-meu-dia" className="underline underline-offset-4">
              {t("seeDay")}
            </Link>
          </>
        ) : status === "error" ? (
          <span className="font-normal text-muted">{t("useError")}</span>
        ) : null}
      </p>
    </section>
  );
}

/**
 * Guardar, favorita, usar no dia, partilhar e gerar outra. A página da receita é igual para toda
 * a gente (cache pública); o estado da pessoa vem depois, do browser.
 */
export function RecipeActions({
  recipeId,
  recipeMeal,
  title,
  anotherHref,
}: {
  recipeId: string;
  recipeMeal: Meal;
  title: string;
  anotherHref: { pathname: string; query: Record<string, string> } | null;
}) {
  const t = useTranslations("recipes.detail");
  const [state, setState] = useState<RecipeState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    recipeStateAction({ recipeId })
      .then((r) => {
        if (active && r.ok) setState(r.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [recipeId]);

  const me = state?.signedIn ? (state as SignedIn) : null;

  const toggleSaved = async () => {
    if (!me) return;
    const next = !me.saved;
    setState({ ...me, saved: next, favorite: next ? me.favorite : false });
    const result = await setRecipeSavedAction({ recipeId, saved: next });
    if (result.ok)
      setState({ ...me, saved: result.data, favorite: result.data ? me.favorite : false });
  };

  const toggleFavorite = async () => {
    if (!me) return;
    const next = !me.favorite;
    setState({ ...me, saved: me.saved || next, favorite: next });
    const result = await setRecipeFavoriteAction({ recipeId, favorite: next });
    if (result.ok) setState({ ...me, ...result.data });
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelado: copia o link
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage(t("copied"));
    } catch {
      setMessage(url);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {me && me.meals.length > 0 ? (
        <UseInDay recipeId={recipeId} recipeMeal={recipeMeal} meals={me.meals} />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {me ? (
          <>
            <Button
              variant={me.saved ? "soft" : "secondary"}
              onClick={toggleSaved}
              aria-pressed={me.saved}
            >
              {me.saved ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
              {me.saved ? t("saved") : t("save")}
            </Button>
            <Button
              variant={me.favorite ? "soft" : "secondary"}
              onClick={toggleFavorite}
              aria-pressed={me.favorite}
            >
              <Star aria-hidden className={cn(me.favorite && "fill-accent")} />
              {me.favorite ? t("favorite") : t("markFavorite")}
            </Button>
          </>
        ) : state ? (
          <Button asChild variant="secondary">
            <Link href="/entrar">
              <Bookmark aria-hidden />
              {t("loginToSave")}
            </Link>
          </Button>
        ) : null}
        <Button variant="secondary" onClick={share}>
          <Share2 aria-hidden />
          {t("share")}
        </Button>
        {anotherHref ? (
          <Button asChild variant="ghost">
            <Link href={anotherHref}>
              <RefreshCw aria-hidden />
              {t("another")}
            </Link>
          </Button>
        ) : null}
        <p aria-live="polite" className="w-full text-sm text-muted">
          {message}
        </p>
      </div>
    </div>
  );
}
