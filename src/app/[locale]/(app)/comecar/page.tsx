import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StartForm } from "@/features/goal/start-form";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "start" });
  return { title: t("title"), description: t("lead") };
}

export default async function StartPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("start");
  const td = await getTranslations("disclaimer");
  return (
    <div className="mx-auto max-w-2xl pb-8">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("lead")}</p>
      <div className="mt-6">
        <StartForm />
      </div>
      <p className="mt-6 text-sm text-muted">{td("health")}</p>
    </div>
  );
}
