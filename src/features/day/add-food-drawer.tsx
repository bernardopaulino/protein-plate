"use client";

import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { Drawer } from "vaul";
import { FilterChips } from "@/components/protein/chips";
import { FoodCard } from "@/components/protein/food-card";
import { CATEGORIES, defaultPortion, type Category, type Food } from "@/domain/food";
import type { Meal } from "@/domain/meals";
import {
  LISTED_FOODS,
  defaultPortionProtein,
  foodName,
  matchesSearch,
  portionLabel,
} from "@/features/catalog/catalog";
import type { Locale } from "@/i18n/routing";

const VISIBLE = 30;

/**
 * Painel inferior "Adicionar a <refeição>": pesquisa, filtros e os mais fáceis para a refeição
 * primeiro (compatíveis com o momento, sem preparação, mais proteína).
 */
export function AddFoodDrawer({
  meal,
  open,
  onOpenChange,
  onAdd,
  foods = LISTED_FOODS,
  preferred,
}: {
  meal: Meal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (foodId: string, portionId: string) => void;
  /** Só os alimentos que a pessoa pode comer (as restrições já aplicadas). */
  foods?: readonly Food[];
  /** Os de que gosta aparecem primeiro. */
  preferred?: ReadonlySet<string>;
}) {
  const t = useTranslations("drawer");
  const tm = useTranslations("meals");
  const tc = useTranslations("categories");
  const te = useTranslations("ease");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category[]>([]);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const results = useMemo(() => {
    if (!meal) return [];
    return foods
      .filter(
        (f) =>
          f.role !== "pantry" &&
          matchesSearch(f, query) &&
          (category.length === 0 || category.includes(f.category)),
      )
      .sort((a, b) => {
        const fitA = a.moments.includes(meal) ? 0 : 1;
        const fitB = b.moments.includes(meal) ? 0 : 1;
        const mineA = preferred?.has(a.id) ? 0 : 1;
        const mineB = preferred?.has(b.id) ? 0 : 1;
        const proteinA = a.role === "protein" ? 0 : 1;
        const proteinB = b.role === "protein" ? 0 : 1;
        return (
          fitA - fitB ||
          mineA - mineB ||
          proteinA - proteinB ||
          a.ease - b.ease ||
          defaultPortionProtein(b) - defaultPortionProtein(a)
        );
      });
  }, [meal, query, category, foods, preferred]);

  const categories = CATEGORIES.filter((c) =>
    foods.some((f) => f.role !== "pantry" && f.category === c),
  );

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery("");
          setCategory([]);
          setLastAdded(null);
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] max-w-2xl flex-col rounded-t-[1.75rem] border border-border bg-bg outline-none">
          <div aria-hidden className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-track" />
          <div className="flex items-center justify-between gap-3 px-4 pt-2">
            <Drawer.Title className="font-display text-lg font-bold">
              {meal ? t("title", { meal: tm(meal) }) : ""}
            </Drawer.Title>
            <Drawer.Close
              aria-label={t("title", { meal: meal ? tm(meal) : "" })}
              className="grid size-11 place-items-center rounded-full hover:bg-primary-soft"
            >
              <X aria-hidden className="size-5" />
            </Drawer.Close>
          </div>
          <Drawer.Description className="sr-only">{t("easiest")}</Drawer.Description>

          <div className="flex flex-col gap-3 px-4 pt-3">
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
              label={tCatalog("category")}
              options={categories.map((c) => ({ value: c, label: tc(c) }))}
              selected={category}
              onChange={setCategory}
            />
            <p aria-live="polite" className="text-sm text-muted">
              {lastAdded
                ? t("added", { food: lastAdded })
                : query || category.length
                  ? t("results", { count: results.length })
                  : t("easiest")}
            </p>
          </div>

          <ul className="mt-2 flex flex-col gap-2 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {results.slice(0, VISIBLE).map((food) => {
              const portion = defaultPortion(food);
              const name = foodName(food, locale);
              return (
                <li key={food.id}>
                  <FoodCard
                    name={name}
                    portionLabel={portionLabel(portion, locale)}
                    protein={defaultPortionProtein(food)}
                    meta={`${tc(food.category)} · ${te(String(food.ease) as "1" | "2" | "3")}`}
                    onAdd={() => {
                      onAdd(food.id, portion.id);
                      setLastAdded(name);
                    }}
                    addLabel={t("add", { food: name })}
                  />
                </li>
              );
            })}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
