import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DayView } from "@/features/day/day-view";
import type { Locale } from "@/i18n/routing";

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
 * O dia vive no browser: convidado no localStorage; com conta, a mesma cópia local sincroniza com a
 * D1 (AccountSync). Por isso a página é estática e abre instantaneamente.
 */
export default async function TodayPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DayView />;
}
