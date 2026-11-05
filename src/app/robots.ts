import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Páginas com login ou sem valor para a pesquisa, nos dois idiomas. */
const PRIVATE = ["/conta", "/o-meu-dia", "/comecar", "/receitas/nova", "/receitas/dia", "/dev"];

/**
 * robots.txt da produção (o staging responde com "Disallow: /" no Worker, worker/index.ts). As
 * receitas geradas não estão aqui: abrem e partilham-se, e o noindex da página tira-as do índice.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...PRIVATE, ...PRIVATE.map((path) => `/en${path}`)],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
