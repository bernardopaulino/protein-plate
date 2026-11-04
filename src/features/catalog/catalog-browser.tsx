"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { Illustration } from "@/components/illustration";
import { FoodCard } from "@/components/protein/food-card";
import { Button } from "@/components/ui/button";
import type { FoodSection } from "@/domain/food-groups";
import { MEALS, type Meal } from "@/domain/meals";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import {
  catalogImage,
  type CatalogGroup,
  type CatalogItem,
  type CatalogSection,
} from "./catalog-types";
import { normalizeSearch } from "./search";

type Sort = "protein" | "ease" | "name";
type EaseFilter = "1" | "2" | "3";
type SectionFilter = FoodSection | "all";

const SORTERS: Record<Sort, (locale: Locale) => (a: CatalogItem, b: CatalogItem) => number> = {
  protein: () => (a, b) => b.protein - a.protein,
  ease: () => (a, b) => a.ease - b.ease || b.protein - a.protein,
  name: (locale) => (a, b) => a.name.localeCompare(b.name, locale),
};

/** Filtros de hoje guardados na sessão: ao voltar do detalhe, o catálogo está como estava. */
const STATE_KEY = "protein-plate:catalog";
interface SavedState {
  section: SectionFilter;
  meal: Meal | "";
  ease: EaseFilter | "";
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
  items,
  basePath,
  children,
  showCategory = true,
}: {
  items: CatalogItem[];
  /** "/alimentos" (ou "/en/alimentos"): o cartão leva a basePath/id */
  basePath: string;
  children?: ReactNode;
  /** Dentro de um subgrupo a categoria repete o título: só a preparação. */
  showCategory?: boolean;
}) {
  const te = useTranslations("ease");
  return (
    <ul
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      aria-label={typeof children === "string" ? children : undefined}
    >
      {items.map((item) => (
        // Fora do ecrã, o browser não calcula nem pinta o cartão (são 168)
        <li
          key={item.id}
          className="min-w-0 [contain-intrinsic-size:auto_5.5rem] [content-visibility:auto]"
        >
          <FoodCard
            image={catalogImage(item)}
            name={item.name}
            portionLabel={item.portion}
            protein={item.protein}
            meta={
              showCategory
                ? `${item.category} · ${te(String(item.ease) as EaseFilter)}`
                : te(String(item.ease) as EaseFilter)
            }
            href={`${basePath}/${item.id}`}
            renderLink={({ href, className, children: content }) => (
              <a href={href} className={className} data-soft-nav="">
                {content}
              </a>
            )}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * Navegação sem recarregar para os links dos cartões, com um só handler para a lista inteira: um
 * Link do Next por cartão eram 168 componentes a hidratar e a pré-carregar quando entram no ecrã.
 * Aqui pré-carrega-se o alimento quando o rato passa, o dedo toca ou o teclado foca o cartão.
 * Cliques com modificadores (abrir num separador) ficam com o browser.
 */
function useSoftNavigation() {
  const router = useRouter();
  const prefetched = useRef(new Set<string>());
  const linkOf = (e: SyntheticEvent) =>
    e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[data-soft-nav]") : null;
  const prefetch = (e: SyntheticEvent) => {
    const href = linkOf(e)?.getAttribute("href");
    if (!href || prefetched.current.has(href)) return;
    prefetched.current.add(href);
    router.prefetch(href);
  };
  const onClick = (e: MouseEvent) => {
    const href = linkOf(e)?.getAttribute("href");
    if (!href || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    router.push(href);
  };
  return { onClick, onPointerOver: prefetch, onTouchStart: prefetch, onFocus: prefetch };
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
export function CatalogBrowser({
  items,
  sections: sectionList,
  allImage,
  basePath,
}: {
  items: CatalogItem[];
  sections: CatalogSection[];
  allImage: string | undefined;
  basePath: string;
}) {
  const t = useTranslations("catalog");
  const tm = useTranslations("meals");
  const te = useTranslations("ease");
  const locale = useLocale() as Locale;
  const searchId = useId();
  const tilesId = useId();

  const [query, setQuery] = useState("");
  const [section, setSection] = useState<SectionFilter>("all");
  const [meal, setMeal] = useState<Meal | "">("");
  const [ease, setEase] = useState<EaseFilter | "">("");
  const [sort, setSort] = useState<Sort>("protein");

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STATE_KEY) ?? "null") as SavedState | null;
      if (!saved) return;
      /* eslint-disable react-hooks/set-state-in-effect -- só existe no browser, depois da hidratação */
      if (saved.section === "all" || sectionList.some((x) => x.id === saved.section))
        setSection(saved.section);
      if (saved.meal === "" || MEALS.includes(saved.meal as Meal)) setMeal(saved.meal);
      if (["", "1", "2", "3"].includes(saved.ease)) setEase(saved.ease);
      if (saved.sort in SORTERS) setSort(saved.sort);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // armazenamento bloqueado ou valor estragado: começa do zero
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao montar
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({ section, meal, ease, sort }));
    } catch {
      // ignorar
    }
  }, [section, meal, ease, sort]);

  const sectionOf = useMemo(() => {
    const by = new Map<string, FoodSection>();
    for (const s of sectionList) for (const g of s.subgroups) by.set(g.id, s.id);
    return (item: CatalogItem) => by.get(item.subgroup);
  }, [sectionList]);

  // Refeição e preparação valem para tudo (também para as contagens das secções)
  const filtered = useMemo(() => {
    const mealBit = meal === "" ? 0 : 1 << MEALS.indexOf(meal);
    return items.filter(
      (f) =>
        (mealBit === 0 || (f.meals & mealBit) !== 0) && (ease === "" || String(f.ease) === ease),
    );
  }, [items, meal, ease]);
  const counts = useMemo(() => {
    const by = new Map<SectionFilter, number>([["all", filtered.length]]);
    for (const f of filtered) {
      const s = sectionOf(f);
      if (s) by.set(s, (by.get(s) ?? 0) + 1);
    }
    return by;
  }, [filtered, sectionOf]);

  const searching = query.trim() !== "";
  // O texto da pesquisa de cada alimento (nome nos dois idiomas), só quando há pesquisa
  const searchText = useMemo(
    () =>
      searching ? new Map(items.map((f) => [f.id, `${normalizeSearch(f.name)} ${f.en}`])) : null,
    [items, searching],
  );
  const sorter = SORTERS[sort](locale);
  const results = useMemo(() => {
    const q = normalizeSearch(query);
    return (
      searchText
        ? filtered.filter((f) => searchText.get(f.id)?.includes(q))
        : filtered.filter((f) => section === "all" || sectionOf(f) === section)
    ).sort(sorter);
  }, [filtered, query, searchText, section, sectionOf, sorter]);

  // Grupos: por subgrupo dentro de uma secção; por secção em "Todos"; sem grupos na pesquisa
  const groups = useMemo((): (CatalogGroup & { items: CatalogItem[] })[] | null => {
    if (searching) return null;
    if (section === "all") {
      return sectionList
        .map((s) => ({ ...s, items: results.filter((f) => sectionOf(f) === s.id) }))
        .filter((g) => g.items.length > 0);
    }
    const subgroups = sectionList.find((s) => s.id === section)?.subgroups ?? [];
    return subgroups
      .map((g) => ({
        ...g,
        items: results
          .filter((f) => f.subgroup === g.id)
          .sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id))
          .sort(sorter),
      }))
      .filter((g) => g.items.length > 0);
  }, [results, searching, section, sectionList, sectionOf, sorter]);
  const softNav = useSoftNavigation();

  const hasFilters = meal !== "" || ease !== "";
  const clearAll = () => {
    setQuery("");
    setMeal("");
    setEase("");
    setSection("all");
  };

  const sections: SectionFilter[] = ["all", ...sectionList.map((s) => s.id)];
  const sectionInfo = (s: SectionFilter) =>
    s === "all"
      ? { title: t("all"), image: allImage }
      : (sectionList.find((x) => x.id === s) ?? { title: s, image: undefined });

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
                  src={sectionInfo(s).image}
                  size={40}
                  className="relative size-9 sm:size-10"
                />
                <span className="relative text-sm leading-tight font-semibold text-balance">
                  {sectionInfo(s).title}
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
          {...softNav}
        >
          {groups === null ? (
            <FoodGrid items={results} basePath={basePath}>
              {t("results")}
            </FoodGrid>
          ) : (
            groups.map((g) => (
              <section key={g.id} aria-labelledby={`grupo-${g.id}`} className="flex flex-col gap-4">
                <GroupHeading
                  id={`grupo-${g.id}`}
                  image={g.image}
                  title={g.title}
                  count={t("groupCount", { count: g.items.length })}
                />
                <FoodGrid items={g.items} basePath={basePath} showCategory={section === "all"} />
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
