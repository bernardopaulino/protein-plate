import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Welcome } from "@/features/account/welcome";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { safeNext } from "@/server/auth/guard";
import { getSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.welcome" });
  return { title: t("title"), robots: { index: false } };
}

/** Depois do login: consentimento, cópia local ligada à conta e o passo seguinte. */
export default async function WelcomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const session = await getSession();
  if (!session) redirect({ href: "/entrar", locale });
  return (
    <div className="mx-auto max-w-md pb-8">
      <Welcome userId={session!.user.id} next={safeNext(query.next)} />
    </div>
  );
}
