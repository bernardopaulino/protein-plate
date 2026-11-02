import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountView } from "@/features/account/account-view";
import { ProviderButtons } from "@/features/account/provider-buttons";
import { Link } from "@/i18n/navigation";
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
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("title"), robots: { index: false } };
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("account");
  const session = await getSession();
  const providers = availableProviders();

  if (session) {
    return (
      <div className="mx-auto max-w-2xl pb-8">
        <AccountView
          name={session.user.name}
          sessionCreatedAt={session.createdAt}
          providers={providers}
          deleteRequested={query.apagar === "1"}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pb-8">
      <h1 className="text-2xl font-extrabold">{t("signIn")}</h1>
      <p className="mt-2 text-muted">{t("lead")}</p>
      {query.erro ? (
        <p role="alert" className="mt-4 rounded-card border border-border bg-surface p-4">
          {t("error")}
        </p>
      ) : null}
      <div className="mt-6">
        <ProviderButtons providers={providers} />
      </div>
      <p className="mt-6 text-muted">
        {t("noAccount")}{" "}
        <Link
          href="/conta/criar"
          className="font-semibold text-primary underline underline-offset-4"
        >
          {t("create")}
        </Link>
      </p>
    </div>
  );
}
