import { ArrowRight } from "lucide-react";
import { Illustration } from "@/components/illustration";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { UI_IMAGES, foodImage } from "@/content/food-images.generated";
import { buildExampleDay } from "@/domain/example-day";
import { defaultPortion } from "@/domain/food";
import { DEFAULT_COMBINATIONS, sortMeals } from "@/domain/meals";
import { formatCount, itemProtein, totalProtein } from "@/domain/protein";
import { CATALOG, FOOD_INDEX, foodName } from "@/features/catalog/catalog";
import { ExampleDayCard } from "@/features/landing/example-day-card";
import { Link } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";

const EXAMPLE = { target: 160, meals: DEFAULT_COMBINATIONS[4] } as const;

export default async function LandingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tm = await getTranslations("meals");
  const td = await getTranslations("disclaimer");

  const day = buildExampleDay({ target: EXAMPLE.target, meals: EXAMPLE.meals, foods: CATALOG });
  const total = totalProtein(day, FOOD_INDEX);
  const lang = HTML_LANG[locale];

  const steps = [
    { key: "goal", image: UI_IMAGES["misc:target"] },
    { key: "day", image: UI_IMAGES["diet:vegetarian"] },
    { key: "adjust", image: UI_IMAGES["misc:sparkles"] },
  ] as const;
  const exampleMeals = sortMeals(EXAMPLE.meals).map((meal) => {
    const items = day.filter((i) => i.meal === meal);
    return {
      key: meal,
      label: tm(meal),
      image: UI_IMAGES[`meal:${meal}`],
      protein: items.reduce((s, i) => s + itemProtein(i, FOOD_INDEX), 0),
      items: items.map((i) => {
        const food = FOOD_INDEX.get(i.foodId)!;
        const portion = food.portions.find((p) => p.id === i.portionId) ?? defaultPortion(food);
        return {
          id: i.id,
          image: foodImage(food.id),
          label: `${formatCount(i.count, lang)} × ${portion.label[locale].toLowerCase()} ${foodName(food, locale).toLowerCase()}`,
        };
      }),
    };
  });
  const faq = ["diet", "account", "allergies", "numbers", "supplements"] as const;

  return (
    <div className="flex flex-col gap-20 pb-8 lg:gap-28">
      <section className="grid items-center gap-10 pt-6 md:grid-cols-[1.15fr_1fr] md:pt-12 lg:gap-16 xl:pt-16">
        <div>
          <p className="font-semibold tracking-wide text-primary">{t("eyebrow")}</p>
          <h1 className="mt-3 text-[2.75rem] leading-[1.02] font-extrabold sm:text-hero">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t("lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/comecar">
                {t("cta")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/alimentos">{t("secondary")}</Link>
            </Button>
          </div>
          <p className="mt-6 max-w-xl text-sm text-muted">{td("health")}</p>
        </div>

        <ExampleDayCard
          title={t("exampleTitle")}
          caption={t("exampleCaption")}
          totalLabel={t("exampleTotal")}
          meals={exampleMeals}
          total={total}
          target={EXAMPLE.target}
          format={lang === "pt-PT" ? "pt-PT" : "en-GB"}
        />
      </section>

      <section aria-labelledby="passos">
        <h2 id="passos" className="text-2xl font-bold lg:text-3xl">
          {t("stepsTitle")}
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map(({ key, image }, index) => (
            <li key={key} className="rounded-card border border-border bg-surface p-5">
              <span className="flex items-center gap-3">
                <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft">
                  <Illustration src={image} size={40} />
                </span>
                <span className="font-display text-sm font-bold text-muted tabular">
                  {index + 1}
                </span>
              </span>
              <h3 className="mt-4 text-lg font-bold">{t(`steps.${key}.title`)}</h3>
              <p className="mt-1 text-muted">{t(`steps.${key}.body`)}</p>
            </li>
          ))}
        </ol>
        <Button asChild size="lg" className="mt-8">
          <Link href="/comecar">
            {t("cta")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </section>

      <section
        aria-labelledby="faq"
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12"
      >
        <h2 id="faq" className="text-2xl font-bold lg:sticky lg:top-24 lg:self-start lg:text-3xl">
          {t("faqTitle")}
        </h2>
        <div className="divide-y divide-border rounded-card border border-border bg-surface">
          {faq.map((key) => (
            <details key={key} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {t(`faq.${key}.q`)}
                <span
                  aria-hidden
                  className="text-xl text-muted transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-muted">{t(`faq.${key}.a`)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
