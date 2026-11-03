"use client";

import { m, LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { useTranslations } from "next-intl";
import { UI_IMAGES, foodImage } from "@/content/food-images.generated";
import { Illustration } from "@/features/onboarding/ui";
import { Link } from "@/i18n/navigation";
import type { SocialProvider } from "@/lib/auth-client";
import { acceptTermsAction } from "@/server/actions/account";
import { ProviderButtons } from "./provider-buttons";

/** Alimentos que flutuam à volta do cartão (decorativos). */
const FLOATING = [
  { id: "ovo", x: "6%", y: "8%", size: 64, delay: 0 },
  { id: "salmao", x: "78%", y: "4%", size: 72, delay: 0.3 },
  { id: "iogurte-grego-natural", x: "86%", y: "62%", size: 60, delay: 0.6 },
  { id: "grao-bico", x: "2%", y: "70%", size: 56, delay: 0.9 },
  { id: "banana", x: "64%", y: "86%", size: 52, delay: 1.2 },
];

const BENEFITS = [
  { key: "goal", image: UI_IMAGES["misc:target"] },
  { key: "day", image: UI_IMAGES["meal:almoco"] },
  { key: "recipes", image: UI_IMAGES["misc:sparkles"] },
] as const;

/**
 * "Entrar": uma só porta para contas novas e existentes. Ao continuar, a pessoa aceita os termos
 * (cookie curto que o Better Auth exige para criar a conta).
 */
export function SignIn({
  providers,
  next,
  failed,
}: {
  providers: SocialProvider[];
  next: string;
  failed: boolean;
}) {
  const t = useTranslations("signIn");
  const callbackURL = `/conta/bem-vindo?next=${encodeURIComponent(next)}`;

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="mx-auto grid max-w-5xl items-center gap-10 pb-10 md:grid-cols-2 md:pt-6">
          <div>
            <m.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-extrabold sm:text-[2.75rem] sm:leading-tight"
            >
              {t("title")}
            </m.h1>
            <m.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-3 text-lg text-muted"
            >
              {t("lead")}
            </m.p>
            <ul className="mt-6 flex flex-col gap-3">
              {BENEFITS.map(({ key, image }, i) => (
                <m.li
                  key={key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + i * 0.08 }}
                  className="flex items-center gap-3 rounded-card bg-surface p-3 font-semibold shadow-[0_1px_0_var(--border)]"
                >
                  <Illustration src={image} size={40} />
                  {t(`benefits.${key}`)}
                </m.li>
              ))}
            </ul>
          </div>

          <div className="relative py-10">
            {FLOATING.map((f) => (
              <m.div
                key={f.id}
                aria-hidden
                className="pointer-events-none absolute hidden sm:block"
                style={{ left: f.x, top: f.y }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                transition={{
                  opacity: { delay: f.delay * 0.3 },
                  scale: { delay: f.delay * 0.3, type: "spring" },
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: f.delay },
                }}
              >
                <Illustration src={foodImage(f.id)} size={f.size} />
              </m.div>
            ))}
            <m.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 24 }}
              className="relative mx-auto max-w-sm rounded-card border border-border bg-surface p-6 shadow-[0_24px_60px_-30px_rgb(47_107_58/0.45)]"
            >
              {failed ? (
                <p
                  role="alert"
                  className="mb-4 rounded-card bg-primary-soft p-3 text-sm font-semibold"
                >
                  {t("error")}
                </p>
              ) : null}
              <ProviderButtons
                providers={providers}
                signUp
                callbackURL={callbackURL}
                beforeRedirect={async () => (await acceptTermsAction({ accepted: true })).ok}
              />
              <p className="mt-5 text-sm text-muted">
                {t.rich("legal", {
                  terms: (chunks) => (
                    <Link href="/termos" className="underline underline-offset-4">
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link href="/privacidade" className="underline underline-offset-4">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </m.div>
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
