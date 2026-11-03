import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireSession } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { loadProfile, toClientProfile } from "@/server/services/account";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return { title: t("title"), robots: { index: false } };
}

/** Formulário de boas-vindas: obrigatório antes do dia e das receitas. */
export default async function StartPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireSession(locale, "/comecar");
  const profile = await loadProfile(getDb(), session.user.id);
  if (profile?.onboardedAt) redirect({ href: "/o-meu-dia", locale });
  return (
    <OnboardingWizard
      mode="onboarding"
      userId={session.user.id}
      profile={profile ? toClientProfile(profile) : null}
    />
  );
}
