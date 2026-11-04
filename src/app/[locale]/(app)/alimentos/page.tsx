import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogBrowser } from "@/features/catalog/catalog-browser";
import { ALL_IMAGE, catalogItems, catalogSections } from "@/features/catalog/catalog-index";
import { getPathname } from "@/i18n/navigation";
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
  const tc = await getTranslations("categories");
  const tf = await getTranslations("onboarding.foods");
  // O browser recebe só o índice do catálogo (nomes, porção, proteína, filtros), já traduzido
  const items = catalogItems(locale, (c) => tc(c as Parameters<typeof tc>[0]));
  const sections = catalogSections(
    (s) => tf(`sections.${s}` as Parameters<typeof tf>[0]),
    (s) => tf(`subgroups.${s}` as Parameters<typeof tf>[0]),
  );
  return (
    <div className="pb-8">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t("lead")}</p>
      <div className="mt-6">
        <CatalogBrowser
          items={items}
          sections={sections}
          allImage={ALL_IMAGE}
          basePath={getPathname({ locale, href: "/alimentos" })}
        />
      </div>
      <p className="mt-8 text-sm text-muted">
        {common("source")}. {common("provisional")}
      </p>
    </div>
  );
}
