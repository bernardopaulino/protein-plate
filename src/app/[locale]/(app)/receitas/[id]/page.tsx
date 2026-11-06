import { Clock, CookingPot, Users, Zap } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";
import { KcalDetails } from "@/components/protein/kcal-details";
import { ProteinNumber } from "@/components/protein/protein-number";
import { formatKcal, kcalPerServingOf } from "@/domain/calories";
import { EQUIPMENT } from "@/domain/preferences";
import { formatProtein } from "@/domain/protein";
import { FOOD_INDEX, foodName } from "@/features/catalog/catalog";
import { RecipeActions } from "@/features/recipes/recipe-actions";
import { Link } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { getDb } from "@/server/db/client";
import { getRecipe } from "@/server/services/recipes";
import { absoluteUrl, ogImage } from "@/lib/seo";

// Dinâmica, mas sem nada da pessoa: o Worker acrescenta cache pública longa (receitas imutáveis)
export const dynamic = "force-dynamic";

const RECIPE_ID = /^[0-9a-zA-Z]{6,20}$/;

const loadRecipe = cache(async (id: string) =>
  RECIPE_ID.test(id) ? getRecipe(getDb(), id) : null,
);

type Params = Promise<{ locale: Locale; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const recipe = await loadRecipe(id);
  if (!recipe) return {};
  const t = await getTranslations({ locale, namespace: "recipes.detail" });
  const protein = formatProtein(recipe.proteinPerServingG, HTML_LANG[locale]);
  const description = `${protein} g ${t("perServing")} · ${t("time", { minutes: recipe.prepMinutes })}. ${recipe.summary}`;
  return {
    title: recipe.title,
    description,
    // Receitas geradas por IA, sem curadoria: partilham-se, mas não vão para o Google
    robots: { index: false, follow: true },
    openGraph: {
      type: "article",
      title: recipe.title,
      description,
      url: absoluteUrl(`/receitas/${recipe.id}`, locale),
      images: [ogImage(locale, recipe.title)],
    },
    twitter: { card: "summary_large_image", title: recipe.title, description },
  };
}

export default async function RecipePage({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const recipe = await loadRecipe(id);
  if (!recipe) notFound();

  const t = await getTranslations("recipes.detail");
  const tm = await getTranslations("meals");
  const td = await getTranslations("disclaimer");
  const tc = await getTranslations("common");
  const tk = await getTranslations("onboarding.kitchen");
  const lang = HTML_LANG[locale];
  const covers =
    recipe.mealTargetG > 0 ? Math.round((recipe.proteinPerServingG / recipe.mealTargetG) * 100) : 0;

  const chosen = recipe.ingredients
    .map((i) => FOOD_INDEX.get(i.foodId))
    .filter((f) => f && f.role !== "pantry")
    .map((f) => f!.id);
  const maxMinutes = [10, 20, 30, 45].find((m) => m >= recipe.prepMinutes) ?? 45;
  const anotherHref =
    chosen.length >= 2
      ? {
          pathname: "/receitas/nova",
          query: {
            refeicao: recipe.meal,
            alimentos: chosen.slice(0, 6).join(","),
            tempo: String(maxMinutes),
            doses: String(recipe.servings),
            variante: String((recipe.variant % 3) + 1),
            ...(recipe.customTarget ? { proteina: String(Math.round(recipe.mealTargetG)) } : {}),
            ...(recipe.equipment
              ? { equipamento: recipe.equipment.length > 0 ? recipe.equipment.join(",") : "nenhum" }
              : {}),
          },
        }
      : null;

  // Receitas anteriores à migração 0005 não guardam o equipamento
  const cookWith =
    recipe.equipment === null
      ? null
      : recipe.equipment.length === 0
        ? t("noCooking")
        : t("cookWith", {
            list: EQUIPMENT.filter((e) => recipe.equipment!.includes(e))
              .map((e) => tk(`equipmentNames.${e}`).toLowerCase())
              .join(", "),
          });

  return (
    <article className="mx-auto max-w-5xl pb-8">
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
        <span>{tm(recipe.meal)}</span>
        {recipe.postWorkout ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-[#1f1b16]">
            <Zap aria-hidden className="size-3.5" />
            {t("postWorkout")}
          </span>
        ) : null}
      </p>
      <h1 className="mt-2 text-2xl font-extrabold sm:text-[2.5rem] sm:leading-tight">
        {recipe.title}
      </h1>
      <p className="mt-2 text-lg text-muted">{recipe.summary}</p>

      <section className="mt-6 grid gap-4 rounded-card border border-border bg-surface p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <p className="flex items-baseline gap-2">
          <ProteinNumber value={recipe.proteinPerServingG} size="hero" className="text-primary" />
          <span className="text-muted">{t("perServing")}</span>
        </p>
        <div className="flex flex-col gap-1 sm:pl-4">
          <p className="font-semibold">
            {recipe.customTarget
              ? t("requested", { target: formatProtein(recipe.mealTargetG, lang) })
              : t("covers", {
                  percent: covers,
                  meal: tm(recipe.meal).toLowerCase(),
                  target: formatProtein(recipe.mealTargetG, lang),
                })}
          </p>
          <p className="flex flex-wrap gap-4 text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="size-4" />
              {t("time", { minutes: recipe.prepMinutes })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users aria-hidden className="size-4" />
              {t("servings", { count: recipe.servings })}
            </span>
            {cookWith ? (
              <span className="inline-flex items-center gap-1">
                <CookingPot aria-hidden className="size-4" />
                {cookWith}
              </span>
            ) : null}
          </p>
        </div>
      </section>

      <div className="mt-4">
        <RecipeActions
          recipeId={recipe.id}
          recipeMeal={recipe.meal}
          title={recipe.title}
          anotherHref={anotherHref}
        />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <section aria-labelledby="ingredientes">
          <h2 id="ingredientes" className="text-lg font-bold">
            {t("ingredients")}
          </h2>
          <ul className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
            {recipe.ingredients.map((i) => {
              const food = FOOD_INDEX.get(i.foodId);
              return (
                <li key={i.foodId} className="flex items-center justify-between gap-3 px-4 py-3">
                  {food && food.role !== "pantry" ? (
                    <Link href={`/alimentos/${food.id}`} className="font-semibold hover:underline">
                      {foodName(food, locale)}
                    </Link>
                  ) : (
                    <span className="font-semibold">
                      {food ? foodName(food, locale) : i.foodId}
                    </span>
                  )}
                  <span className="text-muted tabular">{formatProtein(i.grams, lang)} g</span>
                </li>
              );
            })}
          </ul>
          <KcalDetails title={tc("kcalTitle")} note={tc("kcalNote")} className="mt-3">
            <p>
              {t("kcalPerServing", {
                kcal: formatKcal(
                  kcalPerServingOf(recipe.ingredients, recipe.servings, FOOD_INDEX),
                  lang,
                ),
              })}
            </p>
          </KcalDetails>
        </section>
        <section aria-labelledby="passos">
          <h2 id="passos" className="text-lg font-bold">
            {t("steps")}
          </h2>
          <ol className="mt-3 flex flex-col gap-3">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft font-display font-bold text-primary tabular">
                  {index + 1}
                </span>
                <p className="pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className="mt-8 rounded-2xl bg-primary-soft p-4 text-sm">{td("recipe")}</p>
    </article>
  );
}
