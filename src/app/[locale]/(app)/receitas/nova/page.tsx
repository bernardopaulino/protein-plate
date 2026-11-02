import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecipeForm } from "@/features/recipes/recipe-form";
import type { Locale } from "@/i18n/routing";
import { getSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipes.form" });
  return { title: t("title"), robots: { index: false } };
}

export default async function NewRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("recipes");
  const td = await getTranslations("disclaimer");
  const session = await getSession();
  const env = getEnv();

  const meal = typeof query.refeicao === "string" ? query.refeicao : null;
  const foods =
    typeof query.alimentos === "string"
      ? query.alimentos.split(",").filter(Boolean).slice(0, 12)
      : [];

  return (
    <div className="mx-auto max-w-2xl pb-8">
      <h1 className="text-2xl font-extrabold">{t("form.title")}</h1>
      <p className="mt-2 text-muted">{t("lead")}</p>
      <div className="mt-6">
        <RecipeForm
          initialMeal={meal}
          initialFoods={foods}
          initialMinutes={Number(query.tempo) || 20}
          initialServings={Number(query.doses) || 1}
          variant={Number(query.variante) || 1}
          isGuest={!session}
          siteKey={env.TURNSTILE_SITE_KEY}
        />
      </div>
      <p className="mt-6 text-sm text-muted">{td("recipe")}</p>
    </div>
  );
}
