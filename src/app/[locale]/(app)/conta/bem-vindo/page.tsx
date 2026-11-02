import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Welcome } from "@/features/account/welcome";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
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

/** Depois do login: importa o estado de convidado e liga a cópia local à conta. */
export default async function WelcomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect({ href: "/conta", locale });
  return (
    <div className="mx-auto max-w-md pb-8">
      <Welcome userId={session!.user.id} name={session!.user.name} />
    </div>
  );
}
