"use client";

import { CalendarCheck, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Meal } from "@/domain/meals";
import { Link } from "@/i18n/navigation";
import { applyRecipeDayAction } from "@/server/actions/account";

/** "Pôr o dia todo no meu dia": cada refeição passa a ter uma dose da sua receita. */
export function ApplyDay({ recipes }: { recipes: { recipeId: string; meal: Meal }[] }) {
  const t = useTranslations("recipes.dayView");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const apply = async () => {
    setStatus("loading");
    const result = await applyRecipeDayAction({ recipes }).catch(() => null);
    setStatus(result?.ok ? "done" : "error");
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-primary/40 bg-primary-soft p-5">
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <CalendarCheck aria-hidden className="size-5 text-primary" />
        {t("apply")}
      </p>
      <p className="text-sm">{t("applyHint")}</p>
      <div aria-live="polite">
        {status === "done" ? (
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            <Check aria-hidden className="size-5 text-primary" />
            {t("applied")}
            <Link href="/o-meu-dia" className="text-primary underline underline-offset-4">
              {t("seeDay")}
            </Link>
          </p>
        ) : status === "error" ? (
          <p className="font-semibold">{t("applyError")}</p>
        ) : null}
      </div>
      {status !== "done" ? (
        <Button
          type="button"
          className="self-start"
          onClick={() => void apply()}
          disabled={status === "loading"}
        >
          {status === "loading" ? <Loader2 aria-hidden className="animate-spin" /> : null}
          {t("apply")}
        </Button>
      ) : null}
    </div>
  );
}
