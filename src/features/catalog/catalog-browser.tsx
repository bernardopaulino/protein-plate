"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { foodImage } from "@/content/food-images.generated";
import { FilterChips } from "@/components/protein/chips";
import { FoodCard } from "@/components/protein/food-card";
import { Button } from "@/components/ui/button";
import { CATEGORIES, defaultPortion, type Category, type Food } from "@/domain/food";
import { MEALS, type Meal } from "@/domain/meals";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  LISTED_FOODS,
  defaultPortionProtein,
  foodName,
  matchesSearch,
  portionLabel,
} from "./catalog";

type Sort = "protein" | "ease" | "name";
type EaseFilter = "1" | "2" | "3";

const SORTERS: Record<Sort, (locale: Locale) => (a: Food, b: Food) => number> = {
  protein: () => (a, b) => defaultPortionProtein(b) - defaultPortionProtein(a),
  ease: () => (a, b) => a.ease - b.ease || defaultPortionProtein(b) - defaultPortionProtein(a),
  name: (locale) => (a, b) => foodName(a, locale).localeCompare(foodName(b, locale), locale),
};

/**
 * Catálogo com filtros no cliente: pesquisa, categoria, refeição e facilidade. "Snack sem
 * preparação com mais proteína" fica a dois toques (Lanche + Sem preparação; ordena por proteína).
 */
export function CatalogBrowser() {
  const t = useTranslations("catalog");
  const tc = useTranslations("categories");
  const tm = useTranslations("meals");
  const te = useTranslations("ease");
  const locale = useLocale() as Locale;
  const searchId = useId();

  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [meal, setMeal] = useState<Meal[]>([]);
  const [ease, setEase] = useState<EaseFilter[]>([]);
  const [sort, setSort] = useState<Sort>("protein");

  const presentCategories = useMemo(
    () => CATEGORIES.filter((c) => LISTED_FOODS.some((f) => f.category === c)),
    [],
  );

  const results = useMemo(() => {
    return LISTED_FOODS.filter(
      (f) =>
        matchesSearch(f, query) &&
        (categories.length === 0 || categories.includes(f.category)) &&
        (meal.length === 0 || meal.some((m) => f.moments.includes(m))) &&
        (ease.length === 0 || ease.includes(String(f.ease) as EaseFilter)),
    ).sort(SORTERS[sort](locale));
  }, [query, categories, meal, ease, sort, locale]);

  const hasFilters = query || categories.length || meal.length || ease.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
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
          className="h-12 w-full rounded-full border border-border bg-surface pr-4 pl-12 focus:border-primary"
        />
      </div>

      <FilterChips
        label={t("meal")}
        options={MEALS.map((m) => ({ value: m, label: tm(m) }))}
        selected={meal}
        onChange={setMeal}
      />
      <FilterChips
        label={t("ease")}
        options={(["1", "2", "3"] as const).map((e) => ({ value: e, label: te(e) }))}
        selected={ease}
        onChange={setEase}
        multiple
      />
      <FilterChips
        label={t("category")}
        options={presentCategories.map((c) => ({ value: c, label: tc(c) }))}
        selected={categories}
        onChange={setCategories}
        multiple
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted">
          {t("count", { count: results.length })}
        </p>
        <div className="flex items-center gap-2">
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setCategories([]);
                setMeal([]);
                setEase([]);
              }}
            >
              {t("clear")}
            </Button>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">{t("sort")}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-11 rounded-full border border-border bg-surface px-3 font-semibold"
            >
              <option value="protein">{t("sortProtein")}</option>
              <option value="ease">{t("sortEase")}</option>
              <option value="name">{t("sortName")}</option>
            </select>
          </label>
        </div>
      </div>

      <ul aria-label={t("title")} className="grid gap-3 sm:grid-cols-2">
        {results.map((food) => (
          <li key={food.id}>
            <FoodCard
              image={foodImage(food.id)}
              name={foodName(food, locale)}
              portionLabel={portionLabel(defaultPortion(food), locale)}
              protein={defaultPortionProtein(food)}
              meta={`${tc(food.category)} · ${te(String(food.ease) as EaseFilter)}`}
              href={`/alimentos/${food.id}`}
              renderLink={({ href, className, children }) => (
                <Link href={href} className={className}>
                  {children}
                </Link>
              )}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
