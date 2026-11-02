import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { UiShowcase } from "@/features/dev/ui-showcase";
import type { Locale } from "@/i18n/routing";

/** Página interna com todos os componentes em claro e escuro (só em desenvolvimento). */
export default async function DevUiPage({ params }: { params: Promise<{ locale: Locale }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="grid gap-6 pb-8 lg:grid-cols-2">
      <section className="light rounded-card bg-bg p-4 text-text" aria-label="Claro">
        <UiShowcase />
      </section>
      <section className="dark rounded-card bg-bg p-4 text-text" aria-label="Escuro">
        <UiShowcase />
      </section>
    </div>
  );
}
