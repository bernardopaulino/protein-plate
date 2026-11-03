"use client";

import { Check, ChevronDown, Minus, Search } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState, type ReactNode } from "react";
import { UI_IMAGES } from "@/content/food-images.generated";
import type { Food } from "@/domain/food";
import {
  FOOD_SECTIONS,
  groupFoods,
  selectionOf,
  toggleAll,
  type FoodSection,
  type FoodSubgroup,
  type Selection,
} from "@/domain/food-groups";
import { formatProtein } from "@/domain/protein";
import { defaultPortionProtein, foodName, matchesSearch } from "@/features/catalog/catalog";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { Illustration } from "./ui";

/** Marca do grupo: tudo escolhido (visto), parte (traço) ou nada (círculo vazio). */
function SelectionMark({ state }: { state: Selection }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
        state === "none" ? "border-border bg-surface" : "border-primary bg-primary text-on-primary",
      )}
    >
      {state === "all" ? (
        <Check className="size-4" strokeWidth={3} />
      ) : state === "some" ? (
        <Minus className="size-4" strokeWidth={3} />
      ) : null}
    </span>
  );
}

function FoodChip({
  food,
  on,
  disabled,
  onToggle,
}: {
  food: Food;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const locale = useLocale() as Locale;
  const lang = HTML_LANG[locale];
  const t = useTranslations("onboarding.foods");
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled && !on}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-left text-sm font-semibold transition-[border-color,background-color] duration-200 disabled:opacity-50",
        on
          ? "border-primary bg-primary-soft text-text"
          : "border-border bg-surface hover:border-primary/50",
      )}
    >
      {on ? <Check aria-hidden className="size-4 shrink-0 text-primary" strokeWidth={3} /> : null}
      <span>{foodName(food, locale)}</span>
      {food.role === "protein" ? (
        <span className="font-normal text-muted tabular">
          {t("perPortionShort", { grams: formatProtein(defaultPortionProtein(food), lang) })}
        </span>
      ) : null}
    </button>
  );
}

