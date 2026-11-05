import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Illustration } from "@/components/illustration";
import { UI_IMAGES } from "@/content/food-images.generated";
import { RecipeLibrary } from "@/features/recipes/recipe-library";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { RECIPE_HISTORY_MAX, listRecentRecipes, listSavedRecipes } from "@/server/services/account";

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

/**
 * Receitas (ecrã 10): duas entradas claras no topo ("Uma receita" e "O dia todo") e, por baixo, o
 * livro de receitas (guardadas e recentes, filtráveis por refeição).
 */
export default async function RecipesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session } = await requireProfile(locale, "/receitas");
  const db = getDb();
  const [recent, saved] = await Promise.all([
    listRecentRecipes(db, session.user.id, RECIPE_HISTORY_MAX),
    listSavedRecipes(db, session.user.id),
  ]);
  const t = await getTranslations("recipes");

  const starts = [
    {
      key: "single",
      href: "/receitas/nova",
      image: UI_IMAGES["misc:target"],
      title: t("start.single.title"),
      body: t("start.single.body"),
      cta: t("start.single.cta"),
    },
    {
      key: "day",
      href: "/receitas/dia",
      image: UI_IMAGES["meal:almoco"],
      title: t("start.day.title"),
      body: t("start.day.body"),
      cta: t("start.day.cta"),
    },
  ] as const;

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-extrabold lg:text-3xl">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t("lead")}</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {starts.map((start) => (
          <li key={start.key}>
            <Link
              href={start.href}
              className="group flex h-full items-start gap-4 rounded-card border-2 border-border bg-surface p-5 shadow-sm transition-colors duration-200 hover:border-primary"
            >
              <Illustration src={start.image} size={56} />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-display text-xl font-bold">{start.title}</span>
                <span className="text-muted">{start.body}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 font-semibold text-primary">
                  {start.cta}
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <RecipeLibrary recent={recent} saved={saved.map(({ savedAt: _savedAt, ...r }) => r)} />
    </div>
  );
}
