"use client";

import { useLocale, useTranslations } from "next-intl";
import { UI_IMAGES, foodImage } from "@/content/food-images.generated";
import { Illustration } from "@/components/illustration";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
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
  const locale = useLocale() as Locale;
  // O Better Auth volta para um caminho absoluto: com o idioma (o inglês vive em /en)
  const callbackURL = `${getPathname({ href: "/conta/bem-vindo", locale })}?next=${encodeURIComponent(next)}`;

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 pb-10 md:grid-cols-2 md:pt-6 lg:gap-16">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-[2.75rem] sm:leading-tight">{t("title")}</h1>
        <p className="mt-3 text-lg text-muted">{t("lead")}</p>
        <ul className="mt-6 flex flex-col gap-3">
          {BENEFITS.map(({ key, image }, i) => (
            <li
              key={key}
              style={{ animationDelay: `${120 + i * 80}ms` }}
              className="flex animate-in items-center gap-3 rounded-card bg-surface p-3 font-semibold shadow-[0_1px_0_var(--border)] duration-300 ease-out fade-in-0 fill-mode-both slide-in-from-left-3"
            >
              <Illustration src={image} size={40} />
              {t(`benefits.${key}`)}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative py-10">
        {FLOATING.map((f) => (
          <div
            key={f.id}
            aria-hidden
            className="pointer-events-none absolute hidden animate-in duration-500 ease-out fade-in-0 fill-mode-both zoom-in-60 sm:block"
            style={{ left: f.x, top: f.y, animationDelay: `${f.delay * 300}ms` }}
          >
            <div className="animate-float" style={{ animationDelay: `${f.delay}s` }}>
              <Illustration src={foodImage(f.id)} size={f.size} />
            </div>
          </div>
        ))}
        <div className="relative mx-auto max-w-sm animate-in rounded-card border border-border bg-surface p-6 shadow-[0_24px_60px_-30px_rgb(47_107_58/0.45)] delay-100 duration-500 ease-out fade-in-0 fill-mode-both slide-in-from-bottom-4 zoom-in-98">
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
    </div>
  );
}
