import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DayView } from "@/features/day/day-view";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { loadDay } from "@/server/services/account";

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
 * O dia da conta. O servidor manda o dia guardado e as preferências; no browser, a cópia local
 * (sincronizada pelo AccountSync) acerta-se com ele e as mudanças são instantâneas.
 */
export default async function TodayPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session, profile } = await requireProfile(locale, "/o-meu-dia");
  const day = await loadDay(getDb(), session.user.id);
  return (
    <DayView
      userId={session.user.id}
      serverDay={day}
      preferences={{
        diet: profile.diet,
        allergies: profile.allergies,
        likedFoods: profile.likedFoods,
      }}
    />
  );
}
