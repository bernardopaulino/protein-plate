import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogBrowser } from "@/features/catalog/catalog-browser";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return { title: t("title"), description: t("lead") };
}

export default async function FoodsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const common = await getTranslations("common");
  return (
    <div className="pb-8">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t("lead")}</p>
      <div className="mt-6">
        <CatalogBrowser />
      </div>
      <p className="mt-8 text-sm text-muted">
        {common("source")}. {common("provisional")}
      </p>
    </div>
  );
}
