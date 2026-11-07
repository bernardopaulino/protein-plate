import { ArrowRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { foodImage } from "@/content/food-images.generated";
import { buildExampleDay } from "@/domain/example-day";
import { defaultPortion } from "@/domain/food";
import { DEFAULT_COMBINATIONS, sortMeals } from "@/domain/meals";
import { formatCount, formatProtein, itemProtein, totalProtein } from "@/domain/protein";
import { CATALOG, FOOD_INDEX, foodName } from "@/features/catalog/catalog";
import { LandingStory, type StoryMeal } from "@/features/landing/landing-story";
import { SectorGlyph } from "@/components/wheel/sector-glyph";
import { Wheel } from "@/components/wheel/wheel";
import { Link } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const EXAMPLE = { target: 160, meals: DEFAULT_COMBINATIONS[4] } as const;
const FAQ = ["diet", "account", "allergies", "numbers", "supplements"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const tm = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({
    locale,
    path: "/",
    title: t("homeTitle"),
    description: t("homeDescription"),
    imageAlt: tm("ogAlt"),
    absoluteTitle: true,
  });
}

export default async function LandingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tm = await getTranslations("meals");
  const td = await getTranslations("disclaimer");
  const tt = await getTranslations("today");

  const day = buildExampleDay({ target: EXAMPLE.target, meals: EXAMPLE.meals, foods: CATALOG });
  const total = totalProtein(day, FOOD_INDEX);
  const lang = HTML_LANG[locale];

  const steps = ["goal", "day", "adjust"] as const;
  const meals: StoryMeal[] = sortMeals(EXAMPLE.meals).map((meal) => {
    const items = day.filter((i) => i.meal === meal);
    return {
      key: meal,
      label: tm(meal),
      protein: items.reduce((s, i) => s + itemProtein(i, FOOD_INDEX), 0),
      items: items.map((i) => {
        const food = FOOD_INDEX.get(i.foodId)!;
        const portion = food.portions.find((p) => p.id === i.portionId) ?? defaultPortion(food);
        return {
          id: i.id,
          foodId: food.id,
          count: i.count,
          name: foodName(food, locale),
          portion: `${formatCount(i.count, lang)} × ${portion.label[locale].toLowerCase()}`,
          protein: itemProtein(i, FOOD_INDEX),
          image: foodImage(food.id),
        };
      }),
    };
  });
  const faq = FAQ;
  const ts = await getTranslations("seo");
  // Dados estruturados: o site, a app (gratuita, na web) e as perguntas frequentes
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Protein Plate",
      url: SITE_URL,
      inLanguage: ["pt-PT", "en"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Protein Plate",
      url: absoluteUrl("/", locale),
      description: ts("homeDescription"),
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      inLanguage: lang,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: lang,
      mainEntity: FAQ.map((key) => ({
        "@type": "Question",
        name: t(`faq.${key}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`faq.${key}.a`) },
      })),
    },
  ];

  const start = (
    <Button asChild size="lg">
      <Link href="/comecar">
        {t("cta")}
        <ArrowRight aria-hidden />
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col gap-24 pb-8 lg:gap-32">
      <JsonLd data={structured} />

      <LandingStory
        hero={
          <div className="pt-6 md:pt-10 lg:pt-0">
            <h1 className="max-w-[11ch] text-[3.25rem] leading-[0.95] font-extrabold tracking-[-0.035em] sm:text-display">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">{t("lead")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {start}
              <Button asChild size="lg" variant="secondary">
                <Link href="/alimentos">{t("secondary")}</Link>
              </Button>
            </div>
            <p className="mt-6 max-w-xl text-sm text-muted">{td("health")}</p>
          </div>
        }
        title={t("exampleTitle")}
        caption={t("exampleCaption")}
        totalLabel={t("exampleTotal")}
        reachedLabel={tt("reached")}
        ofTargetLabel={tt("ofTarget", { target: formatProtein(EXAMPLE.target, lang) })}
        meals={meals}
        total={total}
        target={EXAMPLE.target}
        close={start}
      />

      <section
        aria-labelledby="passos"
        className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16"
      >
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="passos" className="text-[2rem] leading-tight font-extrabold lg:text-[2.75rem]">
            {t("stepsTitle")}
          </h2>
          <div className="mt-8 hidden lg:block">{start}</div>
        </div>
        <ol className="flex flex-col">
          {steps.map((key, index) => (
            <li
              key={key}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-5 border-t border-border py-7 last:border-b sm:gap-7"
            >
              <SectorGlyph
                parts={steps.length}
                filled={steps.slice(0, index + 1).map((_, i) => i)}
                className="size-14 sm:size-16"
              />
              <div>
                <h3 className="text-xl font-bold sm:text-2xl">{t(`steps.${key}.title`)}</h3>
                <p className="mt-2 max-w-prose text-lg text-muted">{t(`steps.${key}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="lg:hidden">{start}</div>
      </section>

      <section aria-labelledby="faq">
        <h2 id="faq" className="text-[2rem] leading-tight font-extrabold lg:text-[2.75rem]">
          {t("faqTitle")}
        </h2>
        <div className="mt-8 gap-x-12 lg:columns-2">
          {faq.map((key) => (
            <details
              key={key}
              className="group break-inside-avoid border-t border-border py-2 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {t(`faq.${key}.q`)}
                <Plus
                  aria-hidden
                  className="size-6 shrink-0 text-primary transition-transform duration-300 ease-out group-open:rotate-45"
                />
              </summary>
              <p className="max-w-prose pb-4 text-muted">{t(`faq.${key}.a`)}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="fecho"
        className="relative overflow-hidden rounded-[2.5rem] bg-primary px-6 py-14 text-on-primary sm:px-12 sm:py-20"
      >
        <div className="relative z-10 max-w-2xl">
          <h2 id="fecho" className="text-[2.25rem] leading-[1.02] font-extrabold sm:text-[3.5rem]">
            {t("closeTitle")}
          </h2>
          <p className="mt-5 max-w-xl text-lg">{t("closeBody")}</p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-bg text-text shadow-[0_10px_24px_-12px_rgb(0_0_0/0.5)] hover:bg-surface hover:brightness-100"
          >
            <Link href="/comecar">
              {t("cta")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <div
          aria-hidden
          className="light pointer-events-none absolute -right-20 -bottom-44 hidden w-[32rem] xl:block"
        >
          <Wheel
            sectors={meals.map((m) => ({
              key: m.key,
              color: `var(--meal-${m.key})`,
              foods: m.items.map((i) => i.image),
            }))}
            progress={1}
            reached
            rotation={-24}
            idPrefix="roda-fecho"
          />
        </div>
      </section>
    </div>
  );
}
