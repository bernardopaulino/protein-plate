import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecipeForm } from "@/features/recipes/recipe-form";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { loadDayItems } from "@/server/services/account";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipes.form" });
  return { title: t("title"), robots: { index: false } };
}

export default async function NewRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("recipes");
  const td = await getTranslations("disclaimer");
  const { session, profile } = await requireProfile(locale, "/receitas/nova");
  const dayItems = await loadDayItems(getDb(), session.user.id);

  const meal = typeof query.refeicao === "string" ? query.refeicao : null;
  const foods =
    typeof query.alimentos === "string"
      ? query.alimentos.split(",").filter(Boolean).slice(0, 12)
      : [];

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <h1 className="text-2xl font-extrabold">{t("form.title")}</h1>
      <p className="mt-2 text-muted">{t("lead")}</p>
      <div className="mt-6">
        <RecipeForm
          profile={{
            dailyTargetG: profile.dailyTargetG,
            meals: profile.meals,
            preWorkoutMeal: profile.preWorkoutMeal,
            postWorkoutMeal: profile.postWorkoutMeal,
            diet: profile.diet,
            allergies: profile.allergies,
            likedFoods: profile.likedFoods,
            cookMinutes: profile.cookMinutes,
          }}
          initialMeal={meal}
          initialFoods={foods}
          initialMinutes={Number(query.tempo) || null}
          initialServings={Number(query.doses) || 1}
          variant={Number(query.variante) || 1}
          dayItems={dayItems.map(({ meal, foodId }) => ({ meal, foodId }))}
        />
      </div>
      <p className="mt-6 text-sm text-muted">{td("recipe")}</p>
    </div>
  );
}
