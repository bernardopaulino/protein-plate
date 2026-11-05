import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/legal-page";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  const ts = await getTranslations({ locale, namespace: "seo" });
  return pageMetadata({
    locale,
    path: "/privacidade",
    title: t("privacyTitle"),
    description: ts("privacyDescription"),
    imageAlt: t("privacyTitle"),
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage kind="privacy" />;
}
