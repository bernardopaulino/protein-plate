"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Interruptor (Radix, role="switch"). O nome vem de um <label> à volta, que também dá a área de
 * toque de 44 px. Desligado, a calha tem borda e o polegar é escuro; ligado, verde com o polegar
 * claro: contraste de pelo menos 3:1 nos dois estados (WCAG 1.4.11).
 */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-muted bg-track p-0.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 rounded-full bg-muted transition-transform duration-200 data-[state=checked]:translate-x-4 data-[state=checked]:bg-on-primary" />
    </SwitchPrimitive.Root>
  );
}
