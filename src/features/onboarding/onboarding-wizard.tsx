"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FOOD_INDEX } from "@/features/catalog/catalog";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { savePreferencesAction } from "@/server/actions/account";
import {
  STEPS,
  initialDraft,
  stepIsValid,
  toInput,
  type ClientProfile,
  type Draft,
  type Step,
} from "./draft";
import { FoodsStep, GoalStep, KitchenStep, MealsStep, RestrictionsStep } from "./steps";
import { DoneOverlay, SummaryStep } from "./summary";

const DRAFT_KEY = "protein-plate:onboarding";

function readSavedDraft(userId: string): { draft: Draft; step: number } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { userId: string; draft: Draft; step: number };
    return saved.userId === userId ? { draft: saved.draft, step: saved.step } : null;
  } catch {
    return null;
  }
}

type Status = "idle" | "saving" | "done" | "error" | "liked";

/**
 * Formulário de boas-vindas (secção 10, ecrã 2): meta, refeições, restrições, alimentos, cozinha e
 * resumo. Também serve para editar as preferências na conta (`mode="edit"`).
 */
export function OnboardingWizard({
  profile,
  userId,
  mode,
}: {
  profile: ClientProfile | null;
  userId: string;
  mode: "onboarding" | "edit";
}) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => initialDraft(profile));
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const restored = useRef(false);
  const stepRef = useRef<HTMLDivElement>(null);

  // Um refresh a meio não perde o que já foi escolhido (só nesta aba e nesta conta)
  useEffect(() => {
    if (restored.current || mode !== "onboarding") return;
    restored.current = true;
    const saved = readSavedDraft(userId);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o sessionStorage depois da hidratação
      setDraft(saved.draft);
      setIndex(Math.min(saved.step, STEPS.length - 1));
    }
  }, [mode, userId]);

  useEffect(() => {
    if (mode !== "onboarding" || status === "done") return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ userId, draft, step: index }));
    } catch {
      // armazenamento bloqueado: segue sem guardar
    }
  }, [draft, index, mode, status, userId]);

  const step: Step = STEPS[index]!;
  const valid = stepIsValid(step, draft, FOOD_INDEX);
  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setStatus((s) => (s === "error" || s === "liked" ? "idle" : s));
  }, []);

  const go = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Leitores de ecrã: o título do passo novo recebe o foco
  const focusHeading = () => {
    const heading = stepRef.current?.querySelector("h1");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  };

  const submit = async () => {
    setStatus("saving");
    try {
      const result = await savePreferencesAction(toInput(draft, FOOD_INDEX));
      if (!result.ok) {
        if (result.code === "liked_foods") {
          setStatus("liked");
          go(STEPS.indexOf("foods"));
          return;
        }
        if (result.code === "unauthorized") {
          router.replace("/entrar?next=/comecar");
          return;
        }
        setStatus("error");
        return;
      }
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignorar
      }
      setStatus("done");
      window.setTimeout(() => router.replace(mode === "edit" ? "/conta" : "/o-meu-dia"), 1400);
    } catch {
      setStatus("error");
    }
  };

  const next = () => {
    if (!valid) return;
    if (step === "summary") void submit();
    else go(index + 1);
  };

  const stepProps = { draft, update };

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <div className="mx-auto max-w-3xl pb-36 xl:max-w-4xl">
          <ProgressHeader
            index={index}
            onBack={index > 0 ? () => go(index - 1) : null}
            title={mode === "edit" ? t("editTitle") : t("title")}
          />

          <div ref={stepRef} className="relative">
            <AnimatePresence
              mode="wait"
              custom={direction}
              initial={false}
              onExitComplete={focusHeading}
            >
              <m.div
                key={step}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
                  center: { opacity: 1, x: 0 },
                  exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {step === "goal" ? <GoalStep {...stepProps} /> : null}
                {step === "meals" ? <MealsStep {...stepProps} /> : null}
                {step === "restrictions" ? <RestrictionsStep {...stepProps} /> : null}
                {step === "foods" ? <FoodsStep {...stepProps} /> : null}
                {step === "kitchen" ? <KitchenStep {...stepProps} /> : null}
                {step === "summary" ? (
                  <SummaryStep {...stepProps} onEdit={(s) => go(STEPS.indexOf(s))} />
                ) : null}
              </m.div>
            </AnimatePresence>
          </div>

          <div aria-live="assertive" className="mt-4">
            {status === "error" ? (
              <p className="rounded-card border border-border bg-surface p-4">
                {tc("technicalError")}
              </p>
            ) : null}
            {status === "liked" ? (
              <p className="rounded-card border border-border bg-surface p-4">
                {t("summary.likedError")}
              </p>
            ) : null}
          </div>
        </div>

        {/* Barra de ações fixa em baixo (o polegar chega lá) */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 xl:max-w-4xl">
            {index > 0 ? (
              <Button variant="secondary" size="lg" onClick={() => go(index - 1)} className="px-5">
                <ArrowLeft aria-hidden />
                <span className="sr-only sm:not-sr-only">{t("back")}</span>
              </Button>
            ) : null}
            <Button
              size="lg"
              className="flex-1"
              disabled={!valid || status === "saving" || status === "done"}
              onClick={next}
            >
              {status === "saving" ? <Loader2 aria-hidden className="animate-spin" /> : null}
              {step === "summary"
                ? status === "saving"
                  ? t("summary.saving")
                  : mode === "edit"
                    ? t("summary.save")
                    : t("summary.submit")
                : t("next")}
              {step !== "summary" ? <ArrowRight aria-hidden /> : null}
            </Button>
          </div>
        </div>

        <AnimatePresence>{status === "done" ? <DoneOverlay /> : null}</AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  );
}

function ProgressHeader({
  index,
  onBack,
  title,
}: {
  index: number;
  onBack: (() => void) | null;
  title: string;
}) {
  const t = useTranslations("onboarding");
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted">
          {title} · {t("stepOf", { step: index + 1, total: STEPS.length })}
        </p>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 rounded-full px-3 text-sm font-semibold text-primary md:hidden"
          >
            {t("back")}
          </button>
        ) : null}
      </div>
      <ol className="mt-3 grid grid-cols-6 gap-1.5" aria-label={title}>
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-col gap-1.5">
            <span className="relative block h-1.5 overflow-hidden rounded-full bg-track">
              <m.span
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                initial={false}
                animate={{ width: i <= index ? "100%" : "0%" }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </span>
            <span
              className={cn(
                "hidden text-xs font-semibold sm:block",
                i === index ? "text-text" : "text-muted",
              )}
              aria-current={i === index ? "step" : undefined}
            >
              {t(`steps.${s}`)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
