import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";
import { toClientProfile } from "@/server/services/account";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return { title: t("editTitle"), robots: { index: false } };
}

/** "As minhas preferências": o mesmo formulário, com o que já está guardado. */
export default async function PreferencesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session, profile } = await requireProfile(locale, "/conta/preferencias");
  return (
    <OnboardingWizard mode="edit" userId={session.user.id} profile={toClientProfile(profile)} />
  );
}
