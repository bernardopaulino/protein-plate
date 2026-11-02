import { ChefHat } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { SavedRecipes } from "@/features/recipes/saved-recipes";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipes" });
  return { title: t("title"), description: t("lead") };
}

export default async function RecipesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("recipes");
  return (
    <div className="mx-auto max-w-3xl pb-8">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <p className="mt-2 text-muted">{t("lead")}</p>
      <Button asChild size="lg" className="mt-6">
        <Link href="/receitas/nova">
          <ChefHat aria-hidden />
          {t("new")}
        </Link>
      </Button>
      <SavedRecipes />
    </div>
  );
}
