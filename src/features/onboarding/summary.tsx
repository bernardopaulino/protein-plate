"use client";

import { m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";
import { UI_IMAGES, foodImage } from "@/content/food-images.generated";
import { mealTargets } from "@/domain/meals";
import { formatProtein } from "@/domain/protein";
import { FOOD_INDEX, foodName } from "@/features/catalog/catalog";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { goalState, hasHealthData, likedForDraft, training, type Step } from "./draft";
import { StepHeader, type StepProps } from "./steps";
import { AnimatedNumber, Illustration } from "./ui";

function Row({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-border py-4 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-muted">{title}</p>
        <div className="mt-1">{children}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
      >
        {editLabel}
        <span className="sr-only">: {title}</span>
      </button>
    </div>
  );
}

export function SummaryStep({
  draft,
  update,
  onEdit,
}: StepProps & { onEdit: (step: Step) => void }) {
  const t = useTranslations("onboarding.summary");
  const tr = useTranslations("onboarding.restrictions");
  const tk = useTranslations("onboarding.kitchen");
  const tm = useTranslations("meals");
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const consentId = useId();
  const target = goalState(draft).target ?? 0;
  const { preWorkoutMeal, postWorkoutMeal } = training(draft);
  const targets = mealTargets(target, draft.meals, postWorkoutMeal);
  const liked = likedForDraft(draft, FOOD_INDEX);
  const needsConsent = hasHealthData(draft);

  return (
    <div>
      <StepHeader title={t("title")} lead={t("lead")} />

      <m.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="flex items-center gap-4 rounded-card bg-primary p-5 text-on-primary"
      >
        <Illustration src={UI_IMAGES["misc:target"]} size={64} />
        <div>
          <p className="text-sm font-semibold opacity-90">{t("target")}</p>
          <p className="font-display text-[3.5rem] leading-none font-extrabold">
            <AnimatedNumber value={target} />
            <span className="ml-1 text-2xl">g</span>
          </p>
        </div>
      </m.div>

      <div className="mt-5 rounded-card border border-border bg-surface px-5">
        <Row title={t("perMeal")} onEdit={() => onEdit("meals")} editLabel={t("edit")}>
          <ul className="flex flex-col gap-2">
            {[...targets].map(([meal, grams], i) => (
              <m.li
                key={meal}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <Illustration src={UI_IMAGES[`meal:${meal}`]} size={28} />
                <span className="flex-1 font-semibold">
                  {tm(meal)}
                  {meal === preWorkoutMeal ? (
                    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-[#1f1b16]">
                      {t("pre")}
                    </span>
                  ) : null}
                  {meal === postWorkoutMeal ? (
                    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-[#1f1b16]">
                      {t("post")}
                    </span>
                  ) : null}
                </span>
                <span className="font-display font-bold tabular">
                  {formatProtein(grams, lang)} g
                </span>
              </m.li>
            ))}
          </ul>
        </Row>

        <Row title={t("diet")} onEdit={() => onEdit("restrictions")} editLabel={t("edit")}>
          <p className="flex items-center gap-2 font-semibold">
            <Illustration src={UI_IMAGES[`diet:${draft.diet}`]} size={24} />
            {tr(`diets.${draft.diet}.label`)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {draft.allergies.length === 0
              ? t("noAllergies")
              : `${t("allergies")} ${draft.allergies.map((a) => tr(`allergyNames.${a}`).toLowerCase()).join(", ")}`}
          </p>
        </Row>

        <Row
          title={t("foods", { count: liked.length })}
          onEdit={() => onEdit("foods")}
          editLabel={t("edit")}
        >
          <ul className="flex flex-wrap gap-1.5" aria-label={t("foods", { count: liked.length })}>
            {liked.slice(0, 14).map((id) => {
              const food = FOOD_INDEX.get(id)!;
              return (
                <li
                  key={id}
                  title={foodName(food, locale)}
                  className="flex items-center gap-1 rounded-full bg-primary-soft py-1 pr-3 pl-1 text-sm font-semibold"
                >
                  <Illustration src={foodImage(id)} size={22} />
                  {foodName(food, locale)}
                </li>
              );
            })}
            {liked.length > 14 ? (
              <li className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold">
                +{liked.length - 14}
              </li>
            ) : null}
          </ul>
        </Row>

        <Row title={tk("title")} onEdit={() => onEdit("kitchen")} editLabel={t("edit")}>
          <p className="font-semibold">
            {t("kitchen", {
              minutes: draft.cookMinutes,
              equipment: draft.equipment.map((e) => tk(`equipmentNames.${e}`)).join(", "),
            })}
          </p>
        </Row>
      </div>

      {needsConsent ? (
        <div className="mt-5 rounded-card border-2 border-border bg-surface p-4">
          <label htmlFor={consentId} className="flex min-h-11 items-start gap-3">
            <input
              id={consentId}
              type="checkbox"
              checked={draft.healthConsent}
              onChange={(e) => update({ healthConsent: e.target.checked })}
              className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
            />
            <span>{t("consent")}</span>
          </label>
          {!draft.healthConsent ? (
            <p className="mt-2 text-sm text-muted">{t("consentRequired")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Ecrã de "Tudo pronto!" antes de abrir o dia. */
export function DoneOverlay() {
  const t = useTranslations("onboarding.summary");
  return (
    <m.div
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg/95 backdrop-blur"
    >
      <m.div
        initial={{ scale: 0.3, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 14 }}
      >
        <Illustration src={UI_IMAGES["misc:party"]} size={120} />
      </m.div>
      <m.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="font-display text-2xl font-extrabold"
      >
        {t("done")}
      </m.p>
    </m.div>
  );
}
