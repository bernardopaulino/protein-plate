"use client";

import { ChevronRight, Download, LogOut, SlidersHorizontal, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatProtein } from "@/domain/protein";
import { Link, useRouter } from "@/i18n/navigation";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { PROVIDER_NAMES, authClient, type SocialProvider } from "@/lib/auth-client";
import { removeGuestState } from "@/lib/guest-store";
import { exportDataAction } from "@/server/actions/account";
import { ProviderButtons } from "./provider-buttons";

/** Apagar a conta exige uma sessão criada há menos disto (igual ao freshAge do Better Auth). */
const FRESH_MS = 5 * 60 * 1000;

/** Conta (ecrã 9): meta e preferências, exportar, sair e apagar conta. */
export function AccountView({
  name,
  sessionCreatedAt,
  providers,
  deleteRequested,
  goal,
}: {
  name: string;
  sessionCreatedAt: number;
  providers: SocialProvider[];
  deleteRequested: boolean;
  goal: { grams: number; meals: number };
}) {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const lang = HTML_LANG[useLocale() as Locale];
  const router = useRouter();
  const [deleting, setDeleting] = useState(deleteRequested);
  const [provider, setProvider] = useState<SocialProvider | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deleting) return;
    authClient
      .listAccounts()
      .then(({ data }) => {
        const id = data?.find(
          (a) => a.providerId === "apple" || a.providerId === "google",
        )?.providerId;
        if (id === "apple" || id === "google") setProvider(id);
      })
      .catch(() => {});
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, [deleting]);

  const fresh = now - sessionCreatedAt < FRESH_MS;

  const exportData = async () => {
    setBusy(true);
    const result = await exportDataAction();
    setBusy(false);
    if (!result.ok) return setError(true);
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "protein-plate-dados.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    setBusy(true);
    await authClient.signOut();
    // A cópia local era da conta: sai com ela (aparelhos partilhados)
    removeGuestState();
    router.push("/");
    router.refresh();
  };

  const deleteAccount = async () => {
    setBusy(true);
    setError(false);
    const { error: failed } = await authClient.deleteUser();
    if (failed) {
      setBusy(false);
      setError(true);
      return;
    }
    removeGuestState();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">
        {name ? t("hello", { name: name.split(" ")[0] ?? name }) : t("helloAnon")}
      </h1>

      <Link
        href="/conta/preferencias"
        className="group flex items-center gap-4 rounded-card border border-border bg-surface p-5 transition-colors hover:border-primary/60"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <SlidersHorizontal aria-hidden className="size-6" />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-bold">{t("preferences")}</span>
          <span className="block text-muted">
            {t("goalValue", { grams: formatProtein(goal.grams, lang), count: goal.meals })}
          </span>
          <span className="block text-sm text-muted">{t("preferencesHint")}</span>
        </span>
        <ChevronRight
          aria-hidden
          className="size-5 text-muted transition-transform group-hover:translate-x-0.5"
        />
      </Link>

      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="text-lg font-bold">{t("export")}</h2>
        <p className="mt-1 text-muted">{t("exportHint")}</p>
        <Button variant="secondary" className="mt-3" onClick={exportData} disabled={busy}>
          <Download aria-hidden />
          {t("export")}
        </Button>
      </section>

      <div>
        <Button variant="ghost" onClick={signOut} disabled={busy}>
          <LogOut aria-hidden />
          {t("signOut")}
        </Button>
      </div>

      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="text-lg font-bold">{t("delete.title")}</h2>
        <p className="mt-1 text-muted">{t("delete.body")}</p>
        {!deleting ? (
          <Button variant="secondary" className="mt-3" onClick={() => setDeleting(true)}>
            <Trash2 aria-hidden />
            {t("delete.title")}
          </Button>
        ) : fresh ? (
          <Button className="mt-3" onClick={deleteAccount} disabled={busy}>
            <Trash2 aria-hidden />
            {t("delete.confirm")}
          </Button>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <p>
              {t("delete.reauth", {
                provider: provider ? PROVIDER_NAMES[provider] : "Google / Apple",
              })}
            </p>
            <ProviderButtons
              providers={provider ? [provider] : providers}
              callbackURL="/conta?apagar=1"
              labelKey="delete.reauthButton"
            />
          </div>
        )}
      </section>

      {error ? (
        <p role="alert" className="font-semibold">
          {tc("technicalError")}
        </p>
      ) : null}
    </div>
  );
}
