import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignIn } from "@/features/account/sign-in";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternatesFor } from "@/lib/seo";
import { safeNext } from "@/server/auth/guard";
import { availableProviders } from "@/server/auth/providers";
import { getSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "signIn" });
  return {
    title: t("title"),
    description: t("lead"),
    alternates: alternatesFor("/entrar", locale),
    robots: { index: false, follow: true },
  };
}

/** Entrar (ou criar conta): Google ou Apple. Com sessão, segue para onde ia. */
export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const next = safeNext(query.next);
  if (await getSession()) redirect({ href: next, locale });
  return <SignIn providers={availableProviders()} next={next} failed={query.erro === "1"} />;
}
