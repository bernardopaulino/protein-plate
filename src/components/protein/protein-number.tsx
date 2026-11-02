import { useLocale } from "next-intl";
import { formatProtein } from "@/domain/protein";
import { HTML_LANG, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-[2.75rem] leading-none",
  hero: "text-hero",
} as const;

/**
 * O número de proteína (assinatura visual): grande, tabular, com a unidade mais pequena. Arredonda
 * só na apresentação (inteiros a partir de 10 g).
 */
export function ProteinNumber({
  value,
  size = "md",
  prefix,
  className,
  unitClassName,
}: {
  value: number;
  size?: keyof typeof SIZES;
  /** Ex.: "+" nas sugestões */
  prefix?: string;
  className?: string;
  unitClassName?: string;
}) {
  const locale = useLocale() as Locale;
  return (
    <span className={cn("font-display font-bold tracking-tight tabular", SIZES[size], className)}>
      {prefix}
      {formatProtein(value, HTML_LANG[locale])}
      <span className={cn("ml-0.5 text-[0.55em] font-semibold text-muted", unitClassName)}>g</span>
    </span>
  );
}
