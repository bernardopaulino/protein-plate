"use client";

import { useLocale, useTranslations } from "next-intl";
import { foodImage } from "@/content/food-images.generated";
import { SectorGlyph } from "@/components/wheel/sector-glyph";
import { Wheel } from "@/components/wheel/wheel";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SocialProvider } from "@/lib/auth-client";
import { acceptTermsAction } from "@/server/actions/account";
import { ProviderButtons } from "./provider-buttons";

/** A roda por trás do cartão: um dia a meio, à espera de ser completado (decorativa). */
const WHEEL = [
  { key: "pequeno-almoco", foods: ["iogurte-grego-natural", "banana"] },
  { key: "almoco", foods: ["peito-frango", "grao-bico"] },
  { key: "lanche", foods: ["ovo"] },
  { key: "jantar", foods: ["salmao", "batata-doce"] },
] as const;

const BENEFITS = ["goal", "day", "recipes"] as const;

/**
 * "Entrar": uma só porta para contas novas e existentes. Ao continuar, a pessoa aceita os termos
 * (cookie curto que o Better Auth exige para criar a conta). O título e o texto aparecem logo (são
 * o LCP); o resto entra com animações CSS, sem a biblioteca de motion.
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
  const tm = useTranslations("meals");
  const locale = useLocale() as Locale;
  // O Better Auth volta para um caminho absoluto: com o idioma (o inglês vive em /en)
  const callbackURL = `${getPathname({ href: "/conta/bem-vindo", locale })}?next=${encodeURIComponent(next)}`;

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 pb-10 md:grid-cols-2 md:pt-6 lg:gap-16">
      <div>
        <h1 className="text-[2.5rem] leading-[0.98] font-extrabold tracking-[-0.03em] sm:text-[3.5rem]">
          {t("title")}
        </h1>
        <p className="mt-3 text-lg text-muted">{t("lead")}</p>
        <ul className="mt-8 flex flex-col">
          {BENEFITS.map((key, i) => (
            <li
              key={key}
              style={{ animationDelay: `${120 + i * 90}ms` }}
              className="flex animate-in items-center gap-4 border-t border-border py-4 text-lg font-semibold duration-300 ease-out fade-in-0 fill-mode-both slide-in-from-left-3 last:border-b"
            >
              <SectorGlyph
                parts={BENEFITS.length}
                filled={BENEFITS.slice(0, i + 1).map((_, j) => j)}
                className="size-9"
              />
              {t(`benefits.${key}`)}
            </li>
          ))}
        </ul>
        <div className="mt-8 w-full max-w-sm animate-in rounded-[2rem] border border-border bg-surface p-6 shadow-[0_24px_44px_-26px_rgb(31_27_22/0.45)] delay-100 duration-500 ease-out fade-in-0 fill-mode-both slide-in-from-bottom-4">
          {failed ? (
            <p role="alert" className="mb-4 rounded-card bg-primary-soft p-3 text-sm font-semibold">
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
        </div>
      </div>

      {/* A roda inteira (um dia a meio), ao lado da porta de entrada; no telemóvel não aparece */}
      <div
        aria-hidden
        className="pointer-events-none hidden animate-in duration-700 ease-out fade-in-0 fill-mode-both zoom-in-95 md:block"
      >
        <Wheel
          sectors={WHEEL.map((w) => ({
            key: w.key,
            color: `var(--meal-${w.key})`,
            foods: w.foods.map((id) => foodImage(id)),
            label: tm(w.key),
          }))}
          progress={0.62}
          tilt={30}
          idPrefix="roda-entrar"
          className="mx-auto w-[min(100%,36rem)]"
        />
      </div>
    </div>
  );
}
