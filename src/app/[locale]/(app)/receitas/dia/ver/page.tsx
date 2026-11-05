import { ArrowRight, Clock, RefreshCw } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Illustration } from "@/components/illustration";
import { ProteinNumber } from "@/components/protein/protein-number";
import { Button } from "@/components/ui/button";
import { UI_IMAGES } from "@/content/food-images.generated";
import { MEALS, isMeal, type Meal } from "@/domain/meals";
import { formatProtein } from "@/domain/protein";
import { FOOD_INDEX, foodName } from "@/features/catalog/catalog";
import { ApplyDay } from "@/features/recipes/apply-day";
import { Link } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";
import { getDb } from "@/server/db/client";
import { getRecipes } from "@/server/services/recipes";

export const dynamic = "force-dynamic";

const RECIPE_ID = /^[0-9a-zA-Z]{6,20}$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipes.dayView" });
  return { title: t("title"), robots: { index: false } };
}

/** `r=almoco.AbC123xyz0,jantar.…` → refeição e receita, sem repetidos nem valores estranhos. */
function parsePairs(value: unknown): { meal: Meal; id: string }[] {
  if (typeof value !== "string") return [];
  const seen = new Set<Meal>();
  const pairs: { meal: Meal; id: string }[] = [];
  for (const part of value.split(",").slice(0, MEALS.length)) {
    const [meal, id] = part.split(".");
    if (!meal || !id || !isMeal(meal) || !RECIPE_ID.test(id) || seen.has(meal)) continue;
    seen.add(meal);
    pairs.push({ meal, id });
  }
  return pairs;
}

/**
 * O dia em receitas (depois de "Gerar o meu dia"): uma receita por refeição, pela ordem do dia, com
 * a proteína de cada uma e o total do dia contra a meta. "Pôr o dia todo no meu dia" troca as
 * refeições do "Hoje" pelas receitas; as refeições sem receita têm "Gerar só esta".
 */
export default async function DayRecipesViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const { profile } = await requireProfile(locale, "/receitas/dia");
  const t = await getTranslations("recipes.dayView");
  const td = await getTranslations("recipes.detail");
  const tm = await getTranslations("meals");
  const lang = HTML_LANG[locale];

  const pairs = parsePairs(query.r).filter((p) => profile.meals.includes(p.meal));
  const loaded = await getRecipes(
    getDb(),
    pairs.map((p) => p.id),
  );
  const byId = new Map(loaded.map((r) => [r.id, r]));
  const day = pairs
    .map((p) => ({ meal: p.meal, recipe: byId.get(p.id) }))
    .filter((d): d is { meal: Meal; recipe: NonNullable<typeof d.recipe> } => Boolean(d.recipe))
    .sort((a, b) => MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal));
  const failed =
    typeof query.f === "string"
      ? query.f
          .split(",")
          .filter(isMeal)
          .filter((m) => profile.meals.includes(m) && !day.some((d) => d.meal === m))
      : [];
  const total = day.reduce((sum, d) => sum + d.recipe.proteinPerServingG, 0);

  if (day.length === 0) {
    return (
      <div className="pb-8">
        <h1 className="text-2xl font-extrabold lg:text-3xl">{t("title")}</h1>
        <p className="mt-4 text-muted">{t("empty")}</p>
        <Button asChild className="mt-4">
          <Link href="/receitas/dia">{t("again")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold lg:text-3xl">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-muted">{t("lead")}</p>
        </div>
        <p className="flex items-baseline gap-2 self-start rounded-card border border-border bg-surface px-5 py-3 lg:self-auto">
          <span className="sr-only">{t("total")}:</span>
          <ProteinNumber value={total} size="xl" className="text-primary" />
          <span className="whitespace-nowrap text-muted tabular">
            {t("ofTarget", { target: formatProtein(profile.dailyTargetG, lang) })}
          </span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <ol className="flex flex-col gap-3">
          {day.map(({ meal, recipe }) => {
            const foods = recipe.ingredients
              .map((i) => FOOD_INDEX.get(i.foodId))
              .filter((f) => f && f.role !== "pantry")
              .map((f) => foodName(f!, locale));
            return (
              <li key={meal}>
                <Link
                  href={`/receitas/${recipe.id}`}
                  className="group flex gap-4 rounded-card border border-border bg-surface p-4 shadow-sm transition-colors duration-200 hover:border-primary/50 sm:p-5"
                >
                  <Illustration src={UI_IMAGES[`meal:${meal}`]} size={44} className="self-start" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                      {tm(meal)}
                    </span>
                    <span className="font-display text-lg font-bold">{recipe.title}</span>
                    <span className="line-clamp-2 text-sm text-muted">{foods.join(" · ")}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-baseline gap-1.5">
                        <ProteinNumber value={recipe.proteinPerServingG} size="lg" />
                        <span className="text-muted">{td("perServing")}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-muted">
                        <Clock aria-hidden className="size-4" />
                        {td("time", { minutes: recipe.prepMinutes })}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">
                        {t("open")}
                        <ArrowRight
                          aria-hidden
                          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          {failed.map((meal) => (
            <li
              key={meal}
              className="flex flex-wrap items-center gap-3 rounded-card border border-dashed border-border p-4"
            >
              <Illustration src={UI_IMAGES[`meal:${meal}`]} size={36} />
              <span className="flex-1">{t("failed", { meal: tm(meal).toLowerCase() })}</span>
              <Button asChild variant="secondary" size="sm">
                <Link href={{ pathname: "/receitas/nova", query: { refeicao: meal } }}>
                  {t("retry")}
                </Link>
              </Button>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <ApplyDay recipes={day.map(({ meal, recipe }) => ({ recipeId: recipe.id, meal }))} />
          <Button asChild variant="ghost" className="self-start">
            <Link href="/receitas/dia">
              <RefreshCw aria-hidden />
              {t("again")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
