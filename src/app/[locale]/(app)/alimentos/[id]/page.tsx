import { ArrowLeft, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProteinNumber } from "@/components/protein/protein-number";
import { TCA_REFERENCE, TODO } from "@/domain/contracts/food";
import { defaultPortion } from "@/domain/food";
import { formatProtein, portionProtein } from "@/domain/protein";
import { AddToDay } from "@/features/catalog/add-to-day";
import { CATALOG, FOOD_INDEX, defaultPortionProtein, foodName } from "@/features/catalog/catalog";
import { Link } from "@/i18n/navigation";
import { ENABLED_LOCALES, HTML_LANG, type Locale } from "@/i18n/routing";

export const dynamicParams = false;

export function generateStaticParams() {
  return ENABLED_LOCALES.flatMap((locale) => CATALOG.map((f) => ({ locale, id: f.id })));
}

type Params = Promise<{ locale: Locale; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const food = FOOD_INDEX.get(id);
  if (!food) return {};
  const t = await getTranslations({ locale, namespace: "food" });
  const portion = defaultPortion(food);
  const description = t("metaDescription", {
    name: foodName(food, locale),
    protein: formatProtein(defaultPortionProtein(food), HTML_LANG[locale]),
    portion: portion.label[locale].toLowerCase(),
  });
  return {
    title: foodName(food, locale),
    description,
    alternates: { canonical: `/alimentos/${food.id}` },
    openGraph: { title: foodName(food, locale), description },
  };
}

export default async function FoodPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const food = FOOD_INDEX.get(id);
  if (!food) notFound();

  const t = await getTranslations("food");
  const tc = await getTranslations("categories");
  const te = await getTranslations("ease");
  const tw = await getTranslations("weightBasis");
  const common = await getTranslations("common");
  const lang = HTML_LANG[locale];
  const ideas = food.ideas[locale];

  return (
    <article className="mx-auto max-w-6xl pb-8">
      <Link
        href="/alimentos"
        className="inline-flex min-h-11 items-center gap-1 font-semibold text-muted hover:text-text"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("back")}
      </Link>

      <header className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">
            {tc(food.category)} · {te(String(food.ease) as "1" | "2" | "3")}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-[2.5rem] sm:leading-tight">
            {foodName(food, locale)}
          </h1>
          {food.processing === "ultra" ? (
            <p className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-[#1f1b16]">
              {common("whey")}
            </p>
          ) : null}
        </div>
        <p className="text-right">
          <ProteinNumber value={defaultPortionProtein(food)} size="hero" className="text-primary" />
          <span className="block text-sm text-muted">
            {defaultPortion(food).label[locale]} · {common("perPortion")}
          </span>
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="contents lg:block lg:min-w-0">
          <section aria-labelledby="porcoes" className="order-1">
            <h2 id="porcoes" className="text-lg font-bold">
              {t("portions")}
            </h2>
            <ul className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
              {food.portions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <span className="font-semibold">{p.label[locale]}</span>
                    <span className="ml-2 text-sm text-muted tabular">
                      {formatProtein(p.grams, lang)} g
                    </span>
                  </span>
                  <ProteinNumber value={portionProtein(food, p.id)} size="md" />
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 px-4 py-3 text-muted">
                <span>
                  {t("per100")} · {tw(food.weightBasis)}
                </span>
                <ProteinNumber value={food.proteinPer100g} size="md" />
              </li>
            </ul>
          </section>

          {ideas.length > 0 ? (
            <section aria-labelledby="ideias" className="order-3 lg:mt-8">
              <h2 id="ideias" className="text-lg font-bold">
                {t("ideas")}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {ideas.map((idea) => (
                  <li key={idea} className="flex items-start gap-3 rounded-2xl bg-primary-soft p-3">
                    <Lightbulb aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                    {idea}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="order-4 text-sm text-muted lg:mt-8">
            {food.tcaCode === TCA_REFERENCE
              ? common("sourceReference")
              : food.tcaCode === TODO
                ? `${common("source")}. ${common("provisional")}`
                : `${common("source")} (${food.tcaCode})`}
          </p>
        </div>
        {/* No telemóvel fica a seguir às porções; no desktop, numa coluna fixa ao lado */}
        <div className="order-2 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1">
          <AddToDay foodId={food.id} food={food} />
        </div>
      </div>
    </article>
  );
}