function SubgroupCard({
  id,
  foods,
  chosen,
  onChange,
  groupToggle,
  full,
}: {
  id: FoodSubgroup;
  foods: Food[];
  chosen: readonly string[];
  onChange: (next: string[]) => void;
  groupToggle: boolean;
  full: boolean;
}) {
  const t = useTranslations("onboarding.foods");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const ids = foods.map((f) => f.id);
  const set = new Set(chosen);
  const state = selectionOf(ids, set);
  const count = ids.filter((x) => set.has(x)).length;
  const name = t(`subgroups.${id}`);

  const toggleFood = (foodId: string) =>
    onChange(set.has(foodId) ? chosen.filter((x) => x !== foodId) : [...chosen, foodId]);

  const header = (
    <>
      <Illustration src={UI_IMAGES[`group:${id}`]} size={44} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="leading-tight font-semibold">{name}</span>
        <span className="text-sm text-muted tabular">
          {count > 0
            ? t("groupCount", { count, total: ids.length })
            : t("groupSize", { total: ids.length })}
        </span>
      </span>
    </>
  );

  return (
    <li
      className={cn(
        "rounded-card border-2 bg-surface transition-[border-color,background-color] duration-200",
        state === "none" ? "border-border" : "border-primary bg-primary-soft/40",
      )}
    >
      <div className="flex items-center gap-1 p-2">
        {groupToggle ? (
          <m.button
            type="button"
            aria-pressed={state === "all" ? true : state === "some" ? "mixed" : false}
            aria-label={t("toggleGroup", { group: name })}
            onClick={() => onChange(toggleAll(chosen, ids))}
            whileTap={{ scale: 0.98 }}
            className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl px-2 text-left"
          >
            {header}
            <SelectionMark state={state} />
          </m.button>
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            onClick={() => setOpen((o) => !o)}
            className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl px-2 text-left"
          >
            {header}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-5 shrink-0 text-muted transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        )}
        {groupToggle ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-label={t(open ? "hideFoods" : "showFoods", { group: name })}
            onClick={() => setOpen((o) => !o)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-track hover:text-text"
          >
            <ChevronDown
              aria-hidden
              className={cn("size-5 transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        ) : null}
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <m.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <ul className="flex flex-wrap gap-2 px-3 pt-1 pb-3" aria-label={name}>
              {foods.map((food) => (
                <li key={food.id}>
                  <FoodChip
                    food={food}
                    on={set.has(food.id)}
                    disabled={full}
                    onToggle={() => toggleFood(food.id)}
                  />
                </li>
              ))}
            </ul>
          </m.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

/**
 * Escolher alimentos por secções (proteína, hidratos, fruta, legumes, frutos secos) e subgrupos.
 * No formulário de boas-vindas, cada subgrupo escolhe-se inteiro ("Aves") e afina-se lá dentro;
 * com `max` (receitas), escolhem-se só alguns alimentos e os subgrupos só abrem.
 */
export function FoodPicker({
  foods,
  selected,
  onChange,
  max,
  status,
  everything = false,
  stickyClassName = "top-0",
}: {
  /** Só os alimentos que a pessoa pode comer (sem despensa). */
  foods: readonly Food[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  max?: number;
  /** Linha de estado na barra fixa (contagem, aviso). */
  status?: ReactNode;
  /** Mostra "Como de tudo". */
  everything?: boolean;
  stickyClassName?: string;
}) {
  const t = useTranslations("onboarding.foods");
  const locale = useLocale() as Locale;
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<FoodSection>("protein");
  const searchId = useId();
  const groupToggle = max === undefined;
  const full = max !== undefined && selected.length >= max;

  const sections = useMemo(
    () => FOOD_SECTIONS.filter((s) => groupFoods(foods, s).length > 0),
    [foods],
  );
  const current = sections.includes(section) ? section : (sections[0] ?? "protein");
  const groups = useMemo(() => groupFoods(foods, current), [foods, current]);
  const allIds = useMemo(() => foods.map((f) => f.id), [foods]);
  const chosen = new Set(selected);
  const everythingState = selectionOf(allIds, chosen);
  const searching = query.trim() !== "";
  const results = searching
    ? foods
        .filter((f) => matchesSearch(f, query))
        .sort((a, b) => foodName(a, locale).localeCompare(foodName(b, locale), locale))
    : [];
  const countIn = (s: FoodSection) =>
    groupFoods(foods, s).reduce((n, g) => n + g.foods.filter((f) => chosen.has(f.id)).length, 0);

  return (
    <div>
      {everything ? (
        <m.button
          type="button"
          role="checkbox"
          aria-checked={
            everythingState === "all" ? true : everythingState === "some" ? "mixed" : false
          }
          onClick={() => onChange(everythingState === "all" ? [] : allIds)}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "mb-4 flex w-full items-center gap-3 rounded-card border-2 px-4 py-3 text-left transition-[border-color,background-color] duration-200",
            everythingState === "all"
              ? "border-primary bg-primary-soft"
              : "border-dashed border-border bg-surface hover:border-primary/50",
          )}
        >
          <Illustration src={UI_IMAGES["misc:all"]} size={44} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold">{t("everything")}</span>
            <span className="text-sm text-muted">
              {everythingState === "all" ? t("everythingOn") : t("everythingHint")}
            </span>
          </span>
          <SelectionMark state={everythingState === "all" ? "all" : "none"} />
        </m.button>
      ) : null}

      <div
        className={cn("sticky z-10 -mx-4 bg-bg/95 px-4 pt-1 pb-3 backdrop-blur", stickyClassName)}
      >
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
          />
          <label htmlFor={searchId} className="sr-only">
            {t("search")}
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="h-12 w-full rounded-full border border-border bg-surface pr-4 pl-11 outline-none focus:border-primary"
          />
        </div>
        {!searching ? (
          <div
            role="radiogroup"
            aria-label={t("sectionsLabel")}
            className="-mx-4 mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1"
          >
            {sections.map((s) => {
              const on = s === current;
              const n = countIn(s);
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSection(s)}
                  className={cn(
                    "relative inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200",
                    on
                      ? "border-primary text-on-primary"
                      : "border-border bg-surface text-muted hover:text-text",
                  )}
                >
                  {on ? (
                    <m.span
                      layoutId="food-section"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  ) : null}
                  <span className="relative">{t(`sections.${s}`)}</span>
                  {n > 0 ? (
                    <span
                      className={cn(
                        "relative rounded-full px-1.5 text-xs tabular",
                        on ? "bg-on-primary/20" : "bg-primary-soft text-text",
                      )}
                    >
                      {n}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
        {status ? (
          <div aria-live="polite" className="mt-3 text-sm">
            {status}
          </div>
        ) : null}
      </div>

      {searching ? (
        results.length === 0 ? (
          <p className="py-8 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2 pt-1" aria-label={t("results")}>
            {results.map((food) => (
              <li key={food.id}>
                <FoodChip
                  food={food}
                  on={chosen.has(food.id)}
                  disabled={full}
                  onToggle={() =>
                    onChange(
                      chosen.has(food.id)
                        ? selected.filter((x) => x !== food.id)
                        : [...selected, food.id],
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <m.ul
          key={current}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid items-start gap-3 sm:grid-cols-2"
          aria-label={t(`sections.${current}`)}
        >
          {groups.map((g) => (
            <SubgroupCard
              key={g.id}
              id={g.id}
              foods={g.foods}
              chosen={selected}
              onChange={onChange}
              groupToggle={groupToggle}
              full={full}
            />
          ))}
        </m.ul>
      )}
    </div>
  );
}
