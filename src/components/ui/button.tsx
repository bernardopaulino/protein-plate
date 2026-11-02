import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  // Alvos de pelo menos 44 px; transições curtas (desligadas com prefers-reduced-motion)
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold whitespace-nowrap transition-[background-color,color,transform,box-shadow] duration-200 ease-out select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary shadow-sm hover:brightness-110",
        secondary: "border border-border bg-surface text-text hover:bg-primary-soft",
        soft: "bg-primary-soft text-text hover:brightness-95 dark:hover:brightness-125",
        ghost: "text-text hover:bg-primary-soft",
        link: "min-h-0 rounded-md px-0 text-primary underline underline-offset-4 hover:no-underline",
      },
      size: {
        md: "",
        lg: "min-h-13 px-7 text-lg",
        sm: "min-h-11 px-4 text-sm",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? "button" })}
      {...props}
    />
  );
}
