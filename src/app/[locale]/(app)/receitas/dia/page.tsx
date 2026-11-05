import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { mealTargets } from "@/domain/meals";
import { DayRecipeForm } from "@/features/recipes/day-recipe-form";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { getEnv } from "@/server/env";
import { quotaKey, usageCount } from "@/server/services/quota";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipes.day" });
  return { title: t("title"), robots: { index: false } };
}

/** Dia completo (secção 6): uma receita para cada refeição do plano da pessoa. */
export default async function DayRecipesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session, profile } = await requireProfile(locale, "/receitas/dia");
  const t = await getTranslations("recipes");
  const td = await getTranslations("disclaimer");

  // Quantas receitas novas ainda dá para gerar hoje (a mesma chave da quota do servidor)
  const env = getEnv();
  const used = await usageCount(
    getDb(),
    await quotaKey(env.IP_HASH_SECRET, `user:${session.user.id}`),
  );
  const targets = mealTargets(profile.dailyTargetG, profile.meals, profile.postWorkoutMeal);

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-extrabold lg:text-3xl">{t("day.title")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t("day.lead")}</p>
      <div className="mt-6">
        <DayRecipeForm
          meals={profile.meals.map((meal) => ({
            meal,
            targetG: targets.get(meal) ?? 0,
            preWorkout: meal === profile.preWorkoutMeal,
            postWorkout: meal === profile.postWorkoutMeal,
          }))}
          dailyTargetG={profile.dailyTargetG}
          cookMinutes={profile.cookMinutes}
          profileEquipment={profile.equipment}
          remaining={Math.max(0, env.QUOTA_USER - used)}
        />
      </div>
      <p className="mt-6 text-sm text-muted">{td("recipe")}</p>
    </div>
  );
}
