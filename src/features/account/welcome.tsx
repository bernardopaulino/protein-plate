"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { welcomeAction } from "@/server/actions/account";

/**
 * /conta/bem-vindo, depois do login: regista o consentimento (contas novas) e segue para o
 * formulário de boas-vindas ou para onde a pessoa ia.
 */
export function Welcome({ next }: { next: string }) {
  const t = useTranslations("account.welcome");
  const tc = useTranslations("common");
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  const run = async () => {
    setFailed(false);
    try {
      const result = await welcomeAction();
      if (!result.ok) throw new Error(result.code);
      router.replace(result.data.onboarded ? next : "/comecar");
    } catch {
      setFailed(true);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center text-center"
      aria-live="polite"
    >
      {failed ? (
        <>
          <p>{tc("technicalError")}</p>
          <Button className="mt-4" onClick={() => void run()}>
            {tc("retry")}
          </Button>
        </>
      ) : (
        <p className="flex items-center gap-2 text-muted">
          <Loader2 aria-hidden className="size-5 animate-spin" />
          {t("loading")}
        </p>
      )}
    </div>
  );
}
