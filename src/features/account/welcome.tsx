"use client";

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GuestState } from "@/domain/contracts/guest-state";
import { exampleItems } from "@/features/day/use-day";
import { Link } from "@/i18n/navigation";
import { getGuestSnapshot, saveGuestState } from "@/lib/guest-store";
import {
  ensureConsentAction,
  importGuestDataAction,
  loadDayAction,
} from "@/server/actions/account";
import type { StoredDay } from "@/server/services/account";

const IMPORT_ID_KEY = "protein-plate:import-id";

/** Um importId por tentativa de importação, reaproveitado nas repetições (idempotência). */
function importId(): string {
  try {
    const existing = sessionStorage.getItem(IMPORT_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(IMPORT_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** A cópia local passa a ser da conta (o que está na D1 manda). */
function mirrorFromServer(day: StoredDay, userId: string, previous: GuestState | null) {
  if (!day.profile) return;
  const { dailyTargetG, intensity, meals, postWorkoutMeal } = day.profile;
  const items =
    day.items.length > 0 ? day.items : exampleItems(dailyTargetG, meals, postWorkoutMeal, 0);
  saveGuestState({
    version: 1,
    target: {
      grams: dailyTargetG,
      intensity,
      // O peso continua só neste browser (nunca vem do servidor)
      weightKg:
        previous?.owner === null || previous?.owner === userId
          ? (previous?.target.weightKg ?? null)
          : null,
      manual: previous?.target.manual ?? false,
    },
    meals,
    postWorkoutMeal,
    plan: { items, seed: 0, isExample: day.items.length === 0 },
    updatedAt: Date.now(),
    owner: userId,
  });
}

type Phase = "working" | "conflict" | "done" | "error";

/**
 * /conta/bem-vindo: lê o estado local, importa-o para a conta (idempotente), pergunta qual dia
 * manter se a conta já tiver um, e deixa a cópia local ligada à conta. O peso nunca é enviado.
 */
export function Welcome({ userId, name }: { userId: string; name: string }) {
  const t = useTranslations("account.welcome");
  const tc = useTranslations("common");
  const [phase, setPhase] = useState<Phase>("working");
  const started = useRef(false);

  const run = async (keep?: "guest" | "account") => {
    setPhase("working");
    try {
      const local = getGuestSnapshot();
      const isGuestData = local && local.owner === null;
      if (isGuestData) {
        const result = await importGuestDataAction({
          importId: importId(),
          profile: {
            dailyTargetG: local.target.grams,
            intensity: local.target.intensity,
            meals: local.meals,
            postWorkoutMeal: local.postWorkoutMeal,
            locale: "pt",
          },
          items: local.plan.items,
          ...(keep ? { keep } : {}),
        });
        if (!result.ok) throw new Error(result.code);
        if (result.data === "conflict") {
          setPhase("conflict");
          return;
        }
      } else {
        await ensureConsentAction();
      }
      const day = await loadDayAction();
      if (!day.ok) throw new Error(day.code);
      mirrorFromServer(day.data, userId, local);
      try {
        sessionStorage.removeItem(IMPORT_ID_KEY);
      } catch {
        // ignorar
      }
      setPhase("done");
    } catch {
      setPhase("error");
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-card border border-border bg-surface p-6" aria-live="polite">
      <h1 className="text-2xl font-extrabold">
        {t("title")}
        {name ? `, ${name.split(" ")[0]}` : ""}
      </h1>
      {phase === "working" ? (
        <p className="mt-3 flex items-center gap-2 text-muted">
          <Loader2 aria-hidden className="size-5 animate-spin" />
          {t("importing")}
        </p>
      ) : phase === "conflict" ? (
        <div className="mt-3">
          <h2 className="text-lg font-bold">{t("conflictTitle")}</h2>
          <p className="text-muted">{t("conflictBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => run("guest")}>{t("keepGuest")}</Button>
            <Button variant="secondary" onClick={() => run("account")}>
              {t("keepAccount")}
            </Button>
          </div>
        </div>
      ) : phase === "done" ? (
        <div className="mt-3">
          <p className="flex items-center gap-2 font-semibold text-primary">
            <Check aria-hidden className="size-5" />
            {t("done")}
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/o-meu-dia">{t("goToday")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <p>{tc("technicalError")}</p>
          <Button className="mt-4" onClick={() => run()}>
            {tc("retry")}
          </Button>
        </div>
      )}
    </div>
  );
}
