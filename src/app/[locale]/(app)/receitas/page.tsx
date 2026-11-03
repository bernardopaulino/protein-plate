import { ChefHat } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { SavedRecipes } from "@/features/recipes/saved-recipes";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipes" });
  return { title: t("title"), description: t("lead"), robots: { index: false } };
}

export default async function RecipesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireProfile(locale, "/receitas");
  const t = await getTranslations("recipes");
  return (
    <div className="pb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold lg:text-3xl">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-muted">{t("lead")}</p>
        </div>
        <Button asChild size="lg" className="self-start lg:self-auto">
          <Link href="/receitas/nova">
            <ChefHat aria-hidden />
            {t("new")}
          </Link>
        </Button>
      </div>
      <SavedRecipes />
    </div>
  );
}
