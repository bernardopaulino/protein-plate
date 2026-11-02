"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { SocialProvider } from "@/lib/auth-client";
import { Link } from "@/i18n/navigation";
import { acceptTermsAction } from "@/server/actions/account";
import { ProviderButtons } from "./provider-buttons";

/** "Criar conta": só depois de aceitar os termos e a privacidade (versão guardada na conta). */
export function CreateAccount({ providers }: { providers: SocialProvider[] }) {
  const t = useTranslations("account.createPage");
  const tf = useTranslations("footer");
  const id = useId();
  const [accepted, setAccepted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card border border-border bg-surface p-5">
        <label htmlFor={id} className="flex min-h-11 items-start gap-3">
          <input
            id={id}
            type="checkbox"
            checked={accepted}
            onChange={(e) => {
              setAccepted(e.target.checked);
              setShowHint(false);
            }}
            className="mt-1 size-5 shrink-0 accent-[var(--primary)]"
          />
          <span>
            {t("consent")}{" "}
            <span className="text-sm text-muted">
              (
              <Link href="/termos" className="underline underline-offset-4">
                {tf("terms")}
              </Link>
              ,{" "}
              <Link href="/privacidade" className="underline underline-offset-4">
                {tf("privacy")}
              </Link>
              )
            </span>
          </span>
        </label>
        {showHint ? (
          <p role="alert" className="mt-2 text-sm font-semibold">
            {t("consentRequired")}
          </p>
        ) : null}
      </div>
      <ProviderButtons
        providers={providers}
        signUp
        labelKey="createPage.with"
        beforeRedirect={async () => {
          if (!accepted) {
            setShowHint(true);
            return false;
          }
          const result = await acceptTermsAction({ accepted: true });
          return result.ok;
        }}
      />
    </div>
  );
}
