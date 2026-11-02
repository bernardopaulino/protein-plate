import { getTranslations } from "next-intl/server";

interface Section {
  title: string;
  body: string;
}

/** Página legal (privacidade ou termos) a partir das mensagens. */
export async function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const t = await getTranslations("legal");
  const sections = t.raw(kind) as Section[];
  return (
    <article className="mx-auto max-w-2xl pb-8">
      <h1 className="text-2xl font-extrabold">
        {t(kind === "privacy" ? "privacyTitle" : "termsTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {t("updated", { date: t("date") })} · {t("draft")}
      </p>
      <div className="mt-6 flex flex-col gap-6">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-bold">{s.title}</h2>
            <p className="mt-1 text-muted">{s.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
