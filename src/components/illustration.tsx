import { cn } from "@/lib/cn";

/**
 * Ilustração (Fluent Emoji 3D, WebP 160 px). Decorativa: o texto ao lado diz o que é. Um `<img>`
 * simples e não o next/image: as imagens não passam pelo otimizador (não há binding de imagens no
 * Worker), e o next/image é um componente de cliente que acrescentava ~10 KB de JavaScript a cada
 * página com ilustrações. Sem "use client" nem animações.
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
    // eslint-disable-next-line @next/next/no-img-element -- ver acima
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn("shrink-0 select-none", className)}
      draggable={false}
    />
  );
}
