import type { MetadataRoute } from "next";
import { LISTED_FOODS } from "@/features/catalog/catalog";
import { ENABLED_LOCALES, HTML_LANG } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo";

/** Páginas públicas, em cada idioma, com as alternativas hreflang (o Google junta as versões). */
const PAGES: {
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/alimentos", priority: 0.9, changeFrequency: "weekly" },
  ...LISTED_FOODS.map((food) => ({
    path: `/alimentos/${food.id}`,
    priority: 0.7,
    changeFrequency: "monthly" as const,
  })),
  { path: "/privacidade", priority: 0.2, changeFrequency: "yearly" },
  { path: "/termos", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ path, priority, changeFrequency }) => {
    const languages = {
      ...Object.fromEntries(ENABLED_LOCALES.map((l) => [HTML_LANG[l], absoluteUrl(path, l)])),
      "x-default": absoluteUrl(path, "pt"),
    };
    return ENABLED_LOCALES.map((locale) => ({
      url: absoluteUrl(path, locale),
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
