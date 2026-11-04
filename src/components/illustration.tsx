import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Ilustração (Fluent Emoji 3D, WebP 160 px). Decorativa: o texto ao lado diz o que é. Sem "use
 * client" nem animações, para as páginas públicas não carregarem a biblioteca de motion.
 */
export function Illustration({
  src,
  size = 48,
  className,
}: {
  src: string | undefined;
  size?: number;
  className?: string;
}) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("shrink-0 select-none", className)}
      draggable={false}
    />
  );
}
