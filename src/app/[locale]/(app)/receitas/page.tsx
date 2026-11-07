import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecipeLibrary } from "@/features/recipes/recipe-library";
import { SectorGlyph } from "@/components/wheel/sector-glyph";
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
      parts: [0],
      title: t("start.single.title"),
      body: t("start.single.body"),
      cta: t("start.single.cta"),
    },
    {
      key: "day",
      href: "/receitas/dia",
      parts: [0, 1, 2, 3],
      title: t("start.day.title"),
      body: t("start.day.body"),
      cta: t("start.day.cta"),
    },
  ] as const;

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-extrabold lg:text-3xl">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t("lead")}</p>

      <ul className="mt-8 flex flex-col">
        {starts.map((start) => (
          <li key={start.key}>
            <Link
              href={start.href}
              className="group flex items-center gap-5 border-t border-border py-5 transition-colors duration-200 last:border-b hover:border-primary"
            >
              <SectorGlyph
                parts={4}
                filled={start.parts}
                className="size-14 transition-transform duration-500 ease-out group-hover:rotate-90"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-display text-2xl font-bold transition-colors duration-200 group-hover:text-primary">
                  {start.title}
                </span>
                <span className="max-w-prose text-muted">{start.body}</span>
              </span>
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-3 font-semibold text-on-primary transition-transform duration-200 ease-out group-hover:-translate-y-px sm:inline-flex">
                {start.cta}
                <ArrowRight aria-hidden className="size-4" />
              </span>
              <ArrowRight
                aria-hidden
                className="size-6 shrink-0 text-primary transition-transform duration-200 group-hover:translate-x-0.5 sm:hidden"
              />
            </Link>
          </li>
        ))}
      </ul>

      <RecipeLibrary recent={recent} saved={saved.map(({ savedAt: _savedAt, ...r }) => r)} />
    </div>
  );
}
