import type { MetadataRoute } from "next";
import { LISTED_FOODS } from "@/features/catalog/catalog";
import { SITE_URL } from "@/lib/site";

/** Páginas públicas (português, sem prefixo): landing, catálogo, um alimento por página e legais. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/alimentos", "/privacidade", "/termos"].map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
  }));
  const foods = LISTED_FOODS.map((food) => ({ url: `${SITE_URL}/alimentos/${food.id}` }));
  return [...pages, ...foods];
}
