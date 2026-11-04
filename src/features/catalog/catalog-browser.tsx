"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Illustration } from "@/components/illustration";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { UI_IMAGES, foodImage } from "@/content/food-images.generated";
import { FoodCard } from "@/components/protein/food-card";
import { Button } from "@/components/ui/button";
import { defaultPortion, type Food } from "@/domain/food";
import {
  FOOD_SECTIONS,
  foodSubgroup,
  groupFoods,
  subgroupSection,
  type FoodSection,
} from "@/domain/food-groups";
import { MEALS, type Meal } from "@/domain/meals";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import {
  LISTED_FOODS,
  defaultPortionProtein,
  foodName,
  matchesSearch,
  portionLabel,
} from "./catalog";

type Sort = "protein" | "ease" | "name";
type Ease = "1" | "2" | "3";
type SectionFilter = FoodSection | "all";

const SORTERS: Record<Sort, (locale: Locale) => (a: Food, b: Food) => number> = {
  protein: () => (a, b) => defaultPortionProtein(b) - defaultPortionProtein(a),
  ease: () => (a, b) => a.ease - b.ease || defaultPortionProtein(b) - defaultPortionProtein(a),
  name: (locale) => (a, b) => foodName(a, locale).localeCompare(foodName(b, locale), locale),
};

/** Ilustração de cada secção (as mesmas do formulário de boas-vindas). */
const SECTION_IMAGES: Record<SectionFilter, string | undefined> = {
  all: UI_IMAGES["misc:all"],
  protein: UI_IMAGES["group:aves"],
  carb: UI_IMAGES["group:pao"],
  fruit: UI_IMAGES["group:fruta-dia"],
  vegetable: UI_IMAGES["group:couves"],
  nuts: UI_IMAGES["group:frutos-secos"],
};

const sectionOf = (food: Food): FoodSection | null => {
  const sub = foodSubgroup(food);
  return sub ? subgroupSection(sub) : null;
};

/** Filtros de hoje guardados na sessão: ao voltar do detalhe, o catálogo está como estava. */
const STATE_KEY = "protein-plate:catalog";
interface SavedState {
  section: SectionFilter;
  meal: Meal | "";
  ease: Ease | "";
  sort: Sort;
}

/** Um seletor nativo com cara de botão (acessível e sem nada a sair do ecrã). */
function SelectPill<T extends string>({
  label,
  value,
  onChange,
  options,
  active,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  active: boolean;
}) {
  const id = useId();
  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(
          "h-11 w-full min-w-0 cursor-pointer appearance-none truncate rounded-full border pr-10 pl-4 text-sm font-semibold transition-colors duration-200",
          active
            ? "border-primary bg-primary-soft text-text"
            : "border-border bg-surface text-text hover:border-primary/50",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

function FoodGrid({
  foods,
  children,
  showCategory = true,
}: {
  foods: Food[];
  children?: ReactNode;
  /** Dentro de um subgrupo a categoria repete o título: só a preparação. */
  showCategory?: boolean;
}) {
  const tc = useTranslations("categories");
  const te = useTranslations("ease");
  const locale = useLocale() as Locale;
  return (
    <ul
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      aria-label={typeof children === "string" ? children : undefined}
    >
      {foods.map((food) => (
        <li key={food.id} className="min-w-0">
          <FoodCard
            image={foodImage(food.id)}
            name={foodName(food, locale)}
            portionLabel={portionLabel(defaultPortion(food), locale)}
            protein={defaultPortionProtein(food)}
            meta={
              showCategory
                ? `${tc(food.category)} · ${te(String(food.ease) as Ease)}`
                : te(String(food.ease) as Ease)
            }
            href={`/alimentos/${food.id}`}
            renderLink={({ href, className, children: content }) => (
              <Link href={href} className={className}>
                {content}
              </Link>
            )}
          />
        </li>
      ))}
    </ul>
  );
}

function GroupHeading({
  id,
  image,
  title,
  count,
}: {
  id: string;
  image: string | undefined;
  title: string;
  count: string;
}) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-lg font-bold">
      {image ? (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft">
          <Illustration src={image} size={28} />
        </span>
      ) : null}
      <span>{title}</span>
      <span className="text-sm font-semibold text-muted tabular">{count}</span>
    </h2>
  );
}

