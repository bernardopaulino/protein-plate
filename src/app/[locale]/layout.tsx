import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { BottomNav, SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { AccountSync } from "@/features/account/account-sync";
import { ENABLED_LOCALES, HTML_LANG, type Locale } from "@/i18n/routing";
import { bricolage, figtree } from "../fonts";

export function generateStaticParams() {
  return ENABLED_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
    applicationName: "Protein Plate",
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg", apple: "/icon.svg" },
    openGraph: { type: "website", siteName: "Protein Plate", locale: HTML_LANG[locale as Locale] },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#12110f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(ENABLED_LOCALES, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html lang={HTML_LANG[locale]} className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {t("skip")}
        </a>
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="conteudo" tabIndex={-1} className="mx-auto max-w-5xl px-4 pt-6 outline-none">
            {children}
          </main>
          <SiteFooter />
          <BottomNav />
          <AccountSync />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
