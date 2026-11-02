"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PROVIDER_NAMES, authClient, type SocialProvider } from "@/lib/auth-client";

function ProviderIcon({ provider }: { provider: SocialProvider }) {
  if (provider === "apple") {
    return (
      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M16.37 12.62c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.72-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.18-.02 1.93-1.08 2.66-2.14.84-1.23 1.18-2.41 1.2-2.47-.03-.01-2.3-.88-2.32-3.5zM14.18 6.15c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.94 10.94 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

/**
 * Botões de login (redirect para o Google ou a Apple). `signUp`: só no ecrã "Criar conta", depois
 * de aceitar os termos (requestSignUp). `callbackURL`: para onde volta.
 */
export function ProviderButtons({
  providers,
  signUp = false,
  callbackURL = "/conta/bem-vindo",
  disabled = false,
  labelKey = "signInWith",
  beforeRedirect,
}: {
  providers: SocialProvider[];
  signUp?: boolean;
  callbackURL?: string;
  disabled?: boolean;
  labelKey?: "signInWith" | "createPage.with" | "delete.reauthButton";
  beforeRedirect?: () => Promise<boolean>;
}) {
  const t = useTranslations("account");
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [failed, setFailed] = useState(false);

  if (providers.length === 0) return <p className="text-muted">{t("providersMissing")}</p>;

  const start = async (provider: SocialProvider) => {
    setPending(provider);
    setFailed(false);
    if (beforeRedirect && !(await beforeRedirect())) {
      setPending(null);
      return;
    }
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL,
      errorCallbackURL: "/conta?erro=1",
      ...(signUp ? { requestSignUp: true, newUserCallbackURL: callbackURL } : {}),
    });
    if (error) {
      setFailed(true);
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {providers.map((provider) => (
        <Button
          key={provider}
          size="lg"
          variant={provider === "apple" ? "primary" : "secondary"}
          className={provider === "apple" ? "bg-text text-bg hover:brightness-125" : undefined}
          disabled={disabled || pending !== null}
          onClick={() => start(provider)}
        >
          <ProviderIcon provider={provider} />
          {t(labelKey, { provider: PROVIDER_NAMES[provider] })}
        </Button>
      ))}
      {failed ? (
        <p role="alert" className="text-sm">
          {t("error")}
        </p>
      ) : null}
    </div>
  );
}
