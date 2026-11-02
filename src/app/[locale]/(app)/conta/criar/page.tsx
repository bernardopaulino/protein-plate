import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CreateAccount } from "@/features/account/create-account";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { availableProviders } from "@/server/auth/providers";
import { getSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.createPage" });
  return { title: t("title") };
}

export default async function CreateAccountPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getSession()) redirect({ href: "/conta", locale });
  const t = await getTranslations("account");
  return (
    <div className="mx-auto max-w-md pb-8">
      <h1 className="text-2xl font-extrabold">{t("createPage.title")}</h1>
      <p className="mt-2 text-muted">{t("createPage.lead")}</p>
      <div className="mt-6">
        <CreateAccount providers={availableProviders()} />
      </div>
      <p className="mt-6 text-muted">
        {t("createPage.haveAccount")}{" "}
        <Link href="/conta" className="font-semibold text-primary underline underline-offset-4">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