/**
 * Catálogo (ecrã 6): pesquisa; as 5 secções do formulário em cartões (sem nada a sair do ecrã);
 * refeição, preparação e ordem numa barra com nomes; os resultados agrupados por subgrupo (ou por
 * secção em "Todos"), com os de mais proteína primeiro.
 */
export function CatalogBrowser() {
  const t = useTranslations("catalog");
  const tf = useTranslations("onboarding.foods");
  const tm = useTranslations("meals");
  const te = useTranslations("ease");
  const locale = useLocale() as Locale;
  const searchId = useId();
  const tilesId = useId();

  const [query, setQuery] = useState("");
  const [section, setSection] = useState<SectionFilter>("all");
  const [meal, setMeal] = useState<Meal | "">("");
  const [ease, setEase] = useState<Ease | "">("");
  const [sort, setSort] = useState<Sort>("protein");

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STATE_KEY) ?? "null") as SavedState | null;
      if (!saved) return;
      /* eslint-disable react-hooks/set-state-in-effect -- só existe no browser, depois da hidratação */
      if (saved.section === "all" || FOOD_SECTIONS.includes(saved.section as FoodSection))
        setSection(saved.section);
      if (saved.meal === "" || MEALS.includes(saved.meal as Meal)) setMeal(saved.meal);
      if (["", "1", "2", "3"].includes(saved.ease)) setEase(saved.ease);
      if (saved.sort in SORTERS) setSort(saved.sort);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // armazenamento bloqueado ou valor estragado: começa do zero
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({ section, meal, ease, sort }));
    } catch {
      // ignorar
    }
  }, [section, meal, ease, sort]);

  // Refeição e preparação valem para tudo (também para as contagens das secções)
  const filtered = useMemo(
    () =>
      LISTED_FOODS.filter(
        (f) =>
          (meal === "" || f.moments.includes(meal)) && (ease === "" || String(f.ease) === ease),
      ),
    [meal, ease],
  );
  const counts = useMemo(() => {
    const by = new Map<SectionFilter, number>([["all", filtered.length]]);
    for (const f of filtered) {
      const s = sectionOf(f);
      if (s) by.set(s, (by.get(s) ?? 0) + 1);
    }
    return by;
  }, [filtered]);

  const searching = query.trim() !== "";
  const sorter = SORTERS[sort](locale);
  const results = useMemo(
    () =>
      (searching
        ? filtered.filter((f) => matchesSearch(f, query))
        : filtered.filter((f) => section === "all" || sectionOf(f) === section)
      ).sort(sorter),
    [filtered, query, searching, section, sorter],
  );

  // Grupos: por subgrupo dentro de uma secção; por secção em "Todos"; sem grupos na pesquisa
  const groups = useMemo(() => {
    if (searching) return null;
    if (section === "all") {
      return FOOD_SECTIONS.map((s) => ({
        key: s,
        title: tf(`sections.${s}`),
        image: SECTION_IMAGES[s],
        foods: results.filter((f) => sectionOf(f) === s),
      })).filter((g) => g.foods.length > 0);
    }
    return groupFoods(results, section).map((g) => ({
      key: g.id,
      title: tf(`subgroups.${g.id}`),
      image: UI_IMAGES[`group:${g.id}`],
      foods: [...g.foods].sort(sorter),
    }));
  }, [results, searching, section, sorter, tf]);

  const hasFilters = meal !== "" || ease !== "";
  const clearAll = () => {
    setQuery("");
    setMeal("");
    setEase("");
    setSection("all");
  };

  const sections: SectionFilter[] = ["all", ...FOOD_SECTIONS];

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-2xl">
        <label htmlFor={searchId} className="sr-only">
          {t("search")}
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
        />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          className="h-13 w-full rounded-full border border-border bg-surface pr-12 pl-12 text-base shadow-sm focus:border-primary"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t("clearSearch")}
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-track hover:text-text"
          >
            <X aria-hidden className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Secções: cartões que cabem sempre no ecrã (3 por linha no telemóvel, 6 no desktop) */}
      <div
        role="radiogroup"
        aria-labelledby={tilesId}
        aria-disabled={searching || undefined}
        className={cn(
          "transition-opacity duration-200",
          searching && "pointer-events-none opacity-50",
        )}
      >
        <p id={tilesId} className="sr-only">
          {t("sections")}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
          {sections.map((s) => {
            const on = section === s && !searching;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={searching ? -1 : undefined}
                onClick={() => setSection(s)}
                className={cn(
                  "relative flex min-h-24 min-w-0 flex-col items-center justify-center gap-1.5 rounded-card border px-2 py-3 text-center transition-[border-color,box-shadow] duration-200 sm:min-h-28",
                  on
                    ? "border-primary shadow-[0_8px_24px_-16px_var(--primary)]"
                    : "border-border bg-surface hover:border-primary/50",
                )}
              >
                {on ? (
                  <span
                    aria-hidden
                    className="absolute inset-0 animate-in rounded-card bg-primary-soft duration-200 fade-in-0 zoom-in-95"
                  />
                ) : null}
                <Illustration
                  src={SECTION_IMAGES[s]}
                  size={40}
                  className="relative size-9 sm:size-10"
                />
                <span className="relative text-sm leading-tight font-semibold text-balance">
                  {s === "all" ? t("all") : tf(`sections.${s}`)}
                </span>
                <span className="relative text-xs text-muted tabular">{counts.get(s) ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de filtros: cada controlo diz o que é; nada sai do ecrã */}
      <div className="flex flex-col gap-3 border-y border-border py-3 md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <SelectPill
            label={t("meal")}
            value={meal}
            onChange={setMeal}
            active={meal !== ""}
            options={[
              { value: "" as const, label: t("anyMeal") },
              ...MEALS.map((x) => ({ value: x, label: tm(x) })),
            ]}
          />
          <SelectPill
            label={t("ease")}
            value={ease}
            onChange={setEase}
            active={ease !== ""}
            options={[
              { value: "" as const, label: t("anyEase") },
              ...(["1", "2", "3"] as const).map((x) => ({ value: x, label: te(x) })),
            ]}
          />
          <div className="col-span-2 sm:col-span-1">
            <SelectPill
              label={t("sort")}
              value={sort}
              onChange={setSort}
              active={false}
              options={[
                { value: "protein", label: t("sortProtein") },
                { value: "ease", label: t("sortEase") },
                { value: "name", label: t("sortName") },
              ]}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 md:justify-end">
          <p aria-live="polite" className="text-sm text-muted">
            {t("count", { count: results.length })}
          </p>
          {hasFilters || searching ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X aria-hidden />
              {t("clear")}
            </Button>
          ) : null}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-8 text-center">
          <p className="font-semibold">{t("emptyTitle")}</p>
          <p className="mt-1 text-muted">{t("emptyBody")}</p>
          <Button variant="secondary" className="mt-4" onClick={clearAll}>
            {t("clear")}
          </Button>
        </div>
      ) : (
        <div
          key={searching ? "search" : section}
          className="flex animate-in flex-col gap-10 duration-200 ease-out fade-in-0 slide-in-from-bottom-2"
        >
          {groups === null ? (
            <FoodGrid foods={results}>{t("results")}</FoodGrid>
          ) : (
            groups.map((g) => (
              <section
                key={g.key}
                aria-labelledby={`grupo-${g.key}`}
                className="flex flex-col gap-4"
              >
                <GroupHeading
                  id={`grupo-${g.key}`}
                  image={g.image}
                  title={g.title}
                  count={t("groupCount", { count: g.foods.length })}
                />
                <FoodGrid foods={g.foods} showCategory={section === "all"} />
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
