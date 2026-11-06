import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DayView } from "@/features/day/day-view";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { loadDay, loadMealRecipes } from "@/server/services/account";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "today" });
  return { title: t("title"), robots: { index: false } };
}

/**
 * O dia da conta: vem da D1 em cada visita; as mudanças gravam-se logo a seguir (saveDayAction).
 * Só vai para o browser o que o ecrã precisa (o peso não).
 */
export default async function TodayPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session, profile } = await requireProfile(locale, "/o-meu-dia");
  const db = getDb();
  const [{ items }, mealRecipes] = await Promise.all([
    loadDay(db, session.user.id),
    loadMealRecipes(db, session.user.id),
  ]);
  return (
    <DayView
      day={{
        profile: {
          dailyTargetG: profile.dailyTargetG,
          meals: profile.meals,
          preWorkoutMeal: profile.preWorkoutMeal,
          postWorkoutMeal: profile.postWorkoutMeal,
        },
        items,
      }}
      mealRecipes={mealRecipes}
      showKcal={profile.showKcal}
      preferences={{
        diet: profile.diet,
        allergies: profile.allergies,
        likedFoods: profile.likedFoods,
      }}
    />
  );
}
