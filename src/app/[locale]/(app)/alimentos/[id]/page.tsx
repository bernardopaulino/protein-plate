import { ArrowLeft, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Illustration } from "@/components/illustration";
import { KcalDetails } from "@/components/protein/kcal-details";
import { ProteinNumber } from "@/components/protein/protein-number";
import { JsonLd } from "@/components/seo/json-ld";
import { foodImage } from "@/content/food-images.generated";
import { formatKcal, portionKcal, proteinPer100Kcal } from "@/domain/calories";
import { TCA_REFERENCE, TODO } from "@/domain/contracts/food";
import { defaultPortion } from "@/domain/food";
import { foodSubgroup } from "@/domain/food-groups";
import { formatProtein, portionProtein } from "@/domain/protein";
import { AddToDay } from "@/features/catalog/add-to-day";
import {
  FOOD_INDEX,
  LISTED_FOODS,
  defaultPortionProtein,
  foodName,
} from "@/features/catalog/catalog";
import { Link } from "@/i18n/navigation";
import { ENABLED_LOCALES, HTML_LANG, type Locale } from "@/i18n/routing";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

/** Até 6 alimentos do mesmo subgrupo, os de mais proteína por porção primeiro (links internos). */
function relatedFoods(id: string) {
  const food = FOOD_INDEX.get(id)!;
  const group = foodSubgroup(food);
  return LISTED_FOODS.filter((f) => f.id !== id && foodSubgroup(f) === group)
    .sort((a, b) => defaultPortionProtein(b) - defaultPortionProtein(a))
    .slice(0, 6);
}

export const dynamicParams = false;

export function generateStaticParams() {
  return ENABLED_LOCALES.flatMap((locale) => LISTED_FOODS.map((f) => ({ locale, id: f.id })));
}

type Params = Promise<{ locale: Locale; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, id } = await params;
  const food = FOOD_INDEX.get(id);
  if (!food || food.role === "pantry") return {};
  const t = await getTranslations({ locale, namespace: "food" });
  const ts = await getTranslations({ locale, namespace: "seo" });
  const portion = defaultPortion(food);
  const description = t("metaDescription", {
    name: foodName(food, locale),
    protein: formatProtein(defaultPortionProtein(food), HTML_LANG[locale]),
    portion: portion.label[locale].toLowerCase(),
  });
  return pageMetadata({
    locale,
    path: `/alimentos/${food.id}`,
    title: ts("foodTitle", { name: foodName(food, locale) }),
    description,
    imageAlt: foodName(food, locale),
    type: "article",
  });
}

export default async function FoodPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const food = FOOD_INDEX.get(id);
  // A despensa (azeite, sal, especiarias) só entra nas receitas: sem página própria
  if (!food || food.role === "pantry") notFound();

  const t = await getTranslations("food");
  const tc = await getTranslations("categories");
  const te = await getTranslations("ease");
  const tw = await getTranslations("weightBasis");
  const common = await getTranslations("common");
  const lang = HTML_LANG[locale];
  const ideas = food.ideas[locale];
  const ts = await getTranslations("seo");
  const tn = await getTranslations("nav");
  const related = relatedFoods(food.id);
  const density = proteinPer100Kcal(food);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: ts("breadcrumbHome"), path: "/" },
      { name: tn("foods"), path: "/alimentos" },
      { name: foodName(food, locale), path: `/alimentos/${food.id}` },
    ].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, locale),
    })),
  };

  return (
    <article className="mx-auto max-w-6xl pb-8">
      <JsonLd data={breadcrumb} />
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
            <KcalDetails title={common("kcalTitle")} note={common("kcalNote")} className="mt-3">
              <ul className="divide-y divide-border">
                {food.portions.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <span>{p.label[locale]}</span>
                    <span className="text-muted tabular">
                      {common("kcal", { kcal: formatKcal(portionKcal(food, p.id), lang) })}
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 py-2">
                  <span>
                    {t("per100")} · {tw(food.weightBasis)}
                  </span>
                  <span className="text-muted tabular">
                    {common("kcal", { kcal: formatKcal(food.kcalPer100g, lang) })}
                  </span>
                </li>
              </ul>
              {density !== null ? (
                <p className="mt-2 font-semibold">
                  {common("proteinPer100Kcal", { grams: formatProtein(density, lang) })}
                </p>
              ) : null}
            </KcalDetails>
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

      {related.length > 0 ? (
        <section aria-labelledby="parecidos" className="mt-12">
          <h2 id="parecidos" className="text-lg font-bold">
            {t("related")}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/alimentos/${other.id}`}
                  className="flex min-h-16 items-center gap-3 rounded-card border border-border bg-surface p-3 transition-colors duration-200 hover:border-primary/50"
                >
                  <Illustration src={foodImage(other.id)} size={40} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{foodName(other, locale)}</span>
                    <span className="truncate text-sm text-muted">
                      {defaultPortion(other).label[locale]}
                    </span>
                  </span>
                  <ProteinNumber value={defaultPortionProtein(other)} size="md" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
