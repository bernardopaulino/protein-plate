import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountView } from "@/features/account/account-view";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";
import { availableProviders } from "@/server/auth/providers";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("title"), robots: { index: false } };
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const { session, profile } = await requireProfile(locale, "/conta");
  return (
    <div className="mx-auto max-w-2xl pb-8">
      <AccountView
        name={session.user.name}
        sessionCreatedAt={session.createdAt}
        providers={availableProviders()}
        deleteRequested={query.apagar === "1"}
        goal={{ grams: profile.dailyTargetG, meals: profile.meals.length }}
      />
    </div>
  );
}
