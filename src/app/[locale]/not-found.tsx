import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-3 text-muted">{t("body")}</p>
      <Button asChild className="mt-6">
        <Link href="/">{t("cta")}</Link>
      </Button>
    </div>
  );
}
