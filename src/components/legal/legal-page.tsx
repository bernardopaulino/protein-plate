import { getTranslations } from "next-intl/server";

/**
 * As secções de cada página, por ordem. Chaves e não uma lista nas mensagens: as mensagens são
 * compiladas no build e só podem ser textos.
 */
const SECTIONS = {
  privacy: ["who", "account", "plan", "health", "ai", "limits", "storage", "rights", "age"],
  terms: ["what", "general", "numbers", "ai", "fairUse", "account"],
} as const;

/** Página legal (privacidade ou termos) a partir das mensagens. */
export async function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const t = await getTranslations("legal");
  return (
    <article className="mx-auto max-w-2xl pb-8">
      <h1 className="text-2xl font-extrabold">
        {t(kind === "privacy" ? "privacyTitle" : "termsTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {t("updated", { date: t("date") })} · {t("draft")}
      </p>
      <div className="mt-6 flex flex-col gap-6">
        {SECTIONS[kind].map((key) => (
          <section key={key}>
            <h2 className="text-lg font-bold">{t(`${kind}.${key}.title`)}</h2>
            <p className="mt-1 text-muted">{t(`${kind}.${key}.body`)}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
