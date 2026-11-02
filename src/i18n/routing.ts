import { defineRouting } from "next-intl/routing";

/** Idiomas com rotas: o português sem prefixo, o inglês em /en (traduções na v1.1). */
export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** Idiomas publicados. O inglês entra aqui quando o en.json estiver traduzido (v1.1). */
export const ENABLED_LOCALES: readonly Locale[] = ["pt"];

/** O atributo lang de cada idioma (português de Portugal). */
export const HTML_LANG: Record<Locale, string> = { pt: "pt-PT", en: "en" };
