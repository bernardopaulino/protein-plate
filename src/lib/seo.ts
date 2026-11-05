import type { Metadata } from "next";
import { ENABLED_LOCALES, HTML_LANG, type Locale } from "@/i18n/routing";
import { SITE_URL } from "./site";

/** O código do Open Graph de cada idioma. */
const OG_LOCALE: Record<Locale, string> = { pt: "pt_PT", en: "en_US" };

/** O caminho público num idioma: o português sem prefixo, o inglês em /en. */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path === "/" ? "" : path;
  if (locale === "pt") return clean || "/";
  return `/en${clean}`;
}

/** O endereço absoluto (canonical, hreflang, sitemap, JSON-LD). A página inicial fica sem "/". */
export function absoluteUrl(path: string, locale: Locale): string {
  const localized = localizedPath(path, locale);
  return localized === "/" ? SITE_URL : `${SITE_URL}${localized}`;
}

/**
 * canonical + hreflang de uma página pública: cada idioma aponta para si e para o outro, e o
 * x-default é o português (o endereço sem prefixo).
 */
export function alternatesFor(path: string, locale: Locale): NonNullable<Metadata["alternates"]> {
  return {
    canonical: absoluteUrl(path, locale),
    languages: {
      ...Object.fromEntries(ENABLED_LOCALES.map((l) => [HTML_LANG[l], absoluteUrl(path, l)])),
      "x-default": absoluteUrl(path, "pt"),
    },
  };
}

/** A imagem de partilha (1200 × 630) de cada idioma, em public/og. */
export function ogImage(locale: Locale, alt: string) {
  return { url: `${SITE_URL}/og/${locale}.png`, width: 1200, height: 630, alt };
}

/**
 * Metadados de uma página pública: título, descrição, canonical e hreflang, Open Graph e Twitter
 * no idioma da página. `index: false` para páginas que se partilham mas não devem ir para o Google.
 */
export function pageMetadata(options: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  /** Texto alternativo da imagem de partilha. */
  imageAlt: string;
  /** O título já leva o nome da app (a página inicial): não usa o modelo "%s · Protein Plate". */
  absoluteTitle?: boolean;
  type?: "website" | "article";
  index?: boolean;
}): Metadata {
  const { locale, path, title, description } = options;
  const url = absoluteUrl(path, locale);
  const image = ogImage(locale, options.imageAlt);
  return {
    title: options.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: alternatesFor(path, locale),
    openGraph: {
      type: options.type ?? "website",
      siteName: "Protein Plate",
      url,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: ENABLED_LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
    ...(options.index === false ? { robots: { index: false, follow: true } } : {}),
  };
}
